import { ShopSettings } from "../services/ShopSettings/fetchShopSettings";
import { getVoucherReceiptBranding } from "./receiptLogo";

export interface PrintShopBranding {
  shopName: string;
  logo?: string;
  phone?: string;
  address?: string;
  website?: string;
  currency: string;
  slot?: number;
  profileName?: string;
}

export const getPrintShopBranding = (
  settings: ShopSettings | null,
  logoSlotOverride?: number,
): PrintShopBranding => {
  const branding = getVoucherReceiptBranding(settings, logoSlotOverride);

  return {
    shopName: branding.shopName || settings?.shopName || "Shop",
    logo: branding.logo,
    phone: branding.phone,
    address: branding.address,
    website: settings?.socialMedia?.website,
    currency: settings?.currency || "MMK",
    slot: branding.slot,
    profileName: branding.name,
  };
};

export const preloadImage = (src: string): Promise<void> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
