import axios from "../axios";
import { WarehouseStockItem } from "./fetchWarehouseStock";

interface FetchExpiringStockResponse {
  success: boolean;
  message: string;
  data: WarehouseStockItem[];
}

export const fetchExpiringStock = async (
  warehouseId: string,
  days: number = 30
): Promise<FetchExpiringStockResponse> => {
  try {
    const url = `/warehouse/${warehouseId}/expiring-stock?days=${days}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching expiring warehouse stock:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch expiring warehouse stock",
      data: [],
    };
  }
};
