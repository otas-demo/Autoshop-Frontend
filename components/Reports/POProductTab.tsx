import React from "react";
import { Package } from "lucide-react";
import { PurchaseReportProduct } from "../../services/Reports/fetchPurchaseReport";

interface POProductTabProps {
  productBreakdown: PurchaseReportProduct[];
  showAllProducts: boolean;
  setShowAllProducts: (show: boolean) => void;
}

export const POProductTab: React.FC<POProductTabProps> = ({
  productBreakdown,
  showAllProducts,
  setShowAllProducts
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#2216a8]" />
          {showAllProducts ? "All Purchased Products" : "Top Purchased Products"}
        </h3>
        {productBreakdown.length > 10 && (
          <button
            onClick={() => setShowAllProducts(!showAllProducts)}
            className="text-xs font-bold text-[#2216a8] hover:underline px-3 py-1.5 rounded-full border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition cursor-pointer"
          >
            {showAllProducts ? "Show Top 10" : "Show All Products"}
          </button>
        )}
      </div>
      <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <th className="p-3 text-left bg-slate-50">No</th>
              <th className="p-3 text-left bg-slate-50">Product Code</th>
              <th className="p-3 text-left bg-slate-50">Product Name</th>
              <th className="p-3 text-center bg-slate-50">Quantity Purchased</th>
              <th className="p-3 text-right bg-slate-50">Total Cost Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productBreakdown.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No product data for this range.
                </td>
              </tr>
            ) : (
              (showAllProducts ? productBreakdown : productBreakdown.slice(0, 10)).map((product, index) => (
                <tr key={product._id} className="hover:bg-slate-50/50 transition">
                  <td className="p-3 font-mono text-slate-600 font-medium">{index + 1}</td>
                  <td className="p-3 font-mono text-slate-600 font-medium">{product.productCode || "-"}</td>
                  <td className="p-3 font-semibold text-slate-800">{product.productName}</td>
                  <td className="p-3 text-center">
                    <span className="bg-indigo-50 text-[#2216a8] px-3 py-1 rounded-full font-bold">
                      {product.totalQuantity}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800">{product.totalCost.toLocaleString()} MMK</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
