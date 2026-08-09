import axios from "../axios";
import { Product } from "../../types";

interface FetchProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/**
 * Fetch products from API
 * @returns {Promise<FetchProductsResponse>} Response from API with products data
 */
export const fetchProducts = async (
  page?: number,
  limit?: number,
  category?: string,
  status?: string,
  search?: string
): Promise<FetchProductsResponse> => {
  try {
    const response = await axios.get("/inventory", {
      params: { 
        page, 
        limit,
        category: category && category !== "All" ? category : undefined,
        status: status && status !== "all" ? status : undefined,
        search: search || undefined
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers["content-type"] &&
        error.response.headers["content-type"].includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct.`,
        );
      }

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `HTTP error! status: ${error.response.status}`;
        throw new Error(errorMessage);
      }

      if (error.request) {
        throw new Error(
          "Network error: Unable to reach the API. Please check if the API server is running.",
        );
      }
    }

    throw error;
  }
};
