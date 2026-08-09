import React, { useState, useEffect } from "react";
import { Product } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { formatExpiryDate, getExpiryStatus, ExpiryStatus } from "../../utils/expiryUtils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface InventoryTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onViewDetails: (productId: string) => void;
  onStatusToggle?: (
    productId: string,
    currentStatus: "active" | "inactive",
  ) => void;
  selectedProductIds?: string[];
  onSelectionChange?: (productId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  showSelectBoxes?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (limit: number) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onEdit,
  onViewDetails,
  onStatusToggle,
  selectedProductIds = [],
  onSelectionChange,
  onSelectAll,
  showSelectBoxes = false,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}) => {
  const { t } = useLanguage();

  // Get user role from localStorage (set during login)
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  // console.log("User role from localStorage:", userRole);

  const allSelected =
    products.length > 0 && selectedProductIds.length === products.length;
  const someSelected =
    selectedProductIds.length > 0 &&
    selectedProductIds.length < products.length;

  if (products.length === 0) {
    return (
      <div className="bg-white shadow-sm border rounded-xl p-8 text-center">
        <p className="text-slate-500">{t("inventory.noProductsFound")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col lg:h-full min-h-0">
      {/* Mobile scroll indicator */}
      <div className="sm:hidden px-4 py-2 bg-slate-50 border-b text-xs text-slate-500 text-center">
        {t("common.swipeScroll")}
      </div>

      {/* Table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
        <table className="w-full text-sm text-left min-w-[800px]">
          <thead className="text-slate-500">
            <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
              {showSelectBoxes && onSelectionChange && (
                <th className="px-3 py-4 text-center w-12 bg-slate-50">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                </th>
              )}
              <th className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">No</th>
              <th className="px-3 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Code</th>
              <th className="px-3 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Name</th>
              <th className="px-3 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Category</th>
              <th className="px-3 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Unit</th>
              <th className="px-3 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Cost</th>
              <th className="px-3 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Price</th>
              <th className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Status</th>
              <th className="px-3 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p, index) => {
              const isSelected = selectedProductIds.includes(p.id);

              return (
                <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                  {showSelectBoxes && onSelectionChange && (
                    <td className="px-3 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          onSelectionChange(p.id, e.target.checked)
                        }
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                    </td>
                  )}
                  <td className="px-3 py-4 text-center text-slate-500 font-medium text-xs sm:text-sm">
                    {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-4 text-slate-600 font-semibold text-xs sm:text-sm">
                    {p.productCode}
                  </td>
                  <td className="px-3 py-4 text-slate-700 font-medium text-xs sm:text-sm">
                    <div
                      className="max-w-[150px] sm:max-w-none truncate"
                      title={p.name}
                    >
                      {p.name}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-slate-500 text-xs sm:text-sm">
                    {p.category}
                  </td>
                  <td className="px-3 py-4 text-slate-600 font-medium text-xs sm:text-sm">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 text-xs">
                      {p.unitOfMeasure || "piece"}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-slate-800 font-bold text-xs sm:text-sm">
                    {p.costPrice.toLocaleString()} <span className="text-[10px] text-slate-500 font-bold ml-1">MMK</span>
                  </td>
                  <td className="px-3 py-4 text-slate-800 font-bold text-xs sm:text-sm">
                    {p.sellingPrice.toLocaleString()} <span className="text-[10px] text-slate-500 font-bold ml-1">MMK</span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {onStatusToggle && userRole === "owner" ? (
                      <button
                        onClick={() =>
                          onStatusToggle(p.id, p.status || "active")
                        }
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                          p.status === "active"
                            ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100/50"
                            : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100/50"
                        }`}
                      >
                        {p.status === "active" ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                          p.status === "active"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-red-50 border-red-200 text-red-600"
                        }`}
                      >
                        {p.status === "active" ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      {userRole === "owner" && (
                        <button
                          onClick={() => onEdit(p)}
                          className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm shadow-indigo-600/5 transition-all cursor-pointer whitespace-nowrap"
                        >
                          {t("inventory.editItem")}
                        </button>
                      )}
                      <button
                        onClick={() => onViewDetails(p.id)}
                        className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm shadow-indigo-600/5 transition-all cursor-pointer whitespace-nowrap"
                      >
                        {t("inventory.checkItem")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
              }}
              className="text-sm border rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-slate-600">entries</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    page === currentPage
                      ? "bg-slate-800 text-white"
                      : "text-slate-600 hover:bg-slate-50 border bg-white"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
