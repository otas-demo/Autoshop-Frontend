import React from "react";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { LowQuantityProduct } from "../../services/Reports/fetchPurchaseReport";

interface POLowStockTabProps {
  lowQuantityProducts: LowQuantityProduct[];
  lowStockThreshold: number;
  setLowStockThreshold: (threshold: number) => void;
  lowStockPage: number;
  setLowStockPage: React.Dispatch<React.SetStateAction<number>>;
  lowStockPagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const POLowStockTab: React.FC<POLowStockTabProps> = ({
  lowQuantityProducts,
  lowStockThreshold,
  setLowStockThreshold,
  lowStockPage,
  setLowStockPage,
  lowStockPagination
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-5 pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Package className="w-4 h-4 text-red-600" />
          Low Quantity Products Alert (Total Stock &le; {lowStockThreshold})
        </h3>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-500 font-semibold">Alert Threshold:</span>
          <select
            value={lowStockThreshold}
            onChange={(e) => {
              setLowStockThreshold(Number(e.target.value));
              setLowStockPage(1);
            }}
            className="text-xs font-bold bg-white border border-slate-200 rounded-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2216a8] text-slate-700 cursor-pointer shadow-sm"
          >
            <option value={10}>10 or less</option>
            <option value={20}>20 or less</option>
            <option value={50}>50 or less (Default)</option>
            <option value={100}>100 or less</option>
            <option value={200}>200 or less</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b sticky top-0 z-10 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
              <th className="p-3 text-left bg-slate-50">No</th>
              <th className="p-3 text-left bg-slate-50">Product Code</th>
              <th className="p-3 text-left bg-slate-50">Product Name</th>
              <th className="p-3 text-center bg-slate-50">Current Total Stock</th>
              <th className="p-3 text-left bg-slate-50">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lowQuantityProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No products are currently below the chosen threshold ({lowStockThreshold}).
                </td>
              </tr>
            ) : (
              lowQuantityProducts.map((product, index) => (
                <tr key={product._id} className="hover:bg-slate-50/50 transition">
                  <td className="p-3 font-mono text-slate-600 font-medium">
                    {(lowStockPage - 1) * 10 + index + 1}
                  </td>
                  <td className="p-3 font-mono text-slate-600 font-medium">{product.productCode}</td>
                  <td className="p-3 font-semibold text-slate-800">{product.productName}</td>
                  <td className="p-3 text-center">
                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full font-bold">
                      {product.totalQuantity}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-medium">{product.unitOfMeasure}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lowStockPagination.totalItems > 10 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t mt-4">
          <div className="text-xs text-slate-600 font-medium">
            Showing {(lowStockPage - 1) * 10 + 1} to{" "}
            {Math.min(lowStockPage * 10, lowStockPagination.totalItems)} of{" "}
            {lowStockPagination.totalItems} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLowStockPage((prev) => Math.max(prev - 1, 1))}
              disabled={lowStockPage === 1}
              className="p-1.5 hover:bg-slate-100 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page {lowStockPage} of {lowStockPagination.totalPages}
            </span>
            <button
              onClick={() => setLowStockPage((prev) => Math.min(prev + 1, lowStockPagination.totalPages))}
              disabled={lowStockPage === lowStockPagination.totalPages}
              className="p-1.5 hover:bg-slate-100 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
