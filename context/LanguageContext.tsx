import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "my";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation files
import { translations } from "../translations";

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to Myanmar
    const saved = localStorage.getItem("language") as Language;
    return saved || "my";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    // Set HTML lang attribute
    document.documentElement.lang = language;
    // Set classes for styling
    if (language === "my") {
      document.documentElement.classList.add("lang-my");
      document.documentElement.classList.remove("lang-en");
    } else {
      document.documentElement.classList.add("lang-en");
      document.documentElement.classList.remove("lang-my");
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const keys = key.split(".");
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        // Fallback to English if key not found
        let fallbackValue: any = translations["en"];
        for (const fk of keys) {
          fallbackValue = fallbackValue?.[fk];
        }
        if (fallbackValue !== undefined) {
          return fallbackValue;
        }
        return fallback !== undefined ? fallback : key;
      }
    }
    
    return value !== undefined ? value : (fallback !== undefined ? fallback : key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

