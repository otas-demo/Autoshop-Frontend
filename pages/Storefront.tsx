import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  Plus,
  X,
  Phone,
  MapPin,
  User,
  Mail,
  ChevronRight,
  Edit,
  Package,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Box,
} from "lucide-react";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { createStorefrontProfile } from "../services/Storefront/createStorefrontProfile";
import { updateStorefrontProfile } from "../services/Storefront/updateStorefrontProfile";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

interface StorefrontProfileFormData {
  storefrontCode: string;
  storefrontName: string;
  storefrontAddress: string;
  storefrontPhone: string;
  storefrontEmail: string;
  managerName: string;
  status: "active" | "inactive";
  description: string;
  notes: string;
}

export const Storefront: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Get user role from localStorage (set during login)
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;
  const [storefrontProfiles, setStorefrontProfiles] = useState<
    StorefrontProfile[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Inventory State
  const [inventoryItems, setInventoryItems] = useState<StorefrontStockItem[]>(
    [],
  );
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [showInventory, setShowInventory] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<StorefrontProfileFormData>({
    storefrontCode: "",
    storefrontName: "",
    storefrontAddress: "",
    storefrontPhone: "",
    storefrontEmail: "",
    managerName: "",
    status: "active",
    description: "",
    notes: "",
  });

  useEffect(() => {
    loadStorefrontProfiles();
  }, []);

  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await fetchStorefrontStock();
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

  const loadStorefrontProfiles = async () => {
    setLoading(true);
    try {
      const response = await fetchStorefrontProfiles();
      // console.log(response);
      if (response.success && response.data) {
        setStorefrontProfiles(response.data.reverse());
      }
    } catch (error) {
      // console.log(error);
      console.error("Failed to load storefront profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      storefrontCode: "",
      storefrontName: "",
      storefrontAddress: "",
      storefrontPhone: "",
      storefrontEmail: "",
      managerName: "",
      status: "active",
      description: "",
      notes: "",
    });
    setEditingId(null);
  };

  const handleOpenEdit = (profile: StorefrontProfile) => {
    setEditingId(profile._id);
    setFormData({
      storefrontCode: profile.locationCode,
      storefrontName: profile.locationName,
      storefrontAddress: profile.locationAddress,
      storefrontPhone: profile.locationPhone,
      storefrontEmail: profile.locationEmail || "",
      managerName: profile.managerName || "",
      status: profile.status || "active",
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
      !formData.storefrontCode ||
      !formData.storefrontName ||
      !formData.storefrontAddress ||
      !formData.storefrontPhone
    ) {
      toast.error(t("storefront.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload (handle optional fields and formatting)
      const payload: any = {
        storefrontCode: formData.storefrontCode.toUpperCase(),
        storefrontName: formData.storefrontName,
        storefrontAddress: formData.storefrontAddress,
        storefrontPhone: formData.storefrontPhone,
      };

      // Add optional fields only if they have values
      if (formData.storefrontEmail) {
        payload.storefrontEmail = formData.storefrontEmail.toLowerCase();
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
        // Update existing storefront
        await updateStorefrontProfile(editingId, payload);
        toast.success(t("storefront.profileUpdated"));
      } else {
        // Create new storefront
        await createStorefrontProfile(payload);
        toast.success(t("storefront.profileCreated"));
      }

      loadStorefrontProfiles();
      handleCloseModal();
    } catch (error: any) {
      toast.error(
        error.message ||
        (editingId
          ? t("storefront.failedToUpdate")
          : t("storefront.failedToCreate")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white h-[calc(100vh-2rem)] border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("storefront.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("storefront.subtitle")}
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
              <Package className="w-4 h-4" />
              <span>
                {showInventory ? t("storefront.hideInventory") : t("storefront.showAllInventory")}
              </span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t("storefront.addStorefront")}</span>
            </button>
          </div>
        </div>

        {/* All Inventory Products Section */}
        {showInventory && (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-6 flex flex-col gap-5 p-5 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {t("storefront.inventoryTitle")}
              </h2>
              <button
                onClick={loadInventory}
                disabled={loadingInventory}
                className="px-4 py-1.5 text-xs font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingInventory ? "animate-spin" : ""}`}
                />
                <span>{t("storefront.refresh")}</span>
              </button>
            </div>

            {/* Stats Cards */}
            {!loadingInventory && inventoryItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Product Types */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3.5 shadow-sm">
                  <div className="p-3 bg-indigo-50 text-[#2216a8] rounded-xl flex-shrink-0">
                    <Box className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      {t("storefront.productTypes")}
                    </p>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5">
                      {t("storefront.itemsCount").replace("{count}", String(inventoryItems.length))}
                    </p>
                  </div>
                </div>

                {/* Total Quantity */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3.5 shadow-sm">
                  <div className="p-3 bg-indigo-50 text-[#2216a8] rounded-xl flex-shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      {t("storefront.totalQty")}
                    </p>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5">
                      {t("storefront.itemsCount").replace("{count}", String(totalQuantity))}
                    </p>
                  </div>
                </div>

                {/* Low Stock count */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3.5 shadow-sm">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      {t("storefront.lowStock")}
                    </p>
                    <p className="text-sm font-semibold text-slate-500 mt-0.5">
                      {t("storefront.itemsCount").replace("{count}", String(lowStockCount))}
                    </p>
                  </div>
                </div>

                {/* Total Amount */}
                <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3.5 shadow-sm">
                  <div className="p-3 bg-indigo-50 text-[#2216a8] rounded-xl flex-shrink-0">
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      {t("storefront.totalSales")}
                    </p>
                    <p className="text-sm font-black text-[#2216a8] mt-0.5">
                      {totalInventoryAmount.toLocaleString()} MMK
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loadingInventory ? (
              <div className="p-8 text-center text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p>Loading inventory...</p>
              </div>
            ) : inventoryItems.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No inventory items found.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
                {/* Table container with horizontal scroll on mobile */}
                <div className="overflow-x-auto overflow-y-auto max-h-[450px]">
                  <table className="w-full text-sm text-left min-w-[800px]">
                    <thead className="text-slate-500">
                      <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">No</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Code</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Name</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Category</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Cost</th>
                        <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Price</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Status</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inventoryItems.map((item, index) => {
                        const storefrontName =
                          item.storefrontId.locationName ||
                          item.storefrontId.storefrontName ||
                          "Unknown";
                        const storefrontCode =
                          item.storefrontId.locationCode ||
                          item.storefrontId.storefrontCode ||
                          "";

                        return (
                          <tr
                            key={item._id}
                            className="hover:bg-slate-50/40 transition-colors"
                          >
                            {/* No */}
                            <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                              {String(index + 1).padStart(2, "0")}
                            </td>

                            {/* Code */}
                            <td className="px-4 py-4 text-slate-600 font-semibold text-xs">
                              {item.inventoryId.productCode}
                            </td>

                            {/* Name */}
                            <td className="px-4 py-4 font-bold text-slate-800 text-xs">
                              {item.inventoryId.productName}
                            </td>

                            {/* Category */}
                            <td className="px-4 py-4 text-slate-500 text-xs font-medium">
                              {item.inventoryId.category}
                            </td>

                            {/* Cost */}
                            <td className="px-4 py-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                              {(item.inventoryId.cost || 0).toLocaleString()}{" "}
                              <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                            </td>

                            {/* Price */}
                            <td className="px-4 py-4 font-bold text-slate-800 text-xs whitespace-nowrap">
                              {(item.inventoryId.sellingPrice || 0).toLocaleString()}{" "}
                              <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4 text-center">
                              {item.isLowStock ? (
                                <span className="bg-amber-50 border border-amber-200 text-amber-600 px-3 py-1 rounded-full text-xs font-semibold">
                                  Low Stock
                                </span>
                              ) : item.quantity === 0 ? (
                                <span className="bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-full text-xs font-semibold">
                                  Out of Stock
                                </span>
                              ) : (
                                <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                  Active
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() =>
                                    navigate(`/storefront/${item.storefrontId._id}`, {
                                      state: { storefrontName, storefrontCode },
                                    })
                                  }
                                  className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm shadow-indigo-600/5 transition-all cursor-pointer whitespace-nowrap"
                                >
                                  {t("common.edit")}
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(`/storefront/${item.storefrontId._id}`, {
                                      state: { storefrontName, storefrontCode },
                                    })
                                  }
                                  className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm shadow-indigo-600/5 transition-all cursor-pointer whitespace-nowrap"
                                >
                                  {t("common.view")}
                                </button>
                              </div>
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

        {/* Storefront Profiles List */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
            {t("storefront.profiles")}
          </h2>
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <Loader2 className="w-8 h-8 text-[#2216a8] animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">{t("storefront.loading")}</p>
            </div>
          ) : storefrontProfiles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium">{t("storefront.noStorefronts")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {storefrontProfiles.map((profile) => (
                <div
                  key={profile._id}
                  onClick={() =>
                    navigate(`/storefront/${profile._id}`, {
                      state: {
                        storefrontName: profile.locationName,
                        storefrontCode: profile.locationCode,
                      },
                    })
                  }
                  className="bg-white border border-gray-200/70 rounded-3xl p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Name and Location Code Row */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 text-base group-hover:text-primary transition-colors truncate pr-2">
                        {profile.locationName}
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 bg-[#fdf2e9] text-[#b06f2e] border border-[#f5d7bc] rounded-full font-semibold flex-shrink-0">
                        {profile.locationCode}
                      </span>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-3 pb-5 text-sm text-slate-500 border-b border-gray-100">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="leading-tight line-clamp-2">{profile.locationAddress}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{profile.locationPhone}</span>
                      </div>
                      {profile.managerName && (
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span>{profile.managerName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Status / Edit row */}
                  <div className="flex justify-between items-center mt-4">
                    <span
                      className={`text-xs px-3 py-1 font-semibold rounded-full border transition-all ${profile.status === "active"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-600"
                        }`}
                    >
                      {profile.status === "active" ? t("storefront.activeLabel") : t("storefront.inactiveLabel")}
                    </span>

                    {userRole === "owner" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(profile);
                        }}
                        className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{t("common.edit")}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Storefront Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  {editingId
                    ? t("storefront.editProfile")
                    : t("storefront.newProfile")}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Required Fields */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("storefront.locationCode")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={50}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none uppercase"
                      placeholder={t("storefront.codePlaceholder")}
                      value={formData.storefrontCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          storefrontCode: e.target.value.toUpperCase(),
                        })
                      }
                      disabled={!!editingId}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("storefront.status")}
                    </label>
                    <select
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "active" | "inactive",
                        })
                      }
                    >
                      <option value="active">{t("storefront.active")}</option>
                      <option value="inactive">{t("storefront.inactive")}</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("storefront.locationName")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("storefront.namePlaceholder")}
                      value={formData.storefrontName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          storefrontName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("storefront.locationAddress")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      maxLength={500}
                      rows={2}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("storefront.addressPlaceholder")}
                      value={formData.storefrontAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          storefrontAddress: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("storefront.locationPhone")}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={20}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("storefront.phonePlaceholder")}
                      value={formData.storefrontPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          storefrontPhone: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/*  <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("storefront.locationEmail")}
                  </label>
                  <input
                    type="email"
                    maxLength={200}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder={t("storefront.emailPlaceholder")}
                    value={formData.storefrontEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storefrontEmail: e.target.value,
                      })
                    }
                  />
                </div>

                */}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {t("storefront.managerName")}
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("storefront.managerPlaceholder")}
                      value={formData.managerName}
                      onChange={(e) =>
                        setFormData({ ...formData, managerName: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("storefront.description")}
                </label>
                <textarea
                  maxLength={1000}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t("storefront.descriptionPlaceholder")}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("storefront.notes")}
                </label>
                <textarea
                  maxLength={500}
                  rows={2}
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none"
                  placeholder={t("storefront.notesPlaceholder")}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div> */}

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors order-2 sm:order-1"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2"
                  >
                    {isSubmitting
                      ? editingId
                        ? t("storefront.updating")
                        : t("storefront.creating")
                      : editingId
                        ? t("storefront.updateStorefront")
                        : t("storefront.createStorefront")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
