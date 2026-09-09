import React, { useState, useEffect, useCallback } from "react";
import { Store, RefreshCw, Loader2, AlertTriangle, Edit, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  fetchShopSettings,
  ShopSettings,
} from "../../services/ShopSettings/fetchShopSettings";
import { ShopInfoCard } from "./ShopInfoCard";
import { BusinessHoursCard } from "./BusinessHoursCard";
import { SocialMediaCard } from "./SocialMediaCard";
import { ShopSettingsForm } from "./ShopSettingsForm";
import { ShopLogoUpload } from "./ShopLogoUpload";
import { PrintPaperSizeSettingsCard } from "./PrintPaperSizeSettingsCard";
import { DailyReportScheduleCard } from "./DailyReportScheduleCard";
import { useLanguage } from "../../context/LanguageContext";

export const ShopSettingsTab: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const loadShopSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchShopSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        setIsEditing(false);
      } else {
        setSettings(null);
        if (!response.success) {
          toast.error(response.message || "Failed to load shop settings");
        }
      }
    } catch (error) {
      console.error("Error loading shop settings:", error);
      toast.error("Failed to load shop settings");
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShopSettings();
  }, [loadShopSettings]);

  const handleSaveSuccess = () => {
    setIsEditing(false);
    loadShopSettings();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Store className="w-5 h-5 mr-2 text-[#2216a8]" />
          {t("settings.shopSettingsTab")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {settings && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>{t("settings.edit")}</span>
            </button>
          )}
          <button
            onClick={loadShopSettings}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>{t("settings.refresh")}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 mt-6">
          <Loader2 className="w-8 h-8 animate-spin text-[#2216a8] mx-auto mb-2" />
          <p className="font-medium">Loading shop settings...</p>
        </div>
      ) : isEditing || !settings ? (
        <div className="space-y-6">
          {!settings && (
            <div className="p-6 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl">
              <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium">No shop settings yet. Create one below.</p>
            </div>
          )}
          <ShopSettingsForm
            initialData={settings}
            onSuccess={handleSaveSuccess}
            onCancel={settings ? () => setIsEditing(false) : undefined}
          />
          {settings && (
            <ShopLogoUpload
              currentLogo={settings.logo}
              shopName={settings.shopName}
              onSuccess={loadShopSettings}
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <ShopInfoCard settings={settings} />
          {/* <ShopLogoUpload
            currentLogo={settings.logo}
            shopName={settings.shopName}
            onSuccess={loadShopSettings}
          /> */}
          {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BusinessHoursCard businessHours={settings.businessHours} />
            <SocialMediaCard socialMedia={settings.socialMedia} />
          </div> */}
        </div>
      )}

      {/* {settings && !isEditing && (
        <div className="mt-6">
          <DailyReportScheduleCard
            currentTime={settings.dailyReportTime || "21:00"}
            currentEnabled={settings.dailyReportEnabled !== false}
            onSuccess={loadShopSettings}
          />
        </div>
      )} */}

      <div className="mt-6">
        <PrintPaperSizeSettingsCard />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 mt-6">
        <h3 className="text-base font-semibold text-slate-800 mb-1 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#2216a8]" />
          {t("settings.languageSettings")}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          {t("settings.languageSettingsDesc")}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all cursor-pointer ${language === "en"
                ? "bg-[#2216a8] text-white border-[#2216a8] shadow-md shadow-indigo-600/10"
                : "bg-white text-[#2216a8] border-indigo-200 hover:bg-indigo-50/50"
              }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("my")}
            className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all cursor-pointer ${language === "my"
                ? "bg-[#2216a8] text-white border-[#2216a8] shadow-md shadow-indigo-600/10"
                : "bg-white text-[#2216a8] border-indigo-200 hover:bg-indigo-50/50"
              }`}
          >
            မြန်မာ
          </button>
        </div>
      </div>
    </div>
  );
};
