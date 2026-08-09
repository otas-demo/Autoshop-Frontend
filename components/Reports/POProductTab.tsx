import React, { useState, useEffect } from "react";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [showAllProducts]);

  const totalPages = Math.ceil(productBreakdown.length / itemsPerPage);
  const paginatedProducts = showAllProducts
    ? productBreakdown.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : productBreakdown.slice(0, 10);

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
      <div className="overflow-x-auto max-h-[390px] overflow-y-auto">
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
              paginatedProducts.map((product, index) => {
                const actualIndex = showAllProducts
                  ? (currentPage - 1) * itemsPerPage + index + 1
                  : index + 1;
                return (
                  <tr key={product._id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-mono text-slate-600 font-medium">{actualIndex}</td>
                    <td className="p-3 font-mono text-slate-600 font-medium">{product.productCode || "-"}</td>
                    <td className="p-3 font-semibold text-slate-800">{product.productName}</td>
                    <td className="p-3 text-center">
                      <span className="bg-indigo-50 text-[#2216a8] px-3 py-1 rounded-full font-bold">
                        {product.totalQuantity}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-800">{product.totalCost.toLocaleString()} MMK</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAllProducts && productBreakdown.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t mt-4">
          <div className="text-xs text-slate-600 font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, productBreakdown.length)} of{" "}
            {productBreakdown.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 hover:bg-slate-100 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-xs font-semibold text-slate-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
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
