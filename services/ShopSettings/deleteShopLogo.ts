import axios from "../axios";
import { ShopSettings } from "./fetchShopSettings";

interface DeleteShopLogoResponse {
  success: boolean;
  message: string;
  data?: ShopSettings;
}

export const deleteShopLogo = async (slot: number = 1): Promise<DeleteShopLogoResponse> => {
  try {
    const response = await axios.delete(`/shop-settings/logo/${slot}`);
    return response.data;
  } catch (error: unknown) {
    console.error("Error deleting shop logo:", error);
    const message =
      axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : "Failed to delete shop logo";
    throw new Error(message);
  }
};
