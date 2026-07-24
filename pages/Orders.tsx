import React, { useState, useEffect } from "react";
import { RefreshCw, Receipt } from "lucide-react";
import { toast } from "sonner";
import { fetchOrders, Order } from "../services/Order/fetchOrders";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { fetchOrdersByStorefront } from "../services/Order/fetchOrdersByStorefront";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { assignCreditPerson } from "../services/Order/assignCreditPerson";
import { OrdersFilters } from "../components/Orders/OrdersFilters";
import { OrdersTable } from "../components/Orders/OrdersTable";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import { CreditPersonModal } from "../components/Orders/CreditPersonModal";
import { useLanguage } from "../context/LanguageContext";
import { DateRangePicker } from "../components/Reports/DateRangePicker";
import {
  DATE_RANGE_STORAGE_KEYS,
  createDateRangeInitializer,
  saveStoredDateRange,
} from "../utils/dateRangeStorage";

export const Orders: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] =
    useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [showCreditPersonModal, setShowCreditPersonModal] = useState(false);
  const [selectedOrderForCredit, setSelectedOrderForCredit] =
    useState<Order | null>(null);
  const [assigningCreditPerson, setAssigningCreditPerson] = useState(false);
  const [dateRange, setDateRange] = useState(
    createDateRangeInitializer(DATE_RANGE_STORAGE_KEYS.orders),
  );
  const { startDate, endDate } = dateRange;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStorefrontId, startDate, endDate]);

  const loadInitialData = async () => {
    // Load storefronts
    try {
      const sfResponse = await fetchStorefrontProfiles();
      if (sfResponse.success && sfResponse.data) {
        setStorefronts(sfResponse.data.reverse());
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    }

    // Load credit personas
    try {
      const cpResponse = await fetchCreditPersonas();
      if (cpResponse.success && cpResponse.data) {
        setCreditPersonas(cpResponse.data.filter((p) => !p.blacklist));
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
    }
  };

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);

      // console.log("Loading orders with dates:", {
      //   startDateStr,
      //   endDateStr,
      //   selectedStorefrontId,
      // });

      // Always fetch only paid orders with date filtering
      const response = await fetchOrders(startDateStr, endDateStr, "paid");
      // console.log("All orders response:", response);

      if (response.success && response.data) {
        let filteredOrders = response.data;

        // If a specific storefront is selected, filter the results
        if (selectedStorefrontId !== "all") {
          filteredOrders = response.data.filter(
            (order) =>
              order.storefrontId?._id === selectedStorefrontId ||
              order.storefrontId?.id === selectedStorefrontId,
          );
        }

        // console.log("Filtered orders count:", filteredOrders.length);
        setOrders(filteredOrders);
      } else {
        toast.error(response.message || t("orders.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error(t("orders.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = search.toLowerCase();

    // Check if search matches order number
    const matchesOrderNumber = order.orderNumber
      ?.toLowerCase()
      .includes(searchLower);

    // Check if search matches storefront location
    const matchesStorefront = order.storefrontId?.locationName
      ?.toLowerCase()
      .includes(searchLower);

    // Check if search matches any product name in the order
    const matchesProductName = order.ordersProducts?.some((product) =>
      product.inventoryId?.productName?.toLowerCase().includes(searchLower),
    );

    // Check if search matches any product code in the order
    const matchesProductCode = order.ordersProducts?.some(
      (product) =>
        product.inventoryId?.productCode?.toLowerCase().includes(searchLower) ||
        product.inventoryId?.SKU?.toLowerCase().includes(searchLower),
    );

    const matchesSearch =
      matchesOrderNumber ||
      matchesStorefront ||
      matchesProductName ||
      matchesProductCode;

    const matchesPaymentType =
      paymentTypeFilter === "all" ||
      order.paymentType?.toLowerCase() === paymentTypeFilter.toLowerCase();
    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      order.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase();
    return matchesSearch && matchesPaymentType && matchesPaymentMethod;
  });

  const handleViewOrder = async (orderId: string) => {
    setLoadingDetail(true);
    setSelectedOrder(null);
    try {
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      } else {
        toast.error(response.message || t("orders.failedToLoadDetails"));
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error(t("orders.failedToLoadDetails"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRefreshOrderDetails = async () => {
    if (selectedOrder?._id) {
      setLoadingDetail(true);
      try {
        const response = await fetchOrderById(selectedOrder._id);
        if (response.success && response.data) {
          setSelectedOrder(response.data);
        }
      } catch (error) {
        console.error("Error refreshing order details:", error);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const handleOpenCreditPersonModal = (order: Order) => {
    setSelectedOrderForCredit(order);
    setShowCreditPersonModal(true);
  };

  const handleAssignCreditPerson = async (creditPersonId: string) => {
    if (!selectedOrderForCredit) return;

    setAssigningCreditPerson(true);
    try {
      const response = await assignCreditPerson(
        selectedOrderForCredit._id,
        creditPersonId,
      );
      if (response.success) {
        toast.success(t("orders.creditPersonAssigned"));
        setShowCreditPersonModal(false);
        setSelectedOrderForCredit(null);
        // Refresh orders
        await loadOrders();
      } else {
        toast.error(response.message || t("orders.failedToAssign"));
      }
    } catch (error) {
      console.error("Error assigning credit person:", error);
      toast.error(t("orders.failedToAssign"));
    } finally {
      setAssigningCreditPerson(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white h-[calc(100vh-2rem)] border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("orders.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("orders.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadOrders}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{t("storefront.refresh")}</span>
            </button>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(newStartDate, newEndDate) => {
                if (!newStartDate || !newEndDate) return;
                setDateRange({
                  startDate: newStartDate,
                  endDate: newEndDate,
                });
                saveStoredDateRange(
                  DATE_RANGE_STORAGE_KEYS.orders,
                  newStartDate,
                  newEndDate,
                );
              }}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            />
          </div>
        </div>

        {/* Filters */}
        <OrdersFilters
          search={search}
          onSearchChange={setSearch}
          storefronts={storefronts}
          selectedStorefrontId={selectedStorefrontId}
          onStorefrontChange={setSelectedStorefrontId}
          paymentTypeFilter={paymentTypeFilter}
          onPaymentTypeChange={setPaymentTypeFilter}
          paymentMethodFilter={paymentMethodFilter}
          onPaymentMethodChange={setPaymentMethodFilter}
          orders={orders}
          filteredOrders={filteredOrders}
        />

        {/* Orders Table */}
        <OrdersTable
          loading={loading}
          orders={filteredOrders}
          onViewOrder={handleViewOrder}
          onOpenCreditPersonModal={handleOpenCreditPersonModal}
          onOrderDeleted={async () => {
            await loadOrders();
          }}
        />

        {/* Order Detail Modal */}
        <OrderDetailModal
          isOpen={!!(selectedOrder || loadingDetail)}
          loading={loadingDetail}
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setLoadingDetail(false);
          }}
          onOrderUpdate={async () => {
            await loadOrders();
            await handleRefreshOrderDetails();
          }}
        />

        {/* Credit Person Selection Modal */}
        <CreditPersonModal
          isOpen={showCreditPersonModal}
          order={selectedOrderForCredit}
          creditPersonas={creditPersonas}
          assigning={assigningCreditPerson}
          onClose={() => {
            setShowCreditPersonModal(false);
            setSelectedOrderForCredit(null);
          }}
          onAssign={handleAssignCreditPerson}
        />
      </div>
    </div>
  );
};
