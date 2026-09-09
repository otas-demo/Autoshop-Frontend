import React, { useState, useEffect } from "react";
import {
  PieChart,
  RefreshCw,
  MapPin,
  User,
  Calendar,
  Loader2,
  Plus,
  X,
  Edit,
  Trash2,
  Search,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { fetchExpenses, Expense } from "../services/Expense/fetchExpenses";
import { createExpense } from "../services/Expense/createExpense";
import { updateExpense } from "../services/Expense/updateExpense";
import { deleteExpense } from "../services/Expense/deleteExpense";
import { fetchExpenseCategories } from "../services/Expense/fetchExpenseCategories";
import {
  fetchLocationProfiles,
  LocationProfile,
} from "../services/Location/fetchLocationProfiles";
import { useLanguage } from "../context/LanguageContext";
import { ConfirmModal } from "../components/Common/ConfirmModal";
import { DateRangePicker } from "../components/Reports/DateRangePicker";
import {
  DATE_RANGE_STORAGE_KEYS,
  createDateRangeInitializer,
  saveStoredDateRange,
} from "../utils/dateRangeStorage";

const DEFAULT_EXPENSE_CATEGORIES = [
  "electricity",
  "water",
  "utilities",
  "salary",
  "maintenance",
  "rent",
  "transportation",
  "other",
];

export const Expenses: React.FC = () => {
  const { t, language } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationProfile[]>([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryShowDropdown, setCategoryShowDropdown] = useState(false);

  // Date filter — restored from sessionStorage on mount
  const [dateRange, setDateRange] = useState(
    createDateRangeInitializer(DATE_RANGE_STORAGE_KEYS.expenses),
  );
  const { startDate, endDate } = dateRange;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
    notes: "",
    locationId: "", // Add locationId to form data
  });

  // Delete Confirmation Modal State
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const adminData = JSON.parse(localStorage.getItem("adminData") || "{}");
  const userRole = adminData.role;

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    loadLocations();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetchExpenseCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Error loading expense categories:", error);
    }
  };

  const getUniqueCategories = (): string[] => {
    const catsSet = new Set<string>();
    DEFAULT_EXPENSE_CATEGORIES.forEach((c) => catsSet.add(c));
    categories.forEach((c) => {
      if (c) catsSet.add(c);
    });
    expenses.forEach((e) => {
      if (e.category) catsSet.add(e.category);
    });
    return Array.from(catsSet).sort((a, b) => a.localeCompare(b));
  };

  const getFilteredCategories = (input: string): string[] => {
    const allCategories = getUniqueCategories();
    if (!input.trim()) return allCategories;
    return allCategories.filter((cat) =>
      cat.toLowerCase().includes(input.toLowerCase()),
    );
  };

  const loadLocations = async () => {
    try {
      const response = await fetchLocationProfiles();
      if (response.success && response.data) {
        setLocations(response.data);
      } else {
        toast.error(response.message || "Failed to load locations");
      }
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error("Failed to load locations");
    }
  };

  const formatDateForAPI = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const startDateStr = formatDateForAPI(startDate);
      const endDateStr = formatDateForAPI(endDate);
      const response = await fetchExpenses(startDateStr, endDateStr);
      if (response.success && response.data) {
        setExpenses(response.data);
      } else {
        toast.error(response.message || t("expenses.failedToLoad"));
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      toast.error(t("expenses.failedToLoad"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingId(expense._id);
    setCategoryInput("");
    setCategoryShowDropdown(false);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      date: expense.date.split("T")[0], // Extract date part if it includes time
      notes: expense.notes || "",
      locationId: expense.locationId?._id || "", // Include locationId _id
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setCategoryInput("");
    setCategoryShowDropdown(false);
    setFormData({
      category: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      notes: "",
      locationId: "", // Reset locationId
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.category ||
      formData.amount <= 0 ||
      !formData.date ||
      (userRole !== "cashier" && !formData.locationId)
    ) {
      toast.error(t("expenses.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // Update existing expense
        const payload: any = {};
        if (formData.category) payload.category = formData.category;
        if (formData.amount > 0) payload.amount = formData.amount;
        if (formData.date) payload.date = formData.date;
        if (formData.notes) payload.notes = formData.notes;
        if (userRole !== "cashier" && formData.locationId)
          payload.locationId = formData.locationId;

        const response = await updateExpense(editingId, payload);

        if (response.success) {
          toast.success(t("expenses.expenseUpdated"));
          handleCloseModal();
          loadExpenses();
          loadCategories();
        } else {
          toast.error(response.message || t("expenses.failedToUpdate"));
        }
      } else {
        // Create new expense
        const payload: any = {
          category: formData.category,
          amount: formData.amount,
          date: formData.date,
          ...(formData.notes && { notes: formData.notes }),
        };

        // Only add locationId for non-cashier users
        if (userRole !== "cashier" && formData.locationId) {
          payload.locationId = formData.locationId;
        }

        const response = await createExpense(payload);

        if (response.success) {
          toast.success(t("expenses.expenseCreated"));
          handleCloseModal();
          loadExpenses();
          loadCategories();
        } else {
          toast.error(response.message || t("expenses.failedToCreate"));
        }
      }
    } catch (error: any) {
      console.error(
        editingId ? "Error updating expense:" : "Error creating expense:",
        error,
      );
      toast.error(
        error.message ||
        (editingId
          ? t("expenses.failedToUpdate")
          : t("expenses.failedToCreate")),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deleteExpense(expenseToDelete._id);
      if (response.success) {
        toast.success(
          response.message ||
          t("expenses.expenseDeleted") ||
          "Expense deleted successfully",
        );
        setExpenseToDelete(null);
        loadExpenses();
      } else {
        toast.error(
          response.message ||
          t("expenses.failedToDelete") ||
          "Failed to delete expense",
        );
      }
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error(
        error.message ||
        t("expenses.failedToDelete") ||
        "Failed to delete expense",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const searchLower = search.toLowerCase();
    const locName = exp.locationId?.locationName || exp.locationId?.storefrontName || "";
    return (
      exp.category.toLowerCase().includes(searchLower) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchLower)) ||
      locName.toLowerCase().includes(searchLower)
    );
  });

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  return (
    <div className="w-full">
      <div className="bg-white min-h-[96vh] border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {t("expenses.title")}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {t("expenses.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadExpenses}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{t("storefront.refresh")}</span>
            </button>
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(newStartDate, newEndDate) => {
                if (!newStartDate || !newEndDate) return;
                setDateRange({
                  startDate: newStartDate,
                  endDate: newEndDate,
                });
                saveStoredDateRange(
                  DATE_RANGE_STORAGE_KEYS.expenses,
                  newStartDate,
                  newEndDate,
                );
              }}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            />
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("expenses.addExpense")}</span>
            </button>
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

        {/* Stats Card */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <PieChart className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
              {t("expenses.totalExpenses")}
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {totalExpenses.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden flex flex-col min-h-0">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#2216a8] mx-auto mb-2" />
              <p>{t("expenses.loading")}</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <PieChart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p>{t("expenses.noExpenses")}</p>
            </div>
          ) : (
            <div>
              {/* Table container with horizontal scroll on mobile */}
              <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                <table className="w-full text-sm text-left min-w-[900px]">
                  <thead className="text-slate-500">
                    <tr className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(229,231,235,1)]">
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">No</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Date</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Category</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Location</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Notes</th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Recorded By</th>
                      <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Amount</th>
                      <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredExpenses.map((expense, index) => (
                      <tr key={expense._id} className="hover:bg-slate-50/40 transition-colors">
                        {/* No */}
                        <td className="px-4 py-4 text-center font-bold text-slate-400 text-xs">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-4 text-slate-600 text-xs font-medium whitespace-nowrap">
                          {(() => {
                            // expense.date = "YYYY-MM-DD" — no time stored.
                            // new Date("YYYY-MM-DD") parses as UTC midnight → shows 06:30 AM in Myanmar.
                            // Fix: read parts directly, never pass through Date constructor.
                            const raw = (expense.date || "").split("T")[0]; // "2026-09-09"
                            const [y, m, d] = raw.split("-");
                            if (!y || !m || !d) return raw || "-";
                            return `${parseInt(m)}/${parseInt(d)}/${y}`;
                          })()}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4">
                          <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-bold capitalize">
                            {expense.category}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-4">
                          {expense.locationId ? (
                            <>
                              <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                                {expense.locationId.locationName}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {expense.locationId.locationCode}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">
                              {t("expenses.noLocation")}
                            </span>
                          )}
                        </td>

                        {/* Notes */}
                        <td className="px-4 py-4 text-slate-500 text-xs font-medium max-w-xs truncate" title={expense.notes || ""}>
                          {expense.notes || "-"}
                        </td>

                        {/* Recorded By */}
                        <td className="px-4 py-4">
                          {expense.adminId ? (
                            <>
                              <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                                {expense.adminId.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium capitalize">
                                {expense.adminId.role}
                              </div>
                            </>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">-</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-4 text-right font-bold text-red-600 text-xs sm:text-sm whitespace-nowrap">
                          {expense.amount.toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-medium">MMK</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(expense)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white shadow-sm flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
                            >
                              {t("common.edit")}
                            </button>
                            <button
                              onClick={() => handleDelete(expense)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center justify-center cursor-pointer transition-all whitespace-nowrap"
                            >
                              {t("common.delete") || "Delete"}
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

        {/* Add Expense Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-[#f7f6f2] rounded-3xl shadow-2xl w-full max-w-md border border-white/40 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-gray-200/50 flex justify-between items-center bg-[#f7f6f2]">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#2216a8]" />
                  {editingId
                    ? t("expenses.editExpense")
                    : t("expenses.newExpense")}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t("expenses.category")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white pr-10"
                      value={categoryInput || formData.category}
                      onChange={(e) => {
                        const value = e.target.value;
                        setCategoryInput(value);
                        setFormData({ ...formData, category: value });
                        setCategoryShowDropdown(true);
                      }}
                      onFocus={() => setCategoryShowDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => setCategoryShowDropdown(false), 200);
                      }}
                      placeholder={
                        t("expenses.categoryPlaceholder") ||
                        (language === "my"
                          ? "အမျိုးအစားရွေးပါ သို့မဟုတ် အသစ်ရိုက်ထည့်ပါ..."
                          : "Select category or type new...")
                      }
                    />
                    <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {categoryShowDropdown && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {getFilteredCategories(
                          categoryInput || formData.category,
                        ).map((category) => (
                          <div
                            key={category}
                            className="px-4 py-2.5 hover:bg-indigo-50 hover:text-[#2216a8] text-slate-700 cursor-pointer text-sm font-medium transition-colors capitalize"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, category });
                              setCategoryInput("");
                              setCategoryShowDropdown(false);
                            }}
                          >
                            {t(`expenses.${category}`) !== `expenses.${category}`
                              ? t(`expenses.${category}`)
                              : category}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {userRole !== "cashier" && (
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-1.5">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        required
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white appearance-none pr-10"
                        value={formData.locationId}
                        onChange={(e) =>
                          setFormData({ ...formData, locationId: e.target.value })
                        }
                      >
                        <option value="">Select Location</option>
                        {locations.map((location) => (
                          <option key={location._id} value={location._id}>
                            {location.locationName} ({location.locationCode})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t("expenses.amount")} (MMK){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
                    placeholder="0"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t("expenses.date")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t("expenses.notesOptional")}
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white resize-none"
                    placeholder={t("expenses.notesPlaceholder")}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-full text-sm font-bold transition-all cursor-pointer"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-600/10 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        {editingId
                          ? t("expenses.updating")
                          : t("expenses.creating")}
                      </>
                    ) : editingId ? (
                      t("expenses.updateExpense")
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />{" "}
                        <span>
                          {t("expenses.createExpense")}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!expenseToDelete}
          title={t("expenses.deleteExpense") || "Delete Expense"}
          message={
            expenseToDelete
              ? t("expenses.confirmDeleteMessage")?.replace(
                "{amount}",
                expenseToDelete.amount.toLocaleString(),
              ) ||
              `Are you sure you want to delete this expense of ${expenseToDelete.amount.toLocaleString()} MMK? This action cannot be undone.`
              : t("expenses.confirmDelete") ||
              "Are you sure you want to delete this expense?"
          }
          confirmText={t("common.delete") || "Delete"}
          cancelText={t("common.cancel") || "Cancel"}
          confirmButtonColor="red"
          onConfirm={handleConfirmDelete}
          onCancel={() => setExpenseToDelete(null)}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};
