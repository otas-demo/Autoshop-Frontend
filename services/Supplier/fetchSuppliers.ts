import axios from "../axios";
import { Supplier } from "../../types";

export interface SupplierPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface FetchSuppliersResponse {
  success: boolean;
  message: string;
  data: Supplier[];
  pagination?: SupplierPagination;
}

/**
 * Fetch supplier profiles via API with optional pagination and search
 * @param {boolean} isDeleted - Optional: Set to true to fetch soft-deleted suppliers
 * @param {number} page - Optional: Page number
 * @param {number} limit - Optional: Number of items per page
 * @param {string} search - Optional: Search keyword (name or contact)
 * @returns {Promise<FetchSuppliersResponse>} Response from API
 */
export const fetchSuppliers = async (
  isDeleted?: boolean,
  page?: number,
  limit?: number,
  search?: string
): Promise<FetchSuppliersResponse> => {
  try {
    const params = new URLSearchParams();
    if (isDeleted !== undefined) {
      params.append("isDeleted", String(isDeleted));
    }
    if (page !== undefined) {
      params.append("page", String(page));
    }
    if (limit !== undefined) {
      params.append("limit", String(limit));
    }
    if (search && search.trim()) {
      params.append("search", search.trim());
    }
    const queryString = params.toString();
    const url = queryString ? `/supplier-profile?${queryString}` : "/supplier-profile";
    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    console.error("Error fetching suppliers:", error);

    if (axios.isAxiosError(error)) {
      if (
        error.response &&
        error.response.headers["content-type"] &&
        error.response.headers["content-type"].includes("text/html")
      ) {
        throw new Error(
          `API endpoint not found. Please check if the API is running and the endpoint "${error.config?.url}" is correct.`
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
          "Network error: Unable to reach the API. Please check if the API server is running."
        );
      }
    }

    throw error;
  }
};
