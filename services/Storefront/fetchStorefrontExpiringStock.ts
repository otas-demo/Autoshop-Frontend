import axios from "../axios";
import { WarehouseStockItem } from "../Warehouse/fetchWarehouseStock";

interface FetchStorefrontExpiringStockResponse {
  success: boolean;
  message: string;
  data: WarehouseStockItem[];
}

export const fetchStorefrontExpiringStock = async (
  storefrontId: string,
  days: number = 30
): Promise<FetchStorefrontExpiringStockResponse> => {
  try {
    const url = `/storefront-inventory/${storefrontId}/expiring-stock?days=${days}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching expiring storefront stock:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch expiring storefront stock",
      data: [],
    };
  }
};
