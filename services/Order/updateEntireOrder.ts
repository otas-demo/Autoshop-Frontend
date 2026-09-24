import axios from "../axios";

export interface UpdateOrderProduct {
  inventoryId: string;
  quantity: number;
  unitPrice?: number;
}

export interface UpdateEntireOrderRequest {
  ordersProducts: UpdateOrderProduct[];
  subTotal?: number;
  tax?: number;
  discount?: number;
  finalAmount?: number;
  paidAmount: number;
  paymentType: "credit" | "paid";
  paymentMethod: string;
  creditPersonId?: string | null;
  note?: string;
  orderDate?: string;
}

export interface UpdateEntireOrderResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateEntireOrder = async (
  orderId: string,
  data: UpdateEntireOrderRequest
): Promise<UpdateEntireOrderResponse> => {
  try {
    const response = await axios.patch(`/order/${orderId}`, data);
    return response.data;
  } catch (error: any) {
    console.error("Error updating order:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update order",
    };
  }
};
