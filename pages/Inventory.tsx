import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Product, ProductCategory } from "../types";
import { createProduct } from "../services/Inventory/createProduct";
import { updateProduct } from "../services/Inventory/updateProduct";
import { updateProductStatus } from "../services/Inventory/updateProductStatus";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { fetchCategories } from "../services/Inventory/fetchCategories";
import { transferInventoryToWarehouse } from "../services/Inventory/transferInventoryToWarehouse";
import { transferInventoryToStorefront } from "../services/Inventory/transferInventoryToStorefront";
import { fetchWarehouseProfiles } from "../services/Warehouse/fetchWarehouseProfiles";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { useLanguage } from "../context/LanguageContext";
import { InventoryTable } from "../components/Inventory/InventoryTable";
import { CategoryFilter } from "../components/Inventory/CategoryFilter";
import {
  ProductModal,
  ProductFormData,
  ApiProduct,
} from "../components/Inventory/ProductModal";
import { ProductDetailModal } from "../components/Inventory/ProductDetailModal";
import {
  fetchProductById,
  ProductDetail,
} from "../services/Inventory/fetchProductById";
import { WarehouseProfile } from "../types";
import { Building2, X, Loader2, Store, FileUp, RefreshCw, Plus, Search, ChevronDown } from "lucide-react";
import {
  importExcel,
  ImportExcelResponse,
} from "../services/Inventory/importExcel";
import { useRef } from "react";
import { ImportResultModal } from "../components/Inventory/ImportResultModal";

