import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Loader2,
  DollarSign,
  ShoppingCart,
  CreditCard,
  AlertCircle,
  Plus,
  Package,
  Clock,
  PackageCheck,
  Trash2,
  LayoutDashboard,
} from "lucide-react";
import { toast } from "sonner";
import { fetchSupplierById } from "../services/Supplier/fetchSupplierById";
import { fetchPurchases } from "../services/Purchase/fetchPurchases";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { fetchPurchaseReport } from "../services/Reports/fetchPurchaseReport";
import { PurchaseOrderList } from "../components/Purchasing/PurchaseOrderList";
import { PODetailModal } from "../components/Purchasing/PODetailModal";
import { CreatePOModal } from "../components/Purchasing/CreatePOModal";
import { CreateGRNModal } from "../components/Purchasing/CreateGRNModal";
import { useLanguage } from "../context/LanguageContext";
import { Supplier, ApiPurchaseOrder, Product } from "../types";
import { PurchaseDetail } from "../services/Purchase/fetchPurchaseById";

export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isMy = language === "my";

  // Supplier & PO State
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingSupplier, setLoadingSupplier] = useState(true);
  const [editingPO, setEditingPO] = useState<PurchaseDetail | null>(null);

  // Financial Stats
  const [supplierStats, setSupplierStats] = useState<{
    totalAmount: number;
    count: number;
    totalPaid: number;
    totalRemaining: number;
  }>({
    totalAmount: 0,
    count: 0,
    totalPaid: 0,
    totalRemaining: 0,
  });

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products">("overview");
  const [statusCounts, setStatusCounts] = useState<{
    pending: number;
    arrived: number;
    deleted: number;
  }>({
    pending: 0,
    arrived: 0,
    deleted: 0,
  });
  const [suppliedProducts, setSuppliedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [poList, setPOList] = useState<ApiPurchaseOrder[]>([]);
  const [deletedPOList, setDeletedPOList] = useState<ApiPurchaseOrder[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poFilter, setPoFilter] = useState<"pending" | "arrived" | "deleted">("pending");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [poPagination, setPoPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [deletedPoPagination, setDeletedPoPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPODetailModalOpen, setIsPODetailModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [isCreateGRNModalOpen, setIsCreateGRNModalOpen] = useState(false);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<ApiPurchaseOrder | null>(null);

  useEffect(() => {
    if (id) {
      loadSupplierData();
      loadMetadata();
      loadPurchases(1, 10, poFilter, paymentFilter);
      loadSupplierStats();
      loadSuppliedProducts();
      loadStatusCounts();
    }
  }, [id]);

  const loadSupplierData = async () => {
    setLoadingSupplier(true);
    try {
      const res = await fetchSupplierById(id!);
      if (res.success && res.data) {
        setSupplier(res.data);
      } else {
        toast.error("Failed to load supplier details");
      }
    } catch (error) {
      console.error("Error loading supplier detail:", error);
      toast.error("An error occurred while loading supplier details");
    } finally {
      setLoadingSupplier(false);
    }
  };

  const loadSupplierStats = async () => {
    if (!id) return;
    try {
      const reportRes = await fetchPurchaseReport(
        null,
        null,
        undefined,
        undefined,
        undefined,
        id
      );
      if (reportRes.success && reportRes.data) {
        const overall = reportRes.data.overall;
        const credit = reportRes.data.creditSummary;
        const cashAmount = Math.max(
          0,
          (overall?.totalAmount || 0) - (credit?.totalCreditAmount || 0)
        );
        const totalPaid = cashAmount + (credit?.totalPaid || 0);
        const totalRemaining = credit?.totalRemaining || 0;

        setSupplierStats({
          totalAmount: overall?.totalAmount || 0,
          count: overall?.count || 0,
          totalPaid,
          totalRemaining,
        });
      }
    } catch (error) {
      console.error("Error loading supplier stats:", error);
    }
  };

  const loadMetadata = async () => {
    try {
      const supplierRes = await fetchSuppliers();
      if (supplierRes.success) {
        setSuppliers(supplierRes.data);
      }
      const productRes = await fetchProducts(undefined, undefined, undefined, "active");
      if (productRes.success && Array.isArray(productRes.data)) {
        setProducts(productRes.data);
      }
    } catch (error) {
      console.error("Error loading metadata:", error);
    }
  };

  const loadSuppliedProducts = async () => {
    if (!id) return;
    setLoadingProducts(true);
    try {
      const res = await fetchProducts(1, 100, undefined, undefined, undefined, id);
      if (res && res.data) {
        setSuppliedProducts(res.data);
      }
    } catch (error) {
      console.error("Error loading supplied products:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadStatusCounts = async () => {
    if (!id) return;
    try {
      const [pendingRes, arrivedRes, deletedRes] = await Promise.all([
        fetchPurchases({ page: 1, limit: 1, isDeleted: false, status: "pending", supplierId: id }),
        fetchPurchases({ page: 1, limit: 1, isDeleted: false, status: "arrived", supplierId: id }),
        fetchPurchases({ page: 1, limit: 1, isDeleted: true, supplierId: id }),
      ]);
      setStatusCounts({
        pending: pendingRes.success ? pendingRes.pagination.totalItems : 0,
        arrived: arrivedRes.success ? arrivedRes.pagination.totalItems : 0,
        deleted: deletedRes.success ? deletedRes.pagination.totalItems : 0,
      });
    } catch (err) {
      console.error("Error loading status counts:", err);
    }
  };

  const loadPurchases = async (
    page = 1,
    limit = 10,
    status?: string,
    paymentStatus?: "all" | "unpaid" | "paid"
  ) => {
    if (!id) return;
    setPoLoading(true);
    try {
      const activeStatus = (status || poFilter) as "pending" | "arrived";
      const res = await fetchPurchases({
        page,
        limit,
        isDeleted: false,
        status: activeStatus,
        paymentStatus: paymentStatus,
        supplierId: id,
      });
      if (res.success) {
        setPOList(res.data);
        setPoPagination(res.pagination);
        if (activeStatus === "pending") {
          setStatusCounts((prev) => ({ ...prev, pending: res.pagination.totalItems }));
        } else if (activeStatus === "arrived") {
          setStatusCounts((prev) => ({ ...prev, arrived: res.pagination.totalItems }));
        }
      }
    } catch (error) {
      console.error("Error loading purchases:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setPoLoading(false);
    }
  };

  const loadDeletedPurchases = async (page = 1, limit = 10) => {
    if (!id) return;
    setPoLoading(true);
    try {
      const res = await fetchPurchases({
        page,
        limit,
        isDeleted: true,
        supplierId: id,
      });
      if (res.success) {
        setDeletedPOList(res.data);
        setDeletedPoPagination(res.pagination);
        setStatusCounts((prev) => ({ ...prev, deleted: res.pagination.totalItems }));
      }
    } catch (error) {
      console.error("Error loading deleted purchases:", error);
      toast.error("Failed to load deleted purchase orders");
    } finally {
      setPoLoading(false);
    }
  };

  const handleViewPO = (po: ApiPurchaseOrder) => {
    setSelectedPOId(po._id);
    setIsPODetailModalOpen(true);
  };

  const handleCreateGRNFromPO = (po: ApiPurchaseOrder) => {
    setSelectedPOForGRN(po);
    setSelectedPOId(po._id);
    setIsCreateGRNModalOpen(true);
  };

  const handleGRNSuccess = () => {
    setIsCreateGRNModalOpen(false);
    if (poFilter === "deleted") {
      loadDeletedPurchases(deletedPoPagination.currentPage, deletedPoPagination.itemsPerPage);
    } else {
      loadPurchases(poPagination.currentPage, poPagination.itemsPerPage, poFilter, paymentFilter);
    }
    loadSupplierStats();
    loadStatusCounts();
  };

  return (
    <div className="w-full">
      <div className="bg-white min-h-[96vh] border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-full transition cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-[#2216a8]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {isMy ? "ကုန်သွင်းသူ အသေးစိတ်" : "Supplier Details"}
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 font-medium">
                {isMy
                  ? "ကုန်သွင်းသူ အချက်အလက်နှင့် ဝယ်ယူမှုမှတ်တမ်းများ"
                  : "Supplier information and purchase order records"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#2216a8] hover:bg-[#2216a8]/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isMy ? "အော်ဒါအသစ်ဖွင့်မယ်" : "New Purchase Order"}</span>
          </button>
        </div>

        {/* Main Tabs (Overview, Purchase Orders, Supplied Products) */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-[#2216a8] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{isMy ? "အကျဉ်းချုပ် & ငွေစာရင်း" : "Overview & Financials"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "orders"
                ? "bg-[#2216a8] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isMy ? "ဝယ်ယူမှု အော်ဒါစာရင်းများ" : "Purchase Orders"}</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "orders"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {supplierStats.count}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("products");
              loadSuppliedProducts();
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "products"
                ? "bg-[#2216a8] text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{isMy ? "တင်သွင်းသော ကုန်ပစ္စည်းများ" : "Supplied Products"}</span>
            <span
              className={`ml-1 px-2 py-0.5 rounded-full text-[11px] font-black ${
                activeTab === "products"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {suppliedProducts.length}
            </span>
          </button>
        </div>

        {loadingSupplier ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#2216a8]" />
            <p className="text-slate-500 font-medium">Loading supplier details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Tab Content */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Supplier Info Card */}
                {supplier && (
                  <div className="bg-[#fcfbf9] border border-gray-150 rounded-2xl p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-indigo-50 rounded-2xl text-[#2216a8]">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-800">
                          {supplier.supplierName}
                        </h3>
                        <p className="text-xs text-slate-400 font-bold mt-1">
                          ID: {supplier._id || supplier.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-gray-200/60 pt-4 md:pt-0 md:pl-6 min-w-[250px]">
                      <div className="p-3 bg-green-50 rounded-xl text-green-700">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Contact Number
                        </p>
                        <p className="text-sm font-extrabold text-slate-700 mt-0.5">
                          {supplier.contactNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Stats Grid (Total Amount, Orders, Paid, Debt) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Purchase Amount */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                    <div className="p-3.5 bg-indigo-50 text-[#2216a8] rounded-2xl">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">
                        {isMy ? "စုစုပေါင်း ဝယ်ယူမှုပမာဏ" : "Total Purchases"}
                      </p>
                      <h4 className="text-lg font-black text-slate-850 mt-0.5">
                        {supplierStats.totalAmount.toLocaleString()}{" "}
                        <span className="text-xs font-bold text-slate-500">MMK</span>
                      </h4>
                    </div>
                  </div>

                  {/* Total Orders Count */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">
                        {isMy ? "စုစုပေါင်း အော်ဒါအရေအတွက်" : "Total Orders"}
                      </p>
                      <h4 className="text-lg font-black text-slate-850 mt-0.5">
                        {supplierStats.count.toLocaleString()}{" "}
                        <span className="text-xs font-bold text-slate-500">
                          {isMy ? "စောင်" : "POs"}
                        </span>
                      </h4>
                    </div>
                  </div>

                  {/* Total Paid Amount */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                    <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">
                        {isMy ? "ပေးချေပြီးငွေ စုစုပေါင်း" : "Total Paid"}
                      </p>
                      <h4 className="text-lg font-black text-emerald-600 mt-0.5">
                        {supplierStats.totalPaid.toLocaleString()}{" "}
                        <span className="text-xs font-bold text-slate-500">MMK</span>
                      </h4>
                    </div>
                  </div>

                  {/* Total Remaining Debt */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
                    <div
                      className={`p-3.5 rounded-2xl ${
                        supplierStats.totalRemaining > 0
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">
                        {isMy ? "ပေးရန်ကျန် အကြွေး စုစုပေါင်း" : "Remaining Debt"}
                      </p>
                      <h4
                        className={`text-lg font-black mt-0.5 ${
                          supplierStats.totalRemaining > 0
                            ? "text-amber-700"
                            : "text-slate-700"
                        }`}
                      >
                        {supplierStats.totalRemaining.toLocaleString()}{" "}
                        <span className="text-xs font-bold text-slate-500">MMK</span>
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Quick Action & Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-[#f8faff] border border-indigo-100 rounded-2xl p-6 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-[#2216a8] font-bold text-sm mb-1">
                        <ShoppingCart className="w-4 h-4" />
                        <span>{isMy ? "ဝယ်ယူမှု အော်ဒါများ ကြည့်ရှုမည်" : "Purchase Orders"}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {isMy
                          ? `ဤ Supplier ထံမှ စုစုပေါင်း အော်ဒါ ${supplierStats.count} စောင် မှတ်တမ်းတင်ထားပါသည်။ Table အပြည့်အစုံ ကြည့်ရန် နှိပ်ပါ။`
                          : `Total of ${supplierStats.count} purchase orders recorded. Click to open full-page table.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("orders")}
                      className="self-start px-4 py-2 bg-[#2216a8] hover:bg-[#1b1187] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                    >
                      {isMy ? "အော်ဒါစာရင်း အပြည့်အစုံဖွင့်မည် →" : "View Full PO Table →"}
                    </button>
                  </div>

                  <div className="bg-[#f6fbf9] border border-emerald-100 rounded-2xl p-6 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                        <Package className="w-4 h-4" />
                        <span>{isMy ? "တင်သွင်းသော ကုန်ပစ္စည်းများ ကြည့်ရှုမည်" : "Supplied Products"}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {isMy
                          ? `ဤ Supplier နှင့် ချိတ်ဆက်ထားသော ကုန်ပစ္စည်း ${suppliedProducts.length} မျိုး ရှိပါသည်။ Table အပြည့်အစုံ ကြည့်ရန် နှိပ်ပါ။`
                          : `${suppliedProducts.length} products linked to this supplier. Click to open full-page table.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("products");
                        loadSuppliedProducts();
                      }}
                      className="self-start px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                    >
                      {isMy ? "ကုန်ပစ္စည်းစာရင်း အပြည့်အစုံဖွင့်မည် →" : "View Full Products Table →"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Purchase Orders Full-Page Tab */}
            {activeTab === "orders" && (
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                <PurchaseOrderList
                  poList={poList}
                  deletedPOList={deletedPOList}
                  suppliers={suppliers}
                  setIsCreateModalOpen={setIsCreateModalOpen}
                  loadPurchases={loadPurchases}
                  loadDeletedPurchases={loadDeletedPurchases}
                  onViewPO={handleViewPO}
                  pagination={poPagination}
                  deletedPagination={deletedPoPagination}
                  onCreateGRN={handleCreateGRNFromPO}
                  loading={poLoading}
                  poFilter={poFilter}
                  setPoFilter={setPoFilter}
                  paymentFilter={paymentFilter}
                  setPaymentFilter={setPaymentFilter}
                  hideStatusFilter={false}
                  hideHeaderTitle={false}
                  tableHeight="calc(100vh - 350px)"
                />
              </div>
            )}

            {/* Supplied Products Full-Page Tab */}
            {activeTab === "products" && (
              <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#2216a8]" />
                    <span>
                      {isMy
                        ? "ဤ Supplier ထံမှ ရရှိနိုင်သော ကုန်ပစ္စည်းများ"
                        : "Products supplied by this Supplier"}
                    </span>
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {suppliedProducts.length} {isMy ? "မျိုး" : "products"}
                  </span>
                </div>

                {loadingProducts ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-[#2216a8] animate-spin mb-3" />
                    <p className="text-xs text-slate-500 font-medium">
                      {isMy ? "ကုန်ပစ္စည်းများ ရယူနေပါသည်..." : "Loading products..."}
                    </p>
                  </div>
                ) : suppliedProducts.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-600">
                      {isMy
                        ? "ဤ Supplier နှင့် ချိတ်ဆက်ထားသော ကုန်ပစ္စည်း မရှိသေးပါ"
                        : "No products linked to this supplier yet"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {isMy
                        ? "Inventory စာမျက်နှာတွင် ပစ္စည်းထည့်သွင်း/ပြင်ဆင်ချိန်၌ ဤ Supplier ကို ရွေးချယ်ချိတ်ဆက်နိုင်ပါသည်"
                        : "You can link this supplier when creating or editing products in Inventory"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-700 text-xs font-bold border-b">
                        <tr>
                          <th className="p-3 w-12 text-center">No</th>
                          <th className="p-3">Product Code</th>
                          <th className="p-3">Product Name</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Buying Price</th>
                          <th className="p-3 text-right">Selling Price</th>
                          <th className="p-3 text-center">Total Stock</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {suppliedProducts.map((p, idx) => {
                          const totalStock = (p.stockWarehouse || 0) + (p.stockShop || 0);
                          return (
                            <tr key={p.id || p._id || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 text-center text-xs text-slate-400 font-bold">{idx + 1}</td>
                              <td className="p-3 font-mono text-xs font-bold text-[#2216a8]">
                                {p.productCode || "-"}
                              </td>
                              <td className="p-3 font-semibold text-slate-800">
                                {p.name || p.productName}
                              </td>
                              <td className="p-3">
                                <span className="inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                                  {p.category}
                                </span>
                              </td>
                              <td className="p-3 text-right font-medium text-slate-700">
                                {p.costPrice?.toLocaleString() || 0} MMK
                              </td>
                              <td className="p-3 text-right font-bold text-slate-900">
                                {p.sellingPrice?.toLocaleString() || 0} MMK
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                                    totalStock > (p.lowStockThreshold || 5)
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : totalStock > 0
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-red-50 text-red-700 border border-red-200"
                                  }`}
                                >
                                  {totalStock} {p.unitOfMeasure || "pcs"}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                    p.status === "inactive"
                                      ? "bg-slate-100 text-slate-500"
                                      : "bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {p.status || "active"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreatePOModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPO(null);
        }}
        suppliers={suppliers}
        products={products}
        onSuccess={() => {
          if (poFilter === "deleted") {
            loadDeletedPurchases(
              deletedPoPagination.currentPage,
              deletedPoPagination.itemsPerPage
            );
          } else {
            loadPurchases(
              poPagination.currentPage,
              poPagination.itemsPerPage,
              poFilter
            );
          }
          loadSupplierStats();
        }}
        defaultSupplierId={id}
        editingPO={editingPO}
      />

      <PODetailModal
        isOpen={isPODetailModalOpen}
        onClose={() => setIsPODetailModalOpen(false)}
        purchaseId={selectedPOId}
        suppliers={suppliers}
        onEdit={(purchase) => {
          setIsPODetailModalOpen(false);
          setEditingPO(purchase);
          setIsCreateModalOpen(true);
        }}
        onOrderUpdate={() => {
          if (poFilter === "deleted") {
            loadDeletedPurchases(
              deletedPoPagination.currentPage,
              deletedPoPagination.itemsPerPage
            );
          } else {
            loadPurchases(
              poPagination.currentPage,
              poPagination.itemsPerPage,
              poFilter
            );
          }
          loadSupplierStats();
        }}
      />

      {isCreateGRNModalOpen && selectedPOForGRN && (
        <CreateGRNModal
          isOpen={isCreateGRNModalOpen}
          onClose={() => setIsCreateGRNModalOpen(false)}
          purchaseOrders={poList}
          suppliers={suppliers}
          onSuccess={handleGRNSuccess}
          selectedPOId={selectedPOId}
        />
      )}
    </div>
  );
};
