import React from "react";
import { Search } from "lucide-react";
import { StorefrontProfile } from "../../services/Storefront/fetchStorefrontProfiles";
import { Order } from "../../services/Order/fetchOrders";
import { useLanguage } from "@/context/LanguageContext";

interface OrdersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  storefronts: StorefrontProfile[];
  selectedStorefrontId: string;
  onStorefrontChange: (value: string) => void;
  paymentTypeFilter: string;
  onPaymentTypeChange: (value: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodChange: (value: string) => void;
  orders: Order[];
  filteredOrders: Order[];
}

export const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  search,
  onSearchChange,
  storefronts,
  selectedStorefrontId,
  onStorefrontChange,
  paymentTypeFilter,
  onPaymentTypeChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  orders,
  filteredOrders,
}) => {
  const { t } = useLanguage();

  return (
    <div className="w-full mb-2">
      <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
          <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("orders.search")}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200/80 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs sm:text-sm text-slate-700"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex flex-row items-center justify-between gap-3 w-full md:w-auto">
          {/* Storefront Filter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-200/80 rounded-full px-4 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-all"
                value={selectedStorefrontId}
                onChange={(e) => onStorefrontChange(e.target.value)}
              >
                <option value="all">{t("creditOrders.allstorefront")}</option>
                {storefronts.map((sf) => (
                  <option key={sf._id} value={sf._id}>
                    {sf.locationName}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-200/80 rounded-full px-4 py-2.5 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-all"
                value={paymentMethodFilter}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
              >
                <option value="all">{t("creditOrders.allmethod")}</option>
                <option value="cash">Cash</option>
                <option value="kpay">KBZ Pay</option>
                <option value="wavepay">Wave Pay</option>
                <option value="ayapay">AYA Pay</option>
                <option value="uabpay">UAB Pay</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="MMQR">MMQR</option>
                <option value="normal">Normal</option>
                <option value="hot">Hot</option>
                <option value="foc">FOC</option>
              </select>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};
