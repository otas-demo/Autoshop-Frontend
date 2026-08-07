import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Receipt,
  User,
  CreditCard,
  UserPlus,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { fetchCreditOrders } from "../services/Order/fetchCreditOrders";
import { Order } from "../services/Order/fetchOrders";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { updatePaidAmount } from "../services/Order/updatePaidAmount";
import { deleteCreditOrder } from "../services/Order/deleteCreditOrder";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { assignCreditPerson } from "../services/Order/assignCreditPerson";
import { CreditOrdersFilters } from "../components/Orders/CreditOrdersFilters";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import { CreditPersonModal } from "../components/Orders/CreditPersonModal";
import { useLanguage } from "../context/LanguageContext";
import { DateRangePicker } from "../components/Reports/DateRangePicker";
import {
  DATE_RANGE_STORAGE_KEYS,
  createDateRangeInitializer,
  saveStoredDateRange,
} from "../utils/dateRangeStorage";

export const CreditOrders: React.FC = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] =
    useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [showCreditPersonModal, setShowCreditPersonModal] = useState(false);
  const [selectedOrderForCredit, setSelectedOrderForCredit] =
    useState<Order | null>(null);
  const [assigningCreditPerson, setAssigningCreditPerson] = useState(false);

  // Date filter — restored from sessionStorage on mount
  const [dateRange, setDateRange] = useState(
    createDateRangeInitializer(DATE_RANGE_STORAGE_KEYS.creditOrders),
  );
  const { startDate, endDate } = dateRange;

  // Paid Amount Edit States
  const [showPaidAmountModal, setShowPaidAmountModal] = useState(false);
  const [selectedOrderForPaidAmount, setSelectedOrderForPaidAmount] =
    useState<Order | null>(null);
  const [newPaidAmount, setNewPaidAmount] = useState("");
  const [updatingPaidAmount, setUpdatingPaidAmount] = useState(false);

  // Delete Order States
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStorefrontId, startDate, endDate, paymentMethodFilter]);

  const loadInitialData = async () => {
    // Load storefronts and credit personas
    try {
      const [sfResponse, cpResponse] = await Promise.all([
        fetchStorefrontProfiles(),
        fetchCreditPersonas(),
      ]);

      if (sfResponse.success && sfResponse.data) {
        setStorefronts(sfResponse.data.reverse());
      }

      if (cpResponse.success && cpResponse.data) {
        setCreditPersonas(cpResponse.data);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
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

      const response = await fetchCreditOrders(
        startDateStr,
        endDateStr,
        paymentMethodFilter === "all" ? null : paymentMethodFilter,
      );

      if (response.success && response.data) {
        let filteredOrders = response.data;

        // If a specific storefront is selected, filter results
        if (selectedStorefrontId !== "all") {
          filteredOrders = response.data.filter(
            (order) =>
              order.storefrontId?._id === selectedStorefrontId ||
              order.storefrontId?.id === selectedStorefrontId,
          );
        }

        setOrders(filteredOrders);
      } else {
        toast.error(response.message || t("orders.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading credit orders:", error);
      toast.error(t("orders.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const searchLower = search.toLowerCase();

    const matchesOrderNumber = order.orderNumber
      ?.toLowerCase()
      .includes(searchLower);

    const matchesStorefront = order.storefrontId?.locationName
      ?.toLowerCase()
      .includes(searchLower);

    const matchesCreditPerson =
      order.creditPersonId &&
      typeof order.creditPersonId === "object" &&
      (order.creditPersonId.name?.toLowerCase().includes(searchLower) ||
        order.creditPersonId.phone?.includes(search));

    const matchesProductName = order.ordersProducts?.some((product) =>
      product.inventoryId?.productName?.toLowerCase().includes(searchLower),
    );

    const matchesProductCode = order.ordersProducts?.some(
      (product) =>
        product.inventoryId?.productCode?.toLowerCase().includes(searchLower) ||
        product.inventoryId?.SKU?.toLowerCase().includes(searchLower),
    );

    const matchesSearch =
      matchesOrderNumber ||
      matchesStorefront ||
      matchesCreditPerson ||
      matchesProductName ||
      matchesProductCode;

    return matchesSearch;
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
        toast.success("Credit person assigned successfully");
        setShowCreditPersonModal(false);
        setSelectedOrderForCredit(null);
        // Refresh orders
        await loadOrders();
      } else {
        toast.error(response.message || "Failed to assign credit person");
      }
    } catch (error) {
      console.error("Error assigning credit person:", error);
      toast.error("Failed to assign credit person");
    } finally {
      setAssigningCreditPerson(false);
    }
  };

  const handleOpenPaidAmountModal = (order: Order) => {
    setSelectedOrderForPaidAmount(order);
    setNewPaidAmount(order.paidAmount);
    setShowPaidAmountModal(true);
  };

  const handleUpdatePaidAmount = async () => {
    if (!selectedOrderForPaidAmount || !newPaidAmount) return;

    setUpdatingPaidAmount(true);
    try {
      const response = await updatePaidAmount(
        selectedOrderForPaidAmount._id,
        newPaidAmount,
      );
      if (response.success) {
        toast.success("Paid amount updated successfully");
        setShowPaidAmountModal(false);
        setSelectedOrderForPaidAmount(null);
        await loadOrders();
      } else {
        toast.error(response.message || "Failed to update paid amount");
      }
    } catch (error) {
      console.error("Error updating paid amount:", error);
      toast.error("Failed to update paid amount");
    } finally {
      setUpdatingPaidAmount(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "MMK",
    }).format(amount);
  };

  // Delete Order Handlers
  const handleOpenDeleteConfirm = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteConfirmModal(true);
  };

  const handleCloseDeleteConfirm = () => {
    setOrderToDelete(null);
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    setDeletingOrder(true);
    try {
      const response = await deleteCreditOrder(orderToDelete._id);
      if (response.success) {
        toast.success("Credit order deleted successfully");
        setShowDeleteConfirmModal(false);
        setOrderToDelete(null);
        await loadOrders();
      } else {
        toast.error(response.message || "Failed to delete credit order");
      }
    } catch (error) {
      console.error("Error deleting credit order:", error);
      toast.error("Failed to delete credit order");
    } finally {
      setDeletingOrder(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("creditOrders.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("creditOrders.subtitle")}
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
                  DATE_RANGE_STORAGE_KEYS.creditOrders,
                  newStartDate,
                  newEndDate,
                );
              }}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            />
          </div>
        </div>

        {/* Filters */}
        <CreditOrdersFilters
          search={search}
          onSearchChange={setSearch}
          storefronts={storefronts}
          selectedStorefrontId={selectedStorefrontId}
          onStorefrontChange={setSelectedStorefrontId}
          paymentMethodFilter={paymentMethodFilter}
          onPaymentMethodChange={setPaymentMethodFilter}
          orders={orders}
          filteredOrders={filteredOrders}
        />

        {/* Orders Table */}
        {/* Orders Table */}
        <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-[#2216a8] mx-auto mb-2" />
              <p>{t("creditOrders.loadingCreditOrders")}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>{t("creditOrders.noCreditOrdersFound")}</p>
            </div>
          ) : (
            <div>
              {/* Table container with horizontal scroll on mobile */}
              <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="text-slate-500">
                    <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">No</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Credit Order Num</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Shop</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Customer</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Items</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Total</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Paid</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Left</th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredOrders.map((order, index) => (
                      <tr key={order._id} className="hover:bg-slate-50/40 transition-colors">
                        {/* No */}
                        <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        {/* Credit Order Num */}
                        <td
                          onClick={() => handleViewOrder(order._id)}
                          className="px-4 py-4 font-bold text-[#2216a8] hover:underline cursor-pointer text-xs sm:text-sm whitespace-nowrap"
                        >
                          {order.orderNumber}
                        </td>

                        {/* Shop */}
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                            {order.storefrontId?.locationName || order.storefrontId?.storefrontName || "-"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {order.storefrontId?.locationCode || order.storefrontId?.storefrontCode || "Main Store"}
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-4">
                          {order.creditPersonId && typeof order.creditPersonId === "object" ? (
                            <>
                              <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                                {order.creditPersonId.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                Regular
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-semibold text-slate-400 text-xs sm:text-sm">
                                {t("creditOrders.noCustomerAssigned")}
                              </div>
                              <div className="text-[10px] text-slate-300 font-medium">
                                -
                              </div>
                            </>
                          )}
                        </td>

                        {/* Items */}
                        <td className="px-4 py-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                          {order.ordersProducts?.length || 0} {order.ordersProducts?.length === 1 ? "Item" : "Items"}
                        </td>

                        {/* Total */}
                        <td className="px-4 py-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                          {order.finalAmount?.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                        </td>

                        {/* Paid */}
                        <td className="px-4 py-4 font-bold text-green-600 text-xs whitespace-nowrap">
                          {order.paidAmount?.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                        </td>

                        {/* Left */}
                        <td className="px-4 py-4 font-bold text-[#2216a8] text-xs whitespace-nowrap">
                          {order.remainingBalance?.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenCreditPersonModal(order)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
                            >
                              {t("common.edit")}
                            </button>
                            <button
                              onClick={() => handleViewOrder(order._id)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
                            >
                              {t("common.view")}
                            </button>
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

        {/* Order Detail Modal */}
        <OrderDetailModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          loading={loadingDetail}
          onRefresh={handleRefreshOrderDetails}
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
        {/* Paid Amount Edit Modal */}
        {showPaidAmountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  Edit Paid Amount
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Order Number
                    </label>
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-600 text-sm">
                      {selectedOrderForPaidAmount?.orderNumber}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Total Amount
                    </label>
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-800 font-semibold text-sm">
                      {selectedOrderForPaidAmount?.finalAmount.toLocaleString()}{" "}
                      MMK
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Enter Paid Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={newPaidAmount}
                        onChange={(e) => setNewPaidAmount(e.target.value)}
                        placeholder="Enter amount..."
                        className="w-full pl-3 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none text-lg font-semibold"
                        autoFocus
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                        MMK
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700">Remaining Balance:</span>
                      <span className="font-bold text-blue-800">
                        {Math.max(
                          0,
                          (selectedOrderForPaidAmount?.finalAmount || 0) -
                          Number(newPaidAmount || 0),
                        ).toLocaleString()}{" "}
                        MMK
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setShowPaidAmountModal(false)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdatePaidAmount}
                    disabled={updatingPaidAmount || !newPaidAmount}
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    {updatingPaidAmount ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Delete Credit Order
                    </h3>
                    <p className="text-sm text-slate-500">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                {orderToDelete && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Order Number:</span>
                        <span className="font-medium text-slate-800">
                          {orderToDelete.orderNumber}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Total Amount:</span>
                        <span className="font-medium text-slate-800">
                          {orderToDelete.finalAmount.toLocaleString()} MMK
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Customer:</span>
                        <span className="font-medium text-slate-800">
                          {orderToDelete.creditPersonId?.name ||
                            "No customer assigned"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> Deleting this credit order will
                    permanently remove all associated data including payment
                    records and customer balance information.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseDeleteConfirm}
                    disabled={deletingOrder}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteOrder}
                    disabled={deletingOrder}
                    className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                  >
                    {deletingOrder ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Order"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
