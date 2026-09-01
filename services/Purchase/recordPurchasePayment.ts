import axios from "../axios";
import { PurchasePaymentRecord } from "../../types";

export interface RecordPurchasePaymentPayload {
  paidAmount: number;
  paymentMethod?: "cash" | "kpay" | "wave" | "bank_transfer" | "other";
  notes?: string;
  paymentDate?: string;
}

interface RecordPurchasePaymentResponse {
  success: boolean;
  message: string;
  data?: {
    paymentRecord: PurchasePaymentRecord;
    purchase: any;
  };
}

export const recordPurchasePayment = async (
  purchaseId: string,
  payload: RecordPurchasePaymentPayload
): Promise<RecordPurchasePaymentResponse> => {
  try {
    const response = await axios.post(
      `/purchase/${purchaseId}/payments`,
      payload
    );
    return response.data;
  } catch (error: any) {
    console.error("Error recording purchase payment:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to record purchase payment",
    };
  }
};
