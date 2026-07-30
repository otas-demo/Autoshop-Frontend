import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Plus,
  X,
  Building2,
  Phone,
  MapPin,
  User,
  Mail,
  ChevronRight,
  Edit,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Box,
} from "lucide-react";
import { createWarehouseProfile } from "../services/Warehouse/createWarehouseProfile";
import { fetchWarehouseProfiles } from "../services/Warehouse/fetchWarehouseProfiles";
import { updateWarehouseProfile } from "../services/Warehouse/updateWarehouseProfile";
import {
  fetchWarehouseStock,
  WarehouseStockItem,
} from "../services/Warehouse/fetchWarehouseStock";
import { toast } from "sonner";
import { WarehouseProfile } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface WarehouseProfileFormData {
  warehouseCode: string;
  warehouseName: string;
  warehouseAddress: string;
  warehousePhone: string;
  warehouseEmail: string;
  managerName: string;
  status: "active" | "inactive";
  description: string;
  notes: string;
}

export const Warehouse: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Get user role from localStorage (set during login)
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  const [warehouseProfiles, setWarehouseProfiles] = useState<
    WarehouseProfile[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Inventory State
  const [inventoryItems, setInventoryItems] = useState<WarehouseStockItem[]>(
    [],
  );
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WarehouseProfileFormData>({
    warehouseCode: "",
    warehouseName: "",
    warehouseAddress: "",
    warehousePhone: "",
    warehouseEmail: "",
    managerName: "",
    status: "active",
    description: "",
    notes: "",
  });

  useEffect(() => {
    loadWarehouseProfiles();
  }, []);

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await fetchWarehouseStock();
      if (response.success && response.data) {
        setInventoryItems(response.data);
      } else {
        toast.error(response.message || "Failed to load inventory");
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Failed to load inventory");
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (showInventory) {
      loadInventory();
    }
  }, [showInventory]);

  // Calculate stats for all inventory
  const totalQuantity = inventoryItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const lowStockCount = inventoryItems.filter((item) => item.isLowStock).length;

  // Calculate total amount for all inventory
  const totalInventoryAmount = inventoryItems.reduce((sum, item) => {
    const sellingPrice = item.inventoryId.sellingPrice || 0;
    const itemTotal = item.quantity * sellingPrice;
    return sum + itemTotal;
  }, 0);

  const loadWarehouseProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetchWarehouseProfiles();
      if (response.success && response.data) {
        setWarehouseProfiles(response.data.reverse());
      }
    } catch (error) {
      console.error("Failed to load warehouse profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      warehouseCode: "",
      warehouseName: "",
      warehouseAddress: "",
      warehousePhone: "",
      warehouseEmail: "",
      managerName: "",
      status: "active",
      description: "",
      notes: "",
    });
    setEditingId(null);
  };

  const handleOpenEdit = (profile: WarehouseProfile) => {
    setEditingId(profile._id);
    setFormData({
      warehouseCode: profile.locationCode,
      warehouseName: profile.locationName,
      warehouseAddress: profile.locationAddress,
      warehousePhone: profile.locationPhone,
      warehouseEmail: profile.locationEmail || "",
      managerName: profile.managerName || "",
      status: (profile.status as "active" | "inactive") || "active",
      description: profile.description || "",
      notes: profile.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.warehouseCode ||
      !formData.warehouseName ||
      !formData.warehouseAddress ||
      !formData.warehousePhone
    ) {
      toast.error(t("warehouse.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload (handle optional fields and formatting)
      const payload: any = {
        warehouseCode: formData.warehouseCode.toUpperCase(),
        warehouseName: formData.warehouseName,
        warehouseAddress: formData.warehouseAddress,
        warehousePhone: formData.warehousePhone,
      };

      // Add optional fields only if they have values
      if (formData.warehouseEmail) {
        payload.warehouseEmail = formData.warehouseEmail.toLowerCase();
      }
      if (formData.managerName) {
        payload.managerName = formData.managerName;
      }
      if (formData.status) {
        payload.status = formData.status;
      }
      if (formData.description) {
        payload.description = formData.description;
      }
      if (formData.notes) {
        payload.notes = formData.notes;
      }

      if (editingId) {
        // Update existing warehouse
        await updateWarehouseProfile(editingId, payload);
        toast.success(t("warehouse.profileUpdated"));
      } else {
        // Create new warehouse
        await createWarehouseProfile(payload);
        toast.success(t("warehouse.profileCreated"));
      }

      loadWarehouseProfiles();
      handleCloseModal();
    } catch (error: any) {
      toast.error(
        error.message ||
        (editingId
          ? t("warehouse.failedToUpdate")
          : t("warehouse.failedToCreate")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              {t("sidebar.warehouse")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("warehouse.profiles")} and core storage facilities
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setShowInventory(!showInventory);
                if (!showInventory) {
                  loadInventory();
                }
              }}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5" />
              <span>
                {showInventory
                  ? `${t("warehouse.hideInventory")}`
                  : `${t("warehouse.showAllInventory")}`}
              </span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("warehouse.addWarehouse")}</span>
            </button>
          </div>
        </div>

        {/* All Inventory Products Section */}
        {showInventory && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#2216a8]" />
                All Warehouse Inventory
              </h2>
              <button
                onClick={loadInventory}
                disabled={loadingInventory}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-705 text-xs font-semibold rounded-full transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingInventory ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            {/* Stats Cards */}
            {!loadingInventory && inventoryItems.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-5 border-b bg-slate-50/10">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Box className="w-4 h-4 text-[#2216a8]" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Total Products
                      </p>
                      <p className="text-base sm:text-lg font-black text-slate-800 mt-0.5">
                        {inventoryItems.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Total Quantity
                      </p>
                      <p className="text-base sm:text-lg font-black text-slate-800 mt-0.5">
                        {totalQuantity}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Low Stock
                      </p>
                      <p className="text-base sm:text-lg font-black text-slate-800 mt-0.5">
                        {lowStockCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                        Total Amount
                      </p>
                      <p className="text-base sm:text-lg font-black text-[#2216a8] mt-0.5">
                        {totalInventoryAmount.toLocaleString()} MMK
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loadingInventory ? (
              <div className="p-12 text-center text-slate-550 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <p className="text-sm font-semibold">{t("warehouse.loading")}</p>
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No inventory items found.</p>
              </div>
            ) : (
              <div>
                <div className="sm:hidden px-4 py-2 bg-slate-50 text-xs text-slate-500 text-center">
                  ← Swipe to see more →
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[1000px]">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider">Product Name</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider">Product Code</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider">SKU</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider">Warehouse</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider text-right">Qty</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider text-right">Available</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider text-right">Price</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider text-right">Total</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3.5 font-bold text-slate-550 text-xs uppercase tracking-wider">Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {inventoryItems.map((item) => {
                        const warehouseName =
                          item.warehouseId.locationName ||
                          item.warehouseId.warehouseName ||
                          "Unknown";
                        const warehouseCode =
                          item.warehouseId.locationCode ||
                          item.warehouseId.warehouseCode ||
                          "";

                        return (
                          <tr
                            key={item._id}
                            className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                            onClick={() =>
                              navigate(`/warehouse/${item.warehouseId._id}`, {
                                state: {
                                  warehouseName,
                                  warehouseCode,
                                },
                              })
                            }
                          >
                            <td className="px-4 py-3 font-bold text-slate-800 text-xs sm:text-sm">
                              <div className="max-w-[180px] truncate" title={item.inventoryId.productName}>
                                {item.inventoryId.productName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-650">
                              <span className="bg-slate-100 px-2.5 py-1 rounded text-xs font-mono font-bold">
                                {item.inventoryId.productCode}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                              {item.inventoryId.SKU}
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-indigo-50 text-[#2216a8] border border-indigo-100 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                {item.inventoryId.category}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate" title={warehouseName}>
                                    {warehouseName}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {warehouseCode}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-black text-slate-800 text-xs sm:text-sm">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600 text-xs sm:text-sm font-semibold">
                              {item.availableQuantity}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700 text-xs sm:text-sm">
                              {(item.inventoryId.sellingPrice || 0).toLocaleString()} MMK
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-[#2216a8] text-xs sm:text-sm">
                              {(item.quantity * (item.inventoryId.sellingPrice || 0)).toLocaleString()} MMK
                            </td>
                            <td className="px-4 py-3">
                              {item.isLowStock ? (
                                <span className="bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Low Stock</span>
                                </span>
                              ) : item.quantity === 0 ? (
                                <span className="bg-red-50 border border-red-200 text-red-750 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                  Out of Stock
                                </span>
                              ) : (
                                <span className="bg-green-50 border border-green-200 text-green-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 text-xs font-medium whitespace-nowrap">
                              {new Date(item.lastUpdated).toLocaleDateString()}{" "}
                              {new Date(item.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warehouse Profiles List */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            {t("warehouse.profiles")} ({warehouseProfiles.length})
          </h2>
          {loading ? (
            <div className="text-center py-12 text-slate-555 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("warehouse.loading")}
            </div>
          ) : warehouseProfiles.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-350" />
              <p>{t("warehouse.noWarehouses")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {warehouseProfiles.map((profile) => (
                <div
                  key={profile._id}
                  onClick={() =>
                    navigate(`/warehouse/${profile._id}`, {
                      state: {
                        warehouseName: profile.locationName,
                        warehouseCode: profile.locationCode,
                      },
                    })
                  }
                  className="border border-slate-200/80 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-500/50 bg-white transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 group-hover:text-[#2216a8] transition-colors text-sm sm:text-base">
                          <span className="truncate">{profile.locationName}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-[#2216a8] font-bold rounded-full flex-shrink-0 mt-0.5 border border-indigo-100">
                            {profile.locationCode}
                          </span>
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">
                            {profile.locationAddress}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            profile.status === "active"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {profile.status}
                        </span>
                        {userRole === "owner" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(profile);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#2216a8] hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
                            title={t("common.edit")}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-350 group-hover:text-[#2216a8] transition-colors" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs text-slate-550 mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate font-semibold">{profile.locationPhone}</span>
                      </div>
                      {profile.managerName && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{profile.managerName}</span>
                        </div>
                      )}
                      {profile.locationEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{profile.locationEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-[#2216a8] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                    {t("warehouse.viewStockItems")}{" "}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Warehouse Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2216a8]" />
                {editingId ? t("warehouse.editProfile") : t("warehouse.newProfile")}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Location Code */}
                  <div>
                    <label className="block text-sm font-medium text-slate-705 mb-1">
                      {t("warehouse.locationCode")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      className="w-full border border-slate-350 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none uppercase"
                      placeholder={t("warehouse.codePlaceholder")}
                      value={formData.warehouseCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warehouseCode: e.target.value.toUpperCase(),
                        })
                      }
                      disabled={!!editingId}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-705 mb-1">
                      {t("warehouse.status")}
                    </label>
                    <select
                      className="w-full border border-slate-350 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-primary outline-none"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "active" | "inactive",
                        })
                      }
                    >
                      <option value="active">{t("warehouse.active")}</option>
                      <option value="inactive">{t("warehouse.inactive")}</option>
                    </select>
                  </div>

                  {/* Location Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-705 mb-1">
                      {t("warehouse.locationName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      className="w-full border border-slate-355 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("warehouse.namePlaceholder")}
                      value={formData.warehouseName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warehouseName: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Location Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-705 mb-1">
                      {t("warehouse.locationAddress")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      maxLength={500}
                      rows={2}
                      className="w-full border border-slate-355 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("warehouse.addressPlaceholder")}
                      value={formData.warehouseAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warehouseAddress: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-705 mb-1">
                      {t("warehouse.locationPhone")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={20}
                      className="w-full border border-slate-355 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("warehouse.phonePlaceholder")}
                      value={formData.warehousePhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warehousePhone: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Manager Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-705 mb-1">
                      {t("warehouse.managerName")}
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      className="w-full border border-slate-355 rounded-lg p-2.5 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("warehouse.managerPlaceholder")}
                      value={formData.managerName}
                      onChange={(e) =>
                        setFormData({ ...formData, managerName: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-slate-50 rounded-b-xl flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors order-2 sm:order-1 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#2216a8]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2 cursor-pointer font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      {editingId ? t("warehouse.updating") : t("warehouse.creating")}
                    </>
                  ) : editingId ? (
                    t("warehouse.updateWarehouse")
                  ) : (
                    t("warehouse.createWarehouse")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
