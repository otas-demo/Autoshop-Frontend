import React, { useState, useEffect } from "react";
import {
  Plus,
  Eye,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Trash2,
  RotateCcw,
  FileText,
} from "lucide-react";
import { ApiPurchaseOrder, Supplier } from "../../types";
import { updatePurchaseStatus } from "../../services/Purchase/updatePurchaseStatus";
import { softDeletePurchase } from "../../services/Purchase/softDeletePurchase";
import { restorePurchase } from "../../services/Purchase/restorePurchase";
import { toast } from "sonner";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface PurchaseOrderListProps {
  poList: ApiPurchaseOrder[];
  deletedPOList: ApiPurchaseOrder[];
  suppliers: Supplier[];
  setIsCreateModalOpen: (isOpen: boolean) => void;
  loadPurchases: (page?: number, limit?: number) => Promise<void>;
  loadDeletedPurchases: (page?: number, limit?: number) => Promise<void>;
  onViewPO?: (po: ApiPurchaseOrder) => void;
  pagination: PaginationData;
  deletedPagination: PaginationData;
  onCreateGRN?: (po: ApiPurchaseOrder) => void;
  loading?: boolean;
}

export const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({
  poList,
  deletedPOList,
  setIsCreateModalOpen,
  loadPurchases,
  loadDeletedPurchases,
  onViewPO,
  pagination,
  deletedPagination,
  onCreateGRN,
  loading = false,
}) => {
  const { t, language } = useLanguage();
  const [poFilter, setPoFilter] = useState<"pending" | "arrived" | "deleted">(
    () => {
      const saved = sessionStorage.getItem("poFilter");
      return (saved as "pending" | "arrived" | "deleted") || "pending";
    }
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<ApiPurchaseOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use the filtered data from API instead of client-side filtering
  const displayList = poFilter === "deleted" ? deletedPOList : poList;

  useEffect(() => {
    sessionStorage.setItem("poFilter", poFilter);
    if (poFilter === "deleted") {
      loadDeletedPurchases(
        deletedPagination.currentPage,
        deletedPagination.itemsPerPage,
      );
    } else {
      // Load purchases with status filter
      loadPurchases(pagination.currentPage, pagination.itemsPerPage, poFilter);
    }
  }, [poFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await updatePurchaseStatus(id, status);
      if (res.success) {
        toast.success("Status updated successfully");
        // Reload with current filter status
        loadPurchases(
          pagination.currentPage,
          pagination.itemsPerPage,
          poFilter,
        );
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Failed to update status", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      loadPurchases(page, pagination.itemsPerPage, poFilter);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    loadPurchases(1, newLimit, poFilter);
  };

  const handleSoftDelete = async (po: ApiPurchaseOrder) => {
    setPoToDelete(po);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!poToDelete) return;

    setIsDeleting(true);
    try {
      const res = await softDeletePurchase(poToDelete._id);
      if (res.success) {
        toast.success("Purchase order deleted successfully");
        loadPurchases(pagination.currentPage, pagination.itemsPerPage);
        setDeleteModalOpen(false);
        setPoToDelete(null);
      } else {
        toast.error(res.message || "Failed to delete purchase order");
      }
    } catch (error: any) {
      console.error("Failed to delete purchase order", error);
      toast.error(error.message || "Failed to delete purchase order");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setPoToDelete(null);
  };

  const handleRestore = async (po: ApiPurchaseOrder) => {
    if (
      !window.confirm(`Are you sure you want to restore PO ${po.poNumber}?`)
    ) {
      return;
    }

    try {
      const res = await restorePurchase(po._id);
      if (res.success) {
        toast.success("Purchase order restored successfully");
        loadPurchases(pagination.currentPage, pagination.itemsPerPage);
        loadDeletedPurchases(
          deletedPagination.currentPage,
          deletedPagination.itemsPerPage,
        );
      } else {
        toast.error(res.message || "Failed to restore purchase order");
      }
    } catch (error: any) {
      console.error("Failed to restore purchase order", error);
      toast.error(error.message || "Failed to restore purchase order");
    }
  };

  const handleDeletedPageChange = (page: number) => {
    if (page >= 1 && page <= deletedPagination.totalPages) {
      loadDeletedPurchases(page, deletedPagination.itemsPerPage);
    }
  };

  const handleDeletedLimitChange = (newLimit: number) => {
    loadDeletedPurchases(1, newLimit);
  };

  const renderPagination = () => {
    const currentPagination =
      poFilter === "deleted" ? deletedPagination : pagination;
    const { currentPage, totalPages, totalItems, itemsPerPage } =
      currentPagination;

    // Hide pagination if total items are 10 or less
    if (totalItems <= 10) return null;

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
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                if (poFilter === "deleted") {
                  handleDeletedLimitChange(newLimit);
                } else {
                  handleLimitChange(newLimit);
                }
              }}
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
            onClick={() => {
              if (poFilter === "deleted") {
                handleDeletedPageChange(currentPage - 1);
              } else {
                handlePageChange(currentPage - 1);
              }
            }}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => {
                  if (poFilter === "deleted") {
                    handleDeletedPageChange(page);
                  } else {
                    handlePageChange(page);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  page === currentPage
                    ? "bg-slate-800 text-white"
                    : "text-slate-600 hover:bg-slate-50 border"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (poFilter === "deleted") {
                handleDeletedPageChange(currentPage + 1);
              } else {
                handlePageChange(currentPage + 1);
              }
            }}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const isMy = language === "my";
  const currentPagination = poFilter === "deleted" ? deletedPagination : pagination;

  return (
    <div className="space-y-6">
      {/* Filter Tabs / Pills */}
      <div className="flex gap-3">
        <button
          onClick={() => setPoFilter("pending")}
          className={`px-5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            poFilter === "pending"
              ? "border-[#2216a8] text-[#2216a8] bg-indigo-50/50"
              : "border-gray-200 text-gray-400 bg-white hover:bg-slate-50"
          }`}
        >
          {isMy ? "စောင့်ဆိုင်းနေဆဲ" : "Pending"}
        </button>
        <button
          onClick={() => setPoFilter("arrived")}
          className={`px-5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            poFilter === "arrived"
              ? "border-[#2216a8] text-[#2216a8] bg-indigo-50/50"
              : "border-gray-200 text-gray-400 bg-white hover:bg-slate-50"
          }`}
        >
          {isMy ? "ပစ္စည်း ရောက်ပြီ" : "Arrived"}
        </button>
        <button
          onClick={() => setPoFilter("deleted")}
          className={`px-5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
            poFilter === "deleted"
              ? "border-[#2216a8] text-[#2216a8] bg-indigo-50/50"
              : "border-gray-200 text-gray-400 bg-white hover:bg-slate-50"
          }`}
        >
          {isMy ? "ဖျက်လိုက်သော စာရင်း" : "Deleted"}
        </button>
      </div>

      {loading ? (
        /* Loading State Card */
        <div className="py-12 bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2216a8] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-xs">
            {isMy ? "ကုန်ပစ္စည်းမှာယူမှုစာရင်းများ ရယူနေပါသည်..." : "Loading purchase orders..."}
          </p>
        </div>
      ) : displayList.length === 0 ? (
        /* Empty State Card matching the design */
        <div className="py-12 bg-white rounded-xl border border-gray-100 flex items-center justify-center">
          <div className="bg-[#f0effb]/70 border border-indigo-100 rounded-3xl p-8 w-full max-w-sm mx-auto flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-indigo-100/50">
              <FileText className="w-6 h-6 text-[#2216a8]" />
            </div>
            <div className="text-center flex flex-col items-center">
              <span className="text-slate-500 font-bold text-xs">
                {isMy ? "လက်တလော" : "Currently"}
              </span>
              <span className="text-[#2216a8] font-black text-sm my-1">
                {isMy ? "ဝယ်ယူမှု အော်ဒါ စာရင်းများ" : "Purchase Orders"}
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
                  <th className="p-4">PO Number ID</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Note</th>
                  <th className="p-4">Total Remaining</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-slate-600 font-medium">
                {displayList.map((po, idx) => {
                  return (
                    <tr key={po._id} className="hover:bg-slate-50">
                      <td className="p-4 text-center text-slate-400">
                        {(currentPagination.currentPage - 1) * currentPagination.itemsPerPage + idx + 1}
                      </td>
                      <td className="p-4 font-bold text-[#2216a8]">{po.poNumber}</td>
                      <td className="p-4">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {po.supplierId?.supplierName || "Unknown Supplier"}
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {po.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            po.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {po.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 truncate max-w-xs">
                        {po.note}
                      </td>
                      <td className="p-4 font-bold text-slate-800">{po.totalRemainingQuantity}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {poFilter === "deleted" ? (
                            <>
                              <button
                                onClick={() => onViewPO?.(po)}
                                className="text-xs bg-[#2216a8]/5 text-[#2216a8] border border-[#2216a8]/10 hover:bg-[#2216a8]/10 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> {isMy ? "ကြည့်ရန်" : "View"}
                              </button>
                              <button
                                onClick={() => handleRestore(po)}
                                className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 border border-green-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> {isMy ? "ပြန်လည်စတင်မယ်" : "Restore"}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onViewPO?.(po)}
                                className="text-xs bg-[#2216a8]/5 text-[#2216a8] border border-[#2216a8]/10 hover:bg-[#2216a8]/10 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> {isMy ? "ကြည့်ရန်" : "View"}
                              </button>
                              {po.status === "pending" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(po._id, "arrived")
                                  }
                                  className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 border border-green-200 font-bold transition-colors cursor-pointer"
                                >
                                  {isMy ? "ရောက်ရှိကြောင်းမှတ်သားမယ်" : "Mark Arrived"}
                                </button>
                              )}
                              {(po.status === "arrived" ||
                                po.status === "received") &&
                                po.totalRemainingQuantity > 0 && (
                                  <button
                                    onClick={() => onCreateGRN?.(po)}
                                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 border border-blue-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <PackageCheck className="w-3.5 h-3.5" />
                                    GRN
                                  </button>
                                )}
                              {po.status === "pending" && (
                                <button
                                  onClick={() => handleSoftDelete(po)}
                                  className="text-xs bg-red-55 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 border border-red-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> {isMy ? "ဖျက်မယ်" : "Delete"}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Purchase Order"
        message={`Are you sure you want to delete PO ${poToDelete?.poNumber}? This action can be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={isDeleting}
      />
    </div>
  );
};
