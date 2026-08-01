import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, MessageSquare, ArrowLeft, ChevronDown, XCircle, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
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
  const navigate = useNavigate();
  const { language } = useLanguage();
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
    } else if (suggestionText.includes("မနေ့က")) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yYear = yesterday.getFullYear();
      const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
      const yDate = String(yesterday.getDate()).padStart(2, '0');
      startDate = `${yYear}-${yMonth}-${yDate}`;
      endDate = `${yYear}-${yMonth}-${yDate}`;
      timeframeLabel = "မနေ့ကအတွက်";
    } else if (suggestionText.includes("ဒီတပတ်") || suggestionText.includes("ဒီပတ်") || suggestionText.includes("ဒီအပတ်")) {
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
      } else if (suggestionText.includes("အသုံးစရိတ်") || suggestionText.includes("အဆုံးစရိတ်")) {
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
  const renderMessageContent = (content: string) => {
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    if (mdLinkRegex.test(content)) {
      const parts = [];
      let lastIndex = 0;
      mdLinkRegex.lastIndex = 0;
      let match;
      while ((match = mdLinkRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(
          <a
            key={match.index}
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-bold cursor-pointer"
          >
            {match[1]}
          </a>
        );
        lastIndex = mdLinkRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }
      return parts;
    }

    const parts = content.split(urlRegex);
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-bold cursor-pointer"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="w-full lg:h-[calc(100vh-2rem)]">
      <div className="bg-white border border-gray-200/50 rounded-3xl p-6 shadow-md flex flex-col gap-6 lg:h-full lg:overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-200/50 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer text-slate-700 hover:text-slate-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800">
                {language === "my" ? "AI အရောင်းမန်နေဂျာ" : "AI Sales Manager"}
              </h1>
              <p className="text-xs text-slate-400 font-bold mt-1">
                {language === "my" ? "ဆိုင်နဲ့ပတ်သက်ပြီး သိချင်တာကို AI အရောင်းမန်နေဂျာကို မေးမယ်" : "Ask the AI Sales Manager anything about the shop"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={clearCurrentConversation}
              disabled={!activeConversation || messages.length === 0}
              className="px-5 py-2.5 text-sm font-bold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4.5 h-4.5" />
              <span>{language === "my" ? "အကုန်ဖျက်မယ်" : "Clear"}</span>
            </button>

            <button
              onClick={startNewConversation}
              className="px-5 py-2.5 text-sm font-bold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              <span>{language === "my" ? "အခြားအကြောင်း အသစ်တစ်ခု မေးမယ်" : "New Conversation"}</span>
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto pb-4 px-4 space-y-6 no-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] my-auto py-8">
                {/* Logo / Robot Section */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-xl font-black tracking-tighter text-[#2216a8] leading-none">AUTO</span>
                    <span className="text-xl font-black tracking-widest text-[#2216a8] leading-none">SHOP</span>
                  </div>
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm">
                    <Bot className="w-7 h-7 text-[#2216a8]" />
                  </div>
                  <div className="h-8 w-px bg-gray-300" />
                  <div className="text-left">
                    <h2 className="text-xl font-black text-slate-800">
                      {language === "my" ? `မင်္ဂလာပါ ${adminData?.name ?? "မဇင်ဇင်ဝေ"}` : `Hello ${adminData?.name ?? "Manager"}`}
                    </h2>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                      {language === "my" ? "ဆိုင်နဲ့ပတ်သက်ပြီး ကျွန်တော် ဘယ်လိုကူညီရမလဲဗျ ?" : "How can I help you regarding the shop?"}
                    </p>
                  </div>
                </div>

                {/* Suggestions Card */}
                <div className="border border-gray-300 rounded-3xl p-6 bg-white w-full max-w-2xl mx-auto shadow-sm">
                  <p className="text-sm font-bold text-slate-800 mb-4 text-left">
                    {language === "my" ? "AI အရောင်းမန်နေဂျာကို မေးလေ့ရှိတဲ့ မေးခွန်းများ:" : "Frequently asked questions to AI Sales Manager:"}
                  </p>
                  <div className="flex flex-wrap justify-start gap-2.5">
                    {[
                      { my: "ဒီနေ့ ဘယ်လောက်ဖိုး ရောင်းရလဲ?", en: "How much sold today?" },
                      { my: "ဒီအပတ်အတွက် အရောင်းစာရင်းကြည့်မယ်", en: "View sales for this week" },
                      { my: "ဒီလအတွက် အရောင်းစာရင်းကြည့်မယ်", en: "View sales for this month" },
                      { my: "ဒီနေ့ အရောင်းရဆုံးပစ္စည်းများ", en: "Best selling products today" },
                      { my: "ဒီအပတ် အရောင်းရဆုံးပစ္စည်းများ", en: "Best selling products this week" },
                      { my: "ဒီလ အရောင်းရဆုံးပစ္စည်းများ", en: "Best selling products this month" },
                      { my: "ဒီနေ့ အသုံးစရိတ်ပြပေးပါ", en: "Show expenses today" },
                      { my: "မနေ့က အသုံးစရိတ်ပြပေးပါ", en: "Show expenses yesterday" },
                      { my: "ဒီနေ့ အဆုံးစရိတ်ပြပေးပါ", en: "Show final expenses today" }
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion.my)}
                        disabled={isLoading}
                        className="px-4 py-2 text-xs font-bold rounded-full border border-indigo-600/70 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {language === "my" ? suggestion.my : suggestion.en}
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
                {msg.role === "user" ? (
                  <div className="max-w-[75%] bg-white border border-gray-200/80 rounded-2xl rounded-tr-none px-5 py-3.5 text-slate-800 font-medium text-sm shadow-sm">
                    <span className="whitespace-pre-wrap leading-relaxed break-words">
                      {msg.content}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 w-full max-w-[85%]">
                    <div className="flex flex-col items-end flex-shrink-0 mt-1 select-none">
                      <span className="text-[10px] font-black tracking-tighter text-[#2216a8] leading-none">AUTO</span>
                      <span className="text-[10px] font-black tracking-widest text-[#2216a8] leading-none">SHOP</span>
                    </div>
                    <div className="flex-1 bg-transparent text-slate-800 font-medium text-sm whitespace-pre-wrap leading-relaxed break-words">
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3 w-full max-w-[85%]">
                  <div className="flex flex-col items-end flex-shrink-0 mt-1 select-none">
                    <span className="text-[10px] font-black tracking-tighter text-[#2216a8] leading-none">AUTO</span>
                    <span className="text-[10px] font-black tracking-widest text-[#2216a8] leading-none">SHOP</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-medium text-sm italic">
                    <Loader2 className="w-4 h-4 animate-spin text-[#2216a8]" />
                    <span>
                      {language === "my"
                        ? "မန်နေဂျာကြီး စာရင်းတွေ လှော်လှန်ရှာဖွေနေဆဲပါဗျ ခဏလေးစောင့်ပေးပါဗျ................"
                        : "Manager is searching the files, please wait a moment..."}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="pt-4 border-t border-gray-200/50 bg-white">
            <div className="max-w-3xl mx-auto w-full border border-gray-300 rounded-2xl p-2 bg-white flex items-center justify-between gap-3 shadow-md focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-[#2216a8] transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={language === "my" ? "မေးချင်တာတွေ မေးမယ်" : "Ask me anything about your business..."}
                className="flex-1 outline-none bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 font-medium"
                rows={1}
                disabled={isLoading}
              />
              <div className="flex items-center gap-2">
                {/* Storefront Selector dropdown styled as a pill */}
                <div className="relative flex items-center min-w-[130px]">
                  <select
                    value={selectedStorefrontId}
                    onChange={(e) => setSelectedStorefrontId(e.target.value)}
                    className="pl-3 pr-8 py-2.5 text-xs font-bold rounded-full border border-gray-300 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all outline-none cursor-pointer appearance-none w-full"
                  >
                    <option value="">{language === "my" ? "ဆိုင်ရွေးမယ်" : "Select Shop"}</option>
                    {storefronts.map((sf) => (
                      <option key={sf._id} value={sf._id}>
                        {sf.locationName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-[#2216a8] text-white rounded-full hover:bg-[#2216a8]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/15 cursor-pointer flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center font-bold">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
