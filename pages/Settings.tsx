import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Role } from "../types";
import {
  Shield,
  AlertTriangle,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Truck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Store,
} from "lucide-react";
import {
  fetchStockAuditLogs,
  StockAuditLog,
} from "../services/StockAudit/fetchStockAuditLogs";
import {
  fetchTransfers,
  TransferData,
} from "../services/Purchase/fetchTransfers";
import { toast } from "sonner";
import { TransferList } from "../components/Purchasing/TransferList";
import { TransferDetailModal } from "../components/Purchasing/TransferDetailModal";
import { ShopSettingsTab } from "../components/Settings/ShopSettingsTab";
import { useLanguage } from "../context/LanguageContext";

export const Settings: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser, setUserRole, logs } = useApp();
  const [stockAuditLogs, setStockAuditLogs] = useState<StockAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [transferList, setTransferList] = useState<TransferData[]>([]);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(
    null,
  );
  const [isTransferDetailModalOpen, setIsTransferDetailModalOpen] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"audit" | "transfer" | "shop">(
    "shop",
  );

  const loadStockAuditLogs = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetchStockAuditLogs(page, limit);
      if (response.success && response.data) {
        setStockAuditLogs(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setCurrentPage(Number(response.pagination.currentPage));
          setTotalItems(response.pagination.totalItems);
        }
      } else {
        toast.error(response.message || "Failed to load stock audit logs");
      }
    } catch (error) {
      console.error("Error loading stock audit logs:", error);
      toast.error("Failed to load stock audit logs");
    } finally {
      setLoading(false);
    }
  };

  const loadTransfers = async () => {
    try {
      const res = await fetchTransfers();
      if (res.success) {
        setTransferList(res.data.reverse());
      }
    } catch (error) {
      console.error("Failed to load transfers", error);
      toast.error("Failed to load transfers");
    }
  };

  const handleViewTransfer = (transfer: TransferData) => {
    setSelectedTransferId(transfer._id);
    setIsTransferDetailModalOpen(true);
  };

  useEffect(() => {
    loadStockAuditLogs(1);
  }, [limit]);

  useEffect(() => {
    loadTransfers();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="w-full lg:h-[calc(100vh-2rem)]">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6 lg:h-full lg:overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("settings.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("settings.subtitle")}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-100 pb-1 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab("shop")}
            className={`px-4 py-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "shop"
                ? "border-[#2216a8] text-[#2216a8]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>{t("settings.shopSettingsTab")}</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "audit"
                ? "border-[#2216a8] text-[#2216a8]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t("settings.stockAuditLogsTab")}</span>
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={`px-4 py-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "transfer"
                ? "border-[#2216a8] text-[#2216a8]"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{t("settings.transferManagementTab")}</span>
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar min-h-0">
          {/* Shop Settings Tab */}
          {activeTab === "shop" && <ShopSettingsTab />}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-[#2216a8]" />{" "}
              Stock Audit Logs
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-indigo-200 text-[#2216a8]">
                <span className="text-xs font-semibold text-indigo-400">
                  Show:
                </span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="bg-transparent text-sm font-bold text-[#2216a8] outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <button
                onClick={() => loadStockAuditLogs(currentPage)}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 sm:p-8 text-center text-slate-500">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-[#2216a8] mx-auto mb-2" />
              <p className="text-sm sm:text-base font-medium">
                Loading stock audit logs...
              </p>
            </div>
          ) : stockAuditLogs.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-slate-500">
              <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm sm:text-base font-medium">No stock audit logs found</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="">
                <div className="overflow-x-auto h-[calc(100vh-350px)] sm:h-[calc(100vh-420px)] overflow-y-auto no-scrollbar">
                  <table className="w-full text-sm text-left min-w-[1000px]">
                    <thead className="bg-slate-50 border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Date</span>
                          <span className="sm:hidden">Date</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Product</span>
                          <span className="sm:hidden">Product</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Location</span>
                          <span className="sm:hidden">Location</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Action</span>
                          <span className="sm:hidden">Action</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                          <span className="hidden sm:inline">Before</span>
                          <span className="sm:hidden">Before</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                          <span className="hidden sm:inline">After</span>
                          <span className="sm:hidden">After</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600 text-right">
                          <span className="hidden sm:inline">Change</span>
                          <span className="sm:hidden">Change</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Admin</span>
                          <span className="sm:hidden">Admin</span>
                        </th>
                        <th className="px-2 sm:px-4 py-3 font-semibold text-slate-600">
                          <span className="hidden sm:inline">Reason</span>
                          <span className="sm:hidden">Reason</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {stockAuditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50">
                          <td className="px-2 sm:px-4 py-3 text-slate-500 text-xs">
                            <span className="truncate">
                              {formatDate(log.createdAt)}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="font-medium text-slate-800 text-xs sm:text-sm">
                              <span
                                className="truncate"
                                title={log.inventoryId?.productName}
                              >
                                {log.inventoryId?.productName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              <span
                                className="truncate"
                                title={`${log.inventoryId?.productCode} | ${log.inventoryId?.SKU}`}
                              >
                                {log.inventoryId?.productCode} |{" "}
                                {log.inventoryId?.SKU}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <div className="font-medium text-slate-800 text-xs sm:text-sm">
                              <span
                                className="truncate"
                                title={log.locationId?.locationName}
                              >
                                {log.locationId?.locationName}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              <span
                                className="truncate"
                                title={`${log.locationId?.locationCode} (${log.locationType})`}
                              >
                                {log.locationId?.locationCode} (
                                {log.locationType})
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                log.action === "add"
                                  ? "bg-green-100 text-green-700"
                                  : log.action === "remove"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                            {log.beforeQuantity.toLocaleString()}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                            {log.afterQuantity.toLocaleString()}
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {log.isIncrease ? (
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                              ) : log.isDecrease ? (
                                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                              ) : null}
                              <span
                                className={`font-bold text-xs sm:text-sm ${
                                  log.isIncrease
                                    ? "text-green-600"
                                    : log.isDecrease
                                      ? "text-red-600"
                                      : "text-slate-600"
                                }`}
                              >
                                {log.isIncrease
                                  ? "+"
                                  : log.isDecrease
                                    ? "-"
                                    : ""}
                                {Math.abs(log.quantityChange).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-slate-600 text-xs sm:text-sm">
                            <div className="font-medium text-slate-800 text-xs sm:text-sm">
                              {log?.adminId?.name || "-"}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                              {log?.adminId?.role}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-slate-500 text-xs w-[600px]">
                            <span className="" title={log?.reason || "-"}>
                              {log?.reason || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-4 py-3 border-t flex items-center justify-between bg-slate-50">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => loadStockAuditLogs(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                      className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => loadStockAuditLogs(currentPage + 1)}
                      disabled={currentPage >= totalPages || loading}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-700">
                        Showing{" "}
                        <span className="font-medium">
                          {(currentPage - 1) * limit + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(currentPage * limit, totalItems)}
                        </span>{" "}
                        of <span className="font-medium">{totalItems}</span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={() => loadStockAuditLogs(currentPage - 1)}
                          disabled={currentPage <= 1 || loading}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {/* Page Numbers */}
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
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
                                onClick={() => loadStockAuditLogs(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-semibold rounded-lg transition-all ${
                                  currentPage === pageNum
                                    ? "z-10 bg-[#2216a8] border-[#2216a8] text-white shadow-sm"
                                    : "bg-white border-slate-300 text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}

                        <button
                          onClick={() => loadStockAuditLogs(currentPage + 1)}
                          disabled={currentPage >= totalPages || loading}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transfer Management Tab */}
      {activeTab === "transfer" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-[#2216a8]" />{" "}
              Transfer Management
            </h2>
            <button
              onClick={loadTransfers}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          <TransferList
            transferList={transferList}
            onViewTransfer={handleViewTransfer}
            onStatusChange={loadTransfers}
          />
        </div>
      )}

      {/* Transfer Detail Modal */}
      <TransferDetailModal
        isOpen={isTransferDetailModalOpen}
        onClose={() => setIsTransferDetailModalOpen(false)}
        transferId={selectedTransferId}
      />
        </div>
      </div>
    </div>
  );
};
