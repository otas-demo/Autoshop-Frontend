import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Loader2, CreditCard, DollarSign, Store } from "lucide-react";
import { PaidOrdersReportResponse } from "../../services/Reports/fetchPaidOrdersReport";
import { getPaymentMethodLabel } from "../Orders/orderUtils";
import { COLORS, PAYMENT_METHOD_COLORS } from "./reportUtils";
import { useLanguage } from "../../context/LanguageContext";

interface PaidOrdersTabProps {
  paidOrdersReport: PaidOrdersReportResponse | null;
  loading: boolean;
}

export const PaidOrdersTab: React.FC<PaidOrdersTabProps> = ({
  paidOrdersReport,
  loading,
}) => {
  const { t } = useLanguage();
  const paymentMethodChartData =
    paidOrdersReport?.success && paidOrdersReport.data.paymentMethods.length > 0
      ? paidOrdersReport.data.paymentMethods.map((pm) => ({
          name: getPaymentMethodLabel(pm.paymentMethod),
          value: pm.totalPaidAmount,
          orderCount: pm.orderCount,
        }))
      : [];

  if (loading) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-600">{t("creditDetail.loading")}</p>
      </div>
    );
  }

  if (!paidOrdersReport?.success) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center">
        <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No paid orders data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Paid Orders Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Paid Amount */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <DollarSign className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Paid Amount
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {paidOrdersReport.data.totals.totalPaidAmount.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        {/* Total Final Amount */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <CreditCard className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Final Amount
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {paidOrdersReport.data.totals.totalFinalAmount.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        {/* Total Paid Orders */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Store className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Paid Orders
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {paidOrdersReport.data.totals.totalOrderCount}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Pie Chart */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-[#2216a8] mb-4 flex items-center gap-2 text-sm sm:text-base">
            <CreditCard className="w-5 h-5" />
            Payment Methods Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentMethodChartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {paymentMethodChartData.map((entry, index) => {
                  const methodName = entry.name.toLowerCase();
                  const color =
                    PAYMENT_METHOD_COLORS[methodName] ||
                    COLORS[index % COLORS.length];
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString()} MMK`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods Table */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#2216a8] font-bold text-sm sm:text-base">
            <CreditCard className="w-5 h-5" />
            <span>Payment Methods Breakdown</span>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500">
                  <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 w-16">No</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Payment Method</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Orders</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Paid Amount</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Final Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paidOrdersReport.data.paymentMethods.map((pm, index) => {
                    const methodName = pm.paymentMethod.toLowerCase();
                    const color = PAYMENT_METHOD_COLORS[methodName] || "#6366f1";
                    return (
                      <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                        {/* No */}
                        <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        {/* Payment Method */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                              {getPaymentMethodLabel(pm.paymentMethod)}
                            </span>
                          </div>
                        </td>

                        {/* Orders */}
                        <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                          {pm.orderCount.toLocaleString()}
                        </td>

                        {/* Paid Amount */}
                        <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                          {pm.totalPaidAmount.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                        </td>

                        {/* Final Amount */}
                        <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                          {pm.totalFinalAmount.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-gray-150">
                  <tr className="font-bold text-slate-800">
                    <td className="px-4 py-4 text-center text-xs text-slate-400">-</td>
                    <td className="px-4 py-4 text-xs uppercase tracking-wider">Total</td>
                    <td className="px-4 py-4 text-right text-xs">
                      {paidOrdersReport.data.totals.totalOrderCount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-black text-[#2216a8]">
                      {paidOrdersReport.data.totals.totalPaidAmount.toLocaleString()} MMK
                    </td>
                    <td className="px-4 py-4 text-right text-xs font-black text-[#2216a8]">
                      {paidOrdersReport.data.totals.totalFinalAmount.toLocaleString()} MMK
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
