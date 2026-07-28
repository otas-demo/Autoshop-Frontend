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
  Plus,
  AlertCircle,
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
  <div className="bg-white rounded-2xl px-5 h-32 border border-gray-200 flex items-center gap-4 shadow-sm w-full">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${color}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[14px] md:text-[16px] font-bold text-slate-500 truncate">{title}</p>
      <p className="text-lg md:text-2xl font-bold text-slate-800 mt-1 truncate">{value}</p>
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
          {/* <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => toast.info("Redirecting to Account Management...")}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />{" "}
              <span>{t("accountManagement.createAccount")}</span>
            </button>
            <button
              onClick={refresh}
              disabled={loading || loadingLatest}
              className="px-5 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-[#f0efff] hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{t("dailyReports.refresh")}</span>
            </button>
          </div> */}
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar">
          {/* Main Grid for Cards and Latest Report Panel */}
          {loadingLatest ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#2216a8]" />
              <span className="ml-2 text-slate-500">{t("dailyReports.loadingLatest")}</span>
            </div>
          ) : latest ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left side: 6 Stats Cards */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SummaryCard
                  title={t("dailyReports.totalSales")}
                  value={formatMyanmarCurrency(latest.finalAmount, currencySymbol)}
                  icon={<DollarSign className="w-5 h-5" />}
                  color="bg-indigo-50 border-indigo-100 text-indigo-600"
                />
                <SummaryCard
                  title={t("dailyReports.totalCardMobile")}
                  value={formatMyanmarCurrency(latest.totalCardAmount, currencySymbol)}
                  icon={<CreditCard className="w-5 h-5" />}
                  color="bg-blue-50 border-blue-100 text-blue-600"
                />
                <SummaryCard
                  title={t("dailyReports.totalOrders")}
                  value={`${latest.orderCount}`}
                  icon={<ShoppingBag className="w-5 h-5" />}
                  color="bg-indigo-50 border-indigo-100 text-indigo-600"
                />
                <SummaryCard
                  title={t("dailyReports.totalCash")}
                  value={formatMyanmarCurrency(latest.totalCashAmount, currencySymbol)}
                  icon={<Banknote className="w-5 h-5" />}
                  color="bg-blue-50 border-blue-100 text-blue-600"
                />
                <SummaryCard
                  title={t("dailyReports.itemsSold")}
                  value={`${latest.totalQuantity}`}
                  icon={<Package className="w-5 h-5" />}
                  color="bg-indigo-50 border-indigo-100 text-indigo-600"
                />
                <SummaryCard
                  title={t("dailyReports.discount")}
                  value={formatMyanmarCurrency(latest.discount, currencySymbol)}
                  icon={<Percent className="w-5 h-5" />}
                  color="bg-blue-50 border-blue-100 text-blue-600"
                />
              </div>

              {/* Right side: Latest Report Summary Panel */}
              <div className="lg:col-span-1 border-2 border-indigo-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col h-full min-h-[300px]">
                {/* Header inside Panel */}
                <div className="flex items-center gap-2 text-indigo-800 font-bold mb-4">
                  <Bot className="w-5 h-5 text-[#2216a8]" />
                  <span className="text-sm font-bold">{t("dailyReports.latestReport")}</span>
                </div>

                {/* Boxed Content */}
                <div className="border border-slate-200 rounded-xl p-5 flex-1 bg-slate-50/50">
                  <p className="text-xs font-bold text-slate-800 mb-4 leading-relaxed">
                    ဒီတစ်လ၏ အရောင်းအစီရင်ခံစာ အနှစ်ချုပ်မှာ အောက်ပါအတိုင်း ဖြစ်ပါတယ်ခင်ဗျာ
                  </p>
                  <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                      <span>- {t("dailyReports.totalSales")} :</span>
                      <span className="font-bold text-slate-900">{formatMyanmarCurrency(latest.finalAmount, currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                      <span>- ကတ်/Mobile Banking ဖြင့် ပေးချေမှု :</span>
                      <span className="font-bold text-slate-900">{formatMyanmarCurrency(latest.totalCardAmount, currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                      <span>- လက်ငင်းငွေသား (Cash) ဖြင့် ပေးချေမှု :</span>
                      <span className="font-bold text-slate-900">{formatMyanmarCurrency(latest.totalCashAmount, currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                      <span>- လျှော့ဈေး (Discount) :</span>
                      <span className="font-bold text-slate-900">{formatMyanmarCurrency(latest.discount, currencySymbol)}</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5">
                      <span>- စုစုပေါင်း အော်ဒါ (Order) အရေအတွက် :</span>
                      <span className="font-bold text-slate-900">{latest.orderCount} PCS</span>
                    </div>
                    <div className="flex justify-between pb-1.5">
                      <span>- စုစုပေါင်း ရောင်းရသည့် ပစ္စည်းအရေအတွက် :</span>
                      <span className="font-bold text-slate-900">{latest.totalQuantity} PCS</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-4 leading-relaxed">
                    ကျေးဇူးတင်ပါတယ်ခင်ဗျာ။
                  </p>
                </div>
              </div>
            </div>
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

          {/* History Section Header */}
          <div className="flex items-center gap-2 mt-8 mb-2">
            <FileText className="w-5 h-5 text-[#2216a8]" />
            <h2 className="text-lg font-bold text-slate-800">
              {t("dailyReports.history")}
            </h2>
          </div>

          {/* History Table */}
          {loading ? (
            <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#2216a8] mx-auto mb-2" />
              {t("dailyReports.loadingReports")}
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>{t("dailyReports.noReports")}</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[900px]">
                    <thead className="bg-[#fafafa] border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider w-[80px]">
                          No
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                          Mobile Banking Amount
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                          Cash
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                          Total Order
                        </th>
                        <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reports.map((report, index) => (
                        <tr key={report._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-400 text-xs">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                            {new Date(report.generatedAt).toLocaleDateString("en-US")}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                            {formatMyanmarCurrency(report.finalAmount, currencySymbol)}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-600 text-sm">
                            {formatMyanmarCurrency(report.totalCardAmount, currencySymbol)}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-600 text-sm">
                            {formatMyanmarCurrency(report.totalCashAmount, currencySymbol)}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                            {report.orderCount} PCS
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedReport(report)}
                              className="bg-[#2216a8] hover:bg-[#2216a8]/90 text-white px-5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {t("dailyReports.view")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between bg-[#fafafa] rounded-b-2xl border-t border-gray-100">
                  <p className="text-sm text-slate-500 font-medium">
                    {t("dailyReports.totalItemsLabel")
                      .replace("{total}", String(totalItems))
                      .replace("{current}", String(currentPage))
                      .replace("{totalPage}", String(totalPages))}
                  </p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => loadReports(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
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
                          className={`px-3 py-1.5 rounded-lg border text-sm font-semibold cursor-pointer ${currentPage === pageNum
                            ? "bg-[#2216a8] text-white border-[#2216a8]"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => loadReports(currentPage + 1)}
                      disabled={currentPage >= totalPages || loading}
                      className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
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
  );
};
