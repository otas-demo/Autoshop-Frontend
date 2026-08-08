export enum ExpiryStatus {
  EXPIRED = "EXPIRED",
  EXPIRING_SOON = "EXPIRING_SOON",
  VALID = "VALID",
  NONE = "NONE",
}

export const EXPIRY_WARNING_DAYS = 30;

export const getExpiryStatus = (expiryDate: string | Date | null | undefined): ExpiryStatus => {
  if (!expiryDate) return ExpiryStatus.NONE;
  
  const now = new Date();
  const exp = new Date(expiryDate);
  
  if (isNaN(exp.getTime())) return ExpiryStatus.NONE;
  
  // Reset hours to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const expiry = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate()).getTime();
  
  if (expiry <= today) {
    return ExpiryStatus.EXPIRED;
  }
  
  const warningTime = today + (EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000);
  if (expiry <= warningTime) {
    return ExpiryStatus.EXPIRING_SOON;
  }
  
  return ExpiryStatus.VALID;
};

export const formatExpiryDate = (expiryDate: string | Date | null | undefined): string => {
  if (!expiryDate) return "-";
  const exp = new Date(expiryDate);
  if (isNaN(exp.getTime())) return "-";
  
  const year = exp.getFullYear();
  const month = String(exp.getMonth() + 1).padStart(2, "0");
  const day = String(exp.getDate()).padStart(2, "0");
  
  return `${year}-${month}-${day}`;
};
