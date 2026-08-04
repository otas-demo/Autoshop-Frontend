export const ERROR_MAPPINGS: Record<string, Record<string, string>> = {
  my: {
    USER_NOT_FOUND: "အသုံးပြုသူ ရှာမတွေ့ပါ။",
    INVALID_CREDENTIALS: "အီးမေးလ် သို့မဟုတ် စကားဝှက် မှားယွင်းနေပါသည်။",
    SERVER_ERROR: "စနစ်ပိုင်းဆိုင်ရာ အမှားတစ်ခု ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ ခဏစောင့်ပြီး ပြန်လည်ကြိုးစားပါ။",
    UNAUTHORIZED: "သင်ဤလုပ်ဆောင်ချက်ကို လုပ်ဆောင်ရန် ခွင့်ပြုချက်မရှိပါ။ ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။",
    FORBIDDEN: "သင်ဤလုပ်ဆောင်ချက်ကို လုပ်ဆောင်ရန် ခွင့်ပြုချက်မရှိပါ။",
    VALIDATION_ERROR: "ထည့်သွင်းထားသော အချက်အလက်များ မမှန်ကန်ပါ။",
    DUPLICATE_KEY_ERROR: "ဤအချက်အလက်သည် စနစ်ထဲတွင် ရှိနှင့်ပြီးသား ဖြစ်ပါသည်။",
    TOKEN_EXPIRED: "ဝင်ရောက်ခွင့် သက်တမ်းကုန်ဆုံးသွားပါပြီ။ ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။",
    INVALID_TOKEN: "မမှန်ကန်သော ဝင်ရောက်ခွင့်ကုဒ်ဖြစ်ပါသည်။ ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။",
    DEFAULT: "တစ်ခုခု မှားယွင်းနေပါသည်။"
  },
  en: {
    USER_NOT_FOUND: "User not found.",
    INVALID_CREDENTIALS: "Invalid email or password.",
    SERVER_ERROR: "A system error has occurred. Please wait a moment and try again.",
    UNAUTHORIZED: "You are not authorized to perform this action. Please log in again.",
    FORBIDDEN: "Access denied. You do not have permission for this action.",
    VALIDATION_ERROR: "The input data is invalid.",
    DUPLICATE_KEY_ERROR: "This data already exists in the system.",
    TOKEN_EXPIRED: "Session expired. Please log in again.",
    INVALID_TOKEN: "Invalid token. Please log in again.",
    DEFAULT: "Something went wrong."
  }
};

/**
 * Maps a backend error code to a user-friendly localized error message.
 * @param errorCode The standardized error code returned from the backend.
 * @returns The localized message.
 */
export const getErrorMessage = (errorCode: string): string => {
  const currentLang = localStorage.getItem("language") || "my";
  const mappings = ERROR_MAPPINGS[currentLang] || ERROR_MAPPINGS.my;
  return mappings[errorCode] || mappings.DEFAULT;
};
