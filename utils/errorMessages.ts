export const ERROR_MAPPINGS: Record<string, Record<string, string>> = {
  my: {
    USER_NOT_FOUND: "သုံးစွဲသူကို ရှာမတွေ့ပါ။",
    INVALID_CREDENTIALS: "လက်ရှိထည့်ထားသော username (သို့မဟုတ်) Password တစ်ခုခုမှားယွင်းနေပါတယ်။  ",
    SERVER_ERROR: "စနစ်ပိုင်းဆိုင်ရာ ချို့ယွင်းချက်တွေ့ရှိရလို့ Developer များအမြန်ဆုံးပြင်ဆင်ပေးနေပါတယ် ။ ခေတ္တခနစောင့်ဆိုင်းပေးပြီမှ ပြန်လည်ဝင်ရောက် အသုံးပြုပေးဖို့မေတ္တာရပ်ခံပါတယ်။",
    UNAUTHORIZED: "သုံးစွဲသူရဲ့ လက်ရှိလုပ်ဆောင်ချက်များကို ခွင့်ပြုချက် ကန့်သတ်ထားပါတယ်။ နောက်တစ်ကြိမ် login ပြန်လုပ်ပေးပါ။",
    FORBIDDEN: "လုပ်ဆောင်ချက်ကို ကန့်သတ်ထားပါတယ်။ နောက်တစ်ကြိမ် login ပြန်လုပ်ပေးပါ ။",
    VALIDATION_ERROR: "ယခုထည့်သွင်းထားတဲ့ အချက်အလက်တွေ မှားယွင်းနေပါတယ်",
    DUPLICATE_KEY_ERROR: "ယခု အချက်အလက်တွေက စနစ်ထဲမှာ ထည့်သွင်းပြီးသား ဖြစ်ပါတယ်။",
    TOKEN_EXPIRED: "ဝင်ရောက်ခွင့်ကုဒ် သက်တမ်းကုန်ဆုံးသွားပါပြီ။ ကျေးဇူးပြုပြီး နောက်တစ်ကြိမ် login ပြန်လုပ်ပေးပါ။",
    INVALID_TOKEN: "ဝင်ရောက်ခွင့်ကုဒ် မှားယွင်းနေပါတယ်။ ကျေးဇူးပြုပြီး နောက်တစ်ကြိမ် login ပြန်လုပ်ပေးပါ။",
    INVALID_PHONE: "ဖုန်းနံပါတ် ပုံစံ မှားယွင်းနေပါသည်။ (ဥပမာ - 09xxxxxxxxx)",
    NOT_FOUND: "ရှာမတွေ့ပါ။",
    DEFAULT: "စနစ်ပိုင်းဆိုင်ရာ တစ်ခုခု မှားယွင်းနေပါတယ်။"
  },
  en: {
    USER_NOT_FOUND: "User not found.",
    INVALID_CREDENTIALS: "Invalid username or password.",
    SERVER_ERROR: "A system error has occurred. Please wait a moment and try again.",
    UNAUTHORIZED: "You are not authorized to perform this action. Please log in again.",
    FORBIDDEN: "Access denied. You do not have permission for this action.",
    VALIDATION_ERROR: "The input data is invalid.",
    DUPLICATE_KEY_ERROR: "This data already exists in the system.",
    TOKEN_EXPIRED: "Session expired. Please log in again.",
    INVALID_TOKEN: "Invalid token. Please log in again.",
    INVALID_PHONE: "Invalid phone number format (e.g. 09xxxxxxxxx).",
    NOT_FOUND: "Resource not found.",
    DEFAULT: "Something went wrong."
  }
};

/**
 * Maps a backend error code and/or message to a user-friendly localized error message.
 * @param errorCode The standardized error code returned from the backend.
 * @param fallbackMessage The specific error message returned from the backend (if any).
 * @returns The localized message.
 */
export const getErrorMessage = (errorCode?: string, fallbackMessage?: string): string => {
  const currentLang = localStorage.getItem("language") || "my";
  const mappings = ERROR_MAPPINGS[currentLang] || ERROR_MAPPINGS.my;

  // If a specific errorCode matches (not generic VALIDATION_ERROR / SERVER_ERROR)
  if (errorCode && mappings[errorCode] && errorCode !== "VALIDATION_ERROR" && errorCode !== "SERVER_ERROR") {
    return mappings[errorCode];
  }

  // If fallbackMessage contains phone error, map to localized phone message
  if (fallbackMessage) {
    const lower = fallbackMessage.toLowerCase();
    if (lower.includes("phone number") || lower.includes("invalid phone")) {
      return mappings.INVALID_PHONE || fallbackMessage;
    }

    // If fallbackMessage is a specific non-generic message, use it
    if (
      !lower.includes("something went wrong") &&
      !lower.includes("internal server error")
    ) {
      return fallbackMessage;
    }
  }

  // If we had a generic code like VALIDATION_ERROR or SERVER_ERROR
  if (errorCode && mappings[errorCode]) {
    return mappings[errorCode];
  }

  return mappings.DEFAULT;
};
