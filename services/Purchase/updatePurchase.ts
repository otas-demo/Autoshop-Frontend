import axios from "../axios";
import { CreatePurchasePayload } from "./createPurchase";

interface UpdatePurchaseResponse {
  success: boolean;
  message: string;
  data: any;
}

/**
 * Update an existing Purchase Order (PO) via API
 * @param {string} id - Purchase Order ID
 * @param {CreatePurchasePayload} payload
 * @returns {Promise<UpdatePurchaseResponse>} Response from API
 */
export const updatePurchase = async (
  id: string,
  payload: CreatePurchasePayload
): Promise<UpdatePurchaseResponse> => {
  try {
    const response = await axios.put(`/purchase/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating purchase order:", error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${error.response.status}`;
        throw new Error(errorMessage);
      }
      if (error.request) {
        throw new Error(
          "Network error: Unable to reach the API. Please check if the API server is running."
        );
      }
    }

    throw error;
  }
};
