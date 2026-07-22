import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
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
  const handleSend = async () => {
    if (!input.trim()) return;

    if (!selectedStorefrontId) {
      toast.error("Please select a storefront first.");
      return;
    }

    // Auto-create conversation if none active
    let convId = activeConversation?.id;

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: input,
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

    const currentInput = input;
    setInput("");
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
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
                  AI Assistant
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 truncate">
                  {activeConversation
                    ? `${activeConversation.title} — ${formatTimeAgo(activeConversation.updatedAt)}`
                    : "Your intelligent business companion"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                className="border border-slate-200 rounded-lg px-2 sm:px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none max-w-[140px] sm:max-w-[200px]"
                value={selectedStorefrontId}
                onChange={(e) => setSelectedStorefrontId(e.target.value)}
              >
                <option value="">Select Storefront</option>
                {storefronts.map((sf) => (
                  <option key={sf._id} value={sf._id}>
                    {sf.locationName}
                  </option>
                ))}
              </select>
              <button
                onClick={startNewConversation}
                className="p-2 sm:px-3 sm:py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md text-sm font-medium flex items-center gap-1.5"
                title="New conversation"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </button>
              <button
                onClick={clearCurrentConversation}
                disabled={!activeConversation || messages.length === 0}
                className="px-2 sm:px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white">
            {messages.length === 0 && (
              <div className="text-center text-slate-500 mt-12 sm:mt-20">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  မင်္ဂလာပါ ကျွန်တော်က Bossရဲ့ AI လက်ထောက် မန်နေဂျာပါ။
                </h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Boss အနေနဲ့ လုပ်ငန်းနဲ့ပတ်သက်ပြီး ဘာအချက်အလက်လေးတွေ
                  သိလိုပါသလဲ ခင်ဗျာ
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 flex flex-col ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                      : "bg-white text-slate-800 border border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    {msg.role === "ai" && (
                      <Bot className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-xs opacity-70">
                      {msg.role === "user" ? "You" : "AI Assistant"}
                    </span>
                  </div>
                  <span className="text-sm whitespace-pre-wrap leading-relaxed break-words">
                    {msg.content}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white text-slate-800 border border-slate-200 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span className="text-sm text-slate-500">
                    AI is thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
            <div className="flex items-end gap-3 bg-slate-50 rounded-xl p-2 border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask me anything about your business..."
                className="flex-1 outline-none bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
