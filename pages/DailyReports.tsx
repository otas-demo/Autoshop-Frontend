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

// ─── Myanmar Formatting Helpers ───────────────────────────────

function toMyanmarDigits(num: number): string {
  const digits = "၀၁၂၃၄၅၆၇၈၉";
  return String(num).replace(/\d/g, (d) => digits[parseInt(d)]);
}

function formatMyanmarCurrency(amount: number): string {
  amount = Math.round(amount);
  if (amount === 0) return "၀ ကျပ်";

  const lakhs = Math.floor(amount / 100000);
  const remainder = amount % 100000;
  const tenThousands = Math.floor(remainder / 10000);
  const rest = remainder % 10000;

  const parts: string[] = [];

  if (lakhs > 0) {
    const prefix = lakhs === 1 ? "တစ်" : toMyanmarDigits(lakhs);
    parts.push(prefix + "သိန်း");
  }

  if (tenThousands > 0) {
    parts.push(toMyanmarDigits(tenThousands) + "သောင်း");
  }

  if (rest > 0) {
    parts.push(toMyanmarDigits(rest));
  }

  return parts.join(" ") + "ကျပ်";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("my-MM", {
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
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-slate-500 font-medium truncate">{title}</p>
      <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────

export const DailyReports: React.FC = () => {
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
    <div className="p-4 sm:p-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
              နေ့စဉ်အစီရင်ခံစာများ
            </h1>
            <p className="text-sm text-slate-500">
              Daily Reports
            </p>
          </div>
        </div>
        <button
          onClick={refresh}
          disabled={loading || loadingLatest}
          className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          ပြန်စင်
        </button>
      </div>

      {/* Summary Cards */}
      {loadingLatest ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span className="ml-2 text-slate-500">Loading latest report...</span>
        </div>
      ) : latest ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <SummaryCard
              title="စုစုပေါင်းရောင်းရငွေ"
              value={formatMyanmarCurrency(latest.finalAmount)}
              icon={<DollarSign className="w-5 h-5 text-white" />}
              color="bg-emerald-500"
            />
            <SummaryCard
              title="ကဒ်/Mobile Banking"
              value={formatMyanmarCurrency(latest.totalCardAmount)}
              icon={<CreditCard className="w-5 h-5 text-white" />}
              color="bg-blue-500"
            />
            <SummaryCard
              title="လက်ငင်းငွေသား (Cash)"
              value={formatMyanmarCurrency(latest.totalCashAmount)}
              icon={<Banknote className="w-5 h-5 text-white" />}
              color="bg-amber-500"
            />
            <SummaryCard
              title="အော်ဒါအရေအတွက်"
              value={`${toMyanmarDigits(latest.orderCount)} ခု`}
              icon={<ShoppingBag className="w-5 h-5 text-white" />}
              color="bg-purple-500"
            />
            <SummaryCard
              title="လျှော့စျေး (Discount)"
              value={formatMyanmarCurrency(latest.discount)}
              icon={<Percent className="w-5 h-5 text-white" />}
              color="bg-red-500"
            />
            <SummaryCard
              title="ရောင်းရသည့်ပစ္စည်း"
              value={`${toMyanmarDigits(latest.totalQuantity)} ခု`}
              icon={<Package className="w-5 h-5 text-white" />}
              color="bg-indigo-500"
            />
          </div>

          {/* Latest Report Full Text */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-500" />
                နောက်ဆုံး Report — {formatDate(latest.generatedAt)}
              </h2>
              {latest._id && (
                <span className="text-xs text-slate-400">
                  {latest.date}
                </span>
              )}
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-6 border border-emerald-100">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {latest.reportText}
              </pre>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mb-6">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">ယနေ့အတွက် report မရှိသေးပါ။</p>
          <p className="text-sm text-slate-400 mt-1">
            ညနေ ၉ နာရီတွင် အလိုအလျောက်ထုတ်ပေးမည်။
          </p>
        </div>
      )}

      {/* Selected Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">
                  Report — {formatDate(selectedReport.generatedAt)}
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedReport.reportText}
                </pre>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-500">စုစုပေါင်းရောင်းရငွေ:</span>
                  <p className="font-bold text-slate-800">{formatMyanmarCurrency(selectedReport.finalAmount)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-slate-500">အော်ဒါအရေအတွက်:</span>
                  <p className="font-bold text-slate-800">{toMyanmarDigits(selectedReport.orderCount)} ခု</p>
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
            မှတ်တမ်းများ
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>မှတ်တမ်းမရှိသေးပါ။</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">ရက်စွဲ</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">စုစုပေါင်းရောင်းရငွေ</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">ကဒ်/KPay</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">Cash</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-right">အော်ဒါ</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reports.map((report) => (
                    <tr key={report._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {formatDate(report.generatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                        {formatMyanmarCurrency(report.finalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {formatMyanmarCurrency(report.totalCardAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600">
                        {formatMyanmarCurrency(report.totalCashAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {toMyanmarDigits(report.orderCount)} ခု
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-emerald-600 hover:text-emerald-800 font-medium text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          ကြည့်
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
                <p className="text-sm text-slate-600">
                  စုစုပေါင်း {totalItems} ခုအနက် စာမျက်နှာ {currentPage} / {totalPages}
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
                            ? "bg-emerald-500 text-white border-emerald-500"
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
  );
};
