import React from "react";
import { Package, Loader2 } from "lucide-react";
import { FOCOrder } from "../../services/Reports/fetchFOCOrders";
import { useLanguage } from "../../context/LanguageContext";

interface FOCTabProps {
  focOrders: FOCOrder[];
  loading: boolean;
}

interface AggregatedProduct {
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  orders: string[];
}

export const FOCTab: React.FC<FOCTabProps> = ({ focOrders, loading }) => {
  // Aggregate products by name and calculate total quantities
  const aggregatedProducts = focOrders.reduce(
    (acc, order) => {
      order.ordersProducts.forEach((product) => {
        const productName = product.inventoryId.productName;
        const productCode = product.inventoryId.productCode;
        const key = `${productName}-${productCode}`;

        if (acc[key]) {
          acc[key].quantity += product.quantity;
          acc[key].orders.push(order.orderNumber);
        } else {
          acc[key] = {
            productName,
            productCode,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
            orders: [order.orderNumber],
          };
        }
      });
      return acc;
    },
    {} as Record<string, AggregatedProduct>,
  );

  // Convert to array and sort by quantity (highest first)
  const productList = Object.values(aggregatedProducts).sort(
    (a, b) => b.quantity - a.quantity,
  );

  // Calculate totals
  const totalProducts = productList.length;
  const totalQuantity = productList.reduce(
    (sum, product) => sum + product.quantity,
    0,
  );
  const totalValue = productList.reduce(
    (sum, product) => sum + product.quantity * product.unitPrice,
    0,
  );

  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-slate-600">{t("creditDetail.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Products */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Package className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Products
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {totalProducts}
            </p>
          </div>
        </div>

        {/* Total Quantity */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Package className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Quantity
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {totalQuantity.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Package className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Value
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {totalValue.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#2216a8] font-bold text-sm sm:text-base">
          <Package className="w-5 h-5" />
          <span>FOC Products Details</span>
        </div>

        {productList.length === 0 ? (
          <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center text-slate-500">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p>No FOC products found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500">
                  <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 w-16">No</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Product Name</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Product Code</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Unit Price</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Quantity</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Total Value</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {productList.map((product, index) => (
                    <tr key={index} className="hover:bg-slate-50/40 transition-colors">
                      {/* No */}
                      <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      {/* Product Name */}
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                          {product.productName}
                        </div>
                      </td>

                      {/* Product Code */}
                      <td className="px-4 py-4 text-xs font-mono text-slate-500 font-medium">
                        {product.productCode}
                      </td>

                      {/* Unit Price */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {product.unitPrice.toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {product.quantity.toLocaleString()}
                      </td>

                      {/* Total Value */}
                      <td className="px-4 py-4 text-right font-bold text-slate-800 text-xs whitespace-nowrap">
                        {(product.quantity * product.unitPrice).toLocaleString()}{" "}
                        <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                      </td>

                      {/* Orders */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-700 font-bold">
                            {product.orders.length} order{product.orders.length > 1 ? "s" : ""}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {product.orders.slice(0, 2).join(", ")}
                            {product.orders.length > 2 && ` +${product.orders.length - 2} more`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
