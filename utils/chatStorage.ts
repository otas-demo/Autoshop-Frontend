import { formatDistanceToNow } from "date-fns";
import type { ChatConversation, ChatMessage } from "../types";

// ─── Storage Key ───────────────────────────────────────────────

export const CHAT_HISTORY_KEY = "autoshop_ai_chat_history";
export const MAX_TITLE_LENGTH = 50;

// ─── State Shape (internal to storage layer) ───────────────────

export interface ChatHistoryState {
  conversations: ChatConversation[];
  activeConversationId: string | null;
}

// ─── Storage Interface (swap-able for future backend) ──────────

export interface IChatStorage {
  loadAll(): ChatHistoryState;
  saveAll(state: ChatHistoryState): void;
}

// ─── LocalStorage Implementation ───────────────────────────────

export class LocalStorageChatStorage implements IChatStorage {
  loadAll(): ChatHistoryState {
    try {
      const raw = localStorage.getItem(CHAT_HISTORY_KEY);
      if (!raw) return { conversations: [], activeConversationId: null };

      const parsed = JSON.parse(raw);

      // Validate basic shape
      if (!parsed || !Array.isArray(parsed.conversations)) {
        throw new Error("Invalid chat history format");
      }

      return parsed as ChatHistoryState;
    } catch (e) {
      console.warn("[ChatStorage] Failed to load, resetting:", e);
      localStorage.removeItem(CHAT_HISTORY_KEY);
      return { conversations: [], activeConversationId: null };
    }
  }

  saveAll(state: ChatHistoryState): void {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("[ChatStorage] Failed to save:", e);
    }
  }
}

// ─── ID Generation ─────────────────────────────────────────────

export function generateConversationId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 9)
    );
  }
}

export function generateMessageId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 7)
  );
}

// ─── Conversation Title Generation ─────────────────────────────

export function generateConversationTitle(firstMessage: string): string {
  const cleaned = firstMessage.trim();
  if (!cleaned) return "New Conversation";

  if (cleaned.length <= MAX_TITLE_LENGTH) return cleaned;

  // Try to cut at a word boundary
  const truncated = cleaned.substring(0, MAX_TITLE_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > MAX_TITLE_LENGTH * 0.7) {
    return truncated.substring(0, lastSpace) + "…";
  }
  return truncated + "…";
}

// ─── Date Grouping ─────────────────────────────────────────────

export type DateGroupLabel =
  | "Today"
  | "Yesterday"
  | "This Week"
  | "Last Week"
  | "Older";

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getConversationDateGroupLabel(
  updatedAt: string,
): DateGroupLabel {
  const now = new Date();
  const today = getStartOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const convDate = getStartOfDay(new Date(updatedAt));

  if (convDate.getTime() === today.getTime()) return "Today";
  if (convDate.getTime() === yesterday.getTime()) return "Yesterday";

  // This week: Monday of current week → today
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(thisMonday.getDate() - mondayOffset);

  if (convDate >= thisMonday) return "This Week";

  // Last week: Monday of last week → Sunday of last week
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);
  if (convDate >= lastMonday) return "Last Week";

  return "Older";
}

export function groupConversationsByDate(
  conversations: ChatConversation[],
): Map<DateGroupLabel, ChatConversation[]> {
  const groups = new Map<DateGroupLabel, ChatConversation[]>();

  const sorted = [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  for (const conv of sorted) {
    const label = getConversationDateGroupLabel(conv.updatedAt);
    const existing = groups.get(label) ?? [];
    existing.push(conv);
    groups.set(label, existing);
  }

  return groups;
}

// ─── Time Ago Formatting ───────────────────────────────────────

export function formatTimeAgo(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch {
    return "";
  }
}

// ─── Message Preview ───────────────────────────────────────────

export function getLastMessagePreview(conversation: ChatConversation): string {
  if (conversation.messages.length === 0) return "";
  const last = conversation.messages[conversation.messages.length - 1];
  const prefix = last.role === "ai" ? "" : "";
  const text = last.content.replace(/\n/g, " ").trim();
  return text.length > 60 ? text.substring(0, 59) + "…" : text;
}
