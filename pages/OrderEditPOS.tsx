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
  Edit,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { getSavedPrintPaperSize } from "../utils/printPaperSize";
import { detectDevice } from "../utils/deviceDetect";
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
        const cpId =
          typeof ord.creditPersonId === "object"
            ? ord.creditPersonId._id
            : ord.creditPersonId;
        setSelectedCreditPersonId(cpId || "");
      }

      // 2. Fetch parallel prerequisites: Categories, Credit Personas, Stock Items for storefront
      await Promise.all([
        fetchCategories().then((res) => {
          if (res.success && res.data) setCategories(res.data);
        }),
        fetchCreditPersonas().then((res) => {
          if (res.success && res.data) {
            setCreditPersonas(res.data.filter((p) => !p.blacklist));
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

  // Wholesale click outside listener
  useEffect(() => {
    const handleClickOutsideWholesale = (event: MouseEvent) => {
      if (!activeWholesalePopoverId) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const container = target.closest(
        `[data-wholesale-container="${activeWholesalePopoverId}"]`
      );
      if (!container) setActiveWholesalePopoverId(null);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveWholesalePopoverId(null);
    };

    document.addEventListener("mousedown", handleClickOutsideWholesale);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideWholesale);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeWholesalePopoverId]);

  // Keep shelfStockMap in sync with fetched stock items
  useEffect(() => {
    if (allStockItems.length > 0) {
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

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (isSameItem(item.stockItem, id)) {
          const maxAvail = getMaxAllowedQty(item.stockItem);
          const newQty = item.qty + delta;
          if (delta > 0 && newQty > maxAvail) {
            toast.error(t("pos.cannotExceedStock"));
            return item;
          }
          if (newQty < 1) return item;
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const setQty = (id: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (isSameItem(item.stockItem, id)) {
          if (newQty < 1) return { ...item, qty: 1 };
          const maxAvail = getMaxAllowedQty(item.stockItem);
          if (newQty > maxAvail) {
            toast.error(t("pos.cannotExceedStock"));
            return { ...item, qty: maxAvail };
          }
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => !isSameItem(item.stockItem, id)));
  };

  const getSortedWholesaleTiers = (item: StorefrontStockItem) =>
    (item.inventoryId.wholesalePrices || [])
      .slice()
      .sort((a, b) => a.quantity - b.quantity);

  // Price & Total Calculation
  const getItemPrice = (item: StorefrontStockItem, qty: number = 1) => {
    const basePrice = item.inventoryId.sellingPrice || 0;
    const wholesaleTiers = item.inventoryId.wholesalePrices || [];
    if (wholesaleTiers.length === 0) return basePrice;

    const eligibleTier = wholesaleTiers
      .slice()
      .sort((a, b) => a.quantity - b.quantity)
      .filter((tier) => qty >= tier.quantity)
      .pop();

    return eligibleTier?.price ?? basePrice;
  };

  const getSafeQty = (qty: number) =>
    Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;

  const subtotal = cart.reduce((sum, item) => {
    const qty = getSafeQty(item.qty);
    return sum + getItemPrice(item.stockItem, qty || 1) * qty;
  }, 0);

  const totalAfterDiscount = Math.round(
    subtotal * (1 - (Number(discount) || 0) / 100)
  );
  const totalAfterMarkup = subtotal + markupAmount;
  const total = useMarkup ? totalAfterMarkup : totalAfterDiscount;
  const combinedDiscountAmount = useMarkup
    ? 0
    : Math.round(subtotal - totalAfterDiscount);

  // Auto-sync paid amount when total changes and payment is full paid
  useEffect(() => {
    if (
      showCheckoutModal &&
      paymentType === "paid" &&
      paymentMethod !== PaymentMethod.FOC
    ) {
      setPaidAmount(Math.ceil(total));
    }
  }, [showCheckoutModal, total, paymentType, paymentMethod]);

  // Submit Order Update
  const handleUpdateOrder = async () => {
    if (!orderId || cart.length === 0) return;

    if (
      paymentType === "paid" &&
      paymentMethod !== PaymentMethod.FOC &&
      paidAmount < total
    ) {
      toast.error(t("pos.paidAmountError"));
      return;
    }

    const finalPaidAmount =
      paymentMethod === PaymentMethod.FOC ? 0 : paidAmount;

    setIsProcessing(true);
    try {
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
        })),
        subTotal: subtotal,
        discount: combinedDiscountAmount,
        finalAmount: total,
        paidAmount: finalPaidAmount,
        paymentType,
        note,
        paymentMethod: paymentMethodMap[paymentMethod],
        orderDate: new Date(createdAt).toISOString(),
        ...(selectedCreditPersonId ? { creditPersonId: selectedCreditPersonId } : {}),
      };

      const result = await updateEntireOrder(orderId, payload);
      if (result.success) {
        toast.success("ဘောင်ချာ အချက်အလက်များကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ");

        const orderNum = result.data?.orderNumber || order?.orderNumber || `INV-${Date.now()}`;
        const receiptData = {
          date: new Date().toISOString(),
          invoiceNumber: orderNum,
          storefrontName: "HONGCHI Myanmar",
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
          change: finalPaidAmount - total,
          paymentMethod,
          note,
          serviceCharge: 0,
          tax: 0,
          receiptSequenceNumber:
            parseInt(orderNum?.split("/").pop() || "0", 10) || Date.now() % 10000,
          cashierName:
            JSON.parse(localStorage.getItem("adminData") || "{}").name || "Cashier",
          customerName:
            creditPersonas.find((cp) => cp._id === selectedCreditPersonId)?.name || "",
          customerPhone:
            creditPersonas.find((cp) => cp._id === selectedCreditPersonId)?.phone || "",
          customerAddress:
            creditPersonas.find((cp) => cp._id === selectedCreditPersonId)?.address || "",
        };

        const receiptId = `receipt_${receiptData.invoiceNumber}`;
        localStorage.setItem(receiptId, JSON.stringify(receiptData));

        const device = detectDevice();
        if (device.isAndroid || device.isIOS) {
          navigate(`/mobile-print/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}`);
        } else {
          navigate(`/print-receipt/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}&autoprint=1`);
        }
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
          <p className="text-slate-600 font-medium">ဘောင်ချာ အချက်အလက်များ ခေါ်ယူနေပါသည်...</p>
        </div>
      </div>
    );
  }

  const filteredProducts = allStockItems.filter(
    (item) => item.inventoryId?._id !== "69a15d55218ec5ff9a3fe4a3"
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] overflow-hidden gap-3 bg-transparent">
      {/* Top Banner: Edit Mode */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-sm flex-shrink-0 pr-14 lg:pr-5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 flex-shrink-0">
            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-bold text-amber-900 text-sm sm:text-base leading-tight">
                {isMy ? "ဘောင်ချာ ပြင်ဆင်နေသည်" : "Editing Order"}
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-amber-200/70 text-amber-900 font-mono font-bold text-xs">
                {order?.orderNumber}
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium text-xs">
                {storefrontName}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5 line-clamp-1 sm:line-clamp-none">
              {isMy
                ? "ပစ္စည်းများ၊ အရေအတွက်၊ စျေးနှုန်း၊ Customer နှင့် ငွေပေးချေမှုများကို POS မျက်နှာပြင်တွင် တိုက်ရိုက်ပြင်ဆင်ပြီး သိမ်းဆည်းနိုင်ပါသည်။"
                : "Modify products, quantities, prices, customer, and payments directly on the POS screen."}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl border border-amber-300 text-amber-800 bg-white hover:bg-amber-100 transition-colors text-xs font-semibold shadow-sm cursor-pointer flex-shrink-0 ml-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="whitespace-nowrap">{isMy ? "မပြင်တော့ပါ" : "Cancel Edit"}</span>
        </button>
      </div>

      {/* Main Container: Product Grid + Cart Sidebar */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden gap-4 bg-transparent min-h-0">
        {/* Product Grid */}
        <div className="flex-1 bg-white border border-gray-200/50 rounded-3xl p-4 lg:p-6 shadow-sm flex flex-col overflow-hidden">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-[#1f2937] tracking-tight flex items-center gap-2">
              <Edit className="w-6 h-6 text-amber-600" />
              <span>{isMy ? "ဘောင်ချာ အချက်အလက် ပြင်ဆင်ခြင်း" : "Edit Order Information"}</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              {isMy
                ? `Order #${order?.orderNumber} အား ပြင်ဆင်ပြီးပါက Update Order နှိပ်ပါ`
                : `Save changes for Order #${order?.orderNumber} by clicking Update Order`}
            </p>
          </div>

          {/* Search & Category */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none" />
                <Scan className="absolute right-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none opacity-50" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-10 py-2.5 border border-dark-200 rounded-3xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  autoFocus
                />
              </div>

              <select
                className="w-full font-bold sm:w-auto border border-dark-200 rounded-3xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="All">{t("pos.allCategories")}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-3xl border border-dark-200 bg-slate-50 text-slate-700 text-sm font-bold shadow-sm">
                <Store className="w-4 h-4 text-primary" />
                <span className="max-w-[120px] truncate">{storefrontName}</span>
              </div>
            </div>
          </div>

          {/* Product Count & Pagination */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
            <div className="text-xs sm:text-sm text-gray-500 font-medium">
              {t("pos.showingProducts")
                ? t("pos.showingProducts").replace("{count}", filteredProducts.length.toString())
                : `Showing ${filteredProducts.length} products`}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="First Page"
                >
                  <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
                >
                  {t("common.previous") || "Prev"}
                </button>
                <span className="text-xs font-bold px-2 text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
                >
                  {t("common.next") || "Next"}
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Last Page"
                >
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </div>
            )}
          </div>

          {/* Product Items List */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-1">
            {stockLoading ? (
              <div className="col-span-full flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-16 text-slate-400 font-medium">
                {t("pos.noProductsFound")}
              </div>
            ) : (
              filteredProducts.map((stockItem) => {
                const isOutOfStock = (stockItem.availableQuantity ?? stockItem.quantity) <= 0;
                const hasWholesale =
                  stockItem.inventoryId.wholesalePrices &&
                  stockItem.inventoryId.wholesalePrices.length > 0;

                return (
                  <div
                    key={stockItem._id}
                    onClick={() => {
                      if (isOutOfStock) return;
                      addToCart(stockItem);
                    }}
                    className={`bg-white border rounded-2xl p-3 sm:p-4 shadow-sm transition-all flex flex-col justify-between ${
                      isOutOfStock
                        ? "opacity-50 grayscale pointer-events-none cursor-not-allowed border-slate-200"
                        : "cursor-pointer hover:shadow-lg hover:border-primary hover:scale-[1.01] border-slate-200"
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-2">
                        {stockItem.inventoryId.productName}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-mono">
                        {stockItem.inventoryId.productCode}
                      </p>
                      <p className="text-[10px] sm:text-xs mt-1 text-slate-500">
                        {stockItem.inventoryId.category || "General"}
                      </p>
                      <span
                        className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? "bg-red-100 text-red-600"
                            : (stockItem.availableQuantity ?? stockItem.quantity) <= 5
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isOutOfStock
                          ? t("pos.outOfStock") || "Out of stock"
                          : `Qty: ${stockItem.availableQuantity ?? stockItem.quantity}`}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-black text-[#2216a8] text-xs sm:text-sm">
                          {getItemPrice(stockItem).toLocaleString()} MMK
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasWholesale && (
                          <div
                            className="relative"
                            data-wholesale-container={stockItem._id}
                          >
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveWholesalePopoverId((prev) =>
                                  prev === stockItem._id ? null : stockItem._id
                                );
                              }}
                              className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Wholesale
                            </button>

                            {activeWholesalePopoverId === stockItem._id && (
                              <div
                                className="absolute right-0 bottom-8 z-30 w-52 bg-white border border-gray-200 rounded-xl shadow-xl p-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-[11px] font-semibold text-slate-600 mb-2">
                                  Wholesale prices
                                </div>
                                <div className="grid grid-cols-2 text-[11px] font-semibold text-slate-500 pb-1">
                                  <span>Quantity</span>
                                  <span className="text-right">Price</span>
                                </div>
                                <div className="border-t border-slate-200">
                                  {getSortedWholesaleTiers(stockItem).map((tier) => (
                                    <button
                                      type="button"
                                      key={tier._id || `${tier.quantity}-${tier.price}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        applyWholesaleTierQuantity(stockItem, Number(tier.quantity));
                                        setActiveWholesalePopoverId(null);
                                      }}
                                      className="w-full grid grid-cols-2 text-left py-1 text-xs hover:bg-slate-50 rounded px-1 transition-colors"
                                    >
                                      <span className="font-medium text-slate-700">≥ {tier.quantity}</span>
                                      <span className="text-right font-bold text-amber-600">{tier.price.toLocaleString()} MMK</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isOutOfStock) return;
                            addToCart(stockItem);
                          }}
                          className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 text-[#2216a8] hover:bg-indigo-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Desktop Cart Sidebar */}
        <div className="hidden lg:flex lg:w-96 bg-white flex-col border border-gray-200/50 rounded-3xl shadow-sm h-full overflow-hidden p-6 justify-between">
          <div className="mb-4">
            <h2 className="font-bold text-xl text-gray-800 tracking-tight">Order Cart</h2>
            <span className="inline-block mt-2 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
              Editing #{order?.orderNumber}
            </span>
          </div>

          <div className={`flex-1 overflow-y-auto p-2 space-y-3 ${cart.length === 0 ? "flex flex-col justify-center" : ""}`}>
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center bg-indigo-50/60 border border-indigo-100/40 rounded-3xl p-8 my-auto text-center shadow-sm">
                <ShoppingCart className="w-10 h-10 text-[#2216a8] mb-4" />
                <p className="text-sm font-semibold text-[#2216a8]">
                  {t("pos.emptyCart")}
                </p>
              </div>
            ) : (
              cart.map((item) => {
                const maxAllowed = getMaxAllowedQty(item.stockItem);
                const isMaxReached = item.qty >= maxAllowed;

                return (
                  <div
                    key={item.stockItem._id}
                    className="flex justify-between items-start border-b border-gray-100 pb-3"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.stockItem.inventoryId.productName}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-500">
                          {getItemPrice(item.stockItem, getSafeQty(item.qty)).toLocaleString()} MMK × {getSafeQty(item.qty)} ={" "}
                          <span className="font-bold text-slate-700">
                            {(getItemPrice(item.stockItem, getSafeQty(item.qty)) * getSafeQty(item.qty)).toLocaleString()} MMK
                          </span>
                        </span>
                        {maxAllowed < 999999 && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Max: {maxAllowed}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateQty(item.stockItem._id, -1)}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={maxAllowed}
                        value={item.qty}
                        onChange={(e) => setQty(item.stockItem._id, parseInt(e.target.value) || 1)}
                        className="text-xs font-bold w-10 text-center border border-gray-300 rounded py-1 outline-none"
                      />
                      <button
                        onClick={() => updateQty(item.stockItem._id, 1)}
                        disabled={isMaxReached}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={isMaxReached ? "Maximum stock reached" : "Increase quantity"}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.stockItem._id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded ml-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Summary & Action Button */}
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-4">
            <div className="border border-gray-200/80 rounded-2xl p-4 bg-slate-50/50 space-y-2">
              <div className="flex justify-between text-sm text-gray-500 font-medium">
                <span>{t("pos.items")}</span>
                <span>{cart.reduce((sum, item) => sum + getSafeQty(item.qty), 0)} items</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-700">{t("common.total")}</span>
                <span className="text-lg font-black text-[#2216a8]">{subtotal.toLocaleString()} MMK</span>
              </div>
            </div>

            <button
              onClick={() => {
                const initialPaidAmount =
                  paymentMethod === PaymentMethod.FOC || paymentType === "credit"
                    ? 0
                    : Math.ceil(total);
                setPaidAmount(initialPaidAmount);
                setShowCheckoutModal(true);
              }}
              disabled={cart.length === 0}
              className="w-full bg-[#2216a8] hover:bg-indigo-900 text-white py-3.5 rounded-2xl font-bold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{isMy ? "ဘောင်ချာ အချက်အလက် ပြင်မည်" : "Proceed to Update Order"}</span>
            </button>
          </div>
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
              {cart.reduce((sum, item) => sum + getSafeQty(item.qty), 0)} |{" "}
              {subtotal.toLocaleString()} MMK
            </span>
          </button>
        </div>
      )}

      {/* Mobile Cart Panel */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowMobileCart(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-amber-600" />
                <h2 className="font-bold text-base text-slate-800">
                  {isMy ? "ဘောင်ချာ ပစ္စည်းများ စာရင်း" : "Editing Order Cart"}
                </h2>
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((item) => {
                const maxAllowed = getMaxAllowedQty(item.stockItem);
                const isMaxReached = item.qty >= maxAllowed;

                return (
                  <div
                    key={item.stockItem._id}
                    className="flex justify-between items-center border-b border-gray-100 pb-3"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {item.stockItem.inventoryId.productName}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {getItemPrice(item.stockItem, getSafeQty(item.qty)).toLocaleString()} MMK × {getSafeQty(item.qty)} ={" "}
                          <span className="font-bold text-slate-700">
                            {(getItemPrice(item.stockItem, getSafeQty(item.qty)) * getSafeQty(item.qty)).toLocaleString()} MMK
                          </span>
                        </span>
                        {maxAllowed < 999999 && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Max: {maxAllowed}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateQty(item.stockItem._id, -1)}
                        className="p-1 bg-slate-100 rounded hover:bg-slate-200"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-7 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.stockItem._id, 1)}
                        disabled={isMaxReached}
                        className="p-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={isMaxReached ? "Maximum stock reached" : "Increase quantity"}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.stockItem._id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Footer & Checkout */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-600">{isMy ? "ကျသင့်ငွေ" : "Total"}</span>
                <span className="text-lg font-black text-[#2216a8]">{subtotal.toLocaleString()} MMK</span>
              </div>
              <button
                onClick={() => {
                  const initialPaidAmount =
                    paymentMethod === PaymentMethod.FOC || paymentType === "credit"
                      ? 0
                      : Math.ceil(total);
                  setPaidAmount(initialPaidAmount);
                  setShowMobileCart(false);
                  setShowCheckoutModal(true);
                }}
                disabled={cart.length === 0}
                className="w-full bg-[#2216a8] hover:bg-indigo-900 text-white py-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isMy ? "ဘောင်ချာ အချက်အလက် ပြင်မည်" : "Proceed to Update Order"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout / Order Update Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-[#2216a8]/5">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#2216a8]" />
                <h3 className="font-bold text-lg text-slate-800">
                  {isMy ? "ဘောင်ချာ အချက်အလက် အတည်ပြုခြင်း" : "Confirm Order Update"}
                </h3>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1.5 hover:bg-slate-200/50 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Payment Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {isMy ? "ငွေပေးချေမှု အမျိုးအစား" : "Payment Type"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType("paid");
                      setPaidAmount(Math.ceil(total));
                    }}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${paymentType === "paid"
                      ? "bg-[#2216a8] text-white border-[#2216a8]"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {isMy ? "ငွေချေပြီး" : "Paid"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType("credit");
                      setPaidAmount(0);
                    }}
                    className={`py-2 rounded-xl text-sm font-bold border transition-all cursor-pointer ${paymentType === "credit"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {isMy ? "အကြွေး" : "Credit"}
                  </button>
                </div>
              </div>

              {/* Customer Selection */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-slate-500">
                    {isMy ? "ဝယ်သူ" : "Customer"} {paymentType === "credit" && <span className="text-red-500">*</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCreditPersonModal(true)}
                    className="text-xs text-[#2216a8] font-bold hover:underline"
                  >
                    {isMy ? "+ အသစ်ထည့်မည်" : "+ Add New"}
                  </button>
                </div>
                <select
                  value={selectedCreditPersonId}
                  onChange={(e) => setSelectedCreditPersonId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] outline-none"
                >
                  <option value="">{isMy ? "-- ဝယ်သူ ရွေးချယ်ပါ (မဖြစ်မနေ မဟုတ်ပါ) --" : "-- Select Customer (Optional) --"}</option>
                  {creditPersonas.map((cp) => (
                    <option key={cp._id} value={cp._id}>
                      {cp.name} ({cp.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {isMy ? "ငွေပေးချေစနစ်" : "Payment Method"}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] outline-none"
                >
                  {Object.values(PaymentMethod).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Discount / Markup */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-semibold text-slate-500">
                    {isMy ? "လျှော့စျေး" : "Discount"} (%)
                  </label>
                  <span className="text-xs text-green-600 font-bold">
                    -{combinedDiscountAmount.toLocaleString()} MMK
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount === 0 ? "" : discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0%"
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] outline-none"
                />
              </div>

              {/* Paid Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {isMy ? "ပေးချေငွေ (MMK)" : "Paid Amount (MMK)"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount === 0 ? "" : paidAmount}
                  onChange={(e) => setPaidAmount(Math.ceil(Number(e.target.value)))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] outline-none font-bold text-slate-800"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-1.5">
                  {isMy ? "မှတ်ချက်" : "Note"}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={isMy ? "မှတ်ချက်ရေးပါ..." : "Enter note..."}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#2216a8] outline-none"
                />
              </div>

              {/* Summary Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>{isMy ? "စုစုပေါင်း မူရင်းတန်ဖိုး" : "Subtotal"}</span>
                  <span>{subtotal.toLocaleString()} MMK</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span>{isMy ? "လျှော့စျေး" : "Discount"} ({discount}%)</span>
                    <span>-{combinedDiscountAmount.toLocaleString()} MMK</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-800 pt-2 border-t border-slate-200">
                  <span>{isMy ? "စုစုပေါင်း ကျသင့်ငွေ" : "Total"}</span>
                  <span>{total.toLocaleString()} MMK</span>
                </div>
                {paidAmount > total && paymentType === "paid" && (
                  <div className="flex justify-between text-sm text-green-600 font-bold">
                    <span>{isMy ? "ပြန်အမ်းငွေ" : "Change"}</span>
                    <span>{(paidAmount - total).toLocaleString()} MMK</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-3 text-slate-600 hover:bg-slate-200 rounded-full font-semibold text-sm transition-all cursor-pointer"
              >
                {isMy ? "မလုပ်တော့ပါ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleUpdateOrder}
                disabled={isProcessing || cart.length === 0}
                className="flex-1 py-3 bg-[#2216a8] hover:bg-[#2216a8]/90 text-white rounded-full font-bold text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isMy ? "သိမ်းဆည်းနေပါသည်..." : "Updating..."}</span>
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4" />
                    <span>{isMy ? "သိမ်းမည်" : "Update Order"} • {total.toLocaleString()} MMK</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Credit Person Modal */}
      {showAddCreditPersonModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-[#2216a8]/5 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Customer အသစ်ထည့်ရန်</h3>
              <button
                onClick={() => setShowAddCreditPersonModal(false)}
                className="p-1 hover:bg-slate-200 rounded-full"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">အမည် *</label>
                <input
                  type="text"
                  value={newCreditPersonName}
                  onChange={(e) => setNewCreditPersonName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none"
                  placeholder="Customer အမည်"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">ဖုန်းနံပါတ် *</label>
                <input
                  type="tel"
                  value={newCreditPersonPhone}
                  onChange={(e) => setNewCreditPersonPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none"
                  placeholder="09xxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">လိပ်စာ</label>
                <input
                  type="text"
                  value={newCreditPersonAddress}
                  onChange={(e) => setNewCreditPersonAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm outline-none"
                  placeholder="နေရပ်လိပ်စာ"
                />
              </div>
            </div>
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => setShowAddCreditPersonModal(false)}
                className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-full text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newCreditPersonName.trim() || !newCreditPersonPhone.trim()) {
                    toast.error("အမည်နှင့် ဖုန်းနံပါတ် ဖြည့်သွင်းပါ");
                    return;
                  }
                  setIsAddingCreditPerson(true);
                  try {
                    const res = await createCreditPersona({
                      name: newCreditPersonName.trim(),
                      phone: newCreditPersonPhone.trim(),
                      address: newCreditPersonAddress.trim() || undefined,
                    });
                    if (res.success && res.data) {
                      toast.success("Customer အသစ် ဖန်တီးပြီးပါပြီ");
                      setCreditPersonas((prev) => [...prev, res.data]);
                      setSelectedCreditPersonId(res.data._id);
                      setShowAddCreditPersonModal(false);
                      setNewCreditPersonName("");
                      setNewCreditPersonPhone("");
                      setNewCreditPersonAddress("");
                    }
                  } catch {
                    toast.error("ဖန်တီးခြင်း မအောင်မြင်ပါ");
                  } finally {
                    setIsAddingCreditPerson(false);
                  }
                }}
                disabled={isAddingCreditPerson}
                className="flex-1 py-2 bg-[#2216a8] text-white rounded-full text-xs font-bold shadow-sm"
              >
                {isAddingCreditPerson ? "ထည့်သွင်းနေပါသည်..." : "သိမ်းမည်"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
