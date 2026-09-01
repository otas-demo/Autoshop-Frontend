import React, { useEffect, useState } from "react";
import { Plus, Trash2, X, ChevronDown, Truck } from "lucide-react";
import { Product, Supplier } from "../../types";
import { useLanguage } from "../../context/LanguageContext";
import { fetchSuppliers } from "../../services/Supplier/fetchSuppliers";

// const UNIT_OF_MEASURE_OPTIONS = [
//   "piece",
//   "kg",
//   "gram",
//   "liter",
//   "ml",
//   "meter",
//   "cm",
//   "box",
//   "pack",
//   "carton",
//   "dozen",
//   "pair",
// ];

export interface ProductFormData {
  productName: string;
  productCode: string;
  saleCode?: string;
  SKU: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  wholesalePrices?: WholesalePriceTier[];
  unitOfMeasure: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
  note?: string;
  supplierIds?: string[];
}

export interface WholesalePriceTier {
  id?: string;
  quantity: number;
  price: number;
}

export interface ApiProduct {
  _id?: string;
  id?: string;
  productName: string;
  productCode: string;
  saleCode?: string;
  SKU: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  brand?: string;
  description?: string;
  buyingPrice: number;
  sellingPrice: number;
  wholesalePrices?: WholesalePriceTier[];
  unitOfMeasure: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  taxRate?: number;
  status?: string;
  tags?: string[];
  note?: string;
  supplierIds?: any[];
  stockWarehouse?: number;
  stockShop?: number;
}

