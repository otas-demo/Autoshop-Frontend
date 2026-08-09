import { useState, useEffect } from "react";
import { Supplier, Product, ApiPurchaseOrder } from "../types";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { fetchPurchases } from "../services/Purchase/fetchPurchases";
import { fetchGRNs, GRNData } from "../services/Purchase/fetchGRNs";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

export type TabType = "po" | "grn";

export const usePurchasing = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("po");

  // Shared State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // PO State
  const [poList, setPOList] = useState<ApiPurchaseOrder[]>([]);
  const [deletedPOList, setDeletedPOList] = useState<ApiPurchaseOrder[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poFilter, setPoFilter] = useState<"pending" | "arrived" | "deleted">("pending");
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
  const [grnLoading, setGrnLoading] = useState(false);
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
    setPoLoading(true);
    try {
      const res = await fetchPurchases({ page, limit, status });
      if (res.success) {
        setPOList(res.data);
        setPoPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to load POs", error);
      toast.error(t("purchasing.failedToLoadPO"));
    } finally {
      setPoLoading(false);
    }
  };

  const loadDeletedPurchases = async (page: number = 1, limit: number = 10) => {
    setPoLoading(true);
    try {
      const res = await fetchPurchases({ page, limit, isDeleted: true });
      if (res.success) {
        setDeletedPOList(res.data);
        setDeletedPoPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to load deleted POs", error);
      toast.error("Failed to load deleted POs");
    } finally {
      setPoLoading(false);
    }
  };

  const loadGRNs = async (page: number = 1, limit: number = 10) => {
    setGrnLoading(true);
    try {
      const res = await fetchGRNs({ page, limit });
      if (res.success) {
        setGRNList(res.data);
        setGrnPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to load GRNs", error);
      toast.error(t("purchasing.failedToLoadGRN"));
    } finally {
      setGrnLoading(false);
    }
  };

  const handleGRNSuccess = () => {
    loadGRNs(grnPagination.currentPage);
    if (poFilter === "deleted") {
      loadDeletedPurchases(deletedPoPagination.currentPage, deletedPoPagination.itemsPerPage);
    } else {
      loadPurchases(poPagination.currentPage, poPagination.itemsPerPage, poFilter === "arrived" ? "arrived" : "pending");
    }
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

  return {
    activeTab,
    setActiveTab,
    suppliers,
    products,
    poList,
    deletedPOList,
    poLoading,
    poFilter,
    setPoFilter,
    poPagination,
    deletedPoPagination,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedPOId,
    isPODetailModalOpen,
    setIsPODetailModalOpen,
    grnList,
    grnLoading,
    grnPagination,
    isCreateGRNModalOpen,
    setIsCreateGRNModalOpen,
    selectedGRNId,
    isGRNDetailModalOpen,
    setIsGRNDetailModalOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    transferGRNId,
    loadPurchases,
    loadDeletedPurchases,
    loadGRNs,
    handleGRNSuccess,
    handleCreateGRNFromPO,
    handleViewPO,
    handleViewGRN,
    handleTransferGRN,
  };
};
