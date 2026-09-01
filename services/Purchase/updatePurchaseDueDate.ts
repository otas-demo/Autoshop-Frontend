import axios from "../axios";

interface UpdatePurchaseDueDateResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const updatePurchaseDueDate = async (
  purchaseId: string,
  dueDate: string
): Promise<UpdatePurchaseDueDateResponse> => {
  try {
    const response = await axios.patch(`/purchase/${purchaseId}/due-date`, {
      dueDate,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error updating purchase due date:", error);
    return {
      success: false,
      message:
        error.response?.data?.message || "Failed to update purchase due date",
    };
  }
};
