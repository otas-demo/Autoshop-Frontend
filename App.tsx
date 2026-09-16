import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import { AppProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Sidebar } from "./components/Sidebar";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { POS } from "./pages/POS";
import { OrderEditPOS } from "./pages/OrderEditPOS";
import { Warehouse } from "./pages/Warehouse";
import { WarehouseDetail } from "./pages/WarehouseDetail";
import { Storefront } from "./pages/Storefront";
import { StorefrontDetail } from "./pages/StorefrontDetail";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Inventory } from "./pages/Inventory";
import { Purchasing } from "./pages/Purchasing";
import { POReport } from "./pages/POReport";
import { Credits } from "./pages/Credits";
import { CreditDetail } from "./pages/CreditDetail";
import { Expenses } from "./pages/Expenses";
import { Suppliers } from "./pages/Suppliers";
import { SupplierDetail } from "./pages/SupplierDetail";
import { Orders } from "./pages/Orders";
import { CreditOrders } from "./pages/CreditOrders";
import { AccountManagement } from "./pages/AccountManagement";
import { Login } from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PrintReceipt from "./pages/PrintReceipt";
import { AIChat } from "./components/AIChat";
import { DailyReports } from "./pages/DailyReports";
import MobilePrint from "./pages/MobilePrint";
import { AIFloatingIcon } from "./components/AIFloatingIcon";
import { hasModuleAccess, AppModule } from "./hooks/useModulePermission";

const getDefaultAccessibleRoute = (user: any): string => {
  if (!user) return "/login";
  if (hasModuleAccess(user, "sales")) return "/pos";
  if (hasModuleAccess(user, "inventory")) return "/inventory";
  if (hasModuleAccess(user, "warehouse")) return "/warehouse";
  if (hasModuleAccess(user, "purchasing")) return "/purchasing";
  if (hasModuleAccess(user, "credits")) return "/credits";
  if (hasModuleAccess(user, "expenses")) return "/expenses";
  if (hasModuleAccess(user, "reports")) return "/reports";
  if (hasModuleAccess(user, "accounts")) return "/accounts";
  return "/login";
};

const RequireModule: React.FC<{
  module: AppModule | AppModule[];
  children: React.ReactNode;
}> = ({ module, children }) => {
  let user = null;
  try {
    const storedAdmin = localStorage.getItem("adminData");
    user = storedAdmin ? JSON.parse(storedAdmin) : null;
  } catch (e) {}

  if (!hasModuleAccess(user, module)) {
    return <Navigate to={getDefaultAccessibleRoute(user)} replace />;
  }
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  let user = null;
  try {
    const storedAdmin = localStorage.getItem("adminData");
    user = storedAdmin ? JSON.parse(storedAdmin) : null;
  } catch (e) {}
  return <Navigate to={getDefaultAccessibleRoute(user)} replace />;
};

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const token = localStorage.getItem("authToken");

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f3]">
      {/* Floating AI hanging badge */}
      {token && <div className="no-print"><AIFloatingIcon /></div>}
      {/* Floating Hamburger Menu Button (Mobile/Tablet Only) */}
      {token && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="no-print lg:hidden fixed top-4 right-4 z-40 p-2.5 bg-white border border-gray-200 shadow-md rounded-xl text-[#2216a8] hover:bg-gray-50 transition-all cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar */}
      {token && (
        <div className="no-print">
          <Sidebar 
            isOpen={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            isCollapsed={isCollapsed}
            setIsCollapsed={setIsCollapsed}
          />
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-x-hidden transition-all duration-500 ease-in-out p-4 lg:pr-4 lg:py-4 lg:pl-0 ${
        token ? (isCollapsed ? "lg:pl-[5.5rem]" : "lg:pl-[18.5rem]") : ""
      }`}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RootRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <RequireModule module="sales">
                  <POS />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/edit/:id"
            element={
              <ProtectedRoute>
                <RequireModule module="sales">
                  <OrderEditPOS />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <RequireModule module="inventory">
                  <Inventory />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse"
            element={
              <ProtectedRoute>
                <RequireModule module="warehouse">
                  <Warehouse />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse/:id"
            element={
              <ProtectedRoute>
                <RequireModule module="warehouse">
                  <WarehouseDetail />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/storefront"
            element={
              <ProtectedRoute>
                <RequireModule module={["sales", "inventory"]}>
                  <Storefront />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/storefront/:id"
            element={
              <ProtectedRoute>
                <RequireModule module={["sales", "inventory"]}>
                  <StorefrontDetail />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <RequireModule module="purchasing">
                  <Suppliers />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers/:id"
            element={
              <ProtectedRoute>
                <RequireModule module="purchasing">
                  <SupplierDetail />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchasing"
            element={
              <ProtectedRoute>
                <RequireModule module="purchasing">
                  <Purchasing />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <RequireModule module="sales">
                  <Orders />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-orders"
            element={
              <ProtectedRoute>
                <RequireModule module="credits">
                  <CreditOrders />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <RequireModule module="credits">
                  <Credits />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits/:id"
            element={
              <ProtectedRoute>
                <RequireModule module="credits">
                  <CreditDetail />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <RequireModule module="expenses">
                  <Expenses />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <RequireModule module="reports">
                  <Reports />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchasing-report"
            element={
              <ProtectedRoute>
                <RequireModule module={["reports", "purchasing"]}>
                  <POReport />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <RequireModule module="accounts">
                  <AccountManagement />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute>
                <AIChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daily-reports"
            element={
              <ProtectedRoute>
                <RequireModule module="reports">
                  <DailyReports />
                </RequireModule>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/mobile-print/:orderId" element={<MobilePrint />} />
          <Route path="/print-receipt/:orderId" element={<PrintReceipt />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppProvider>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              borderRadius: '1rem',
              fontFamily: 'inherit',
            },
            classNames: {
              toast: 'border shadow-xl text-sm font-semibold p-4',
              success: '!bg-white !text-[#2216a8] !border-[#2216a8]/30',
              error: '!bg-white !text-red-600 !border-red-600/30',
              info: '!bg-white !text-[#2216a8] !border-[#2216a8]/30',
              warning: '!bg-white !text-amber-600 !border-amber-600/30',
            }
          }} 
        />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<AppLayout />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </LanguageProvider>
  );
};

export default App;
