import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Store,
  CreditCard,
  PieChart,
  Settings,
  X,
  Receipt,
  Shield,
  LogOut,
  Bot,
  Bell,
  Users,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { removeAuthToken } from "../services/axios";
import { toast } from "sonner";
import { useLanguage } from "../context/LanguageContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [adminData, setAdminData] = useState<any>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Get admin data from localStorage
    const storedAdmin = localStorage.getItem("adminData");
    if (storedAdmin) {
      try {
        setAdminData(JSON.parse(storedAdmin));
      } catch (error) {
        console.error("Error parsing admin data:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    localStorage.removeItem("adminData");
    toast.success(t("sidebar.loggedOut"));
    navigate("/login");
    onClose();
  };

  const menuGroups = [
    {
      id: "sales",
      label: t("sidebar.salesGroup"),
      items: [
        { path: "/pos", label: t("sidebar.checkout"), icon: ShoppingCart },
        { path: "/storefront", label: t("sidebar.storefront"), icon: Store },
        { path: "/orders", label: t("sidebar.orders"), icon: Receipt },
      ],
    },
    {
      id: "credits",
      label: t("sidebar.creditsGroup"),
      items: [
        { path: "/credit-orders", label: t("sidebar.creditOrder"), icon: CreditCard },
        { path: "/credits", label: t("sidebar.creditSales"), icon: CreditCard },
      ],
    },
    {
      id: "inventory",
      label: t("sidebar.inventoryGroup"),
      items: [
        { path: "/inventory", label: t("sidebar.inventory"), icon: Package },
        { path: "/warehouse", label: t("sidebar.warehouse"), icon: Truck },
        { path: "/suppliers", label: t("sidebar.suppliers"), icon: Users },
        { path: "/purchasing", label: t("sidebar.purchasing"), icon: ShoppingBag },
      ],
    },
    {
      id: "finance",
      label: t("sidebar.financeGroup"),
      items: [
        { path: "/expenses", label: t("sidebar.expenses"), icon: PieChart },
        { path: "/reports", label: t("sidebar.reports"), icon: LayoutDashboard },
        { path: "/daily-reports", label: "Daily Reports", icon: Bell },
      ],
    },
    {
      id: "system",
      label: t("sidebar.systemGroup"),
      items: [
        { path: "/accounts", label: t("sidebar.accountManagement"), icon: Shield },
        { path: "/ai-chat", label: "AI Chat", icon: Bot },
      ],
    },
  ];

  const userRole = adminData?.role || currentUser?.role;

  const hasPermission = (path: string) => {
    if (path === "/accounts" && userRole !== "owner") return false;
    if (
      ["/purchasing", "/inventory", "/warehouse", "/suppliers"].includes(path) &&
      userRole !== "admin" &&
      userRole !== "owner"
    ) {
      return false;
    }
    return true;
  };

  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.path)),
    }))
    .filter((group) => group.items.length > 0);

  // Auto-expand group containing current path
  useEffect(() => {
    const activeGroup = visibleGroups.find((group) =>
      group.items.some((item) => item.path === location.pathname)
    );
    if (activeGroup) {
      setExpandedGroups((prev) => ({ ...prev, [activeGroup.id]: true }));
    }
  }, [location.pathname, adminData, currentUser]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`sidebar w-72 bg-primary text-white flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl print:hidden transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/autologo.jpg"
              alt="AutoShop Logo"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                AutoShop
              </h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {visibleGroups.map((group) => {
            const isExpanded = !!expandedGroups[group.id];
            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header Button */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/50 hover:text-white/90 hover:bg-white/5 rounded-lg transition-all duration-200"
                >
                  <span>{group.label}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Submenu Items Container */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ml-3 pl-3 border-l border-white/10 space-y-1 ${
                    isExpanded ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0 pointer-events-none"
                  }`}
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                            isActive
                              ? "bg-white text-primary shadow-md shadow-black/10"
                              : "text-white/70 hover:bg-white/10 hover:text-white"
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 mr-2.5 transition-transform duration-200 group-hover:scale-110" />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary font-bold text-sm">
              {(adminData?.name || currentUser.name).charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {adminData?.name || currentUser.name}
              </p>
              <p className="text-xs text-white/60">
                {adminData?.role || currentUser.role}
              </p>
            </div>
          </div>
          <NavLink
            to="/settings"
            id="profile-tab"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors mb-2 ${
                isActive
                  ? "bg-white text-primary"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`
            }
          >
            <Settings className="w-4 h-4" /> {t("sidebar.settings")}
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-colors text-white/80 hover:text-white hover:bg-red-500/20"
          >
            <LogOut className="w-4 h-4" /> {t("sidebar.logout")}
          </button>
        </div>
      </div>
    </>
  );
};
