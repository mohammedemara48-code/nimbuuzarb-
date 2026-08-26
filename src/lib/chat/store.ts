import { create } from "zustand";
import { AUTO_REPLIES, SEED_CONTACTS } from "./seed";
import type { ChatMessage, Conversation } from "./types";

function buildInitial() {
  const conversations: Conversation[] = [];
  const messages: Record<string, ChatMessage[]> = {};
  let hour = 3;
  for (const c of SEED_CONTACTS) {
    const last = c.thread[c.thread.length - 1];
    const lastAt = new Date(Date.now() - hour * 36 * 60 * 1000).toISOString();
    conversations.push({
      id: c.key,
      lastBody: last?.body ?? "",
      lastAt,
      unread: c.unread,
      contact: {
        id: c.key,
        name: c.name,
        handle: c.handle,
        avatar: c.avatar,
        presence: c.presence,
      },
    });
    messages[c.key] = c.thread.map((m, i) => ({
      id: `${c.key}-${i}`,
      conversationId: c.key,
      sender: m.sender,
      body: m.body,
      kind: "text" as const,
      createdAt: new Date(
        Date.now() - (hour * 36 + (c.thread.length - i)) * 60 * 1000,
      ).toISOString(),
    }));
    hour += 5;
  }
  return { conversations, messages };
}

function bump(
  conversations: Conversation[],
  id: string,
  lastBody: string,
  unreadAdd = 0,
): Conversation[] {
  const now = new Date().toISOString();
  return conversations
    .map((c) =>
      c.id === id
        ? { ...c, lastBody, lastAt: now, unread: unreadAdd === 0 ? 0 : c.unread + unreadAdd }
        : c,
    )
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

type ChatState = {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  send: (conversationId: string, body: string) => void;
  markRead: (conversationId: string) => void;
  recordCall: (input: {
    conversationId: string;
    kind: "video" | "audio";
    direction: "in" | "out";
    outcome: "answered" | "declined" | "missed";
    durationSec: number;
  }) => void;
};

const initial = buildInitial();

export const useChatStore = create<ChatState>((set) => ({
  conversations: initial.conversations,
  messages: initial.messages,

  send(conversationId, body) {
    const text = body.trim();
    if (!text) return;
    const mine: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId,
      sender: "me",
      body: text,
      kind: "text",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), mine],
      },
      conversations: bump(s.conversations, conversationId, text, 0),
    }));
    window.setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)] ?? "تمام.";
      const theirs: ChatMessage = {
        id: crypto.randomUUID(),
        conversationId,
        sender: "them",
        body: reply,
        kind: "text",
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: {
          ...s.messages,
          [conversationId]: [...(s.messages[conversationId] ?? []), theirs],
        },
        conversations: bump(s.conversations, conversationId, reply, 1),
      }));
    }, 900);
  },

  markRead(conversationId) {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread: 0 } : c,
      ),
    }));
  },

  recordCall(input) {
    const label = input.kind === "video" ? "مكالمة فيديو" : "مكالمة صوتية";
    const outcome =
      input.outcome === "answered"
        ? input.durationSec > 0
          ? `${label} · ${formatDuration(input.durationSec)}`
          : `${label} · تم الرد`
        : input.outcome === "declined"
          ? `${label} · مرفوضة`
          : `${label} · فائتة`;
    const body = `${input.direction === "out" ? "صادرة" : "واردة"}: ${outcome}`;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId: input.conversationId,
      sender: "me",
      body,
      kind: "call",
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      messages: {
        ...s.messages,
        [input.conversationId]: [...(s.messages[input.conversationId] ?? []), msg],
      },
      conversations: bump(s.conversations, input.conversationId, body, 0),
    }));
  },
}));

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m <= 0) return `${s} ث`;
  return `${m} د ${s} ث`;
}
