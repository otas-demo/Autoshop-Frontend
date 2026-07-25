import React from "react";
import { Store, DollarSign, Wallet, FileText, CheckCircle } from "lucide-react";
import { SaleReportResponse } from "../../services/Reports/fetchSaleReport";
import { useLanguage } from "../../context/LanguageContext";

interface OverallReportTabProps {
  displayReport: {
    finalAmount: number;
    paidAmount: number;
    subTotal: number;
    tax: number;
    discount: number;
    orderCount: number;
    creditOrderCount: number;
    paidOrderCount: number;
  };
  saleReports: SaleReportResponse[];
  allStorefrontsReport: SaleReportResponse | null;
  selectedStorefront: string;
}

export const OverallReportTab: React.FC<OverallReportTabProps> = ({
  displayReport,
  saleReports,
  allStorefrontsReport,
  selectedStorefront,
}) => {
  const { t } = useLanguage();
  
  // Determine which reports to show in the breakdown table
  const reportsToShow =
    selectedStorefront === "all"
      ? saleReports.filter((report) => report.success)
      : saleReports.filter(
          (report) =>
            report.success && report.data.storefront._id === selectedStorefront,
        );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <DollarSign className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              {t("reports.totalSales")}
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {displayReport.finalAmount.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        {/* Total Profit (Paid Amount) */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Wallet className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#2216a8] uppercase tracking-wider">
              {t("reports.totalProfit")}
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {displayReport.paidAmount.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        {/* Outstanding Credits */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#2216a8] uppercase tracking-wider">
              {t("reports.outstandingCredits")}
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {(displayReport.finalAmount - displayReport.paidAmount).toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <FileText className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#2216a8] uppercase tracking-wider">
              {t("reports.totalOrders")}
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {displayReport.orderCount}
            </p>
          </div>
        </div>
      </div>

      {/* Storefront Breakdown Table */}
      {reportsToShow.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#2216a8] font-bold text-sm sm:text-base">
            <Store className="w-5 h-5" />
            <span>{t("reports.storefrontStatus")}</span>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
              <table className="w-full text-sm text-left min-w-[900px]">
                <thead className="text-slate-500">
                  <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">No</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Store Front</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Final Amount</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Paid Amount</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Sub Total</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Discount</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Total Orders</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Paid Orders</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Credit Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {reportsToShow.map((report, index) => (
                    <tr key={report.data.storefront._id} className="hover:bg-slate-50/40 transition-colors">
                      {/* No */}
                      <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      {/* Storefront */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {report.data.storefront.locationName || report.data.storefront.storefrontName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {report.data.storefront.locationCode || report.data.storefront.storefrontCode || "Main Store"}
                        </div>
                      </td>

                      {/* Final Amount */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {report.data.report.finalAmount.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                      </td>

                      {/* Paid Amount */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {report.data.report.paidAmount.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                      </td>

                      {/* Sub Total */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {report.data.report.subTotal.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {report.data.report.discount.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                      </td>

                      {/* Total Orders */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {report.data.report.orderCount.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                      </td>

                      {/* Paid Orders */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {report.data.report.paidOrderCount.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                      </td>

                      {/* Credit Orders */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {report.data.report.creditOrderCount.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
