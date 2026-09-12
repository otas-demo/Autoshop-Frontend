import React, { useRef, useState, useEffect } from "react";
import {
  ImagePlus,
  Upload,
  Loader2,
  Store,
  Trash2,
  Check,
  Printer,
  EyeOff,
  Phone,
  MapPin,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import {
  uploadShopLogo,
  validateShopLogoFile,
} from "../../services/ShopSettings/uploadShopLogo";
import { deleteShopLogo } from "../../services/ShopSettings/deleteShopLogo";
import {
  ShopLogoItem,
  ShopSettings,
  BrandingProfileItem,
} from "../../services/ShopSettings/fetchShopSettings";
import { saveShopSettings } from "../../services/ShopSettings/saveShopSettings";
import {
  getSavedReceiptLogoSlot,
  saveReceiptLogoSlot,
} from "../../utils/receiptLogo";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";

interface ShopLogoUploadProps {
  shopSettings?: ShopSettings | null;
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
  shopSettings,
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

  // Editable Profile Info for slots 1, 2, 3
  const [profileData, setProfileData] = useState<Record<number, { name: string; phoneNumber: string; address: string }>>({
    1: { name: "", phoneNumber: "", address: "" },
    2: { name: "", phoneNumber: "", address: "" },
    3: { name: "", phoneNumber: "", address: "" },
  });
  const [isSavingProfiles, setIsSavingProfiles] = useState(false);

  useEffect(() => {
    setSelectedReceiptSlot(getSavedReceiptLogoSlot());
  }, []);

  useEffect(() => {
    if (shopSettings) {
      const p1 = shopSettings.brandingProfiles?.find((p) => p.slot === 1);
      const p2 = shopSettings.brandingProfiles?.find((p) => p.slot === 2);
      const p3 = shopSettings.brandingProfiles?.find((p) => p.slot === 3);

      setProfileData({
        1: {
          name: p1?.name || "",
          phoneNumber: p1?.phoneNumber || "",
          address: p1?.address || "",
        },
        2: {
          name: p2?.name || "",
          phoneNumber: p2?.phoneNumber || "",
          address: p2?.address || "",
        },
        3: {
          name: p3?.name || "",
          phoneNumber: p3?.phoneNumber || "",
          address: p3?.address || "",
        },
      });
    }
  }, [shopSettings]);

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
      toast.success(
        t("settings.receiptLogoDisabled") ||
          "No logo will be printed on receipts",
      );
    } else {
      const chosenName =
        profileData[slot]?.name ||
        (slot === 1
          ? t("settings.logoSlot1")
          : slot === 2
          ? t("settings.logoSlot2")
          : t("settings.logoSlot3"));
      toast.success(
        `${
          t("settings.defaultReceiptLogoSet") || "Active receipt profile set to"
        } ${chosenName}`,
      );
    }
  };

  const handleFileChange = (
    slot: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
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
      toast.error(
        t("settings.selectImageFirst") || "Please select an image first",
      );
      return;
    }

    setSlotStates((prev) => ({
      ...prev,
      [slot]: { ...prev[slot], isUploading: true },
    }));

    try {
      const response = await uploadShopLogo(state.file, slot);
      if (response.success) {
        toast.success(
          `Logo ${slot} ${
            t("settings.uploadedSuccessfully") || "uploaded successfully"
          }`,
        );
        setSlotStates((prev) => ({
          ...prev,
          [slot]: {
            file: null,
            preview: null,
            isUploading: false,
            isDeleting: false,
          },
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
      toast.error(
        error instanceof Error ? error.message : `Failed to upload logo ${slot}`,
      );
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
        toast.success(
          `Logo ${slot} ${
            t("settings.deletedSuccessfully") || "deleted successfully"
          }`,
        );
        setSlotStates((prev) => ({
          ...prev,
          [slot]: {
            file: null,
            preview: null,
            isUploading: false,
            isDeleting: false,
          },
        }));
        if (fileInputRefs[slot as 1 | 2 | 3].current) {
          fileInputRefs[slot as 1 | 2 | 3].current!.value = "";
        }
        setDeleteTargetSlot(null);

        // If deleted slot was the selected receipt logo, switch to slot 1 or fallback
        if (selectedReceiptSlot === slot) {
          const remaining = [1, 2, 3].filter(
            (s) => s !== slot && getSlotLogo(s),
          );
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
      toast.error(
        error instanceof Error ? error.message : `Failed to delete logo ${slot}`,
      );
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

  const handleSaveProfiles = async () => {
    if (!shopSettings) return;

    setIsSavingProfiles(true);
    try {
      const updatedProfiles: BrandingProfileItem[] = [1, 2, 3].map((slot) => ({
        slot,
        name: profileData[slot]?.name?.trim() || "",
        phoneNumber: profileData[slot]?.phoneNumber?.trim() || "",
        address: profileData[slot]?.address?.trim() || "",
      }));

      const res = await saveShopSettings({
        shopName: shopSettings.shopName,
        address: shopSettings.address,
        phoneNumber: shopSettings.phoneNumber,
        brandingProfiles: updatedProfiles,
      });

      if (res.success) {
        toast.success(
          t("settings.savedSuccessfully") ||
            "Branding profiles saved successfully",
        );
        onSuccess();
      } else {
        toast.error(res.message || "Failed to save branding profiles");
      }
    } catch (error) {
      console.error("Error saving profiles:", error);
      toast.error("Failed to save branding profiles");
    } finally {
      setIsSavingProfiles(false);
    }
  };

  const slotLabels: Record<number, string> = {
    1: t("settings.logoSlot1") || "Profile 1 (Primary)",
    2: t("settings.logoSlot2") || "Profile 2",
    3: t("settings.logoSlot3") || "Profile 3",
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <ImagePlus className="w-5 h-5 text-[#2216a8]" />
              {t("settings.shopLogosTitle") ||
                "Voucher Branding Profiles (3 Pairs of Logo, Phone & Address)"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t("settings.shopLogosDesc") ||
                "Configure up to 3 separate profiles (Logo, Phone Number & Address) tailored for different devices (Desktop/A4, POS Thermal) or branches."}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Save Profiles Button */}
            {shopSettings && (
              <button
                type="button"
                onClick={handleSaveProfiles}
                disabled={isSavingProfiles}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSavingProfiles ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>
                  {isSavingProfiles
                    ? t("settings.saving") || "Saving..."
                    : t("settings.saveBrandingProfiles") || "Save Profiles"}
                </span>
              </button>
            )}

            {/* Quick toggle for No Logo on receipts */}
            <button
              type="button"
              onClick={() =>
                handleSelectReceiptSlot(selectedReceiptSlot === 0 ? 1 : 0)
              }
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedReceiptSlot === 0
                  ? "bg-amber-50 text-amber-800 border-amber-300 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {selectedReceiptSlot === 0 ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {t("settings.noLogoOnReceipts") || "Logo Hidden on Receipts"}
                  </span>
                </>
              ) : (
                <>
                  <Printer className="w-3.5 h-3.5 text-[#2216a8]" />
                  <span>
                    {t("settings.printLogoOnReceipts") || "Receipt Logo: Active"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3 Branding Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
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
                className={`rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xs space-y-3.5 ${
                  isSelectedForReceipt
                    ? "border-2 border-[#2216a8] bg-indigo-50/15 ring-2 ring-indigo-500/10"
                    : "border border-slate-200/80 bg-slate-50/30 hover:bg-white hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  {/* Slot Title & Receipt Selector */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-extrabold">
                        {slot}
                      </span>
                      {profileData[slot]?.name?.trim() || slotLabels[slot]}
                    </span>

                    {/* Receipt Badge / Selector Button */}
                    {isSelectedForReceipt ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#2216a8] text-white shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        {t("settings.activeOnReceipt") || "Active on Device"}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectReceiptSlot(slot)}
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50 transition-all cursor-pointer shadow-2xs"
                      >
                        {t("settings.useForReceipt") || "Use on This Device"}
                      </button>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      if (!isSelectedForReceipt) {
                        handleSelectReceiptSlot(slot);
                      }
                    }}
                    className={`w-full h-28 rounded-xl bg-white border flex items-center justify-center overflow-hidden p-2 transition-all ${
                      !isSelectedForReceipt
                        ? "cursor-pointer hover:border-indigo-300"
                        : ""
                    } ${
                      isSelectedForReceipt
                        ? "border-indigo-200 shadow-inner"
                        : "border-slate-200/70"
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
                        <Store className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium text-slate-400">
                          No logo uploaded
                        </span>
                      </div>
                    )}
                  </div>

                  {/* File Input & Logo Buttons */}
                  <div>
                    <input
                      ref={fileInputRefs[slot as 1 | 2 | 3]}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleFileChange(slot, e)}
                      disabled={isBusy}
                      className="block w-full text-xs text-slate-500 mb-2 file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50/70 file:text-[#2216a8] hover:file:bg-indigo-100/80 disabled:opacity-50 cursor-pointer"
                    />

                    {state.file && (
                      <div className="flex gap-2">
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
                          <span>
                            {state.isUploading ? "Uploading..." : "Save Logo"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearSelection(slot)}
                          disabled={isBusy}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {!state.file && hasSaved && (
                      <button
                        type="button"
                        onClick={() => setDeleteTargetSlot(slot)}
                        disabled={isBusy}
                        className="w-full px-2.5 py-1 text-[11px] font-semibold rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {state.isDeleting ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span>Delete Logo</span>
                      </button>
                    )}
                  </div>

                  {/* Profile Details (Name, Phone, Address) */}
                  <div className="pt-2 border-t border-slate-150 space-y-2 text-xs">
                    {/* Shop Name / Profile Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
                        <Store className="w-3 h-3 text-[#2216a8]" />
                        {t("settings.profileShopNameLabel") || "Shop Name"}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          shopSettings?.shopName
                            ? `Default: ${shopSettings.shopName}`
                            : t("settings.profileShopNamePlaceholder") ||
                              "Shop default name"
                        }
                        value={profileData[slot]?.name || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            [slot]: { ...prev[slot], name: e.target.value },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#2216a8]" />
                        {t("settings.phone") || "Phone Number"}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          shopSettings?.phoneNumber
                            ? `Default: ${shopSettings.phoneNumber}`
                            : t("settings.profilePhonePlaceholder") ||
                              "Shop default phone"
                        }
                        value={profileData[slot]?.phoneNumber || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            [slot]: {
                              ...prev[slot],
                              phoneNumber: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#2216a8]" />
                        {t("settings.address") || "Address"}
                      </label>
                      <textarea
                        rows={2}
                        placeholder={
                          shopSettings?.address
                            ? `Default: ${shopSettings.address}`
                            : t("settings.profileAddressPlaceholder") ||
                              "Shop default address"
                        }
                        value={profileData[slot]?.address || ""}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            [slot]: {
                              ...prev[slot],
                              address: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                      />
                    </div>
                  </div>
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
        isLoading={
          deleteTargetSlot !== null && slotStates[deleteTargetSlot]?.isDeleting
        }
      />
    </>
  );
};
