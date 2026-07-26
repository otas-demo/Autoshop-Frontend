import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, X, Lock } from "lucide-react";
import { Calendar, DateRange, RangeKeyDict } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onChange: (startDate: Date | null, endDate: Date | null) => void;
  fixedStartDate?: boolean;
  singleDate?: boolean;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  fixedStartDate = false,
  singleDate = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);

  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
    key: string;
  }>({
    startDate: startDate || new Date(),
    endDate: endDate || new Date(),
    key: "selection",
  });

  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (startDate && endDate) {
      setDateRange({
        startDate,
        endDate,
        key: "selection",
      });
    } else if (startDate && singleDate) {
      setDateRange({
        startDate,
        endDate: startDate,
        key: "selection",
      });
    }
  }, [startDate, endDate, singleDate]);

  const handleRangeSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection;
    if (selection.startDate && selection.endDate) {
      setDateRange({
        startDate: selection.startDate,
        endDate: selection.endDate,
        key: "selection",
      });
    }
  };

  const handleFixedStartSelect = (date: Date) => {
    if (startDate) {
      setDateRange({
        startDate: startDate,
        endDate: date,
        key: "selection",
      });
    }
  };

  const handleSingleDateSelect = (date: Date) => {
    setDateRange({
      startDate: date,
      endDate: date,
      key: "selection",
    });
  };

  const handleApply = () => {
    onChange(dateRange.startDate, dateRange.endDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    const today = new Date();
    if (fixedStartDate) {
      onChange(startDate, today);
    } else if (singleDate) {
      onChange(today, today);
    } else {
      onChange(null, null);
    }
    setDateRange({
      startDate: startDate || today,
      endDate: today,
      key: "selection",
    });
    setIsOpen(false);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Select date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isDark = className?.includes("text-white") || className?.includes("bg-[#2216a8]") || className?.includes("bg-indigo");

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={className || "flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-primary outline-none"}
      >
        <CalendarIcon className={`w-4 h-4 ${isDark ? "text-white" : "text-slate-600"}`} />
        <span className={`text-sm ${isDark ? "text-white" : "text-slate-700"}`}>
          {singleDate
            ? (startDate ? formatDate(startDate) : "Select date")
            : (startDate && endDate
              ? `${formatDate(startDate)} - ${formatDate(endDate)}`
              : "Select date range")
          }
        </span>
        {fixedStartDate && startDate && !singleDate && (
          <Lock className="w-3 h-3 text-slate-400" title="Start date is fixed" />
        )}
        {(startDate || endDate) && !fixedStartDate && (
          <X
            className={`w-4 h-4 hover:text-opacity-80 ${isDark ? "text-white/70" : "text-slate-400 hover:text-slate-600"}`}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
          />
        )}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-5 flex flex-col items-center justify-center max-w-full overflow-y-auto max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {singleDate ? (
              <Calendar
                date={dateRange.startDate}
                onChange={handleSingleDateSelect}
                color="#2216a8"
              />
            ) : fixedStartDate ? (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-slate-500 mb-2">
                  Start Date (Fixed): <span className="font-semibold text-slate-700">{formatDate(startDate)}</span>
                  <div className="mt-1">Select End Date:</div>
                </div>
                <Calendar
                  date={dateRange.endDate}
                  onChange={handleFixedStartSelect}
                  color="#2216a8"
                  minDate={startDate || undefined}
                />
              </div>
            ) : (
              <DateRange
                key={isMobile ? "mobile-calendar" : "desktop-calendar"}
                ranges={[dateRange]}
                onChange={handleRangeSelect}
                moveRangeOnFirstSelection={false}
                months={isMobile ? 1 : 2}
                direction={isMobile ? "vertical" : "horizontal"}
                rangeColors={["#2216a8"]}
              />
            )}

            <div className="flex w-full justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-6 py-2 text-sm font-semibold bg-[#2216a8] text-white rounded-full hover:bg-[#2216a8]/90 transition-colors shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};