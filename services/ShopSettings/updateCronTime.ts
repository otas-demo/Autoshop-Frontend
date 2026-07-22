import axios from "../axios";

interface UpdateCronTimeResponse {
  success: boolean;
  message: string;
  data: any;
}

export const updateCronTime = async (
  dailyReportTime: string,
  dailyReportEnabled: boolean,
): Promise<UpdateCronTimeResponse> => {
  const response = await axios.put("/shop-settings/cron-time", {
    dailyReportTime,
    dailyReportEnabled,
  });
  return response.data;
};
