import React from "react";
import { Search } from "lucide-react";
import { StorefrontProfile } from "../../services/Storefront/fetchStorefrontProfiles";
import { Order } from "../../services/Order/fetchOrders";
import { useLanguage } from "@/context/LanguageContext";
import { PaymentMethod } from "@/types";

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
  const uniquePaymentMethods = Array.from(
    new Set(orders.map((o) => o.paymentMethod).filter(Boolean)),
  );

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("orders.search")}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Storefront Filter */}
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm sm:text-base"
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

          {/* Payment Type Filter */}
          {/* <div className="flex items-center gap-2">
          <select
            className="border border-gray-200 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            value={paymentTypeFilter}
            onChange={(e) => onPaymentTypeChange(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="paid">Paid</option>
            <option value="credit">Credit</option>
          </select>
        </div> */}

          {/* Payment Method Filter */}
          <div className="flex items-center gap-2">
            <select
              className="border border-gray-200 rounded-lg px-3 py-2.5 sm:px-4 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm sm:text-base"
              value={paymentMethodFilter}
              onChange={(e) => onPaymentMethodChange(e.target.value)}
            >
              {/* <option value="all">{t("creditOrders.allmethod")}</option> */}
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
