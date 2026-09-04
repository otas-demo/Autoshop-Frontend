import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  CheckCircle,
  Warehouse,
  Store,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
} from "lucide-react";
import { GRNData } from "../../services/Purchase/fetchGRNs";
import { updateGRNStatus } from "../../services/Purchase/updateGRNStatus";
import { toast } from "sonner";
import { useLanguage } from "../../context/LanguageContext";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface GRNListProps {
  grnList: GRNData[];
  setIsCreateModalOpen: (isOpen: boolean) => void;
  onViewGRN?: (grn: GRNData) => void;
  onStatusChange?: (page?: number, limit?: number) => void;
  onTransferGRN?: (grn: GRNData, destination: 'warehouse' | 'storefront') => void;
  pagination: PaginationData;
  loading?: boolean;
}

export const GRNList: React.FC<GRNListProps> = ({
  grnList,
  setIsCreateModalOpen,
  onViewGRN,
  onStatusChange,
  onTransferGRN,
  pagination,
  loading = false,
}) => {
  const [grnFilter, setGrnFilter] = useState<"pending" | "completed">(
    () => {
      const saved = sessionStorage.getItem("grnFilter");
      return (saved as "pending" | "completed") || "pending";
    }
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    sessionStorage.setItem("grnFilter", grnFilter);
    onStatusChange?.(pagination.currentPage, pagination.itemsPerPage);
  }, [grnFilter]);

  const handleUpdateStatus = async (grnId: string, newStatus: string) => {
    setUpdatingId(grnId);
    try {
      const res = await updateGRNStatus(grnId, newStatus);
      if (res.success) {
        toast.success("GRN status updated successfully");
        onStatusChange?.(pagination.currentPage, pagination.itemsPerPage);
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to update GRN status", error);
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredGRNs = grnList.filter((grn) => {
    const status = grn.status?.toLowerCase() || "";
    if (grnFilter === "pending") {
      return status === "pending";
    } else {
      return (
        status === "verified" ||
        status === "completed" ||
        status === "transferred"
      );
    }
  });

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      onStatusChange?.(page, pagination.itemsPerPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    onStatusChange?.(1, newLimit);
  };

  const renderPagination = () => {
    const { currentPage, totalPages, totalItems, itemsPerPage } = pagination;

    if (totalPages <= 1 && totalItems <= 10) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t">
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-600">
            Showing {startItem} to {endItem} of {totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-slate-600">entries</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${page === currentPage
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50 border"
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "verified":
        return "bg-purple-100 text-purple-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "transferred":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const { language } = useLanguage();
  const isMy = language === "my";

  return (
    <div className="space-y-6">
      {/* Filter Tabs / Pills */}
      <div className="flex gap-3">
        <button
          onClick={() => setGrnFilter("pending")}
          className={`px-5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${grnFilter === "pending"
              ? "border-[#2216a8] text-[#2216a8] bg-indigo-50/50"
              : "border-gray-200 text-gray-400 bg-white hover:bg-slate-50"
            }`}
        >
          {isMy ? "စောင့်ဆိုင်းနေဆဲ" : "Pending"}
        </button>
        <button
          onClick={() => setGrnFilter("completed")}
          className={`px-5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${grnFilter === "completed"
              ? "border-[#2216a8] text-[#2216a8] bg-indigo-50/50"
              : "border-gray-200 text-gray-400 bg-white hover:bg-slate-50"
            }`}
        >
          {isMy ? "စာရင်း လက်ခံပြီး" : "Completed"}
        </button>
      </div>

      {loading ? (
        /* Loading State Card */
        <div className="py-12 bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2216a8] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-xs">
            {isMy ? "ပစ္စည်းလက်ခံစာရင်းများ ရယူနေပါသည်..." : "Loading goods received notes..."}
          </p>
        </div>
      ) : filteredGRNs.length === 0 ? (
        /* Empty State Card matching the design */
        <div className="py-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center">
          <div className="bg-[#f0effb]/70 border border-indigo-100 rounded-3xl p-8 w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-indigo-100/50">
              <PackageCheck className="w-6 h-6 text-[#2216a8]" />
            </div>
            <div className="text-center flex flex-col items-center">
              <span className="text-slate-500 font-bold text-xs">
                {isMy ? "လက်တလော" : "Currently"}
              </span>
              <span className="text-[#2216a8] font-black text-sm my-1">
                {isMy ? "ပစ္စည်းလက်ခံ စာရင်းများ" : "Goods Received Notes"}
              </span>
              <span className="text-slate-500 font-bold text-xs">
                {isMy ? "မရှိသေးပါ" : "Not available yet"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="h-[calc(100vh-450px)] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b sticky top-0 z-10 text-slate-700 text-xs font-bold">
                <tr>
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4">GRN Number ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Received Qty</th>
                  <th className="p-4">Condition Status</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  {/* <th className="p-4">Note</th> */}
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-600 font-medium">
                {filteredGRNs.map((grn, idx) => (
                  <tr key={grn._id} className="hover:bg-slate-50">
                    <td className="p-4 text-center text-slate-400">
                      {(pagination.currentPage - 1) * pagination.itemsPerPage + idx + 1}
                    </td>
                    <td className="p-4 font-bold text-[#2216a8]">
                      {grn.grnNumber}
                    </td>
                    <td className="p-4">
                      {new Date(grn.grnDate).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                        {grn.lineItems.length} item(s)
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {grn.totalReceivedQuantity}
                    </td>
                    <td className="p-4">
                      <span className="text-green-600 font-bold">
                        {grn.totalGoodQuantity}
                      </span>
                      {" / "}
                      <span className="text-red-600 font-bold">
                        {grn.totalBadQuantity}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {grn.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black ${getStatusColor(
                          grn.status
                        )}`}
                      >
                        {grn.status.toUpperCase()}
                      </span>
                    </td>
                    {/* <td className="p-4 text-slate-500 truncate max-w-xs">
                      {grn.notes || "-"}
                    </td> */}
                    <td className="p-4">
                      <div className="flex flex-row items-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => onViewGRN?.(grn)}
                          className="text-xs bg-[#2216a8]/5 text-[#2216a8] border border-[#2216a8]/10 hover:bg-[#2216a8]/10 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> {isMy ? "ကြည့်ရန်" : "View"}
                        </button>
                        {grn.status?.toLowerCase() === "pending" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(grn._id, "verified")
                            }
                            disabled={updatingId === grn._id}
                            className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 border border-purple-200 font-bold transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {updatingId === grn._id ? "..." : (isMy ? "အတည်ပြုမယ်" : "Verify")}
                          </button>
                        )}
                        {grn.status?.toLowerCase() === "verified" &&
                          grn.lineItems.some(
                            (item) => item.availableQuantity > 0
                          ) && (
                            <>
                              <button
                                onClick={() => onTransferGRN?.(grn, 'warehouse')}
                                className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 border border-green-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Warehouse className="w-3.5 h-3.5" /> {isMy ? "ဂိုဒေါင်သို့ လွှဲမယ်" : "Transfer to Warehouse"}
                              </button>
                              <button
                                onClick={() => onTransferGRN?.(grn, 'storefront')}
                                className="text-xs bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg hover:bg-teal-100 border border-teal-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Store className="w-3.5 h-3.5" /> {isMy ? "ဆိုင်သို့ လွှဲမယ်" : "Transfer to Storefront"}
                              </button>
                            </>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </div>
      )}
    </div>
  );
};

