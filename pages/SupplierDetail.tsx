import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchSupplierById } from "../services/Supplier/fetchSupplierById";
import { fetchPurchases } from "../services/Purchase/fetchPurchases";
import { fetchSuppliers } from "../services/Supplier/fetchSuppliers";
import { fetchProducts } from "../services/Inventory/fetchProducts";
import { PurchaseOrderList } from "../components/Purchasing/PurchaseOrderList";
import { PODetailModal } from "../components/Purchasing/PODetailModal";
import { CreatePOModal } from "../components/Purchasing/CreatePOModal";
import { CreateGRNModal } from "../components/Purchasing/CreateGRNModal";
import { useLanguage } from "../context/LanguageContext";
import { Supplier, ApiPurchaseOrder, Product } from "../types";

export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isMy = language === "my";

  // Supplier & PO State
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingSupplier, setLoadingSupplier] = useState(true);

  const [poList, setPOList] = useState<ApiPurchaseOrder[]>([]);
  const [deletedPOList, setDeletedPOList] = useState<ApiPurchaseOrder[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [poFilter, setPoFilter] = useState<"pending" | "arrived" | "deleted">("pending");
  const [poPagination, setPoPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [deletedPoPagination, setDeletedPoPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPODetailModalOpen, setIsPODetailModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState<string | null>(null);
  const [isCreateGRNModalOpen, setIsCreateGRNModalOpen] = useState(false);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<ApiPurchaseOrder | null>(null);

  useEffect(() => {
    if (id) {
      loadSupplierData();
      loadMetadata();
    }
  }, [id]);

  const loadSupplierData = async () => {
    setLoadingSupplier(true);
    try {
      const res = await fetchSupplierById(id!);
      if (res.success && res.data) {
        setSupplier(res.data);
      } else {
        toast.error("Failed to load supplier details");
      }
    } catch (error) {
      console.error("Error loading supplier detail:", error);
      toast.error("An error occurred while loading supplier details");
    } finally {
      setLoadingSupplier(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const supplierRes = await fetchSuppliers();
      if (supplierRes.success) {
        setSuppliers(supplierRes.data);
      }
      const productRes = await fetchProducts();
      if (productRes.success && Array.isArray(productRes.data)) {
        setProducts(productRes.data);
      }
    } catch (error) {
      console.error("Error loading metadata:", error);
    }
  };

  const loadPurchases = async (page = 1, limit = 10, status?: string) => {
    if (!id) return;
    setPoLoading(true);
    try {
      const res = await fetchPurchases({
        page,
        limit,
        isDeleted: false,
        status: status as any,
        supplierId: id,
      });
      if (res.success) {
        setPOList(res.data);
        setPoPagination(res.pagination);
      }
    } catch (error) {
      console.error("Error loading purchases:", error);
      toast.error("Failed to load purchase orders");
    } finally {
      setPoLoading(false);
    }
  };

  const loadDeletedPurchases = async (page = 1, limit = 10) => {
    if (!id) return;
    setPoLoading(true);
    try {
      const res = await fetchPurchases({
        page,
        limit,
        isDeleted: true,
        supplierId: id,
      });
      if (res.success) {
        setDeletedPOList(res.data);
        setDeletedPoPagination(res.pagination);
      }
    } catch (error) {
      console.error("Error loading deleted purchases:", error);
      toast.error("Failed to load deleted purchase orders");
    } finally {
      setPoLoading(false);
    }
  };

  const handleViewPO = (po: ApiPurchaseOrder) => {
    setSelectedPOId(po._id);
    setIsPODetailModalOpen(true);
  };

  const handleCreateGRNFromPO = (po: ApiPurchaseOrder) => {
    setSelectedPOForGRN(po);
    setSelectedPOId(po._id);
    setIsCreateGRNModalOpen(true);
  };

  const handleGRNSuccess = () => {
    setIsCreateGRNModalOpen(false);
    if (poFilter === "deleted") {
      loadDeletedPurchases(deletedPoPagination.currentPage, deletedPoPagination.itemsPerPage);
    } else {
      loadPurchases(poPagination.currentPage, poPagination.itemsPerPage, poFilter);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white min-h-[96vh] border border-gray-200/70 rounded-3xl p-6 shadow-md flex flex-col gap-6">
        {/* Header section */}
        <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6 text-[#2216a8]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isMy ? "ကုန်သွင်းသူ အသေးစိတ်" : "Supplier Details"}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">
              {isMy ? "ကုန်သွင်းသူ အချက်အလက်နှင့် ဝယ်ယူမှုမှတ်တမ်းများ" : "Supplier information and purchase order records"}
            </p>
          </div>
        </div>

        {loadingSupplier ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#2216a8]" />
            <p className="text-slate-500 font-medium">Loading supplier details...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Supplier Info Card */}
            {supplier && (
              <div className="bg-[#fcfbf9] border border-gray-150 rounded-2xl p-6 flex flex-col md:flex-row gap-6 md:items-center">
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-4 bg-indigo-50 rounded-2xl text-[#2216a8]">
                    <User className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">{supplier.supplierName}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">
                      ID: {supplier._id || supplier.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-gray-200/60 pt-4 md:pt-0 md:pl-6 min-w-[250px]">
                  <div className="p-3 bg-green-50 rounded-xl text-green-700">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Number</p>
                    <p className="text-sm font-extrabold text-slate-700 mt-0.5">{supplier.contactNumber}</p>
                  </div>
                </div>
              </div>
            )}

            {/* PO List section */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">
                {isMy ? "ကုန်သွင်းသူထံမှ ဝယ်ယူမှုများ" : "Purchase Orders of this Supplier"}
              </h3>

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
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreatePOModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        suppliers={suppliers}
        products={products}
        onSuccess={() => {
          if (poFilter === "deleted") {
            loadDeletedPurchases(deletedPoPagination.currentPage, deletedPoPagination.itemsPerPage);
          } else {
            loadPurchases(poPagination.currentPage, poPagination.itemsPerPage, poFilter);
          }
        }}
        defaultSupplierId={id}
      />

      <PODetailModal
        isOpen={isPODetailModalOpen}
        onClose={() => setIsPODetailModalOpen(false)}
        purchaseId={selectedPOId}
        suppliers={suppliers}
      />

      {isCreateGRNModalOpen && selectedPOForGRN && (
        <CreateGRNModal
          isOpen={isCreateGRNModalOpen}
          onClose={() => setIsCreateGRNModalOpen(false)}
          purchaseOrders={poList}
          suppliers={suppliers}
          onSuccess={handleGRNSuccess}
          selectedPOId={selectedPOId}
        />
      )}
    </div>
  );
};
