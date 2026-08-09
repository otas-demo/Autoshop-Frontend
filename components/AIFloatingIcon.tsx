import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export const AIFloatingIcon: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);

  // Hide the floating icon when already on the AI Chat page
  if (location.pathname === "/ai-chat") {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    // Only allow sliding downwards, max 100px
    const newY = Math.max(0, Math.min(100, deltaY));
    setTranslateY(newY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    // If dragged past 60px, trigger action
    if (translateY > 60) {
      navigate("/ai-chat");
    }
    // Snap back to top
    setTranslateY(0);
  };

  const handleClick = () => {
    // If not dragged much, a click also navigates to the AI chat page
    if (translateY < 10) {
      navigate("/ai-chat");
    }
  };

  return (
    <div
      className="hidden md:block fixed top-0 left-1/2 z-50 select-none print:hidden"
      style={{
        transform: `translate(-50%, ${translateY}px)`,
        transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      }}
    >
      {/* Background track indicator appearing when sliding */}
      {translateY > 5 && (
        <div
          className="absolute left-1/2 -top-10 -translate-x-1/2 bg-indigo-950/80 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap pointer-events-none transition-opacity duration-150"
          style={{ opacity: Math.min(1, translateY / 50) }}
        >
          {language === "my" ? "AI Chat ဖွင့်ရန် အောက်သို့ ဆွဲချပါ" : "Pull down to open AI Chat"}
        </div>
      )}

      {/* Floating Button Badge */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        className={`bg-[#2216a8] text-white px-6 py-2 rounded-b-[1.75rem] shadow-lg flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-shadow hover:shadow-indigo-500/20 hover:shadow-xl border-x border-b border-indigo-500/30 ${isDragging ? "cursor-grabbing scale-102" : "hover:brightness-110"
          }`}
        style={{ minWidth: "160px" }}
      >
        {/* <div className="flex items-center gap-2">
         
          <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
            <Bot className="w-4 h-4 text-white" />
          </div>
        
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black tracking-widest text-indigo-200">AUTO</span>
            <span className="text-xs font-black tracking-wide text-white">SHOP</span>
          </div>
        </div> */}

        {/* Subtitle */}
        <span className="text-[10px] font-medium tracking-wide mt-1 text-white/90">
          {language === "my" ? "AI အရောင်းမန်နေဂျာ" : "AI Sales Manager"}
        </span>

        {/* Pull Indicator Pill */}
        <div className="w-8 h-1 bg-white/20 rounded-full mt-1.5 flex items-center justify-center overflow-hidden">
          <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};
