import axios from "../axios";

export interface UpdateBatchExpiryParams {
  inventoryId: string;
  locationId: string;
  locationType: "warehouse" | "storefront";
  batchNumber: string;
  expiryDate: string | null;
}

interface UpdateBatchExpiryResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updateBatchExpiry = async (
  params: UpdateBatchExpiryParams
): Promise<UpdateBatchExpiryResponse> => {
  try {
    const response = await axios.patch("/inventory/batch/expiry", params);
    return response.data;
  } catch (error: any) {
    console.error("Error updating batch expiry:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update batch expiry date",
    };
  }
};
