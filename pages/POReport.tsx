import React, { useState, useEffect } from "react";
import {
  fetchPurchaseReport,
  PurchaseReportOverall,
  PurchaseReportStatus,
  PurchaseReportSupplier,
  PurchaseReportProduct,
  LowQuantityProduct
} from "../services/Reports/fetchPurchaseReport";
import {
  BarChart3,
  DollarSign,
  FileText,
  Loader2,
  Package,
  ShieldCheck,
  TrendingUp,
  Truck,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { DateRangePicker } from "../components/Reports/DateRangePicker";
import { POOverallTab } from "../components/Reports/POOverallTab";
import { POProductTab } from "../components/Reports/POProductTab";
import { POLowStockTab } from "../components/Reports/POLowStockTab";

export const POReport: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [overall, setOverall] = useState<PurchaseReportOverall>({
    totalAmount: 0,
    count: 0,
    averageAmount: 0
  });
  const [statusBreakdown, setStatusBreakdown] = useState<PurchaseReportStatus[]>([]);
  const [supplierBreakdown, setSupplierBreakdown] = useState<PurchaseReportSupplier[]>([]);
  const [productBreakdown, setProductBreakdown] = useState<PurchaseReportProduct[]>([]);
  const [lowQuantityProducts, setLowQuantityProducts] = useState<LowQuantityProduct[]>([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<"overall" | "product" | "low_stock">("overall");
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(50);
  const [lowStockPage, setLowStockPage] = useState<number>(1);
  const [lowStockPagination, setLowStockPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  }>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  useEffect(() => {
    // Set default date range to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    setStartDate(start);
    setEndDate(end);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      loadReport();
    }
  }, [startDate, endDate, lowStockThreshold, lowStockPage]);

  const formatDateForAPI = (date: Date | null) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const startStr = formatDateForAPI(startDate);
      const endStr = formatDateForAPI(endDate);
      const res = await fetchPurchaseReport(startStr, endStr, lowStockThreshold, lowStockPage, 10);
      if (res.success && res.data) {
        setOverall(res.data.overall);
        setStatusBreakdown(res.data.statusBreakdown);
        setSupplierBreakdown(res.data.supplierBreakdown);
        setProductBreakdown(res.data.productBreakdown);
        setLowQuantityProducts(res.data.lowQuantityProducts || []);
        setLowStockPagination(
          res.data.lowQuantityPagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: 10,
          }
        );
      } else {
        toast.error("Failed to load PO report data");
      }
    } catch (error) {
      console.error("Error loading PO report", error);
      toast.error("An error occurred while loading PO report");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "confirmed":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "arrived":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      case "completed":
        return "bg-green-100 text-green-700 border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const pendingPOCount = statusBreakdown.find(s => s._id?.toLowerCase() === "pending")?.count || 0;
  const arrivedPOCount = statusBreakdown.find(s => s._id?.toLowerCase() === "arrived")?.count || 0;

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  const renderHeader = () => (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Purchasing Report</h1>
        <p className="text-xs text-slate-400 mt-1.5 font-medium">
          Analyze purchase orders, product demands, and supplier stats.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={loadReport}
          disabled={loading}
          className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={handleDateRangeChange}
          className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="bg-white min-h-[96vh] border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">
        {renderHeader()}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#2216a8]" />
            <p className="text-slate-500 font-medium">Generating purchasing analytics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs Selector */}
            <div className="flex border-b border-gray-150">
              <button
                onClick={() => setActiveReportTab("overall")}
                className={`px-6 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeReportTab === "overall"
                  ? "border-[#2216a8] text-[#2216a8]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                Overall Analytics
              </button>
              <button
                onClick={() => setActiveReportTab("product")}
                className={`px-6 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeReportTab === "product"
                  ? "border-[#2216a8] text-[#2216a8]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                Product Analytics
              </button>
              <button
                onClick={() => setActiveReportTab("low_stock")}
                className={`px-6 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${activeReportTab === "low_stock"
                  ? "border-[#2216a8] text-[#2216a8]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
              >
                <span>Low Quantity Products</span>
                {lowStockPagination.totalItems > 0 && (
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">
                    {lowStockPagination.totalItems}
                  </span>
                )}
              </button>
            </div>

            {activeReportTab === "overall" ? (
              <POOverallTab
                overall={overall}
                statusBreakdown={statusBreakdown}
                supplierBreakdown={supplierBreakdown}
                getStatusColor={getStatusColor}
              />
            ) : activeReportTab === "product" ? (
              <POProductTab
                productBreakdown={productBreakdown}
                showAllProducts={showAllProducts}
                setShowAllProducts={setShowAllProducts}
              />
            ) : (
              <POLowStockTab
                lowQuantityProducts={lowQuantityProducts}
                lowStockThreshold={lowStockThreshold}
                setLowStockThreshold={setLowStockThreshold}
                lowStockPage={lowStockPage}
                setLowStockPage={setLowStockPage}
                lowStockPagination={lowStockPagination}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
