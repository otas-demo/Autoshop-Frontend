import React from "react";
import { FileDown, RefreshCw, Home } from "lucide-react";
import { LocationProfile } from "../../services/Location/fetchLocationProfiles";
import { DateRangePicker } from "./DateRangePicker";
import { useLanguage } from "../../context/LanguageContext";

interface ReportsHeaderProps {
  storefronts: LocationProfile[];
  selectedStorefront: string;
  onStorefrontChange: (storefrontId: string) => void;
  onRefresh: () => void;
  loading: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onDateRangeChange: (startDate: Date | null, endDate: Date | null) => void;
  fixedStartDate?: boolean;
  singleDate?: boolean;
  onGeneratePDF: () => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  storefronts,
  selectedStorefront,
  onStorefrontChange,
  onRefresh,
  loading,
  startDate,
  endDate,
  onDateRangeChange,
  fixedStartDate,
  singleDate,
  onGeneratePDF,
}) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          {t("reports.title")}
        </h1>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          {t("reports.subtitle")}
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {/* Storefront Selector dropdown styled as a pill */}
        <div className="relative flex items-center">
          <Home className="absolute left-4 w-4 h-4 text-[#2216a8]" />
          <select
            value={selectedStorefront}
            onChange={(e) => onStorefrontChange(e.target.value)}
            className="pl-10 pr-8 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all outline-none cursor-pointer appearance-none"
          >
            <option value="all">{t("reports.allStorefronts")}</option>
            {storefronts.map((sf) => (
              <option key={sf._id} value={sf._id}>
                {sf.locationName || sf.storefrontName}
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

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>{t("storefront.refresh")}</span>
        </button>

        {/* Date Picker Trigger */}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={onDateRangeChange}
          fixedStartDate={fixedStartDate}
          singleDate={singleDate}
          className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
        />

        {/* PDF Export */}
        <button
          onClick={onGeneratePDF}
          className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>{t("reports.pdfExport")}</span>
        </button>
      </div>
    </div>
  );
};
