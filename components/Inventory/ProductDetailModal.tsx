import React, { useState } from "react";
import {
  X,
  Package,
  DollarSign,
  TrendingUp,
  Store,
  Warehouse,
  Calendar,
} from "lucide-react";
import { ProductDetail } from "../../services/Inventory/fetchProductById";
import { useLanguage } from "../../context/LanguageContext";
import { formatExpiryDate, getExpiryStatus, ExpiryStatus } from "../../utils/expiryUtils";

interface ProductDetailModalProps {
  isOpen: boolean;
  loading: boolean;
  product: ProductDetail | null;
  onClose: () => void;
  restrictLocationType?: "warehouse" | "storefront";
  restrictLocationId?: string;
  onTransfer?: (targetType: "storefront" | "warehouse", location: any) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  loading,
  product,
  onClose,
  restrictLocationType,
  restrictLocationId,
  onTransfer,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"about" | "quantity" | "batches">("about");
  const [stockTab, setStockTab] = useState<"warehouse" | "storefront">(
    restrictLocationType || "storefront",
  );

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExpiryStatusBadge = (expiryDate: string | null | undefined) => {
    const status = getExpiryStatus(expiryDate);
    if (status === ExpiryStatus.EXPIRED) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-850 border border-red-200">
          Expired ({formatExpiryDate(expiryDate)})
        </span>
      );
    }
    if (status === ExpiryStatus.EXPIRING_SOON) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-850 border border-yellow-200">
          Expiring Soon ({formatExpiryDate(expiryDate)})
        </span>
      );
    }
    if (status === ExpiryStatus.VALID) {
      return (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
          Valid ({formatExpiryDate(expiryDate)})
        </span>
      );
    }
    return <span className="text-slate-400 font-medium">-</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {t("inventory.productDetails")}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 py-2 gap-5">
          <button
            onClick={() => setActiveTab("about")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "about"
                ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            {t("inventory.aboutProduct")}
          </button>
          <button
            onClick={() => setActiveTab("quantity")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "quantity"
                ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Product Quantity
          </button>
          <button
            onClick={() => setActiveTab("batches")}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === "batches"
                ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Batches & Expiries
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto min-h-[calc(50vh)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-500">
                {t("inventory.loadingProductDetails")}
              </p>
            </div>
          ) : product ? (
            <>
              {activeTab === "about" ? (
                <div className="space-y-6">
                  {/* Product Basic Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-600 font-medium mb-1">
                        {t("inventory.productName")}
                      </p>
                      <p className="font-bold text-blue-800">
                        {product.productName}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-xs text-green-600 font-medium mb-1">
                        {t("inventory.productCode")}
                      </p>
                      <p className="font-bold text-green-800">
                        {product.productCode}
                      </p>
                    </div>
                  </div>

                  {/* Expiry Alert Card (If applicable) */}
                  {product.nearestExpiryDate && (
                    <div className={`p-4 rounded-lg border flex items-center gap-3 ${
                      getExpiryStatus(product.nearestExpiryDate) === ExpiryStatus.EXPIRED
                        ? "bg-red-50 border-red-200 text-red-900"
                        : getExpiryStatus(product.nearestExpiryDate) === ExpiryStatus.EXPIRING_SOON
                        ? "bg-yellow-50 border-yellow-200 text-yellow-900"
                        : "bg-green-50 border-green-200 text-green-900"
                    }`}>
                      <Calendar className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nearest Expiry Date</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="font-bold">{formatExpiryDate(product.nearestExpiryDate)}</span>
                          {getExpiryStatusBadge(product.nearestExpiryDate)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing & Profit */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-slate-500" />
                        <p className="text-xs text-slate-500 font-medium">
                          {t("inventory.prices")}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-slate-600">
                            {t("inventory.buyingPriceLabel")}
                          </span>
                          <span className="text-sm font-medium text-slate-800 ml-2">
                            {product.buyingPrice.toLocaleString()} MMK
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-600">
                            {t("inventory.sellingPriceLabel")}
                          </span>
                          <span className="text-sm font-bold text-slate-800 ml-2">
                            {product.sellingPrice.toLocaleString()} MMK
                          </span>
                        </div>
                      </div>
                    </div>
                    {product.wholesalePrices &&
                      product.wholesalePrices.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <DollarSign className="w-4 h-4 text-slate-500" />
                            <p className="text-sm text-slate-600 font-semibold">
                              Wholesale prices
                            </p>
                          </div>

                          <div className="grid grid-cols-2 text-sm font-semibold text-slate-600 pb-2">
                            <span>Quantity</span>
                            <span className="text-right">Price (MMK)</span>
                          </div>

                          <div className="border-t border-slate-200">
                            {product.wholesalePrices
                              .slice()
                              .sort((a, b) => a.quantity - b.quantity)
                              .map((tier) => (
                                <div
                                  key={
                                    tier.id ||
                                    tier._id ||
                                    `${tier.quantity}-${tier.price}`
                                  }
                                  className="grid grid-cols-2 py-2 border-b border-slate-200 last:border-b-0"
                                >
                                  <span className="text-slate-800">
                                    {tier.quantity}
                                  </span>
                                  <span className="text-right text-slate-800 font-medium">
                                    {tier.price.toLocaleString()}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.category")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.brand")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.brand || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.unitOfMeasureLabel")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {product.unitOfMeasure}
                      </p>
                    </div>
                  </div>

                  {/* Note */}
                  {product.note && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-xs text-orange-600 font-medium mb-1">
                        {t("pos.note") || "Note"}
                      </p>
                      <p className="text-sm text-slate-800">{product.note}</p>
                    </div>
                  )}
                </div>
              ) : activeTab === "quantity" ? (
                <div className="space-y-6">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.createDate")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {formatDate(product.createdAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        {t("inventory.lastUpdatedDate")}
                      </p>
                      <p className="text-sm text-slate-800">
                        {formatDate(product.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Total Quantity Summary */}
                  <div className="bg-[#FEFEB0] p-6 rounded-lg border-2 border-[#FEFEB0]">
                    <div className="flex items-center justify-between">
                      <p className="text-[16px] font-medium text-[#585800]">
                        {t("inventory.productTotalQuantity")}
                      </p>
                      <p className="text-4xl font-bold text-slate-800">
                        {product.stockAvailability.totalQuantity.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Stock Tabs */}
                  {!restrictLocationType && (
                    <div className="flex gap-5">
                      <button
                        onClick={() => setStockTab("warehouse")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          stockTab === "warehouse"
                            ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        {t("inventory.warehouses")}
                      </button>
                      <button
                        onClick={() => setStockTab("storefront")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          stockTab === "storefront"
                            ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        {t("inventory.storefronts")}
                      </button>
                    </div>
                  )}

                  {/* Warehouse Summary Cards */}
                  {stockTab === "warehouse" &&
                    product.stockAvailability.warehouses.count > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              {t("inventory.warehouses")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.warehouses.count}{" "}
                              {t("inventory.warehouses")}
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              {t("inventory.totalQtyInWarehouses")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.warehouses.totalQuantity.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Warehouse Location Cards (Grouped/Merged Quantity, no batch info) */}
                        <div className="grid grid-cols-1 gap-4">
                          {(() => {
                            // Sum quantities per location ID
                            const mergedLocationsMap = new Map<string, typeof product.stockAvailability.warehouses.locations[0]>();
                            product.stockAvailability.warehouses.locations
                              .filter((loc) => !restrictLocationId || String(loc.locationId).toLowerCase() === String(restrictLocationId).toLowerCase())
                              .forEach((loc) => {
                               if (mergedLocationsMap.has(loc.locationId)) {
                                 mergedLocationsMap.get(loc.locationId)!.quantity += loc.quantity;
                               } else {
                                 mergedLocationsMap.set(loc.locationId, { ...loc });
                               }
                             });
                            return Array.from(mergedLocationsMap.values()).map((location) => (
                              <div
                                key={location.locationId}
                                className="bg-slate-100 p-4 rounded-lg border border-slate-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                              >
                                <div>
                                  <h4 className="font-semibold text-slate-800 mb-1">
                                    {location.locationName}
                                  </h4>
                                  <p className="text-xs text-slate-600 mb-1">
                                    {location.locationAddress || "-"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-slate-850">
                                    Quantity: {location.quantity.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </>
                    )}

                  {/* Storefront Summary Cards */}
                  {stockTab === "storefront" &&
                    product.stockAvailability.storefronts.count > 0 && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              {t("inventory.storefronts")}
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.storefronts.count}{" "}
                              {t("inventory.storefronts")}
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-xs text-slate-600 font-medium mb-1">
                              Total QTY In Storefronts
                            </p>
                            <p className="text-lg font-bold text-slate-800">
                              {product.stockAvailability.storefronts.totalQuantity.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Storefront Location Cards (Grouped/Merged Quantity, no batch info) */}
                        <div className="grid grid-cols-1 gap-4">
                          {(() => {
                            const mergedLocationsMap = new Map<string, typeof product.stockAvailability.storefronts.locations[0]>();
                            product.stockAvailability.storefronts.locations
                              .filter((loc) => !restrictLocationId || String(loc.locationId).toLowerCase() === String(restrictLocationId).toLowerCase())
                              .forEach((loc) => {
                               if (mergedLocationsMap.has(loc.locationId)) {
                                 mergedLocationsMap.get(loc.locationId)!.quantity += loc.quantity;
                               } else {
                                 mergedLocationsMap.set(loc.locationId, { ...loc });
                               }
                             });
                            return Array.from(mergedLocationsMap.values()).map((location) => (
                              <div
                                key={location.locationId}
                                className="bg-slate-100 p-4 rounded-lg border border-slate-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                              >
                                <div>
                                  <h4 className="font-semibold text-slate-800 mb-1">
                                    {location.locationName}
                                  </h4>
                                  <p className="text-xs text-slate-600 mb-1">
                                    {location.locationAddress || "-"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold text-slate-850">
                                    Quantity: {location.quantity.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </>
                    )}

                  {/* Empty States */}
                  {stockTab === "warehouse" &&
                    product.stockAvailability.warehouses.count === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Warehouse className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No warehouses found</p>
                      </div>
                    )}

                  {stockTab === "storefront" &&
                    product.stockAvailability.storefronts.count === 0 && (
                      <div className="text-center py-8 text-slate-500">
                        <Store className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p>No storefronts found</p>
                      </div>
                    )}
                </div>
              ) : activeTab === "batches" ? (
                <div className="space-y-6">
                  {/* Stock Tabs */}
                  {!restrictLocationType && (
                    <div className="flex gap-5">
                      <button
                        onClick={() => setStockTab("warehouse")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          stockTab === "warehouse"
                            ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Warehouse Batches
                      </button>
                      <button
                        onClick={() => setStockTab("storefront")}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          stockTab === "storefront"
                            ? "bg-[#FEFEB0] text-slate-800 rounded-2xl"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                      >
                        Storefront Batches
                      </button>
                    </div>
                  )}

                  {/* Batches Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    {stockTab === "warehouse" ? (
                      (() => {
                        const warehouseLocations = product.stockAvailability.warehouses.locations.filter(
                          (loc) => !restrictLocationId || String(loc.locationId).toLowerCase() === String(restrictLocationId).toLowerCase()
                        );
                        return warehouseLocations.length > 0 ? (
                          warehouseLocations.map((location, idx) => (
                            <div
                              key={location.locationId + "-" + location.batchNumber + "-" + idx}
                              className="bg-slate-100 p-4 rounded-lg border border-slate-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                            >
                              <div>
                                <h4 className="font-semibold text-slate-800 mb-1">
                                  {location.locationName}
                                </h4>
                                <p className="text-xs text-slate-600 mb-1">
                                  {location.locationAddress || "-"}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                  <span className="bg-[#2216a8]/10 text-[#2216a8] font-bold px-2 py-0.5 rounded">
                                    Batch: {location.batchNumber || "__LEGACY__"}
                                  </span>
                                  {location.expiryDate && (
                                    <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100 flex items-center gap-1">
                                      Expiry: {formatExpiryDate(location.expiryDate)}
                                      {getExpiryStatusBadge(location.expiryDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="text-right sm:mr-2">
                                  <span className="text-sm font-bold text-slate-850">
                                    Quantity: {location.quantity.toLocaleString()}
                                  </span>
                                </div>
                                {onTransfer && location.quantity > 0 && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => onTransfer("storefront", location)}
                                      className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 font-medium transition-colors"
                                    >
                                      To Store
                                    </button>
                                    <button
                                      onClick={() => onTransfer("warehouse", location)}
                                      className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-medium transition-colors"
                                    >
                                      To Whse
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-500">
                            <Warehouse className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p>No warehouse batches found</p>
                          </div>
                        );
                      })()
                    ) : (
                      (() => {
                        const storefrontLocations = product.stockAvailability.storefronts.locations.filter(
                          (loc) => !restrictLocationId || String(loc.locationId).toLowerCase() === String(restrictLocationId).toLowerCase()
                        );
                        return storefrontLocations.length > 0 ? (
                          storefrontLocations.map((location, idx) => (
                            <div
                              key={location.locationId + "-" + location.batchNumber + "-" + idx}
                              className="bg-slate-100 p-4 rounded-lg border border-slate-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                            >
                              <div>
                                <h4 className="font-semibold text-slate-800 mb-1">
                                  {location.locationName}
                                </h4>
                                <p className="text-xs text-slate-600 mb-1">
                                  {location.locationAddress || "-"}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                                  <span className="bg-[#2216a8]/10 text-[#2216a8] font-bold px-2 py-0.5 rounded">
                                    Batch: {location.batchNumber || "__LEGACY__"}
                                  </span>
                                  {location.expiryDate && (
                                    <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100 flex items-center gap-1">
                                      Expiry: {formatExpiryDate(location.expiryDate)}
                                      {getExpiryStatusBadge(location.expiryDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="text-right sm:mr-2">
                                  <span className="text-sm font-bold text-slate-850">
                                    Quantity: {location.quantity.toLocaleString()}
                                  </span>
                                </div>
                                {onTransfer && location.quantity > 0 && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => onTransfer("storefront", location)}
                                      className="text-[10px] bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 font-medium transition-colors"
                                    >
                                      To Store
                                    </button>
                                    <button
                                      onClick={() => onTransfer("warehouse", location)}
                                      className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-medium transition-colors"
                                    >
                                      To Whse
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-slate-500">
                            <Store className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p>No storefront batches found</p>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-slate-300 mb-3" />
              <p className="text-slate-500">
                {t("inventory.noProductDetails")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
