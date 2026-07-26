import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import axios from "../services/axios";
import { sendAiChatMessage } from "../services/Reports/aiChat";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  LocalStorageChatStorage,
  generateConversationId,
  generateMessageId,
  generateConversationTitle,
  formatTimeAgo,
} from "../utils/chatStorage";
import type { ChatMessage, ChatConversation } from "../types";

export const AIChat: React.FC = () => {
  // ─── Storage ─────────────────────────────────────────────────
  const storage = useRef(new LocalStorageChatStorage()).current;

  // ─── State ───────────────────────────────────────────────────
  const [historyState, setHistoryState] = useState(() => storage.loadAll());
  const historyRef = useRef(historyState);
  historyRef.current = historyState;
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [adminData, setAdminData] = useState<any>(null);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState<string>("");

  // ─── Derived ─────────────────────────────────────────────────
  const activeConversation = historyState.conversations.find(
    (c) => c.id === historyState.activeConversationId,
  );
  const messages: ChatMessage[] = activeConversation?.messages ?? [];

  const selectedStorefrontName =
    storefronts.find((sf) => sf._id === selectedStorefrontId)
      ?.locationName ?? "";

  // ─── Persistence Helper ──────────────────────────────────────
  const saveHistory = (next: typeof historyState) => {
    storage.saveAll(next);
    setHistoryState(next);
  };

  // ─── Init: Admin data + storefronts ──────────────────────────
  useEffect(() => {
    const storedAdmin = localStorage.getItem("adminData");
    if (storedAdmin) {
      try {
        setAdminData(JSON.parse(storedAdmin));
      } catch (error) {
        console.error("Error parsing admin data:", error);
      }
    }

    fetchStorefrontProfiles().then((res) => {
      if (res.success && res.data) {
        const active = res.data.filter((sf) => sf.status === "active");
        setStorefronts(active);
        if (active.length > 0) {
          setSelectedStorefrontId(active[0]._id);
        }
      }
    });
  }, []);

  // ─── Auto-scroll to bottom ───────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ─── Auto-resize textarea ────────────────────────────────────
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // ─── New Conversation ────────────────────────────────────────
  const startNewConversation = () => {
    if (!selectedStorefrontId) {
      toast.error("Please select a storefront first.");
      return;
    }

    const newConv: ChatConversation = {
      id: generateConversationId(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      storefrontId: selectedStorefrontId,
      storefrontName: selectedStorefrontName,
    };

    saveHistory({
      conversations: [newConv, ...historyState.conversations],
      activeConversationId: newConv.id,
    });
    toast.success("New conversation started");
  };

  // ─── Append Message Helper (uses ref for latest state) ────────
  const appendMessage = (convId: string, msg: ChatMessage) => {
    const latest = historyRef.current;
    const updated = latest.conversations.map((c) => {
      if (c.id !== convId) return c;

      const next = {
        ...c,
        messages: [...c.messages, msg],
        updatedAt: msg.timestamp,
      };

      // Auto-title from first user message
      if (c.title === "New Conversation" && msg.role === "user") {
        next.title = generateConversationTitle(msg.content);
      }

      return next;
    });

    saveHistory({ ...latest, conversations: updated });
  };

  // ─── Send Message ────────────────────────────────────────────
  const handleSend = async (customText?: any) => {
    const textToSend = typeof customText === "string" ? customText : input;
    if (!textToSend || !textToSend.trim()) return;

    if (!selectedStorefrontId) {
      toast.error("Please select a storefront first.");
      return;
    }

    // Auto-create conversation if none active
    let convId = activeConversation?.id;

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    if (!convId) {
      const newConv: ChatConversation = {
        id: generateConversationId(),
        title: generateConversationTitle(userMsg.content),
        messages: [userMsg],
        createdAt: userMsg.timestamp,
        updatedAt: userMsg.timestamp,
        storefrontId: selectedStorefrontId,
        storefrontName: selectedStorefrontName,
      };
      convId = newConv.id;
      saveHistory({
        conversations: [newConv, ...historyState.conversations],
        activeConversationId: newConv.id,
      });
    } else {
      appendMessage(convId, userMsg);
    }

    if (typeof customText !== "string") {
      setInput("");
    }
    setIsLoading(true);

    try {
      // Build conversation history for AI context using ref (latest state)
      const latest = historyRef.current;
      const activeConv = latest.conversations.find((c) => c.id === convId);
      const historyForApi = activeConv?.messages ?? [];

      const result = await sendAiChatMessage(
        userMsg.content,
        selectedStorefrontId,
        historyForApi,
      );

      if (result.success && result.data?.response) {
        const aiMsg: ChatMessage = {
          id: generateMessageId(),
          role: "ai",
          content: result.data.response,
          timestamp: new Date().toISOString(),
        };
        appendMessage(convId, aiMsg);
      } else {
        toast.error("Failed to get a response from AI.");
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      toast.error("Something went wrong while contacting the AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatCurrency = (val: number) => {
    return `${Math.round(val).toLocaleString("en-US")} ကျပ်`;
  };

  const toMyanmarDigits = (num: number) => {
    const myanmarDigits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];
    return num.toString().split("").map(char => {
      const digit = parseInt(char);
      return isNaN(digit) ? char : myanmarDigits[digit];
    }).join("");
  };

  const handleSuggestionClick = async (suggestionText: string) => {
    if (!selectedStorefrontId) {
      toast.error("Please select a storefront first.");
      return;
    }

    let startDate = "";
    let endDate = "";
    let timeframeLabel = "";

    const todayStr = getLocalDateString();

    if (suggestionText.includes("ဒီနေ့")) {
      startDate = todayStr;
      endDate = todayStr;
      timeframeLabel = "ဒီနေ့အတွက်";
    } else if (suggestionText.includes("ဒီတပတ်") || suggestionText.includes("ဒီပတ်")) {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const year = monday.getFullYear();
      const month = String(monday.getMonth() + 1).padStart(2, '0');
      const dateVal = String(monday.getDate()).padStart(2, '0');
      startDate = `${year}-${month}-${dateVal}`;
      endDate = todayStr;
      timeframeLabel = "ဒီတစ်ပတ်အတွက်";
    } else if (suggestionText.includes("ဒီလ")) {
      startDate = `${todayStr.substring(0, 8)}01`;
      endDate = todayStr;
      timeframeLabel = "ဒီလအတွက်";
    } else {
      startDate = todayStr;
      endDate = todayStr;
      timeframeLabel = "ဒီနေ့အတွက်";
    }

    // Auto-create conversation if none active
    let convId = activeConversation?.id;

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: suggestionText,
      timestamp: new Date().toISOString(),
    };

    if (!convId) {
      const newConv: ChatConversation = {
        id: generateConversationId(),
        title: generateConversationTitle(userMsg.content),
        messages: [userMsg],
        createdAt: userMsg.timestamp,
        updatedAt: userMsg.timestamp,
        storefrontId: selectedStorefrontId,
        storefrontName: selectedStorefrontName,
      };
      convId = newConv.id;
      saveHistory({
        conversations: [newConv, ...historyState.conversations],
        activeConversationId: newConv.id,
      });
    } else {
      appendMessage(convId, userMsg);
    }

    setIsLoading(true);

    try {
      if (suggestionText.includes("အရောင်းရဆုံး")) {
        const result = await axios.get(
          `/ai-sale-report/products/top?storefrontId=${selectedStorefrontId}&startDate=${startDate}&endDate=${endDate}`
        );

        if (result.data?.success && result.data.data?.topProducts) {
          const topProducts = result.data.data.topProducts;
          let replyText = "";
          if (topProducts.length === 0) {
            replyText = `${timeframeLabel} အရောင်းရဆုံးပစ္စည်း မရှိသေးပါခင်ဗျာ။`;
          } else {
            const productLines = topProducts.map((p: any, idx: number) => {
              return `${idx + 1}. ${p.productName} (ရောင်းရအရေအတွက်: ${p.totalQuantity} ခု၊ စုစုပေါင်းရောင်းရငွေ: ${p.totalRevenueFormatted})`;
            }).join("\n");
            replyText = `${timeframeLabel} အရောင်းရဆုံး ပစ္စည်းများစာရင်းမှာ အောက်ပါအတိုင်း ဖြစ်ပါတယ်ခင်ဗျာ -
${productLines}`;
          }

          const aiMsg: ChatMessage = {
            id: generateMessageId(),
            role: "ai",
            content: replyText,
            timestamp: new Date().toISOString(),
          };
          appendMessage(convId, aiMsg);
        } else {
          toast.error("Failed to get top products data.");
          const errMsg: ChatMessage = {
            id: generateMessageId(),
            role: "ai",
            content: "တောင်းပန်ပါတယ်ခင်ဗျာ။ အရောင်းရဆုံးပစ္စည်းစာရင်းကို ရယူရန် စနစ်အတွင်း အဆင်မပြေမှု ဖြစ်ပွားနေပါသည်။ ခေတ္တစောင့်ပြီးမှ ထပ်မံကြိုးစားကြည့်ပေးပါခင်ဗျာ။",
            timestamp: new Date().toISOString(),
          };
          appendMessage(convId, errMsg);
        }
      } else if (suggestionText.includes("အသုံးစရိတ်")) {
        const result = await axios.get(
          `/expense?locationId=${selectedStorefrontId}&startDate=${startDate}&endDate=${endDate}`
        );

        if (result.data?.success && result.data.data) {
          const expenses = result.data.data;
          let replyText = "";
          if (expenses.length === 0) {
            replyText = `${timeframeLabel} အသုံးစရိတ် မရှိသေးပါခင်ဗျာ။`;
          } else {
            const expenseLines = expenses.map((e: any) => {
              const notesStr = e.notes ? ` (${e.notes})` : "";
              return `• ${e.category} - ${formatCurrency(e.amount)}${notesStr}`;
            }).join("\n");
            const totalSum = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
            replyText = `${timeframeLabel} အသုံးစရိတ်များစာရင်းမှာ အောက်ပါအတိုင်း ဖြစ်ပါတယ်ခင်ဗျာ -
${expenseLines}

• စုစုပေါင်း အသုံးစရိတ်: ${formatCurrency(totalSum)}`;
          }

          const aiMsg: ChatMessage = {
            id: generateMessageId(),
            role: "ai",
            content: replyText,
            timestamp: new Date().toISOString(),
          };
          appendMessage(convId, aiMsg);
        } else {
          toast.error("Failed to get expenses.");
          const errMsg: ChatMessage = {
            id: generateMessageId(),
            role: "ai",
            content: "တောင်းပန်ပါတယ်ခင်ဗျာ။ အသုံးစရိတ်စာရင်းကို ရယူရန် စနစ်အတွင်း အဆင်မပြေမှု ဖြစ်ပွားနေပါသည်။ ခေတ္တစောင့်ပြီးမှ ထပ်မံကြိုးစားကြည့်ပေးပါခင်ဗျာ။",
            timestamp: new Date().toISOString(),
          };
          appendMessage(convId, errMsg);
        }
      } else {
        const summaryRes = await axios.get(
          `/ai-sale-report/summary?storefrontId=${selectedStorefrontId}&startDate=${startDate}&endDate=${endDate}`
        );

        if (summaryRes.data?.success) {
          const summaryData = summaryRes.data.data;

          const finalAmountFormatted = summaryData.report.finalAmountFormatted;
          const discountFormatted = summaryData.report.discountFormatted;
          const creditAmountFormatted = summaryData.report.creditAmountFormatted;
          const orderCountFormatted = summaryData.report.orderCount.toLocaleString("en-US");

          const paymentMethods = summaryData.paymentMethods || [];

          const getPaymentMethodLabel = (method: string) => {
            switch (method.toLowerCase()) {
              case "cash": return "ငွေသား (Cash)";
              case "kpay":
              case "kbzpay": return "KBZ Pay";
              case "wave":
              case "wavepay": return "Wave Pay";
              case "aya":
              case "ayapay": return "AYA Pay";
              case "uab":
              case "uabpay": return "UAB Pay";
              case "bank":
              case "banktransfer": return "ဘဏ်လွှဲ (Bank Transfer)";
              default: return method.toUpperCase();
            }
          };

          const paymentMethodsLines = paymentMethods.map((pm: any) => {
            const label = getPaymentMethodLabel(pm.paymentMethod);
            const formattedAmount = pm.totalPaidAmountFormatted || formatCurrency(pm.totalPaidAmount);
            return `• ${label} ဖြင့် ပေးချေမှု: ${formattedAmount}`;
          }).join("\n");

          const replyText = `${timeframeLabel} အရောင်းအစီရင်ခံစာ အနှစ်ချုပ်မှာ အောက်ပါအတိုင်း ဖြစ်ပါတယ်ခင်ဗျာ -
• စုစုပေါင်း ရောင်းအားပမာဏ: ${finalAmountFormatted}
${paymentMethodsLines ? paymentMethodsLines + "\n" : ""}• လျှော့စျေး (Discount): ${discountFormatted}
• အကြွေးရရန်ရှိငွေ: ${creditAmountFormatted}
• စုစုပေါင်း အော်ဒါ (Order) အရေအတွက်: ${orderCountFormatted} ခု
• စုစုပေါင်း ရောင်းရသည့် ပစ္စည်းအရေအတွက်: ${orderCountFormatted} ခု

ကျေးဇူးတင်ပါတယ်ခင်ဗျာ။`;

          const aiMsg: ChatMessage = {
            id: generateMessageId(),
            role: "ai",
            content: replyText,
            timestamp: new Date().toISOString(),
          };
          appendMessage(convId, aiMsg);
        } else {
          toast.error("Failed to get report data.");
          const errMsg: ChatMessage = {
            id: generateMessageId(),
            role: "ai",
            content: "တောင်းပန်ပါတယ်ခင်ဗျာ။ အရောင်းအစီရင်ခံစာအနှစ်ချုပ်ကို ရယူရန် စနစ်အတွင်း အဆင်မပြေမှု ဖြစ်ပွားနေပါသည်။ ခေတ္တစောင့်ပြီးမှ ထပ်မံကြိုးစားကြည့်ပေးပါခင်ဗျာ။",
            timestamp: new Date().toISOString(),
          };
          appendMessage(convId, errMsg);
        }
      }
    } catch (error) {
      console.error("Direct Report Fetch Error:", error);
      toast.error("Something went wrong while fetching the report data.");
      const errMsg: ChatMessage = {
        id: generateMessageId(),
        role: "ai",
        content: "တောင်းပန်ပါတယ်ခင်ဗျာ။ ဆာဗာ သို့မဟုတ် ကွန်ရက်အမှားအယွင်းတစ်ခု ဖြစ်ပွားနေသောကြောင့် အချက်အလက်များ မရယူနိုင်သေးပါခင်ဗျာ။",
        timestamp: new Date().toISOString(),
      };
      appendMessage(convId, errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCurrentConversation = () => {
    if (!activeConversation) {
      toast.error("No conversation to clear.");
      return;
    }

    const updated = historyState.conversations.map((c) => {
      if (c.id !== activeConversation.id) return c;
      return { ...c, messages: [], updatedAt: new Date().toISOString() };
    });

    saveHistory({ ...historyState, conversations: updated });
    toast.success("Chat cleared");
  };

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="w-full lg:h-[calc(100vh-2rem)]">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6 lg:h-full lg:overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              AI Assistant
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Storefront Selector dropdown styled as a pill */}
            <div className="relative flex items-center min-w-[140px]">
              <select
                value={selectedStorefrontId}
                onChange={(e) => setSelectedStorefrontId(e.target.value)}
                className="pl-4 pr-8 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all outline-none cursor-pointer appearance-none w-full"
              >
                <option value="">Select Storefront</option>
                {storefronts.map((sf) => (
                  <option key={sf._id} value={sf._id}>
                    {sf.locationName}
                  </option>
                ))}
              </select>
              {/* Custom chevron indicator */}
              <div className="pointer-events-none absolute right-3 flex items-center text-[#2216a8]">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>

            <button
              onClick={startNewConversation}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer"
              title="New conversation"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>New</span>
            </button>

            <button
              onClick={clearCurrentConversation}
              disabled={!activeConversation || messages.length === 0}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto pb-4 space-y-4 no-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-12 sm:mt-20">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-[#2216a8] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/20">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">
                  မင်္ဂလာပါ ကျွန်တော်က Bossရဲ့ AI လက်ထောက် မန်နေဂျာပါ။
                </h3>
                <p className="text-sm font-semibold text-slate-400 max-w-md mx-auto mb-6">
                  Boss အနေနဲ့ လုပ်ငန်းနဲ့ပတ်သက်ပြီး ဘာအချက်အလက်လေးတွေ
                  သိလိုပါသလဲ ခင်ဗျာ
                </p>

                {/* Suggestion Chips */}
                <div className="flex flex-col items-center gap-3">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">အကြံပြုမေးခွန်းများ (Suggestions)</span>
                  <div className="flex flex-wrap justify-center gap-2.5 max-w-xl">
                    {[
                      "ဒီနေ့ ဘယ်လောက်ဖိုး ရောင်းရလဲ",
                      "ဒီတပတ်အတွက်အရောင်းအစီအရင်ခံစာပြပေးပါ",
                      "ဒီလအတွက် အရောင်းအစီရင်ခံစာ ပြပေးပါ",
                      "ဒီနေ့ အရောင်းရဆုံး ပစ္စည်းများ",
                      "ဒီတပတ် အရောင်းရဆုံး ပစ္စည်းများ",
                      "ဒီလ အရောင်းရဆုံး ပစ္စည်းများ",
                      "ဒီနေ့အသုံးစရိတ်တွေပြပေးပါ"
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 flex flex-col ${msg.role === "user"
                    ? "bg-[#2216a8] text-white shadow-md shadow-indigo-600/10"
                    : "bg-slate-50 text-slate-800 border border-slate-100 shadow-sm"
                    }`}
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    {msg.role === "ai" && (
                      <Bot className="w-4 h-4 text-[#2216a8] mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-xs font-semibold opacity-70">
                      {msg.role === "user" ? "You" : "AI Assistant"}
                    </span>
                  </div>
                  <span className="text-sm whitespace-pre-wrap leading-relaxed break-words font-medium">
                    {msg.content}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-slate-50 text-slate-800 border border-slate-100 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#2216a8]" />
                  <span className="text-sm font-semibold text-slate-400">
                    AI is thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="pt-4 border-t border-slate-100 bg-white">
            <div className="flex items-end gap-3 bg-slate-50/70 rounded-2xl p-2 border border-indigo-100 focus-within:border-[#2216a8] focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything about your business..."
                className="flex-1 outline-none bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 font-medium"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 sm:p-3.5 bg-[#2216a8] text-white rounded-xl hover:bg-[#2216a8]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center font-medium">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
