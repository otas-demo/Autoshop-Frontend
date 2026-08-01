import React, { useState, useEffect } from "react";
import {
  Users,
  RefreshCw,
  Shield,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  X,
  Loader2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAdminAccounts,
  AdminAccount,
} from "../services/Admin/fetchAdminAccounts";
import { updateAdminAccount } from "../services/Admin/updateAdminAccount";
import { softDeleteAdminAccount } from "../services/Admin/softDeleteAdminAccount";
import { restoreAdminAccount } from "../services/Admin/restoreAdminAccount";
import { deleteAdminAccount } from "../services/Admin/deleteAdminAccount";
import { createAdminAccount } from "../services/Admin/createAdminAccount";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../services/Location/fetchLocationProfiles";
import { useLanguage } from "../context/LanguageContext";

export const AccountManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const getModalLabel = (key: string) => {
    const isMm = language === "my";
    switch (key) {
      case "title":
        return isMm ? "အကောင့်အသစ်ထည့်မည်" : "Create New Account";
      case "name":
        return isMm ? "အကောင့် နာမည်" : "Account Name";
      case "namePlaceholder":
        return isMm ? "အကောင့် နာမည်ထည့်ပေးပါ" : "Enter account name";
      case "role":
        return isMm ? "Role" : "Role";
      case "rolePlaceholder":
        return isMm ? "Role ရွေးပေးပါ" : "Select role";
      case "location":
        return isMm ? "ဆိုင်ခွဲ (မရွေးလည်းရ)" : "Location (Optional)";
      case "locationPlaceholder":
        return isMm ? "ဆိုင်ခွဲ ရွေးပေးပါ" : "Select location";
      case "password":
        return isMm ? "Password" : "Password";
      case "passwordPlaceholder":
        return isMm ? "Password ထည့်ပေးပါ" : "Enter password";
      case "confirmPassword":
        return isMm ? "Confirm Password" : "Confirm Password";
      case "confirmPasswordPlaceholder":
        return isMm ? "Password ပြန်ရိုက်ထည့်ပေးပါ" : "Confirm password";
      case "cancel":
        return isMm ? "မလုပ်တော့ပါ" : "Cancel";
      case "submit":
        return isMm ? "အကောင့်အသစ်ထည့်မည်" : "Create Account";
      default:
        return "";
    }
  };
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(
    null,
  );
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<AdminAccount | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Restore State
  const [restoringAccountId, setRestoringAccountId] = useState<string | null>(
    null,
  );

  // Hard Delete Modal State
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false);
  const [accountToHardDelete, setAccountToHardDelete] =
    useState<AdminAccount | null>(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);

  // Create Account Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    locationId: "",
    role: "cashier",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [locationProfiles, setLocationProfiles] = useState<LocationProfile[]>(
    [],
  );

  useEffect(() => {
    loadAccounts();
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const response = await fetchLocationProfiles();
      // console.log("Location profiles response:", response);
      if (response.success && response.data) {
        // Ensure data is an array
        const locations = Array.isArray(response.data) ? response.data : [];

        // console.log("All locations from API:", locations);

        // Filter only active locations that are not deleted
        const activeLocations = locations.filter(
          (location) =>
            location.status === "active" &&
            !location.isDeleted &&
            !location.deletedAt,
        );
        // console.log("Active locations after filter:", activeLocations);

        // If we have active locations, use them; otherwise show all non-deleted
        if (activeLocations.length > 0) {
          setLocationProfiles(activeLocations);
        } else {
          // Fallback: show all non-deleted locations
          const nonDeleted = locations.filter(
            (location) => !location.isDeleted && !location.deletedAt,
          );
          // console.log("No active locations, using non-deleted:", nonDeleted);
          setLocationProfiles(nonDeleted);

          // If still empty, show all locations for debugging
          if (nonDeleted.length === 0 && locations.length > 0) {
            // console.log("No non-deleted locations, showing all:", locations);
            setLocationProfiles(locations);
          }
        }
      } else {
        console.error("Failed to load locations:", response.message);
        setLocationProfiles([]);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error("Failed to load locations");
      setLocationProfiles([]);
    }
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetchAdminAccounts();
      if (response.success && response.data) {
        setAccounts(response.data.accounts);
      } else {
        toast.error(response.message || "Failed to load accounts");
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "owner":
        return "border border-indigo-500 bg-indigo-50/50 text-indigo-700 font-semibold px-3.5 py-0.5 rounded-full text-xs";
      case "cashier":
        return "border border-blue-400 bg-blue-50/50 text-blue-600 font-semibold px-3.5 py-0.5 rounded-full text-xs";
      case "manager":
        return "border border-green-500 bg-green-50/50 text-green-700 font-semibold px-3.5 py-0.5 rounded-full text-xs";
      default:
        return "border border-gray-300 bg-gray-50 text-gray-600 font-semibold px-3.5 py-0.5 rounded-full text-xs";
    }
  };

  const getStatusBadge = (account: AdminAccount) => {
    if (account.softDeleted) {
      return (
        <span className="border border-red-400 bg-red-50 text-red-600 px-3.5 py-0.5 rounded-full text-xs font-semibold">
          Deactivated
        </span>
      );
    }
    return (
      <span className="border border-green-500 bg-green-50 text-green-600 px-3.5 py-0.5 rounded-full text-xs font-semibold">
        Active
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name?.toLowerCase().includes(search.toLowerCase()) ||
      account.role?.toLowerCase().includes(search.toLowerCase()) ||
      account.locationId?.locationName
        ?.toLowerCase()
        .includes(search.toLowerCase());
    const matchesRole =
      roleFilter === "all" ||
      account.role?.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? !account.softDeleted && !account.deletedAt
          : account.softDeleted || !!account.deletedAt;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = Array.from(
    new Set(accounts.map((a) => a.role).filter(Boolean)),
  );

  // Available roles for selection
  const availableRoles = ["owner", "cashier"];

  const handleOpenEditModal = (account: AdminAccount) => {
    setSelectedAccount(account);
    setEditFormData({
      name: account.name,
      role: account.role,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedAccount(null);
    setEditFormData({
      name: "",
      role: "",
    });
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) return;

    if (!editFormData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!editFormData.role) {
      toast.error("Role is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateAdminAccount(selectedAccount._id, {
        name: editFormData.name.trim(),
        role: editFormData.role,
      });

      if (response.success) {
        toast.success("Account updated successfully!");
        handleCloseEditModal();
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to update account");
      }
    } catch (error: any) {
      console.error("Error updating account:", error);
      toast.error(error.message || "Failed to update account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (account: AdminAccount) => {
    setAccountToDelete(account);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAccountToDelete(null);
  };

  const handleSoftDeleteAccount = async () => {
    if (!accountToDelete) return;

    setIsDeleting(true);
    try {
      const response = await softDeleteAdminAccount(accountToDelete._id);

      if (response.success) {
        toast.success(
          `Account "${response.data.name}" deactivated successfully!`,
        );
        handleCloseDeleteModal();
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to deactivate account");
      }
    } catch (error: any) {
      console.error("Error deactivating account:", error);
      toast.error(error.message || "Failed to deactivate account");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestoreAccount = async (account: AdminAccount) => {
    setRestoringAccountId(account._id);
    try {
      const response = await restoreAdminAccount(account._id);

      if (response.success) {
        toast.success(`Account "${response.data.name}" restored successfully!`);
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to restore account");
      }
    } catch (error: any) {
      console.error("Error restoring account:", error);
      toast.error(error.message || "Failed to restore account");
    } finally {
      setRestoringAccountId(null);
    }
  };

  const handleOpenHardDeleteModal = (account: AdminAccount) => {
    setAccountToHardDelete(account);
    setIsHardDeleteModalOpen(true);
  };

  const handleCloseHardDeleteModal = () => {
    setIsHardDeleteModalOpen(false);
    setAccountToHardDelete(null);
  };

  const handleHardDeleteAccount = async () => {
    if (!accountToHardDelete) return;

    setIsHardDeleting(true);
    try {
      const response = await deleteAdminAccount(accountToHardDelete._id);

      if (response.success) {
        toast.success(
          `Account "${accountToHardDelete.name}" permanently deleted!`,
        );
        handleCloseHardDeleteModal();
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to delete account");
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setIsHardDeleting(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createFormData.name.trim()) {
      toast.error("Account name is required");
      return;
    }

    if (!createFormData.password) {
      toast.error("Password is required");
      return;
    }

    if (createFormData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (createFormData.password !== createFormData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!createFormData.role) {
      toast.error("Role is required");
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        name: createFormData.name.trim(),
        password: createFormData.password,
        confirmPassword: createFormData.confirmPassword,
        role: createFormData.role,
        ...(createFormData.locationId && {
          locationId: createFormData.locationId,
        }),
      };

      const response = await createAdminAccount(payload);

      if (response.success) {
        toast.success("Account created successfully!");
        setIsCreateModalOpen(false);
        setCreateFormData({
          name: "",
          password: "",
          confirmPassword: "",
          locationId: "",
          role: "cashier",
        });
        loadAccounts(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to create account");
      }
    } catch (error: any) {
      console.error("Error creating account:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsCreating(false);
    }
  };

  const activeCount = accounts.filter(
    (a) => !a.softDeleted && !a.deletedAt,
  ).length;
  const deletedCount = accounts.filter(
    (a) => a.softDeleted || !!a.deletedAt,
  ).length;

  return (
    <div className="w-full lg:h-[calc(100vh-2rem)]">
      <div className="bg-white border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6 lg:h-full lg:overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("accountManagement.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("accountManagement.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                loadLocations(); // Reload locations when opening modal
                setIsCreateModalOpen(true);
              }}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />{" "}
              <span>{t("accountManagement.createAccount")}</span>
            </button>
            <button
              onClick={loadAccounts}
              disabled={loading}
              className="px-5 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-[#f0efff] hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>{t("accountManagement.refresh")}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Accounts */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[#2216a8] flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {t("accountManagement.totalAccounts")}
                </p>
                <p className="text-lg font-bold text-slate-800 mt-1">
                  {accounts.length.toLocaleString()} MMK
                </p>
              </div>
            </div>

            {/* Active Accounts */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 flex-shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {t("accountManagement.activeAccounts")}
                </p>
                <p className="text-lg font-bold text-slate-800 mt-1">
                  {activeCount.toLocaleString()} MMK
                </p>
              </div>
            </div>

            {/* Delete Accounts */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[#2216a8] flex-shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {t("accountManagement.deactivatedAccounts")}
                </p>
                <p className="text-lg font-bold text-slate-800 mt-1">
                  {deletedCount.toLocaleString()} MMK
                </p>
              </div>
            </div>

            {/* Roles */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  {t("accountManagement.rolesCount")}
                </p>
                <p className="text-lg font-bold text-slate-800 mt-1">
                  {uniqueRoles.length}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200/80 my-4" />

          {/* Filters (Clean styled header before table) */}
          <div className="bg-white p-4 rounded-xl border mb-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1 min-w-[200px] sm:min-w-[250px]">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("accountManagement.searchPlaceholder")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2216a8] focus:border-[#2216a8] outline-none text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#2216a8] focus:border-[#2216a8] outline-none text-xs font-semibold text-slate-600"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">{t("accountManagement.allRoles")}</option>
                  {uniqueRoles.map((role) => (
                    <option key={String(role)} value={String(role)}>
                      {String(role).charAt(0).toUpperCase() + String(role).slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-[#2216a8] focus:border-[#2216a8] outline-none text-xs font-semibold text-slate-600"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">{t("accountManagement.allStatus")}</option>
                  <option value="active">{t("accountManagement.active")}</option>
                  <option value="deleted">{t("accountManagement.inactive")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Accounts Table */}
          {loading ? (
            <div className="bg-white rounded-xl border p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[#2216a8] mx-auto mb-2" />
              <p className="text-slate-500">{t("accountManagement.loading")}</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">{t("accountManagement.noAccounts")}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[900px]">
                  <thead className="bg-[#fafafa] border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider w-[80px]">
                        No
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                        Account Status
                      </th>
                      {/* <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                        Last Active
                      </th> */}
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                        Create Date
                      </th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAccounts.map((account, index) => (
                      <tr key={account._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-400 text-xs">
                          {String(index + 1).padStart(2, "0")}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                          {account.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={getRoleColor(account.role)}>
                            {account.role
                              ? account.role.charAt(0).toUpperCase() + account.role.slice(1).toLowerCase()
                              : ""}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {account.locationId ? (
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">
                                {account.locationId.locationName}
                              </p>
                              <p className="text-xs text-slate-400 font-medium mt-0.5">
                                {account.locationId.locationCode} • {account.locationId.type}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">
                              No location
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(account)}
                        </td>
                        {/* <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span>
                              {account.lastActiveAt ? formatDate(account.lastActiveAt) : "Not Yet"}
                            </span>
                          </div>
                        </td> */}
                        <td className="px-6 py-4 text-slate-800 text-xs font-semibold">
                          {formatDate(account.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(account)}
                              disabled={account.softDeleted}
                              className="bg-[#2216a8] hover:bg-[#2216a8]/90 text-white px-5 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {t("accountManagement.edit")}
                            </button>
                            {!account.softDeleted ? (
                              <button
                                onClick={() => handleOpenDeleteModal(account)}
                                className="border border-red-500 text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer"
                              >
                                {t("accountManagement.deactivate")}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRestoreAccount(account)}
                                  disabled={restoringAccountId === account._id}
                                  className="border border-green-500 text-green-600 hover:bg-green-50 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {restoringAccountId === account._id ? "..." : t("accountManagement.restore")}
                                </button>
                                <button
                                  onClick={() => handleOpenHardDeleteModal(account)}
                                  disabled={isHardDeleting && accountToHardDelete?._id === account._id}
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  {t("accountManagement.hardDelete")}
                                </button>
                              </>
                            )}
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

        {/* Edit Account Modal */}
        {isEditModalOpen && selectedAccount && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#f7f6f2] rounded-3xl shadow-2xl w-full max-w-md border border-white/40 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-gray-200/50 flex justify-between items-center bg-[#f7f6f2]">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Edit className="w-5 h-5 text-[#2216a8]" />
                  {language === "my" ? "အကောင့်ပြင်ဆင်မည်" : "Edit Account"}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateAccount} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {language === "my" ? "အကောင့် နာမည်" : "Account Name"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
                    placeholder="Enter account name"
                    value={editFormData.name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white appearance-none pr-10"
                      value={editFormData.role}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, role: e.target.value })
                      }
                    >
                      <option value="">Select Role</option>
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Account Info Display */}
                <div className="bg-white border border-gray-200/70 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account ID:</span>
                    <span className="font-mono text-slate-700">
                      {selectedAccount._id}
                    </span>
                  </div>
                  {selectedAccount.locationId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Location:</span>
                      <span className="text-slate-700 font-semibold">
                        {selectedAccount.locationId.locationName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created:</span>
                    <span className="text-slate-700 font-semibold">
                      {formatDate(selectedAccount.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-6 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-full text-sm font-bold transition-all cursor-pointer"
                  >
                    {language === "my" ? "မလုပ်တော့ပါ" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#2216a8] hover:bg-[#2216a8]/90 text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4" />{" "}
                        <span>{language === "my" ? "ပြင်ဆင်မည်" : "Update Account"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && accountToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Deactivate Account
                </h2>
                <button
                  onClick={handleCloseDeleteModal}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    Are you sure you want to deactivate this account? This action
                    will prevent the user from accessing the system.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Name:</span>
                    <span className="font-medium text-slate-800">
                      {accountToDelete.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Role:</span>
                    <span className="font-medium text-slate-800">
                      {accountToDelete.role?.toUpperCase()}
                    </span>
                  </div>
                  {accountToDelete.locationId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-medium text-slate-800">
                        {accountToDelete.locationId.locationName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account ID:</span>
                    <span className="font-mono text-slate-700 text-xs">
                      {accountToDelete._id}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseDeleteModal}
                    disabled={isDeleting}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSoftDeleteAccount}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Deactivating...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> Deactivate Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hard Delete Confirmation Modal */}
        {isHardDeleteModalOpen && accountToHardDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b flex justify-between items-center bg-red-50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  Permanently Delete Account
                </h2>
                <button
                  onClick={handleCloseHardDeleteModal}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-900 mb-2">
                        ⚠️ WARNING: This action cannot be undone!
                      </p>
                      <p className="text-sm text-red-800">
                        You are about to permanently delete this account from the
                        system. This will remove all associated data and cannot be
                        reversed. Please make sure you want to proceed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Name:</span>
                    <span className="font-medium text-slate-800">
                      {accountToHardDelete.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Role:</span>
                    <span className="font-medium text-slate-800">
                      {accountToHardDelete.role?.toUpperCase()}
                    </span>
                  </div>
                  {accountToHardDelete.locationId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-medium text-slate-800">
                        {accountToHardDelete.locationId.locationName}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account ID:</span>
                    <span className="font-mono text-slate-700 text-xs">
                      {accountToHardDelete._id}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-medium text-red-600">Deactivated</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={handleCloseHardDeleteModal}
                    disabled={isHardDeleting}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleHardDeleteAccount}
                    disabled={isHardDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isHardDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" /> Delete Permanently
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Account Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#f7f6f2] rounded-3xl shadow-2xl w-full max-w-md border border-white/40 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-gray-200/50 flex justify-between items-center bg-[#f7f6f2]">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#2216a8]" />
                  {getModalLabel("title")}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateFormData({
                      name: "",
                      password: "",
                      confirmPassword: "",
                      locationId: "",
                      role: "cashier",
                    });
                  }}
                  className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {getModalLabel("name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
                    placeholder={getModalLabel("namePlaceholder")}
                    value={createFormData.name}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {getModalLabel("role")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white appearance-none pr-10"
                      value={createFormData.role}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          role: e.target.value,
                        })
                      }
                    >
                      <option value="cashier">Cashier</option>
                      <option value="owner">Owner</option>
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {getModalLabel("location")}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white appearance-none pr-10"
                      value={createFormData.locationId}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          locationId: e.target.value,
                        })
                      }
                    >
                      <option value="">No location</option>
                      {locationProfiles.length === 0 ? (
                        <option disabled>Loading locations...</option>
                      ) : (
                        <>
                          {locationProfiles.filter(
                            (loc) => loc.type === "storefront",
                          ).length > 0 && (
                              <optgroup label="Storefronts">
                                {locationProfiles
                                  .filter((loc) => loc.type === "storefront")
                                  .map((loc) => (
                                    <option key={loc._id} value={loc._id}>
                                      {loc.locationName} ({loc.locationCode})
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                          {locationProfiles.filter(
                            (loc) => loc.type === "warehouse",
                          ).length > 0 && (
                              <optgroup label="Warehouses">
                                {locationProfiles
                                  .filter((loc) => loc.type === "warehouse")
                                  .map((loc) => (
                                    <option key={loc._id} value={loc._id}>
                                      {loc.locationName} ({loc.locationCode})
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                          {locationProfiles.length > 0 &&
                            locationProfiles.filter(
                              (loc) => loc.type === "storefront",
                            ).length === 0 &&
                            locationProfiles.filter(
                              (loc) => loc.type === "warehouse",
                            ).length === 0 && (
                              <option disabled>
                                No active locations available
                              </option>
                            )}
                        </>
                      )}
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  {locationProfiles.length === 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      No locations found. Please check if locations are available.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {getModalLabel("password")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white pr-10"
                      placeholder={getModalLabel("passwordPlaceholder")}
                      value={createFormData.password}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          password: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {getModalLabel("confirmPassword")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white pr-10"
                      placeholder={getModalLabel("confirmPasswordPlaceholder")}
                      value={createFormData.confirmPassword}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreateFormData({
                        name: "",
                        password: "",
                        confirmPassword: "",
                        locationId: "",
                        role: "cashier",
                      });
                    }}
                    className="px-6 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-full text-sm font-bold transition-all cursor-pointer"
                  >
                    {getModalLabel("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-6 py-2.5 bg-[#2216a8] hover:bg-[#2216a8]/90 text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> {language === "my" ? "သိမ်းဆည်းနေသည်..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> <span>{getModalLabel("submit")}</span>
                      </>
                    )}
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
