import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Loader2,
  PieChart as PieIcon,
  DollarSign,
  TrendingUp,
  Receipt,
  Search,
  Building2,
  Calendar,
} from "lucide-react";
import { Expense } from "../../services/Expense/fetchExpenses";
import { useLanguage } from "../../context/LanguageContext";

const CATEGORY_PALETTE = [
  "#6366f1", // Indigo
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#f97316", // Orange
  "#06b6d4", // Cyan
  "#84cc16", // Lime
];

interface ExpenseReportTabProps {
  expenses: Expense[];
  loading: boolean;
}

export const ExpenseReportTab: React.FC<ExpenseReportTabProps> = ({
  expenses,
  loading,
}) => {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");

  if (loading) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2216a8] mx-auto mb-4" />
        <p className="text-slate-600">
          {t("reports.loadingExpenses") || "Loading expenses data..."}
        </p>
      </div>
    );
  }

  // Calculate totals
  const totalExpenseAmount = expenses.reduce(
    (sum, item) => sum + (item.amount || 0),
    0,
  );
  const totalEntries = expenses.length;
  const avgExpense = totalEntries > 0 ? totalExpenseAmount / totalEntries : 0;

  // Category breakdown aggregation
  const categoryMap = new Map<
    string,
    { category: string; totalAmount: number; count: number }
  >();

  expenses.forEach((item) => {
    const cat = item.category || "other";
    const existing = categoryMap.get(cat) || {
      category: cat,
      totalAmount: 0,
      count: 0,
    };
    existing.totalAmount += item.amount || 0;
    existing.count += 1;
    categoryMap.set(cat, existing);
  });

  const categoryBreakdown = Array.from(categoryMap.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount,
  );

  const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

  // Recharts Pie/Bar chart data
  const chartData = categoryBreakdown.map((item, index) => {
    const categoryLabel =
      t(`expenses.${item.category}`) !== `expenses.${item.category}`
        ? t(`expenses.${item.category}`)
        : item.category.charAt(0).toUpperCase() + item.category.slice(1);

    const percentage =
      totalExpenseAmount > 0
        ? ((item.totalAmount / totalExpenseAmount) * 100).toFixed(1)
        : "0";

    return {
      name: categoryLabel,
      value: item.totalAmount,
      count: item.count,
      percentage: `${percentage}%`,
      color: CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
    };
  });

  // Filtered list for search
  const filteredExpenses = expenses.filter((exp) => {
    const q = search.toLowerCase();
    const cat = exp.category.toLowerCase();
    const notes = (exp.notes || "").toLowerCase();
    const locName = (
      exp.locationId?.locationName ||
      (exp.locationId as any)?.storefrontName ||
      ""
    ).toLowerCase();
    const adminName = (exp.adminId?.name || "").toLowerCase();

    return (
      cat.includes(q) ||
      notes.includes(q) ||
      locName.includes(q) ||
      adminName.includes(q)
    );
  });

  const getCategoryDisplayName = (catName: string) => {
    const key = `expenses.${catName}`;
    const translated = t(key);
    return translated !== key
      ? translated
      : catName.charAt(0).toUpperCase() + catName.slice(1);
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center">
        <PieIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">
          {t("expenses.noExpenses") || "No expenses found for this period"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expense */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl">
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t("expenses.totalExpenses") || "Total Expenses"}
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {totalExpenseAmount.toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>

        {/* Total Entries */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl">
            <Receipt className="w-5 h-5 text-[#2216a8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t("reports.expenseEntries") || "Total Entries"}
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {totalEntries.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Top Expense Category */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t("reports.topCategory") || "Top Category"}
            </p>
            <p className="text-lg font-black text-slate-800 mt-1 capitalize">
              {topCategory ? getCategoryDisplayName(topCategory.category) : "-"}
            </p>
          </div>
        </div>

        {/* Average Expense per Entry */}
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl">
            <PieIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {t("reports.averageExpense") || "Avg / Entry"}
            </p>
            <p className="text-lg font-black text-slate-800 mt-1">
              {Math.round(avgExpense).toLocaleString()}{" "}
              <span className="text-xs font-semibold text-slate-400">MMK</span>
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section: Pie Distribution + Bar Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Card */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[#2216a8]" />
            <span>
              {t("reports.categoryDistribution") || "Category Distribution"}
            </span>
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString()} MMK`,
                    "Amount",
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs font-medium text-slate-600">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2216a8]" />
            <span>
              {t("reports.categoryBreakdown") || "Category Comparison"}
            </span>
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) =>
                    val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}k`
                      : val
                  }
                />
                <Tooltip
                  formatter={(value: any) => [
                    `${Number(value).toLocaleString()} MMK`,
                    "Total",
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">
            {t("reports.categoryBreakdown") || "Category Breakdown Summary"}
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {categoryBreakdown.length} {t("inventory.categories") || "Categories"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Category
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  Entries
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Amount (MMK)
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-400 min-w-[160px]">
                  Share (%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {categoryBreakdown.map((cat, idx) => {
                const percentage =
                  totalExpenseAmount > 0
                    ? (cat.totalAmount / totalExpenseAmount) * 100
                    : 0;
                const color = CATEGORY_PALETTE[idx % CATEGORY_PALETTE.length];

                return (
                  <tr
                    key={cat.category}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2.5">
                      <span
                        className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="capitalize">
                        {getCategoryDisplayName(cat.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-600 text-xs">
                      {cat.count}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-800 text-sm">
                      {cat.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 min-w-[42px] text-right">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Expense Log Table with Search */}
      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-base font-bold text-slate-800">
            {t("expenses.title") || "Expense Log"}
          </h3>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("credits.searchPlaceholder") || "Search expenses..."}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="sticky top-0 bg-slate-50 text-slate-500 shadow-sm z-10">
              <tr>
                <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  No
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Date
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Category
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Location
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Notes
                </th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recorded By
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-400 font-medium text-xs"
                  >
                    No matching expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => (
                  <tr
                    key={exp._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-center font-bold text-slate-400 text-xs">
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-medium whitespace-nowrap">
                      {new Date(exp.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-bold capitalize">
                        {getCategoryDisplayName(exp.category)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                      {exp.locationId?.locationName ||
                        (exp.locationId as any)?.storefrontName ||
                        "-"}
                    </td>
                    <td
                      className="px-5 py-3.5 text-slate-500 text-xs font-medium max-w-xs truncate"
                      title={exp.notes || ""}
                    >
                      {exp.notes || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                      {exp.adminId?.name || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-red-600 text-xs sm:text-sm whitespace-nowrap">
                      {exp.amount.toLocaleString()}{" "}
                      <span className="text-[10px] text-slate-400 font-medium">
                        MMK
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
