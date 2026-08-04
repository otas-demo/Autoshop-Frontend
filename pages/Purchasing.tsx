import React, { useState, useEffect } from "react";
import { ShoppingBag, FileText, PackageCheck, Plus } from "lucide-react";
import { Supplier, Product, ApiPurchaseOrder } from "../types";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { fetchPurchases } from "../services/Purchase/fetchPurchases";
import { fetchGRNs, GRNData } from "../services/Purchase/fetchGRNs";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";
import { PurchaseOrderList } from "../components/Purchasing/PurchaseOrderList";
import { CreatePOModal } from "../components/Purchasing/CreatePOModal";
import { GRNList } from "../components/Purchasing/GRNList";
import { CreateGRNModal } from "../components/Purchasing/CreateGRNModal";
import { GRNDetailModal } from "../components/Purchasing/GRNDetailModal";
import { PODetailModal } from "../components/Purchasing/PODetailModal";
import { TransferWarehouseModal } from "../components/Purchasing/TransferWarehouseModal";

type TabType = "po" | "grn";

export const Purchasing: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("po");

  // Shared State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // PO State
  const [poList, setPOList] = useState<ApiPurchaseOrder[]>([]);
  const [deletedPOList, setDeletedPOList] = useState<ApiPurchaseOrder[]>([]);
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [isPODetailModalOpen, setIsPODetailModalOpen] = useState(false);

  // GRN State
  const [grnList, setGRNList] = useState<GRNData[]>([]);
  const [grnPagination, setGrnPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isCreateGRNModalOpen, setIsCreateGRNModalOpen] = useState(false);
  const [selectedGRNId, setSelectedGRNId] = useState<string | null>(null);
  const [isGRNDetailModalOpen, setIsGRNDetailModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferGRNId, setTransferGRNId] = useState<string | null>(null);

  // Fetch Suppliers and Products
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch Suppliers
        const supplierRes = await fetchSuppliers();
        if (supplierRes.success) {
          setSuppliers(supplierRes.data);
        }

        // Fetch Products
        const productRes = await fetchProducts();
        if (productRes.success && Array.isArray(productRes.data)) {
          setProducts(productRes.data);
        } else if (Array.isArray(productRes)) {
          setProducts(productRes);
        } else if (productRes.data && Array.isArray(productRes.data)) {
          setProducts(productRes.data);
        }

        // Fetch Purchase Orders
        loadPurchases();

        // Fetch Deleted Purchase Orders
        loadDeletedPurchases();

        // Fetch GRNs
        loadGRNs();
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  const loadPurchases = async (
    page: number = 1,
    limit: number = 10,
    status: "pending" | "arrived" = "pending",
  ) => {
    try {
      const res = await fetchPurchases({ page, limit, status });
      if (res.success) {
        setPOList(res.data);
        setPoPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to load POs", error);
      toast.error(t("purchasing.failedToLoadPO"));
    }
  };

  const loadDeletedPurchases = async (page: number = 1, limit: number = 10) => {
    try {
      const res = await fetchPurchases({ page, limit, isDeleted: true });
      if (res.success) {
        setDeletedPOList(res.data);
        setDeletedPoPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to load deleted POs", error);
      toast.error("Failed to load deleted POs");
    }
  };

  const loadGRNs = async (page: number = 1, limit: number = 10) => {
    try {
      const res = await fetchGRNs({ page, limit });
      if (res.success) {
        setGRNList(res.data);
        setGrnPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to load GRNs", error);
      toast.error(t("purchasing.failedToLoadGRN"));
    }
  };

  const handleGRNSuccess = () => {
    loadGRNs(grnPagination.currentPage);
    loadPurchases(poPagination.currentPage);
  };

  const handleCreateGRNFromPO = (po: ApiPurchaseOrder) => {
    setSelectedPOId(po._id);
    setIsCreateGRNModalOpen(true);
  };

  const handleViewPO = (po: ApiPurchaseOrder) => {
    setSelectedPOId(po._id);
    setIsPODetailModalOpen(true);
  };

  const handleViewGRN = (grn: GRNData) => {
    setSelectedGRNId(grn._id);
    setIsGRNDetailModalOpen(true);
  };

  const handleTransferGRN = (grn: GRNData) => {
    setTransferGRNId(grn._id);
    setIsTransferModalOpen(true);
  };

  const isMy = language === "my";

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-850">
              {isMy ? "ပစ္စည်း အမှာစာရင်း" : "Purchasing Records"}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-bold">
              {isMy 
                ? "ဆိုင်အတွက် ပစ္စည်းတွေ မှာမယ် , မှာထားတဲ့ ပစ္စည်းစာရင်းတွေစစ်မယ်" 
                : "Order items for shop, check list of ordered items"}
            </p>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="flex gap-1 sm:gap-4 border-b border-gray-100 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("po")}
            className={`px-4 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "po"
                ? "border-b-2 border-[#2216a8] text-[#2216a8]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isMy ? "ဝယ်ယူမှု အော်ဒါ စာရင်းများ" : "Purchase Orders"}</span>
          </button>
          <button
            onClick={() => setActiveTab("grn")}
            className={`px-4 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "grn"
                ? "border-b-2 border-[#2216a8] text-[#2216a8]"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>{isMy ? "ပစ္စည်းလက်ခံ စာရင်းများ" : "Goods Received Notes"}</span>
          </button>
        </div>

        {/* Active Tab Content Title and Action Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-800">
            {activeTab === "po" 
              ? (isMy ? "ဝယ်ယူမှု အော်ဒါ စာရင်းများ" : "Purchase Orders List")
              : (isMy ? "ပစ္စည်းလက်ခံ စာရင်းများ" : "Goods Received Notes List")
            }
          </h2>
          <button
            onClick={() => {
              if (activeTab === "po") {
                setIsCreateModalOpen(true);
              } else {
                setIsCreateGRNModalOpen(true);
              }
            }}
            className="bg-[#2216a8] hover:bg-[#2216a8]/90 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>{isMy ? "စာရင်းအသစ်ထည့်မယ်" : "Create New"}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="w-full">
          {/* PO Tab */}
          {activeTab === "po" && (
            <div className="space-y-6">
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
              />
              <CreatePOModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                suppliers={suppliers}
                products={products}
                onSuccess={loadPurchases}
              />
              <PODetailModal
                isOpen={isPODetailModalOpen}
                onClose={() => setIsPODetailModalOpen(false)}
                purchaseId={selectedPOId}
                suppliers={suppliers}
              />
            </div>
          )}

          {/* GRN Tab */}
          {activeTab === "grn" && (
            <div className="space-y-6">
              <GRNList
                grnList={grnList}
                setIsCreateModalOpen={setIsCreateGRNModalOpen}
                onStatusChange={loadGRNs}
                onViewGRN={handleViewGRN}
                onTransferGRN={handleTransferGRN}
                pagination={grnPagination}
              />
            </div>
          )}
        </div>
      </div>

      {/* Global Modals - accessible from any tab */}
      <CreateGRNModal
        isOpen={isCreateGRNModalOpen}
        onClose={() => setIsCreateGRNModalOpen(false)}
        purchaseOrders={poList}
        suppliers={suppliers}
        onSuccess={handleGRNSuccess}
        selectedPOId={selectedPOId}
      />
      <GRNDetailModal
        isOpen={isGRNDetailModalOpen}
        onClose={() => setIsGRNDetailModalOpen(false)}
        grnId={selectedGRNId}
        onGRNUpdate={loadGRNs}
      />
      <TransferWarehouseModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        grnId={transferGRNId}
        onSuccess={handleGRNSuccess}
      />
    </div>
  );
};
