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
  Check,
  CreditCard,
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
} from "lucide-react";
import { ApiPurchaseOrder, Supplier } from "../../types";
import { updatePurchaseStatus } from "../../services/Purchase/updatePurchaseStatus";
import { softDeletePurchase } from "../../services/Purchase/softDeletePurchase";
import { restorePurchase } from "../../services/Purchase/restorePurchase";
import { recordPurchasePayment } from "../../services/Purchase/recordPurchasePayment";
import { toast } from "sonner";
import { ConfirmModal } from "../Common/ConfirmModal";
import { Modal } from "../Modal";
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
  loadPurchases: (
    page?: number,
    limit?: number,
    status?: "pending" | "arrived",
    paymentStatus?: "all" | "unpaid" | "paid"
  ) => Promise<void>;
  loadDeletedPurchases: (page?: number, limit?: number) => Promise<void>;
  onViewPO?: (po: ApiPurchaseOrder) => void;
  pagination: PaginationData;
  deletedPagination: PaginationData;
  onCreateGRN?: (po: ApiPurchaseOrder) => void;
  loading?: boolean;
  poFilter: "pending" | "arrived" | "deleted";
  setPoFilter: (filter: "pending" | "arrived" | "deleted") => void;
  paymentFilter: "all" | "unpaid" | "paid";
  setPaymentFilter: (filter: "all" | "unpaid" | "paid") => void;
  tableHeight?: string;
  hideStatusFilter?: boolean;
  hideHeaderTitle?: boolean;
  title?: string;
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
  poFilter,
  setPoFilter,
  paymentFilter,
  setPaymentFilter,
  tableHeight,
  hideStatusFilter = false,
  hideHeaderTitle = false,
  title,
}) => {
  const { t, language } = useLanguage();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<ApiPurchaseOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [poToRestore, setPoToRestore] = useState<ApiPurchaseOrder | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Quick Payment Modal States
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [poForPayment, setPoForPayment] = useState<ApiPurchaseOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "kpay" | "wave" | "bank_transfer" | "other"
  >("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const handleOpenPayment = (po: ApiPurchaseOrder) => {
    setPoForPayment(po);
    const remaining = Math.max(0, po.totalAmount - (po.paidAmount || 0));
    setPaymentAmount(remaining);
    setPaymentMethod("cash");
    setPaymentNotes("");
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!poForPayment) return;
    if (paymentAmount <= 0) {
      toast.error("Payment amount must be greater than 0");
      return;
    }
    const remaining = Math.max(
      0,
      poForPayment.totalAmount - (poForPayment.paidAmount || 0)
    );
    if (paymentAmount > remaining) {
      toast.error(
        `Payment amount cannot exceed remaining debt (${remaining.toLocaleString()} MMK)`
      );
      return;
    }

    setIsRecordingPayment(true);
    try {
      const res = await recordPurchasePayment(poForPayment._id, {
        paidAmount: paymentAmount,
        paymentMethod,
        notes: paymentNotes,
      });

      if (res.success) {
        toast.success("Payment recorded successfully!");
        setPaymentModalOpen(false);
        setPoForPayment(null);
        if (poFilter === "deleted") {
          loadDeletedPurchases(
            deletedPagination.currentPage,
            deletedPagination.itemsPerPage
          );
        } else {
          loadPurchases(
            pagination.currentPage,
            pagination.itemsPerPage,
            poFilter,
            paymentFilter
          );
        }
      } else {
        toast.error(res.message || "Failed to record payment");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Use the filtered data from API instead of client-side filtering
  const displayList = poFilter === "deleted" ? deletedPOList : poList;

  useEffect(() => {
    sessionStorage.setItem("poFilter", poFilter);
    sessionStorage.setItem("poPaymentFilter", paymentFilter);
    if (poFilter === "deleted") {
      loadDeletedPurchases(
        deletedPagination.currentPage,
        deletedPagination.itemsPerPage,
      );
    } else {
      // Load purchases with status filter and payment status filter
      loadPurchases(
        pagination.currentPage,
        pagination.itemsPerPage,
        poFilter,
        paymentFilter
      );
    }
  }, [poFilter, paymentFilter]);

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
          paymentFilter
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
      loadPurchases(page, pagination.itemsPerPage, poFilter, paymentFilter);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    loadPurchases(1, newLimit, poFilter, paymentFilter);
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

  const handleRestore = (po: ApiPurchaseOrder) => {
    setPoToRestore(po);
    setRestoreModalOpen(true);
  };

  const confirmRestore = async () => {
    if (!poToRestore) return;

    setIsRestoring(true);
    try {
      const res = await restorePurchase(poToRestore._id);
      if (res.success) {
        toast.success("Purchase order restored successfully");
        loadPurchases(pagination.currentPage, pagination.itemsPerPage);
        loadDeletedPurchases(
          deletedPagination.currentPage,
          deletedPagination.itemsPerPage,
        );
        setRestoreModalOpen(false);
        setPoToRestore(null);
      } else {
        toast.error(res.message || "Failed to restore purchase order");
      }
    } catch (error: any) {
      console.error("Failed to restore purchase order", error);
      toast.error(error.message || "Failed to restore purchase order");
    } finally {
      setIsRestoring(false);
    }
  };

  const cancelRestore = () => {
    setRestoreModalOpen(false);
    setPoToRestore(null);
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
      {/* Title & Filter Pills Section */}
      <div className={`flex flex-col lg:flex-row lg:items-center ${hideHeaderTitle ? "lg:justify-end" : "lg:justify-between"} gap-4`}>
        {!hideHeaderTitle && (
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {title || (isMy ? "ဝယ်ယူမှု အော်ဒါ စာရင်းများ" : "Purchase Orders List")}
          </h2>
        )}

        <div className={`flex items-center gap-3 flex-wrap ${hideHeaderTitle ? "ml-auto" : ""}`}>
          {/* Order Status Filters */}
          {!hideStatusFilter && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-full border border-slate-200/80">
              <button
                onClick={() => setPoFilter("pending")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  poFilter === "pending"
                    ? "bg-white text-indigo-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isMy ? "ပစ္စည်း စောင့်ဆိုင်းနေဆဲ" : "Pending"}
              </button>
              <button
                onClick={() => setPoFilter("arrived")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  poFilter === "arrived"
                    ? "bg-white text-indigo-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isMy ? "ပစ္စည်းရောက်ရှိ" : "Arrived"}
              </button>
              <button
                onClick={() => setPoFilter("deleted")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  poFilter === "deleted"
                    ? "bg-white text-rose-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isMy ? "စာရင်း ပယ်ဖျက်" : "Deleted"}
              </button>
            </div>
          )}

          {/* Payment Status Filter */}
          {poFilter !== "deleted" && (
            <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-full border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-500 pl-2.5 pr-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>{isMy ? "ငွေပေးချေမှု:" : "Payment:"}</span>
              </span>
              <button
                onClick={() => setPaymentFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  paymentFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isMy ? "အားလုံး" : "All"}
              </button>
              <button
                onClick={() => setPaymentFilter("unpaid")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  paymentFilter === "unpaid"
                    ? "bg-amber-500 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isMy ? "မပေးချေရသေး (Unpaid)" : "Unpaid"}
              </button>
              <button
                onClick={() => setPaymentFilter("paid")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  paymentFilter === "paid"
                    ? "bg-emerald-600 text-white shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {isMy ? "ပေးချေပြီး (Paid)" : "Paid"}
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        /* Loading State Card */
        <div className="py-16 bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2216a8] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-bold text-xs">
            {isMy
              ? "ကုန်ပစ္စည်းမှာယူမှုစာရင်းများ ရယူနေပါသည်..."
              : "Loading purchase orders..."}
          </p>
        </div>
      ) : displayList.length === 0 ? (
        /* Empty State Card matching the design */
        <div className="py-16 bg-white rounded-2xl border border-gray-100 flex items-center justify-center">
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
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 overflow-hidden">
          <div
            className={`overflow-x-auto overflow-y-auto ${
              tableHeight &&
              (tableHeight.startsWith("h-") || tableHeight.startsWith("max-h-"))
                ? tableHeight
                : ""
            }`}
            style={
              !tableHeight ||
              (!tableHeight.startsWith("h-") &&
                !tableHeight.startsWith("max-h-"))
                ? { height: tableHeight || "calc(100vh - 350px)" }
                : undefined
            }
          >
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-gray-200 sticky top-0 z-10 text-slate-700 text-xs font-bold">
                <tr>
                  <th className="py-3.5 px-4 w-14 text-center">No</th>
                  <th className="py-3.5 px-4">PO Number ID</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment & Debt</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-600 font-medium">
                {displayList.map((po, idx) => {
                  const isCredit = po.paymentType === "credit";
                  const remainingDebt = isCredit
                    ? Math.max(0, po.totalAmount - (po.paidAmount || 0))
                    : 0;
                  const isOverdue = Boolean(
                    isCredit &&
                      po.dueDate &&
                      new Date(po.dueDate) < new Date() &&
                      po.paymentStatus !== "paid",
                  );

                  const itemNumber = String(
                    (currentPagination.currentPage - 1) *
                      currentPagination.itemsPerPage +
                      idx +
                      1,
                  ).padStart(2, "0");

                  const formattedDate = new Date(
                    po.createdAt,
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={po._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-4 px-4 text-center text-slate-500 font-semibold text-xs">
                        {itemNumber}
                      </td>
                      <td className="py-4 px-4 font-bold text-[#2216a8] text-xs tracking-tight">
                        {po.poNumber}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800 text-xs">
                        {formattedDate}
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-600 text-xs">
                        {po.supplierId?.supplierName || "OTAS Shop"}
                      </td>
                      <td className="py-4 px-4 text-xs whitespace-nowrap">
                        <span className="font-bold text-slate-900">
                          {po.totalAmount.toLocaleString()}
                        </span>{" "}
                        <span className="font-bold text-slate-800">MMK</span>
                      </td>

                      {/* Payment & Debt Column */}
                      <td className="py-4 px-4 text-xs">
                        {isCredit ? (
                          isOverdue ? (
                            <span className="px-3.5 py-1 rounded-full text-xs font-medium border border-red-300 text-red-700 bg-red-50/70 inline-block">
                              {isMy ? "ရက်ကျော်လွန်" : "OVERDUE"}
                            </span>
                          ) : po.paymentStatus === "paid" ? (
                            <span className="px-3.5 py-1 rounded-full text-xs font-medium border border-indigo-300 text-indigo-800 bg-indigo-50/70 inline-block">
                              {isMy ? "အပြေချေပြီး" : "PAID"}
                            </span>
                          ) : po.paymentStatus === "partially_paid" ? (
                            <span className="px-3.5 py-1 rounded-full text-xs font-medium border border-indigo-300 text-indigo-800 bg-indigo-50/70 inline-block">
                              {isMy ? "တစ်ဝက်ပေးပြီး" : "PARTIAL"}
                            </span>
                          ) : (
                            <span className="px-3.5 py-1 rounded-full text-xs font-medium border border-indigo-300 text-indigo-800 bg-indigo-50/50 inline-block">
                              {isMy ? "မဆပ်ရသေး" : "UNPAID"}
                            </span>
                          )
                        ) : (
                          <span className="px-3.5 py-1 rounded-full text-xs font-medium border border-indigo-300 text-indigo-800 bg-indigo-50/70 inline-block">
                            {isMy ? "အပြေချေပြီး" : "PAID IN FULL"}
                          </span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-4 text-xs">
                        <span
                          className={`px-3.5 py-1 rounded-full text-xs font-medium inline-block ${
                            poFilter === "deleted"
                              ? "border border-red-300 bg-red-50 text-red-700"
                              : "border border-emerald-300 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {poFilter === "deleted"
                            ? isMy
                              ? "ပယ်ဖျက်ပြီး"
                              : "Deleted"
                            : isMy
                              ? "Active"
                              : "Active"}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {poFilter === "deleted" ? (
                            <>
                              <button
                                onClick={() => onViewPO?.(po)}
                                className="bg-[#2216a8] hover:bg-[#1b1187] text-white text-xs font-medium px-3.5 py-1 rounded-full transition-all shadow-xs cursor-pointer"
                              >
                                {isMy ? "မြင်မယ်" : "View"}
                              </button>
                              <button
                                onClick={() => handleRestore(po)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3.5 py-1 rounded-full transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>
                                  {isMy ? "ပြန်လည်စတင်မယ်" : "Restore"}
                                </span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onViewPO?.(po)}
                                className="bg-[#2216a8] hover:bg-[#1b1187] text-white text-xs font-medium px-3.5 py-1 rounded-full transition-all shadow-xs cursor-pointer"
                              >
                                {isMy ? "မြင်မယ်" : "View"}
                              </button>
                              {po.status === "pending" && (
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(po._id, "arrived")
                                  }
                                  className="bg-[#2216a8] hover:bg-[#1b1187] text-white text-xs font-medium px-3.5 py-1 rounded-full transition-all shadow-xs cursor-pointer"
                                >
                                  {isMy ? "ပစ္စည်းရောက်ပြီ" : "Mark Arrived"}
                                </button>
                              )}
                              {(po.status === "arrived" ||
                                po.status === "received") &&
                                po.totalRemainingQuantity > 0 && (
                                  <button
                                    onClick={() => onCreateGRN?.(po)}
                                    className="bg-[#2216a8] hover:bg-[#1b1187] text-white text-xs font-medium px-3.5 py-1 rounded-full transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                  >
                                    <PackageCheck className="w-3 h-3" />
                                    <span>
                                      {isMy ? "GRN သွင်းမယ်" : "Create GRN"}
                                    </span>
                                  </button>
                                )}
                              {po.status === "pending" && (
                                <button
                                  onClick={() => handleSoftDelete(po)}
                                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-2 py-1 rounded-full transition-all shadow-xs cursor-pointer"
                                  title={isMy ? "ဖျက်မယ်" : "Delete"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

      {/* Restore Confirmation Modal */}
      <ConfirmModal
        isOpen={restoreModalOpen}
        title="Restore Purchase Order"
        message={`Are you sure you want to restore PO ${poToRestore?.poNumber}?`}
        confirmText="Restore"
        cancelText="Cancel"
        confirmButtonColor="green"
        onConfirm={confirmRestore}
        onCancel={cancelRestore}
        isLoading={isRestoring}
      />

      {/* Quick Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setPoForPayment(null);
        }}
        title={`Record Payment - ${poForPayment?.poNumber || ""}`}
      >
        {poForPayment && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>{isMy ? "စုစုပေါင်း ကုန်ကျငွေ:" : "Total PO Amount:"}</span>
                <span className="font-bold text-slate-800">
                  {poForPayment.totalAmount.toLocaleString()} MMK
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>{isMy ? "ပေးချေပြီးငွေ:" : "Total Paid:"}</span>
                <span className="font-bold text-emerald-600">
                  {(poForPayment.paidAmount || 0).toLocaleString()} MMK
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-2 border-t border-slate-200">
                <span className="text-amber-900 font-bold">
                  {isMy ? "ပေးဆပ်ရန် ကျန်ငွေ:" : "Remaining Debt:"}
                </span>
                <span className="font-black text-sm text-amber-700">
                  {Math.max(
                    0,
                    poForPayment.totalAmount - (poForPayment.paidAmount || 0)
                  ).toLocaleString()}{" "}
                  MMK
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-600">
                  {isMy ? "ယခုပေးဆပ်မည့်ငွေ (Payment Amount) *" : "Payment Amount *"}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentAmount(
                      Math.max(
                        0,
                        poForPayment.totalAmount - (poForPayment.paidAmount || 0)
                      )
                    )
                  }
                  className="text-[11px] text-[#2216a8] font-bold hover:underline cursor-pointer"
                >
                  {isMy ? "အကြွေးအပြေဆပ်မည်" : "Pay Full Balance"}
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={Math.max(
                  0,
                  poForPayment.totalAmount - (poForPayment.paidAmount || 0)
                )}
                value={paymentAmount || ""}
                onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                placeholder="Enter amount..."
                className="w-full border rounded-lg p-2.5 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {isMy ? "ပေးချေသည့် ပုံစံ (Payment Method)" : "Payment Method"}
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm font-medium bg-white"
              >
                <option value="cash">Cash (လက်ငင်း)</option>
                <option value="kpay">KBZ Pay</option>
                <option value="wave">Wave Pay</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                {isMy ? "မှတ်ချက် (Notes)" : "Notes"}
              </label>
              <textarea
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Add any payment notes..."
                className="w-full border rounded-lg p-2 text-xs"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentModalOpen(false);
                  setPoForPayment(null);
                }}
                className="flex-1 py-2.5 border rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {isMy ? "မလုပ်တော့ပါ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isRecordingPayment || paymentAmount <= 0}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isRecordingPayment ? (
                  <span>{isMy ? "လုပ်ဆောင်နေသည်..." : "Recording..."}</span>
                ) : (
                  <span>{isMy ? "ငွေပေးချေမှု အတည်ပြုမည်" : "Confirm Payment"}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
