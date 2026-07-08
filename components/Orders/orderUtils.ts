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

