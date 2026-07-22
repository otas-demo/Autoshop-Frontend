import React, { useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateCronTime } from "../../services/ShopSettings/updateCronTime";

interface DailyReportScheduleCardProps {
  currentTime: string;
  currentEnabled: boolean;
  onSuccess: () => void;
}

export const DailyReportScheduleCard: React.FC<DailyReportScheduleCardProps> = ({
  currentTime,
  currentEnabled,
  onSuccess,
}) => {
  const [time, setTime] = useState(currentTime || "21:00");
  const [enabled, setEnabled] = useState(currentEnabled !== false);
  const [saving, setSaving] = useState(false);

  const formatDisplayTime = (t: string) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const minute = parseInt(m);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${String(minute).padStart(2, "0")} ${ampm}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateCronTime(time, enabled);
      if (res.success) {
        toast.success(
          enabled
            ? `နေ့စဉ် ${formatDisplayTime(time)} တွင် ပို့ရန် သတ်မှတ်ပြီး`
            : "နေ့စဉ်အစီရင်ခံစာကို ပိတ်ထားပြီး",
        );
        onSuccess();
      } else {
        toast.error(res.message || "Failed to update schedule");
      }
    } catch (err) {
      console.error("Error updating cron time:", err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-indigo-500" />
        နေ့စဉ်အစီရင်ခံစာ အချိန်သတ်မှတ်ခြင်း
      </h3>

      <div className="space-y-4">
        {/* Time Picker */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">
            ပို့မည့်အချိန်
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-48"
          />
        </div>

        {/* Enable Toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-slate-700">
              အလိုအလျောက် ပို့မည်
            </p>
            <p className="text-xs text-slate-400">
              {enabled
                ? `နေ့စဉ် ${formatDisplayTime(time)} တွင် အလိုအလျောက် အစီရင်ခံစာ ထုတ်ပေးမည်`
                : "နေ့စဉ်အစီရင်ခံစာ ပိတ်ထားသည်"}
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              enabled ? "bg-indigo-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                enabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
          {saving ? "သိမ်းနေသည်..." : "သိမ်းမည်"}
        </button>
      </div>
    </div>
  );
};
