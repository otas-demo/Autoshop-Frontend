import React from "react";
import { Printer } from "lucide-react";
import {
  PRINT_PAPER_OPTIONS,
  PrintPaperSize,
} from "../../utils/printPaperSize";

import { useLanguage } from "../../context/LanguageContext";

interface PrintPaperSizeSelectorProps {
  value: PrintPaperSize;
  onChange: (size: PrintPaperSize) => void;
  disabled?: boolean;
}

export const PrintPaperSizeSelector: React.FC<PrintPaperSizeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 whitespace-nowrap">
        <Printer className="w-4 h-4" />
        {t("settings.paperSizeLabel")}
      </span>
    <div className="flex flex-wrap gap-2">
      {PRINT_PAPER_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.id)}
          title={option.description}
          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all cursor-pointer ${
            value === option.id
              ? "bg-[#2216a8] text-white border-[#2216a8] shadow-md shadow-indigo-600/10"
              : "bg-white text-[#2216a8] border-indigo-200 hover:bg-indigo-50/50"
          } disabled:opacity-50`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
  );
};
