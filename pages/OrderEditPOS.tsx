import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Store,
  Loader2,
  Scan,
  X,
  User,
  Calculator,
  Calendar,
  ShoppingCart,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import { fetchCategories } from "../services/Inventory/fetchCategories";
import { fetchOrderById } from "../services/Order/fetchOrderById";
import { updateEntireOrder } from "../services/Order/updateEntireOrder";
import { Order } from "../services/Order/fetchOrders";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { createCreditPersona } from "../services/Credit/createCreditPersona";

enum PaymentMethod {
  CASH = "Cash",
  KBZ_PAY = "KBZPay",
  WAVE_PAY = "WavePay",
  AYA_PAY = "AYA Pay",
  UAB_PAY = "UAB Pay",
  MMQR = "MMQR",
  BANK_TRANSFER = "Bank Transfer",
  NORMAL = "Normal",
  HOT = "Hot",
  FOC = "FOC",
}

interface CartItem {
  stockItem: StorefrontStockItem;
  qty: number;
}

export const OrderEditPOS: React.FC = () => {
  const { id: orderId } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const isMy = language === "my";
  const navigate = useNavigate();

  // Order & Storefront State
  const [order, setOrder] = useState<Order | null>(null);
  const [storefrontId, setStorefrontId] = useState<string>("");
  const [storefrontName, setStorefrontName] = useState<string>("");
  const [pageLoading, setPageLoading] = useState(true);

  // Products & Categories
  const [allStockItems, setAllStockItems] = useState<StorefrontStockItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [stockLoading, setStockLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 100;

  // Track original quantities in this order before editing (inventoryId -> quantity)
  const [originalOrderQuantities, setOriginalOrderQuantities] = useState<Record<string, number>>({});
  // Real-time shelf stock lookup (inventoryId -> availableQuantity)
  const [shelfStockMap, setShelfStockMap] = useState<Record<string, number>>({});

  // Cart & Pricing
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [markupAmount, setMarkupAmount] = useState<number>(0);
  const [useMarkup, setUseMarkup] = useState<boolean>(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [note, setNote] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>(new Date().toISOString().split("T")[0]);

  // Credit Customers
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [selectedCreditPersonId, setSelectedCreditPersonId] = useState<string>("");
  const [showAddCreditPersonModal, setShowAddCreditPersonModal] = useState(false);
  const [newCreditPersonName, setNewCreditPersonName] = useState("");
  const [newCreditPersonPhone, setNewCreditPersonPhone] = useState("");
  const [newCreditPersonAddress, setNewCreditPersonAddress] = useState("");
  const [isAddingCreditPerson, setIsAddingCreditPerson] = useState(false);

  // Modals & UI States
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showDiscountCalculator, setShowDiscountCalculator] = useState(false);
  const [showMarkupCalculator, setShowMarkupCalculator] = useState(false);
  const [discountAmountInput, setDiscountAmountInput] = useState("");
  const [activeWholesalePopoverId, setActiveWholesalePopoverId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initial Load: Order -> Storefront Stock + Categories + Credit Personas
  useEffect(() => {
    if (!orderId) {
      toast.error("Order ID is missing");
      navigate("/orders");
      return;
    }
    initEditOrder(orderId);
  }, [orderId]);

  const initEditOrder = async (targetOrderId: string) => {
    setPageLoading(true);
    try {
      // 1. Fetch Order Details
      const orderRes = await fetchOrderById(targetOrderId);
      if (!orderRes.success || !orderRes.data) {
        toast.error(orderRes.message || "Failed to load order");
        navigate("/orders");
        return;
      }

      const ord = orderRes.data;
      setOrder(ord);

      const sfId =
        typeof ord.storefrontId === "object" && ord.storefrontId?._id
          ? ord.storefrontId._id
          : (ord.storefrontId as unknown as string) || "";
      const sfName =
        typeof ord.storefrontId === "object"
          ? ord.storefrontId.locationName || ord.storefrontId.storefrontName || "Storefront"
          : "Storefront";

      setStorefrontId(sfId);
      setStorefrontName(sfName);

      // Track original quantities from order (inventoryId -> quantity)
      const origQtyMap: Record<string, number> = {};
      (ord.ordersProducts || []).forEach((p: any) => {
        const inv = p.inventoryId;
        const invId = typeof inv === "object" ? inv?._id : inv;
        if (invId) {
          origQtyMap[invId.toString()] = p.quantity || 0;
        }
      });
      setOriginalOrderQuantities(origQtyMap);

      // Pre-fill Cart
      const initialCart: CartItem[] = (ord.ordersProducts || []).map((p: any) => {
        const inv = p.inventoryId;
        const stockItem: StorefrontStockItem = {
          _id: `edit_${inv._id}_${Date.now()}_${Math.random()}`,
          storefrontId: {
            _id: sfId,
            locationCode: "",
            locationName: sfName,
          },
          inventoryId: {
            _id: inv._id,
            productName: inv.productName,
            productCode: inv.productCode,
            SKU: inv.SKU,
            category: inv.category || "",
            profitMargin: inv.profitMargin ?? null,
            profitAmount: inv.profitAmount ?? null,
            sellingPrice: p.unitPrice || inv.sellingPrice || 0,
            wholesalePrices: inv.wholesalePrices || [],
          },
          quantity: p.quantity,
          isLowStock: false,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          availableQuantity: 999999, // Existing order items not blocked by shelf stock
        };
        return {
          stockItem,
          qty: p.quantity,
        };
      });
      setCart(initialCart);

      // Pre-fill Financial Fields
      const discountVal = ord.discount || 0;
      const subtotalVal = ord.subTotal || 0;
      if (subtotalVal > 0 && discountVal > 0) {
        const discountPct = (discountVal / subtotalVal) * 100;
        setDiscount(Math.round(discountPct * 100) / 100);
      } else {
        setDiscount(0);
      }
      setPaidAmount(ord.paidAmount || 0);
      setPaymentType(ord.paymentType === "credit" ? "credit" : "paid");

      const methodMap: Record<string, PaymentMethod> = {
        cash: PaymentMethod.CASH,
        kpay: PaymentMethod.KBZ_PAY,
        wavepay: PaymentMethod.WAVE_PAY,
        ayapay: PaymentMethod.AYA_PAY,
        uabpay: PaymentMethod.UAB_PAY,
        MMQR: PaymentMethod.MMQR,
        bank_transfer: PaymentMethod.BANK_TRANSFER,
        normal: PaymentMethod.NORMAL,
        hot: PaymentMethod.HOT,
        foc: PaymentMethod.FOC,
      };
      setPaymentMethod(methodMap[ord.paymentMethod] || PaymentMethod.CASH);
      setNote(ord.note || "");
      if (ord.createdAt) {
        setCreatedAt(new Date(ord.createdAt).toISOString().split("T")[0]);
      }

      if (ord.creditPersonId) {
        const cp = typeof ord.creditPersonId === "object" ? ord.creditPersonId : null;
        const cpId = cp ? cp._id : ord.creditPersonId;
        setSelectedCreditPersonId(cpId || "");
        if (cp && cp._id) {
          setCreditPersonas((prev) => {
            if (prev.some((p) => p._id === cp._id)) return prev;
            return [cp as any, ...prev];
          });
        }
      }

      // 2. Fetch parallel prerequisites: Categories, Credit Personas, Stock Items for storefront
      await Promise.all([
        fetchCategories().then((res) => {
          if (res.success && res.data) setCategories(res.data);
        }),
        fetchCreditPersonas().then((res) => {
          if (res.success && res.data) {
            const list = res.data.filter((p) => !p.blacklist);
            if (ord.creditPersonId && typeof ord.creditPersonId === "object") {
              const currentCp = ord.creditPersonId as any;
              if (!list.some((p) => p._id === currentCp._id)) {
                list.unshift(currentCp);
              }
            }
            setCreditPersonas(list);
          }
        }),
        sfId
          ? fetchStorefrontStock(sfId, 1, itemsPerPage, undefined, "").then((res) => {
            if (res.success && res.data) {
              setAllStockItems(res.data);
              if (res.pagination) {
                setTotalPages(res.pagination.totalPages);
                setTotalItems(res.pagination.totalItems);
              }
            }
          })
          : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Error initializing edit order:", error);
      toast.error("Failed to load order data");
    } finally {
      setPageLoading(false);
    }
  };

  // Re-fetch stock items when search, category, or page changes
  const isInitialFilter = useRef(true);
  useEffect(() => {
    if (isInitialFilter.current) {
      isInitialFilter.current = false;
      return;
    }
    if (!storefrontId) return;

    loadStockItems(storefrontId);
  }, [search, selectedCategory, currentPage]);

  const loadStockItems = async (sfId: string) => {
    setStockLoading(true);
    try {
      const res = await fetchStorefrontStock(
        sfId,
        currentPage,
        itemsPerPage,
        selectedCategory === "All" ? undefined : selectedCategory,
        search,
      );
      if (res.success && res.data) {
        setAllStockItems(res.data);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalItems(res.pagination.totalItems);
        }
      }
    } catch (error) {
      console.error("Error loading stock:", error);
      toast.error("Failed to load products");
    } finally {
      setStockLoading(false);
    }
  };

  // Update shelf stock lookup map
  useEffect(() => {
    if (allStockItems && allStockItems.length > 0) {
      setShelfStockMap((prev) => {
        const next = { ...prev };
        allStockItems.forEach((item) => {
          const invId =
            typeof item.inventoryId === "object"
              ? item.inventoryId?._id
              : item.inventoryId;
          if (invId) {
            next[invId.toString()] = item.availableQuantity ?? item.quantity ?? 0;
          }
        });
        return next;
      });
    }
  }, [allStockItems]);

  // Cart operations & stock limit helpers
  const getInventoryIdStr = (item: StorefrontStockItem | string): string => {
    if (typeof item === "string") return item;
    const inv = item.inventoryId;
    if (!inv) return item._id;
    return typeof inv === "object" ? inv._id : String(inv);
  };

  const getShelfStock = (stockItem: StorefrontStockItem): number => {
    const invId = getInventoryIdStr(stockItem);
    if (invId in shelfStockMap) {
      return shelfStockMap[invId];
    }
    if (
      stockItem.availableQuantity !== undefined &&
      stockItem.availableQuantity !== 999999
    ) {
      return stockItem.availableQuantity;
    }
    if (stockItem.quantity !== undefined && stockItem.availableQuantity !== 999999) {
      return stockItem.quantity;
    }
    return 0;
  };

  // An item in an existing order can keep its original ordered quantity plus any extra available shelf stock
  const getMaxAllowedQty = (stockItem: StorefrontStockItem): number => {
    const invId = getInventoryIdStr(stockItem);
    const origQty = originalOrderQuantities[invId] || 0;
    const shelfAvailable = getShelfStock(stockItem);
    return origQty + Math.max(0, shelfAvailable);
  };

  const isSameItem = (a: StorefrontStockItem, b: StorefrontStockItem | string) => {
    if (typeof b === "string") {
      return (
        a._id === b ||
        a.inventoryId?._id === b ||
        (a.inventoryId as any)?.id === b
      );
    }
    return (
      a._id === b._id ||
      (a.inventoryId?._id &&
        b.inventoryId?._id &&
        a.inventoryId._id === b.inventoryId._id)
    );
  };

  const addToCart = (stockItem: StorefrontStockItem) => {
    const shelfStock = getShelfStock(stockItem);
    if (shelfStock <= 0 && (stockItem.availableQuantity ?? stockItem.quantity) <= 0) {
      toast.error(t("pos.outOfStock"));
      return;
    }

    const maxAvail = getMaxAllowedQty(stockItem);
    const existing = cart.find((item) => isSameItem(item.stockItem, stockItem));
    const currentQty = existing ? existing.qty : 0;

    if (currentQty + 1 > maxAvail) {
      toast.error(t("pos.cannotExceedStock"));
      return;
    }

    setCart((prev) => {
      if (existing) {
        return prev.map((item) =>
          isSameItem(item.stockItem, stockItem) ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { stockItem, qty: 1 }];
    });
  };

  const applyWholesaleTierQuantity = (stockItem: StorefrontStockItem, tierQuantity: number) => {
    const shelfStock = getShelfStock(stockItem);
    if (shelfStock <= 0 && (stockItem.availableQuantity ?? stockItem.quantity) <= 0) {
      toast.error(t("pos.outOfStock"));
      return;
    }

    const maxAvail = getMaxAllowedQty(stockItem);
    const parsedTierQty = Number(tierQuantity);
    if (!Number.isFinite(maxAvail) || maxAvail <= 0) {
      toast.error(t("pos.outOfStock"));
      return;
    }
    if (!Number.isFinite(parsedTierQty) || parsedTierQty <= 0) return;

    const requestedQty = Math.max(1, Math.floor(parsedTierQty));
    const finalQty = Math.min(requestedQty, maxAvail);

    if (requestedQty > maxAvail) {
      toast.error(t("pos.cannotExceedStock"));
    }

    setCart((prev) => {
      const existing = prev.find((item) => isSameItem(item.stockItem, stockItem));
      if (existing) {
        return prev.map((item) =>
          isSameItem(item.stockItem, stockItem) ? { ...item, qty: finalQty } : item
        );
      }
      return [...prev, { stockItem, qty: finalQty }];
    });
  };

  const updateQuantity = (stockItemId: string, newQty: number) => {
    const parsedQty = Math.floor(Number(newQty));
    if (isNaN(parsedQty) || parsedQty <= 0) {
      removeFromCart(stockItemId);
      return;
    }

    const targetItem = cart.find((i) => isSameItem(i.stockItem, stockItemId));
    if (!targetItem) return;

    const maxAvail = getMaxAllowedQty(targetItem.stockItem);
    if (parsedQty > maxAvail) {
      toast.error(t("pos.cannotExceedStock"));
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        isSameItem(item.stockItem, stockItemId) ? { ...item, qty: parsedQty } : item
      )
    );
  };

  const removeFromCart = (stockItemId: string) => {
    setCart((prev) => prev.filter((item) => !isSameItem(item.stockItem, stockItemId)));
  };

  // Wholesale Price Tier Helper
  const getItemPrice = (stockItem: StorefrontStockItem, qty: number): number => {
    const wholesalePrices = stockItem.inventoryId?.wholesalePrices;
    if (wholesalePrices && wholesalePrices.length > 0) {
      const sorted = [...wholesalePrices].sort((a, b) => b.quantity - a.quantity);
      const tier = sorted.find((wp) => qty >= wp.quantity);
      if (tier) return tier.price;
    }
    return stockItem.inventoryId?.sellingPrice || 0;
  };

  const getActiveWholesaleTier = (stockItem: StorefrontStockItem, qty: number) => {
    const wholesalePrices = stockItem.inventoryId?.wholesalePrices;
    if (!wholesalePrices || wholesalePrices.length === 0) return null;
    const sorted = [...wholesalePrices].sort((a, b) => b.quantity - a.quantity);
    return sorted.find((wp) => qty >= wp.quantity) || null;
  };

  // Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + getItemPrice(item.stockItem, item.qty) * item.qty,
    0
  );

  const combinedDiscountAmount = useMarkup
    ? 0
    : Math.round(((subtotal * discount) / 100) * 100) / 100;

  const total = useMarkup
    ? Math.max(0, subtotal + markupAmount)
    : Math.max(0, subtotal - combinedDiscountAmount);

  // Auto-sync paid amount for paid orders
  useEffect(() => {
    if (
      showCheckoutModal &&
      paymentType === "paid" &&
      paymentMethod !== PaymentMethod.FOC
    ) {
      setPaidAmount(Math.ceil(total));
    }
  }, [showCheckoutModal, total, paymentType, paymentMethod]);

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    const initialPaidAmount =
      paymentMethod === PaymentMethod.FOC
        ? 0
        : paymentType === "credit"
        ? (paidAmount || 0)
        : Math.ceil(total);
    setPaidAmount(initialPaidAmount);
    setShowCheckoutModal(true);
  };

  // Credit Customer Creation
  const handleAddCreditPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCreditPersonName.trim()) {
      toast.error(t("credits.nameRequired") || "Customer name is required");
      return;
    }
    if (!newCreditPersonPhone.trim()) {
      toast.error(t("credits.phoneRequired") || "Phone number is required");
      return;
    }

    setIsAddingCreditPerson(true);
    try {
      const res = await createCreditPersona({
        name: newCreditPersonName.trim(),
        phone: newCreditPersonPhone.trim() || undefined,
        address: newCreditPersonAddress.trim() || undefined,
      });

      if (res.success && res.data) {
        toast.success(t("credits.profileCreated") || "Customer created successfully");
        const refreshRes = await fetchCreditPersonas();
        if (refreshRes.success && refreshRes.data) {
          setCreditPersonas(refreshRes.data.filter((p) => !p.blacklist));
        }
        setSelectedCreditPersonId(res.data._id);
        setShowAddCreditPersonModal(false);
        setNewCreditPersonName("");
        setNewCreditPersonPhone("");
        setNewCreditPersonAddress("");
      } else {
        toast.error(res.message || "Failed to create customer");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create customer");
    } finally {
      setIsAddingCreditPerson(false);
    }
  };

  // Save changes handler
  const handleSaveOrder = async () => {
    if (cart.length === 0) {
      toast.error(t("pos.cartEmpty"));
      return;
    }

    if (paymentType === "credit" && !selectedCreditPersonId) {
      toast.error(t("pos.creditCustomerRequired"));
      return;
    }

    setIsProcessing(true);
    try {
      let finalPaidAmount = paidAmount;
      if (paymentType === "credit") {
        if (paidAmount < 0) {
          toast.error(t("pos.paidAmountInvalid"));
          setIsProcessing(false);
          return;
        }
        if (paidAmount > total) {
          toast.error(t("pos.paidAmountExceedsTotal"));
          setIsProcessing(false);
          return;
        }
      } else {
        finalPaidAmount = total;
      }

      const paymentMethodMap: Record<PaymentMethod, string> = {
        [PaymentMethod.CASH]: "cash",
        [PaymentMethod.KBZ_PAY]: "kpay",
        [PaymentMethod.WAVE_PAY]: "wavepay",
        [PaymentMethod.AYA_PAY]: "ayapay",
        [PaymentMethod.UAB_PAY]: "uabpay",
        [PaymentMethod.BANK_TRANSFER]: "bank_transfer",
        [PaymentMethod.NORMAL]: "normal",
        [PaymentMethod.HOT]: "hot",
        [PaymentMethod.FOC]: "foc",
        [PaymentMethod.MMQR]: "MMQR",
      };

      const payload = {
        storefrontId,
        ordersProducts: cart.map((item) => ({
          inventoryId: item.stockItem.inventoryId._id,
          quantity: item.qty,
          unitPrice: getItemPrice(item.stockItem, item.qty),
        })),
        subTotal: subtotal,
        discount: combinedDiscountAmount,
        finalAmount: total,
        paidAmount: finalPaidAmount,
        paymentType,
        note,
        paymentMethod: paymentMethodMap[paymentMethod],
        orderDate: new Date(createdAt).toISOString(),
        creditPersonId:
          selectedCreditPersonId && selectedCreditPersonId.trim() !== ""
            ? selectedCreditPersonId
            : null,
      };

      const result = await updateEntireOrder(orderId!, payload);
      if (result.success) {
        toast.success(isMy ? "ဘောင်ချာ အချက်အလက်များကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ" : "Order updated successfully");

        const orderNum = result.data?.orderNumber || order?.orderNumber || `INV-${Date.now()}`;
        const updatedCp =
          creditPersonas.find((cp) => cp._id === selectedCreditPersonId) ||
          (result.data?.creditPersonId && typeof result.data.creditPersonId === "object"
            ? (result.data.creditPersonId as any)
            : null) ||
          (order?.creditPersonId && typeof order.creditPersonId === "object"
            ? (order.creditPersonId as any)
            : null);

        const receiptData = {
          date: new Date().toISOString(),
          invoiceNumber: orderNum,
          storefrontName: storefrontName || "HONGCHI Myanmar",
          items: cart.map((i) => ({
            name: i.stockItem.inventoryId.productName,
            code: i.stockItem.inventoryId.productCode,
            qty: i.qty,
            price: getItemPrice(i.stockItem, i.qty),
          })),
          subtotal,
          discountPercent: discount,
          discountAmount: combinedDiscountAmount,
          total,
          paidAmount: finalPaidAmount,
          change: Math.max(0, finalPaidAmount - total),
          paymentMethod,
          note,
          serviceCharge: 0,
          tax: 0,
          receiptSequenceNumber:
            parseInt(orderNum?.split("/").pop() || "0", 10) || Date.now() % 10000,
          cashierName:
            JSON.parse(localStorage.getItem("adminData") || "{}").name || "Cashier",
          customerName: updatedCp?.name || "",
          customerPhone: updatedCp?.phone || "",
          customerAddress: updatedCp?.address || "",
        };

        const receiptId = `receipt_${receiptData.invoiceNumber}`;
        localStorage.setItem(receiptId, JSON.stringify(receiptData));

        setShowCheckoutModal(false);
        navigate("/orders");
      } else {
        toast.error(result.message || "Failed to update order");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update order");
    } finally {
      setIsProcessing(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#2216a8] mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            {isMy ? "ဘောင်ချာ အချက်အလက်များ ခေါ်ယူနေပါသည်..." : "Loading order details..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#f5f5f3] p-2 sm:p-4 gap-4 overflow-hidden select-none">
      {/* Left Section: Catalog & Filter */}
      <div className="flex-1 bg-white border border-gray-200/50 rounded-3xl p-4 lg:p-6 shadow-sm flex flex-col overflow-hidden">
        {/* Top Header: Back button, Order info, Storefront, Date */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/orders")}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors cursor-pointer"
              title="Back to Orders"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">
                  {isMy ? "ဘောင်ချာ ပြင်ဆင်ခြင်း" : "Edit Order"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2216a8]/10 text-[#2216a8]">
                  {order?.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isMy ? "ပစ္စည်း အရေအတွက်၊ ဈေးနှုန်းနှင့် အချက်အလက်များ အသစ်ပြန်ပြင်ပါ" : "Modify products, quantities, prices, or payment details"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-semibold text-[#2216a8]">
              <Store className="w-3.5 h-3.5" />
              <span>{storefrontName}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-xs"
              />
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("pos.searchPlaceholder") || "Search products by code or name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("All")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === "All"
                  ? "bg-[#2216a8] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t("pos.all") || "All"}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? "bg-[#2216a8] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {stockLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-[#2216a8] mb-2" />
              <p className="text-xs text-slate-400 font-medium">Loading products...</p>
            </div>
          ) : allStockItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-slate-400 font-medium">No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {allStockItems.map((item) => {
                const shelfStock = getShelfStock(item);
                const maxAllowed = getMaxAllowedQty(item);
                const isOutOfStock = maxAllowed <= 0;
                const wholesaleTiers = item.inventoryId?.wholesalePrices || [];

                return (
                  <div
                    key={item._id}
                    onClick={() => !isOutOfStock && addToCart(item)}
                    className={`bg-white border rounded-2xl p-3 flex flex-col justify-between transition-all cursor-pointer relative group ${
                      isOutOfStock
                        ? "opacity-60 border-slate-200 bg-slate-50/50 cursor-not-allowed"
                        : "border-slate-200/80 hover:border-[#2216a8] hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[11px] font-bold text-[#2216a8] truncate">
                          {item.inventoryId?.productCode}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            shelfStock > 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {shelfStock > 0 ? `Stock: ${shelfStock}` : "Out"}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 mb-2">
                        {item.inventoryId?.productName}
                      </h4>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-900">
                          {item.inventoryId?.sellingPrice?.toLocaleString()} MMK
                        </span>
                        {wholesaleTiers.length > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveWholesalePopoverId(
                                activeWholesalePopoverId === item._id ? null : item._id
                              );
                            }}
                            className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-amber-100"
                          >
                            Wholesale
                          </span>
                        )}
                      </div>

                      {/* Wholesale Popover */}
                      {activeWholesalePopoverId === item._id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-full left-0 mb-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-30 animate-in fade-in"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-800">Wholesale Tiers</span>
                            <button
                              onClick={() => setActiveWholesalePopoverId(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {wholesaleTiers.map((tier, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  applyWholesaleTierQuantity(item, tier.quantity);
                                  setActiveWholesalePopoverId(null);
                                }}
                                className="flex items-center justify-between p-1.5 text-xs rounded hover:bg-slate-50 cursor-pointer font-medium"
                              >
                                <span className="text-slate-600">≥ {tier.quantity} pcs</span>
                                <span className="text-[#2216a8] font-bold">
                                  {tier.price.toLocaleString()} MMK
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Catalog Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalItems} items)
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded border hover:bg-slate-50 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded border hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Section: Order Cart (Desktop) */}
      <div className="hidden lg:flex w-[420px] bg-white border border-gray-200/50 rounded-3xl p-5 shadow-sm flex-col justify-between overflow-hidden">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#2216a8]" />
            <h3 className="font-bold text-slate-800 text-base">
              {isMy ? "အော်ဒါ ပစ္စည်းများ" : "Order Cart"}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#2216a8]/10 text-[#2216a8]">
              {cart.reduce((s, i) => s + i.qty, 0)} pcs
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              {isMy ? "အားလုံး ဖျက်မည်" : "Clear All"}
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs font-medium">
              <ShoppingCart className="w-10 h-10 text-slate-200 mb-2" />
              <span>{isMy ? "Cart ထဲတွင် ပစ္စည်းမရှိသေးပါ" : "No items in cart"}</span>
            </div>
          ) : (
            cart.map((item) => {
              const itemPrice = getItemPrice(item.stockItem, item.qty);
              const wholesaleTier = getActiveWholesaleTier(item.stockItem, item.qty);
              const maxAvail = getMaxAllowedQty(item.stockItem);

              return (
                <div
                  key={item.stockItem._id}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#2216a8]">
                        {item.stockItem.inventoryId?.productCode}
                      </span>
                      {wholesaleTier && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                          Wholesale
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-slate-800 truncate">
                      {item.stockItem.inventoryId?.productName}
                    </h5>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {itemPrice.toLocaleString()} MMK
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.stockItem._id, item.qty - 1)}
                      className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateQuantity(item.stockItem._id, Number(e.target.value))}
                      className="w-10 text-center font-bold text-xs bg-white border border-slate-200 rounded py-0.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => updateQuantity(item.stockItem._id, item.qty + 1)}
                      disabled={item.qty >= maxAvail}
                      className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.stockItem._id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Summary & Checkout Button */}
        <div className="mt-auto pt-4 border-t border-gray-100 bg-white space-y-4">
          <div className="border border-gray-200/80 rounded-2xl p-4 bg-white space-y-2.5">
            <div className="flex justify-between text-sm text-gray-500 font-medium">
              <span>{t("pos.items") || (isMy ? "ပစ္စည်း အရေအတွက်" : "Items")}</span>
              <span>
                {cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)}{" "}
                {t("pos.itemsLower") || "items"}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-base font-bold text-gray-700">{t("common.total") || (isMy ? "စုစုပေါင်း" : "Total")}</span>
              <span className="text-lg font-black text-[#2216a8]">{subtotal.toLocaleString()} MMK</span>
            </div>
            {selectedCreditPersonId && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-gray-500 font-medium flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#2216a8]" />
                  {isMy ? "ဝယ်သူ" : "Customer"}:
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[180px]">
                  {creditPersonas.find((cp) => cp._id === selectedCreditPersonId)?.name ||
                    (typeof order?.creditPersonId === "object" ? order.creditPersonId?.name : "") ||
                    "Selected"}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={cart.length === 0}
            className="w-full bg-[#2216a8] hover:bg-indigo-900 text-white py-3.5 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{t("pos.proceedToCheckout") || (isMy ? "ငွေရှင်းရန် / ပြင်ဆင်ရန် ဆက်သွားမည်" : "Proceed to Checkout")}</span>
          </button>
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowMobileCart(true)}
            className="bg-[#2216a8] text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>
              {cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)} |{" "}
              {subtotal.toLocaleString()} MMK
            </span>
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer */}
      {showMobileCart && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#2216a8]" />
                <h3 className="font-bold text-slate-800 text-base">
                  {isMy ? "အော်ဒါ ပစ္စည်းများ" : "Order Cart"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#2216a8]/10 text-[#2216a8]">
                  {cart.reduce((s, i) => s + i.qty, 0)} pcs
                </span>
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {cart.map((item) => {
                const itemPrice = getItemPrice(item.stockItem, item.qty);
                const wholesaleTier = getActiveWholesaleTier(item.stockItem, item.qty);
                const maxAvail = getMaxAllowedQty(item.stockItem);

                return (
                  <div
                    key={item.stockItem._id}
                    className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-[#2216a8]">
                          {item.stockItem.inventoryId?.productCode}
                        </span>
                        {wholesaleTier && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                            Wholesale
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs font-semibold text-slate-800 truncate">
                        {item.stockItem.inventoryId?.productName}
                      </h5>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {itemPrice.toLocaleString()} MMK
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.stockItem._id, item.qty - 1)}
                        className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateQuantity(item.stockItem._id, Number(e.target.value))}
                        className="w-10 text-center font-bold text-xs bg-white border border-slate-200 rounded py-0.5 outline-none"
                      />
                      <button
                        onClick={() => updateQuantity(item.stockItem._id, item.qty + 1)}
                        disabled={item.qty >= maxAvail}
                        className="p-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.stockItem._id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-700">{t("common.total") || "Total"}</span>
                <span className="text-lg font-black text-[#2216a8]">{subtotal.toLocaleString()} MMK</span>
              </div>
              {selectedCreditPersonId && (
                <div className="flex justify-between items-center text-xs py-1 px-2.5 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                  <span className="text-gray-500 flex items-center gap-1 font-medium">
                    <User className="w-3.5 h-3.5 text-[#2216a8]" />
                    {isMy ? "ဝယ်သူ" : "Customer"}:
                  </span>
                  <span className="font-bold text-slate-800">
                    {creditPersonas.find((cp) => cp._id === selectedCreditPersonId)?.name ||
                      (typeof order?.creditPersonId === "object" ? order.creditPersonId?.name : "") ||
                      "Selected"}
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  setShowMobileCart(false);
                  handleProceedToCheckout();
                }}
                disabled={cart.length === 0}
                className="w-full bg-[#2216a8] hover:bg-[#1b1187] text-white py-3.5 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{t("pos.proceedToCheckout") || (isMy ? "ငွေရှင်းရန် / ပြင်ဆင်ရန် ဆက်သွားမည်" : "Proceed to Checkout")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md sm:mx-4 max-h-[100vh] sm:max-h-[90vh] overflow-hidden flex flex-col border border-slate-100">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-[#2216a8]/5">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">
                  {t("pos.checkout") || (isMy ? "ဘောင်ချာ အချက်အလက်များ ပြင်ဆင်ရန်" : "Order Checkout")}
                </h3>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-1.5 hover:bg-slate-200/50 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <p className="text-sm font-semibold text-slate-400 mt-1">
                {cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)}{" "}
                {t("pos.itemsLower") || "items"} • {subtotal.toLocaleString()} MMK
              </p>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {/* Payment Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {t("pos.paymentType") || "Payment Type"}
                </label>
                <select
                  className="payment-type-select w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all"
                  value={paymentType}
                  onChange={(e) => {
                    const newType = e.target.value as "paid" | "credit";
                    setPaymentType(newType);
                    if (newType === "paid") {
                      setPaymentMethod(PaymentMethod.CASH);
                      setPaidAmount(Math.ceil(total));
                    } else if (newType === "credit") {
                      setPaymentMethod(PaymentMethod.CASH);
                      setPaidAmount(0);
                    }
                  }}
                >
                  <option value="paid">{t("pos.paid") || (isMy ? "ငွေရှင်းပြီး (Paid)" : "Paid")}</option>
                  <option value="credit">{t("pos.credit") || (isMy ? "အကြွေး (Credit)" : "Credit")}</option>
                </select>
              </div>

              {/* Order Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {t("pos.orderDate") || "Order Date"}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Credit Person Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {t("pos.selectCreditPerson") || "Select Credit Customer"}
                  {paymentType === "credit" && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <select
                      className="w-full pl-9 pr-4 py-2.5 border border-indigo-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none bg-indigo-50/20 transition-all"
                      value={selectedCreditPersonId}
                      onChange={(e) => setSelectedCreditPersonId(e.target.value)}
                    >
                      <option value="">
                        {creditPersonas.length === 0
                          ? `-- ${t("pos.noCreditPersons") || "No credit customers"} --`
                          : `-- ${t("pos.selectCreditPersonOptional") || "Select Credit Customer"} --`}
                      </option>
                      {creditPersonas.map((persona) => (
                        <option key={persona._id} value={persona._id}>
                          {persona.name} - {persona.phone}
                          {persona.address ? ` - ${persona.address}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCreditPersonName("");
                      setNewCreditPersonPhone("");
                      setNewCreditPersonAddress("");
                      setShowAddCreditPersonModal(true);
                    }}
                    className="px-4 py-2 bg-[#2216a8] hover:bg-[#2216a8]/90 text-white rounded-full transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {t("pos.addCreditPerson") || "+ New"}
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {t("pos.paymentMethod") || "Payment Method"}
                </label>
                <select
                  className="payment-method-select w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all"
                  value={paymentMethod}
                  onChange={(e) => {
                    const newMethod = e.target.value as PaymentMethod;
                    setPaymentMethod(newMethod);
                    if (newMethod === PaymentMethod.FOC) {
                      setPaidAmount(0);
                    }
                  }}
                >
                  <option value={PaymentMethod.CASH}>{t("pos.cash") || "Cash"}</option>
                  <option value={PaymentMethod.KBZ_PAY}>{t("pos.kbzPay") || "KBZPay"}</option>
                  <option value={PaymentMethod.WAVE_PAY}>{t("pos.wavePay") || "WavePay"}</option>
                  <option value={PaymentMethod.AYA_PAY}>{t("pos.ayaPay") || "AYA Pay"}</option>
                  <option value={PaymentMethod.UAB_PAY}>{t("pos.uabPay") || "UAB Pay"}</option>
                  <option value={PaymentMethod.BANK_TRANSFER}>{t("pos.bankTransfer") || "Bank Transfer"}</option>
                  <option value={PaymentMethod.MMQR}>MMQR</option>
                  <option value={PaymentMethod.NORMAL}>Normal</option>
                  <option value={PaymentMethod.HOT}>Hot</option>
                  <option value={PaymentMethod.FOC}>FOC</option>
                </select>
              </div>

              {/* Discount/Markup Toggle */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2">
                  Pricing Option
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer font-semibold text-slate-600">
                    <input
                      type="radio"
                      name="pricingOption"
                      checked={!useMarkup}
                      onChange={() => setUseMarkup(false)}
                      className="mr-2 accent-[#2216a8]"
                    />
                    <span className="text-sm">Discount</span>
                  </label>
                  <label className="flex items-center cursor-pointer font-semibold text-slate-600">
                    <input
                      type="radio"
                      name="pricingOption"
                      checked={useMarkup}
                      onChange={() => setUseMarkup(true)}
                      className="mr-2 accent-[#2216a8]"
                    />
                    <span className="text-sm">Markup</span>
                  </label>
                </div>
              </div>

              {/* Discount */}
              {!useMarkup && (
                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-1.5 flex items-center">
                    {t("pos.discount") || "Discount"} (%)
                    <button
                      type="button"
                      onClick={() => setShowDiscountCalculator(true)}
                      className="ml-2 text-[#2216a8] hover:text-[#2216a8]/80 transition-colors cursor-pointer"
                      title="Calculate discount percentage"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="discount-input w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all"
                    value={discount === 0 ? "" : discount}
                    onChange={(e) => setDiscount(e.target.value === "" ? 0 : Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              )}

              {/* Markup */}
              {useMarkup && (
                <div>
                  <label className="block text-sm font-semibold text-slate-500 mb-1.5 flex items-center">
                    Markup Amount (MMK)
                    <button
                      type="button"
                      onClick={() => setShowMarkupCalculator(true)}
                      className="ml-2 text-[#2216a8] hover:text-[#2216a8]/80 transition-colors cursor-pointer"
                      title="Calculate markup"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all"
                    value={markupAmount === 0 ? "" : markupAmount}
                    onChange={(e) => setMarkupAmount(e.target.value === "" ? 0 : Number(e.target.value))}
                    placeholder="0"
                  />
                </div>
              )}

              {/* Paid Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {paymentMethod === PaymentMethod.FOC
                    ? `${t("pos.paidAmount") || "Paid Amount"} (MMK) - ${t("pos.focMessage") || "Free of Charge"}`
                    : `${t("pos.paidAmount") || "Paid Amount"} (MMK)`}
                  {paymentType === "paid" && paymentMethod !== PaymentMethod.FOC && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={paymentMethod === PaymentMethod.FOC}
                  className={`w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all ${
                    paymentMethod === PaymentMethod.FOC ? "bg-slate-100 cursor-not-allowed" : ""
                  }`}
                  value={
                    paymentMethod === PaymentMethod.FOC
                      ? 0
                      : paidAmount === 0
                      ? ""
                      : paidAmount
                  }
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : Number(e.target.value);
                    setPaidAmount(Math.ceil(value));
                  }}
                  placeholder={
                    paymentMethod === PaymentMethod.FOC
                      ? "0"
                      : t("pos.enterPaidAmount") || "0"
                  }
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {t("pos.note") || "Note"} ({t("common.optional") || "optional"})
                </label>
                <input
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("pos.notePlaceholder") || "Enter note..."}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-sm font-semibold text-slate-600">
                  <span>{t("common.subtotal") || "Subtotal"}</span>
                  <span>{subtotal.toLocaleString()} MMK</span>
                </div>
                {!useMarkup && discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span>
                      {t("common.discount") || "Discount"} ({discount}%)
                    </span>
                    <span>-{combinedDiscountAmount.toLocaleString()} MMK</span>
                  </div>
                )}
                {useMarkup && markupAmount > 0 && (
                  <div className="flex justify-between text-sm text-[#2216a8] font-semibold">
                    <span>Markup Amount</span>
                    <span>+{markupAmount.toLocaleString()} MMK</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-800 pt-2.5 border-t border-slate-150">
                  <span>{t("common.total") || "Total"}</span>
                  <span>{total.toLocaleString()} MMK</span>
                </div>
                {paidAmount > 0 && paidAmount >= total && paymentType === "paid" && (
                  <div className="change-display-row flex justify-between text-sm text-green-600 font-bold">
                    <span>{t("common.change") || "Change"}</span>
                    <span>{(paidAmount - total).toLocaleString()} MMK</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
              <button
                onClick={() => {
                  handleSaveOrder();
                }}
                disabled={
                  cart.length === 0 ||
                  isProcessing ||
                  (paymentType === "paid" && paidAmount < total && paymentMethod !== PaymentMethod.FOC) ||
                  (paymentType === "credit" && !selectedCreditPersonId) ||
                  (paymentType === "credit" && paidAmount > total)
                }
                className="complete-sale-btn w-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white py-3 rounded-full font-semibold transition-all shadow-md shadow-indigo-600/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    {t("pos.processing") || "Processing..."}
                  </>
                ) : (
                  <>
                    {isMy ? "ပြင်ဆင်မှု သိမ်းဆည်းမည်" : "Save Changes"} • {total.toLocaleString()} MMK
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-full py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all text-sm font-semibold cursor-pointer"
              >
                {t("common.cancel") || "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markup Calculator Modal */}
      {showMarkupCalculator && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#2216a8]" />
                Fixed Amount Markup
              </h2>
              <button
                onClick={() => setShowMarkupCalculator(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Current Subtotal</p>
                <p className="text-xl font-bold text-slate-800">
                  {subtotal.toLocaleString()} MMK
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Markup Amount (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] outline-none"
                  placeholder="Enter markup amount..."
                  value={markupAmount === 0 ? "" : markupAmount}
                  onChange={(e) => setMarkupAmount(Number(e.target.value))}
                />
              </div>

              {markupAmount > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Markup Amount:</span>
                    <span className="font-bold text-blue-700">
                      {Number(markupAmount).toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Percentage:</span>
                    <span className="font-bold text-blue-700">
                      {subtotal > 0 ? ((Number(markupAmount) / subtotal) * 100).toFixed(2) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-blue-200">
                    <span className="text-slate-600 font-bold">Final Total:</span>
                    <span className="font-bold text-slate-800">
                      {(subtotal + Number(markupAmount)).toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setShowMarkupCalculator(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (markupAmount > 0) {
                      setShowMarkupCalculator(false);
                      toast.success(`Markup set to ${Number(markupAmount).toLocaleString()} MMK`);
                    }
                  }}
                  disabled={!markupAmount || Number(markupAmount) <= 0}
                  className="px-4 py-2 bg-[#2216a8] hover:bg-[#1b1187] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Apply Markup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discount Calculator Modal */}
      {showDiscountCalculator && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#2216a8]" />
                Discount Calculator
              </h2>
              <button
                onClick={() => {
                  setShowDiscountCalculator(false);
                  setDiscountAmountInput("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Current Subtotal</p>
                <p className="text-xl font-bold text-slate-800">
                  {subtotal.toLocaleString()} MMK
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Discount Amount (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  className="w-full border rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] outline-none"
                  placeholder="Enter discount amount..."
                  value={discountAmountInput}
                  onChange={(e) => setDiscountAmountInput(e.target.value)}
                />
              </div>

              {discountAmountInput && Number(discountAmountInput) > 0 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Discount Amount:</span>
                    <span className="font-bold text-green-700">
                      {Number(discountAmountInput).toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Percentage:</span>
                    <span className="font-bold text-green-700">
                      {subtotal > 0
                        ? ((Number(discountAmountInput) / subtotal) * 100).toFixed(2)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-green-200">
                    <span className="text-slate-600 font-bold">Final Total:</span>
                    <span className="font-bold text-slate-800">
                      {Math.max(0, subtotal - Number(discountAmountInput)).toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => {
                    setShowDiscountCalculator(false);
                    setDiscountAmountInput("");
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (discountAmountInput && Number(discountAmountInput) > 0) {
                      const calculatedPercentage =
                        (Number(discountAmountInput) / subtotal) * 100;
                      setDiscount(Number(calculatedPercentage.toFixed(2)));
                      setShowDiscountCalculator(false);
                      setDiscountAmountInput("");
                    }
                  }}
                  disabled={
                    !discountAmountInput ||
                    Number(discountAmountInput) <= 0 ||
                    Number(discountAmountInput) > subtotal
                  }
                  className="px-4 py-2 bg-[#2216a8] hover:bg-[#1b1187] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Credit Person Modal */}
      {showAddCreditPersonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 bg-[#2216a8]/5">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800">
                  {t("pos.addCreditPerson") || "Add Credit Person"}
                </h3>
                <button
                  onClick={() => setShowAddCreditPersonModal(false)}
                  className="p-1.5 hover:bg-slate-200/50 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {t("credits.name") || "Name"} *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all"
                  value={newCreditPersonName}
                  onChange={(e) => setNewCreditPersonName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {t("credits.phone") || "Phone"} *
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all"
                  value={newCreditPersonPhone}
                  onChange={(e) => setNewCreditPersonPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {t("credits.address") || "Address"}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all"
                  value={newCreditPersonAddress}
                  onChange={(e) => setNewCreditPersonAddress(e.target.value)}
                  placeholder="Enter address (optional)"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3 bg-slate-50/50">
              <button
                onClick={() => setShowAddCreditPersonModal(false)}
                className="flex-1 px-4 py-2.5 border border-indigo-200 rounded-full text-sm font-semibold text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all cursor-pointer"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={async () => {
                  if (!newCreditPersonName.trim()) {
                    toast.error(t("credits.nameRequired") || "Name is required");
                    return;
                  }
                  if (!newCreditPersonPhone.trim()) {
                    toast.error(t("credits.phoneRequired") || "Phone number is required");
                    return;
                  }
                  setIsAddingCreditPerson(true);
                  try {
                    const result = await createCreditPersona({
                      name: newCreditPersonName.trim(),
                      phone: newCreditPersonPhone.trim(),
                      address: newCreditPersonAddress.trim() || undefined,
                    });
                    if (result.success && result.data) {
                      toast.success(t("credits.profileCreated") || "Customer created successfully");
                      const refreshRes = await fetchCreditPersonas();
                      if (refreshRes.success && refreshRes.data) {
                        setCreditPersonas(refreshRes.data.filter((p) => !p.blacklist));
                      }
                      setSelectedCreditPersonId(result.data._id);
                      setShowAddCreditPersonModal(false);
                      setNewCreditPersonName("");
                      setNewCreditPersonPhone("");
                      setNewCreditPersonAddress("");
                    } else {
                      toast.error(result.message || "Failed to create customer");
                    }
                  } catch (err: any) {
                    toast.error(err.message || "Failed to create customer");
                  } finally {
                    setIsAddingCreditPerson(false);
                  }
                }}
                disabled={isAddingCreditPerson}
                className="flex-1 px-4 py-2.5 bg-[#2216a8] hover:bg-[#2216a8]/90 text-white rounded-full text-sm font-semibold transition-all shadow-md shadow-indigo-600/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isAddingCreditPerson ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    {t("credits.creating") || "Creating..."}
                  </>
                ) : (
                  t("credits.createProfile") || "Create Profile"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
