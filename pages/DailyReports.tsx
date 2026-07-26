import React, { useState, useEffect } from "react";
import {
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  DollarSign,
  CreditCard,
  Banknote,
  ShoppingBag,
  Percent,
  Package,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchDailyReports,
  fetchLatestDailyReport,
  DailyReport,
} from "../services/Reports/fetchDailyReports";
import { useLanguage } from "../context/LanguageContext";

// ─── Formatting Helpers ───────────────────────────────

function formatMyanmarCurrency(amount: number, symbol: string): string {
  return `${Math.round(amount).toLocaleString("en-US")} ${symbol}`;
}

function formatDate(dateStr: string, isMyanmar: boolean): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(isMyanmar ? "my-MM" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Summary Card Component ───────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 flex-1">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-400 font-semibold truncate">{title}</p>
      <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────

export const DailyReports: React.FC = () => {
  const { t, language } = useLanguage();
  const isMyanmar = language === "my";
  const currencySymbol = t("dailyReports.currencySymbol");

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [latest, setLatest] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const limit = 15;

  const loadReports = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchDailyReports(page, limit);
      if (res.success) {
        setReports(res.data);
        if (res.pagination) {
          setCurrentPage(res.pagination.currentPage);
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.totalItems);
        }
      } else {
        toast.error(res.message || "Failed to load reports");
      }
    } catch (err) {
      console.error("Error loading reports:", err);
      toast.error("Failed to load daily reports");
    } finally {
      setLoading(false);
    }
  };

  const loadLatest = async () => {
    setLoadingLatest(true);
    try {
      const res = await fetchLatestDailyReport();
      if (res.success) {
        setLatest(res.data);
      }
    } catch (err) {
      console.error("Error loading latest report:", err);
    } finally {
      setLoadingLatest(false);
    }
  };

  useEffect(() => {
    loadReports(1);
    loadLatest();
  }, []);

  const refresh = () => {
    loadReports(currentPage);
    loadLatest();
  };

  // Determine which report to show detail for
  const detailReport = selectedReport || latest;

  return (
    <div className="w-full lg:h-[calc(100vh-2rem)]">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6 lg:h-full lg:overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("dailyReports.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("dailyReports.subtitle")}
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading || loadingLatest}
            className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{t("common.refresh")}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar">
          {/* Summary Cards */}
          {loadingLatest ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="ml-2 text-slate-500">{t("dailyReports.loadingLatest")}</span>
            </div>
          ) : latest ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <SummaryCard
                  title={t("dailyReports.totalSales")}
                  value={formatMyanmarCurrency(latest.finalAmount, currencySymbol)}
                  icon={<DollarSign className="w-5 h-5 text-white" />}
                  color="bg-emerald-500"
                />
                <SummaryCard
                  title={t("dailyReports.totalCardMobile")}
                  value={formatMyanmarCurrency(latest.totalCardAmount, currencySymbol)}
                  icon={<CreditCard className="w-5 h-5 text-white" />}
                  color="bg-blue-500"
                />
                <SummaryCard
                  title={t("dailyReports.totalCash")}
                  value={formatMyanmarCurrency(latest.totalCashAmount, currencySymbol)}
                  icon={<Banknote className="w-5 h-5 text-white" />}
                  color="bg-amber-500"
                />
                <SummaryCard
                  title={t("dailyReports.totalOrders")}
                  value={`${latest.orderCount} ခု`}
                  icon={<ShoppingBag className="w-5 h-5 text-white" />}
                  color="bg-purple-500"
                />
                <SummaryCard
                  title={t("dailyReports.discount")}
                  value={formatMyanmarCurrency(latest.discount, currencySymbol)}
                  icon={<Percent className="w-5 h-5 text-white" />}
                  color="bg-red-500"
                />
                <SummaryCard
                  title={t("dailyReports.itemsSold")}
                  value={`${latest.totalQuantity} ခု`}
                  icon={<Package className="w-5 h-5 text-white" />}
                  color="bg-indigo-500"
                />
              </div>

              {/* Latest Report Full Text */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-emerald-500" />
                    {t("dailyReports.latestReport")} — {formatDate(latest.generatedAt, isMyanmar)}
                  </h2>
                  {latest._id && (
                    <span className="text-xs font-semibold text-slate-400">
                      {latest.date}
                    </span>
                  )}
                </div>
                <div className="bg-gradient-to-br from-emerald-50/30 to-teal-50/30 rounded-2xl p-4 sm:p-6 border border-emerald-100/50">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {latest.reportText}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold">{t("dailyReports.noTodayReport")}</p>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                {t("dailyReports.autoGenerateNote")}
              </p>
            </div>
          )}

          {/* Selected Report Detail Modal */}
          {selectedReport && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
              <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      Report — {formatDate(selectedReport.generatedAt, isMyanmar)}
                    </h3>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors font-bold text-slate-500"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50/30 to-teal-50/30 rounded-2xl p-4 border border-emerald-100/50">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {selectedReport.reportText}
                    </pre>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <span className="text-slate-400 font-semibold">{t("dailyReports.totalSales")}:</span>
                      <p className="font-bold text-slate-800 mt-1">{formatMyanmarCurrency(selectedReport.finalAmount, currencySymbol)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <span className="text-slate-400 font-semibold">{t("dailyReports.totalOrders")}:</span>
                      <p className="font-bold text-slate-800 mt-1">{selectedReport.orderCount} ခု</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            {t("dailyReports.history")}
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-[#2216a8] mx-auto mb-2" />
            {t("dailyReports.loadingReports")}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>{t("dailyReports.noReports")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">{t("dailyReports.date")}</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">{t("dailyReports.totalSales")}</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">{t("dailyReports.cardKPay")}</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">{t("dailyReports.cash")}</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">{t("dailyReports.orders")}</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {formatDate(report.generatedAt, isMyanmar)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {formatMyanmarCurrency(report.finalAmount, currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {formatMyanmarCurrency(report.totalCardAmount, currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600">
                        {formatMyanmarCurrency(report.totalCashAmount, currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {report.orderCount} ခု
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-[#2216a8] hover:text-[#2216a8]/80 font-semibold text-xs px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          {t("dailyReports.view")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between bg-slate-50">
                <p className="text-sm text-slate-600 font-semibold">
                  {t("dailyReports.totalItemsLabel")
                    .replace("{total}", String(totalItems))
                    .replace("{current}", String(currentPage))
                    .replace("{totalPage}", String(totalPages))}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => loadReports(currentPage - 1)}
                    disabled={currentPage <= 1 || loading}
                    className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => loadReports(pageNum)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                          currentPage === pageNum
                            ? "bg-[#2216a8] text-white border-[#2216a8]"
                            : "bg-white border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => loadReports(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
</div>
  );
};
