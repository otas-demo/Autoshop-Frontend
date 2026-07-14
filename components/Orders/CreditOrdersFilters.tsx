import React from "react";
import { Search } from "lucide-react";
import { StorefrontProfile } from "../../services/Storefront/fetchStorefrontProfiles";
import { useLanguage } from "@/context/LanguageContext";

interface CreditOrdersFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  storefronts: StorefrontProfile[];
  selectedStorefrontId: string;
  onStorefrontChange: (value: string) => void;
  paymentMethodFilter: string;
  onPaymentMethodChange: (value: string) => void;
  orders: any[];
  filteredOrders: any[];
}

export const CreditOrdersFilters: React.FC<CreditOrdersFiltersProps> = ({
  search,
  onSearchChange,
  storefronts,
  selectedStorefrontId,
  onStorefrontChange,
  paymentMethodFilter,
  onPaymentMethodChange,
  orders,
  filteredOrders,
}) => {
  const { t } = useLanguage();
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("creditOrders.search")}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4 justify-between">
          {/* Storefront Filter */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-200 rounded-lg px-2 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs sm:text-base max-w-[110px] sm:max-w-none"
                value={selectedStorefrontId}
                onChange={(e) => onStorefrontChange(e.target.value)}
              >
                <option value="all">{t("creditOrders.allstorefront")}</option>
                {storefronts.map((sf) => (
                  <option key={sf._id} value={sf._id}>
                    {sf.locationName || sf.storefrontName}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter - Hot and Normal only */}
            <div className="flex items-center gap-2">
              <select
                className="border border-gray-200 rounded-lg px-2 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-xs sm:text-base max-w-[100px] sm:max-w-none"
                value={paymentMethodFilter}
                onChange={(e) => onPaymentMethodChange(e.target.value)}
              >
                <option value="all">{t("creditOrders.allmethod")}</option>
                <option value="normal">Normal</option>
                <option value="hot">Hot</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-slate-500 whitespace-nowrap">
            <span className="hidden lg:inline">
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
            <span className="lg:hidden">
              {filteredOrders.length}/{orders.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