export const Inventory: React.FC = () => {
  const { t } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("active");
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<ProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Transfer to Warehouse State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseProfile[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [showSelectBoxes, setShowSelectBoxes] = useState(false);
  const [transferMode, setTransferMode] = useState<
    "warehouse" | "storefront" | null
  >(null);

  // Transfer to Storefront State
  const [isTransferStorefrontModalOpen, setIsTransferStorefrontModalOpen] =
    useState(false);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState("");
  const [isTransferringToStorefront, setIsTransferringToStorefront] =
    useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categories, setCategories] = useState<string[]>([]);

  // Import Excel State
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportExcelResponse | null>(
    null,
  );
  const [isImportResultModalOpen, setIsImportResultModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State - API structure
  const [formData, setFormData] = useState<ProductFormData>({
    productName: "",
    productCode: "",
    saleCode: "",
    SKU: "",
    barcode: "",
    category: "",
    subCategory: "",
    brand: "",
    description: "",
    buyingPrice: 0,
    sellingPrice: 0,
    wholesalePrices: [],
    unitOfMeasure: "piece",
    reorderPoint: 0,
    reorderQuantity: 0,
    taxRate: 0,
    status: "active",
    tags: [],
    note: "",
  });

  // Map API product to local Product type
  const mapApiProductToProduct = (apiProduct: ApiProduct): Product => {
    return {
      productCode: apiProduct.productCode,
      id: apiProduct.id || apiProduct._id || "",
      name: apiProduct.productName,
      category:
        (apiProduct.category as ProductCategory) || ProductCategory.OTHER,
      stockWarehouse: apiProduct.stockWarehouse || 0,
      stockShop: apiProduct.stockShop || 0,
      costPrice: apiProduct.buyingPrice,
      sellingPrice: apiProduct.sellingPrice,
      lowStockThreshold: apiProduct.reorderPoint || 0,
      status: (apiProduct.status as "active" | "inactive") || "active",
      nearestExpiryDate: (apiProduct as any).nearestExpiryDate || null,
      isExpired: (apiProduct as any).isExpired || false,
      isExpiringSoon: (apiProduct as any).isExpiringSoon || false,
    };
  };

  // Fetch products from API
  const loadProducts = async (page: number = currentPage, limit: number = itemsPerPage) => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetchProducts(
        page,
        limit,
        selectedCategory,
        selectedStatus,
        searchQuery
      );
      if (response.success && response.data) {
        // Store full API products for subcategory extraction
        // Cast to ApiProduct[] since API returns full product data, not mapped Product type
        const apiData = response.data as unknown as ApiProduct[];
        setApiProducts(apiData);
        const mappedProducts = apiData.map(mapApiProductToProduct);
        setProducts(mappedProducts);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setCurrentPage(response.pagination.currentPage);
        }
      } else {
        const errorMsg = t("inventory.failedToLoadInvalid");
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMessage = err.message || t("inventory.failedToFetch");
      toast.error(errorMessage);
      setError(errorMessage);
      console.error("Error loading products:", err);

      // If it's an API configuration error, provide helpful guidance
      if (
        errorMessage.includes("API endpoint not found") ||
        errorMessage.includes("Network error")
      ) {
        console.warn("Error loading products: " + errorMessage);
      }
    } finally {
      setIsFetching(false);
    }
  };

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

  // Fetch products whenever pagination, filter, or search changes
  useEffect(() => {
    loadProducts(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage, selectedCategory, selectedStatus, searchQuery]);

  // Fetch static profiles and categories on component mount
  useEffect(() => {
    loadWarehouses();
    loadStorefronts();
    loadCategories();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await fetchWarehouseProfiles();
      if (response.success && response.data) {
        setWarehouses(
          response.data.filter((w: WarehouseProfile) => w.status === "active"),
        );
      }
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const loadStorefronts = async () => {
    try {
      const response = await fetchStorefrontProfiles();
      if (response.success && response.data) {
        setStorefronts(
          response.data.filter(
            (s: StorefrontProfile) => s.status === "active" && !s.isDeleted,
          ),
        );
      }
    } catch (error) {
      console.error("Error loading storefronts:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      productName: "",
      productCode: "",
      saleCode: "",
      SKU: "",
      barcode: "",
      category: "",
      subCategory: "",
      brand: "",
      description: "",
      buyingPrice: 0,
      sellingPrice: 0,
      wholesalePrices: [],
      unitOfMeasure: "piece",
      reorderPoint: 0,
      reorderQuantity: 0,
      taxRate: 0,
      status: "active",
      tags: [],
      note: "",
    });
    setError(null);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const response = await importExcel(file);
      if (response.success) {
        toast.success(response.message);
        // Refresh products list
        await loadProducts();

        // Show detailed result in modal
        setImportResult(response);
        setIsImportResultModalOpen(true);
      } else {
        toast.error(response.message || "Failed to import excel");
      }
    } catch (error: any) {
      console.error("Error importing excel:", error);
      toast.error(
        error.message || "An unexpected error occurred during import",
      );
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    // Validation
    if (
      !formData.productName ||
      !formData.productCode ||
      !formData.category?.trim() ||
      !formData.buyingPrice ||
      !formData.sellingPrice
    ) {
      const errorMsg = t("inventory.requiredFieldsError");
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (formData.sellingPrice < formData.buyingPrice) {
      const errorMsg = t("inventory.sellingPriceError");
      toast.error(errorMsg);
      setError(errorMsg);
      return;
    }

    if (editingId) {
      // Update existing product via API
      setIsLoading(true);
      setError(null);

      try {
        // Prepare API payload matching the update endpoint structure
        const apiPayload: any = {
          productName: formData.productName,
          productCode: formData.productCode,
          SKU: formData.SKU,
          category: formData.category || "Unknown",
          buyingPrice: formData.buyingPrice,
          sellingPrice: formData.sellingPrice,
          unitOfMeasure: formData.unitOfMeasure || "piece",
        };

        // Add optional fields only if they have values
        if (formData.saleCode) apiPayload.saleCode = formData.saleCode;
        if (formData.barcode) apiPayload.barcode = formData.barcode;
        if (formData.subCategory) apiPayload.subCategory = formData.subCategory;
        if (formData.brand) apiPayload.brand = formData.brand;
        if (formData.description) apiPayload.description = formData.description;
        if (formData.reorderPoint !== undefined && formData.reorderPoint >= 0)
          apiPayload.reorderPoint = formData.reorderPoint;
        if (
          formData.reorderQuantity !== undefined &&
          formData.reorderQuantity >= 0
        )
          apiPayload.reorderQuantity = formData.reorderQuantity;
        if (formData.taxRate !== undefined && formData.taxRate >= 0)
          apiPayload.taxRate = formData.taxRate;
        if (formData.status) apiPayload.status = formData.status;
        if (formData.tags && formData.tags.length > 0)
          apiPayload.tags = formData.tags;
        if (formData.note) apiPayload.note = formData.note;
        if (formData.wholesalePrices && formData.wholesalePrices.length > 0) {
          apiPayload.wholesalePrices = formData.wholesalePrices.map(
            ({ quantity, price }) => ({ quantity, price }),
          );
        }

        await updateProduct(editingId, apiPayload);

        setIsModalOpen(false);
        setEditingId(null);
        resetForm();
        // Refresh products list after updating
        await loadProducts();
        toast.success(
          t("inventory.productUpdated") || "Product updated successfully",
        );
      } catch (err: any) {
        const errorMessage =
          err.message ||
          t("inventory.failedToUpdate") ||
          "Failed to update product";
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Create new product via API
    setIsLoading(true);
    setError(null);

    try {
      // Prepare API payload - only include fields that have values (except required ones)
      const apiPayload: any = {
        productName: formData.productName,
        productCode: formData.productCode,
        category: formData.category || "Unknown",
        buyingPrice: formData.buyingPrice,
        sellingPrice: formData.sellingPrice,
        unitOfMeasure: formData.unitOfMeasure || "piece",
      };

      // Add SKU only if it has a value, otherwise provide a default
      if (formData.SKU) {
        apiPayload.SKU = formData.SKU;
      } else {
        // Generate a default SKU if not provided
        apiPayload.SKU = `SKU-${Date.now()}`;
      }

      // Add optional fields only if they have values
      if (formData.saleCode) apiPayload.saleCode = formData.saleCode;
      if (formData.barcode) apiPayload.barcode = formData.barcode;
      if (formData.subCategory) apiPayload.subCategory = formData.subCategory;
      if (formData.brand) apiPayload.brand = formData.brand;
      if (formData.description) apiPayload.description = formData.description;
      if (formData.reorderPoint !== undefined && formData.reorderPoint > 0)
        apiPayload.reorderPoint = formData.reorderPoint;
      if (
        formData.reorderQuantity !== undefined &&
        formData.reorderQuantity > 0
      )
        apiPayload.reorderQuantity = formData.reorderQuantity;
      if (formData.taxRate !== undefined && formData.taxRate > 0)
        apiPayload.taxRate = formData.taxRate;
      if (formData.status) apiPayload.status = formData.status;
      if (formData.tags && formData.tags.length > 0)
        apiPayload.tags = formData.tags;
      if (formData.note) apiPayload.note = formData.note;
      if (formData.wholesalePrices && formData.wholesalePrices.length > 0) {
        apiPayload.wholesalePrices = formData.wholesalePrices.map(
          ({ quantity, price }) => ({ quantity, price }),
        );
      }

      await createProduct(apiPayload);

      setIsModalOpen(false);
      resetForm();
      // Refresh products list after creating
      await loadProducts();
      toast.success(t("inventory.productCreated"));
    } catch (err: any) {
      const errorMessage = err.message || t("inventory.failedToCreate");
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    // Find the full API product to get all details including subCategory
    const apiProduct = apiProducts.find((ap) => (ap.id || ap._id) === p.id);

    // Map existing product to form data
    setFormData({
      productName: p.name,
      productCode: apiProduct?.productCode || "", // Using id as productCode for existing products
      saleCode: apiProduct?.saleCode || "",
      SKU: apiProduct?.SKU || apiProduct?.productCode,
      barcode: apiProduct?.barcode || "",
      category: p.category,
      subCategory: apiProduct?.subCategory || "",
      brand: apiProduct?.brand || "",
      description: apiProduct?.description || "",
      buyingPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      wholesalePrices: (apiProduct?.wholesalePrices || []).map((tier, i) => ({
        id: (tier as { _id?: string; id?: string })._id ||
          (tier as { _id?: string; id?: string }).id ||
          `tier-${i}`,
        quantity: tier.quantity,
        price: tier.price,
      })),
      unitOfMeasure: apiProduct?.unitOfMeasure || "piece",
      reorderPoint: p.lowStockThreshold,
      reorderQuantity: apiProduct?.reorderQuantity || 0,
      taxRate: apiProduct?.taxRate || 0,
      status: apiProduct?.status || "active",
      tags: apiProduct?.tags || [],
      note: apiProduct?.note || "",
    });

    setIsModalOpen(true);
  };

  const handleViewDetails = async (productId: string) => {
    setLoadingDetail(true);
    setSelectedProductDetail(null);
    setIsDetailModalOpen(true);
    try {
      const response = await fetchProductById(productId);
      if (response.success && response.data) {
        setSelectedProductDetail(response.data);
      } else {
        toast.error(response.message || t("inventory.failedToLoadDetails"));
      }
    } catch (error) {
      console.error("Error loading product details:", error);
      toast.error(t("inventory.failedToLoadDetails"));
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusToggle = async (
    productId: string,
    currentStatus: "active" | "inactive",
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const response = await updateProductStatus(productId, {
        status: newStatus,
      });

      if (response.success) {
        toast.success(
          `Product ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
        );
        await loadProducts();
      } else {
        toast.error(response.message || "Failed to update product status");
      }
    } catch (error) {
      console.error("Error updating product status:", error);
      toast.error("Failed to update product status");
    }
  };

  // Filter products based on selected category, status, and search query
  const filteredProducts = products;

  // Selection handlers
  const handleSelectionChange = (productId: string, selected: boolean) => {
    if (selected) {
      setSelectedProductIds([...selectedProductIds, productId]);
    } else {
      setSelectedProductIds(
        selectedProductIds.filter((id) => id !== productId),
      );
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleOpenTransferModal = () => {
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to transfer");
      return;
    }
    setIsTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false);
    setSelectedWarehouseId("");
  };

  const handleOpenTransferStorefrontModal = () => {
    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to transfer");
      return;
    }
    setIsTransferStorefrontModalOpen(true);
  };

  const handleCloseTransferStorefrontModal = () => {
    setIsTransferStorefrontModalOpen(false);
    setSelectedStorefrontId("");
  };

  const handleTransfer = async () => {
    if (!selectedWarehouseId) {
      toast.error("Please select a warehouse");
      return;
    }

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to transfer");
      return;
    }

    setIsTransferring(true);
    try {
      // Get the actual inventory IDs from apiProducts
      const inventoryIds = selectedProductIds
        .map((productId) => {
          const apiProduct = apiProducts.find(
            (ap) => (ap.id || ap._id) === productId,
          );
          return apiProduct?._id || apiProduct?.id;
        })
        .filter((id): id is string => !!id);

      if (inventoryIds.length === 0) {
        toast.error("No valid inventory items selected");
        return;
      }

      const response = await transferInventoryToWarehouse({
        inventoryIds,
        warehouseId: selectedWarehouseId,
      });

      if (response.success) {
        toast.success(
          response.message || "Inventory transferred to warehouse successfully",
        );
        setSelectedProductIds([]);
        setShowSelectBoxes(false);
        setTransferMode(null);
        handleCloseTransferModal();
        setShowSelectBoxes(false);
        setTransferMode(null);
        await loadProducts();
      } else {
        toast.error(response.message || "Failed to transfer inventory");
      }
    } catch (error: any) {
      console.error("Error transferring inventory:", error);
      toast.error(error.message || "Failed to transfer inventory");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleTransferToStorefront = async () => {
    if (!selectedStorefrontId) {
      toast.error("Please select a storefront");
      return;
    }

    if (selectedProductIds.length === 0) {
      toast.error("Please select at least one product to transfer");
      return;
    }

    setIsTransferringToStorefront(true);
    try {
      // Get the actual inventory IDs from apiProducts
      const inventoryIds = selectedProductIds
        .map((productId) => {
          const apiProduct = apiProducts.find(
            (ap) => (ap.id || ap._id) === productId,
          );
          return apiProduct?._id || apiProduct?.id;
        })
        .filter((id): id is string => !!id);

      if (inventoryIds.length === 0) {
        toast.error("No valid inventory items selected");
        return;
      }

      const response = await transferInventoryToStorefront({
        inventoryIds,
        storefrontId: selectedStorefrontId,
      });

      if (response.success) {
        toast.success(
          response.message ||
          "Inventory transferred to storefront successfully",
        );
        setSelectedProductIds([]);
        setShowSelectBoxes(false);
        setTransferMode(null);
        handleCloseTransferStorefrontModal();
        setShowSelectBoxes(false);
        setTransferMode(null);
        await loadProducts();
      } else {
        toast.error(response.message || "Failed to transfer inventory");
      }
    } catch (error: any) {
      console.error("Error transferring inventory:", error);
      toast.error(error.message || "Failed to transfer inventory");
    } finally {
      setIsTransferringToStorefront(false);
    }
  };

  // console.log("filteredProducts", filteredProducts);

  return (
    <div className="w-full lg:h-[calc(100vh-2rem)]">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6 lg:h-full lg:overflow-hidden">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("inventory.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("inventory.subtitle")}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={loadProducts}
              disabled={isFetching}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              <span>{t("inventory.refresh")}</span>
            </button>

            {/* Import Excel */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportExcel}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
              <span>Import Excel</span>
            </button>

            {/* Transfer Storefront */}
            {selectedProductIds.length === 0 && !showSelectBoxes && (
              <button
                onClick={() => {
                  setShowSelectBoxes(true);
                  setTransferMode("storefront");
                }}
                className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>{t("inventory.transferStoreFront")}</span>
              </button>
            )}

            {showSelectBoxes && (
              <>
                {transferMode === "storefront" && (
                  <button
                    onClick={handleOpenTransferStorefrontModal}
                    className="px-5 py-2 text-sm font-semibold rounded-full bg-orange-600 text-white hover:bg-orange-700 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Store className="w-4 h-4" />
                    <span>
                      {t("inventory.confirmStoreFront")} ({selectedProductIds.length})
                    </span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowSelectBoxes(false);
                    setSelectedProductIds([]);
                    setTransferMode(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-full bg-red-500 text-white hover:bg-red-600 transition-all cursor-pointer"
                >
                  {t("inventory.cancelSelection")}
                </button>
              </>
            )}

            {/* Add Product Button */}
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("inventory.addProduct")}</span>
            </button>
          </div>
        </div>

        {/* Search Input Row */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t("inventory.searchbar")}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-1 border-b border-gray-50 pb-4">
          
          {/* Status Pills */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">
              {t("inventory.statusLabel")}
            </span>
            <div className="flex items-center gap-2 bg-gray-50/50 p-1 border border-gray-100 rounded-full">
              {(["all", "active", "inactive"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    selectedStatus === status
                      ? "bg-[#2216a8] text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : status === "active"
                    ? "Active"
                    : "Inactive"}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown Select */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">
              {t("inventory.filterByCategoryLabel")}
            </span>
            <div className="relative min-w-[220px]">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="All">{t("inventory.allCategories")}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {error && !isFetching && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {/* Inventory Content (Table / Loading) */}
        {isFetching && products.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center">
            <Loader2 className="w-8 h-8 text-[#2216a8] animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">{t("inventory.loadingProducts")}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-12 text-center">
            <p className="text-slate-400 text-sm font-medium">
              {products.length === 0
                ? t("inventory.noProductsFound")
                : t("inventory.noProductsInCategory").replace(
                    "{category}",
                    selectedCategory,
                  )}
            </p>
          </div>
        ) : (
          <div className="inventory-table lg:flex-1 flex flex-col min-h-0">
            <InventoryTable
              products={filteredProducts}
              onEdit={openEdit}
              onViewDetails={handleViewDetails}
              onStatusToggle={handleStatusToggle}
              selectedProductIds={selectedProductIds}
              onSelectionChange={handleSelectionChange}
              onSelectAll={handleSelectAll}
              showSelectBoxes={showSelectBoxes}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>
      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        editingId={editingId}
        formData={formData}
        error={error}
        isLoading={isLoading}
        products={products}
        apiProducts={apiProducts}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          resetForm();
        }}
        onSave={handleSave}
        onFormDataChange={setFormData}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isDetailModalOpen}
        loading={loadingDetail}
        product={selectedProductDetail}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProductDetail(null);
          setLoadingDetail(false);
        }}
      />

      <ImportResultModal
        isOpen={isImportResultModalOpen}
        result={importResult}
        onClose={() => setIsImportResultModalOpen(false)}
      />

      {/* Transfer to Warehouse Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Transfer to Warehouse
              </h2>
              <button
                onClick={handleCloseTransferModal}
                disabled={isTransferring}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Selected Products</p>
                <p className="font-bold text-slate-800">
                  {selectedProductIds.length} product(s) selected
                </p>
                <div className="mt-2 text-xs text-slate-600">
                  {filteredProducts
                    .filter((p) => selectedProductIds.includes(p.id))
                    .map((p) => p.name)
                    .join(", ")}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  disabled={isTransferring}
                >
                  <option value="">Select a warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.locationName} ({warehouse.locationCode})
                    </option>
                  ))}
                </select>
              </div>

              {warehouses.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    No active warehouses available. Please create a warehouse
                    first.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseTransferModal}
                  disabled={isTransferring}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={isTransferring || !selectedWarehouseId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Building2 className="w-4 h-4" /> Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer to Storefront Modal */}
      {isTransferStorefrontModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" />
                Transfer to Storefront
              </h2>
              <button
                onClick={handleCloseTransferStorefrontModal}
                disabled={isTransferringToStorefront}
                className="text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Selected Products</p>
                <p className="font-bold text-slate-800">
                  {selectedProductIds.length} product(s) selected
                </p>
                <div className="mt-2 text-xs text-slate-600">
                  {filteredProducts
                    .filter((p) => selectedProductIds.includes(p.id))
                    .map((p) => p.name)
                    .join(", ")}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Storefront <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={selectedStorefrontId}
                  onChange={(e) => setSelectedStorefrontId(e.target.value)}
                  disabled={isTransferringToStorefront}
                >
                  <option value="">Select a storefront</option>
                  {storefronts.map((storefront) => (
                    <option key={storefront._id} value={storefront._id}>
                      {storefront.locationName} ({storefront.locationCode})
                    </option>
                  ))}
                </select>
              </div>

              {storefronts.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    No active storefronts available. Please create a storefront
                    first.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseTransferStorefrontModal}
                  disabled={isTransferringToStorefront}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferToStorefront}
                  disabled={isTransferringToStorefront || !selectedStorefrontId}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                >
                  {isTransferringToStorefront ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Store className="w-4 h-4" /> Transfer
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
