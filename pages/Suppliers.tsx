import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Phone,
  User,
  Loader2,
  X,
  Edit,
  Trash2,
  Ban,
  RotateCcw,
  Archive,
  Search,
  RefreshCw,
  Eye,
} from "lucide-react";
import { createSupplier } from "../services/Supplier/createSupplier";
import { updateSupplier } from "../services/Supplier/updateSupplier";
import { softDeleteSupplier } from "../services/Supplier/softDeleteSupplier";
import { restoreSupplier } from "../services/Supplier/restoreSupplier";
import { deleteSupplier } from "../services/Supplier/deleteSupplier";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { ConfirmModal } from "../components/Common/ConfirmModal";
import { toast } from "sonner";
import { Supplier } from "../types";
import { useLanguage } from "../context/LanguageContext";

interface SupplierFormData {
  supplierName: string;
  contactNumber: string;
}

export const Suppliers: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [search, setSearch] = useState("");
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null,
  );
  const [supplierToPermanentlyDelete, setSupplierToPermanentlyDelete] =
    useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<SupplierFormData>({
    supplierName: "",
    contactNumber: "",
  });

  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  useEffect(() => {
    loadSuppliers();
  }, [showDeleted]);

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await fetchSuppliers(showDeleted ? true : undefined);
      if (response.success && response.data) {
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error("Failed to load suppliers:", error);
      toast.error(t("suppliers.failedToLoad"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadSuppliers();
    toast.success(t("storefront.refresh"));
  };

  const resetForm = () => {
    setFormData({
      supplierName: "",
      contactNumber: "",
    });
    setEditingId(null);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingId(supplier.id || supplier._id || "");
    setFormData({
      supplierName: supplier.supplierName,
      contactNumber: supplier.contactNumber,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplierName || !formData.contactNumber) {
      toast.error(t("suppliers.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {};
      if (formData.supplierName) {
        payload.supplierName = formData.supplierName;
      }
      if (formData.contactNumber) {
        payload.contactNumber = formData.contactNumber;
      }

      if (editingId) {
        // Update existing supplier
        await updateSupplier(editingId, payload);
        toast.success(t("suppliers.supplierUpdated"));
      } else {
        // Create new supplier
        await createSupplier(formData);
        toast.success(t("suppliers.supplierCreated"));
      }

      handleCloseModal();
      // Reload list
      loadSuppliers();
    } catch (error: any) {
      toast.error(
        error.message ||
        (editingId
          ? t("suppliers.failedToUpdate")
          : t("suppliers.failedToCreate")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeactivate = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleConfirmDeactivate = async () => {
    if (!supplierToDelete) return;

    const supplierId = supplierToDelete.id || supplierToDelete._id;
    if (!supplierId) return;

    setProcessingId(supplierId);
    try {
      await softDeleteSupplier(supplierId);
      toast.success(t("suppliers.supplierDeactivated"));
      setSupplierToDelete(null);
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.message || t("suppliers.failedToDeactivate"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestore = async (supplier: Supplier) => {
    const supplierId = supplier.id || supplier._id;
    if (!supplierId) return;

    setProcessingId(supplierId);
    try {
      await restoreSupplier(supplierId);
      toast.success(t("suppliers.supplierRestored"));
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.message || t("suppliers.failedToRestore"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenPermanentDelete = (supplier: Supplier) => {
    setSupplierToPermanentlyDelete(supplier);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!supplierToPermanentlyDelete) return;

    const supplierId =
      supplierToPermanentlyDelete.id || supplierToPermanentlyDelete._id;
    if (!supplierId) return;

    setProcessingId(supplierId);
    try {
      await deleteSupplier(supplierId);
      toast.success(t("suppliers.supplierDeleted"));
      setSupplierToPermanentlyDelete(null);
      loadSuppliers();
    } catch (error: any) {
      toast.error(error.message || t("suppliers.failedToDelete"));
    } finally {
      setProcessingId(null);
    }
  };

  // Search Filter
  const filteredSuppliers = suppliers.filter((supplier) => {
    const searchLower = search.toLowerCase();
    return (
      supplier.supplierName.toLowerCase().includes(searchLower) ||
      supplier.contactNumber.includes(search)
    );
  });

  return (
    <div className="w-full">
      <div className="bg-white min-h-[96vh] border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              {t("suppliers.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("suppliers.registeredSuppliers")} and contact information
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{t("storefront.refresh")}</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("suppliers.addSupplier")}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Displayed Suppliers */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Users className="w-5 h-5 text-[#2216a8]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                {showDeleted ? t("suppliers.deletedSuppliers") : t("suppliers.registeredSuppliers")}
              </p>
              <p className="text-lg font-black text-slate-800 mt-1">
                {suppliers.length} <span className="text-xs font-semibold text-slate-400">ဦး</span>
              </p>
            </div>
          </div>

          {/* Current State */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Archive className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Current Filter State
              </p>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {showDeleted ? "Deleted (Inactive) List" : "Active Suppliers"}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by supplier name or phone..."
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200/80 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs sm:text-sm text-slate-700 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Active / Inactive Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 self-start md:self-auto">
            <button
              onClick={() => {
                setShowDeleted(false);
                setSearch("");
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${!showDeleted
                  ? "bg-white text-[#2216a8] shadow-sm"
                  : "text-slate-600 hover:text-slate-850"
                }`}
            >
              {t("suppliers.active")}
            </button>
            <button
              onClick={() => {
                setShowDeleted(true);
                setSearch("");
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${showDeleted
                  ? "bg-white text-[#2216a8] shadow-sm"
                  : "text-slate-600 hover:text-slate-850"
                }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{t("suppliers.inactive")}</span>
            </button>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h2 className="font-semibold text-slate-800">
              {showDeleted ? t("suppliers.deletedSuppliers") : t("suppliers.registeredSuppliers")} ({filteredSuppliers.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("suppliers.loading")}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {search ? "No suppliers match search criteria." : t("suppliers.noSuppliers")}
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
              <table className="w-full text-sm text-left min-w-[700px]">
                <thead className="text-slate-500">
                  <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">No</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">{t("suppliers.name")}</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">{t("suppliers.contact")}</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">{t("common.status")}</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                      {showDeleted ? t("suppliers.deletedAt") : t("suppliers.added")}
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredSuppliers.map((supplier, index) => (
                    <tr
                      key={supplier.id || supplier._id}
                      onClick={() => {
                        if (!supplier.isDeleted) {
                          navigate(`/suppliers/${supplier.id || supplier._id}`);
                        }
                      }}
                      className="hover:bg-slate-50/40 transition-colors cursor-pointer"
                    >
                      {/* No */}
                      <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-4 font-bold text-slate-800 text-xs sm:text-sm">
                        {supplier.supplierName}
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-4 font-bold text-slate-800 text-xs sm:text-sm">
                        {supplier.contactNumber}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {supplier.isDeleted ? (
                          <span className="border border-red-200 text-red-650 bg-red-50/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {t("suppliers.inactive")}
                          </span>
                        ) : (
                          <span className="border border-green-200 text-green-650 bg-green-50/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {t("suppliers.active")}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                        {supplier.isDeleted && supplier.deletedAt ? (
                          <span className="text-red-500 font-semibold">
                            {new Date(supplier.deletedAt).toLocaleDateString()}
                          </span>
                        ) : supplier.createdAt ? (
                          <span>
                            {new Date(supplier.createdAt).toLocaleDateString()}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {(userRole === "owner" || userRole === "warehouse") && (
                            <>
                              {!supplier.isDeleted && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/suppliers/${supplier.id || supplier._id}`);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-[#2216a8] hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
                                    title={t("common.view")}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEdit(supplier);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-[#2216a8] hover:bg-indigo-50 rounded-full transition-colors cursor-pointer"
                                    title={t("common.edit")}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {supplier.isDeleted ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestore(supplier);
                                    }}
                                    disabled={processingId === (supplier.id || supplier._id)}
                                    className="p-1.5 text-green-650 hover:text-green-700 hover:bg-green-50 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                                    title={t("suppliers.restore")}
                                  >
                                    {processingId === (supplier.id || supplier._id) ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenPermanentDelete(supplier);
                                    }}
                                    disabled={processingId === (supplier.id || supplier._id)}
                                    className="p-1.5 text-red-650 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                                    title={t("suppliers.delete")}
                                  >
                                    {processingId === (supplier.id || supplier._id) ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDeactivate(supplier);
                                  }}
                                  disabled={processingId === (supplier.id || supplier._id)}
                                  className="p-1.5 text-red-650 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                                  title={t("suppliers.deactivate")}
                                >
                                  {processingId === (supplier.id || supplier._id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Ban className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {editingId ? t("suppliers.editSupplier") : t("suppliers.addNewSupplier")}
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("suppliers.name")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      required
                      className="w-full border border-slate-350 rounded-lg pl-10 p-2.5 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("suppliers.namePlaceholder")}
                      value={formData.supplierName}
                      onChange={(e) =>
                        setFormData({ ...formData, supplierName: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {t("suppliers.contact")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      className="w-full border border-slate-350 rounded-lg pl-10 p-2.5 focus:ring-2 focus:ring-primary outline-none"
                      placeholder={t("suppliers.contactPlaceholder")}
                      value={formData.contactNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-slate-50 flex flex-col sm:flex-row justify-end gap-3">
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
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 order-1 sm:order-2 cursor-pointer font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      {editingId ? t("suppliers.updating") : t("suppliers.creating")}
                    </>
                  ) : editingId ? (
                    t("suppliers.updateSupplier")
                  ) : (
                    t("suppliers.createSupplier")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      <ConfirmModal
        isOpen={!!supplierToDelete}
        title={t("suppliers.deactivateSupplier")}
        message={
          supplierToDelete
            ? t("suppliers.confirmDeactivateMessage").replace(
              "{name}",
              supplierToDelete.supplierName,
            )
            : t("suppliers.confirmDeactivate")
        }
        confirmText={t("suppliers.deactivate")}
        cancelText={t("common.cancel")}
        confirmButtonColor="red"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setSupplierToDelete(null)}
        isLoading={
          supplierToDelete
            ? processingId === (supplierToDelete.id || supplierToDelete._id)
            : false
        }
      />

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!supplierToPermanentlyDelete}
        title={t("suppliers.deleteSupplier")}
        message={
          supplierToPermanentlyDelete
            ? t("suppliers.confirmDeleteMessage").replace(
              "{name}",
              supplierToPermanentlyDelete.supplierName,
            )
            : t("suppliers.confirmDelete")
        }
        confirmText={t("suppliers.delete")}
        cancelText={t("common.cancel")}
        confirmButtonColor="red"
        onConfirm={handleConfirmPermanentDelete}
        onCancel={() => setSupplierToPermanentlyDelete(null)}
        isLoading={
          supplierToPermanentlyDelete
            ? processingId ===
            (supplierToPermanentlyDelete.id ||
              supplierToPermanentlyDelete._id)
            : false
        }
      />
    </div>
  );
};
