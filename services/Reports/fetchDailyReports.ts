import axios from "../axios";

export interface DailyReport {
  _id: string;
  date: string;
  period: "daily" | "monthly";
  finalAmount: number;
  paidAmount: number;
  subTotal: number;
  tax: number;
  discount: number;
  totalCardAmount: number;
  totalCashAmount: number;
  orderCount: number;
  creditOrderCount: number;
  paidOrderCount: number;
  totalQuantity: number;
  reportText: string;
  generatedAt: string;
  createdAt: string;
}

export interface DailyReportsResponse {
  success: boolean;
  message: string;
  data: DailyReport[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface LatestReportResponse {
  success: boolean;
  message: string;
  data: DailyReport | null;
}

export const fetchDailyReports = async (
  page = 1,
  limit = 15,
): Promise<DailyReportsResponse> => {
  const response = await axios.get(`/daily-reports?page=${page}&limit=${limit}`);
  return response.data;
};

export const fetchLatestDailyReport = async (): Promise<LatestReportResponse> => {
  const response = await axios.get("/daily-reports/latest");
  return response.data;
};
