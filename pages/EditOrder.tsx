import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Minus, Trash2, Loader2, Search, Package, Save } from "lucide-react";
import { toast } from "sonner";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { Order } from "../services/Order/fetchOrders";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import { updateOrder } from "../services/Order/updateOrder";
import { useLanguage } from "../context/LanguageContext";

interface InventoryProduct {
  _id: string;
  inventoryId: string;
  productName: string;
  productCode: string;
  unit: string;
  factor: number;
  pricePerUnit: number;
  availableQuantity: number;
}

interface SelectedItem {
  cartItemId: string;
  inventoryId: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  saleUnit: string;
  factor: number;
}

export const EditOrder: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const [inventoryProducts, setInventoryProducts] = useState<InventoryProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  
  // Financial states
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [markupAmount, setMarkupAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [useMarkup, setUseMarkup] = useState(false);
  const [activeTab, setActiveTab] = useState<"items" | "products">("items");
  const hasInitializedCart = useRef(false);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderData(orderId);
    }
  }, [orderId]);

  const loadOrderData = async (id: string) => {
    setLoadingOrder(true);
    try {
      const res = await fetchOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
        
        // Initialize cart with existing order items
        if (res.data?.ordersProducts && Array.isArray(res.data.ordersProducts) && !hasInitializedCart.current) {
          hasInitializedCart.current = true;
          const initialItems = res.data.ordersProducts.map(item => ({
            cartItemId: `${item.inventoryId?._id}_${item.saleUnit || item.unit || "Base"}`,
            inventoryId: item.inventoryId?._id || "",
            productName: item.inventoryId?.productName || "Unknown",
            productCode: item.inventoryId?.productCode || "",
            quantity: item.saleQuantity || item.quantity || 0,
            unitPrice: item.salePrice || item.unitPrice || 0,
            subtotal: (item.saleQuantity || item.quantity || 0) * (item.salePrice || item.unitPrice || 0),
            saleUnit: item.saleUnit || item.unit || "Base",
            factor: (item.quantity && item.saleQuantity && item.saleQuantity > 0) 
              ? item.quantity / item.saleQuantity 
              : 1,
          })).filter(item => item.inventoryId !== "");
          setSelectedItems(initialItems);
        }

        setTax(res.data.tax || 0);
        const subtotal = res.data.subTotal || 0;
        const finalAmount = res.data.finalAmount || 0;
        const existingDiscount = res.data.discount || 0;
        
        const isMarkup = finalAmount > subtotal;
        setUseMarkup(isMarkup);
        
        if (isMarkup) {
          setMarkupAmount(subtotal > 0 ? finalAmount - subtotal - (res.data.tax || 0) : 0);
          setDiscount(0);
          setDiscountPercent(0);
        } else {
          setDiscount(existingDiscount);
          setDiscountPercent(subtotal > 0 ? (existingDiscount / subtotal) * 100 : 0);
          setMarkupAmount(0);
        }
        
        setPaidAmount(res.data.paidAmount || 0);

        // Fetch inventory based on storefront ID
        if (res.data.storefrontId) {
          const sId = typeof res.data.storefrontId === 'string' ? res.data.storefrontId : res.data.storefrontId._id;
          loadInventoryProducts(sId);
        }
      } else {
        toast.error("Failed to load order");
        navigate("/orders");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading order");
      navigate("/orders");
    } finally {
      setLoadingOrder(false);
    }
  };

  const loadInventoryProducts = async (storefrontId: string) => {
    setLoadingProducts(true);
    try {
      const response = await fetchStorefrontStock(storefrontId);
      if (response && response.data) {
        const units: InventoryProduct[] = [];
        
        const getEffectiveFactor = (
          targetUnit: string,
          baseUnit: string,
          uomConversions: any[] = []
        ): number => {
          if (!targetUnit || targetUnit === baseUnit) return 1;
          let factor = 1;
          let currentUnit = targetUnit;
          let maxDepth = 10;
          while (currentUnit !== baseUnit && maxDepth > 0) {
            const conversion = uomConversions.find(c => c.unit === currentUnit);
            if (!conversion) break;
            factor *= conversion.factor;
            currentUnit = conversion.convertFrom;
            maxDepth--;
          }
          return factor;
        };

        const getItemPrice = (inventory: any, qty: number = 1) => {
          const basePrice = inventory.sellingPrice || 0;
          const wholesaleTiers = inventory.wholesalePrices || [];
          if (wholesaleTiers.length === 0) return basePrice;
          const eligibleTier = wholesaleTiers
            .slice()
            .sort((a: any, b: any) => a.quantity - b.quantity)
            .filter((tier: any) => qty >= tier.quantity)
            .pop();
          return eligibleTier?.price ?? basePrice;
        };

        if (Array.isArray(response.data)) {
          response.data.forEach((item) => {
          const inv = item.inventoryId as any;
          if (!inv) return;
          const baseUnit = inv.unitOfMeasure || "Base";
          const availableBaseQty = Number(item.availableQuantity ?? item.quantity ?? 0);
          
          units.push({
            _id: `${inv._id || 'unknown'}_${baseUnit}`,
            inventoryId: inv._id || '',
            productName: inv.productName || 'Unknown',
            productCode: inv.productCode || '',
            unit: baseUnit,
            factor: 1,
            pricePerUnit: inv.sellingPrice || 0,
            availableQuantity: availableBaseQty,
          });

          const conversions = inv.uomConversions || [];
          conversions.forEach((conv: any) => {
            const factor = getEffectiveFactor(conv.unit, baseUnit, conversions);
            if (factor <= 1) return;
            const pricePerPiece = getItemPrice(inv, factor);
            const pricePerUnit = pricePerPiece * factor;
            units.push({
              _id: `${inv._id || 'unknown'}_${conv.unit}`,
              inventoryId: inv._id || '',
              productName: inv.productName || 'Unknown',
              productCode: inv.productCode || '',
              unit: conv.unit,
              factor: factor,
              pricePerUnit: pricePerUnit,
              availableQuantity: Math.floor(availableBaseQty / factor),
            });
          });
          });
        }
        
        setInventoryProducts(units);
      } else {
        setInventoryProducts([]);
      }
    } catch (error) {
      console.error("Error loading storefront products:", error);
      toast.error(t("orders.failedToLoadProducts") || "Failed to load storefront products");
      setInventoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Update absolute discount when percentage or subtotal changes
  useEffect(() => {
    if (order && !useMarkup) {
      const totalSubtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
      const calculatedDiscount = Math.max(
        0,
        Math.round(((totalSubtotal * discountPercent) / 100) * 100) / 100,
      );
      setDiscount(calculatedDiscount);
    }
  }, [discountPercent, selectedItems, order, useMarkup]);

  // Auto-sync paid amount when final amount changes
  useEffect(() => {
    if (loadingOrder || !order) return;
    
    const isCreditOrder = order.paymentType?.toLowerCase() === 'credit' || !!order.creditPersonId;
    if (isCreditOrder) return;
    
    const totalSubtotal = selectedItems.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    let calculatedDiscount = useMarkup ? 0 : discount;
    let finalAmount = totalSubtotal + tax;
    if (useMarkup) {
      finalAmount += markupAmount;
    } else {
      finalAmount -= calculatedDiscount;
    }
    finalAmount = Math.max(0, Math.round(finalAmount * 100) / 100);
    setPaidAmount(finalAmount);
  }, [selectedItems, tax, discount, markupAmount, useMarkup, loadingOrder, order]);


  const filteredProducts = inventoryProducts.filter(
    (product) =>
      (product.productName || "").toLowerCase().includes((searchProduct || "").toLowerCase()) ||
      (product.productCode || "").toLowerCase().includes((searchProduct || "").toLowerCase()),
  );

  const handleAddItem = (product: InventoryProduct) => {
    const existingItem = selectedItems.find((item) => item.cartItemId === product._id);
    if (existingItem) {
      handleQuantityChange(existingItem.cartItemId, existingItem.quantity + 1);
    } else {
      const newItem: SelectedItem = {
        cartItemId: product._id,
        inventoryId: product.inventoryId,
        productName: product.productName,
        productCode: product.productCode,
        quantity: 1,
        unitPrice: product.pricePerUnit,
        subtotal: product.pricePerUnit,
        saleUnit: product.unit,
        factor: product.factor,
      };
      setSelectedItems([...selectedItems, newItem]);
    }
  };

  const handleRemoveItem = (cartItemId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleQuantityChange = (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(cartItemId);
      return;
    }
    const updatedItems = selectedItems.map((item) =>
      item.cartItemId === cartItemId
        ? {
            ...item,
            quantity,
            subtotal: quantity * item.unitPrice,
          }
        : item,
    );
    setSelectedItems(updatedItems);
  };

  const calculateTotals = () => {
    const totalSubtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
    
    let calculatedDiscount = 0;
    if (useMarkup) {
      calculatedDiscount = 0;
    } else {
      calculatedDiscount = discount;
    }

    let finalAmount = totalSubtotal + tax;
    if (useMarkup) {
      finalAmount += markupAmount;
    } else {
      finalAmount -= calculatedDiscount;
    }
    finalAmount = Math.max(0, Math.round(finalAmount * 100) / 100);

    const extraChange = paidAmount > finalAmount ? paidAmount - finalAmount : 0;

    return {
      subTotal: totalSubtotal,
      tax,
      discount: calculatedDiscount,
      finalAmount,
      extraChange,
      paidAmount,
    };
  };

  const handleSaveOrder = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please add at least one item to the order.");
      return;
    }
    if (!orderId) return;

    setSubmitting(true);
    try {
      const totals = calculateTotals();
      
      const payload = {
        ordersProducts: selectedItems.map((item) => ({
          inventoryId: item.inventoryId,
          quantity: item.quantity * item.factor,
          unitPrice: item.unitPrice / item.factor,
          saleUnit: item.saleUnit,
          saleQuantity: item.quantity,
          salePrice: item.unitPrice,
        })),
        subTotal: totals.subTotal,
        tax: totals.tax,
        discount: totals.discount,
        finalAmount: totals.finalAmount,
        extraChange: totals.extraChange,
        paidAmount: totals.paidAmount,
      };

      const response = await updateOrder(orderId, payload);
      
      if (!response.success) throw new Error(response.message || "Failed to update order");

      toast.success("Order updated successfully");
      const isCredit = order?.paymentType?.toLowerCase() === 'credit' || !!order?.creditPersonId;
      navigate(isCredit ? "/credit-orders" : "/orders");
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error(error.message || "Failed to update order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center text-slate-500">
        Order not found
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-slate-50 flex flex-col p-4 lg:p-6 pb-20 lg:pb-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate((order?.paymentType?.toLowerCase() === "credit" || !!order?.creditPersonId) ? "/credit-orders" : "/orders")}
            className="p-2 bg-white border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
              Edit Order <span className="text-indigo-600">#{order.orderNumber}</span>
            </h1>
            <p className="text-sm text-slate-500">
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate((order?.paymentType?.toLowerCase() === "credit" || !!order?.creditPersonId) ? "/credit-orders" : "/orders")}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveOrder}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-6">
        
        {/* LEFT COLUMN: Cart and Storefront */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
          
          {/* Navbar Tab Switcher */}
          <div className="flex p-1 bg-white rounded-xl shadow-sm border">
            <button
              onClick={() => setActiveTab("items")}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                activeTab === "items"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              Order Items ({selectedItems.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                activeTab === "products"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              Add Products
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border flex flex-col flex-1 min-h-0 overflow-hidden relative">
            
            {/* ITEMS TAB */}
            <div className={`absolute inset-0 flex flex-col ${activeTab === "items" ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"}`}>
              <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Order Items
                </h3>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                {selectedItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Package className="w-12 h-12 mb-3 opacity-20" />
                    <p>No items in order</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedItems.map((item) => (
                      <div
                        key={item.cartItemId}
                        className="flex flex-wrap sm:flex-nowrap items-center justify-between p-3 lg:p-4 border border-slate-100 rounded-xl bg-white hover:border-indigo-100 transition-colors gap-4"
                      >
                        <div className="flex-1 min-w-[200px]">
                          <p className="font-bold text-slate-800 truncate">{item.productName} ({item.saleUnit})</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.productCode}</p>
                        </div>
                        
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-6 w-full sm:w-auto">
                          <div className="text-right w-24">
                            <p className="text-xs text-slate-500 mb-0.5">Unit Price</p>
                            <p className="font-semibold text-slate-700">{(item.unitPrice || 0).toLocaleString()} Ks</p>
                          </div>

                          <div className="flex items-center bg-slate-50 rounded-lg p-1 border">
                            <button
                              onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white rounded shadow-sm text-slate-600 transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.cartItemId, parseInt(e.target.value) || 0)}
                              className="w-12 text-center bg-transparent font-bold outline-none"
                            />
                            <button
                              onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-white rounded shadow-sm text-slate-600 transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-right w-28">
                            <p className="text-xs text-slate-500 mb-0.5">Subtotal</p>
                            <p className="font-bold text-indigo-700">{(item.subtotal || 0).toLocaleString()} Ks</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* PRODUCTS TAB */}
            <div className={`absolute inset-0 flex flex-col ${activeTab === "products" ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none"}`}>
              <div className="p-4 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-600" />
                  Add Products
                </h3>
                
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                {loadingProducts ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredProducts.map((product) => {
                      const isOutOfStock = product.availableQuantity <= 0;
                      return (
                        <div
                          key={product._id}
                          className={`flex items-center justify-between p-3 border rounded-xl transition-all group ${
                            isOutOfStock
                              ? "opacity-50 bg-gray-50 cursor-not-allowed border-gray-200"
                              : "hover:border-indigo-300 hover:shadow-sm bg-white"
                          }`}
                        >
                          <div className="min-w-0 pr-3 flex flex-col gap-1">
                            <p className="font-semibold text-slate-800 text-sm truncate">
                              {product.productName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-bold text-indigo-600 text-sm">
                                {(product.pricePerUnit || 0).toLocaleString()} Ks
                              </span>
                              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium border border-indigo-100">
                                {product.unit || 'Base'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isOutOfStock ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                                Stock: {product.availableQuantity}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => !isOutOfStock && handleAddItem(product)}
                            disabled={isOutOfStock}
                            className={`p-2.5 rounded-lg transition-all shrink-0 ${
                              isOutOfStock
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-slate-50 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white"
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {filteredProducts.length === 0 && searchProduct && (
                      <div className="col-span-full text-center py-8 text-slate-500">
                        No products found matching "{searchProduct}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>

        {/* RIGHT COLUMN: Financial Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-white rounded-xl shadow-sm border h-full flex flex-col">
            <div className="p-4 lg:p-6 border-b bg-slate-50/50">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">
                Order Summary
              </h3>
            </div>

            <div className="p-4 lg:p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Pricing Option */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Pricing Mode
                </label>
                <div className="flex p-1 bg-slate-100 rounded-lg">
                  <button
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                      !useMarkup ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setUseMarkup(false)}
                  >
                    Discount
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                      useMarkup ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    onClick={() => setUseMarkup(true)}
                  >
                    Markup
                  </button>
                </div>
              </div>

              {/* Inputs Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Tax (Ks)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                    className="w-full border-2 border-slate-100 rounded-lg p-2.5 font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
                
                {!useMarkup ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discountPercent}
                      onChange={(e) => {
                        const percent = parseFloat(e.target.value) || 0;
                        setDiscountPercent(Math.min(100, Math.max(0, percent)));
                      }}
                      className="w-full border-2 border-slate-100 rounded-lg p-2.5 font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Markup (Ks)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={markupAmount}
                      onChange={(e) => setMarkupAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full border-2 border-slate-100 rounded-lg p-2.5 font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Paid Amount (Ks)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border-2 border-slate-100 rounded-lg p-2.5 font-semibold text-slate-700 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              {/* Receipt Totals */}
              <div className="bg-slate-800 text-white rounded-xl p-5 shadow-inner mt-6">
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span className="font-medium">{totals.subTotal.toLocaleString()}</span>
                  </div>
                  {totals.tax > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Tax</span>
                      <span className="font-medium">+{totals.tax.toLocaleString()}</span>
                    </div>
                  )}
                  {!useMarkup && totals.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount</span>
                      <span className="font-medium">-{totals.discount.toLocaleString()}</span>
                    </div>
                  )}
                  {useMarkup && markupAmount > 0 && (
                    <div className="flex justify-between text-sky-400">
                      <span>Markup</span>
                      <span className="font-medium">+{markupAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-slate-600/50">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Final Amount</span>
                    <span className="text-indigo-300">{totals.finalAmount.toLocaleString()} Ks</span>
                  </div>
                </div>

                {totals.extraChange > 0 && (
                  <div className="flex justify-between items-center text-amber-400 pt-3 text-sm font-medium">
                    <span>Change to Return</span>
                    <span>{totals.extraChange.toLocaleString()} Ks</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom Actions */}
            <div className="p-4 lg:p-6 border-t bg-slate-50/50 rounded-b-xl flex gap-3">
              <button
                onClick={() => navigate((order?.paymentType?.toLowerCase() === "credit" || !!order?.creditPersonId) ? "/credit-orders" : "/orders")}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSaveOrder}
                disabled={submitting}
                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-200"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Update Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
