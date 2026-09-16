import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Receipt,
  Store,
  Calendar,
  CreditCard,
  Package,
  UserCircle,
  User,
  Printer,
  Edit,
  PlusCircle,
  Check,
  Loader2,
} from "lucide-react";
import { Order } from "../../services/Order/fetchOrders";
import {
  getStatusColor,
  getPaymentTypeLabel,
  getPaymentMethodLabel,
  getPaymentTypeColor,
  formatDate,
  getCreditPaymentStatus,
  getCreditPaymentStatusColor,
  getTranslatedCreditStatus,
} from "./orderUtils";
import { useLanguage } from "../../context/LanguageContext";
import { getSavedPrintPaperSize } from "../../utils/printPaperSize";
import { detectDevice } from "../../utils/deviceDetect";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createCreditRecord } from "../../services/Credit/createCreditRecord";
import { fetchOrderById } from "../../services/Order/fetchOrderById";

interface OrderDetailModalProps {
  isOpen: boolean;
  loading: boolean;
  order: Order | null;
  onClose: () => void;
  onOrderUpdate?: () => void;
  onRefresh?: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  loading,
  order: initialOrder,
  onClose,
  onOrderUpdate,
  onRefresh,
}) => {
  const { t, language } = useLanguage();
  const isMy = language === "my";
  const navigate = useNavigate();
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrder);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    setCurrentOrder(initialOrder);
    setShowPaymentModal(false);
  }, [initialOrder]);

  const order = currentOrder || initialOrder;

  const remainingBalance =
    order?.remainingBalance !== undefined
      ? order.remainingBalance
      : Math.max(0, (order?.finalAmount || 0) - (order?.paidAmount || 0));

  const handleAddPaymentRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (!paymentAmount || paymentAmount <= 0) {
      toast.error(
        isMy
          ? "ပေးချေမည့် ငွေပမာဏ ထည့်သွင်းပါ"
          : "Please enter a valid payment amount",
      );
      return;
    }

    if (paymentAmount > remainingBalance) {
      toast.error(
        isMy
          ? `ပေးသွင်းငွေသည် ကျန်ရှိငွေ (${remainingBalance.toLocaleString()} MMK) ထက် မကျော်လွန်နိုင်ပါ`
          : `Amount cannot exceed remaining balance (${remainingBalance.toLocaleString()} MMK)`,
      );
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const response = await createCreditRecord({
        orderId: order._id,
        paidAmount: paymentAmount,
        paymentMethod,
      });

      if (response.success) {
        toast.success(
          t("creditDetail.paymentRecorded") || "Payment recorded successfully",
        );
        setShowPaymentModal(false);
        setPaymentAmount(0);
        setPaymentNotes("");
        setPaymentMethod("cash");

        // Immediately refresh current order in modal
        const refreshed = await fetchOrderById(order._id);
        if (refreshed.success && refreshed.data) {
          setCurrentOrder(refreshed.data);
        }

        if (onOrderUpdate) {
          onOrderUpdate();
        }
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast.error(
          response.message ||
          t("creditDetail.failedToRecord") ||
          "Failed to record payment",
        );
      }
    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast.error(
        error.message ||
        t("creditDetail.failedToRecord") ||
        "Failed to record payment",
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const getTranslatedStatus = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return t("orders.statusCompleted");
      case "pending":
        return t("orders.statusPending");
      case "cancelled":
        return t("orders.statusCancelled");
      case "refunded":
        return t("orders.statusRefunded");
      default:
        return status?.toUpperCase() || "";
    }
  };

  const getTranslatedPaymentType = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "paid":
        return t("orders.paidType");
      case "credit":
        return t("orders.creditType");
      default:
        return getPaymentTypeLabel(type || "");
    }
  };

  const getTranslatedPaymentMethod = (method?: string) => {
    switch (method?.toLowerCase()) {
      case "cash":
        return t("orders.methodCash");
      case "kpay":
      case "kbzpay":
        return t("orders.methodKpay");
      case "wavepay":
        return t("orders.methodWave");
      case "ayapay":
        return t("orders.methodAya");
      case "uabpay":
        return t("orders.methodUab");
      case "bank_transfer":
        return t("orders.methodBankTransfer");
      default:
        return getPaymentMethodLabel(method || "");
    }
  };

  const getTranslatedCreditStatus = (status: string) => {
    switch (status) {
      case "fully_paid":
        return t("creditOrders.fullyPaid");
      case "partial_paid":
        return t("creditOrders.partialPaid");
      case "unpaid":
        return t("creditOrders.unpaid");
      default:
        return status;
    }
  };

  const handlePrintOrder = () => {
    if (!order) return;

    // Transform order data to receipt format
    const receiptData = {
      invoiceNumber: order.orderNumber,
      storefrontName: "HONGCHI Myanmar",
      date: order.createdAt,
      items:
        order.ordersProducts?.map((item) => ({
          name: item.inventoryId?.productName || "Unknown Product",
          code: item.inventoryId?.productCode,
          qty: item.quantity,
          price: item.unitPrice || 0,
        })) || [],
      subtotal: order.subTotal || 0,
      discountPercent: order.discount
        ? (order.discount / (order.subTotal || 1)) * 100
        : 0,
      discountAmount: order.discount || 0,
      total: order.finalAmount || 0,
      paymentMethod: getPaymentMethodLabel(order.paymentMethod),
      paidAmount: order.paidAmount,
      change: order.extraChange,
      note: order.note,
      serviceCharge: 0,
      tax: 0,
      receiptSequenceNumber: parseInt(order.orderNumber?.split("/").pop() || "0", 10) || Date.now() % 10000,
      cashierName:
        JSON.parse(localStorage.getItem("adminData") || "{}").name ||
        JSON.parse(localStorage.getItem("adminData") || "{}").username ||
        "Cashier",
      customerName: typeof order.creditPersonId === "object" ? order.creditPersonId?.name : "",
      customerPhone: typeof order.creditPersonId === "object" ? order.creditPersonId?.phone : "",
      customerAddress: typeof order.creditPersonId === "object" ? order.creditPersonId?.address || "" : "",
    };

    // Save receipt data to localStorage for A4 printing
    const receiptId = `receipt_${receiptData.invoiceNumber}`;
    localStorage.setItem(receiptId, JSON.stringify(receiptData));

    // Device detection for print method selection
    const device = detectDevice();

    if (device.isAndroid || device.isIOS) {
      navigate(
        `/mobile-print/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}`,
      );
    } else {
      navigate(
        `/print-receipt/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}&autoprint=1`,
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-row justify-between items-start gap-4 p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            {t("orders.orderDetails")}
          </h3>
          <div className="flex flex-row items-center gap-2">

            {order && (
              <button
                onClick={handlePrintOrder}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium cursor-pointer"
                title={t("orders.printOrder")}
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">{t("orders.print")}</span>
              </button>
            )}
            {order && (userRole === "owner" || userRole === "admin") && (
              <button
                onClick={() => {
                  onClose();
                  navigate(`/orders/edit/${order._id}`);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium shadow-sm cursor-pointer"
                title={t("orders.editOrder")}
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {t("common.edit")}
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-slate-500">{t("orders.loadingDetails")}</p>
            </div>
          ) : order ? (
            <>
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    {t("orders.orderNumber")}
                  </p>
                  <p className="font-bold text-blue-800">{order.orderNumber}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1">
                    {t("orders.status")}
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                      order.orderStatus,
                    )}`}
                  >
                    {getTranslatedStatus(order.orderStatus)}
                  </span>
                </div>
              </div>

              {/* Store & Date Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Store className="w-4 h-4" />
                  <span>
                    {order.storefrontId?.locationName ||
                      order.storefrontId?.storefrontName ||
                      "-"}
                  </span>
                  <span className="text-xs text-slate-400">
                    (
                    {order.storefrontId?.locationCode ||
                      order.storefrontId?.storefrontCode ||
                      "-"}
                    )
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </div>

              {/* Sold By & Credit Person Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {order.soldBy && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle className="w-4 h-4 text-purple-600" />
                      <p className="text-xs text-purple-600 font-medium">
                        {t("orders.soldBy")}
                      </p>
                    </div>
                    <p className="font-bold text-purple-800">
                      {order.soldBy.name}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {order.soldBy.role}
                    </p>
                  </div>
                )}
                {order.creditPersonId &&
                  typeof order.creditPersonId === "object" && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-orange-600" />
                        <p className="text-xs text-orange-600 font-medium">
                          {t("orders.customer")}
                        </p>
                      </div>
                      <p className="font-bold text-orange-800">
                        {order.creditPersonId.name}
                      </p>
                      <p className="text-xs text-orange-600 mt-1">
                        {order.creditPersonId.phone}
                      </p>
                    </div>
                  )}
              </div>

              {/* Note */}
              {order.note && (
                <div className="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-xs text-yellow-600 font-medium mb-1">
                    {t("orders.note")}
                  </p>
                  <p className="text-sm text-yellow-800">{order.note}</p>
                </div>
              )}

              {/* Products */}
              <div className="mb-6">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {t("orders.orderItems")}
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 text-left font-medium text-slate-600">
                          {t("orders.product")}
                        </th>
                        <th className="p-3 text-center font-medium text-slate-600">
                          {t("orders.qty")}
                        </th>
                        <th className="p-3 text-right font-medium text-slate-600">
                          {t("orders.unitPrice")}
                        </th>
                        <th className="p-3 text-right font-medium text-slate-600">
                          {t("orders.subTotal")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.ordersProducts?.map((item, index) => (
                        <tr key={item._id || index}>
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-slate-800">
                                {item.inventoryId?.productName || t("orders.unknownProduct")}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.inventoryId?.productCode}
                              </p>
                            </div>
                          </td>
                          <td className="p-3 text-center font-medium">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right text-slate-600">
                            {item.unitPrice?.toLocaleString()} MMK
                          </td>
                          <td className="p-3 text-right font-medium text-slate-800">
                            {(
                              item.quantity * (item.unitPrice || 0)
                            ).toLocaleString()}{" "}
                            MMK
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {t("orders.paymentSummary")}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("orders.subTotal")}</span>
                    <span>{order.subTotal?.toLocaleString()} MMK</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t("orders.tax")}</span>
                      <span>{order.tax?.toLocaleString()} MMK</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t("orders.discount")}</span>
                      <span>-{order.discount?.toLocaleString()} MMK</span>
                    </div>
                  )}
                  {order.discount === 0 &&
                    order.finalAmount > order.subTotal && (
                      <div className="flex justify-between text-green-600">
                        <span>{t("orders.markup")}</span>
                        <span>
                          {(
                            order.finalAmount - order.subTotal
                          ).toLocaleString()}{" "}
                          MMK
                        </span>
                      </div>
                    )}
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>{t("orders.finalAmount")}</span>
                    <span>{order.finalAmount?.toLocaleString()} MMK</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>{t("orders.paidAmount")}</span>
                    <span>{order.paidAmount?.toLocaleString()} MMK</span>
                  </div>
                  {order.extraChange > 0 && (
                    <div className="flex justify-between text-blue-600 font-medium">
                      <span>{t("orders.change")}</span>
                      <span>{order.extraChange?.toLocaleString()} MMK</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-slate-500">{t("orders.paymentType")}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${getPaymentTypeColor(
                        order.paymentType,
                      )}`}
                    >
                      {getTranslatedPaymentType(order.paymentType)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("orders.paymentMethod")}</span>
                    <span className="font-medium">
                      {getTranslatedPaymentMethod(order.paymentMethod)}
                    </span>
                  </div>
                  {order.paymentType === "credit" && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">{t("creditOrders.status")}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getCreditPaymentStatusColor(
                          getCreditPaymentStatus(order),
                        )}`}
                      >
                        {getTranslatedCreditStatus(getCreditPaymentStatus(order))}
                      </span>
                    </div>
                  )}
                  {order.remainingBalance !== undefined &&
                    order.remainingBalance > 0 && (
                      <div className="flex justify-between text-orange-600 font-medium">
                        <span>{t("orders.remainingBalance")}</span>
                        <span>
                          {order.remainingBalance?.toLocaleString()} MMK
                        </span>
                      </div>
                    )}

                  {/* Credit Order Payment Action Card */}
                  {order.paymentType === "credit" && (
                    <div className="mt-4 pt-3 border-t border-gray-150">
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                        <div>
                          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                            {t("orders.remainingBalance") || "Remaining Balance"}
                          </div>
                          <div className="text-xl font-black text-amber-950 mt-0.5">
                            {remainingBalance.toLocaleString()}{" "}
                            <span className="text-xs font-bold text-amber-700">MMK</span>
                          </div>
                          <div className="text-[11px] text-amber-700 mt-1 font-medium">
                            {remainingBalance > 0
                              ? (isMy
                                ? "ဤအော်ဒါအတွက် အကြွေးဆပ်ငွေ တိုက်ရိုက်ပေးသွင်းနိုင်ပါသည်"
                                : "Record credit payments directly for this order")
                              : (isMy
                                ? "ဤအော်ဒါအတွက် အကြွေးအားလုံး အပြည့်ပေးချေပြီးပါပြီ"
                                : "All credit for this order is fully settled")}
                          </div>
                        </div>
                        {remainingBalance > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentAmount(remainingBalance);
                              setShowPaymentModal(true);
                            }}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{isMy ? "အကြွေးဆပ်မည်" : "Add Payment Record"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Add Payment Modal Overlay */}
      {showPaymentModal && order && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <CreditCard className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                    {isMy ? "အကြွေးပေးချေမှုမှတ်တမ်း ထည့်မည်" : "Add Payment Record"}
                  </h4>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    {order.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddPaymentRecord} className="p-5 flex flex-col gap-4">
              {/* Customer & Order Summary Badge */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col gap-1.5 text-xs">
                {order.creditPersonId && typeof order.creditPersonId === "object" && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">{t("orders.customer")}:</span>
                    <span className="font-bold text-slate-800">{order.creditPersonId.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">{t("orders.finalAmount")}:</span>
                  <span className="font-bold text-slate-800">{order.finalAmount?.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">{t("orders.paidAmount")}:</span>
                  <span className="font-bold text-emerald-600">{order.paidAmount?.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-amber-800 font-bold">{t("orders.remainingBalance")}:</span>
                  <span className="font-extrabold text-amber-800 text-sm">{remainingBalance.toLocaleString()} MMK</span>
                </div>
              </div>

              {/* Payment Amount */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {t("creditDetail.amount") || "Payment Amount (MMK)"} <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(remainingBalance)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    {isMy
                      ? `လက်ကျန်အပြည့်ဆပ်မည် (${remainingBalance.toLocaleString()} MMK)`
                      : `Full (${remainingBalance.toLocaleString()} MMK)`}
                  </button>
                </div>
                <input
                  type="number"
                  min="1"
                  max={remainingBalance}
                  required
                  value={paymentAmount || ""}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder={isMy ? "ပေးသွင်းမည့် ငွေပမာဏ ရိုက်ထည့်ပါ..." : "Enter payment amount..."}
                  className="w-full border border-slate-200 rounded-xl p-3 text-base font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("creditDetail.paymentMethod") || "Payment Method"} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all cursor-pointer"
                >
                  <option value="cash">{isMy ? "ငွေသား (Cash)" : "Cash"}</option>
                  <option value="kpay">KBZ Pay</option>
                  <option value="wavepay">Wave Pay</option>
                  <option value="ayapay">AYA Pay</option>
                  <option value="uabpay">UAB Pay</option>
                  <option value="bank_transfer">{isMy ? "ဘဏ်လွှဲ (Bank Transfer)" : "Bank Transfer"}</option>
                </select>
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isMy ? "မှတ်ချက် (ရွေးချယ်ရန်)" : "Notes (Optional)"}
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder={isMy ? "ပေးချေမှုမှတ်ချက် ရိုက်ထည့်ပါ..." : "Enter note or reference..."}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isMy ? "မလုပ်တော့ပါ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment || !paymentAmount || paymentAmount <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                >
                  {isSubmittingPayment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{isMy ? "သိမ်းဆည်းနေသည်..." : "Recording..."}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{isMy ? "ငွေပေးချေမှု အတည်ပြုမည်" : "Record Payment"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
