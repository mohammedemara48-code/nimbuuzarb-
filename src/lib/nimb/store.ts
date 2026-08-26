import { create } from "zustand";
import {
  FRIEND_IDS,
  PEOPLE,
  POSTS,
  ROOMS,
  SEED_DMS,
  SEED_ROOM_CHAT,
  STATUSES,
} from "./seed";
import type { ChatKind, ChatMessage, Comment, Person, Post, Status } from "./types";

function nid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

function seedMessages() {
  const out: ChatMessage[] = [];
  for (const [personId, rows] of Object.entries(SEED_DMS)) {
    rows.forEach((row, i) => {
      out.push({
        id: `dm-${personId}-${i}`,
        threadId: personId,
        sender: row.from,
        kind: "text",
        body: row.body,
        viewOnce: false,
        viewed: false,
        createdAt: new Date(Date.now() - row.hours * 3600_000).toISOString(),
      });
    });
  }
  for (const [roomId, rows] of Object.entries(SEED_ROOM_CHAT)) {
    rows.forEach((row, i) => {
      out.push({
        id: `rm-${roomId}-${i}`,
        threadId: `room:${roomId}`,
        sender: row.sender,
        kind: "text",
        body: row.body,
        viewOnce: false,
        viewed: false,
        createdAt: new Date(Date.now() - row.hours * 3600_000).toISOString(),
      });
    });
  }
  return out;
}

type NimbState = {
  friends: string[];
  skipped: string[];
  messages: ChatMessage[];
  posts: Post[];
  statuses: Status[];
  acceptedRequests: string[];
  toggleFriend: (id: string) => void;
  skipPerson: (id: string) => void;
  sendDm: (input: {
    personId: string;
    body: string;
    kind?: ChatKind;
    media?: string;
    viewOnce?: boolean;
  }) => void;
  sendRoom: (roomId: string, body: string) => void;
  markViewed: (messageId: string) => void;
  likePost: (postId: string) => void;
  commentPost: (postId: string, body: string) => void;
  addPost: (input: { kind: "photo" | "story"; body: string; image?: string }) => void;
  seeStatus: (id: string) => void;
  person: (id: string) => Person | undefined;
  isFriend: (id: string) => boolean;
  inboxIds: () => string[];
  requestIds: () => string[];
  thread: (id: string) => ChatMessage[];
  lastPreview: (personId: string) => ChatMessage | undefined;
};

const REPLIES = [
  "تمام، وصلت.",
  "مرتاح للكلام ده.",
  "ردّيت من الطلبات؟ ولا إحنا أصحاب خلاص.",
  "أبعت صوت لو سمحت الموضوع يطول.",
  "تمام. كمّل.",
];

export const useNimb = create<NimbState>((set, get) => ({
  friends: [...FRIEND_IDS],
  skipped: [],
  messages: seedMessages(),
  posts: POSTS,
  statuses: STATUSES,
  acceptedRequests: [],

      person(id) {
        return PEOPLE.find((p) => p.id === id);
      },
      isFriend(id) {
        return get().friends.includes(id);
      },
      thread(id) {
        return get()
          .messages.filter((m) => m.threadId === id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      },
      lastPreview(personId) {
        const list = get().thread(personId);
        return list[list.length - 1];
      },
      inboxIds() {
        const friends = new Set(get().friends);
        const ids = new Set<string>();
        for (const m of get().messages) {
          if (m.threadId.startsWith("room:")) continue;
          if (friends.has(m.threadId)) ids.add(m.threadId);
        }
        for (const id of get().friends) ids.add(id);
        return [...ids];
      },
      requestIds() {
        const friends = new Set(get().friends);
        const ids = new Set<string>();
        for (const m of get().messages) {
          if (m.threadId.startsWith("room:")) continue;
          if (!friends.has(m.threadId)) ids.add(m.threadId);
        }
        return [...ids];
      },

      toggleFriend(id) {
        set((s) => ({
          friends: s.friends.includes(id)
            ? s.friends.filter((x) => x !== id)
            : [...s.friends, id],
        }));
      },
      skipPerson(id) {
        set((s) => ({ skipped: s.skipped.includes(id) ? s.skipped : [...s.skipped, id] }));
      },
      sendDm({ personId, body, kind = "text", media, viewOnce = false }) {
        const mine: ChatMessage = {
          id: nid(),
          threadId: personId,
          sender: "me",
          kind,
          body,
          media,
          viewOnce,
          viewed: false,
          createdAt: now(),
        };
        set((s) => ({ messages: [...s.messages, mine] }));
        window.setTimeout(() => {
          const reply: ChatMessage = {
            id: nid(),
            threadId: personId,
            sender: "them",
            kind: "text",
            body: REPLIES[Math.floor(Math.random() * REPLIES.length)] ?? "تمام.",
            viewOnce: false,
            viewed: false,
            createdAt: now(),
          };
          set((s) => ({ messages: [...s.messages, reply] }));
        }, 900);
      },
      sendRoom(roomId, body) {
        set((s) => ({
          messages: [
            ...s.messages,
            {
              id: nid(),
              threadId: `room:${roomId}`,
              sender: "me",
              kind: "text",
              body,
              viewOnce: false,
              viewed: false,
              createdAt: now(),
            },
          ],
        }));
      },
      markViewed(messageId) {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === messageId ? { ...m, viewed: true } : m,
          ),
        }));
      },
      likePost(postId) {
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            const liked = p.likes.includes("me");
            return {
              ...p,
              likes: liked ? p.likes.filter((x) => x !== "me") : [...p.likes, "me"],
            };
          }),
        }));
      },
      commentPost(postId, body) {
        const text = body.trim();
        if (!text) return;
        const c: Comment = { id: nid(), authorId: "me", body: text, createdAt: now() };
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, c] } : p,
          ),
        }));
      },
      addPost({ kind, body, image }) {
        const post: Post = {
          id: nid(),
          authorId: "me",
          kind,
          body: body.trim(),
          image,
          likes: [],
          comments: [],
          createdAt: now(),
        };
        set((s) => ({ posts: [post, ...s.posts] }));
      },
      seeStatus(id) {
        set((s) => ({
          statuses: s.statuses.map((st) => (st.id === id ? { ...st, seen: true } : st)),
        }));
      },
    }),
);

export function personById(id: string) {
  if (id === "me") {
    return {
      id: "me",
      name: "رنا",
      age: 26,
      city: "جدة",
      bio: "بدور على حد صادق، قهوة بعد ١٢ مسموحة.",
      photo: "",
      online: true,
      looking: "نساء",
    } satisfies Person;
  }
  return PEOPLE.find((p) => p.id === id);
}

export { PEOPLE, ROOMS };
