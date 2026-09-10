import React, { useRef, useState, useEffect } from "react";
import { ImagePlus, Upload, Loader2, Store, Trash2, Check, Printer, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  uploadShopLogo,
  validateShopLogoFile,
} from "../../services/ShopSettings/uploadShopLogo";
import { deleteShopLogo } from "../../services/ShopSettings/deleteShopLogo";
import { ShopLogoItem } from "../../services/ShopSettings/fetchShopSettings";
import {
  getSavedReceiptLogoSlot,
  saveReceiptLogoSlot,
} from "../../utils/receiptLogo";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";

interface ShopLogoUploadProps {
  currentLogo?: string;
  logos?: ShopLogoItem[];
  shopName?: string;
  onSuccess: () => void;
}

interface SlotState {
  file: File | null;
  preview: string | null;
  isUploading: boolean;
  isDeleting: boolean;
}

export const ShopLogoUpload: React.FC<ShopLogoUploadProps> = ({
  currentLogo,
  logos = [],
  shopName,
  onSuccess,
}) => {
  const { t } = useLanguage();

  const fileInputRefs = {
    1: useRef<HTMLInputElement>(null),
    2: useRef<HTMLInputElement>(null),
    3: useRef<HTMLInputElement>(null),
  };

  const [slotStates, setSlotStates] = useState<Record<number, SlotState>>({
    1: { file: null, preview: null, isUploading: false, isDeleting: false },
    2: { file: null, preview: null, isUploading: false, isDeleting: false },
    3: { file: null, preview: null, isUploading: false, isDeleting: false },
  });

  const [selectedReceiptSlot, setSelectedReceiptSlot] = useState<number>(() =>
    getSavedReceiptLogoSlot(),
  );

  const [deleteTargetSlot, setDeleteTargetSlot] = useState<number | null>(null);

  useEffect(() => {
    setSelectedReceiptSlot(getSavedReceiptLogoSlot());
  }, []);

  const getSlotLogo = (slot: number): string | undefined => {
    const found = logos.find((l) => l.slot === slot);
    if (found?.url) return found.url;
    if (slot === 1 && currentLogo) return currentLogo;
    return undefined;
  };

  const handleSelectReceiptSlot = (slot: number) => {
    setSelectedReceiptSlot(slot);
    saveReceiptLogoSlot(slot);

    if (slot === 0) {
      toast.success(t("settings.receiptLogoDisabled") || "No logo will be printed on receipts");
    } else {
      toast.success(
        `${t("settings.defaultReceiptLogoSet") || "Default receipt logo set to"} Logo ${slot}`,
      );
    }
  };

  const handleFileChange = (slot: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateShopLogoFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSlotStates((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], file, preview: objectUrl },
    }));
  };

  const handleUpload = async (slot: number) => {
    const state = slotStates[slot];
    if (!state.file) {
      toast.error(t("settings.selectImageFirst") || "Please select an image first");
      return;
    }

    setSlotStates((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], isUploading: true },
    }));

    try {
      const response = await uploadShopLogo(state.file, slot);
      if (response.success) {
        toast.success(`Logo ${slot} ${t("settings.uploadedSuccessfully") || "uploaded successfully"}`);
        setSlotStates((prev) => ({
          ...prev,
          [slot]: { file: null, preview: null, isUploading: false, isDeleting: false },
        }));
        if (fileInputRefs[slot as 1 | 2 | 3].current) {
          fileInputRefs[slot as 1 | 2 | 3].current!.value = "";
        }
        // Auto-select this slot for receipt if user had no logo chosen or slot 1
        if (selectedReceiptSlot === 0 || selectedReceiptSlot === slot) {
          handleSelectReceiptSlot(slot);
        }
        onSuccess();
      } else {
        toast.error(response.message || `Failed to upload logo ${slot}`);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : `Failed to upload logo ${slot}`);
    } finally {
      setSlotStates((prev) => ({
        ...prev,
        [slot]: { ...prev[slot], isUploading: false },
      }));
    }
  };

  const handleDelete = async () => {
    if (deleteTargetSlot === null) return;
    const slot = deleteTargetSlot;

    setSlotStates((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], isDeleting: true },
    }));

    try {
      const response = await deleteShopLogo(slot);
      if (response.success) {
        toast.success(`Logo ${slot} ${t("settings.deletedSuccessfully") || "deleted successfully"}`);
        setSlotStates((prev) => ({
          ...prev,
          [slot]: { file: null, preview: null, isUploading: false, isDeleting: false },
        }));
        if (fileInputRefs[slot as 1 | 2 | 3].current) {
          fileInputRefs[slot as 1 | 2 | 3].current!.value = "";
        }
        setDeleteTargetSlot(null);

        // If deleted slot was the selected receipt logo, switch to slot 1 or fallback
        if (selectedReceiptSlot === slot) {
          const remaining = [1, 2, 3].filter((s) => s !== slot && getSlotLogo(s));
          if (remaining.length > 0) {
            handleSelectReceiptSlot(remaining[0]);
          } else {
            handleSelectReceiptSlot(1);
          }
        }

        onSuccess();
      } else {
        toast.error(response.message || `Failed to delete logo ${slot}`);
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : `Failed to delete logo ${slot}`);
    } finally {
      setSlotStates((prev) => ({
        ...prev,
        [slot]: { ...prev[slot], isDeleting: false },
      }));
    }
  };

  const handleClearSelection = (slot: number) => {
    setSlotStates((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], file: null, preview: null },
    }));
    if (fileInputRefs[slot as 1 | 2 | 3].current) {
      fileInputRefs[slot as 1 | 2 | 3].current!.value = "";
    }
  };

  const slotLabels: Record<number, string> = {
    1: t("settings.logoSlot1") || "Logo 1 (Primary)",
    2: t("settings.logoSlot2") || "Logo 2",
    3: t("settings.logoSlot3") || "Logo 3",
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-[#2216a8]" />
              {t("settings.shopLogosTitle") || "Shop Logos & Receipt Branding"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t("settings.shopLogosDesc") ||
                "Upload up to 3 shop logos. Click 'Use on Receipt' to set which logo prints on customer receipts."}
            </p>
          </div>

          {/* Quick toggle for No Logo on receipts */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleSelectReceiptSlot(selectedReceiptSlot === 0 ? 1 : 0)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedReceiptSlot === 0
                  ? "bg-amber-50 text-amber-800 border-amber-300 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {selectedReceiptSlot === 0 ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t("settings.noLogoOnReceipts") || "Logo Hidden on Receipts"}</span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5 text-[#2216a8]" />
                  <span>{t("settings.printLogoOnReceipts") || "Receipt Logo: Active"}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3 Logo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {[1, 2, 3].map((slot) => {
            const savedUrl = getSlotLogo(slot);
            const state = slotStates[slot];
            const displayUrl = state.preview || savedUrl;
            const hasSaved = Boolean(savedUrl);
            const isBusy = state.isUploading || state.isDeleting;
            const isSelectedForReceipt = selectedReceiptSlot === slot;

            return (
              <div
                key={slot}
                className={`rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs ${
                  isSelectedForReceipt
                    ? "border-2 border-[#2216a8] bg-indigo-50/15 ring-2 ring-indigo-500/10"
                    : "border border-slate-200/80 bg-slate-50/30 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Slot Title & Receipt Selector */}
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className="text-xs font-bold text-slate-800">
                      {slotLabels[slot]}
                    </span>

                    {/* Receipt Badge / Selector Button */}
                    {hasSaved && (
                      isSelectedForReceipt ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#2216a8] text-white shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                          {t("settings.activeOnReceipt") || "On Receipt"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectReceiptSlot(slot)}
                          className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50 transition-all cursor-pointer shadow-2xs"
                        >
                          {t("settings.useForReceipt") || "Use on Receipt"}
                        </button>
                      )
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      if (hasSaved && !isSelectedForReceipt) {
                        handleSelectReceiptSlot(slot);
                      }
                    }}
                    className={`w-full aspect-video sm:h-32 rounded-xl bg-white border flex items-center justify-center overflow-hidden mb-3 p-2 transition-all ${
                      hasSaved && !isSelectedForReceipt ? "cursor-pointer hover:border-indigo-300" : ""
                    } ${
                      isSelectedForReceipt ? "border-indigo-200 shadow-inner" : "border-slate-200/70"
                    }`}
                  >
                    {displayUrl ? (
                      <img
                        src={displayUrl}
                        alt={`${shopName || "Shop"} Logo ${slot}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300">
                        <Store className="w-7 h-7 mb-1" />
                        <span className="text-[11px] font-medium text-slate-400">No logo uploaded</span>
                      </div>
                    )}
                  </div>

                  {/* File Input */}
                  <input
                    ref={fileInputRefs[slot as 1 | 2 | 3]}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileChange(slot, e)}
                    disabled={isBusy}
                    className="block w-full text-xs text-slate-500 mb-3 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50/70 file:text-[#2216a8] hover:file:bg-indigo-100/80 disabled:opacity-50 cursor-pointer"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  {state.file && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpload(slot)}
                        disabled={isBusy}
                        className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {state.isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{state.isUploading ? "Uploading..." : "Save Logo"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleClearSelection(slot)}
                        disabled={isBusy}
                        className="px-2.5 py-1.5 text-xs font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                      >
                        Clear
                      </button>
                    </>
                  )}

                  {!state.file && hasSaved && (
                    <button
                      type="button"
                      onClick={() => setDeleteTargetSlot(slot)}
                      disabled={isBusy}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {state.isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span>Delete Logo</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteTargetSlot !== null}
        title={`Delete Logo ${deleteTargetSlot}`}
        message={`Are you sure you want to delete Logo ${deleteTargetSlot}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetSlot(null)}
        isLoading={deleteTargetSlot !== null && slotStates[deleteTargetSlot]?.isDeleting}
      />
    </>
  );
};
