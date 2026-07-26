import React, { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { saveShopSettings } from "../../services/ShopSettings/saveShopSettings";
import { ShopSettings } from "../../services/ShopSettings/fetchShopSettings";
import { useLanguage } from "../../context/LanguageContext";

interface ShopSettingsFormProps {
  initialData?: ShopSettings | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const ShopSettingsForm: React.FC<ShopSettingsFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setShopName(initialData.shopName || "");
      setAddress(initialData.address || "");
      setPhoneNumber(initialData.phoneNumber || "");
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopName.trim() || !address.trim() || !phoneNumber.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await saveShopSettings({
        shopName: shopName.trim(),
        address: address.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      if (response.success) {
        toast.success(
          response.message || "Shop settings saved successfully",
        );
        onSuccess();
      } else {
        toast.error(response.message || "Failed to save shop settings");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save shop settings",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 sm:p-6"
    >
      <h3 className="text-base font-semibold text-slate-800 mb-4">
        {initialData ? t("settings.editShopDetails") : t("settings.createShopSettings")}
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="shopName"
            className="block text-sm font-semibold text-slate-500 mb-1"
          >
            {t("settings.shopNameLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="shopName"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder="My Super Shop"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="address"
            className="block text-sm font-semibold text-slate-500 mb-1"
          >
            {t("settings.addressLabel")} <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main Street, Yangon, Myanmar"
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none outline-none transition-all"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-semibold text-slate-500 mb-1"
          >
            {t("settings.phoneLabel")} <span className="text-red-500">*</span>
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="097913790/094556253"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSubmitting ? t("settings.saving") : t("settings.save")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {t("settings.cancel")}
          </button>
        )}
      </div>
    </form>
  );
};
