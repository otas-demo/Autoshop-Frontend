import { ShopSettings, BrandingProfileItem } from "../services/ShopSettings/fetchShopSettings";

export const VOUCHER_RECEIPT_LOGO_KEY = "voucherReceiptLogoSlot";

/**
 * Get the saved receipt logo/branding slot from localStorage.
 * 1 = Slot 1, 2 = Slot 2, 3 = Slot 3, 0 = No Logo (uses profile 1 for text)
 * Default is 1.
 */
export const getSavedReceiptLogoSlot = (): number => {
  const saved = localStorage.getItem(VOUCHER_RECEIPT_LOGO_KEY);
  if (saved !== null) {
    const parsed = parseInt(saved, 10);
    if ([0, 1, 2, 3].includes(parsed)) {
      return parsed;
    }
  }
  return 1;
};

/**
 * Save chosen receipt logo slot to localStorage.
 */
export const saveReceiptLogoSlot = (slot: number): void => {
  localStorage.setItem(VOUCHER_RECEIPT_LOGO_KEY, slot.toString());
};

/**
 * Resolves the logo image URL to use for voucher receipt printing.
 * @param settings ShopSettings object
 * @param slotOverride Optional slot override (e.g. from print preview selector)
 */
export const getVoucherReceiptLogo = (
  settings: ShopSettings | null,
  slotOverride?: number,
): string | undefined => {
  if (!settings) return undefined;

  const slot = slotOverride !== undefined ? slotOverride : getSavedReceiptLogoSlot();

  // 0 means user explicitly disabled logo on vouchers
  if (slot === 0) {
    return undefined;
  }

  // Check if target slot exists in logos array
  if (settings.logos && settings.logos.length > 0) {
    const match = settings.logos.find((l) => l.slot === slot);
    if (match && match.url) {
      return match.url;
    }
  }

  // Fallback for slot 1 to legacy settings.logo
  if (slot === 1 && settings.logo) {
    return settings.logo;
  }

  // Fallback to any available logo if chosen slot is not uploaded
  if (settings.logos && settings.logos.length > 0) {
    return settings.logos[0].url;
  }

  return settings.logo || undefined;
};

export interface ResolvedBrandingProfile {
  slot: number;
  name: string;
  logo?: string;
  phone?: string;
  address?: string;
}

/**
 * Resolves full branding details (logo, phone, address, profile name) for voucher printing.
 * Gracefully falls back to root settings phone/address if specific slot details are blank.
 */
export const getVoucherReceiptBranding = (
  settings: ShopSettings | null,
  slotOverride?: number,
): ResolvedBrandingProfile => {
  const rawSlot = slotOverride !== undefined ? slotOverride : getSavedReceiptLogoSlot();
  const effectiveSlot = rawSlot === 0 ? 1 : rawSlot;

  const profile = settings?.brandingProfiles?.find((p) => p.slot === effectiveSlot);

  const phone = profile?.phoneNumber?.trim() || settings?.phoneNumber || "";
  const address = profile?.address?.trim() || settings?.address || "";
  const name = profile?.name?.trim() || `Profile ${effectiveSlot}`;
  const logo = getVoucherReceiptLogo(settings, rawSlot);

  return {
    slot: rawSlot,
    name,
    logo,
    phone,
    address,
  };
};

