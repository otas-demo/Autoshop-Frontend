import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import { AppProvider } from "./context/AppContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Sidebar } from "./components/Sidebar";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { POS } from "./pages/POS";
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

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  const token = localStorage.getItem("authToken");

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f3]">
      {/* Floating AI hanging badge */}
      {token && <AIFloatingIcon />}
      {/* Floating Hamburger Menu Button (Mobile/Tablet Only) */}
      {token && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 right-4 z-40 p-2.5 bg-white border border-gray-200 shadow-md rounded-xl text-[#2216a8] hover:bg-gray-50 transition-all cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar */}
      {token && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
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
                <Navigate to="/pos" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse"
            element={
              <ProtectedRoute>
                <Warehouse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse/:id"
            element={
              <ProtectedRoute>
                <WarehouseDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storefront"
            element={
              <ProtectedRoute>
                <Storefront />
              </ProtectedRoute>
            }
          />
          <Route
            path="/storefront/:id"
            element={
              <ProtectedRoute>
                <StorefrontDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchasing"
            element={
              <ProtectedRoute>
                <Purchasing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credit-orders"
            element={
              <ProtectedRoute>
                <CreditOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits"
            element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/credits/:id"
            element={
              <ProtectedRoute>
                <CreditDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/purchasing-report"
            element={
              <ProtectedRoute>
                <POReport />
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
                <AccountManagement />
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
                <DailyReports />
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
