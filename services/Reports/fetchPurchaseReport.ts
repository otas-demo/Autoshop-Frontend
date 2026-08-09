import axios from "../axios";

export interface PurchaseReportOverall {
  totalAmount: number;
  count: number;
  averageAmount: number;
}

export interface PurchaseReportStatus {
  _id: string;
  count: number;
  totalAmount: number;
}

export interface PurchaseReportSupplier {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  totalAmount: number;
  count: number;
}

export interface PurchaseReportProduct {
  _id: string;
  productName: string;
  productCode: string;
  totalQuantity: number;
  totalCost: number;
}

export interface PurchaseReportResponse {
  success: boolean;
  message?: string;
  data: {
    overall: PurchaseReportOverall;
    statusBreakdown: PurchaseReportStatus[];
    supplierBreakdown: PurchaseReportSupplier[];
    productBreakdown: PurchaseReportProduct[];
  };
}

export const fetchPurchaseReport = async (
  startDate?: string | null,
  endDate?: string | null
): Promise<PurchaseReportResponse> => {
  try {
    let url = "/purchase/report";
    const params = new URLSearchParams();

    if (startDate) {
      params.append("startDate", startDate);
    }
    if (endDate) {
      params.append("endDate", endDate);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching purchase report:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch purchase report",
      data: {
        overall: { totalAmount: 0, count: 0, averageAmount: 0 },
        statusBreakdown: [],
        supplierBreakdown: [],
        productBreakdown: [],
      },
    };
  }
};
