import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendAiChatMessage } from "../services/Reports/aiChat";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

const CHAT_STORAGE_KEY = "ai_chat_history";

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [adminData, setAdminData] = useState<any>(null);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState<string>("");

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

  // Sync messages to sessionStorage
  // useEffect(() => {
  //   sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  // }, [messages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!selectedStorefrontId) {
      toast.error("Please select a storefront first.");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const result = await sendAiChatMessage(
        userMessage.content,
        selectedStorefrontId,
      );

      if (result.success && result.data?.response) {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "ai",
            content: result.data.response,
          },
        ]);
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

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    toast.success("Chat cleared");
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  AI Assistant
                </h1>
                <p className="text-sm text-slate-500">
                  Your intelligent business companion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                onClick={clearChat}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-240px)]">
          {/* Messages */}
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-50 to-white">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 mt-20">
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
                    className={`max-w-[80%] rounded-2xl px-4 py-3 flex flex-col ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                        : "bg-white text-slate-800 border border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {msg.role === "ai" && (
                        <Bot className="w-4 h-4 text-blue-500 mt-0.5" />
                      )}
                      <span className="text-xs opacity-70">
                        {msg.role === "user" ? "You" : "AI Assistant"}
                      </span>
                    </div>
                    <span className="text-sm whitespace-pre-wrap leading-relaxed">
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
            <div className="p-4 bg-white border-t border-slate-200">
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
                  className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
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

        {/* Tips */}
        {/* <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
          <h4 className="font-semibold text-slate-700 mb-2">💡 Pro Tips:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-slate-600">
            <div>• Ask about sales trends</div>
            <div>• Get inventory insights</div>
            <div>• Request business analytics</div>
            <div>• Help with customer management</div>
            <div>• Product recommendations</div>
            <div>• Financial advice</div>
          </div>
        </div> */}
      </div>
    </div>
  );
};
