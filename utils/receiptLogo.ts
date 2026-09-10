import { ShopSettings } from "../services/ShopSettings/fetchShopSettings";

export const VOUCHER_RECEIPT_LOGO_KEY = "voucherReceiptLogoSlot";

/**
 * Get the saved receipt logo slot from localStorage.
 * 1 = Slot 1, 2 = Slot 2, 3 = Slot 3, 0 = No Logo
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
