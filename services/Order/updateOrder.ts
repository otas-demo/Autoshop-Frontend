import axios from "../axios";
import { Order } from "./fetchOrders";

interface UpdateOrderPayload {
  ordersProducts: {
    inventoryId: string;
    quantity: number;
    unitPrice: number;
  }[];
  subTotal: number;
  tax: number;
  discount: number;
  finalAmount: number;
  extraChange: number;
  paidAmount: number;
}

interface UpdateOrderResponse {
  success: boolean;
  message: string;
  data?: Order;
}

export const updateOrder = async (
  orderId: string,
  payload: UpdateOrderPayload
): Promise<UpdateOrderResponse> => {
  try {
    const response = await axios.patch(`/order/${orderId}`, payload);
    return response.data;
  } catch (error: any) {
    console.error("Error updating order:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update order",
    };
  }
};
