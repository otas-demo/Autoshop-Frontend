import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Store,
  AlertTriangle,
  Box,
  RefreshCw,
  Package,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
  Search,
  Filter,
  ArrowRightLeft,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import { fetchStorefrontExpiringStock } from "../services/Storefront/fetchStorefrontExpiringStock";
import { formatExpiryDate, getExpiryStatus, ExpiryStatus } from "../utils/expiryUtils";
import {
  updateStorefrontStockQuantity,
  UpdateStorefrontStockQuantityPayload,
} from "../services/Storefront/updateStorefrontStockQuantity";
import { fetchCategories } from "../services/Inventory/fetchCategories";
import { ProductDetailModal } from "../components/Inventory/ProductDetailModal";
import { fetchProductById, ProductDetail } from "../services/Inventory/fetchProductById";
import {
  createWarehouseTransfer,
  TransferLineItem,
} from "../services/Warehouse/createWarehouseTransfer";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { fetchWarehouseProfiles } from "../services/Warehouse/fetchWarehouseProfiles";
import { WarehouseProfile } from "../types";

interface TransferFormItem {
  productCode: string;
  productName: string;
  quantity: number;
  maxQuantity: number;
  batchNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  notes?: string;
}

export const StorefrontDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Get user role from localStorage (set during login)
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  // Get storefront info from location state if available
  const storefrontInfo = location.state as {
    storefrontName?: string;
    storefrontCode?: string;
  } | null;

  const [stockItems, setStockItems] = useState<StorefrontStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [storefrontName, setStorefrontName] = useState(
    storefrontInfo?.storefrontName || "Storefront",
  );
  const [storefrontCode, setStorefrontCode] = useState(
    storefrontInfo?.storefrontCode || "",
  );
  const [totalProduct, setTotalProduct] = useState(0);
  const [totalproductQuantity, setTotalproductQuantity] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 100;

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<"storefront" | "warehouse">("warehouse");
  const [transferItems, setTransferItems] = useState<TransferFormItem[]>([]);
  const [batchStockItems, setBatchStockItems] = useState<StorefrontStockItem[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseProfile[]>([]);
  const [transferQtyDrafts, setTransferQtyDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    loadStorefrontStock();
  }, [id, currentPage, itemsPerPage, selectedCategory, searchTerm, showExpiringOnly, expiryDays]);

  useEffect(() => {
    loadCategories();
    loadStorefronts();
    loadWarehouses();
  }, []);

  useEffect(() => {
    if (!isTransferModalOpen) {
      setTransferQtyDrafts({});
    }
  }, [isTransferModalOpen]);

  useEffect(() => {
    const loadBatchStockItems = async () => {
      const firstItem = transferItems[0];
      if (firstItem && firstItem.batchNumber && id) {
        try {
          const res = await fetchStorefrontStock(id, 1, 1000, undefined, undefined, firstItem.batchNumber);
          if (res.success && res.data) {
            setBatchStockItems(res.data);
          }
        } catch (error) {
          console.error("Failed to load batch stock items", error);
        }
      } else {
        setBatchStockItems([]);
      }
    };

    loadBatchStockItems();
  }, [transferItems[0]?.batchNumber, id]);

  const loadCategories = async () => {
    try {
      const response = await fetchCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadStorefronts = async () => {
    try {
      const response = await fetchStorefrontProfiles();
      if (response.success && response.data) {
        const currentIdStr = String(id || "").toLowerCase();
        setStorefronts(response.data.filter((s) => s.status === "active" && String(s._id).toLowerCase() !== currentIdStr));
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await fetchWarehouseProfiles();
      if (response.success && response.data) {
        setWarehouses(response.data.filter((w) => w.status === "active"));
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const loadStorefrontStock = async () => {
    if (!id) {
      toast.error("Storefront ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (showExpiringOnly) {
        const response = await fetchStorefrontExpiringStock(id, expiryDays);
        if (response.success) {
          let data = response.data;
          if (selectedCategory && selectedCategory !== "all") {
            data = data.filter(item => item.inventoryId?.category === selectedCategory);
          }
          if (searchTerm && searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            data = data.filter(item =>
              item.inventoryId?.productName?.toLowerCase().includes(term) ||
              item.inventoryId?.productCode?.toLowerCase().includes(term) ||
              item.batchNumber?.toLowerCase().includes(term)
            );
          }
          // Map to StorefrontStockItem type since backend returns WarehouseStockItem structure
          setStockItems(data as any);
          setTotalProduct(data.length);
          setTotalproductQuantity(data.reduce((sum, item) => sum + item.quantity, 0));
          setTotalAmount(data.reduce((sum, item) => sum + (item.quantity * (item.inventoryId?.sellingPrice || 0)), 0));
          setTotalPages(1);
          setTotalItems(data.length);
        } else {
          toast.error(response.message || "Failed to load expiring stock");
        }
      } else {
        const response = await fetchStorefrontStock(
          id,
          currentPage,
          itemsPerPage,
          selectedCategory,
          searchTerm,
        );
        if (response.success) {
          if (response.summary) {
            setTotalProduct(response.summary.totalProducts);
            setTotalproductQuantity(response.summary.totalQuantity);
            setTotalAmount(response.summary.totalAmount);
          }
          setStockItems(response.data);

          // Update pagination info
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages);
            setTotalItems(response.pagination.totalItems);
            setCurrentPage(response.pagination.currentPage);
          }

          // Update storefront info from first item if not provided via state
          if (response.data.length > 0 && !storefrontInfo) {
            const firstItem = response.data[0];
            setStorefrontName(
              firstItem.storefrontId.locationName ||
              firstItem.storefrontId.storefrontName ||
              "Storefront",
            );
            setStorefrontCode(
              firstItem.storefrontId.locationCode ||
              firstItem.storefrontId.storefrontCode ||
              "",
            );
          }
        } else {
          toast.error(response.message || "Failed to load storefront stock");
        }
      }
    } catch (error) {
      console.error("Error loading storefront stock:", error);
      toast.error("Failed to load storefront stock");
    } finally {
      setLoading(false);
    }
  };

  console.log(stockItems);

  const totalQuantity = stockItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const lowStockCount = stockItems.filter((item) => item.isLowStock).length;

  // Filter stock items (search and category filtering handled by API)
  const filteredStockItems = stockItems.filter((item) => {
    const hideProduct = item.inventoryId._id === "69a15d55218ec5ff9a3fe4a3";
    return !hideProduct;
  });

  // Calculate totals based on filtered items
  const filteredTotalQuantity = filteredStockItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const filteredLowStockCount = filteredStockItems.filter(
    (item) => item.isLowStock,
  ).length;

  // Calculate total amount for each item and storefront total
  const totalStorefrontAmount = stockItems.reduce((sum, item) => {
    const sellingPrice = item.inventoryId.sellingPrice || 0;
    const itemTotal = item.quantity * sellingPrice;
    return sum + itemTotal;
  }, 0);

  // Stock Adjustment Modal State
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] =
    useState<StorefrontStockItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">(
    "increase",
  );
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Product Detail Modal State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleViewDetails = async (productId: string) => {
    setLoadingDetail(true);
    setIsDetailModalOpen(true);
    try {
      const response = await fetchProductById(productId);
      if (response.success && response.data) {
        setSelectedProductDetail(response.data);
      } else {
        toast.error("Failed to load product details");
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast.error("Failed to load product details");
      setIsDetailModalOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Transfer Modal Functions
  const getTransferMaxQuantity = (item: StorefrontStockItem) =>
    Math.max(item.availableQuantity || 0, item.quantity || 0);

  const getTransferQtyValue = (index: number, item: TransferFormItem) =>
    transferQtyDrafts[index] ?? String(item.quantity || 1);

  const commitTransferQuantity = (index: number) => {
    const item = transferItems[index];
    if (!item) return;

    const raw = transferQtyDrafts[index] ?? String(item.quantity || 1);
    const maxQuantity = item.maxQuantity || 0;
    const qty =
      maxQuantity > 0
        ? Math.max(1, Math.min(parseInt(raw, 10) || 1, maxQuantity))
        : 0;

    setTransferItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, quantity: qty } : row)),
    );
    setTransferQtyDrafts((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const openTransferModal = (type: "storefront" | "warehouse", item?: StorefrontStockItem) => {
    if (item) {
      const maxQuantity = getTransferMaxQuantity(item);
      if (maxQuantity <= 0) {
        toast.error("This product has no available stock to transfer");
        return;
      }

      setTransferItems([
        {
          productCode: item.inventoryId.productCode,
          productName: item.inventoryId.productName,
          quantity: maxQuantity,
          maxQuantity,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          manufacturingDate: item.manufacturingDate,
          notes: "",
        },
      ]);
    } else {
      setTransferItems([]);
    }
    setSelectedStorefrontId("");
    setSelectedWarehouseId("");
    setTransferType(type);
    setTransferDate(new Date().toISOString().split("T")[0]);
    setTransferNotes("");
    setIsTransferModalOpen(true);
  };

  const addTransferItem = async () => {
    const usedCodes = transferItems.map((i) => i.productCode);
    const requiredBatch = transferItems.length > 0 ? transferItems[0].batchNumber : null;

    let baseItems = stockItems;
    let fetchedFromBatch = false;

    // If there is a requiredBatch, fetch all items with that batch from the API directly (not limited by pagination)
    if (requiredBatch && id) {
      try {
        const res = await fetchStorefrontStock(id, 1, 1000, undefined, undefined, requiredBatch);
        if (res.success && res.data) {
          baseItems = res.data;
          setBatchStockItems(res.data);
          fetchedFromBatch = true;
        }
      } catch (error) {
        console.error("Failed to load batch stock items", error);
      }
    }

    const availableProducts = baseItems.filter(
      (item) =>
        !usedCodes.includes(item.inventoryId.productCode) &&
        getTransferMaxQuantity(item) > 0 &&
        // If fetched from batch API, API already filtered by batch — skip client-side batch check
        (fetchedFromBatch || requiredBatch === null || item.batchNumber === requiredBatch),
    );

    if (availableProducts.length === 0) {
      toast.error(
        requiredBatch
          ? `No more products available with the same batch number "${requiredBatch}" to add.`
          : "No more products available to add.",
      );
      return;
    }

    const firstAvailable = availableProducts[0];
    const maxQuantity = getTransferMaxQuantity(firstAvailable);

    setTransferItems([
      ...transferItems,
      {
        productCode: firstAvailable.inventoryId.productCode,
        productName: firstAvailable.inventoryId.productName,
        quantity: 1,
        maxQuantity: maxQuantity,
        notes: "",
        // Use requiredBatch if fetched from batch API (batchNumber field may not be in response)
        batchNumber: fetchedFromBatch ? requiredBatch : firstAvailable.batchNumber,
        expiryDate: firstAvailable.expiryDate,
        manufacturingDate: firstAvailable.manufacturingDate,
      },
    ]);
  };

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const updateTransferItem = (
    index: number,
    field: keyof TransferFormItem,
    value: string | number,
  ) => {
    const updated = [...transferItems];

    if (field === "productCode") {
      const stockItem = stockItems.find(
        (item) => item.inventoryId.productCode === value,
      );
      if (stockItem) {
        const maxQuantity = getTransferMaxQuantity(stockItem);
        updated[index] = {
          ...updated[index],
          productCode: value as string,
          productName: stockItem.inventoryId.productName,
          maxQuantity,
          quantity:
            maxQuantity > 0
              ? Math.min(updated[index].quantity || 1, maxQuantity)
              : 0,
          batchNumber: stockItem.batchNumber,
          expiryDate: stockItem.expiryDate,
          manufacturingDate: stockItem.manufacturingDate,
        };
        setTransferQtyDrafts((prev) => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }
    } else if (field === "quantity") {
      const maxQuantity = updated[index].maxQuantity || 0;
      const qty =
        maxQuantity > 0
          ? Math.max(1, Math.min(Number(value) || 1, maxQuantity))
          : 0;
      updated[index] = { ...updated[index], quantity: qty };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }

    setTransferItems(updated);
  };

  const handleSubmitTransfer = async () => {
    if (transferType === "storefront" && !selectedStorefrontId) {
      toast.error("Please select a destination storefront");
      return;
    }
    if (transferType === "warehouse" && !selectedWarehouseId) {
      toast.error("Please select a destination warehouse");
      return;
    }

    if (transferItems.length === 0) {
      toast.error("Please add at least one product to transfer");
      return;
    }

    const itemsToSubmit = transferItems.map((item, index) => {
      if (transferQtyDrafts[index] === undefined) {
        return item;
      }

      const raw = transferQtyDrafts[index];
      const maxQuantity = item.maxQuantity || 0;
      const qty =
        maxQuantity > 0
          ? Math.max(1, Math.min(parseInt(raw, 10) || 1, maxQuantity))
          : 0;

      return { ...item, quantity: qty };
    });

    for (const item of itemsToSubmit) {
      if (item.quantity <= 0) {
        toast.error(`Quantity for ${item.productName} must be greater than 0`);
        return;
      }
      if (item.quantity > item.maxQuantity) {
        toast.error(
          `Quantity for ${item.productName} exceeds available stock (${item.maxQuantity})`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const lineItems: TransferLineItem[] = itemsToSubmit.map((item) => ({
        productCode: item.productCode,
        quantity: item.quantity,
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
        manufacturingDate: item.manufacturingDate,
        ...(item.notes && { notes: item.notes }),
      }));

      const payload: any = {
        sourceType: "Storefront",
        sourceStorefrontId: id!,
        lineItems,
        transferDate,
        ...(transferNotes && { notes: transferNotes }),
      };

      if (transferType === "storefront") {
        payload.destinationStorefrontId = selectedStorefrontId;
      } else {
        payload.destinationWarehouseId = selectedWarehouseId;
      }

      const result = await createWarehouseTransfer(payload);

      if (result.success) {
        toast.success("Transfer created successfully!");
        setTransferQtyDrafts({});
        setIsTransferModalOpen(false);
        loadStorefrontStock(); // Refresh stock
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableProductsForItem = (currentCode: string) => {
    const usedCodes = transferItems
      .map((i) => i.productCode)
      .filter((code) => code !== currentCode);

    const requiredBatch = transferItems.length > 1 ? transferItems[0].batchNumber : null;

    // If requiredBatch is set, use batchStockItems (API already filtered by batch)
    const usingBatchItems = requiredBatch && batchStockItems.length > 0;
    const baseItems = usingBatchItems ? batchStockItems : stockItems;

    return baseItems.filter(
      (item) =>
        !usedCodes.includes(item.inventoryId.productCode) &&
        getTransferMaxQuantity(item) > 0 &&
        // If using batch API results, batchNumber check is already done server-side
        (usingBatchItems || requiredBatch === null || item.batchNumber === requiredBatch),
    );
  };

  // Stock Adjustment Functions
  const openAdjustmentModal = (
    item: StorefrontStockItem,
    type: "increase" | "decrease",
  ) => {
    setSelectedStockItem(item);
    setAdjustmentType(type);
    setAdjustmentQuantity(0);
    setAdjustmentReason("");
    setIsAdjustmentModalOpen(true);
  };

  const handleSubmitAdjustment = async () => {
    if (!selectedStockItem) return;

    if (adjustmentQuantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // For decrease, check if quantity is available
    if (
      adjustmentType === "decrease" &&
      adjustmentQuantity > selectedStockItem.quantity
    ) {
      toast.error(
        `Cannot decrease by ${adjustmentQuantity}. Available quantity is ${selectedStockItem.quantity}`,
      );
      return;
    }

    setIsAdjusting(true);
    try {
      const quantityChange =
        adjustmentType === "increase"
          ? adjustmentQuantity
          : -adjustmentQuantity;

      const payload: UpdateStorefrontStockQuantityPayload = {
        quantityChange,
        reason: adjustmentReason.trim() || "",
      };

      const result = await updateStorefrontStockQuantity(
        selectedStockItem._id,
        payload,
      );

      if (result.success) {
        toast.success(
          `Stock ${adjustmentType === "increase" ? "increased" : "decreased"
          } successfully!`,
        );
        setIsAdjustmentModalOpen(false);
        setSelectedStockItem(null);
        setAdjustmentQuantity(0);
        setAdjustmentReason("");
        loadStorefrontStock(); // Refresh stock
      } else {
        toast.error(result.message || "Failed to update stock quantity");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update stock quantity");
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-2rem)]">
      <div className="bg-white h-full border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate("/storefront")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                <span className="truncate">{storefrontName}</span>
                {storefrontCode && (
                  <span className="text-xs sm:text-sm px-2 py-1 bg-primary/20 text-primary-700 rounded-full font-medium flex-shrink-0">
                    {storefrontCode}
                  </span>
                )}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Storefront Stock Inventory
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center ">
            {/* {userRole === "owner" && (
              <>
                <button
                  onClick={() => openTransferModal("storefront")}
                  disabled={stockItems.length === 0}
                  className="flex h-auto sm:h-10 items-center gap-2 px-3 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Transfer to Storefront</span>
                  <span className="sm:hidden">Storefront</span>
                </button>
                <button
                  onClick={() => openTransferModal("warehouse")}
                  disabled={stockItems.length === 0}
                  className="flex h-auto sm:h-10 items-center gap-2 px-3 py-2 sm:px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Transfer to Warehouse</span>
                  <span className="sm:hidden">Warehouse</span>
                </button>
              </>
            )} */}

            <button
              onClick={loadStorefrontStock}
              disabled={loading}
              className="hidden md:flex items-center gap-2 px-3 py-2 sm:px-4 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by product name or code..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="sm:w-64">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expiry Filter */}
            <div className="sm:w-64">
              <button
                type="button"
                onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                className={`w-full px-4 py-2 border rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer ${showExpiringOnly
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
              >
                <AlertTriangle className="w-4 h-4" />
                {showExpiringOnly ? "Showing Expiring Soon" : "Filter Expiring Soon"}
              </button>
            </div>

            {showExpiringOnly && (
              <div className="sm:w-32">
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none font-semibold text-red-700 bg-red-50 border-red-200 cursor-pointer"
                >
                  <option value={15}>15 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>
            )}

            {/* Clear Filters */}
            {(searchTerm || selectedCategory !== "all" || showExpiringOnly) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setShowExpiringOnly(false);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 sm:px-4 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Clear Filters</span>
                <span className="sm:hidden">Clear</span>
              </button>
            )}
          </div>

          {/* Filter Results Summary */}
          {(searchTerm || selectedCategory !== "all" || showExpiringOnly) && (
            <div className="mt-3 text-sm text-slate-500">
              Showing {filteredStockItems.length} of {stockItems.length} items
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Box className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500">
                  Total Products
                </p>
                {/* <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                {searchTerm || selectedCategory !== "all"
                  ? filteredStockItems.length
                  : stockItems.length}
              </p> */}
                <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                  {totalProduct}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500">
                  Total Quantity
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                  {totalproductQuantity}
                </p>
              </div>
            </div>
          </div>

          {/* <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-slate-500">Low Stock</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-800 truncate">
                {searchTerm || selectedCategory !== "all"
                  ? filteredLowStockCount
                  : lowStockCount}
              </p>
            </div>
          </div>
        </div> */}

          <div className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-indigo-100 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Store className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-slate-500">Total Amount</p>
                <p className="text-lg sm:text-2xl font-bold text-indigo-600 truncate">
                  {/* {searchTerm || selectedCategory !== "all"
                  ? filteredStockItems
                      .reduce((sum, item) => {
                        const sellingPrice = item.inventoryId.sellingPrice || 0;
                        const itemTotal = item.quantity * sellingPrice;
                        return sum + itemTotal;
                      }, 0)
                      .toLocaleString()
                  : totalStorefrontAmount.toLocaleString()}{" "} */}
                  {totalAmount ? totalAmount.toLocaleString() : 0}
                  <span className="hidden sm:inline"> MMK</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Items Table */}
        <div className="bg-white rounded-xl shadow-sm border flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 border-b bg-slate-50 flex-shrink-0">
            <h2 className="font-semibold text-slate-800">Stock Items</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 flex-1 overflow-y-auto">
              Loading stock items...
            </div>
          ) : filteredStockItems.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex-1 overflow-y-auto">
              {searchTerm || selectedCategory !== "all" ? (
                <div>
                  <p className="font-medium mb-2">
                    No items found matching your filters
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setCurrentPage(1);
                    }}
                    className="text-primary hover:text-primary-700 underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                "No stock items found in this storefront."
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Mobile scroll indicator */}
              <div className="sm:hidden px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center">
                ← Swipe to see more →
              </div>

              {/* Table container with horizontal scroll on mobile */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[1000px]">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Product Name</span>
                        <span className="sm:hidden">Name</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Product Code</span>
                        <span className="sm:hidden">Code</span>
                      </th>
                      {/* <th className="px-4 py-3 font-medium text-slate-600">SKU</th> */}
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        Category
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                        Qty
                      </th>
                      {/* <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                      <span className="hidden sm:inline">Available</span>
                      <span className="sm:hidden">Avail</span>
                    </th> */}
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                        <span className="hidden sm:inline">Price</span>
                        <span className="sm:hidden">$</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600 text-right">
                        <span className="hidden sm:inline">Total</span>
                        <span className="sm:hidden">T</span>
                      </th>
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Status</span>
                        <span className="sm:hidden">S</span>
                      </th>
                      {/* <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Updated</span>
                        <span className="sm:hidden">U</span>
                      </th> */}
                      <th className="px-2 sm:px-4 py-3 font-medium text-slate-600">
                        <span className="hidden sm:inline">Actions</span>
                        <span className="sm:hidden">A</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStockItems.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50">
                        <td className="px-2 sm:px-4 py-3 font-medium text-slate-800">
                          <div
                            className="max-w-[150px] sm:max-w-none truncate"
                            title={item.inventoryId.productName}
                          >
                            {item.inventoryId.productName}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-slate-600">
                          <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">
                            {item.inventoryId.productCode}
                          </span>
                          {item.batchNumber && item.batchNumber !== "__LEGACY__" && (
                            <div className="text-[10px] text-indigo-600 mt-1 font-semibold">
                              Batch: {item.batchNumber}
                            </div>
                          )}
                        </td>
                        {/* <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                        {item.inventoryId.SKU}
                      </td> */}
                        <td className="px-2 sm:px-4 py-3">
                          <span className="bg-primary/20 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                            {item.inventoryId.category}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-right font-bold text-slate-800 text-xs sm:text-sm">
                          {item.quantity}
                        </td>
                        {/* <td className="px-2 sm:px-4 py-3 text-right text-slate-600 text-xs sm:text-sm">
                        {item.availableQuantity}
                      </td> */}
                        <td className="px-2 sm:px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                          {(item.inventoryId.sellingPrice || 0).toLocaleString()}{" "}
                          <span className="hidden sm:inline">MMK</span>
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-right font-bold text-slate-800 text-xs sm:text-sm">
                          {(
                            item.quantity * (item.inventoryId.sellingPrice || 0)
                          ).toLocaleString()}{" "}
                          <span className="hidden sm:inline">MMK</span>
                        </td>
                        <td className="px-2 sm:px-4 py-3">
                          {item.expiryDate ? (
                            <div className="flex flex-col gap-1">
                              {getExpiryStatus(item.expiryDate) === ExpiryStatus.EXPIRED ? (
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit border border-red-200">
                                  Expired ({formatExpiryDate(item.expiryDate)})
                                </span>
                              ) : getExpiryStatus(item.expiryDate) === ExpiryStatus.EXPIRING_SOON ? (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit border border-yellow-200">
                                  Expiring Soon ({formatExpiryDate(item.expiryDate)})
                                </span>
                              ) : (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit border border-green-200">
                                  Valid ({formatExpiryDate(item.expiryDate)})
                                </span>
                              )}
                            </div>
                          ) : (
                            item.isLowStock ? (
                              <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />{" "}
                                <span className="hidden sm:inline">Low Stock</span>
                                <span className="sm:hidden">Low</span>
                              </span>
                            ) : item.quantity === 0 ? (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                                <span className="hidden sm:inline">
                                  Out of Stock
                                </span>
                                <span className="sm:hidden">Out</span>
                              </span>
                            ) : (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                <span className="hidden sm:inline">In Stock</span>
                                <span className="sm:hidden">In</span>
                              </span>
                            )
                          )}
                        </td>
                        {/* <td className="px-2 sm:px-4 py-3 text-slate-500 text-xs">
                          <span className="hidden sm:inline">
                            {new Date(item.lastUpdated).toLocaleDateString()}{" "}
                            {new Date(item.lastUpdated).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span className="sm:hidden">
                            {new Date(item.lastUpdated).toLocaleDateString()}
                          </span>
                        </td> */}
                        <td className="px-2 sm:px-4 py-3">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <button
                              onClick={() => handleViewDetails(item.inventoryId._id)}
                              className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 sm:px-3 sm:py-1.5 rounded hover:bg-indigo-100 border border-indigo-200 font-medium transition-colors"
                            >
                              Check
                            </button>
                            {userRole === "owner" && (
                              <>
                                {/* <button
                                  onClick={() => openTransferModal("warehouse", item)}
                                  disabled={item.quantity === 0}
                                  className="text-xs bg-blue-50 text-primary-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded hover:bg-blue-100 border border-blue-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <ArrowRightLeft className="w-3 h-3" />{" "}
                                  <span className="hidden sm:inline">Transfer</span>
                                  <span className="sm:hidden">T</span>
                                </button>  */}
                                <button
                                  onClick={() =>
                                    openAdjustmentModal(item, "increase")
                                  }
                                  className="text-xs bg-green-50 text-green-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded hover:bg-green-100 border border-green-200 font-medium transition-colors flex items-center gap-1"
                                  title="Increase Stock"
                                >
                                  <TrendingUp className="w-3 h-3" /> +
                                </button>
                                <button
                                  onClick={() =>
                                    openAdjustmentModal(item, "decrease")
                                  }
                                  disabled={item.quantity === 0}
                                  className="text-xs bg-red-50 text-red-600 px-2 py-1 sm:px-3 sm:py-1.5 rounded hover:bg-red-100 border border-red-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Decrease Stock"
                                >
                                  <TrendingDown className="w-3 h-3" /> -
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* <tfoot className="bg-slate-50 border-t-2">
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-4 font-bold text-slate-800 text-right"
                    >
                      Total:
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-800">
                      {totalQuantity}
                    </td>
                    <td className="px-4 py-4 text-right font-medium text-slate-600">
                      -
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-indigo-600 text-lg">
                      {totalStorefrontAmount.toLocaleString()} MMK
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot> */}
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border">
              <div className="text-sm text-slate-600">
                Showing{" "}
                {stockItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}{" "}
                to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                {totalItems} items
              </div>

              <div className="flex items-center gap-2">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  First
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${currentPage === pageNum
                          ? "bg-primary text-white border-primary"
                          : "hover:bg-slate-50"
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Last
                </button>
              </div>

              {/* Items per page selector */}
              {/* <div className="flex items-center gap-2 text-sm">
              <label className="text-slate-600">Per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary outline-none"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div> */}
            </div>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {isAdjustmentModalOpen && selectedStockItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {adjustmentType === "increase" ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
                {adjustmentType === "increase"
                  ? "Increase Stock"
                  : "Decrease Stock"}
              </h2>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product Info */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Product</p>
                <p className="font-bold text-slate-800">
                  {selectedStockItem.inventoryId.productName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedStockItem.inventoryId.productCode} | Current
                  Quantity: {selectedStockItem.quantity}
                </p>
              </div>

              {/* Adjustment Type Info */}
              <div
                className={`p-3 rounded-lg ${adjustmentType === "increase"
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
                  }`}
              >
                <p className="text-sm font-medium">
                  {adjustmentType === "increase"
                    ? "This will increase the stock quantity"
                    : "This will decrease the stock quantity"}
                </p>
                {adjustmentType === "decrease" && (
                  <p className="text-xs text-red-600 mt-1">
                    Available to decrease: {selectedStockItem.quantity}
                  </p>
                )}
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity to {adjustmentType === "increase" ? "Add" : "Remove"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={
                    adjustmentType === "decrease"
                      ? selectedStockItem.quantity
                      : undefined
                  }
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter quantity"
                  value={adjustmentQuantity || ""}
                  onChange={(e) =>
                    setAdjustmentQuantity(Number(e.target.value) || 0)
                  }
                />
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter reason for stock adjustment (optional)..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAdjustment}
                  disabled={isAdjusting || adjustmentQuantity <= 0}
                  className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2 ${adjustmentType === "increase"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                    }`}
                >
                  {isAdjusting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      {adjustmentType === "increase" ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}{" "}
                      {adjustmentType === "increase"
                        ? "Increase Stock"
                        : "Decrease Stock"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        loading={loadingDetail}
        product={selectedProductDetail}
        restrictLocationType="storefront"
        restrictLocationId={id}
        onTransfer={(targetType, locationBatch) => {
          setIsDetailModalOpen(false);
          openTransferModal(targetType, {
            _id: locationBatch.locationId,
            inventoryId: {
              _id: selectedProductDetail?._id || "",
              productName: selectedProductDetail?.productName || "",
              productCode: selectedProductDetail?.productCode || "",
              category: selectedProductDetail?.category || "",
              sellingPrice: selectedProductDetail?.sellingPrice || 0,
            } as any,
            storefrontId: {
              _id: id!,
              locationName: storefrontName,
              locationCode: storefrontCode,
            } as any,
            quantity: locationBatch.quantity,
            availableQuantity: locationBatch.quantity,
            batchNumber: locationBatch.batchNumber,
            expiryDate: locationBatch.expiryDate,
            manufacturingDate: locationBatch.manufacturingDate,
            isLowStock: false,
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProductDetail(null);
          setLoadingDetail(false);
        }}
      />

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-primary-600" />
                {transferType === "storefront" ? "Transfer to Storefront" : "Transfer to Warehouse"}
              </h2>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Source Storefront Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  Source Storefront
                </p>
                <p className="text-lg font-bold text-blue-800">
                  {storefrontName}{" "}
                  {storefrontCode && <span className="text-sm font-normal">({storefrontCode})</span>}
                </p>
              </div>

              {/* Destination Selector */}
              {transferType === "storefront" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Destination Storefront <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                    value={selectedStorefrontId}
                    onChange={(e) => setSelectedStorefrontId(e.target.value)}
                  >
                    <option value="">Select Storefront...</option>
                    {storefronts.map((sf) => (
                      <option key={sf._id} value={sf._id}>
                        {sf.locationName} ({sf.locationCode})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Destination Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.locationName} ({w.locationCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Transfer Items */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-medium text-slate-700">
                    Products to Transfer <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={addTransferItem}
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Product
                  </button>
                </div>

                {transferItems.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-slate-400">
                    <p>No products added yet.</p>
                    <button
                      onClick={addTransferItem}
                      className="mt-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add your first product
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transferItems.map((item, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-slate-50"
                      >
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5">
                            <label className="block text-xs text-slate-500 mb-1">
                              Product
                            </label>
                            <select
                              className="w-full border rounded p-2 text-sm"
                              value={item.productCode}
                              onChange={(e) =>
                                updateTransferItem(
                                  index,
                                  "productCode",
                                  e.target.value,
                                )
                              }
                            >
                              {getAvailableProductsForItem(
                                item.productCode,
                              ).map((stockItem) => (
                                <option
                                  key={stockItem.inventoryId.productCode}
                                  value={stockItem.inventoryId.productCode}
                                >
                                  {stockItem.inventoryId.productName} (
                                  {stockItem.inventoryId.productCode})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">
                              Qty (max: {item.maxQuantity || 0})
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={item.maxQuantity || 0}
                              disabled={!item.maxQuantity}
                              className="w-full border rounded p-2 text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                              value={getTransferQtyValue(index, item)}
                              onChange={(e) => {
                                setTransferQtyDrafts((prev) => ({
                                  ...prev,
                                  [index]: e.target.value,
                                }));
                              }}
                              onBlur={() => commitTransferQuantity(index)}
                            />
                          </div>
                          <div className="col-span-4">
                            <label className="block text-xs text-slate-500 mb-1">
                              Notes (optional)
                            </label>
                            <input
                              type="text"
                              className="w-full border rounded p-2 text-sm"
                              placeholder="Item notes..."
                              value={item.notes}
                              onChange={(e) =>
                                updateTransferItem(
                                  index,
                                  "notes",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="col-span-1 flex items-end justify-center">
                            <button
                              onClick={() => removeTransferItem(index)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transfer Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Transfer Date
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Transfer notes..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTransfer}
                  disabled={isSubmitting || transferItems.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" /> Create Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
