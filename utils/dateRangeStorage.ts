export interface StoredDateRange {
  startDate: Date;
  endDate: Date;
}

export const DATE_RANGE_STORAGE_KEYS = {
  orders: "orders-date-range",
  creditOrders: "credit-orders-date-range",
  expenses: "expenses-date-range",
  reports: "reports-date-range",
} as const;

export const getToday = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const parseStoredDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

export const loadStoredDateRange = (storageKey: string): StoredDateRange => {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return { startDate: getToday(), endDate: getToday() };
    const parsed = JSON.parse(raw) as { startDate?: string; endDate?: string };
    const start = parseStoredDate(parsed.startDate);
    const end = parseStoredDate(parsed.endDate);
    if (start && end) return { startDate: start, endDate: end };
  } catch {
    // ignore invalid storage
  }
  return { startDate: getToday(), endDate: getToday() };
};

export const createDateRangeInitializer =
  (storageKey: string) => (): StoredDateRange => loadStoredDateRange(storageKey);

export const saveStoredDateRange = (
  storageKey: string,
  start: Date | null,
  end: Date | null,
) => {
  if (!start || !end) return;
  sessionStorage.setItem(
    storageKey,
    JSON.stringify({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }),
  );
};
