import axios from "../axios";
import { PurchasePaymentRecord } from "../../types";

interface FetchPurchasePaymentsResponse {
  success: boolean;
  message?: string;
  data: PurchasePaymentRecord[];
}

export const fetchPurchasePayments = async (
  purchaseId: string
): Promise<FetchPurchasePaymentsResponse> => {
  try {
    const response = await axios.get(`/purchase/${purchaseId}/payments`);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching purchase payments:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to fetch purchase payments",
      data: [],
    };
  }
};
