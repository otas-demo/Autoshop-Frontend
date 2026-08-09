import React, { useState, useEffect } from "react";
import { 
  fetchPurchaseReport, 
  PurchaseReportOverall, 
  PurchaseReportStatus, 
  PurchaseReportSupplier, 
  PurchaseReportProduct 
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
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { DateRangePicker } from "../components/Reports/DateRangePicker";

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
  }, [startDate, endDate]);

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
      const res = await fetchPurchaseReport(startStr, endStr);
      if (res.success && res.data) {
        setOverall(res.data.overall);
        setStatusBreakdown(res.data.statusBreakdown);
        setSupplierBreakdown(res.data.supplierBreakdown);
        setProductBreakdown(res.data.productBreakdown);
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

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <div className="bg-slate-50/50 min-h-screen p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header section styled exactly like ReportsHeader */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Purchasing Report
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Analyze purchase orders, product demands, and supplier stats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={loadReport}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {/* Date Picker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateRangeChange}
            className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#2216a8]" />
          <p className="text-slate-500 font-medium">Generating purchasing analytics...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Purchase Value */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <DollarSign className="w-5 h-5 text-[#2216a8]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Total Purchase Value
                </p>
                <p className="text-lg font-black text-slate-800 mt-1">
                  {overall.totalAmount.toLocaleString()}{" "}
                  <span className="text-xs font-semibold text-slate-400">MMK</span>
                </p>
              </div>
            </div>

            {/* Total POs Created */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <FileText className="w-5 h-5 text-[#2216a8]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Total POs Created
                </p>
                <p className="text-lg font-black text-slate-800 mt-1">
                  {overall.count.toLocaleString()}{" "}
                  <span className="text-xs font-semibold text-slate-400">Orders</span>
                </p>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-[#2216a8]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Average Order Value
                </p>
                <p className="text-lg font-black text-slate-800 mt-1">
                  {Math.round(overall.averageAmount).toLocaleString()}{" "}
                  <span className="text-xs font-semibold text-slate-400">MMK</span>
                </p>
              </div>
            </div>

            {/* Pending Purchase Orders */}
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Truck className="w-5 h-5 text-[#2216a8]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Pending POs
                </p>
                <p className="text-lg font-black text-slate-800 mt-1">
                  {pendingPOCount}{" "}
                  <span className="text-xs font-semibold text-slate-400">Pending</span>
                </p>
              </div>
            </div>
          </div>

          {/* Status Breakdown & Top Suppliers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 text-[#2216a8]" />
                  Order Status Breakdown
                </h3>
                <div className="divide-y divide-gray-100">
                  {statusBreakdown.length === 0 ? (
                    <p className="text-slate-400 py-4 text-center text-xs">No status data available</p>
                  ) : (
                    statusBreakdown.map((status) => (
                      <div key={status._id} className="py-3 flex items-center justify-between text-xs">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(status._id)}`}>
                          {status._id.toUpperCase()}
                        </span>
                        <div className="text-right">
                          <p className="font-bold text-slate-800">{status.totalAmount.toLocaleString()} MMK</p>
                          <p className="text-[10px] text-slate-400">{status.count} orders</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Top Suppliers */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm lg:col-span-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4 text-[#2216a8]" />
                Top Suppliers by Value
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b">
                      <th className="p-3 text-left">Code</th>
                      <th className="p-3 text-left">Supplier Name</th>
                      <th className="p-3 text-center">Total Orders</th>
                      <th className="p-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supplierBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          No supplier data for this range.
                        </td>
                      </tr>
                    ) : (
                      supplierBreakdown.map((supplier) => (
                        <tr key={supplier.supplierId} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-mono text-slate-600 font-medium">{supplier.supplierCode}</td>
                          <td className="p-3 font-semibold text-slate-800">{supplier.supplierName}</td>
                          <td className="p-3 text-center font-semibold text-slate-700">{supplier.count}</td>
                          <td className="p-3 text-right font-bold text-slate-800">{supplier.totalAmount.toLocaleString()} MMK</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-[#2216a8]" />
              Top Purchased Products
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b">
                    <th className="p-3 text-left">Product Code</th>
                    <th className="p-3 text-left">Product Name</th>
                    <th className="p-3 text-center">Quantity Purchased</th>
                    <th className="p-3 text-right">Total Cost Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">
                        No product data for this range.
                      </td>
                    </tr>
                  ) : (
                    productBreakdown.map((product) => (
                      <tr key={product._id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-mono text-slate-600 font-medium">{product.productCode || "-"}</td>
                        <td className="p-3 font-semibold text-slate-800">{product.productName}</td>
                        <td className="p-3 text-center">
                          <span className="bg-indigo-50 text-[#2216a8] px-3 py-1 rounded-full font-bold">
                            {product.totalQuantity}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800">{product.totalCost.toLocaleString()} MMK</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
