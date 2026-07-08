import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  RefreshCw,
  Store,
  ChevronDown,
  Loader2,
  Scan,
  X,
  User,
  Calculator,
  Calendar,
  ShoppingCart,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { getSavedPrintPaperSize } from "../utils/printPaperSize";
import { detectDevice } from "../utils/deviceDetect";
import {
  fetchStorefrontStock,
  StorefrontStockItem,
} from "../services/Storefront/fetchStorefrontStock";
import {
  fetchStorefrontProfiles,
  StorefrontProfile,
} from "../services/Storefront/fetchStorefrontProfiles";
import { fetchCategories } from "../services/Inventory/fetchCategories";
import { createOrder } from "../services/Order/createOrder";
import {
  fetchCreditPersonas,
  CreditPersona,
} from "../services/Credit/fetchCreditPersonas";
import { createCreditPersona } from "../services/Credit/createCreditPersona";
import { deviceDetect } from "react-device-detect";

// Payment methods
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

export const POS: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Data State
  const [storefronts, setStorefronts] = useState<StorefrontProfile[]>([]);
  const [selectedStorefrontId, setSelectedStorefrontId] = useState<string>("");
  const [allStockItems, setAllStockItems] = useState<StorefrontStockItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(100); // Default to 100 for POS grid

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [creditPersonas, setCreditPersonas] = useState<CreditPersona[]>([]);
  const [selectedCreditPersonId, setSelectedCreditPersonId] =
    useState<string>("");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAddCreditPersonModal, setShowAddCreditPersonModal] =
    useState(false);
  const [newCreditPersonName, setNewCreditPersonName] = useState("");
  const [newCreditPersonPhone, setNewCreditPersonPhone] = useState("");
  const [newCreditPersonAddress, setNewCreditPersonAddress] = useState("");
  const [isAddingCreditPerson, setIsAddingCreditPerson] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState("");
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [markup, setMarkup] = useState(0);
  const [markupAmount, setMarkupAmount] = useState(0);
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStorefrontMenu, setShowStorefrontMenu] = useState(false);
  const [useMarkup, setUseMarkup] = useState(false); // Toggle between discount and markup
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    paymentType === "credit" ? PaymentMethod.NORMAL : PaymentMethod.CASH,
  );
  const [showDiscountCalculator, setShowDiscountCalculator] = useState(false);
  const [showMarkupCalculator, setShowMarkupCalculator] = useState(false);
  const [activeWholesalePopoverId, setActiveWholesalePopoverId] = useState<
    string | null
  >(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [createdAt, setCreatedAt] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const devices = detectDevice();

  // Load storefronts and stock on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load storefronts
      const sfResponse = await fetchStorefrontProfiles();
      if (sfResponse.success && sfResponse.data) {
        const activeStorefronts = sfResponse.data.filter(
          (sf) => sf.status === "active",
        );
        setStorefronts(activeStorefronts);

        // Auto-select first storefront
        if (activeStorefronts.length > 0) {
          setSelectedStorefrontId(activeStorefronts[0]._id);
        }
      }

      // Load categories
      const catResponse = await fetchCategories();
      if (catResponse.success && catResponse.data) {
        setCategories(catResponse.data);
      }

      // Load stock items
      await loadStockItems();
    } catch (error) {
      // console.error("Error loading initial data:", error);
      toast.error(t("pos.failedToLoadData"));
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }

    // Load credit personas separately
    loadCreditPersonas();
  };

  const loadCreditPersonas = async () => {
    try {
      const cpResponse = await fetchCreditPersonas();
      // console.log("Credit personas response:", cpResponse);
      if (cpResponse.success && cpResponse.data) {
        const activePersonas = cpResponse.data.filter((p) => !p.blacklist);
        // console.log("Active credit personas:", activePersonas);
        setCreditPersonas(activePersonas);
      }
    } catch (error) {
      console.error("Error loading credit personas:", error);
    }
  };

  useEffect(() => {
    loadStockItems();
  }, [selectedStorefrontId, search, selectedCategory, currentPage]);

  useEffect(() => {
    const handleClickOutsideWholesalePopover = (event: MouseEvent) => {
      if (!activeWholesalePopoverId) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const container = target.closest(
        `[data-wholesale-container="${activeWholesalePopoverId}"]`,
      );

      if (!container) {
        setActiveWholesalePopoverId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveWholesalePopoverId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutsideWholesalePopover);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutsideWholesalePopover,
      );
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeWholesalePopoverId]);

  const loadStockItems = async () => {
    try {
      const response = await fetchStorefrontStock(
        selectedStorefrontId,
        currentPage,
        itemsPerPage,
        selectedCategory === "All" ? undefined : selectedCategory,
        search,
      );
      // console.log("response", response);
      if (response.success && response.data) {
        setAllStockItems(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalItems(response.pagination.totalItems);
        }
      }
    } catch (error) {
      console.error("Error loading stock items:", error);
      toast.error(t("pos.failedToLoadProducts"));
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await loadStockItems();
    setLoading(false);
    toast.success(t("pos.productsRefreshed"));
  };

  // Filter products by selected storefront (search and category handled by API)
  const filteredProducts = allStockItems.filter((item) => {
    const hideProduct = item.inventoryId?._id === "69a15d55218ec5ff9a3fe4a3";
    return !hideProduct;
  });

  // Get unique categories from current storefront products
  // (Categories are now fetched from API and stored in categories state)

  const addToCart = (stockItem: StorefrontStockItem) => {
    if (stockItem.availableQuantity <= 0) {
      toast.error(t("pos.outOfStock"));
      return;
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.stockItem._id === stockItem._id,
      );
      if (existing) {
        if (existing.qty + 1 > stockItem.availableQuantity) {
          toast.error(t("pos.cannotExceedStock"));
          return prev;
        }
        return prev.map((item) =>
          item.stockItem._id === stockItem._id
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
      }
      return [...prev, { stockItem, qty: 1 }];
    });
  };

  const applyWholesaleTierQuantity = (
    stockItem: StorefrontStockItem,
    tierQuantity: number,
  ) => {
    const availableQty = Number(
      stockItem.availableQuantity ?? stockItem.quantity,
    );
    const parsedTierQty = Number(tierQuantity);

    if (!Number.isFinite(availableQty) || availableQty <= 0) {
      toast.error(t("pos.outOfStock"));
      return;
    }

    if (!Number.isFinite(parsedTierQty) || parsedTierQty <= 0) {
      toast.error("Invalid wholesale quantity");
      return;
    }

    const requestedQty = Math.max(1, Math.floor(parsedTierQty));
    const finalQty = Math.min(requestedQty, availableQty);

    if (requestedQty > availableQty) {
      toast.error(t("pos.cannotExceedStock"));
    }

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.stockItem._id === stockItem._id,
      );

      if (existing) {
        return prev.map((item) =>
          item.stockItem._id === stockItem._id
            ? { ...item, qty: finalQty }
            : item,
        );
      }

      return [...prev, { stockItem, qty: finalQty }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.stockItem._id === id) {
          const newQty = item.qty + delta;
          if (newQty > item.stockItem.availableQuantity) {
            toast.error(t("pos.cannotExceedStock"));
            return item;
          }
          if (newQty < 1) return item;
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  const setQty = (id: string, newQty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.stockItem._id === id) {
          // Validate quantity
          if (newQty < 1) {
            return { ...item, qty: 1 };
          }
          if (newQty > item.stockItem.availableQuantity) {
            toast.error(t("pos.cannotExceedStock"));
            return { ...item, qty: item.stockItem.availableQuantity };
          }
          return { ...item, qty: newQty };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.stockItem._id !== id));
  };

  // Handle barcode scanning from search input
  const handleBarcodeScan = async (searchValue: string) => {
    if (!searchValue.trim()) return;

    try {
      // Use API to find the exact product by barcode/code
      const response = await fetchStorefrontStock(
        selectedStorefrontId,
        1,
        1, // We only need the first matching item
        undefined,
        searchValue.trim(),
      );

      if (response.success && response.data && response.data.length > 0) {
        const matchingProduct = response.data[0];

        // Check if product is in stock
        if (matchingProduct.availableQuantity <= 0) {
          toast.error(t("pos.outOfStock"));
          setSearch(""); // Clear search
          return;
        }

        // Add to cart (will increment if already exists)
        addToCart(matchingProduct);

        // Show success feedback
        toast.success(
          `${matchingProduct.inventoryId.productName} ${
            t("pos.addedToCart") || "added to cart"
          }`,
        );

        // Clear search input after successful scan
        setSearch("");
      } else {
        // If no exact match found via API, we just keep the search term as is
        // so the user can see if there are partial matches in the grid
        toast.error(t("pos.productNotFound") || "Product not found");
      }
    } catch (error) {
      console.error("Error during barcode scan:", error);
      toast.error(t("pos.failedToSearchProduct") || "Failed to search product");
    }
  };

  // Calculate unit price with wholesale tiers (if eligible)
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

  const getSortedWholesaleTiers = (item: StorefrontStockItem) =>
    (item.inventoryId.wholesalePrices || [])
      .slice()
      .sort((a, b) => a.quantity - b.quantity);

  const getSafeQty = (qty: number) =>
    Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;

  const subtotal = cart.reduce((sum, item) => {
    const qty = getSafeQty(item.qty);
    return sum + getItemPrice(item.stockItem, qty || 1) * qty;
  }, 0);

  const totalAfterDiscount = Math.round(
    subtotal * (1 - (Number(discount) || 0) / 100),
  );
  const totalAfterMarkup = subtotal + markupAmount;

  const total = useMarkup ? totalAfterMarkup : totalAfterDiscount;
  const combinedDiscountAmount = useMarkup
    ? 0
    : Math.round(subtotal - totalAfterDiscount);

  // Auto-update paid amount when discount or subtotal changes in checkout modal
  useEffect(() => {
    if (
      showCheckoutModal &&
      paymentType === "paid" &&
      paymentMethod !== PaymentMethod.FOC
    ) {
      // Update paid amount to match new total when discount or subtotal changes
      // Use Math.ceil to ensure it's always an integer
      // Skip for FOC as paid amount should be 0
      setPaidAmount(Math.ceil(total));
    }
  }, [showCheckoutModal, total, paymentType, paymentMethod]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Only validate paid amount for "paid" payment type, not for "credit" or "FOC"
    if (
      paymentType === "paid" &&
      paymentMethod !== PaymentMethod.FOC &&
      paidAmount < total
    ) {
      toast.error(t("pos.paidAmountError"));
      return;
    }

    // For FOC, set paid amount to 0
    const finalPaidAmount =
      paymentMethod === PaymentMethod.FOC ? 0 : paidAmount;

    setIsProcessing(true);

    try {
      // Map payment method to API format
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

      const discountAmount = useMarkup
        ? 0
        : Math.round(subtotal - totalAfterDiscount);

      const orderPayload = {
        storefrontId: selectedStorefrontId,
        ordersProducts: cart.map((item) => ({
          inventoryId: item.stockItem.inventoryId._id,
          quantity: item.qty,
        })),
        subTotal: subtotal,
        discount: discountAmount,
        finalAmount: total,
        paidAmount: finalPaidAmount,
        paymentType: paymentType,
        note: note,
        paymentMethod: paymentMethodMap[paymentMethod],
        orderDate: new Date(createdAt).toISOString(),
        ...(selectedCreditPersonId
          ? { creditPersonId: selectedCreditPersonId }
          : {}),
      };

      const result = await createOrder(orderPayload);

      if (result.success) {
        const selectedStorefront = storefronts.find(
          (sf) => sf._id === selectedStorefrontId,
        );

        const receiptData = {
          date: new Date().toISOString(),
          invoiceNumber: result.data?.orderNumber || `INV-${Date.now()}`,
          storefrontName: "HONGCHI Myanmar",
          items: cart.map((i) => ({
            name: i.stockItem.inventoryId.productName,
            code: i.stockItem.inventoryId.productCode,
            qty: i.qty,
            price: getItemPrice(i.stockItem, i.qty),
          })),
          subtotal,
          discountPercent: discount,
          total,
          paidAmount: finalPaidAmount,
          change: finalPaidAmount - total,
          paymentMethod,
          note,
          serviceCharge: 0,
          tax: 0,
          receiptSequenceNumber:
            parseInt(result.data?.orderNumber?.split("/").pop() || "0", 10) ||
            Date.now() % 10000,
          cashierName:
            JSON.parse(localStorage.getItem("adminData") || "{}").name ||
            "Cashier",
          customerName:
            creditPersonas.find((cp) => cp._id === selectedCreditPersonId)
              ?.name || "",
          customerPhone:
            creditPersonas.find((cp) => cp._id === selectedCreditPersonId)
              ?.phone || "",
          customerAddress:
            creditPersonas.find((cp) => cp._id === selectedCreditPersonId)
              ?.address || "",
        };
        // Save receipt data and redirect to receipt page
        const receiptId = `receipt_${receiptData.invoiceNumber}`;
        localStorage.setItem(receiptId, JSON.stringify(receiptData));

        // Device detection for print method selection
        const device = detectDevice();

        // Auto-print receipt based on device
        if (device.isAndroid || device.isIOS) {
          // For mobile devices (Android/iOS), navigate to receipt page
          navigate(
            `/mobile-print/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}`,
          );
        } else {
          // For desktop/Windows, use thermal receipt function
          navigate(
            `/print-receipt/${receiptData.invoiceNumber}?size=${getSavedPrintPaperSize()}`,
          );
        }
        // console.log("Device:", device);

        // Navigate to professional A4 receipt page

        setCart([]);
        setDiscount(0);
        setMarkup(0);
        setMarkupAmount(0);
        setNote("");
        setPaidAmount(0);
        setPaymentMethod(
          paymentType === "credit" ? PaymentMethod.NORMAL : PaymentMethod.CASH,
        );
        setPaymentType("paid");
        setSelectedCreditPersonId("");
        setCreatedAt(new Date().toISOString().split("T")[0]);

        // Show success modal instead of toast
        setSuccessOrderNumber(result.data?.orderNumber || `INV-${Date.now()}`);
        setShowSuccessModal(true);

        // Refresh stock after sale
        await loadStockItems();
      } else {
        toast.error(result.message || t("pos.failedToProcessSale"));
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(t("pos.failedToProcessSale"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle storefront change
  const handleStorefrontChange = (storefrontId: string) => {
    setSelectedStorefrontId(storefrontId);
    setCart([]); // Clear cart when switching storefronts
    setSelectedCategory("All");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-dark-600">{t("pos.loading")}</p>
        </div>
      </div>
    );
  }

  if (storefronts.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <Store className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-dark-600">
            You are not assigned to any storefront. Please contact the
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)] overflow-hidden bg-gray-100">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col px-3 py-3 lg:px-6 lg:py-4 overflow-hidden">
        {/* Search Bar with Storefront Badge */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Combined Search/Barcode Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none" />
              <Scan className="absolute right-3 top-[13px] h-5 w-5 text-gray-400 pointer-events-none opacity-50" />
              <input
                type="text"
                placeholder={"Search products"}
                className="search-input w-full pl-10 pr-10 py-2.5 border border-dark-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white shadow-sm"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                // onKeyDown={(e) => {
                //   // When Enter is pressed, try to scan barcode first
                //   if (e.key === "Enter" && search.trim()) {
                //     e.preventDefault();
                //     handleBarcodeScan(search);
                //     // If barcode was found and added, search is already cleared
                //     // If not found, continue with regular search (filtering happens automatically)
                //   }
                // }}
                // onBlur={() => {
                //   // Auto-process barcode when input loses focus (useful for barcode scanners that auto-tab)
                //   // Only if search value exists and looks like it could be a barcode (length >= 3)
                //   // This helps with barcode scanners that send data on blur
                //   if (search.trim() && search.trim().length >= 3) {
                //     handleBarcodeScan(search);
                //   }
                // }}
                autoFocus
              />
            </div>

            {/* Category Selector */}
            <select
              className="w-full sm:w-auto border border-dark-200 rounded-xl px-4 py-2.5 bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">{t("pos.allCategories")}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Storefront Settings Button */}
            <div className="relative">
              <button
                onClick={() => setShowStorefrontMenu(!showStorefrontMenu)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2.5 bg-dark text-white rounded-xl hover:bg-dark-800 transition-all shadow-sm"
              >
                <Store className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium max-w-[120px] truncate">
                  {storefronts.find((sf) => sf._id === selectedStorefrontId)
                    ?.locationName || "Store"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-primary transition-transform duration-200 ${
                    showStorefrontMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {showStorefrontMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowStorefrontMenu(false)}
                  />
                  {/* Menu */}
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-dark-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-dark-50 border-b border-dark-200">
                      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider">
                        {t("pos.selectStorefront")}
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {storefronts.map((sf) => (
                        <button
                          key={sf._id}
                          onClick={() => {
                            handleStorefrontChange(sf._id);
                            setShowStorefrontMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary/10 transition-colors ${
                            sf._id === selectedStorefrontId
                              ? "bg-primary/20 border-l-4 border-primary"
                              : ""
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              sf._id === selectedStorefrontId
                                ? "bg-primary text-white"
                                : "bg-dark-100 text-dark-500"
                            }`}
                          >
                            <Store className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-dark-800 truncate">
                              {sf.locationName}
                            </p>
                            <p className="text-xs text-dark-400">
                              {sf.locationCode}
                            </p>
                          </div>
                          {sf._id === selectedStorefrontId && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="p-2 border-t border-dark-200 bg-dark-50">
                      <button
                        onClick={() => {
                          handleRefresh();
                          setShowStorefrontMenu(false);
                        }}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-dark-600 hover:bg-dark-100 rounded-lg transition-colors"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                        />
                        {t("pos.refreshProducts")}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Product Count */}
        <div className="mb-2 text-sm text-gray-600">
          {t("pos.showingProducts").replace(
            "{count}",
            filteredProducts.length.toString(),
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 sm:p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="text-sm text-gray-600">
              {t("pos.showingProducts").replace(
                "{count}",
                ((currentPage - 1) * itemsPerPage + 1).toString(),
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
              {totalItems}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronDown className="w-4 h-4 rotate-90" />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {t("common.previous") || "Prev"}
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2)
                    pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors text-sm ${
                        currentPage === pageNum
                          ? "bg-primary text-white border-primary"
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {t("common.next") || "Next"}
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex overflow-y-auto grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4 pb-20">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              {selectedStorefrontId
                ? t("pos.noProductsInStorefront")
                : t("pos.pleaseSelectStorefront")}
            </div>
          ) : (
            filteredProducts.map((stockItem) => (
              <div
                key={stockItem._id}
                onClick={() => addToCart(stockItem)}
                className={`bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-dark-200 cursor-pointer transition-all hover:shadow-lg hover:border-primary hover:scale-[1.02] flex flex-col ${
                  stockItem.quantity === 0
                    ? "opacity-50 grayscale pointer-events-none"
                    : ""
                }`}
              >
                <div className="">
                  <h3 className="font-medium text-gray-800 text-xs sm:text-sm line-clamp-2">
                    {stockItem.inventoryId.productName}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-mono">
                    {stockItem.inventoryId.productCode}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    {stockItem.inventoryId.category}
                  </p>
                </div>
                <div className="mt-2 sm:mt-4 flex justify-between items-end">
                  <span className="font-bold text-primary-600 text-xs sm:text-sm">
                    {getItemPrice(stockItem).toLocaleString()} MMK
                  </span>
                  {stockItem.inventoryId.wholesalePrices &&
                    stockItem.inventoryId.wholesalePrices.length > 0 && (
                      <div
                        className="relative"
                        data-wholesale-container={stockItem._id}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveWholesalePopoverId((prev) =>
                              prev === stockItem._id ? null : stockItem._id,
                            );
                          }}
                          className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 hover:bg-amber-100 transition-colors"
                        >
                          Wholesale
                        </button>

                        {activeWholesalePopoverId === stockItem._id && (
                          <div
                            className="absolute right-0 top-7 z-20 w-52 bg-white border border-gray-200 rounded-lg shadow-xl p-3"
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
                              {getSortedWholesaleTiers(stockItem).map(
                                (tier) => (
                                  <button
                                    type="button"
                                    key={
                                      tier._id ||
                                      `${tier.quantity}-${tier.price}`
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      applyWholesaleTierQuantity(
                                        stockItem,
                                        Number(tier.quantity),
                                      );
                                      setActiveWholesalePopoverId(null);
                                    }}
                                    className="w-full grid grid-cols-2 py-1.5 px-1 border-b border-slate-100 last:border-b-0 text-[11px] rounded hover:bg-amber-50 hover:text-amber-900 transition-colors cursor-pointer"
                                  >
                                    <span className="text-slate-700">
                                      {tier.quantity}+
                                    </span>
                                    <span className="text-right text-slate-800 font-medium">
                                      {tier.price.toLocaleString()}
                                    </span>
                                  </button>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart Sidebar - Desktop only */}
      <div className="hidden lg:flex lg:w-96 bg-white flex-col border-l border-gray-200 shadow-xl h-[calc(100vh-60px)] sticky top-0">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">{t("pos.currentSale")}</h2>
          {selectedStorefrontId && (
            <p className="text-xs text-gray-400 mt-1">
              {
                storefronts.find((sf) => sf._id === selectedStorefrontId)
                  ?.locationName
              }
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              {t("pos.emptyCart")}
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.stockItem._id}
                className="flex justify-between items-start border-b border-gray-200 pb-4"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {item.stockItem.inventoryId.productName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getItemPrice(
                      item.stockItem,
                      getSafeQty(item.qty) || 1,
                    ).toLocaleString()}{" "}
                    MMK x {getSafeQty(item.qty)} ={" "}
                    {(
                      getItemPrice(item.stockItem, getSafeQty(item.qty) || 1) *
                      getSafeQty(item.qty)
                    ).toLocaleString()}{" "}
                    MMK
                  </p>
                </div>
                <div className="cart-item-controls flex items-center gap-2 ml-2">
                  <button
                    onClick={() => updateQty(item.stockItem._id, -1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.stockItem.availableQuantity}
                    value={item.qty}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      setQty(item.stockItem._id, value);
                    }}
                    onBlur={(e) => {
                      // Ensure quantity is at least 1 when input loses focus
                      const value = parseInt(e.target.value) || 1;
                      if (value < 1) {
                        setQty(item.stockItem._id, 1);
                      }
                    }}
                    className="text-sm font-medium w-12 text-center border border-gray-300 rounded px-1 py-1 focus:ring-2 focus:ring-primary focus:border-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateQty(item.stockItem._id, 1)}
                    className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.stockItem._id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded ml-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Checkout Button */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t("pos.items")}</span>
              <span>
                {cart.reduce((sum, item) => sum + getSafeQty(item.qty), 0)}{" "}
                {t("pos.itemsLower")}
              </span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900">
              <span>{t("common.total")}</span>
              <span>{subtotal.toLocaleString()} MMK</span>
            </div>
          </div>

          <button
            onClick={() => {
              // Auto-fill paid amount with total when opening checkout modal
              // Set to 0 for FOC or Credit, otherwise use total
              const initialPaidAmount =
                paymentMethod === PaymentMethod.FOC || paymentType === "credit"
                  ? 0
                  : Math.ceil(total);
              setPaidAmount(initialPaidAmount);
              setShowCheckoutModal(true);
            }}
            disabled={cart.length === 0}
            className="start-btn w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {t("pos.proceedToCheckout")}
          </button>
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowMobileCart(true)}
            className="bg-primary text-white px-4 py-3 rounded-full shadow-xl flex items-center gap-2 font-bold text-sm"
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
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
            {/* Mobile Cart Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">{t("pos.currentSale")}</h2>
              <button
                onClick={() => setShowMobileCart(false)}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Mobile Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  {t("pos.emptyCart")}
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.stockItem._id}
                    className="flex justify-between items-start border-b border-gray-200 pb-4"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {item.stockItem.inventoryId.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getItemPrice(
                          item.stockItem,
                          getSafeQty(item.qty) || 1,
                        ).toLocaleString()}{" "}
                        MMK x {getSafeQty(item.qty)} ={" "}
                        {(
                          getItemPrice(
                            item.stockItem,
                            getSafeQty(item.qty) || 1,
                          ) * getSafeQty(item.qty)
                        ).toLocaleString()}{" "}
                        MMK
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => updateQty(item.stockItem._id, -1)}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.stockItem.availableQuantity}
                        value={item.qty}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setQty(item.stockItem._id, value);
                        }}
                        className="text-sm font-medium w-12 text-center border border-gray-300 rounded px-1 py-1 focus:ring-2 focus:ring-primary focus:border-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => updateQty(item.stockItem._id, 1)}
                        className="p-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
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
                ))
              )}
            </div>

            {/* Mobile Cart Summary & Checkout */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("pos.items")}</span>
                  <span>
                    {cart.reduce((sum, item) => sum + getSafeQty(item.qty), 0)}{" "}
                    {t("pos.itemsLower")}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>{t("common.total")}</span>
                  <span>{subtotal.toLocaleString()} MMK</span>
                </div>
              </div>

              <button
                onClick={() => {
                  const initialPaidAmount =
                    paymentMethod === PaymentMethod.FOC ||
                    paymentType === "credit"
                      ? 0
                      : Math.ceil(total);
                  setPaidAmount(initialPaidAmount);
                  setShowMobileCart(false);
                  setShowCheckoutModal(true);
                }}
                disabled={cart.length === 0}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {t("pos.proceedToCheckout")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 mb-1">
                {t("pos.processing")}
              </p>
              <p className="text-sm text-gray-500">
                Please wait while we process your order...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full max-w-md sm:mx-4 max-h-[100vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b bg-primary/10">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">
                  {/* {t("pos.checkout")} */}
                  {devices.isMobile ? "Mobile" : "Desktop"}
                </h3>
                <button
                  onClick={() => setShowCheckoutModal(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {cart.reduce((sum, item) => sum + getSafeQty(item.qty), 0)}{" "}
                {t("pos.itemsLower")} • {subtotal.toLocaleString()} MMK
              </p>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.paymentType")}
                </label>
                <select
                  className="payment-type-select w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={paymentType}
                  onChange={(e) => {
                    setPaymentType(e.target.value as "paid" | "credit");
                    if (e.target.value === "paid") {
                      setPaymentMethod(PaymentMethod.CASH);
                      // Reset to total when switching back to paid
                      setPaidAmount(Math.ceil(total));
                    } else if (e.target.value === "credit") {
                      setPaymentMethod(PaymentMethod.NORMAL);
                      // Set initial value to zero for credit
                      setPaidAmount(0);
                    }
                  }}
                >
                  <option value="paid">{t("pos.paid")}</option>
                  <option value="credit">{t("pos.credit")}</option>
                </select>
              </div>

              {/* Order Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.orderDate") || "Order Date"}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Credit Person Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.selectCreditPerson")}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <select
                      className="w-full pl-9 pr-4 py-2.5 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none bg-orange-50"
                      value={selectedCreditPersonId}
                      onChange={(e) =>
                        setSelectedCreditPersonId(e.target.value)
                      }
                    >
                      <option value="">
                        {creditPersonas.length === 0
                          ? `-- ${t("pos.noCreditPersons")} --`
                          : `-- ${t("pos.selectCreditPersonOptional")} --`}
                      </option>
                      {creditPersonas.map((persona) => (
                        <option key={persona._id} value={persona._id}>
                          {persona.name} - {persona.phone}{persona.address ? ` - ${persona.address}` : ""}
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
                    className="px-3 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 text-sm font-medium whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    {t("pos.addCreditPerson")}
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.paymentMethod")}
                </label>
                <select
                  className="payment-method-select w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as PaymentMethod)
                  }
                >
                  {paymentType === "credit" ? (
                    <>
                      <option value={PaymentMethod.NORMAL}>
                        <span>normal</span>
                      </option>
                      <option value={PaymentMethod.HOT}>
                        <span>hot</span>
                      </option>
                    </>
                  ) : (
                    <>
                      <option value={PaymentMethod.CASH}>
                        {t("pos.cash")}
                      </option>
                      <option value={PaymentMethod.KBZ_PAY}>
                        {t("pos.kbzPay")}
                      </option>
                      <option value={PaymentMethod.WAVE_PAY}>
                        {t("pos.wavePay")}
                      </option>
                      <option value={PaymentMethod.AYA_PAY}>
                        {t("pos.ayaPay")}
                      </option>
                      <option value={PaymentMethod.UAB_PAY}>
                        {t("pos.uabPay")}
                      </option>
                      <option value={PaymentMethod.BANK_TRANSFER}>
                        {t("pos.bankTransfer")}
                      </option>
                      <option value={PaymentMethod.MMQR}>
                        <span>MMQR</span>
                      </option>
                      <option value={PaymentMethod.FOC}>
                        <span>FOC</span>
                      </option>
                    </>
                  )}
                </select>
              </div>

              {/* Discount/Markup Toggle */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Option
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="pricingOption"
                      checked={!useMarkup}
                      onChange={() => setUseMarkup(false)}
                      className="mr-2"
                    />
                    <span className="text-sm">Discount</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="pricingOption"
                      checked={useMarkup}
                      onChange={() => setUseMarkup(true)}
                      className="mr-2"
                    />
                    <span className="text-sm">Markup</span>
                  </label>
                </div>
              </div>

              {/* Discount */}
              {!useMarkup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("pos.discount")} (%)
                    <button
                      onClick={() => setShowDiscountCalculator(true)}
                      className="ml-2 text-primary hover:text-primary-700 transition-colors"
                      title="Calculate discount percentage"
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="discount-input w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
              )}

              {/* Markup */}
              {useMarkup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Markup Amount (MMK)
                    {/* <button
                      onClick={() => setShowMarkupCalculator(true)}
                      className="ml-2 text-primary hover:text-primary-700 transition-colors"
                      title="Add fixed markup amount"
                    >
                      <Calculator className="w-4 h-4" />
                    </button> */}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    value={markupAmount}
                    onChange={(e) => setMarkupAmount(Number(e.target.value))}
                  />
                </div>
              )}

              {/* Paid Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {paymentMethod === PaymentMethod.FOC
                    ? `${t("pos.paidAmount")} (MMK) - ${t("pos.focMessage") || "Free of Charge"}`
                    : `${t("pos.paidAmount")} (MMK)`}
                  {paymentType === "paid" &&
                    paymentMethod !== PaymentMethod.FOC && (
                      <span className="text-red-500">*</span>
                    )}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={paymentMethod === PaymentMethod.FOC}
                  className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none ${
                    paymentMethod === PaymentMethod.FOC
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }`}
                  value={paymentMethod === PaymentMethod.FOC ? 0 : paidAmount}
                  onChange={(e) => {
                    const value =
                      e.target.value === "" ? 0 : Number(e.target.value);
                    // Use Math.ceil to ensure paid amount is always an integer
                    setPaidAmount(Math.ceil(value));
                  }}
                  placeholder={
                    paymentMethod === PaymentMethod.FOC
                      ? "0"
                      : t("pos.enterPaidAmount")
                  }
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("pos.note")} ({t("common.optional")})
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("pos.notePlaceholder")}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("common.subtotal")}</span>
                  <span>{subtotal.toLocaleString()} MMK</span>
                </div>
                {!useMarkup && discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>
                      {t("common.discount")} ({discount}%)
                    </span>
                    <span>-{combinedDiscountAmount.toLocaleString()} MMK</span>
                  </div>
                )}
                {useMarkup && markupAmount > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Markup Amount</span>
                    <span>+{markupAmount.toLocaleString()} MMK</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>{t("common.total")}</span>
                  <span>{total.toLocaleString()} MMK</span>
                </div>
                {paidAmount > 0 &&
                  paidAmount >= total &&
                  paymentType === "paid" && (
                    <div className="change-display-row flex justify-between text-sm text-green-600 font-medium">
                      <span>{t("common.change")}</span>
                      <span>{(paidAmount - total).toLocaleString()} MMK</span>
                    </div>
                  )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 space-y-2">
              <button
                onClick={() => {
                  handleCheckout();
                  setShowCheckoutModal(false);
                }}
                disabled={
                  cart.length === 0 ||
                  isProcessing ||
                  (paymentType === "paid" && paidAmount < total) ||
                  (paymentType === "credit" && paidAmount > total)
                }
                className="complete-sale-btn w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />{" "}
                    {t("pos.processing")}
                  </>
                ) : (
                  <>
                    {t("pos.completeSale")} • {total.toLocaleString()} MMK
                  </>
                )}
              </button>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Markup Calculator Modal */}
      {showMarkupCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Fixed Amount Markup
              </h2>
              <button
                onClick={() => {
                  setShowMarkupCalculator(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Subtotal */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Current Subtotal</p>
                <p className="text-2xl font-bold text-slate-800">
                  {subtotal.toLocaleString()} MMK
                </p>
              </div>

              {/* Markup Amount Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Markup Amount (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter markup amount..."
                  value={markupAmount}
                  onChange={(e) => setMarkupAmount(Number(e.target.value))}
                />
              </div>
              {/* Calculated Percentage */}
              {markupAmount && Number(markupAmount) > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">
                      Markup Amount:
                    </span>
                    <span className="font-bold text-blue-700">
                      {Number(markupAmount).toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Percentage:</span>
                    <span className="font-bold text-blue-700">
                      {((Number(markupAmount) / subtotal) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Final Total:</span>
                    <span className="font-bold text-slate-800">
                      {(subtotal + Number(markupAmount)).toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowMarkupCalculator(false);
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (markupAmount && Number(markupAmount) > 0) {
                      setMarkupAmount(Number(markupAmount));
                      setShowMarkupCalculator(false);
                      toast.success(
                        `Markup set to ${Number(markupAmount).toLocaleString()} MMK`,
                      );
                    }
                  }}
                  disabled={!markupAmount || Number(markupAmount) <= 0}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Discount Calculator
              </h2>
              <button
                onClick={() => {
                  setShowDiscountCalculator(false);
                  setDiscountAmount("");
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Current Subtotal */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Current Subtotal</p>
                <p className="text-2xl font-bold text-slate-800">
                  {subtotal.toLocaleString()} MMK
                </p>
              </div>

              {/* Discount Amount Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Discount Amount (MMK)
                </label>
                <input
                  type="number"
                  min="0"
                  max={subtotal}
                  className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter discount amount..."
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                />
              </div>

              {/* Calculated Percentage */}
              {discountAmount && Number(discountAmount) > 0 && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">
                      Discount Amount:
                    </span>
                    <span className="font-bold text-green-700">
                      {Number(discountAmount).toLocaleString()} MMK
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-600">Percentage:</span>
                    <span className="font-bold text-green-700">
                      {((Number(discountAmount) / subtotal) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Final Total:</span>
                    <span className="font-bold text-slate-800">
                      {(subtotal - Number(discountAmount)).toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowDiscountCalculator(false);
                    setDiscountAmount("");
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (discountAmount && Number(discountAmount) > 0) {
                      const calculatedPercentage =
                        (Number(discountAmount) / subtotal) * 100;
                      setDiscount(Number(calculatedPercentage)); // Use number for consistency
                      setShowDiscountCalculator(false);
                      setDiscountAmount("");
                      toast.success(`Discount set to ${calculatedPercentage}%`);
                    }
                  }}
                  disabled={
                    !discountAmount ||
                    Number(discountAmount) <= 0 ||
                    Number(discountAmount) > subtotal
                  }
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b bg-green-50">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-gray-800">
                  {t("pos.addCreditPerson")}
                </h3>
                <button
                  onClick={() => setShowAddCreditPersonModal(false)}
                  className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("credits.name")} *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={newCreditPersonName}
                  onChange={(e) => setNewCreditPersonName(e.target.value)}
                  placeholder={t("credits.namePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("credits.phone")} *
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={newCreditPersonPhone}
                  onChange={(e) => setNewCreditPersonPhone(e.target.value)}
                  placeholder={t("credits.phonePlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("credits.address")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  value={newCreditPersonAddress}
                  onChange={(e) => setNewCreditPersonAddress(e.target.value)}
                  placeholder={t("credits.addressPlaceholder")}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex gap-2">
              <button
                onClick={() => setShowAddCreditPersonModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={async () => {
                  if (!newCreditPersonName.trim()) {
                    toast.error(t("credits.nameRequired"));
                    return;
                  }
                  if (!newCreditPersonPhone.trim()) {
                    toast.error(t("credits.phoneRequired"));
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
                      toast.success(t("credits.profileCreated"));
                      await loadCreditPersonas();
                      setSelectedCreditPersonId(result.data._id);
                      setShowAddCreditPersonModal(false);
                    } else {
                      toast.error(
                        result.message || t("credits.failedToCreate"),
                      );
                    }
                  } catch {
                    toast.error(t("credits.failedToCreate"));
                  } finally {
                    setIsAddingCreditPerson(false);
                  }
                }}
                disabled={isAddingCreditPerson}
                className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAddingCreditPerson ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("credits.creating")}
                  </>
                ) : (
                  t("credits.createProfile")
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Success Icon and Header */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t("pos.saleCompleted")}
              </h2>
              <p className="text-green-50 text-sm">
                Your order has been processed successfully
              </p>
            </div>

            {/* Action Button */}
            <div className="p-6 pt-6">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setSuccessOrderNumber("");
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-bold transition-colors shadow-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
