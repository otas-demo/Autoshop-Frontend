import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, CreditCard, Calendar, DollarSign, Clock, Edit3 } from "lucide-react";
import { Modal } from "../Modal";
import { Supplier, Product, PurchaseOrderItem } from "../../types";
import { createPurchase } from "../../services/Purchase/createPurchase";
import { updatePurchase } from "../../services/Purchase/updatePurchase";
import { PurchaseDetail } from "../../services/Purchase/fetchPurchaseById";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  onSuccess: () => void;
  defaultSupplierId?: string;
  editingPO?: PurchaseDetail | null;
}

export const CreatePOModal: React.FC<CreatePOModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  onSuccess,
  defaultSupplierId,
  editingPO,
}) => {
  const { language } = useLanguage();
  const isMy = language === "my";

  const [poSupplierId, setPOSupplierId] = useState(defaultSupplierId || "");
  const [poItems, setPOItems] = useState<PurchaseOrderItem[]>([]);
  const [poSelectedProduct, setPOSelectedProduct] = useState("");
  const [poQty, setPOQty] = useState(1);
  const [poItemNote, setPOItemNote] = useState("");
  const [poNote, setPONote] = useState("");
  const [poNewProductName, setPONewProductName] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Credit Purchase States
  const [paymentType, setPaymentType] = useState<"paid" | "credit">("paid");
  const [initialPaidAmount, setInitialPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "kpay" | "wave" | "bank_transfer" | "other"
  >("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingPO) {
        const supId =
          typeof editingPO.supplierId === "object"
            ? (editingPO.supplierId as any)?._id || (editingPO.supplierId as any)?.id
            : editingPO.supplierId;
        setPOSupplierId(supId || "");

        const mappedItems: PurchaseOrderItem[] = (editingPO.products || []).map((p) => {
          const invId =
            typeof p.inventoryId === "object"
              ? (p.inventoryId as any)?._id || (p.inventoryId as any)?.id
              : p.inventoryId;
          return {
            productId: invId,
            name: p.productName,
            qty: p.purchaseQuantity,
            costPrice: p.buyingPrice,
            note: "",
          };
        });
        setPOItems(mappedItems);
        setPONote(
          editingPO.note === "No note available" ? "" : editingPO.note || ""
        );
        setPaymentType(editingPO.paymentType === "credit" ? "credit" : "paid");
        setInitialPaidAmount(editingPO.paidAmount || 0);
        setDueDate(
          editingPO.dueDate
            ? new Date(editingPO.dueDate).toISOString().split("T")[0]
            : ""
        );
        setPaymentMethod("cash");
      } else {
        if (defaultSupplierId) {
          setPOSupplierId(defaultSupplierId);
        } else {
          setPOSupplierId("");
        }
        setPOItems([]);
        setPONote("");
        setPaymentType("paid");
        setInitialPaidAmount(0);
        setDueDate("");
        setPaymentMethod("cash");
      }
      setPOSelectedProduct("");
      setProductSearchQuery("");
      setPONewProductName("");
      setPOQty(1);
      setPOItemNote("");
    }
  }, [isOpen, editingPO, defaultSupplierId]);

  const isProductSupplied = (p: Product, supplierId: string) => {
    if (!supplierId) return false;
    return (p.supplierIds || []).some((s: any) => {
      const sId = typeof s === "object" ? s?._id || s?.id : s;
      return String(sId) === String(supplierId);
    });
  };

  // Products belonging to the currently selected supplier (only active products)
  const supplierProducts = poSupplierId
    ? products.filter(
      (p) =>
        isProductSupplied(p, poSupplierId) &&
        (p.status === "active" || (!p.status && !(p as any).isDeleted)) &&
        p.status !== "inactive" &&
        p.status !== "discontinued" &&
        !(p as any).isDeleted,
    )
    : [];

  // Filtered by search query (name or productCode)
  const filteredProducts = supplierProducts.filter((product) => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return true;
    const nameMatch = (product.productName || product.name || "")
      .toLowerCase()
      .includes(query);
    const codeMatch = (product.productCode || "")
      .toLowerCase()
      .includes(query);
    return nameMatch || codeMatch;
  });

  const handleSupplierChange = (newSupplierId: string) => {
    setPOSupplierId(newSupplierId);
    setPOSelectedProduct("");
    setProductSearchQuery("");
  };

  const handleProductSelect = (productId: string, productName: string) => {
    setPOSelectedProduct(productId);
    setProductSearchQuery(productName);
    setShowProductDropdown(false);
    setPONewProductName("");
  };

  const handleProductInputChange = (value: string) => {
    setProductSearchQuery(value);
    setShowProductDropdown(true);
    if (value === "") {
      setPOSelectedProduct("");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addPOItem = () => {
    if (!poSelectedProduct && !poNewProductName) return;
    if (poQty <= 0) return;

    let productId = poSelectedProduct;
    let productName = "";
    let buyingPrice = 0;

    if (poSelectedProduct) {
      const product = products.find(
        (p) => (p._id || p.id) === poSelectedProduct,
      );
      if (!product) return;
      productName = product.productName || product.name;
      buyingPrice = (product as any).buyingPrice ?? product.costPrice ?? 0;
    } else {
      // New product - generate ID
      productId = `new-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      productName = poNewProductName;
    }

    setPOItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          (productId && item.productId === productId) ||
          (productName &&
            item.name.trim().toLowerCase() ===
            productName.trim().toLowerCase()),
      );

      if (existingIndex > -1) {
        // Merge quantity into existing item row
        const updated = [...prev];
        const existingItem = updated[existingIndex];
        updated[existingIndex] = {
          ...existingItem,
          qty: existingItem.qty + poQty,
          costPrice: buyingPrice || existingItem.costPrice,
          note: poItemNote
            ? existingItem.note
              ? `${existingItem.note}, ${poItemNote}`
              : poItemNote
            : existingItem.note,
        };
        return updated;
      } else {
        const newItem: PurchaseOrderItem = {
          productId,
          name: productName,
          qty: poQty,
          costPrice: buyingPrice,
          note: poItemNote,
        };
        return [...prev, newItem];
      }
    });

    setPOSelectedProduct("");
    setProductSearchQuery("");
    setShowProductDropdown(false);
    setPONewProductName("");
    setPOQty(1);
    setPOItemNote("");
  };

  const removePOItem = (index: number) => {
    const itemToRemove = poItems[index];
    setPOItems((prev) => prev.filter((_, i) => i !== index));
    if (
      itemToRemove &&
      (itemToRemove.productId === poSelectedProduct ||
        itemToRemove.name === productSearchQuery)
    ) {
      setPOSelectedProduct("");
      setProductSearchQuery("");
    }
  };

  const submitPO = async () => {
    if (!poSupplierId) {
      toast.error("ကျေးဇူးပြု၍ Supplier (ကုန်ပစ္စည်းတင်သွင်းသူ) ကို ရွေးချယ်ပေးပါ");
      return;
    }
    if (poItems.length === 0) {
      toast.error("ကျေးဇူးပြု၍ ကုန်ပစ္စည်း အနည်းဆုံး ၁ မျိုး ထည့်သွင်းပေးပါ");
      return;
    }

    // Calculate total amount
    const totalAmount = poItems.reduce(
      (sum, item) => sum + item.qty * item.costPrice,
      0,
    );

    if (paymentType === "credit") {
      if (initialPaidAmount > totalAmount) {
        toast.error("ကြိုတင်ပေးငွေသည် စုစုပေါင်းကုန်ကျငွေထက် မကျော်လွန်နိုင်ပါ");
        return;
      }
      if (!dueDate) {
        toast.error("အကြွေးဆပ်ရမည့်ရက် (Due Date) ကို ထည့်သွင်းပေးပါ");
        return;
      }
    }

    const payload = {
      products: poItems.map((item) => ({
        inventoryId: item.productId,
        purchaseQuantity: item.qty,
      })),
      supplierId: poSupplierId,
      note: poNote,
      totalAmount,
      paymentType,
      paidAmount: paymentType === "credit" ? initialPaidAmount : totalAmount,
      dueDate: paymentType === "credit" && dueDate ? dueDate : null,
      paymentMethod,
    };

    setIsSubmitting(true);
    try {
      if (editingPO) {
        const response = await updatePurchase(editingPO._id, payload);
        if (response.success) {
          toast.success(
            isMy
              ? "Purchase Order ပြင်ဆင်ခြင်း အောင်မြင်ပါသည်!"
              : "Purchase Order Updated Successfully!"
          );
          onSuccess();
          onClose();
        } else {
          toast.error(
            response.message ||
            (isMy
              ? "Purchase Order ပြင်ဆင်ခြင်း မအောင်မြင်ပါ"
              : "Failed to update Purchase Order")
          );
        }
      } else {
        const response = await createPurchase(payload);
        if (response.success) {
          toast.success(
            isMy
              ? "Purchase Order အသစ်ထည့်သွင်းခြင်း အောင်မြင်ပါသည်!"
              : "Purchase Order Created Successfully!"
          );
          setPOSupplierId("");
          setPOItems([]);
          setPONote("");
          setPaymentType("paid");
          setInitialPaidAmount(0);
          setDueDate("");
          setPaymentMethod("cash");
          onSuccess();
          onClose();
        } else {
          toast.error(
            response.message ||
            (isMy
              ? "Purchase Order ထည့်သွင်းခြင်း မအောင်မြင်ပါ"
              : "Failed to create Purchase Order")
          );
        }
      }
    } catch (error: any) {
      console.error("Failed to save PO:", error);
      toast.error(
        error.message ||
        (isMy
          ? "လုပ်ဆောင်ချက် မအောင်မြင်ပါ"
          : "An error occurred while saving the Purchase Order")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = editingPO
    ? isMy
      ? `ဝယ်ယူမှု အော်ဒါ ပြင်ဆင်မည် (${editingPO.poNumber})`
      : `Edit Purchase Order (${editingPO.poNumber})`
    : isMy
      ? "ဝယ်ယူမှု အော်ဒါ အသစ်ထည့်မည်"
      : "Create Purchase Order";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>
                  Supplier Name <span className="text-red-500">*</span>
                </span>
                {!poSupplierId && (
                  <span className="text-[10px] text-amber-600 font-semibold">
                    (ရွေးချယ်ရန် လိုအပ်သည်)
                  </span>
                )}
              </label>
              <select
                className={`w-full border rounded-xl p-2.5 text-sm font-medium transition-all ${!poSupplierId
                    ? "border-amber-400 bg-amber-50/20 text-slate-600 focus:border-amber-500"
                    : "border-slate-200 bg-white text-slate-800 focus:border-[#2216a8]"
                  }`}
                value={poSupplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id || supplier._id}
                    value={supplier.id || supplier._id}
                  >
                    {supplier.supplierName}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-700">
                  Add Item to PO
                </label>
                {poSupplierId && (
                  <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                    {supplierProducts.length} မျိုး ရရှိနိုင်ပါသည်
                  </span>
                )}
              </div>
              <div className="mb-2 relative" ref={productDropdownRef}>
                <input
                  type="text"
                  disabled={!poSupplierId}
                  className={`w-full border rounded-xl p-2.5 pr-8 text-sm transition-all ${!poSupplierId
                      ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-800 border-slate-300 focus:border-[#2216a8]"
                    }`}
                  placeholder={
                    !poSupplierId
                      ? "ကျေးဇူးပြု၍ အထက်တွင် Supplier အရင်ရွေးချယ်ပါ..."
                      : "Type to search and select product..."
                  }
                  value={productSearchQuery}
                  onChange={(e) => handleProductInputChange(e.target.value)}
                  onFocus={() => {
                    if (poSupplierId) setShowProductDropdown(true);
                  }}
                />
                {productSearchQuery && (
                  <button
                    onClick={() => {
                      setProductSearchQuery("");
                      setPOSelectedProduct("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showProductDropdown && poSupplierId && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 max-h-60 overflow-y-auto shadow-xl">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p) => {
                        const price =
                          (p as any).buyingPrice ?? p.costPrice ?? 0;
                        const existingInPO = poItems.find(
                          (item) => item.productId === (p._id || p.id),
                        );
                        return (
                          <div
                            key={p._id || p.id}
                            className={`px-3.5 py-2.5 hover:bg-indigo-50/80 cursor-pointer text-sm flex items-center justify-between transition-colors border-b border-gray-50 last:border-0 ${existingInPO ? "bg-indigo-50/30" : ""
                              }`}
                            onClick={() =>
                              handleProductSelect(
                                p._id || p.id,
                                p.productName || p.name,
                              )
                            }
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-800">
                                  {p.productName || p.name}
                                </span>
                                {existingInPO && (
                                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-1.5 py-0.5 rounded">
                                    ထည့်ပြီး: {existingInPO.qty} ခု
                                  </span>
                                )}
                              </div>
                              {p.productCode && (
                                <span className="text-[11px] text-slate-400">
                                  Code: {p.productCode}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-indigo-900">
                                {price.toLocaleString()} Ks
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-4 text-center text-slate-500 text-xs font-medium">
                        {supplierProducts.length === 0
                          ? "ဤ Supplier နှင့် ချိတ်ဆက်ထားသော ပစ္စည်း Inventory ထဲတွင် မရှိသေးပါ"
                          : "ရှာဖွေမှုနှင့် ကိုက်ညီသော ပစ္စည်းမရှိပါ"}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">
                  Quantity
                </label>
                <div className="flex  gap-2">
                  <input
                    type="number"
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Qty"
                    value={poQty === 0 ? "" : poQty}
                    onChange={(e) => {
                      const val = e.target.value === "" ? 0 : Number(e.target.value);
                      if (val >= 0) {
                        setPOQty(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    min="1"
                  />
                  <button
                    onClick={addPOItem}
                    className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Note (Optional)
              </label>
              <textarea
                className="w-full border rounded p-2 text-sm"
                value={poNote}
                onChange={(e) => setPONote(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex flex-col">
          <h2 className="font-bold text-lg mb-4">PO Summary</h2>
          <div className="flex-1 overflow-x-auto mb-4">
            <table className="w-full text-sm text-left min-w-[500px]">
              <thead className="bg-slate-50">
                <tr className="border-b">
                  <th className="py-2 px-1 w-48">Item</th>
                  <th className="py-2 px-1">Qty</th>
                  <th className="py-2 px-1">Unit Price</th>
                  <th className="py-2 px-1">Cost Price</th>
                  <th className="py-2 px-1 w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                {poItems.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 px-1">{item.name}</td>
                    <td className="py-2 px-1">{item.qty}</td>
                    <td className="py-2 px-1">{item.costPrice.toLocaleString()}</td>
                    <td className="py-2 px-1">
                      {(item.costPrice * item.qty).toLocaleString()}
                    </td>
                    <td className="py-2 px-1">
                      <button
                        onClick={() => removePOItem(i)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {poItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-4">
                      No items added
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={5} className="text-right py-2">
                    Total:{" "}
                    {poItems
                      .reduce(
                        (total, item) => total + item.costPrice * item.qty,
                        0,
                      )
                      .toLocaleString()}{" "}
                    MMK
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Terms Section */}
          <div className="mb-4 p-4 bg-[#f8fafc] border border-slate-200/80 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#2216a8]" />
                ငွေပေးချေမှုပုံစံ (Payment Terms)
              </span>
            </div>

            {/* Theme Styled Segmented Buttons */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setPaymentType("paid");
                  setInitialPaidAmount(0);
                  setDueDate("");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${paymentType === "paid"
                    ? "bg-[#2216a8] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                အပြည့်ချေ (Paid in Full)
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("credit")}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${paymentType === "credit"
                    ? "bg-[#2216a8] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                အကြွေးဝယ်ယူမည် (Credit)
              </button>
            </div>

            {paymentType === "credit" && (
              <div className="space-y-3 pt-2 border-t border-slate-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ကြိုတင်ပေးငွေ (Down Payment)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={poItems.reduce((sum, item) => sum + item.qty * item.costPrice, 0)}
                      value={initialPaidAmount || ""}
                      onChange={(e) => setInitialPaidAmount(Number(e.target.value) || 0)}
                      placeholder="0 MMK"
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      ဆပ်ရမည့်ရက် (Due Date) *
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] text-slate-800"
                    />
                  </div>
                </div>

                {initialPaidAmount > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      ကြိုတင်ပေးငွေ ပေးချေသည့်စနစ် (Payment Method)
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e: any) => setPaymentMethod(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-[#2216a8]/20 focus:border-[#2216a8] text-slate-800"
                    >
                      <option value="cash">Cash (လက်ငင်း)</option>
                      <option value="kpay">KBZ Pay</option>
                      <option value="wave">Wave Pay</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}

                {/* Theme-styled Remaining Debt Box */}
                <div className="bg-[#f0effb]/70 p-3 rounded-xl border border-indigo-100/80 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">
                    ကျန်ရှိမည့် အကြွေး (Remaining Debt):
                  </span>
                  <span className="font-black text-sm text-[#2216a8]">
                    {Math.max(
                      0,
                      poItems.reduce((sum, item) => sum + item.qty * item.costPrice, 0) -
                      (initialPaidAmount || 0)
                    ).toLocaleString()}{" "}
                    MMK
                  </span>
                </div>
              </div>
            )}
          </div>

          {poNote && (
            <div className="mb-4 p-3 bg-gray-50 border border-slate-200/80 rounded-xl text-sm">
              <span className="font-semibold text-gray-600 block mb-1 text-xs">
                Order Note:
              </span>
              <p className="text-gray-800 text-xs">{poNote}</p>
            </div>
          )}
          {!poSupplierId && (
            <div className="mb-2 p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 font-bold flex items-center justify-center gap-1.5">
              <span>⚠️</span>
              <span>ဘယ်ဘက်ခြမ်းရှိ Supplier Name ကို ရွေးချယ်ပေးရန် လိုအပ်ပါသည်</span>
            </div>
          )}
          <button
            onClick={submitPO}
            disabled={isSubmitting}
            className="w-full bg-[#2216a8] hover:bg-[#2216a8]/90 text-white py-3 rounded-xl font-bold text-sm cursor-pointer shadow-md shadow-indigo-600/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>
                  {editingPO
                    ? isMy
                      ? "ပြင်ဆင်နေသည်..."
                      : "Updating Purchase Order..."
                    : isMy
                      ? "လုပ်ဆောင်နေသည်..."
                      : "Creating Purchase Order..."}
                </span>
              </>
            ) : (
              <span>
                {editingPO
                  ? isMy
                    ? "အော်ဒါ ပြင်ဆင်မှု သိမ်းဆည်းမည်"
                    : "Update Purchase Order"
                  : isMy
                    ? "ဝယ်ယူမှု အော်ဒါ အတည်ပြုမည်"
                    : "Create Purchase Order"}
              </span>
            )}
          </button>
          <p className="text-xs text-slate-400 mt-2 text-center">
            {isMy
              ? "မှတ်ချက် - PO တင်ရုံဖြင့် ကုန်ပစ္စည်းလက်ကျန် (Stock) တိုးမည်မဟုတ်ပါ။ GRN သွင်းမှသာ Stock တိုးပါမည်။"
              : "Note: PO does NOT update stock. Use GRN to receive goods."}
          </p>
        </div>
      </div>
    </Modal>
  );
};
