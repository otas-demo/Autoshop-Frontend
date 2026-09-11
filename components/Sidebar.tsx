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
  Languages,
  BarChart3,
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
  const { t, language, setLanguage } = useLanguage();
  const [adminData, setAdminData] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);

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
      icon: ShoppingBag,
      items: [
        { path: "/pos", label: t("sidebar.checkout"), icon: ShoppingCart },
        { path: "/storefront", label: t("sidebar.storefront"), icon: Store },
        { path: "/orders", label: t("sidebar.orders"), icon: Receipt },
      ],
    },
    {
      id: "credits",
      label: t("sidebar.creditsGroup"),
      icon: Users,
      items: [
        { path: "/credit-orders", label: t("sidebar.creditOrder"), icon: CreditCard },
        { path: "/credits", label: t("sidebar.creditSales"), icon: Users },
      ],
    },
    {
      id: "inventory",
      label: t("sidebar.inventoryGroup"),
      icon: Package,
      items: [
        { path: "/inventory", label: t("sidebar.inventory"), icon: Package },
        { path: "/warehouse", label: t("sidebar.warehouse"), icon: Package },
        { path: "/suppliers", label: t("sidebar.suppliers"), icon: Shield },
        { path: "/purchasing", label: t("sidebar.purchasing"), icon: Truck },
      ],
    },
    {
      id: "finance",
      label: t("sidebar.financeGroup"),
      icon: PieChart,
      items: [
        { path: "/expenses", label: t("sidebar.expenses"), icon: PieChart },
        { path: "/reports", label: t("sidebar.reports"), icon: LayoutDashboard },
        { path: "/purchasing-report", label: t("sidebar.purchasingReport"), icon: BarChart3 },
        // { path: "/daily-reports", label: t("sidebar.dailyReports"), icon: Bell },
      ],
    },
    {
      id: "system",
      label: t("sidebar.systemGroup"),
      icon: Settings,
      items: [
        { path: "/accounts", label: t("sidebar.accountManagement"), icon: Shield },
        // { path: "/ai-chat", label: t("sidebar.aiChat"), icon: Bot },
      ],
    },
  ];

  const userRole = adminData?.role || currentUser?.role;

  const hasPermission = (path: string) => {
    // Warehouse role can only access warehouse and expenses
    if (userRole === "warehouse") {
      return path === "/warehouse" || path === "/expenses";
    }

    if (path === "/accounts" && userRole !== "owner") return false;
    if (
      ["/purchasing", "/warehouse", "/suppliers", "/purchasing-report"].includes(path) &&
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

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [activePopover, setActivePopover] = useState<string | null>(null);

  const isItemActive = (itemPath: string, currentPath: string) => {
    return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
  };

  // Auto-expand group containing the active item on path change or mount
  useEffect(() => {
    visibleGroups.forEach((group) => {
      const containsActive = group.items.some((item) => isItemActive(item.path, location.pathname));
      if (containsActive) {
        setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [location.pathname, adminData, currentUser]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

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
            <nav className="mt-4 space-y-2 overflow-y-auto max-h-[calc(100vh-17rem)] pr-0.5 no-scrollbar">
              {visibleGroups.map((group) => {
                const GroupIcon = group.icon;
                const isExpanded = !!expandedGroups[group.id];
                const hasActiveItem = group.items.some((item) => isItemActive(item.path, location.pathname));

                if (isCollapsed) {
                  return (
                    <div
                      key={group.id}
                      className="relative flex justify-center py-1"
                      onMouseEnter={() => setActivePopover(group.id)}
                      onMouseLeave={() => setActivePopover(null)}
                    >
                      <button
                        onClick={() => {
                          if (group.items.length > 0) {
                            navigate(group.items[0].path);
                            onClose();
                            setActivePopover(null);
                          }
                        }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 group ${hasActiveItem
                          ? "bg-[#2216a8] text-white shadow-md shadow-indigo-600/10"
                          : "text-gray-400 hover:bg-gray-50 hover:text-[#2216a8]"
                          }`}
                      >
                        <GroupIcon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${hasActiveItem ? "text-white" : "text-gray-400 group-hover:text-[#2216a8]"
                          }`} />
                      </button>

                      {/* Floating Submenu */}
                      {activePopover === group.id && (
                        <div
                          className="absolute left-16 top-0 w-56 bg-white border border-gray-200/70 rounded-2xl shadow-xl p-2.5 z-50 animate-in fade-in slide-in-from-left-2 duration-150"
                        >
                          <div className="text-xs font-bold text-[#2216a8] px-3 py-1.5 border-b border-gray-50 mb-1">
                            {group.label}
                          </div>
                          <div className="flex flex-col gap-1">
                            {group.items.map((item) => {
                              const ItemIcon = item.icon;
                              const isActive = isItemActive(item.path, location.pathname);
                              return (
                                <NavLink
                                  key={item.path}
                                  to={item.path}
                                  onClick={onClose}
                                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-medium text-left cursor-pointer ${isActive
                                    ? "bg-[#2216a8]/10 text-[#2216a8]"
                                    : "text-gray-500 hover:text-[#2216a8] hover:bg-slate-50"
                                    }`}
                                >
                                  <ItemIcon className={`w-4 h-4 ${isActive ? "text-[#2216a8]" : "text-gray-400"}`} />
                                  <span className="text-xs font-semibold">{item.label}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Expanded Sidebar Mode
                return (
                  <div key={group.id} className="space-y-1">
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all duration-200 group font-medium text-sm ${hasActiveItem
                        ? "bg-indigo-50/50 text-[#2216a8]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        }`}
                    >
                      <div className="flex items-center">
                        <GroupIcon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 mr-3 ${hasActiveItem ? "text-[#2216a8]" : "text-gray-400 group-hover:text-gray-600"
                          }`} />
                        <span className="font-semibold tracking-wide text-left text-sm">{group.label}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-0" : "-rotate-90"
                          }`}
                      />
                    </button>

                    {/* Group Sub-Items */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? "max-h-[500px] opacity-100 py-1" : "max-h-0 opacity-0"
                        }`}
                    >
                      <div className="pl-4 space-y-1 border-l border-gray-100 ml-5">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = isItemActive(item.path, location.pathname);

                          return (
                            <NavLink
                              key={item.path}
                              to={item.path}
                              onClick={onClose}
                              className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 group ${isActive
                                ? "bg-[#2216a8] text-white shadow-sm"
                                : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                                }`}
                            >
                              <ItemIcon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 mr-3 ${isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                                }`} />
                              <span className="text-xs font-semibold tracking-wide">
                                {item.label}
                              </span>
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  </div>
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
        <div className="relative mt-3">
          {/* Popover Menu Backdrop overlay to dismiss */}
          {showMenu && (
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setShowMenu(false)}
            />
          )}

          {/* Popover Menu */}
          {showMenu && (
            <div
              className={`absolute bottom-full mb-2 bg-white border border-gray-200/70 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 ${isCollapsed
                ? "lg:left-0 lg:right-auto right-0 w-52"
                : "left-0 right-0"
                }`}
            >
              <div className="flex flex-col gap-1">
                {/* Language Switcher */}
                <button
                  onClick={() => {
                    setLanguage(language === "en" ? "my" : "en");
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-500 hover:text-[#2216a8] hover:bg-slate-50 rounded-xl transition-all font-medium text-left cursor-pointer"
                >
                  <Languages className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {language === "en" ? "မြန်မာ ဘာသာ" : "English"}
                  </span>
                </button>

                {/* Settings */}
                <button
                  onClick={() => {
                    navigate("/settings");
                    setShowMenu(false);
                    onClose();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-500 hover:text-[#2216a8] hover:bg-slate-50 rounded-xl transition-all font-medium text-left cursor-pointer"
                >
                  <Settings className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {language === "en" ? "Settings" : "ဆက်တင်များ"}
                  </span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all font-medium text-left cursor-pointer"
                >
                  <LogOut className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {language === "en" ? "Log out" : "အကောင့်ထွက်မယ်"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* User Profile Card Button */}
          <div
            onClick={() => setShowMenu(!showMenu)}
            className={`bg-white border border-gray-200/70 rounded-2xl p-2.5 shadow-md flex items-center cursor-pointer hover:bg-slate-50 transition-all duration-300 select-none ${isCollapsed ? "justify-center" : "justify-start gap-3 px-3"
              }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Circle Logo / Avatar */}
              <div className="bg-[#2216a8] rounded-full w-9 h-9 flex-shrink-0 flex flex-col items-center justify-center text-white select-none leading-none">
                {((adminData?.name || currentUser?.name || "Auto Shop Demo").toLowerCase().includes("auto shop")) ? (
                  <div className="flex flex-col items-center justify-center text-[7px] font-black tracking-wider">
                    <span>AUTO</span>
                    <span className="mt-0.5">SHOP</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold uppercase">
                    {(adminData?.name || currentUser?.name || "U").substring(0, 1).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Text (Hidden when collapsed) */}
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[#2216a8] font-bold text-sm leading-tight truncate">
                    {adminData?.name || currentUser?.name || "Auto Shop Demo"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
