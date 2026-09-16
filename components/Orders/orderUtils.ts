export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "refunded":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const getPaymentTypeLabel = (paymentType: string) => {
  const labels: Record<string, string> = {
    paid: "Paid",
    credit: "Credit",
  };
  return labels[paymentType?.toLowerCase()] || paymentType;
};

export const getPaymentMethodLabel = (paymentMethod: string) => {
  const labels: Record<string, string> = {
    cash: "Cash",
    kpay: "KBZ Pay",
    kbzpay: "KBZ Pay",
    wavepay: "Wave Pay",
    ayapay: "AYA Pay",
    uabpay: "UAB Pay",
    bank_transfer: "Bank Transfer",
  };
  return labels[paymentMethod?.toLowerCase()] || paymentMethod;
};

export const getPaymentTypeColor = (paymentType: string) => {
  switch (paymentType?.toLowerCase()) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "credit":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export type CreditPaymentStatus = "fully_paid" | "partial_paid" | "unpaid";

export const getCreditPaymentStatus = (order: {
  paidAmount?: number;
  finalAmount?: number;
  remainingBalance?: number;
  creditPaymentStatus?: string;
}): CreditPaymentStatus => {
  if (
    order.creditPaymentStatus === "fully_paid" ||
    order.creditPaymentStatus === "partial_paid" ||
    order.creditPaymentStatus === "unpaid"
  ) {
    return order.creditPaymentStatus as CreditPaymentStatus;
  }

  const finalAmount = order.finalAmount || 0;
  const paidAmount = order.paidAmount || 0;
  const remaining =
    order.remainingBalance !== undefined
      ? order.remainingBalance
      : Math.max(0, finalAmount - paidAmount);

  if (remaining <= 0 || paidAmount >= finalAmount) {
    return "fully_paid";
  }
  if (paidAmount > 0) {
    return "partial_paid";
  }
  return "unpaid";
};

export const getCreditPaymentStatusColor = (status: string) => {
  switch (status) {
    case "fully_paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "partial_paid":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "unpaid":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export const getTranslatedCreditStatus = (
  status: string,
  t?: (key: string) => string,
) => {
  if (t) {
    switch (status) {
      case "fully_paid":
        return t("creditOrders.fullyPaid") || t("orders.paidType") || "Paid";
      case "partial_paid":
        return t("creditOrders.partialPaid") || "Partial Paid";
      case "unpaid":
        return t("creditOrders.unpaid") || "Unpaid";
      default:
        return status;
    }
  }
  switch (status) {
    case "fully_paid":
      return "Paid";
    case "partial_paid":
      return "Partial Paid";
    case "unpaid":
      return "Unpaid";
    default:
      return status;
  }
};


