import React from "react";
import { Loader2, Receipt, DollarSign, AlertCircle, CreditCard, TrendingUp } from "lucide-react";
import { CreditOrdersReportResponse } from "../../services/Reports/fetchCreditOrdersReport";
import { getPaymentMethodLabel } from "../Orders/orderUtils";
import { PAYMENT_METHOD_COLORS } from "./reportUtils";
import { useLanguage } from "../../context/LanguageContext";

interface CreditOrdersTabProps {
  creditOrdersReport: CreditOrdersReportResponse | null;
  loading: boolean;
}

export const CreditOrdersTab: React.FC<CreditOrdersTabProps> = ({
  creditOrdersReport,
  loading,
}) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-600">{t("creditDetail.loading")}</p>
      </div>
    );
  }

  if (!creditOrdersReport?.success) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center">
        <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-600">No credit orders data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credit Orders Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Final Amount */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Receipt className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Final Amount
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {creditOrdersReport.data.totals.totalFinalAmount.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

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
              {creditOrdersReport.data.totals.totalPaidAmount.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <AlertCircle className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Remaining Balance
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {creditOrdersReport.data.totals.totalRemainingBalance.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        {/* Credit Orders */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <CreditCard className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Credit Orders
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {creditOrdersReport.data.totals.orderCount}{" "}
              <span className="text-xs font-semibold text-slate-400">({creditOrdersReport.data.totals.creditRecordCount} rec)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Initial Payments */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-[#2216a8] font-bold text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span>Initial Payments</span>
            </div>
            <span className="text-xs text-slate-400 font-bold bg-slate-50 px-3 py-1 rounded-full border border-gray-100">
              Total: {creditOrdersReport.data.totals.totalInitialPaidAmount.toLocaleString()} MMK
            </span>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500">
                  <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 w-16">No</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Payment Method</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Orders</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {creditOrdersReport.data.initialPayments.length > 0 ? (
                    creditOrdersReport.data.initialPayments.map((pm, index) => {
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

                          {/* Amount */}
                          <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                            {pm.totalPaidAmount.toLocaleString()}{" "}
                            <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs font-medium">
                        No initial payments found
                      </td>
                    </tr>
                  )}
                </tbody>
                {creditOrdersReport.data.initialPayments.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-gray-150">
                    <tr className="font-bold text-slate-800">
                      <td className="px-4 py-4 text-center text-xs text-slate-400">-</td>
                      <td className="px-4 py-4 text-xs uppercase tracking-wider">Total</td>
                      <td className="px-4 py-4 text-right text-xs">
                        {creditOrdersReport.data.initialPayments.reduce((sum, pm) => sum + pm.orderCount, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-black text-[#2216a8]">
                        {creditOrdersReport.data.totals.totalInitialPaidAmount.toLocaleString()} MMK
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Credit Payments */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-[#2216a8] font-bold text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              <span>Credit Payments</span>
            </div>
            <span className="text-xs text-slate-400 font-bold bg-slate-50 px-3 py-1 rounded-full border border-gray-100">
              Total: {creditOrdersReport.data.totals.totalCreditPaidAmount.toLocaleString()} MMK
            </span>
          </div>

          <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500">
                  <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 w-16">No</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Payment Method</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Records</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {creditOrdersReport.data.creditPayments.length > 0 ? (
                    creditOrdersReport.data.creditPayments.map((pm, index) => {
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

                          {/* Records */}
                          <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                            {pm.recordCount.toLocaleString()}
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                            {pm.totalPaidAmount.toLocaleString()}{" "}
                            <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-xs font-medium">
                        No credit payments found
                      </td>
                    </tr>
                  )}
                </tbody>
                {creditOrdersReport.data.creditPayments.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-gray-150">
                    <tr className="font-bold text-slate-800">
                      <td className="px-4 py-4 text-center text-xs text-slate-400">-</td>
                      <td className="px-4 py-4 text-xs uppercase tracking-wider">Total</td>
                      <td className="px-4 py-4 text-right text-xs">
                        {creditOrdersReport.data.creditPayments.reduce((sum, pm) => sum + pm.recordCount, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-black text-[#2216a8]">
                        {creditOrdersReport.data.totals.totalCreditPaidAmount.toLocaleString()} MMK
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

