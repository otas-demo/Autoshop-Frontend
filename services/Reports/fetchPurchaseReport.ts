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

export interface LowQuantityProduct {
  _id: string;
  productName: string;
  productCode: string;
  reorderPoint: number;
  totalQuantity: number;
  unitOfMeasure: string;
  buyingPrice: number;
  sellingPrice: number;
}

export interface CreditSummary {
  totalCreditAmount: number;
  totalPaid: number;
  totalRemaining: number;
  creditCount: number;
  overdueCount: number;
}

export interface PurchaseReportResponse {
  success: boolean;
  message?: string;
  data: {
    overall: PurchaseReportOverall;
    statusBreakdown: PurchaseReportStatus[];
    supplierBreakdown: PurchaseReportSupplier[];
    productBreakdown: PurchaseReportProduct[];
    creditSummary?: CreditSummary;
    lowQuantityProducts?: LowQuantityProduct[];
    lowQuantityPagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export const fetchPurchaseReport = async (
  startDate?: string | null,
  endDate?: string | null,
  lowStockThreshold?: number,
  lowStockPage?: number,
  lowStockLimit?: number,
  supplierId?: string
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
    if (supplierId) {
      params.append("supplierId", supplierId);
    }
    if (lowStockThreshold !== undefined) {
      params.append("lowStockThreshold", String(lowStockThreshold));
    }
    if (lowStockPage !== undefined) {
      params.append("lowStockPage", String(lowStockPage));
    }
    if (lowStockLimit !== undefined) {
      params.append("lowStockLimit", String(lowStockLimit));
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
        lowQuantityProducts: [],
        lowQuantityPagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
        },
      },
    };
  }
};
