import React from "react";
import { Product } from "../../types";
import { useLanguage } from "../../context/LanguageContext";

interface CategoryFilterProps {
  products: Product[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  products,
  selectedCategory,
  onCategoryChange,
  filteredCount,
  totalCount,
}) => {
  const { t } = useLanguage();

  const getUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });
    return Array.from(categories).sort();
  };

  if (products.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 justify-between xs:items-center md:flex-row md:items-center md:justify-between md:mb-2">
      <label className="lg:text-sm text-slate-700">
        {t("inventory.filterByCategory")}:
      </label>
      <select
        className="border rounded-lg px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-primary outline-none h-fit"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="All">{t("inventory.allCategories")}</option>
        {getUniqueCategories().map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <span className="lg:text-sm text-slate-500 md:text-sm">
        {t("inventory.showing")
          .replace("{count}", filteredCount.toString())
          .replace("{total}", totalCount.toString())}
      </span>
    </div>
  );
};

