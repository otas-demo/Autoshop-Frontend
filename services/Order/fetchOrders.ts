import axios from "../axios";

export interface OrderProduct {
  inventoryId: {
    _id: string;
    productName: string;
    productCode: string;
    SKU: string;
    profitMargin: number | null;
    profitAmount: number | null;
    id: string;
  };
  quantity: number;
  unitPrice: number;
  _id: string;
}

export interface OrderStorefront {
  _id: string;
  storefrontCode: string;
  storefrontName: string;
  locationCode?: string;
  locationName?: string;
  id?: string;
}

export interface SoldBy {
  _id: string;
  name: string;
  role: string;
}

export interface CreditPerson {
  _id: string;
  name: string;
  phone: string;
  address?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  storefrontId: OrderStorefront;
  ordersProducts: OrderProduct[];
  creditPersonId: CreditPerson | string | null;
  soldBy?: SoldBy;
  subTotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  paidAmount: number;
  extraChange: number;
  orderStatus: string;
  isDeleted: boolean;
  deletedAt: string | null;
  paymentType: "paid" | "credit" | string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  totalPaidAmount?: Record<string, unknown>;
  remainingBalance?: number;
  creditPaymentStatus?: "fully_paid" | "partial_paid" | "unpaid" | string;
  note?: string;
  id?: string;
}

export interface OrdersPagination {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface OrdersSummaryCounts {
  totalCount: number;
  paidCount: number;
  creditCount: number;
}

export interface FetchOrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
  pagination?: OrdersPagination;
  summaryCounts?: OrdersSummaryCounts;
}

export const fetchOrders = async (
  startDate?: string | null,
  endDate?: string | null,
  paymentType?: string | null,
  paymentMethod?: string | null,
  creditPersonId?: string | null,
  page?: number | null,
  limit?: number | null,
  creditStatus?: string | null,
): Promise<FetchOrdersResponse> => {
  try {
    let url = "/order";
    const params = new URLSearchParams();

    // Add paymentType filter if provided
    if (paymentType && paymentType !== "all") {
      params.append("paymentType", paymentType);
    }

    // Add paymentMethod filter if provided
    if (
      paymentMethod &&
      paymentMethod !== "all" &&
      paymentMethod.trim() !== ""
    ) {
      params.append("paymentMethod", paymentMethod);
    }

    // Add creditPersonId filter if provided
    if (creditPersonId && creditPersonId.trim() !== "") {
      params.append("creditPersonId", creditPersonId);
    }

    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }

    if (page && page > 0) {
      params.append("page", String(page));
    }
    if (limit && limit > 0) {
      params.append("limit", String(limit));
    }
    if (creditStatus && creditStatus !== "all") {
      params.append("creditStatus", creditStatus);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch orders",
      data: [],
    };
  }
};
