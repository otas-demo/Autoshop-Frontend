import React, { useState, useEffect, useCallback } from "react";
import { Store, RefreshCw, Loader2, AlertTriangle, Edit } from "lucide-react";
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

export const ShopSettingsTab: React.FC = () => {
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
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <Store className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
          Shop Settings
        </h2>
        <div className="flex flex-wrap gap-2">
          {settings && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
          <button
            onClick={loadShopSettings}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 mt-6">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p>Loading shop settings...</p>
        </div>
      ) : isEditing || !settings ? (
        <div className="space-y-6">
          {!settings && (
            <div className="p-6 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
              <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm">No shop settings yet. Create one below.</p>
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

      <div className="mt-6">
        <PrintPaperSizeSettingsCard />
      </div>
    </div>
  );
};
