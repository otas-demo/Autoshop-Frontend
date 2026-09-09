import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Receipt,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Plus,
  X,
  Store,
  Box,
  Coins,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCreditPersonaRecords,
  CreditPersonaRecordsData,
  CreditRecordsPagination,
} from "../services/Credit/fetchCreditPersonaRecords";
import { createCreditRecord } from "../services/Credit/createCreditRecord";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { createOrder } from "../services/Order/createOrder";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import {
  fetchCreditPersonaProducts,
  CreditPersonaProductReportResponse,
} from "../services/Reports/fetchCreditPersonaProducts";
import { Order } from "../services/Order/fetchOrders";
import { OrderDetailModal } from "../components/Orders/OrderDetailModal";
import { useLanguage } from "../context/LanguageContext";

type TabType = "orders" | "products" | "payments";

export const CreditDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  // Get credit person info from location state if available
  const personInfo = location.state as {
    name?: string;
    phone?: string;
    address?: string;
  } | null;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("orders");
  const [personaDetail, setPersonaDetail] =
    useState<CreditPersonaRecordsData | null>(null);
  const [productsReport, setProductsReport] =
    useState<CreditPersonaProductReportResponse | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [personName, setPersonName] = useState(
    personInfo?.name || "Credit Person",
  );
  const [personPhone, setPersonPhone] = useState(personInfo?.phone || "");
  const [personAddress, setPersonAddress] = useState(personInfo?.address || "");

  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPagination, setPaymentsPagination] =
    useState<CreditRecordsPagination | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Add Payment Modal State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    orderId: "",
    paidAmount: 0,
    paymentMethod: "cash",
  });

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  // Add Credit Order Modal State
  const [showAddCreditModal, setShowAddCreditModal] = useState(false);
  const [isCreatingCredit, setIsCreatingCredit] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [stockItems, setStockItems] = useState<StorefrontStockItem[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [creditForm, setCreditForm] = useState({
    storefrontId: "",
    inventoryId: "",
    quantity: 1,
    finalAmount: 0,
    paidAmount: 0,
    paymentMethod: "normal",
  });

  useEffect(() => {
    if (id) {
      loadCreditDetail();
    }
  }, [id]);

  const loadPaymentRecords = async (page: number = 1) => {
    if (!id) return;
    setPaymentsLoading(true);
    try {
      const response = await fetchCreditPersonaRecords(id, page);
      if (response.success && response.data) {
        setPersonaDetail((prev) =>
          prev
            ? {
                ...prev,
                creditRecords: response.data!.creditRecords,
                summary: response.data!.summary,
                orders: response.data!.orders,
              }
            : response.data!,
        );
        setPaymentsPagination(response.pagination ?? null);
        setPaymentsPage(page);
      } else {
        toast.error(response.message || "Failed to load payment records");
      }
    } catch (error) {
      console.error("Error loading payment records:", error);
      toast.error("Failed to load payment records");
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadCreditDetail = async () => {
    if (!id) return;
    setLoading(true);
    setLoadingProducts(true);
    setPaymentsPage(1);
    try {
      const [personaResponse, productsResponse] = await Promise.all([
        fetchCreditPersonaRecords(id, 1),
        fetchCreditPersonaProducts(id),
      ]);

      if (personaResponse.success && personaResponse.data) {
        setPersonaDetail(personaResponse.data);
        setPersonName(personaResponse.data.creditPerson.name);
        setPersonPhone(personaResponse.data.creditPerson.phone);
        setPersonAddress(personaResponse.data.creditPerson.address || "");
        setPaymentsPagination(personaResponse.pagination ?? null);
      } else {
        toast.error(personaResponse.message || "Failed to load credit details");
      }

      if (productsResponse.success) {
        setProductsReport(productsResponse);
      }
    } catch (error) {
      console.error("Error loading credit details:", error);
      toast.error("Failed to load credit details");
    } finally {
      setLoading(false);
      setLoadingProducts(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Cash",
      kpay: "KBZ Pay",
      kbzpay: "KBZ Pay",
      wavepay: "Wave Pay",
      ayapay: "AYA Pay",
      uabpay: "UAB Pay",
      bank_transfer: "Bank Transfer",
    };
    return labels[method?.toLowerCase()] || method;
  };

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "kpay", label: "KBZ Pay" },
    { value: "wavepay", label: "Wave Pay" },
    { value: "ayapay", label: "AYA Pay" },
    { value: "uabpay", label: "UAB Pay" },
    { value: "bank_transfer", label: "Bank Transfer" },
  ];

  const handleOpenAddPayment = () => {
    // Default to first order if available
    const defaultOrderId = personaDetail?.orders[0]?._id || "";
    setPaymentForm({
      orderId: defaultOrderId,
      paidAmount: 0,
      paymentMethod: "cash",
    });
    setShowAddPaymentModal(true);
  };

  const handleOpenAddCredit = async () => {
    setShowAddCreditModal(true);
    setLoadingStock(true);
    try {
      const response = await fetchStorefrontProfiles();
      if (response.success && response.data) {
        setStorefronts(response.data.filter((sf) => sf.status === "active"));
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleStorefrontChange = async (storefrontId: string) => {
    setCreditForm({
      ...creditForm,
      storefrontId,
      inventoryId: "",
      finalAmount: 0,
    });
    setLoadingStock(true);
    try {
      const response = await fetchStorefrontStock();
      if (response.success && response.data) {
        // Filter stock for selected storefront
        const filteredStock = response.data.filter(
          (item) => item.storefrontId?._id === storefrontId,
        );
        setStockItems(filteredStock);
      }
    } catch (error) {
      console.error("Error loading stock:", error);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleAddCreditOrder = async () => {
    if (!creditForm.storefrontId) {
      toast.error("Please select a storefront");
      return;
    }

    setIsCreatingCredit(true);
    try {
      const payload = {
        storefrontId: creditForm.storefrontId,
        ordersProducts: [
          {
            inventoryId: import.meta.env.VITE_CREDIT_ID,
            quantity: 1,
          },
        ],
        subTotal: creditForm.finalAmount,
        finalAmount: creditForm.finalAmount,
        paidAmount: creditForm.paidAmount,
        paymentType: "credit" as "credit",
        paymentMethod: "normal",
        creditPersonId: id, // current credit person
      };

      const response = await createOrder(payload);
      if (response.success) {
        toast.success("Credit order created successfully");
        setShowAddCreditModal(false);
        setCreditForm({
          storefrontId: "",
          quantity: 1,
          finalAmount: 0,
          paidAmount: 0,
          paymentMethod: "normal",
          inventoryId: "",
        });
        await loadCreditDetail();
      } else {
        toast.error(response.message || "Failed to create credit order");
      }
    } catch (error) {
      console.error("Error creating credit order:", error);
      toast.error("Failed to create credit order");
    } finally {
      setIsCreatingCredit(false);
    }
  };

  const handleCloseAddPayment = () => {
    setShowAddPaymentModal(false);
    setPaymentForm({ orderId: "", paidAmount: 0, paymentMethod: "cash" });
  };

  const handleAddPayment = async () => {
    if (!paymentForm.orderId) {
      toast.error(t("creditDetail.selectOrder"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createCreditRecord({
        orderId: paymentForm.orderId,
        paidAmount: paymentForm.paidAmount,
        paymentMethod: paymentForm.paymentMethod,
      });

      if (response.success) {
        toast.success(t("creditDetail.paymentRecorded"));
        handleCloseAddPayment();
        // Refresh the credit details
        await loadCreditDetail();
      } else {
        toast.error(response.message || t("creditDetail.failedToRecord"));
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(t("creditDetail.failedToRecord"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewOrder = async (orderId: string) => {
    setLoadingOrderDetail(true);
    setSelectedOrder(null);
    try {
      const response = await fetchOrderById(orderId);
      if (response.success && response.data) {
        setSelectedOrder(response.data);
      } else {
        toast.error(response.message || "Failed to load order details");
      }
    } catch (error) {
      console.error("Error loading order details:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoadingOrderDetail(false);
    }
  };

  const isMy = language === "my";

  return (
    <div className="w-full">
      <div className="bg-white min-h-[96vh] rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/credits")}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer shadow-xs"
              title={isMy ? "နောက်သို့" : "Back"}
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {isMy ? "ဝယ်သူ အသေးစိတ်" : "Customer Details"}
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {isMy
                  ? "ဝယ်သူ အချက်အလက်၊ ဝယ်ယူမှုအော်ဒါများနှင့် ငွေပေးချေမှုမှတ်တမ်းများ"
                  : "Customer information, order records and credit payment history"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <button
              onClick={loadCreditDetail}
              disabled={loading}
              className="p-2.5 sm:px-4 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">
                {isMy ? "ပြန်လည်စစ်ဆေးမည်" : "Refresh"}
              </span>
            </button>

            {personaDetail && personaDetail.orders.length > 0 && (
              <button
                onClick={handleOpenAddPayment}
                className="bg-[#2216a8] hover:bg-[#1b1187] text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isMy ? "ငွေပေးသွင်းမည်" : "Add Payment"}</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#2216a8]" />
            <p className="text-slate-500 font-medium">
              {isMy
                ? "အချက်အလက်များ ရယူနေပါသည်..."
                : "Loading customer details..."}
            </p>
          </div>
        ) : personaDetail ? (
          <div className="space-y-6">
            {/* Customer Info Card */}
            <div className="bg-[#fcfbf9] border border-gray-150 rounded-2xl p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-50 rounded-2xl text-[#2216a8]">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    {personName}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">
                    {isMy ? "ဝယ်သူ ID" : "Customer ID"}: {id}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 border-t md:border-t-0 md:border-l border-gray-200/60 pt-4 md:pt-0 md:pl-6">
                {personPhone && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-50 rounded-xl text-green-700">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isMy ? "ဖုန်းနံပါတ်" : "Contact Phone"}
                      </p>
                      <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                        {personPhone}
                      </p>
                    </div>
                  </div>
                )}

                {personAddress && (
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-700">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isMy ? "လိပ်စာ" : "Address"}
                      </p>
                      <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                        {personAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Stats Grid (Total Records, Total Paid, Outstanding) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Records */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">
                    {isMy ? "စုစုပေါင်း မှတ်တမ်း" : "Total Records"}
                  </p>
                  <h4 className="text-lg font-black text-slate-850 mt-0.5">
                    {personaDetail.summary.totalCreditRecords}{" "}
                    <span className="text-xs font-bold text-slate-500">
                      {isMy ? "ခု" : "records"}
                    </span>
                  </h4>
                </div>
              </div>

              {/* Total Paid */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">
                    {isMy ? "အကြွေးပေးချေပြီးငွေ စုစုပေါင်း" : "Total Credit Paid"}
                  </p>
                  <h4 className="text-lg font-black text-emerald-600 mt-0.5">
                    {personaDetail.summary.totalPaidViaCreditRecords?.toLocaleString() ||
                      0}{" "}
                    <span className="text-xs font-bold text-slate-500">
                      MMK
                    </span>
                  </h4>
                </div>
              </div>

              {/* Outstanding Debt */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                <div
                  className={`p-3.5 rounded-2xl ${
                    personaDetail.summary.totalOutstandingAmount > 0
                      ? "bg-amber-50 text-amber-700"
                      : "bg-slate-50 text-slate-400"
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">
                    {isMy ? "ပေးရန်ကျန် အကြွေး စုစုပေါင်း" : "Outstanding Debt"}
                  </p>
                  <h4
                    className={`text-lg font-black mt-0.5 ${
                      personaDetail.summary.totalOutstandingAmount > 0
                        ? "text-amber-700"
                        : "text-slate-700"
                    }`}
                  >
                    {personaDetail.summary.totalOutstandingAmount.toLocaleString()}{" "}
                    <span className="text-xs font-bold text-slate-500">
                      MMK
                    </span>
                  </h4>
                </div>
              </div>
            </div>

            {/* Tabs for Orders, Products, Payments */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "orders"
                    ? "bg-[#2216a8] text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>{isMy ? "ဆက်စပ် အော်ဒါများ" : "Associated Orders"}</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                    activeTab === "orders"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {personaDetail.orders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("products")}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "products"
                    ? "bg-[#2216a8] text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Box className="w-4 h-4" />
                <span>
                  {isMy ? "ဝယ်ယူထားသော ပစ္စည်းများ" : "Purchased Products"}
                </span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                    activeTab === "products"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {productsReport?.data.totals.totalUniqueProducts || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "payments"
                    ? "bg-[#2216a8] text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {isMy ? "ငွေပေးချေမှု မှတ်တမ်းများ" : "Payment Records"}
                </span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                    activeTab === "payments"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {personaDetail.summary.totalCreditRecords}
                </span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-6">
              {/* Associated Orders Tab */}
              {activeTab === "orders" && (
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-[#2216a8]" />
                      <span>
                        {isMy ? "ဆက်စပ် အော်ဒါများ" : "Associated Orders"}
                      </span>
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      {personaDetail.orders.length}{" "}
                      {isMy ? "စောင်" : "orders"}
                    </span>
                  </div>

                  {personaDetail.orders.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                      {isMy ? "အော်ဒါမှတ်တမ်း မရှိသေးပါ" : "No orders found"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                      {personaDetail.orders.map((order) => (
                        <div
                          key={order._id}
                          onClick={() => handleViewOrder(order._id)}
                          className="group p-4 bg-[#fcfbf9] hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-300 rounded-2xl transition-all cursor-pointer shadow-xs flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white group-hover:bg-indigo-100 rounded-xl text-[#2216a8] border border-slate-100 transition-colors">
                              <Receipt className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#2216a8] group-hover:underline">
                                {order.orderNumber}
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {isMy
                                  ? "အသေးစိတ်ကြည့်ရန် နှိပ်ပါ"
                                  : "Click to view details"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-black">
                            &rarr;
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Purchased Products Tab */}
              {activeTab === "products" && (
                <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Box className="w-5 h-5 text-[#2216a8]" />
                      <span>
                        {isMy
                          ? "ဝယ်ယူထားသော ပစ္စည်းများ အကျဉ်းချုပ်"
                          : "Purchased Products Summary"}
                      </span>
                    </h3>
                    {productsReport && (
                      <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                          {isMy ? "စုစုပေါင်း အရေအတွက်" : "Total Qty"}:{" "}
                          <span className="text-[#2216a8] font-black">
                            {productsReport.data.totals.totalQuantity.toLocaleString()}
                          </span>
                        </span>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
                          {isMy ? "အော်ဒါ အရေအတွက်" : "Total Orders"}:{" "}
                          <span className="text-[#2216a8] font-black">
                            {productsReport.data.totals.totalOrderCount}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    {loadingProducts ? (
                      <div className="p-16 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#2216a8] mx-auto mb-2" />
                        <p className="text-slate-400 text-xs font-semibold">
                          {isMy
                            ? "ပစ္စည်းစာရင်းများ ရယူနေပါသည်..."
                            : "Loading products..."}
                        </p>
                      </div>
                    ) : !productsReport ||
                      productsReport.data.products.length === 0 ? (
                      <div className="p-16 text-center text-slate-400 text-xs font-semibold">
                        {isMy
                          ? "ဝယ်ယူထားသော ပစ္စည်းမှတ်တမ်း မရှိပါ"
                          : "No products found for this customer."}
                      </div>
                    ) : (
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#fcfbf9] text-slate-600 border-b border-gray-100">
                          <tr>
                            <th className="py-3.5 px-4 font-bold">
                              {isMy ? "ကုန်ပစ္စည်း အမည်" : "Product Name"}
                            </th>
                            <th className="py-3.5 px-4 font-bold">SKU</th>
                            <th className="py-3.5 px-4 font-bold text-right">
                              {isMy ? "အရေအတွက်" : "Quantity"}
                            </th>
                            <th className="py-3.5 px-4 font-bold text-right">
                              {isMy ? "အော်ဒါ အကြိမ်ရေ" : "Order Count"}
                            </th>
                            <th className="py-3.5 px-4 font-bold">
                              {isMy ? "ယူနစ်" : "Unit"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {productsReport.data.products.map((product, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-indigo-50/20 transition-colors"
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">
                                  {product.productName}
                                </div>
                                <div className="text-[11px] text-slate-400 font-semibold">
                                  {product.productCode}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-600">
                                {product.SKU || "-"}
                              </td>
                              <td className="py-3.5 px-4 text-right font-black text-slate-900">
                                {product.totalQuantity.toLocaleString()}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-[#2216a8]">
                                {product.orderCount}
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-500 uppercase">
                                {product.unitOfMeasure || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Records Tab */}
              {activeTab === "payments" && (
                <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#2216a8]" />
                      <span>
                        {isMy
                          ? "ငွေပေးချေမှု မှတ်တမ်းများ"
                          : "Payment Records"}
                      </span>
                    </h3>
                    {paymentsPagination && paymentsPagination.totalItems > 0 && (
                      <span className="text-xs text-slate-400 font-bold">
                        {paymentsPagination.totalItems}{" "}
                        {isMy ? "ခု တွေ့ရှိပါသည်" : "records total"}
                      </span>
                    )}
                  </div>

                  {paymentsLoading ? (
                    <div className="p-16 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-[#2216a8] mx-auto mb-2" />
                      <p className="text-slate-400 text-xs font-semibold">
                        {isMy
                          ? "ငွေပေးချေမှု မှတ်တမ်းများ ရယူနေပါသည်..."
                          : "Loading payment records..."}
                      </p>
                    </div>
                  ) : personaDetail.creditRecords.records.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 text-xs font-semibold">
                      {isMy
                        ? "ငွေပေးချေမှု မှတ်တမ်း မရှိသေးပါ"
                        : "No payment records found"}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#fcfbf9] text-slate-600 border-b border-gray-100">
                            <tr>
                              <th className="py-3.5 px-4 font-bold">
                                {isMy ? "အော်ဒါ နံပါတ်" : "Order"}
                              </th>
                              <th className="py-3.5 px-4 font-bold">
                                {isMy ? "ပေးချေသည့် ရက်စွဲ" : "Payment Date"}
                              </th>
                              <th className="py-3.5 px-4 font-bold">
                                {isMy ? "ပေးချေမှု ပုံစံ" : "Method"}
                              </th>
                              <th className="py-3.5 px-4 font-bold text-right">
                                {isMy ? "ပေးသွင်းငွေ" : "Amount Paid"}
                              </th>
                              <th className="py-3.5 px-4 font-bold text-right">
                                {isMy ? "ကျန်ရှိငွေ" : "Remaining"}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {personaDetail.creditRecords.records.map(
                              (record) => (
                                <tr
                                  key={record._id}
                                  className="hover:bg-indigo-50/20 transition-colors"
                                >
                                  <td className="py-3.5 px-4">
                                    <button
                                      onClick={() =>
                                        handleViewOrder(record.orderId._id)
                                      }
                                      className="text-[#2216a8] font-bold hover:underline cursor-pointer"
                                    >
                                      {record.orderId.orderNumber}
                                    </button>
                                  </td>
                                  <td className="py-3.5 px-4 font-semibold text-slate-600">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                      <span>{formatDate(record.paymentDate)}</span>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[11px] font-bold text-slate-700">
                                      {getPaymentMethodLabel(
                                        record.paymentMethod
                                      )}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                                    {record.paidAmount.toLocaleString()} MMK
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <span
                                      className={`font-black ${
                                        record.remainingBalanceAfterPayment > 0
                                          ? "text-amber-700"
                                          : "text-emerald-600"
                                      }`}
                                    >
                                      {record.remainingBalanceAfterPayment?.toLocaleString()}{" "}
                                      MMK
                                    </span>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      {paymentsPagination &&
                        paymentsPagination.totalPages > 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white border-t border-gray-100">
                            <div className="text-xs font-semibold text-slate-500">
                              Showing{" "}
                              <span className="font-bold text-slate-800">
                                {(paymentsPage - 1) *
                                  paymentsPagination.itemsPerPage +
                                  1}
                              </span>{" "}
                              to{" "}
                              <span className="font-bold text-slate-800">
                                {Math.min(
                                  paymentsPage *
                                    paymentsPagination.itemsPerPage,
                                  paymentsPagination.totalItems
                                )}
                              </span>{" "}
                              of{" "}
                              <span className="font-bold text-slate-800">
                                {paymentsPagination.totalItems}
                              </span>{" "}
                              results
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  loadPaymentRecords(paymentsPage - 1)
                                }
                                disabled={paymentsPage <= 1 || paymentsLoading}
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>

                              <div className="flex gap-1">
                                {Array.from(
                                  { length: paymentsPagination.totalPages },
                                  (_, i) => i + 1
                                ).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => loadPaymentRecords(page)}
                                    disabled={paymentsLoading}
                                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                      page === paymentsPage
                                        ? "bg-[#2216a8] text-white shadow-xs"
                                        : "text-slate-600 hover:bg-slate-50 border border-slate-200"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}
                              </div>

                              <button
                                onClick={() =>
                                  loadPaymentRecords(paymentsPage + 1)
                                }
                                disabled={
                                  paymentsPage >=
                                    paymentsPagination.totalPages ||
                                  paymentsLoading
                                }
                                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold">
              {isMy
                ? "အချက်အလက်များ ရယူ၍ မရနိုင်ပါ"
                : "Failed to load customer details"}
            </p>
            <button
              onClick={loadCreditDetail}
              className="mt-4 px-6 py-2.5 bg-[#2216a8] hover:bg-[#1b1187] text-white rounded-full transition-all font-bold text-xs shadow-sm cursor-pointer"
            >
              {isMy ? "ထပ်မံကြိုးစားမည်" : "Try Again"}
            </button>
          </div>
        )}
      </div>

      {/* Modals remain same as before */}
      {/* Add Payment Modal */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-[#fcfbf9]">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Plus className="w-4 h-4" />
                </div>
                <span>{isMy ? "ငွေပေးချေမှု ထည့်သွင်းမည်" : "Record Payment"}</span>
              </h2>
              <button
                onClick={handleCloseAddPayment}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Order Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isMy ? "အော်ဒါ ရွေးချယ်ပါ" : "Select Order"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full border border-slate-200 rounded-2xl p-3 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] outline-none shadow-xs transition-all"
                  value={paymentForm.orderId}
                  onChange={(e) =>
                    setPaymentForm({ ...paymentForm, orderId: e.target.value })
                  }
                >
                  <option value="">
                    -- {isMy ? "အော်ဒါ ရွေးချယ်ပါ" : "Select Order"} --
                  </option>
                  {[...personaDetail?.orders].reverse().map((order) => (
                    <option key={order._id} value={order._id}>
                      {order.orderNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isMy ? "ပေးသွင်းငွေ (MMK)" : "Payment Amount (MMK)"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-slate-200 rounded-2xl p-3 text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] outline-none shadow-xs transition-all"
                  placeholder={isMy ? "ငွေပမာဏ ရိုက်ထည့်ပါ..." : "Enter amount..."}
                  value={paymentForm.paidAmount || ""}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paidAmount: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isMy ? "ပေးချေမှု ပုံစံ" : "Payment Method"}
                </label>
                <select
                  className="w-full border border-slate-200 rounded-2xl p-3 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] outline-none shadow-xs transition-all"
                  value={paymentForm.paymentMethod}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      paymentMethod: e.target.value,
                    })
                  }
                >
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-[#fcfbf9] flex justify-end gap-3">
              <button
                onClick={handleCloseAddPayment}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                {isMy ? "မလုပ်တော့ပါ" : "Cancel"}
              </button>
              <button
                onClick={handleAddPayment}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#2216a8] hover:bg-[#1b1187] text-white rounded-full transition-all disabled:opacity-50 flex items-center gap-2 font-bold text-xs shadow-sm cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    <span>{isMy ? "သိမ်းဆည်းနေသည်..." : "Recording..."}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />{" "}
                    <span>{isMy ? "ငွေပေးသွင်းမည်" : "Record Payment"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!(selectedOrder || loadingOrderDetail)}
        loading={loadingOrderDetail}
        order={selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setLoadingOrderDetail(false);
        }}
      />
      {/* Add Credit Model */}
      {showAddCreditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-lg overflow-hidden flex flex-col animate-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-blue-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Box className="w-6 h-6 text-blue-600" />
                Add New Credit Order
              </h2>
              <button
                onClick={() => setShowAddCreditModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-white/50 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              {/* Storefront Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Store className="w-4 h-4 text-slate-400" />
                  Select Storefront <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-slate-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                  value={creditForm.storefrontId}
                  onChange={(e) => handleStorefrontChange(e.target.value)}
                >
                  <option value="">-- Choose a Storefront --</option>
                  {storefronts.map((sf) => (
                    <option key={sf._id} value={sf._id}>
                      {sf.locationName} ({sf.locationCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Subtotal */}
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Subtotal (MMK)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter subtotal amount..."
                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm font-bold text-lg"
                    value={creditForm.finalAmount}
                    onChange={(e) =>
                      setCreditForm({
                        ...creditForm,
                        finalAmount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Summary Summary */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center text-blue-900">
                <span className="font-medium">Credit Amount to be added:</span>
                <span className="text-xl font-bold">
                  {(
                    creditForm.finalAmount - creditForm.paidAmount
                  ).toLocaleString()}{" "}
                  MMK
                </span>
              </div>
            </div>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowAddCreditModal(false)}
                className="px-6 py-3 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCreditOrder}
                disabled={isCreatingCredit}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 font-bold shadow-lg shadow-blue-200 active:scale-95"
              >
                {isCreatingCredit ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Coins className="w-5 h-5" />
                    Add Credit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
