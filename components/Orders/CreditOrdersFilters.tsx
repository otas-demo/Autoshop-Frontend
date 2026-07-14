import React from "react";
import { Search } from "lucide-react";
import { StorefrontProfile } from "../../services/Storefront/fetchStorefrontProfiles";
import { useLanguage } from "@/context/LanguageContext";
import { PaymentMethod } from "@/types";

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

// enum PaymentMethod {
//   CASH = "Cash",
//   KBZ_PAY = "KBZPay",
//   WAVE_PAY = "WavePay",
//   AYA_PAY = "AYA Pay",
//   UAB_PAY = "UAB Pay",
//   MMQR = "MMQR",
//   BANK_TRANSFER = "Bank Transfer",
//   NORMAL = "Normal",
//   HOT = "Hot",
//   FOC = "FOC",
// }

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

        <div className="flex items-center gap-4">
          {/* Storefront Filter */}
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
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

          {/* Payment Method Filter - Hot and Normal only */}
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
              value={paymentMethodFilter}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
            >
              <option value="all">{t("creditOrders.allmethod")}</option>
              <option value={PaymentMethod.CASH}>{t("pos.cash")}</option>
              <option value={PaymentMethod.KBZ_PAY}>{t("pos.kbzPay")}</option>
              <option value={PaymentMethod.WAVE_PAY}>{t("pos.wavePay")}</option>
              <option value={PaymentMethod.AYA_PAY}>{t("pos.ayaPay")}</option>
              <option value={PaymentMethod.UAB_PAY}>{t("pos.uabPay")}</option>
              <option value={PaymentMethod.BANK_TRANSFER}>
                {t("pos.bankTransfer")}
              </option>
              <option value={PaymentMethod.MMQR}>
                <span>MMQR</span>
              </option>
              <option value={PaymentMethod.FOC}>
                <span>FOC</span>
              </option>
            </select>
          </div>

          {/* Results count */}
          <div className="text-sm text-slate-500 whitespace-nowrap">
            <span className="hidden sm:inline">
              Showing {filteredOrders.length} of {orders.length} orders
            </span>
            <span className="sm:hidden">
              {filteredOrders.length}/{orders.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
