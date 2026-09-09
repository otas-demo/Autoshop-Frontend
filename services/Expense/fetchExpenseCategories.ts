import axios from "../axios";

interface FetchExpenseCategoriesResponse {
  success: boolean;
  message: string;
  data: string[];
}

/**
 * Fetch all distinct expense categories from API
 * @returns {Promise<FetchExpenseCategoriesResponse>} Response from API
 */
export const fetchExpenseCategories = async (): Promise<FetchExpenseCategoriesResponse> => {
  try {
    const response = await axios.get("/expense/categories");
    return response.data;
  } catch (error: any) {
    console.error("Error fetching expense categories:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch expense categories",
      data: [],
    };
  }
};
