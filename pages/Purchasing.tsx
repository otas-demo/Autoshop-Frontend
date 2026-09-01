import React from "react";
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

export const Purchasing: React.FC = () => {
  const { t, language } = useLanguage();
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
      <div className="bg-white min-h-[96vh] border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-850">
              {isMy ? "ပစ္စည်း အမှာစာရင်း" : "Purchasing Records"}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-bold">
              {isMy
                ? "ဆိုင်အတွက် ပစ္စည်းတွေ မှာမယ် , မှာထားတဲ့ ပစ္စည်းစာရင်းတွေစစ်မယ်"
                : "Order items for shop, check list of ordered items"}
            </p>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="flex gap-1 sm:gap-4 border-b border-gray-100 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("po")}
            className={`px-4 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "po"
                ? "border-b-2 border-[#2216a8] text-[#2216a8]"
                : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isMy ? "ဝယ်ယူမှု အော်ဒါ စာရင်းများ" : "Purchase Orders"}</span>
          </button>
          <button
            onClick={() => setActiveTab("grn")}
            className={`px-4 py-3 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === "grn"
                ? "border-b-2 border-[#2216a8] text-[#2216a8]"
                : "text-slate-400 hover:text-slate-600"
              }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>{isMy ? "ပစ္စည်းလက်ခံ စာရင်းများ" : "Goods Received Notes"}</span>
          </button>
        </div>

        {/* Active Tab Content Title and Action Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-slate-800">
            {activeTab === "po"
              ? (isMy ? "ဝယ်ယူမှု အော်ဒါ စာရင်းများ" : "Purchase Orders List")
              : (isMy ? "ပစ္စည်းလက်ခံ စာရင်းများ" : "Goods Received Notes List")
            }
          </h2>
          <button
            onClick={() => {
              if (activeTab === "po") {
                setIsCreateModalOpen(true);
              } else {
                setIsCreateGRNModalOpen(true);
              }
            }}
            className="bg-[#2216a8] hover:bg-[#2216a8]/90 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md shadow-indigo-600/10 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>{isMy ? "စာရင်းအသစ်ထည့်မယ်" : "Create New"}</span>
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
                setIsCreateModalOpen={setIsCreateModalOpen}
                loadPurchases={loadPurchases}
                loadDeletedPurchases={loadDeletedPurchases}
                onViewPO={handleViewPO}
                pagination={poPagination}
                deletedPagination={deletedPoPagination}
                onCreateGRN={handleCreateGRNFromPO}
                loading={poLoading}
                poFilter={poFilter}
                setPoFilter={setPoFilter}
                tableHeight="calc(100vh - 400px)"
              />
              <CreatePOModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                suppliers={suppliers}
                products={products}
                onSuccess={loadPurchases}
              />
              <PODetailModal
                isOpen={isPODetailModalOpen}
                onClose={() => setIsPODetailModalOpen(false)}
                purchaseId={selectedPOId}
                suppliers={suppliers}
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
                      poFilter === "arrived" ? "arrived" : "pending"
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
