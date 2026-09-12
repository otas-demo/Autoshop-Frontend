import axios from "../axios";

export interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export interface SocialMedia {
  facebook: string;
  instagram: string;
  website: string;
}

export interface ShopSettingsUpdatedBy {
  _id: string;
  name: string;
  role: string;
}

export interface ShopLogoItem {
  url: string;
  key: string;
  slot: number;
}

export interface BrandingProfileItem {
  slot: number;
  name?: string;
  phoneNumber?: string;
  address?: string;
}

export interface ShopSettings {
  _id: string;
  shopName: string;
  address: string;
  phoneNumber: string;
  formattedPhoneNumber?: string;
  logo: string;
  logoKey: string;
  logos?: ShopLogoItem[];
  brandingProfiles?: BrandingProfileItem[];
  email: string;
  taxId: string;
  currency: string;
  taxRate: number;
  isActive: boolean;
  businessHours: BusinessHours;
  socialMedia: SocialMedia;
  dailyReportTime: string;
  dailyReportEnabled: boolean;
  updatedBy?: ShopSettingsUpdatedBy;
  createdAt: string;
  updatedAt: string;
}

interface FetchShopSettingsResponse {
  success: boolean;
  message: string;
  data: ShopSettings | null;
}

export const fetchShopSettings =
  async (): Promise<FetchShopSettingsResponse> => {
    try {
      const response = await axios.get("/shop-settings");
      return response.data;
    } catch (error: unknown) {
      console.error("Error fetching shop settings:", error);
      const message =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Failed to fetch shop settings";
      return {
        success: false,
        message,
        data: null,
      };
    }
  };
