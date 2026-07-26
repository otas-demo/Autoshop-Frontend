import React, { useRef, useState } from "react";
import { ImagePlus, Upload, Loader2, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  uploadShopLogo,
  validateShopLogoFile,
} from "../../services/ShopSettings/uploadShopLogo";
import { deleteShopLogo } from "../../services/ShopSettings/deleteShopLogo";
import { ConfirmModal } from "../Common/ConfirmModal";
import { useLanguage } from "../../context/LanguageContext";

interface ShopLogoUploadProps {
  currentLogo?: string;
  shopName?: string;
  onSuccess: () => void;
}

export const ShopLogoUpload: React.FC<ShopLogoUploadProps> = ({
  currentLogo,
  shopName,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayLogo = preview || currentLogo;
  const hasSavedLogo = Boolean(currentLogo);
  const showUploadControls = !hasSavedLogo || Boolean(preview || selectedFile);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateShopLogoFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadShopLogo(selectedFile);
      if (response.success) {
        toast.success(response.message || "Shop logo uploaded successfully");
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        onSuccess();
      } else {
        toast.error(response.message || "Failed to upload shop logo");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload shop logo",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await deleteShopLogo();
      if (response.success) {
        toast.success(response.message || "Shop logo deleted successfully");
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowDeleteConfirm(false);
        onSuccess();
      } else {
        toast.error(response.message || "Failed to delete shop logo");
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete shop logo",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isBusy = isUploading || isDeleting;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ImagePlus className="w-5 h-5 text-[#2216a8]" />
          {t("settings.shopLogo")}
        </h3>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            {displayLogo ? (
              <img
                src={displayLogo}
                alt={shopName || "Shop logo"}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                <Store className="w-10 h-10 text-slate-300" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <p className="text-sm text-slate-500">
              {hasSavedLogo && !preview
                ? t("settings.logoSetDesc")
                : t("settings.uploadLogoDesc")}
            </p>

            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isBusy}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50/70 file:text-[#2216a8] hover:file:bg-indigo-100/80 disabled:opacity-50 cursor-pointer"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || isBusy}
                  className="px-4 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {isUploading ? t("settings.uploading") : t("settings.uploadLogo")}
                </button>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isBusy}
                    className="px-4 py-2 text-sm font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-md shadow-red-600/10 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {isDeleting ? t("settings.deleting") : t("settings.deleteLogo")}
                  </button>

                  {showUploadControls && selectedFile && !isBusy && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {t("settings.clear")}
                    </button>
                  )}
                </div>
              </div>
            </>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Shop Logo"
        message="Are you sure you want to delete the shop logo? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="red"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
};
