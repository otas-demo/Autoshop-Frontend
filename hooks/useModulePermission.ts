import { useState, useEffect } from "react";

export type AppModule =
  | "sales"
  | "inventory"
  | "warehouse"
  | "purchasing"
  | "credits"
  | "expenses"
  | "reports"
  | "accounts";

export interface ModuleDef {
  id: AppModule;
  labelEn: string;
  labelMy: string;
  descriptionEn: string;
  descriptionMy: string;
  color: string;
}

export const AVAILABLE_MODULES: ModuleDef[] = [
  {
    id: "sales",
    labelEn: "Sales / POS",
    labelMy: "အရောင်း & POS",
    descriptionEn: "Point of Sale, Orders, Storefront sales",
    descriptionMy: "POS အရောင်းကောင်တာ၊ Order စာရင်းများ",
    color: "blue",
  },
  {
    id: "inventory",
    labelEn: "Inventory",
    labelMy: "ကုန်ပစ္စည်းစာရင်း",
    descriptionEn: "Products, Categories, Stock management",
    descriptionMy: "ပစ္စည်းစာရင်း၊ အမျိုးအစား၊ စတော့ခ်စီမံခန့်ခွဲမှု",
    color: "emerald",
  },
  {
    id: "warehouse",
    labelEn: "Warehouse",
    labelMy: "ဂိုဒေါင် & သိုလှောင်ရုံ",
    descriptionEn: "Warehouse stock, Transfers, Stock logs",
    descriptionMy: "ဂိုဒေါင်စာရင်း၊ ပစ္စည်းလွှဲပြောင်းမှု",
    color: "amber",
  },
  {
    id: "purchasing",
    labelEn: "Purchasing",
    labelMy: "ဝယ်ယူမှု & ကုန်ပေးသွင်းသူ",
    descriptionEn: "Purchase orders, Suppliers, Payments, GRN",
    descriptionMy: "ပစ္စည်းဝယ်ယူမှု၊ ကုန်ပေးသွင်းသူများ၊ GRN",
    color: "purple",
  },
  {
    id: "credits",
    labelEn: "Credits",
    labelMy: "အကြွေးစာရင်း",
    descriptionEn: "Credit customers, Credit records & payments",
    descriptionMy: "အကြွေးဝယ်ဖောက်သည်များ၊ အကြွေးဆပ်မှတ်တမ်း",
    color: "rose",
  },
  {
    id: "expenses",
    labelEn: "Expenses",
    labelMy: "အသုံးစရိတ်",
    descriptionEn: "Daily expenses, Categories",
    descriptionMy: "နေ့စဉ်အသုံးစရိတ် စာရင်းများ",
    color: "orange",
  },
  {
    id: "reports",
    labelEn: "Reports",
    labelMy: "အစီရင်ခံစာများ",
    descriptionEn: "Sales & PO reports, Analytics, AI insights",
    descriptionMy: "အရောင်းအစီရင်ခံစာများ၊ စာရင်းအင်း၊ AI Analysis",
    color: "indigo",
  },
  {
    id: "accounts",
    labelEn: "Account Management",
    labelMy: "အကောင့်စီမံခန့်ခွဲမှု",
    descriptionEn: "Manage accounts & permissions",
    descriptionMy: "အသုံးပြုသူအကောင့်များ ဖွင့်ခြင်းနှင့် Permission စီမံခြင်း",
    color: "cyan",
  },
];

export const DEFAULT_ROLE_MODULES: Record<string, AppModule[]> = {
  owner: [
    "sales",
    "inventory",
    "warehouse",
    "purchasing",
    "credits",
    "expenses",
    "reports",
    "accounts",
  ],
  admin: [
    "sales",
    "inventory",
    "warehouse",
    "purchasing",
    "credits",
    "expenses",
    "reports",
    "accounts",
  ],
  cashier: ["sales", "credits", "expenses"],
  warehouse: ["warehouse", "inventory", "purchasing"],
};

export const getUserModules = (
  user: { role?: string; modules?: string[] } | null | undefined
): AppModule[] => {
  if (!user) return [];
  if (user.role?.toLowerCase() === "owner") {
    return DEFAULT_ROLE_MODULES.owner;
  }
  if (Array.isArray(user.modules) && user.modules.length > 0) {
    return user.modules as AppModule[];
  }
  return DEFAULT_ROLE_MODULES[user.role?.toLowerCase() || ""] || [];
};

export const hasModuleAccess = (
  user: { role?: string; modules?: string[] } | null | undefined,
  module: AppModule | AppModule[]
): boolean => {
  if (!user) return false;
  if (user.role?.toLowerCase() === "owner") return true;

  const userMods = getUserModules(user);
  if (Array.isArray(module)) {
    return module.some((m) => userMods.includes(m));
  }
  return userMods.includes(module);
};

export const useModulePermission = () => {
  const [user, setUser] = useState<{ role?: string; modules?: string[] } | null>(() => {
    try {
      const stored = localStorage.getItem("adminData");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem("adminData");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isOwner = user?.role?.toLowerCase() === "owner";
  const modules = getUserModules(user);

  const checkAccess = (module: AppModule | AppModule[]) => {
    return hasModuleAccess(user, module);
  };

  return {
    user,
    modules,
    isOwner,
    hasAccess: checkAccess,
  };
};
