import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  RefreshCw,
  Search,
  Phone,
  User,
  AlertTriangle,
  CheckCircle,
  Ban,
  Loader2,
  X,
  Eye,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { createCreditPersona } from "../services/Credit/createCreditPersona";
import { updateCreditPersona } from "../services/Credit/updateCreditPersona";
import { useLanguage } from "../context/LanguageContext";

export const Credits: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add/Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "" });

  useEffect(() => {
    loadCreditPersonas();
  }, []);

  const loadCreditPersonas = async () => {
    setLoading(true);
    try {
      const response = await fetchCreditPersonas();
      if (response.success && response.data) {
        setCreditPersonas(response.data);
      } else {
        toast.error(response.message || t("credits.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
      toast.error(t("credits.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadCreditPersonas();
    toast.success(t("credits.refreshed"));
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", phone: "", address: "" });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (persona: CreditPersona) => {
    setEditingId(persona._id);
    setFormData({ name: persona.name, phone: persona.phone, address: persona.address || "" });
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", phone: "", address: "" });
  };

  const handleSubmitProfile = async () => {
    if (!formData.name.trim()) {
      toast.error(t("credits.nameRequired"));
      return;
    }
    if (!formData.phone.trim()) {
      toast.error(t("credits.phoneRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update existing profile
        const response = await updateCreditPersona(editingId, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim() || undefined,
        });

        if (response.success) {
          toast.success(t("credits.profileUpdated"));
          handleCloseAddModal();
          loadCreditPersonas();
        } else {
          toast.error(response.message || t("credits.failedToUpdate"));
        }
      } else {
        // Create new profile
        const response = await createCreditPersona({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          address: formData.address.trim() || undefined,
        });

        if (response.success) {
          toast.success(t("credits.profileCreated"));
          handleCloseAddModal();
          loadCreditPersonas();
        } else {
          toast.error(response.message || t("credits.failedToCreate"));
        }
      }
    } catch (error: any) {
      console.error(
        editingId
          ? "Error updating credit profile:"
          : "Error creating credit profile:",
        error,
      );
      toast.error(
        error.message ||
        (editingId
          ? t("credits.failedToUpdate")
          : t("credits.failedToCreate")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPersona = (persona: CreditPersona) => {
    navigate(`/credits/${persona._id}`, {
      state: { name: persona.name, phone: persona.phone, address: persona.address },
    });
  };

  // Filter personas by search
  const filteredPersonas = creditPersonas.filter((persona) => {
    const searchLower = search.toLowerCase();
    return (
      persona.name.toLowerCase().includes(searchLower) ||
      persona.phone.includes(search) ||
      (persona.address && persona.address.toLowerCase().includes(searchLower))
    );
  });

  // Stats
  const totalPersonas = creditPersonas.length;
  const blacklistedCount = creditPersonas.filter((p) => p.blacklist).length;
  const activeCount = totalPersonas - blacklistedCount;
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  return (
    <div className="w-full">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("credits.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("credits.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{t("storefront.refresh")}</span>
            </button>
            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{t("credits.addProfile")}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Customers */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <User className="w-5 h-5 text-[#2216a8]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                {t("credits.totalProfiles")}
              </p>
              <p className="text-lg font-black text-slate-800 mt-1">
                {totalPersonas} <span className="text-xs font-semibold text-slate-400">ယောက်</span>
              </p>
            </div>
          </div>

          {/* Active Customers */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                Active ဖြစ်နေတဲ့ Customer
              </p>
              <p className="text-lg font-black text-slate-800 mt-1">
                {activeCount} <span className="text-xs font-semibold text-slate-400">ယောက်</span>
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t("credits.searchPlaceholder")}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200/80 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-xs sm:text-sm text-slate-700 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Credit Personas Table */}
        <div className="bg-white shadow-sm border rounded-xl overflow-hidden">
          <div className="p-4 border-b bg-slate-50">
            <h2 className="font-semibold text-slate-800">
              {t("credits.title")} ({filteredPersonas.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("credits.loading")}
            </div>
          ) : filteredPersonas.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {search ? t("credits.noResults") : t("credits.noProfiles")}
            </div>
          ) : (
            <div>
              {/* Table container with horizontal scroll on mobile */}
              <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="text-slate-500">
                    <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">No</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Customer</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Phone Number</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Address</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Status</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Create Date</th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredPersonas.map((persona, index) => (
                      <tr key={persona._id} className="hover:bg-slate-50/40 transition-colors">
                        {/* No */}
                        <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-4 font-bold text-slate-800 text-xs sm:text-sm">
                          {persona.name}
                        </td>

                        {/* Phone Number */}
                        <td className="px-4 py-4 font-bold text-slate-800 text-xs sm:text-sm">
                          {persona.phone}
                        </td>

                        {/* Address */}
                        <td className="px-4 py-4 text-slate-500 text-xs font-medium max-w-xs truncate" title={persona.address || ""}>
                          {persona.address || "-"}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {persona.blacklist ? (
                            <span className="border border-red-200 text-red-600 bg-red-50/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Blacklisted
                            </span>
                          ) : (
                            <span className="border border-green-200 text-green-600 bg-green-50/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </td>

                        {/* Create Date */}
                        <td className="px-4 py-4 text-slate-500 text-xs font-medium whitespace-nowrap">
                          {new Date(persona.createdAt).toLocaleDateString("en-US")}{" "}
                          {new Date(persona.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(persona)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
                            >
                              {t("common.edit")}
                            </button>
                            <button
                              onClick={() => handleViewPersona(persona)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
                            >
                              {t("common.view")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Add Credit Profile Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#f7f6f2] rounded-3xl shadow-2xl w-full max-w-md border border-white/40 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-gray-200/50 flex justify-between items-center bg-[#f7f6f2]">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-[#2216a8]" />
                  {editingId ? t("credits.editProfile") : t("credits.addProfile")}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t("credits.name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
                    placeholder={t("credits.namePlaceholder")}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t("credits.phone")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
                    placeholder={t("credits.phonePlaceholder")}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t("credits.address")}
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
                    placeholder={t("credits.addressPlaceholder")}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200/50 bg-slate-50/40 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-full text-sm font-bold transition-all cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSubmitProfile}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#2216a8] hover:bg-[#2216a8]/90 text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />{" "}
                      {editingId ? t("credits.updating") : t("credits.creating")}
                    </>
                  ) : editingId ? (
                    t("credits.updateProfile")
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />{" "}
                      <span>
                        {t("credits.createProfile")}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
