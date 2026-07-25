import React from "react";
import {
  Store,
  DollarSign,
  CreditCard,
  BarChart3,
  Gift,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

type TabType = "overall" | "foc" | "paid" | "credit" | "statistics" | "revenue";

interface ReportTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const ReportTabs: React.FC<ReportTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex gap-1 sm:gap-4 border-b border-gray-100 overflow-x-auto pb-px">
      <button
        onClick={() => onTabChange("overall")}
        className={`px-4 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
          activeTab === "overall"
            ? "border-b-2 border-[#2216a8] text-[#2216a8]"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Store className="w-3.5 h-3.5" />
        <span>{t("reports.overall")}</span>
      </button>
      <button
        onClick={() => onTabChange("paid")}
        className={`px-4 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
          activeTab === "paid"
            ? "border-b-2 border-[#2216a8] text-[#2216a8]"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <DollarSign className="w-3.5 h-3.5" />
        <span>{t("reports.paidOrders")}</span>
      </button>
      <button
        onClick={() => onTabChange("credit")}
        className={`px-4 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
          activeTab === "credit"
            ? "border-b-2 border-[#2216a8] text-[#2216a8]"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <CreditCard className="w-3.5 h-3.5" />
        <span>{t("reports.creditOrders")}</span>
      </button>
      <button
        onClick={() => onTabChange("statistics")}
        className={`px-4 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
          activeTab === "statistics"
            ? "border-b-2 border-[#2216a8] text-[#2216a8]"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        <span>{t("reports.saleStatistics")}</span>
      </button>
      <button
        onClick={() => onTabChange("foc")}
        className={`px-4 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
          activeTab === "foc"
            ? "border-b-2 border-[#2216a8] text-[#2216a8]"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Gift className="w-3.5 h-3.5" />
        <span>{t("reports.focProducts")}</span>
      </button>
    </div>
  );
};
