import React, { useEffect, useState } from "react";
import { Modal } from "../Modal";
import {
  fetchPurchaseById,
  PurchaseDetail,
} from "../../services/Purchase/fetchPurchaseById";
import { fetchPurchasePayments } from "../../services/Purchase/fetchPurchasePayments";
import { recordPurchasePayment } from "../../services/Purchase/recordPurchasePayment";
import { updatePurchaseDueDate } from "../../services/Purchase/updatePurchaseDueDate";
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
} from "lucide-react";
import { toast } from "sonner";

interface PODetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: string | null;
  suppliers: Supplier[];
  onOrderUpdate?: () => void;
}

export const PODetailModal: React.FC<PODetailModalProps> = ({
  isOpen,
  onClose,
  purchaseId,
  suppliers,
  onOrderUpdate,
}) => {
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PurchasePaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Record Payment Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "kpay" | "wave" | "bank_transfer" | "other"
  >("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Update Due Date Modal states
  const [showDueDateModal, setShowDueDateModal] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false);

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
        if (res.data.dueDate) {
          setNewDueDate(new Date(res.data.dueDate).toISOString().split("T")[0]);
        }
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
      toast.error("Payment amount must be greater than 0");
      return;
    }
    const remaining = Math.max(0, purchase.totalAmount - (purchase.paidAmount || 0));
    if (paymentAmount > remaining) {
      toast.error(`Payment amount cannot exceed remaining balance (${remaining.toLocaleString()} MMK)`);
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
        toast.success("Payment recorded successfully!");
        setShowPaymentModal(false);
        await Promise.all([loadPurchaseDetails(), loadPayments()]);
        onOrderUpdate?.();
      } else {
        toast.error(res.message || "Failed to record payment");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleUpdateDueDate = async () => {
    if (!purchase) return;
    if (!newDueDate) {
      toast.error("Please select a due date");
      return;
    }

    setIsUpdatingDueDate(true);
    try {
      const res = await updatePurchaseDueDate(purchase._id, newDueDate);
      if (res.success) {
        toast.success("Due date updated successfully!");
        setShowDueDateModal(false);
        await loadPurchaseDetails();
        onOrderUpdate?.();
      } else {
        toast.error(res.message || "Failed to update due date");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update due date");
    } finally {
      setIsUpdatingDueDate(false);
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
    <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Order Details">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2216a8]"></div>
          <span className="ml-3 text-slate-500 font-medium">Loading PO details...</span>
        </div>
      ) : purchase ? (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                <Hash className="w-4 h-4 text-[#2216a8]" />
                PO Number
              </div>
              <div
                className="font-black text-base text-[#2216a8] truncate"
                title={purchase.poNumber || purchase._id}
              >
                {purchase.poNumber || purchase._id}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                <Calendar className="w-4 h-4" />
                Created Date
              </div>
              <div className="font-bold text-base text-slate-800">
                {new Date(purchase.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Total Amount
              </div>
              <div className="font-black text-base text-emerald-600">
                {purchase.totalAmount.toLocaleString()} MMK
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold mb-1">
                <FileText className="w-4 h-4" />
                Goods Status
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${getStatusColor(
                  purchase.status
                )}`}
              >
                {purchase.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Credit & Financial Summary Card */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/50 p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-xs border border-indigo-100 text-[#2216a8]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-850 text-sm">
                    ငွေပေးချေမှုနှင့် အကြွေးအခြေအနေ (Payment & Credit Terms)
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {isCredit ? "အကြွေးဝယ်ယူမှု (Credit Order)" : "အပြေချေဝယ်ယူမှု (Cash / Paid Order)"}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {isCredit && (
                <div className="flex items-center gap-2">
                  {remainingDebt > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenPaymentModal}
                      className="px-3.5 py-1.5 bg-[#2216a8] hover:bg-[#2216a8]/90 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>ငွေဆပ်မယ် (Pay Debt)</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDueDateModal(true)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Due Date ပြင်မယ်</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
                  ပေးချေပြီးငွေ (Total Paid)
                </span>
                <span className="text-sm font-black text-emerald-600">
                  {(purchase.paidAmount || 0).toLocaleString()} MMK
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
                  ပေးရန်ကျန်ငွေ (Remaining Debt)
                </span>
                <span className={`text-sm font-black ${remainingDebt > 0 ? "text-amber-700" : "text-slate-700"}`}>
                  {remainingDebt.toLocaleString()} MMK
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
                  အကြွေးဆပ်ရမည့်ရက် (Due Date)
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{purchase.dueDate ? new Date(purchase.dueDate).toLocaleDateString() : "မသတ်မှတ်ထားပါ"}</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block mb-0.5">
                  ငွေပေးချေမှု အခြေအနေ
                </span>
                <div>
                  {isOverdue ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200">
                      <AlertTriangle className="w-3 h-3" />
                      ရက်ကျော်လွန် (OVERDUE)
                    </span>
                  ) : purchase.paymentStatus === "paid" ? (
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                      အပြေချေပြီး (PAID)
                    </span>
                  ) : purchase.paymentStatus === "partially_paid" ? (
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                      တပိုင်းဆပ် (PARTIAL)
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200">
                      မဆပ်ရသေး (UNPAID)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Purchased By Info & Supplier Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50/70 p-4 rounded-xl border border-green-200/70">
              <div className="flex items-center gap-2 text-green-700 text-xs font-bold mb-1.5">
                <User className="w-4 h-4" />
                Purchased By
              </div>
              <div className="text-green-900">
                <div className="font-bold text-sm">
                  {purchase.purchasedBy?.name || "N/A"}
                </div>
                <div className="text-xs text-green-600 capitalize font-medium">
                  {purchase.purchasedBy?.role || ""}
                </div>
              </div>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200/70">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-bold mb-1.5">
                <User className="w-4 h-4" />
                Supplier Information
              </div>
              <div className="text-blue-900">
                <div className="font-bold text-sm">
                  {getSupplierName(purchase.supplierId)}
                </div>
                {typeof purchase.supplierId === "object" && purchase.supplierId?.contactNumber && (
                  <div className="text-xs text-blue-600 font-medium">
                    Phone: {purchase.supplierId.contactNumber}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {purchase.note && (
            <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 text-xs">
              <span className="font-bold text-amber-800 block mb-1">
                Order Note:
              </span>
              <p className="text-amber-900 font-medium">{purchase.note}</p>
            </div>
          )}

          {/* Products List */}
          <div>
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
              <Package className="w-4 h-4 text-[#2216a8]" />
              Products ({purchase.products.length})
            </h3>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b text-slate-600 font-bold">
                  <tr>
                    <th className="p-3 text-left">No</th>
                    <th className="p-3 text-left">Product Name</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Ordered Qty</th>
                    <th className="p-3 text-center">Received Qty</th>
                    <th className="p-3 text-right">Unit Cost</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700 font-medium">
                  {purchase.products.map((product, index) => (
                    <tr key={product._id || index} className="hover:bg-slate-50/70">
                      <td className="p-3 text-slate-400">{index + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-850">
                          {product.productName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {product.productCode}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getProductStatusColor(
                            product.productStatus
                          )}`}
                        >
                          {product.productStatus === "received" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {product.productStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-blue-700">
                        {product.purchaseQuantity}
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-700">
                        {product.receivedQuantity}
                      </td>
                      <td className="p-3 text-right text-slate-600">
                        {product.buyingPrice.toLocaleString()} MMK
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {(
                          product.buyingPrice * product.purchaseQuantity
                        ).toLocaleString()}{" "}
                        MMK
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t font-bold text-slate-800">
                  <tr>
                    <td colSpan={3} className="p-3 text-right">
                      Total Ordered Quantity:
                    </td>
                    <td className="p-3 text-center text-[#2216a8] font-black">
                      {totalQuantity}
                    </td>
                    <td colSpan={2} className="p-3 text-right">
                      Total Amount:
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600">
                      {purchase.totalAmount.toLocaleString()} MMK
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment History Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <History className="w-4 h-4 text-[#2216a8]" />
                ငွေပေးချေမှု မှတ်တမ်းများ (Payment History - {payments.length})
              </h3>
              {isCredit && remainingDebt > 0 && (
                <button
                  type="button"
                  onClick={handleOpenPaymentModal}
                  className="text-xs font-bold text-[#2216a8] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>ငွေထပ်ဆပ်မည်</span>
                </button>
              )}
            </div>

            {loadingPayments ? (
              <div className="text-center py-6 text-xs text-slate-400">
                Loading payment records...
              </div>
            ) : payments.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400 font-medium">
                ငွေပေးချေမှုမှတ်တမ်း မရှိသေးပါ
              </div>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b text-slate-600 font-bold">
                    <tr>
                      <th className="p-3 text-left">No</th>
                      <th className="p-3 text-left">Payment Date</th>
                      <th className="p-3 text-right">Paid Amount</th>
                      <th className="p-3 text-center">Payment Method</th>
                      <th className="p-3 text-left">Notes</th>
                      <th className="p-3 text-left">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700 font-medium">
                    {payments.map((p, idx) => (
                      <tr key={p._id || idx} className="hover:bg-slate-50/70">
                        <td className="p-3 text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          {new Date(p.paymentDate).toLocaleDateString()}{" "}
                          <span className="text-[10px] text-slate-400">
                            {new Date(p.paymentDate).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-emerald-600">
                          {p.paidAmount.toLocaleString()} MMK
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 italic max-w-xs truncate">
                          {p.notes || "-"}
                        </td>
                        <td className="p-3 text-slate-600">
                          {p.recordedBy?.name || "Admin"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="flex justify-between text-[11px] text-slate-400 pt-4 border-t">
            <div>Created: {new Date(purchase.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(purchase.updatedAt).toLocaleString()}</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          No purchase order data available
        </div>
      )}

      {/* Record Payment Mini-Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={`Record Payment - ${purchase?.poNumber || ""}`}
      >
        {purchase && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>စုစုပေါင်း ကုန်ကျငွေ:</span>
                <span className="font-bold text-slate-850">
                  {purchase.totalAmount.toLocaleString()} MMK
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>ယခင်ပေးချေပြီးငွေ:</span>
                <span className="font-bold text-emerald-600">
                  {(purchase.paidAmount || 0).toLocaleString()} MMK
                </span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-2 border-t border-slate-200">
                <span className="text-amber-900 font-bold">ပေးဆပ်ရန် ကျန်ငွေ:</span>
                <span className="font-black text-sm text-amber-700">
                  {remainingDebt.toLocaleString()} MMK
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  ယခုပေးဆပ်မည့်ငွေ (Payment Amount) *
                </label>
                <button
                  type="button"
                  onClick={() => setPaymentAmount(remainingDebt)}
                  className="text-[11px] text-[#2216a8] font-bold hover:underline cursor-pointer"
                >
                  အကြွေးအပြေဆပ်မည်
                </button>
              </div>
              <input
                type="number"
                min="1"
                max={remainingDebt}
                value={paymentAmount || ""}
                onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                placeholder="Enter amount..."
                className="w-full border rounded-lg p-2.5 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ပေးချေသည့် ပုံစံ (Payment Method)
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                မှတ်ချက် (Notes)
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
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 border rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                မလုပ်တော့ပါ
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isRecordingPayment || paymentAmount <= 0}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isRecordingPayment ? (
                  <span>လုပ်ဆောင်နေသည်...</span>
                ) : (
                  <span>ငွေပေးချေမှု အတည်ပြုမည်</span>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Due Date Mini-Modal */}
      <Modal
        isOpen={showDueDateModal}
        onClose={() => setShowDueDateModal(false)}
        title="Update Credit Due Date"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ဆပ်ရမည့်ရက် (New Due Date) *
            </label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm font-medium bg-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDueDateModal(false)}
              className="flex-1 py-2.5 border rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              မလုပ်တော့ပါ
            </button>
            <button
              type="button"
              onClick={handleUpdateDueDate}
              disabled={isUpdatingDueDate || !newDueDate}
              className="flex-1 py-2.5 bg-[#2216a8] hover:bg-[#2216a8]/90 text-white rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {isUpdatingDueDate ? (
                <span>ပြင်ဆင်နေသည်...</span>
              ) : (
                <span>အတည်ပြုမည်</span>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};
