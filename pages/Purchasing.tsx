import React, { useState } from "react";
import { FileText, PackageCheck, Plus } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { PurchaseOrderList } from "../components/Purchasing/PurchaseOrderList";
import { CreatePOModal } from "../components/Purchasing/CreatePOModal";
import { GRNList } from "../components/Purchasing/GRNList";
import { CreateGRNModal } from "../components/Purchasing/CreateGRNModal";
import { GRNDetailModal } from "../components/Purchasing/GRNDetailModal";
import { PODetailModal } from "../components/Purchasing/PODetailModal";
import { TransferWarehouseModal } from "../components/Purchasing/TransferWarehouseModal";
import { usePurchasing } from "../hooks/usePurchasing";
import { PurchaseDetail } from "../services/Purchase/fetchPurchaseById";

export const Purchasing: React.FC = () => {
  const { t, language } = useLanguage();
  const [editingPO, setEditingPO] = useState<PurchaseDetail | null>(null);

  const {
    activeTab,
    setActiveTab,
    suppliers,
    products,
    poList,
    deletedPOList,
    poLoading,
    poFilter,
    setPoFilter,
    paymentFilter,
    setPaymentFilter,
    poPagination,
    deletedPoPagination,
    isCreateModalOpen,
    setIsCreateModalOpen,
    selectedPOId,
    isPODetailModalOpen,
    setIsPODetailModalOpen,
    grnList,
    grnLoading,
    grnPagination,
    isCreateGRNModalOpen,
    setIsCreateGRNModalOpen,
    selectedGRNId,
    isGRNDetailModalOpen,
    setIsGRNDetailModalOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    transferGRNId,
    loadPurchases,
    loadDeletedPurchases,
    loadGRNs,
    handleGRNSuccess,
    handleCreateGRNFromPO,
    handleViewPO,
    handleViewGRN,
    handleTransferGRN,
  } = usePurchasing();

  const isMy = language === "my";

  return (
    <div className="w-full">
      <div className="bg-white min-h-[96vh] rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-4 border-b border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {isMy ? "ပစ္စည်း အမှာစာရင်း" : "Purchasing Records"}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {isMy
                ? "ဆိုင်အတွက် ပစ္စည်းတွေ မှာမယ် , မှာထားတဲ့ ပစ္စည်းစာရင်းတွေစစ်မယ်"
                : "Order items for shop, check list of ordered items"}
            </p>
          </div>
          <button
            onClick={() => {
              if (activeTab === "po") {
                setEditingPO(null);
                setIsCreateModalOpen(true);
              } else {
                setIsCreateGRNModalOpen(true);
              }
            }}
            className="bg-[#2216a8] hover:bg-[#1b1187] text-white font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-sm flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isMy ? "စာရင်း အသစ်ထည့်မယ်" : "Create New"}</span>
          </button>
        </div>

        {/* Top Tabs Section */}
        <div className="flex gap-4 sm:gap-8 border-b border-gray-200/80 overflow-x-auto pb-0">
          <button
            onClick={() => setActiveTab("po")}
            className={`pb-3.5 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "po"
                ? "border-b-2 border-[#2216a8] text-[#2216a8]"
                : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isMy ? "ဝယ်ယူမှု အော်ဒါ စာရင်းများ" : "Purchase Orders"}</span>
          </button>
          <button
            onClick={() => setActiveTab("grn")}
            className={`pb-3.5 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "grn"
                ? "border-b-2 border-[#2216a8] text-[#2216a8]"
                : "text-slate-400 hover:text-slate-600 border-b-2 border-transparent"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>{isMy ? "ပစ္စည်းလက်ခံ စာရင်းများ" : "Goods Received Notes"}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="w-full">
          {/* PO Tab */}
          {activeTab === "po" && (
            <div className="space-y-6">
              <PurchaseOrderList
                poList={poList}
                deletedPOList={deletedPOList}
                suppliers={suppliers}
                setIsCreateModalOpen={(open) => {
                  if (open) setEditingPO(null);
                  setIsCreateModalOpen(open);
                }}
                loadPurchases={loadPurchases}
                loadDeletedPurchases={loadDeletedPurchases}
                onViewPO={handleViewPO}
                pagination={poPagination}
                deletedPagination={deletedPoPagination}
                onCreateGRN={handleCreateGRNFromPO}
                loading={poLoading}
                poFilter={poFilter}
                setPoFilter={setPoFilter}
                paymentFilter={paymentFilter}
                setPaymentFilter={setPaymentFilter}
                tableHeight="calc(100vh - 350px)"
              />
              <CreatePOModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                  setIsCreateModalOpen(false);
                  setEditingPO(null);
                }}
                suppliers={suppliers}
                products={products}
                onSuccess={() => {
                  if (poFilter === "deleted") {
                    loadDeletedPurchases(
                      deletedPoPagination.currentPage,
                      deletedPoPagination.itemsPerPage
                    );
                  } else {
                    loadPurchases(
                      poPagination.currentPage,
                      poPagination.itemsPerPage,
                      poFilter === "arrived" ? "arrived" : "pending",
                      paymentFilter
                    );
                  }
                }}
                editingPO={editingPO}
              />
              <PODetailModal
                isOpen={isPODetailModalOpen}
                onClose={() => setIsPODetailModalOpen(false)}
                purchaseId={selectedPOId}
                suppliers={suppliers}
                onEdit={(purchase) => {
                  setIsPODetailModalOpen(false);
                  setEditingPO(purchase);
                  setIsCreateModalOpen(true);
                }}
                onOrderUpdate={() => {
                  if (poFilter === "deleted") {
                    loadDeletedPurchases(
                      deletedPoPagination.currentPage,
                      deletedPoPagination.itemsPerPage
                    );
                  } else {
                    loadPurchases(
                      poPagination.currentPage,
                      poPagination.itemsPerPage,
                      poFilter === "arrived" ? "arrived" : "pending",
                      paymentFilter
                    );
                  }
                }}
              />
            </div>
          )}

          {/* GRN Tab */}
          {activeTab === "grn" && (
            <div className="space-y-6">
              <GRNList
                grnList={grnList}
                setIsCreateModalOpen={setIsCreateGRNModalOpen}
                onStatusChange={loadGRNs}
                onViewGRN={handleViewGRN}
                onTransferGRN={handleTransferGRN}
                pagination={grnPagination}
                loading={grnLoading}
              />
            </div>
          )}
        </div>
      </div>

      {/* Global Modals - accessible from any tab */}
      <CreateGRNModal
        isOpen={isCreateGRNModalOpen}
        onClose={() => setIsCreateGRNModalOpen(false)}
        purchaseOrders={poList}
        suppliers={suppliers}
        onSuccess={handleGRNSuccess}
        selectedPOId={selectedPOId}
      />
      <GRNDetailModal
        isOpen={isGRNDetailModalOpen}
        onClose={() => setIsGRNDetailModalOpen(false)}
        grnId={selectedGRNId}
        onGRNUpdate={loadGRNs}
      />
      <TransferWarehouseModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        grnId={transferGRNId}
        onSuccess={handleGRNSuccess}
      />
    </div>
  );
};
