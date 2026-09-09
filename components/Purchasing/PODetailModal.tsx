import React, { useEffect, useState } from "react";
import { Modal } from "../Modal";
import {
  fetchPurchaseById,
  PurchaseDetail,
} from "../../services/Purchase/fetchPurchaseById";
import { fetchPurchasePayments } from "../../services/Purchase/fetchPurchasePayments";
import { recordPurchasePayment } from "../../services/Purchase/recordPurchasePayment";
import { Supplier, PurchasePaymentRecord } from "../../types";
import {
  Package,
  Calendar,
  FileText,
  Hash,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  CreditCard,
  AlertTriangle,
  History,
  Edit3,
  PlusCircle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";

import { useLanguage } from "../../context/LanguageContext";

interface PODetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string | null;
  suppliers: Supplier[];
  onOrderUpdate?: () => void;
  onEdit?: (purchase: PurchaseDetail) => void;
}

export const PODetailModal: React.FC<PODetailModalProps> = ({
  isOpen,
  onClose,
  purchaseId,
  suppliers,
  onOrderUpdate,
  onEdit,
}) => {
  const { language, t } = useLanguage();
  const isMy = language === "my";

  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PurchasePaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "summary" | "products" | "payments"
  >("summary");

  // Record Payment Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "kpay" | "wave" | "bank_transfer" | "other"
  >("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  useEffect(() => {
    if (isOpen && purchaseId) {
      loadPurchaseDetails();
      loadPayments();
    }
  }, [isOpen, purchaseId]);

  const loadPurchaseDetails = async () => {
    if (!purchaseId) return;
    setLoading(true);
    try {
      const res = await fetchPurchaseById(purchaseId);
      if (res.success && res.data) {
        setPurchase(res.data);
      }
    } catch (error) {
      console.error("Failed to load purchase details", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    if (!purchaseId) return;
    setLoadingPayments(true);
    try {
      const res = await fetchPurchasePayments(purchaseId);
      if (res.success) {
        setPayments(res.data || []);
      }
    } catch (error) {
      console.error("Failed to load purchase payments", error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const getSupplierName = (supplierId: any) => {
    if (!supplierId) return "Unknown Supplier";
    if (typeof supplierId === "object" && supplierId.supplierName) {
      return supplierId.supplierName;
    }
    const supplier = suppliers.find(
      (s) => s.id === supplierId || s._id === supplierId
    );
    return supplier ? supplier.supplierName : "Unknown Supplier";
  };

  const getProductStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "received":
        return "bg-green-100 text-green-700 border-green-300";
      case "partial":
        return "bg-blue-100 text-blue-700 border-blue-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "arrived":
        return "bg-green-100 text-green-700 border-green-300";
      case "received":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getProductStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return isMy ? "စောင့်ဆိုင်း" : "Pending";
      case "received":
        return isMy ? "လက်ခံပြီး" : "Received";
      case "partial":
        return isMy ? "တစ်စိတ်တစ်ပိုင်း" : "Partial";
      case "arrived":
        return isMy ? "ရောက်ရှိ" : "Arrived";
      case "cancelled":
        return isMy ? "ပယ်ဖျက်" : "Cancelled";
      default:
        return status || (isMy ? "စောင့်ဆိုင်း" : "Pending");
    }
  };

  const handleOpenPaymentModal = () => {
    if (!purchase) return;
    const remaining = Math.max(0, purchase.totalAmount - (purchase.paidAmount || 0));
    setPaymentAmount(remaining);
    setPaymentMethod("cash");
    setPaymentNotes("");
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!purchase) return;
    if (paymentAmount <= 0) {
      toast.error(
        isMy
          ? "ပေးဆပ်မည့်ငွေ ပမာဏ 0 ထက် ကြီးရပါမည်"
          : "Payment amount must be greater than 0"
      );
      return;
    }
    const remaining = Math.max(0, purchase.totalAmount - (purchase.paidAmount || 0));
    if (paymentAmount > remaining) {
      toast.error(
        isMy
          ? `ပေးဆပ်မည့်ငွေသည် ကျန်ရှိသော အကြွေးပမာဏ (${remaining.toLocaleString()} MMK) ထက် မကျော်လွန်ရပါ`
          : `Payment amount cannot exceed remaining balance (${remaining.toLocaleString()} MMK)`
      );
      return;
    }

    setIsRecordingPayment(true);
    try {
      const res = await recordPurchasePayment(purchase._id, {
        paidAmount: paymentAmount,
        paymentMethod,
        notes: paymentNotes,
      });

      if (res.success) {
        toast.success(
          isMy
            ? "ငွေပေးချေမှု မှတ်တမ်းတင်ခြင်း အောင်မြင်ပါသည်"
            : "Payment recorded successfully!"
        );
        setShowPaymentModal(false);
        await Promise.all([loadPurchaseDetails(), loadPayments()]);
        onOrderUpdate?.();
      } else {
        toast.error(
          res.message ||
            (isMy ? "ငွေပေးချေမှု မှတ်တမ်းတင်ခြင်း မအောင်မြင်ပါ" : "Failed to record payment")
        );
      }
    } catch (err: any) {
      toast.error(
        err.message ||
          (isMy ? "ငွေပေးချေမှု မှတ်တမ်းတင်ခြင်း မအောင်မြင်ပါ" : "Failed to record payment")
      );
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleClose = () => {
    setPurchase(null);
    setPayments([]);
    onClose();
  };

  const totalQuantity =
    purchase?.products.reduce((sum, p) => sum + p.purchaseQuantity, 0) || 0;

  const isCredit = purchase?.paymentType === "credit";
  const remainingDebt = isCredit && purchase
    ? Math.max(0, purchase.totalAmount - (purchase.paidAmount || 0))
    : 0;
  const isOverdue = Boolean(
    isCredit &&
      purchase?.dueDate &&
      new Date(purchase.dueDate) < new Date() &&
      purchase.paymentStatus !== "paid"
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isMy ? "ဝယ်ယူမှု အော်ဒါ စာရင်း အသေးစိတ်" : "Purchase Order Details"}
    >
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2216a8]"></div>
          <span className="ml-3 text-slate-500 font-medium text-xs">
            {isMy ? "အချက်အလက်များ ရယူနေသည်..." : "Loading PO details..."}
          </span>
        </div>
      ) : purchase ? (
        <div className="space-y-6">
          {/* Sub Navigation Tabs & Edit Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-0">
            <div className="flex gap-4 sm:gap-8 overflow-x-auto pb-0">
              <button
                type="button"
                onClick={() => setActiveTab("summary")}
                className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "summary"
                    ? "border-b-2 border-[#2216a8] text-[#2216a8]"
                    : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{isMy ? "ဝယ်ယူမှု အော်ဒါ မှတ်တမ်း" : "Order Summary"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "products"
                    ? "border-b-2 border-[#2216a8] text-[#2216a8]"
                    : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>{isMy ? "ပစ္စည်း စာရင်း" : "Products List"}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                className={`pb-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === "payments"
                    ? "border-b-2 border-[#2216a8] text-[#2216a8]"
                    : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>{isMy ? "ငွေပေးချေမှု မှတ်တမ်း" : "Payment History"}</span>
              </button>
            </div>

            {onEdit && purchase.status === "pending" && (
              <button
                type="button"
                onClick={() => onEdit(purchase)}
                className="mb-2.5 sm:mb-2 px-3.5 py-1.5 bg-[#2216a8] hover:bg-[#1b1187] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isMy ? "အော်ဒါ ပြင်ဆင်မည်" : "Edit Purchase Order"}</span>
              </button>
            )}
          </div>

          {/* Tab 1: Summary / Overview */}
          {activeTab === "summary" && (
            <div className="space-y-6">
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* PO Number & Created Date Card */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3.5 lg:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2216a8] shrink-0 font-bold text-base">
                    #
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3 divide-x divide-gray-100">
                    <div>
                      <span className="text-xs text-slate-500 font-semibold block mb-0.5">
                        PO Number
                      </span>
                      <span
                        className="text-sm font-bold text-[#2216a8] truncate block tracking-tight"
                        title={purchase.poNumber || purchase._id}
                      >
                        {purchase.poNumber || purchase._id}
                      </span>
                    </div>
                    <div className="pl-3">
                      <span className="text-xs text-slate-500 font-semibold block mb-0.5">
                        Created Date
                      </span>
                      <span className="text-sm font-bold text-slate-800 block">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total Amount Card */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2216a8] shrink-0">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">
                      {isMy ? "ငွေ စုစုပေါင်း" : "Total Amount"}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {purchase.totalAmount.toLocaleString()} MMK
                    </span>
                  </div>
                </div>

                {/* Goods Status Card */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2216a8] shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-0.5">
                      {isMy ? "ပစ္စည်း Status" : "Total Items"}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {totalQuantity}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment & Credit Terms Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2216a8]">
                      <CreditCard className="w-4.5 h-4.5" />
                    </div>
                    <h4 className="font-bold text-slate-850 text-sm">
                      {isMy ? "ငွေပေးချေမှုနှင့် အကြွေးအခြေအနေ" : "Payment & Credit Terms"}
                    </h4>
                  </div>
                  {isCredit && remainingDebt > 0 && (purchase.status === "arrived" || purchase.status === "received") && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenPaymentModal}
                        className="px-3.5 py-1.5 bg-[#2216a8] hover:bg-[#1b1187] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>{isMy ? "ငွေဆပ်မယ်" : "Pay Debt"}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-1">
                      {isMy ? "ပေးချေပြီးငွေ" : "Total Paid"}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {(purchase.paidAmount || 0).toLocaleString()} MMK
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-1">
                      {isMy ? "ပေးရန်ကျန်ငွေ" : "Remaining Debt"}
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        remainingDebt > 0 ? "text-amber-600" : "text-slate-900"
                      }`}
                    >
                      {remainingDebt.toLocaleString()} MMK
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-1">
                      {isMy ? "အကြွေးဆပ်ရမည့်ရက်" : "Due Date"}
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {purchase.dueDate
                        ? new Date(purchase.dueDate).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block mb-1">
                      {isMy ? "ငွေပေးချေမှု အခြေအနေ" : "Payment Status"}
                    </span>
                    <div>
                      {isOverdue ? (
                        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold border border-red-300 text-red-700 bg-red-50/70">
                          {isMy ? "ရက်ကျော်လွန်" : "Overdue"}
                        </span>
                      ) : purchase.paymentStatus === "paid" ? (
                        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold border border-indigo-300 text-indigo-800 bg-indigo-50/70">
                          {isMy ? "အပြေချေပြီး" : "Fully Paid"}
                        </span>
                      ) : purchase.paymentStatus === "partially_paid" ? (
                        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold border border-indigo-300 text-indigo-800 bg-indigo-50/70">
                          {isMy ? "တစ်ဝက်ပေးပြီး" : "Partially Paid"}
                        </span>
                      ) : (
                        <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold border border-indigo-300 text-indigo-800 bg-indigo-50/50">
                          {isMy ? "မဆပ်ရသေး" : "Unpaid"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom 3 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Purchased By */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    {isMy ? "ပစ္စည်း မှာယူသူ" : "Purchased By"}
                  </h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-800">
                        {purchase.purchasedBy?.name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-semibold border border-amber-300 bg-amber-50 text-amber-800 capitalize">
                        {purchase.purchasedBy?.role || "Owner"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    {isMy ? "Supplier အချက်အလက်" : "Supplier Information"}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-800">
                        {getSupplierName(purchase.supplierId)}
                      </span>
                    </div>
                    {typeof purchase.supplierId === "object" &&
                      purchase.supplierId?.contactNumber && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{purchase.supplierId.contactNumber}</span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Order Note */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    {isMy ? "အော်ဒါ မှတ်စု" : "Order Note"}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {purchase.note || (isMy ? "မှတ်စု မရှိသေးပါ" : "No notes")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Products List */}
          {activeTab === "products" && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">
                {isMy ? "ဝယ်ယူမှု အော်ဒါ စာရင်းများ" : "Purchase Order Items"}
              </h3>
              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold">
                    <tr>
                      <th className="py-3.5 px-4 w-12 text-center">No</th>
                      <th className="py-3.5 px-4">{isMy ? "ပစ္စည်း အမည်" : "Product Name"}</th>
                      <th className="py-3.5 px-4 text-center">{isMy ? "အခြေအနေ" : "Status"}</th>
                      <th className="py-3.5 px-4 text-center">{isMy ? "မှာယူသည့် အရေအတွက်" : "Ordered Qty"}</th>
                      <th className="py-3.5 px-4 text-center">{isMy ? "လက်ခံရရှိသည့် အရေအတွက်" : "Received Qty"}</th>
                      <th className="py-3.5 px-4 text-center">{isMy ? "ဝယ်ယူသည့် ဈေးနှုန်း" : "Unit Cost"}</th>
                      <th className="py-3.5 px-4 text-right">{isMy ? "စုစုပေါင်း" : "Sub Total"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-700 font-medium">
                    {purchase.products.map((product, index) => {
                      const subtotal =
                        product.buyingPrice * product.purchaseQuantity;
                      return (
                        <tr
                          key={product._id || index}
                          className="hover:bg-slate-50/70"
                        >
                          <td className="py-4 px-4 text-center text-slate-500 font-semibold">
                            {String(index + 1).padStart(2, "0")}
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800">
                              {product.productName}
                            </div>
                            {product.productCode && (
                              <div className="text-[10px] text-slate-400">
                                {product.productCode}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold border border-amber-300 bg-amber-50 text-amber-800 capitalize">
                              {getProductStatusLabel(product.productStatus)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-slate-800">
                            {product.purchaseQuantity} PCS
                          </td>
                          <td className="py-4 px-4 text-center font-bold text-slate-800">
                            {product.receivedQuantity || 0} PCS
                          </td>
                          <td className="py-4 px-4 text-center text-slate-600 font-medium">
                            {product.buyingPrice.toLocaleString()} MMK
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-slate-900">
                            {subtotal.toLocaleString()} MMK
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50/50 border-t border-gray-200/80 text-xs">
                    <tr>
                      <td
                        colSpan={3}
                        className="py-4 px-4 text-right font-bold text-slate-700"
                      >
                        {isMy ? "မှာယူသည့် အရေအတွက် စုစုပေါင်း" : "Ordered Qty"}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-900">
                        {totalQuantity} PCS
                      </td>
                      <td
                        colSpan={2}
                        className="py-4 px-4 text-right font-bold text-slate-700"
                      >
                        {isMy ? "ငွေ စုစုပေါင်း" : "Total Amount"}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-900 text-sm">
                        {purchase.totalAmount.toLocaleString()} MMK
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Payment History */}
          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">
                  {isMy ? "ငွေပေးချေမှု မှတ်တမ်းများ" : "Payment History"}
                </h3>
                {isCredit && remainingDebt > 0 && (purchase?.status === "arrived" || purchase?.status === "received") && (
                  <button
                    type="button"
                    onClick={handleOpenPaymentModal}
                    className="px-3.5 py-1.5 bg-[#2216a8] hover:bg-[#1b1187] text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isMy ? "+ ငွေထပ်ဆပ်မည်" : "+ Add Payment"}</span>
                  </button>
                )}
              </div>

              {loadingPayments ? (
                <div className="text-center py-12 text-xs text-slate-400 font-medium">
                  {isMy ? "ငွေပေးချေမှု မှတ်တမ်းများ ရယူနေသည်..." : "Loading payment records..."}
                </div>
              ) : payments.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-gray-200/80 text-center text-xs text-slate-400 font-medium shadow-xs">
                  {isMy ? "ငွေပေးချေမှုမှတ်တမ်း မရှိသေးပါ" : "No payment records found"}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-gray-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">No</th>
                        <th className="py-3.5 px-4">{isMy ? "ပေးချေသည့် ရက်စွဲ" : "Payment Date"}</th>
                        <th className="py-3.5 px-4">{isMy ? "ပေးချေငွေ" : "Paid Amount"}</th>
                        <th className="py-3.5 px-4">{isMy ? "ပေးချေသည့် ပုံစံ" : "Payment Method"}</th>
                        <th className="py-3.5 px-4">{isMy ? "မှတ်ချက်" : "Note"}</th>
                        <th className="py-3.5 px-4">{isMy ? "မှတ်တမ်းတင်သူ" : "Recorded By"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-slate-700 font-medium">
                      {payments.map((p, idx) => {
                        const paymentDateStr =
                          new Date(p.paymentDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                          }) +
                          " " +
                          new Date(p.paymentDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });

                        return (
                          <tr
                            key={p._id || idx}
                            className="hover:bg-slate-50/70"
                          >
                            <td className="py-4 px-4 text-center text-slate-500 font-semibold">
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-800">
                              {paymentDateStr}
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-900">
                              {p.paidAmount.toLocaleString()} MMK
                            </td>
                            <td className="py-4 px-4">
                              <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium border border-slate-300 bg-white text-slate-700 capitalize">
                                {p.paymentMethod}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-500 max-w-xs truncate">
                              {p.notes || "-"}
                            </td>
                            <td className="py-4 px-4 text-indigo-700 font-semibold">
                              {p.recordedBy?.name || "Auto shop"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          {isMy ? "ဝယ်ယူမှု အော်ဒါ အချက်အလက် မရှိပါ" : "No purchase order data available"}
        </div>
      )}

      {/* Record Payment Mini-Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={
          isMy
            ? `ငွေပေးချေမှု မှတ်တမ်းတင်မည် - ${purchase?.poNumber || ""}`
            : `Record Payment - ${purchase?.poNumber || ""}`
        }
      >
        {purchase && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>{isMy ? "စုစုပေါင်း ကုန်ကျငွေ:" : "Total Amount:"}</span>
                <span className="font-bold text-slate-850">
                  {purchase.totalAmount.toLocaleString()} MMK
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>{isMy ? "ယခင်ပေးချေပြီးငွေ:" : "Previous Paid:"}</span>
                <span className="font-bold text-emerald-600">
                  {(purchase.paidAmount || 0).toLocaleString()} MMK
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-2 border-t border-slate-200">
                <span className="text-amber-900 font-bold">
                  {isMy ? "ပေးဆပ်ရန် ကျန်ငွေ:" : "Remaining Balance:"}
                </span>
                <span className="font-black text-sm text-amber-700">
                  {remainingDebt.toLocaleString()} MMK
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {isMy ? "ယခုပေးဆပ်မည့်ငွေ *" : "Payment Amount *"}
                </label>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(remainingDebt)}
                  className="text-[11px] text-[#2216a8] font-bold hover:underline cursor-pointer"
                >
                  {isMy ? "အကြွေးအပြေဆပ်မည်" : "Pay Full Amount"}
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={remainingDebt}
                value={paymentAmount || ""}
                onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                placeholder={isMy ? "ငွေပမာဏ ထည့်ပါ..." : "Enter amount..."}
                className="w-full border rounded-lg p-2.5 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isMy ? "ပေးချေသည့် ပုံစံ" : "Payment Method"}
              </label>
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                className="w-full border rounded-lg p-2.5 text-sm font-medium bg-white"
              >
                <option value="cash">{isMy ? "Cash (လက်ငင်း)" : "Cash"}</option>
                <option value="kpay">KBZ Pay</option>
                <option value="wave">Wave Pay</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isMy ? "မှတ်ချက်" : "Notes"}
              </label>
              <textarea
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder={isMy ? "မှတ်ချက် ရေးရန်..." : "Add any payment notes..."}
                className="w-full border rounded-lg p-2 text-xs"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
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
                  <span>{isMy ? "လုပ်ဆောင်နေသည်..." : "Processing..."}</span>
                ) : (
                  <span>{isMy ? "ငွေပေးချေမှု အတည်ပြုမည်" : "Confirm Payment"}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Modal>
  );
};
