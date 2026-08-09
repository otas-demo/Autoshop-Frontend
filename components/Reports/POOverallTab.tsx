import React from "react";
import { DollarSign, FileText, ShieldCheck, Truck } from "lucide-react";
import {
  PurchaseReportOverall,
  PurchaseReportStatus,
  PurchaseReportSupplier
} from "../../services/Reports/fetchPurchaseReport";

interface POOverallTabProps {
  overall: PurchaseReportOverall;
  statusBreakdown: PurchaseReportStatus[];
  supplierBreakdown: PurchaseReportSupplier[];
  getStatusColor: (status: string) => string;
}

export const POOverallTab: React.FC<POOverallTabProps> = ({
  overall,
  statusBreakdown,
  supplierBreakdown,
  getStatusColor
}) => {
  const pendingPOCount = statusBreakdown.find(s => s._id?.toLowerCase() === "pending")?.count || 0;
  const arrivedPOCount = statusBreakdown.find(s => s._id?.toLowerCase() === "arrived")?.count || 0;

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Purchase Value */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <DollarSign className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Total Purchase Value
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {overall.totalAmount.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        {/* Total POs Created */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <FileText className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Total PO Created
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {overall.count.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">Orders</span>
            </p>
          </div>
        </div>

        {/* Total Arrived Orders */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Total Arrived Orders
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {arrivedPOCount.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">Orders</span>
            </p>
          </div>
        </div>

        {/* Pending Purchase Orders */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Truck className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              Pending PO
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {pendingPOCount}{" "}
              <span className="text-xs font-semibold text-slate-400">Pending</span>
            </p>
          </div>
        </div>
      </div>

      {/* Status Breakdown & Top Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-[#2216a8]" />
              Order Status Breakdown
            </h3>
            <div className="divide-y divide-gray-100">
              {statusBreakdown.length === 0 ? (
                <p className="text-slate-400 py-4 text-center text-xs">No status data available</p>
              ) : (
                statusBreakdown.map((status) => (
                  <div key={status._id} className="py-3 flex items-center justify-between text-xs">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(status._id)}`}>
                      {status._id.toUpperCase()}
                    </span>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{status.totalAmount.toLocaleString()} MMK</p>
                      <p className="text-[10px] text-slate-400">{status.count} orders</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-[#2216a8]" />
            Top Suppliers by Value
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b">
                  <th className="p-3 text-left">Supplier Name</th>
                  <th className="p-3 text-center">Total Orders</th>
                  <th className="p-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {supplierBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-400">
                      No supplier data for this range.
                    </td>
                  </tr>
                ) : (
                  supplierBreakdown.map((supplier) => (
                    <tr key={supplier.supplierId} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-semibold text-slate-800">{supplier.supplierName}</td>
                      <td className="p-3 text-center font-semibold text-slate-700">{supplier.count}</td>
                      <td className="p-3 text-right font-bold text-slate-800">{supplier.totalAmount.toLocaleString()} MMK</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
