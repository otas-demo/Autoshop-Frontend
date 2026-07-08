import axios from "../axios";

export interface CreateProductPayload {
  productName: string;
  productCode: string;
  SKU?: string;
  category?: string;
  buyingPrice: number;
  sellingPrice: number;
  wholesalePrices?: { quantity: number; price: number }[];
  quantity?: number;
  description?: string;
}

interface CreateProductResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Create a new product via API
 * @param {CreateProductPayload} productData - Product data matching API schema
 * @returns {Promise<CreateProductResponse>} Response from API
 */
export const createProduct = async (
  productData: CreateProductPayload
): Promise<CreateProductResponse> => {
  try {
    const response = await axios.post("/inventory", productData);

    return response.data;
  } catch (error) {
    console.error("Error creating product:", error);

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
