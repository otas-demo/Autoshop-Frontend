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
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isCollapsed, setIsCollapsed }) => {
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [adminData, setAdminData] = useState<any>(null);

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

  const menuItems = [
    { path: "/pos", label: t("sidebar.checkout"), icon: ShoppingCart },
    { path: "/inventory", label: t("sidebar.inventory"), icon: Package },
    { path: "/storefront", label: t("sidebar.storefront"), icon: Store },
    { path: "/orders", label: t("sidebar.orders"), icon: Receipt },
    { path: "/credit-orders", label: t("sidebar.creditOrder"), icon: CreditCard },
    { path: "/credits", label: t("sidebar.creditSales"), icon: Users },
    { path: "/expenses", label: t("sidebar.expenses"), icon: PieChart },
    { path: "/reports", label: t("sidebar.reports"), icon: LayoutDashboard },
    { path: "/accounts", label: t("sidebar.accountManagement"), icon: Shield },
    { path: "/daily-reports", label: t("sidebar.dailyReports"), icon: Bell },
    { path: "/purchasing", label: t("sidebar.purchasing"), icon: Truck },
    { path: "/suppliers", label: t("sidebar.suppliers"), icon: Shield },
    { path: "/warehouse", label: t("sidebar.warehouse"), icon: Package },
    { path: "/ai-chat", label: t("sidebar.aiChat"), icon: Bot },
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

  const visibleItems = menuItems.filter((item) => hasPermission(item.path));

  const toggleCollapse = () => {
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    localStorage.setItem("sidebarCollapsed", String(nextCollapsed));
  };

  return (
    <>
      {/* Backdrop Overlay for Mobile Only */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Sidebar Wrapper */}
      <div
        className={`fixed lg:left-0 lg:right-auto max-lg:right-0 max-lg:left-auto top-0 h-screen z-50 py-4 lg:pl-4 max-lg:pr-4 print:hidden flex flex-col transition-all duration-500 ease-in-out ${isOpen
          ? "translate-x-0"
          : "max-lg:translate-x-full"
          } ${isCollapsed ? "w-20 lg:w-20" : "w-72 lg:w-72"
          }`}
      >
        <div className={`flex-1 bg-white border border-gray-200/70 rounded-3xl shadow-lg flex flex-col overflow-hidden relative justify-between transition-all duration-500 ${isCollapsed ? "px-2 py-4" : "p-4"
          }`}>

          <div>
            {/* Header / Brand Logo */}
            <div
              onClick={toggleCollapse}
              className="py-3 flex flex-col items-center justify-center border-b border-gray-100 cursor-pointer select-none"
            >
              <div className="text-[#2216a8] text-center">
                <div className="flex flex-col items-center justify-center font-black leading-none transition-all duration-500 ease-in-out py-1">
                  <span className={`tracking-widest font-black transition-all duration-500 ease-in-out ${isCollapsed ? "text-[10px]" : "text-xl"
                    }`}>
                    AUTO
                  </span>
                  <span className={`tracking-widest font-black transition-all duration-500 ease-in-out ${isCollapsed ? "text-[10px] mt-0" : "text-xl mt-0.5"
                    }`}>
                    SHOP
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation List */}
            <nav className="mt-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-17rem)] pr-0.5 no-scrollbar">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center transition-all duration-200 group ${isActive
                      ? "bg-[#2216a8] text-white shadow-md shadow-indigo-600/10"
                      : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                      } ${isCollapsed ? "w-12 h-12 rounded-2xl mx-auto justify-center" : "w-full px-4 py-2.5 rounded-xl"}`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                      } ${isCollapsed ? "" : "mr-3"}`} />

                    {!isCollapsed && (
                      <span className="text-sm font-medium tracking-wide">
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions Area */}
          <div className="space-y-4">
            {/* Collapse Sidebar Button */}
            <button
              onClick={toggleCollapse}
              className={`flex items-center justify-center transition-all duration-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-[#2216a8] font-semibold cursor-pointer ${isCollapsed ? "w-12 h-12 rounded-2xl mx-auto" : "w-full px-4 py-2.5 gap-2 rounded-xl text-sm"
                }`}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              <LogOut className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
              {!isCollapsed && <span>{t("sidebar.collapse")}</span>}
            </button>
          </div>
        </div>

        {/* User Profile Card at Bottom */}
        <div
          className={`bg-white border border-gray-200/70 rounded-2xl p-2.5 shadow-md flex items-center mt-3 transition-all duration-300 ${isCollapsed ? "justify-center" : "justify-between gap-3 px-3"
            }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Circle Logo / Avatar */}
            <div className="bg-[#2216a8] rounded-full w-9 h-9 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold uppercase select-none">
              {(adminData?.name || currentUser?.name || "U").substring(0, 1).toUpperCase()}
            </div>

            {/* Text (Hidden when collapsed) */}
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-slate-800 font-bold text-sm leading-tight truncate">
                  {adminData?.name || currentUser?.name || "User"}
                </span>
                <span className="text-gray-400 font-semibold text-xs leading-none mt-0.5 capitalize">
                  {userRole || "User"}
                </span>
              </div>
            )}
          </div>

          {/* Settings Button (Hidden when collapsed) */}
          {!isCollapsed && (
            <button
              onClick={() => {
                navigate("/settings");
                onClose();
              }}
              className="p-1.5 hover:bg-slate-50 text-gray-400 hover:text-[#2216a8] rounded-lg transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
