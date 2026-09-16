import React, { useState, useEffect } from "react";
import { Modal } from "../Modal";
import { GRNData } from "../../services/Purchase/fetchGRNs";
import { fetchGRNById } from "../../services/Purchase/fetchGRNById";
import { fetchWarehouseProfiles } from "../../services/Warehouse/fetchWarehouseProfiles";
import { fetchStorefrontProfiles, StorefrontProfile } from "../../services/Storefront/fetchStorefrontProfiles";
import { transferGRN } from "../../services/Purchase/transferGRN";
import { toast } from "sonner";
import { Warehouse, Store, Package } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

interface WarehouseProfile {
  _id: string;
  locationName: string;
  locationCode: string;
}

interface TransferItem {
  productCode: string;
  productName: string;
  availableQuantity: number;
  quantity: number;
  isSelected: boolean;
}

interface TransferWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  grnId: string | null;
  onSuccess?: () => void;
}

export const TransferWarehouseModal: React.FC<TransferWarehouseModalProps> = ({
  isOpen,
  onClose,
  grnId,
  onSuccess,
}) => {
  const { t } = useLanguage();

  const [grn, setGrn] = useState<GRNData | null>(null);
  const [destinationType, setDestinationType] = useState<"warehouse" | "storefront">("warehouse");
  const [warehouses, setWarehouses] = useState<WarehouseProfile[]>([]);
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [selectedStorefrontId, setSelectedStorefrontId] = useState("");
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && grnId) {
      loadData();
    }
  }, [isOpen, grnId]);

  const loadData = async () => {
    if (!grnId) return;
    setLoading(true);
    try {
      const [grnRes, warehouseRes, storefrontRes] = await Promise.all([
        fetchGRNById(grnId),
        fetchWarehouseProfiles(),
        fetchStorefrontProfiles(),
      ]);

      if (grnRes.success && grnRes.data) {
        setGrn(grnRes.data);
        const items: TransferItem[] = grnRes.data.lineItems.map((item) => ({
          productCode: item.inventoryId?.productCode || "",
          productName: item.inventoryId?.productName || t("purchasing.grnDetail.unknownProduct"),
          availableQuantity: item.availableQuantity,
          quantity: item.availableQuantity,
          isSelected: true,
        }));
        setTransferItems(items);
      }

      if (warehouseRes.success && warehouseRes.data) {
        setWarehouses(warehouseRes.data);
      }

      if (storefrontRes.success && storefrontRes.data) {
        setStorefronts(storefrontRes.data);
      }
    } catch (error) {
      console.error("Failed to load data", error);
      toast.error(t("purchasing.transferStock.failedToLoadData"));
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return t("purchasing.grnDetail.statusPending");
      case "verified":
        return t("purchasing.grnDetail.statusVerified");
      case "partial":
        return t("purchasing.grnDetail.statusPartial");
      case "transferred":
        return t("purchasing.grnDetail.statusTransferred");
      case "completed":
        return t("purchasing.grnDetail.statusCompleted");
      default:
        return status?.toUpperCase() || "";
    }
  };

  const updateTransferQuantity = (index: number, quantity: number) => {
    setTransferItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: Math.min(
          Math.max(0, quantity),
          updated[index].availableQuantity
        ),
      };
      return updated;
    });
  };

  const updateTransferSelection = (index: number, isSelected: boolean) => {
    setTransferItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isSelected,
      };
      return updated;
    });
  };

  const resetForm = () => {
    setGrn(null);
    setDestinationType("warehouse");
    setSelectedWarehouseId("");
    setSelectedStorefrontId("");
    setTransferItems([]);
    setTransferDate(new Date().toISOString().split("T")[0]);
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (selectedItemsOnly = false) => {
    if (!grnId) {
      toast.error(t("purchasing.transferStock.errorNoGRN"));
      return;
    }

    if (destinationType === "warehouse" && !selectedWarehouseId) {
      toast.error(t("purchasing.transferStock.errorSelectWarehouse"));
      return;
    }

    if (destinationType === "storefront" && !selectedStorefrontId) {
      toast.error(t("purchasing.transferStock.errorSelectStorefront"));
      return;
    }

    const itemsToProcess = selectedItemsOnly
      ? transferItems.filter((item) => item.isSelected && item.quantity > 0)
      : transferItems.filter((item) => item.quantity > 0);

    if (itemsToProcess.length === 0) {
      toast.error(t("purchasing.transferStock.errorSelectOneItem"));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        sourceType: "GRN" as const,
        grnId,
        lineItems: itemsToProcess.map((item) => ({
          productCode: item.productCode,
          quantity: item.quantity,
        })),
        transferDate,
        notes: notes || undefined,
      };

      if (destinationType === "warehouse") {
        payload.destinationWarehouseId = selectedWarehouseId;
      } else {
        payload.destinationStorefrontId = selectedStorefrontId;
      }

      const result = await transferGRN(payload);

      if (result.success) {
        toast.success(t("purchasing.transferStock.successTransfer"));
        resetForm();
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.message || t("purchasing.transferStock.failedTransfer"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("purchasing.transferStock.errorOccurred"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("purchasing.transferStock.title")}>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-slate-500">{t("purchasing.transferDetail.loading")}</span>
        </div>
      ) : grn ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Transfer Details */}
          <div className="space-y-4">
            {/* GRN Info */}
            <div className="bg-slate-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-slate-800 mb-3">
                {t("purchasing.transferStock.grnInfo")}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("purchasing.transferStock.grnNumber")}</span>
                  <span className="font-medium text-blue-600">
                    {grn.grnNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("purchasing.transferStock.status")}</span>
                  <span className="font-medium text-purple-600">
                    {getStatusText(grn.status)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("purchasing.transferStock.totalGoodQty")}</span>
                  <span className="font-medium text-green-600">
                    {grn.totalGoodQuantity}
                  </span>
                </div>
              </div>
            </div>

            {/* Destination Type & Location Selection */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t("purchasing.transferStock.destinationType")}
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDestinationType("warehouse")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      destinationType === "warehouse"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Warehouse className="w-4 h-4" />
                    {t("purchasing.transferStock.warehouse")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestinationType("storefront")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                      destinationType === "storefront"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    {t("purchasing.transferStock.storefront")}
                  </button>
                </div>
              </div>

              {destinationType === "warehouse" ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Warehouse className="w-4 h-4" />
                    {t("purchasing.transferStock.destWarehouse")}
                  </label>
                  <select
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  >
                    <option value="">{t("purchasing.transferStock.selectWarehousePlaceholder")}</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>
                        {wh.locationName} ({wh.locationCode})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    {t("purchasing.transferStock.destStorefront")}
                  </label>
                  <select
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={selectedStorefrontId}
                    onChange={(e) => setSelectedStorefrontId(e.target.value)}
                  >
                    <option value="">{t("purchasing.transferStock.selectStorefrontPlaceholder")}</option>
                    {storefronts.map((sf) => (
                      <option key={sf._id} value={sf._id}>
                        {sf.locationName} ({sf.locationCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Transfer Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("purchasing.transferStock.transferDate")}
              </label>
              <input
                type="date"
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t("purchasing.transferStock.notesOptional")}
              </label>
              <textarea
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("purchasing.transferStock.notesPlaceholder")}
                rows={3}
              />
            </div>
          </div>

          {/* Right Panel - Items to Transfer */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5" />
                {t("purchasing.transferStock.itemsToTransfer")}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setTransferItems((prev) =>
                      prev.map((item) => ({ ...item, isSelected: true }))
                    );
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 cursor-pointer"
                >
                  {t("purchasing.transferStock.selectAll")}
                </button>
                <button
                  onClick={() => {
                    setTransferItems((prev) =>
                      prev.map((item) => ({ ...item, isSelected: false }))
                    );
                  }}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer"
                >
                  {t("purchasing.transferStock.deselectAll")}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto border rounded-lg bg-slate-50 p-4">
              {transferItems.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  {t("purchasing.transferStock.noItemsAvailable")}
                </div>
              ) : (
                <div className="space-y-4">
                  {transferItems.map((item, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 shadow-sm ${
                        item.isSelected
                          ? "bg-white border-blue-300"
                          : "bg-gray-50 border-gray-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={item.isSelected}
                            onChange={(e) =>
                              updateTransferSelection(index, e.target.checked)
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <div>
                            <div className="font-semibold text-slate-800">
                              {item.productName}
                              <span className="text-xs text-gray-500 font-normal ml-2">
                                ({item.productCode})
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {t("purchasing.transferStock.available")} {item.availableQuantity}
                            </div>
                          </div>
                        </div>
                      </div>
                      {item.isSelected && (
                        <div className="space-y-3 ml-7">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 p-2 rounded border border-green-200">
                              <label className="text-xs text-green-600">
                                {t("purchasing.transferStock.available")}
                              </label>
                              <div className="font-semibold text-green-700">
                                {item.availableQuantity}
                              </div>
                            </div>
                            <div className="bg-green-50 p-2 rounded border border-green-200">
                              <label className="text-xs text-slate-500 block mb-1">
                                {t("purchasing.transferStock.transferQty")}
                              </label>
                              <input
                                type="number"
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateTransferQuantity(
                                    index,
                                    Number(e.target.value)
                                  )
                                }
                                min="0"
                                max={item.availableQuantity}
                              />
                            </div>
                          </div>
                          {item.quantity > item.availableQuantity && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                              {t("purchasing.transferStock.cannotExceed")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={
                    !(destinationType === "warehouse" ? selectedWarehouseId : selectedStorefrontId) ||
                    transferItems.filter(
                      (item) => item.isSelected && item.quantity > 0
                    ).length === 0 ||
                    isSubmitting
                  }
                  className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Package className="w-5 h-5" />
                  {isSubmitting ? t("purchasing.transferStock.transferring") : t("purchasing.transferStock.transferSelected")}
                </button>
              </div>
              <p className="text-xs text-slate-500 text-center">
                {t("purchasing.transferStock.notice").replace("{type}", destinationType === "warehouse" ? t("purchasing.transferStock.warehouse") : t("purchasing.transferStock.storefront"))}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          {t("purchasing.transferStock.noData")}
        </div>
      )}
    </Modal>
  );
};
