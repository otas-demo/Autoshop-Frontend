import axios from "../axios";
import { Supplier } from "../../types";

interface FetchSupplierByIdResponse {
  success: boolean;
  message: string;
  data: Supplier;
}

export const fetchSupplierById = async (
  id: string
): Promise<FetchSupplierByIdResponse> => {
  try {
    const response = await axios.get(`/supplier-profile/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching supplier by ID:", error);
    throw error;
  }
};