interface ProductModalProps {
  isOpen: boolean;
  editingId: string | null;
  formData: ProductFormData;
  error: string | null;
  isLoading: boolean;
  products: Product[];
  apiProducts: ApiProduct[];
  onClose: () => void;
  onSave: () => void;
  onFormDataChange: (data: ProductFormData) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  editingId,
  formData,
  error,
  isLoading,
  products,
  apiProducts,
  onClose,
  onSave,
  onFormDataChange,
}) => {
  const { t, language } = useLanguage();

  // Combobox states for category and subCategory
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryShowDropdown, setCategoryShowDropdown] = useState(false);
  const [tierDrafts, setTierDrafts] = useState<
    Record<string, Partial<{ quantity: string; price: string }>>
  >({});
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers()
        .then((res) => {
          if (res && res.data) {
            setAvailableSuppliers(res.data);
          }
        })
        .catch((err) => console.error("Failed to load suppliers:", err));
    }
  }, [isOpen]);

  const selectedSupplierIds: string[] = (formData.supplierIds || []).map((s: any) =>
    typeof s === "object" ? s._id || s.id : s
  );
  // const [subCategoryInput, setSubCategoryInput] = useState("");
  // const [subCategoryShowDropdown, setSubCategoryShowDropdown] = useState(false);

  // Get unique categories from products
  const getUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });
    return Array.from(categories).sort();
  };

  // Get unique subcategories from API products
  // const getUniqueSubCategories = (): string[] => {
  //   const subCategories = new Set<string>();
  //   apiProducts.forEach((p) => {
  //     if (p.subCategory && p.subCategory.trim()) {
  //       subCategories.add(p.subCategory);
  //     }
  //   });
  //   return Array.from(subCategories).sort();
  // };

  // Filter categories/subcategories based on input
  const getFilteredCategories = (input: string): string[] => {
    const allCategories = getUniqueCategories();
    if (!input.trim()) return allCategories;
    return allCategories.filter((cat) =>
      cat.toLowerCase().includes(input.toLowerCase()),
    );
  };

  // const getFilteredSubCategories = (input: string): string[] => {
  //   const allSubCategories = getUniqueSubCategories();
  //   if (!input.trim()) return allSubCategories;
  //   return allSubCategories.filter((subCat) =>
  //     subCat.toLowerCase().includes(input.toLowerCase())
  //   );
  // };

  const updateFormData = (updates: Partial<ProductFormData>) => {
    onFormDataChange({ ...formData, ...updates });
  };

  const wholesalePrices = formData.wholesalePrices || [];

  useEffect(() => {
    if (!isOpen) {
      setTierDrafts({});
      setCategoryInput("");
      setCategoryShowDropdown(false);
    }
  }, [isOpen]);

  const getTierKey = (tier: WholesalePriceTier, idx: number) =>
    tier.id ?? `tier-${idx}`;

  const getTierQuantityValue = (key: string, tier: WholesalePriceTier) =>
    tierDrafts[key]?.quantity ?? String(tier.quantity ?? "");

  const getTierPriceValue = (key: string, tier: WholesalePriceTier) =>
    tierDrafts[key]?.price ?? String(tier.price ?? "");

  const addWholesaleTier = () => {
    const nextQuantity =
      wholesalePrices.length > 0
        ? Math.max(...wholesalePrices.map((t) => t.quantity || 0)) + 1
        : 1;

    updateFormData({
      wholesalePrices: [
        ...wholesalePrices,
        {
          id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          quantity: nextQuantity,
          price: formData.sellingPrice || 0,
        },
      ],
    });
  };

  const removeWholesaleTier = (idx: number) => {
    updateFormData({
      wholesalePrices: wholesalePrices.filter((_, i) => i !== idx),
    });
  };

  const updateWholesaleTier = (
    idx: number,
    updates: Partial<WholesalePriceTier>,
  ) => {
    updateFormData({
      wholesalePrices: wholesalePrices.map((tier, i) =>
        i === idx ? { ...tier, ...updates } : tier,
      ),
    });
  };

  const getLabel = (key: string) => {
    const isMm = language === "my";
    switch (key) {
      case "productName":
        return isMm ? "ပစ္စည်း နာမည်" : "Product Name";
      case "productNamePlaceholder":
        return isMm ? "ပစ္စည်း နာမည်ထည့်ပေးပါ" : "Enter product name";
      case "carCode":
        return isMm ? "ဘားကုဒ် နံပါတ်" : "Barode Number";
      case "carCodePlaceholder":
        return isMm ? "ဘားကုဒ် နံပါတ်ထည့်ပေးပါ" : "Enter barode number";
      case "productCode":
        return isMm ? "ပစ္စည်းကုဒ် နံပါတ်" : "Product Code Number";
      case "productCodePlaceholder":
        return isMm ? "ပစ္စည်းကုဒ် နံပါတ်ထည့်ပေးပါ" : "Enter product code";
      case "category":
        return isMm ? "ပစ္စည်း အမျိုးအစား:" : "Product Category";
      case "categoryPlaceholder":
        return isMm ? "အမျိုးအစားရွေးပါ , အသစ်ဆိုရိုက်ထည့်ပါ" : "Select category or type new";
      case "brand":
        return isMm ? "ပစ္စည်း အမှတ်တံဆိပ် (မထည့်လည်းရ)" : "Product Brand (Optional)";
      case "brandPlaceholder":
        return isMm ? "ပစ္စည်းအမှတ်တံဆိပ်ထည့်ပေးပါ" : "Enter brand name";
      case "unitOfMeasure":
        return isMm ? "တိုင်းတာမှုယူနစ် (ဥပမာ - piece, pack, box)" : "Unit of Measure (e.g. piece, pack, box)";
      case "unitOfMeasurePlaceholder":
        return isMm ? "တိုင်းတာမှုယူနစ် ရိုက်ထည့်ပါ" : "Enter unit of measure";
      case "buyingPrice":
        return isMm ? "ဝယ်ယူဈေးနှုန်း:" : "Buying Price";
      case "buyingPricePlaceholder":
        return isMm ? "ဝယ်ယူဈေးနှုန်း ရိုက်ထည့်ပါ" : "Enter buying price";
      case "sellingPrice":
        return isMm ? "ရောင်းချ ဈေးနှုန်း:" : "Selling Price";
      case "sellingPricePlaceholder":
        return isMm ? "ရောင်းချဈေးနှုန်း ရိုက်ထည့်ပါ" : "Enter selling price";
      case "note":
        return isMm ? "ပစ္စည်း မှတ်ချက် (မထည့်လည်းရ)" : "Product Remark (Optional)";
      case "notePlaceholder":
        return isMm ? "မှတ်ချက် ရှိပါက ထည့်ပေးပါ" : "Enter remark if any";
      case "cancel":
        return isMm ? "မလုပ်တော့ပါ" : "Cancel";
      case "save":
        return editingId
          ? (isMm ? "ပစ္စည်း ပြင်ဆင်မည်" : "Save Changes")
          : (isMm ? "ပစ္စည်းအသစ် ထည့်မည်" : "ပစ္စည်းအသစ် ထည့်မည်");
      default:
        return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#f7f6f2] p-8 rounded-3xl w-full max-w-2xl my-8 shadow-2xl relative max-h-[95vh] overflow-y-auto border border-white/40">

        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-slate-800">
            {editingId
              ? (language === "en" ? "Edit Product" : "ပြင်ဆင်မည်")
              : (language === "en" ? "Add New Product" : "ပစ္စည်းအသစ်ထည့်မည်")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200/50 rounded-full transition-colors text-slate-500 hover:text-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-5 gap-y-4 mb-6">
          {/* Product Name */}
          <div className="col-span-2">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {getLabel("productName")} <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
              value={formData.productName}
              placeholder={getLabel("productNamePlaceholder")}
              onChange={(e) => {
                const productName = e.target.value;
                updateFormData({ productName, productCode: productName });
              }}
            />
          </div>

          {/* Car Code Number */}
          <div className="col-span-1">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {getLabel("carCode")}
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
              value={formData.barcode || ""}
              onChange={(e) => updateFormData({ barcode: e.target.value })}
              placeholder={getLabel("carCodePlaceholder")}
            />
          </div>

          {/* Product Code Number */}
          <div className="col-span-1">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {getLabel("productCode")} <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
              value={formData.productCode}
              onChange={(e) => updateFormData({ productCode: e.target.value })}
              placeholder={getLabel("productCodePlaceholder")}
            />
          </div>

          {/* Category */}
          <div className="col-span-1">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {getLabel("category")} <span className="text-red-500">*</span>
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
                  updateFormData({ category: value });
                  setCategoryShowDropdown(true);
                }}
                onFocus={() => setCategoryShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setCategoryShowDropdown(false), 200);
                }}
                placeholder={getLabel("categoryPlaceholder")}
              />
              <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {categoryShowDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {getFilteredCategories(
                    categoryInput || formData.category,
                  ).map((category) => (
                    <div
                      key={category}
                      className="px-4 py-2.5 hover:bg-indigo-50 hover:text-[#2216a8] text-slate-700 cursor-pointer text-sm font-medium transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        updateFormData({ category });
                        setCategoryInput("");
                        setCategoryShowDropdown(false);
                      }}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Brand */}
          <div className="col-span-1">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {getLabel("brand")}
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
              value={formData.brand}
              onChange={(e) => updateFormData({ brand: e.target.value })}
              placeholder={getLabel("brandPlaceholder")}
            />
          </div>

          {/* Unit of Measure */}
          <div className="col-span-1">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {getLabel("unitOfMeasure")}
            </label>
            <input
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
              value={formData.unitOfMeasure || ""}
              onChange={(e) => updateFormData({ unitOfMeasure: e.target.value })}
              placeholder={getLabel("unitOfMeasurePlaceholder")}
            />
          </div>

          {/* Buying Price */}
          <div className="col-span-1">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {getLabel("buyingPrice")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
              value={formData.buyingPrice || ""}
              onChange={(e) =>
                updateFormData({ buyingPrice: Number(e.target.value) })
              }
              placeholder={getLabel("buyingPricePlaceholder")}
            />
          </div>

          {/* Selling Price */}
          <div className="col-span-1">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {getLabel("sellingPrice")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white"
              value={formData.sellingPrice || ""}
              onChange={(e) =>
                updateFormData({ sellingPrice: Number(e.target.value) })
              }
              placeholder={getLabel("sellingPricePlaceholder")}
            />
          </div>

          {/* Suppliers Selection */}
          <div className="col-span-2 bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#2216a8]" />
                <span>
                  {language === "en"
                    ? "Suppliers (Goods Providers)"
                    : "ကုန်ပစ္စည်းတင်သွင်းသူများ (Suppliers)"}
                </span>
              </label>
              <span className="text-xs text-slate-400 font-medium">
                {language === "en" ? "Optional (Multiple)" : "တစ်ခုထက်မက ရွေးချယ်နိုင်သည်"}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Dropdown to add a supplier */}
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white cursor-pointer"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && !selectedSupplierIds.includes(val)) {
                    updateFormData({ supplierIds: [...selectedSupplierIds, val] });
                  }
                }}
              >
                <option value="">
                  {language === "en"
                    ? "-- Select a supplier to link --"
                    : "-- Supplier ရွေးချယ်ချိတ်ဆက်ရန် --"}
                </option>
                {availableSuppliers
                  .filter((s) => !selectedSupplierIds.includes(s._id || s.id))
                  .map((s) => (
                    <option key={s._id || s.id} value={s._id || s.id}>
                      {s.supplierName} {s.contactNumber ? `(${s.contactNumber})` : ""}
                    </option>
                  ))}
              </select>

              {/* Selected Suppliers Badges */}
              {selectedSupplierIds.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedSupplierIds.map((id) => {
                    const sup = availableSuppliers.find(
                      (s) => (s._id || s.id) === id
                    );
                    const name = sup ? sup.supplierName : id;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#f0effb] text-[#2216a8] border border-indigo-100 shadow-2xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateFormData({
                              supplierIds: selectedSupplierIds.filter(
                                (sid) => sid !== id
                              ),
                            })
                          }
                          className="hover:text-red-500 cursor-pointer p-0.5 rounded-full hover:bg-white/80 transition-colors"
                          title="Remove supplier"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">
                  {language === "en"
                    ? "No suppliers linked yet."
                    : "Supplier ချိတ်ဆက်ထားခြင်း မရှိသေးပါ (မဖြစ်မနေ မဟုတ်ပါ)"}
                </p>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="col-span-2">
            <label className="block text-sm font-bold text-slate-800 mb-1.5">
              {getLabel("note")}
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all bg-white resize-none"
              rows={2}
              value={formData.note || ""}
              onChange={(e) => updateFormData({ note: e.target.value })}
              placeholder={getLabel("notePlaceholder")}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-[#2216a8] text-[#2216a8] hover:bg-indigo-50/50 rounded-full text-sm font-bold transition-all cursor-pointer"
          >
            {getLabel("cancel")}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isLoading}
            className="px-6 py-2.5 bg-[#2216a8] text-white rounded-full text-sm font-bold flex items-center gap-2 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-indigo-600/10"
          >
            {!isLoading && <Plus className="w-4 h-4" />}
            {isLoading
              ? (language === "en" ? "Saving..." : "သိမ်းဆည်းနေသည်...")
              : getLabel("save")}
          </button>
        </div>
      </div>
    </div>
  );
};
