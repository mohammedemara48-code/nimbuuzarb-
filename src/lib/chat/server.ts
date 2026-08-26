import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { AUTO_REPLIES, SEED_CONTACTS } from "./seed";
import type { ChatMessage, Conversation, Thread } from "./types";

function id() {
  return crypto.randomUUID();
}

function iso(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

async function ensureSeed(userId: string) {
  const sql = await getSql();
  const existing = await sql<{ n: number }>`
    select count(*)::int as n from contacts where user_id = ${userId}
  `;
  if ((existing[0]?.n ?? 0) > 0) return;

  let hour = 3;
  for (const c of SEED_CONTACTS) {
    const contactId = id();
    const convId = id();
    await sql`
      insert into contacts (id, user_id, name, handle, avatar, presence)
      values (${contactId}, ${userId}, ${c.name}, ${c.handle}, ${c.avatar}, ${c.presence})
    `;
    const last = c.thread[c.thread.length - 1];
    const lastAt = new Date(Date.now() - hour * 36 * 60 * 1000).toISOString();
    await sql`
      insert into conversations (id, user_id, contact_id, last_body, last_at, unread)
      values (${convId}, ${userId}, ${contactId}, ${last?.body ?? ""}, ${lastAt}, ${c.unread})
    `;
    let offset = c.thread.length;
    for (const m of c.thread) {
      const created = new Date(Date.now() - (hour * 36 + offset) * 60 * 1000).toISOString();
      await sql`
        insert into messages (id, user_id, conversation_id, sender, body, kind, created_at)
        values (${id()}, ${userId}, ${convId}, ${m.sender}, ${m.body}, ${"text"}, ${created})
      `;
      offset -= 1;
    }
    hour += 5;
  }
}

type ConvRow = {
  id: string;
  last_body: string;
  last_at: string;
  unread: number;
  contact_id: string;
  name: string;
  handle: string;
  avatar: string;
  presence: string;
};

function mapConv(row: ConvRow): Conversation {
  return {
    id: row.id,
    lastBody: row.last_body,
    lastAt: iso(row.last_at),
    unread: Number(row.unread) || 0,
    contact: {
      id: row.contact_id,
      name: row.name,
      handle: row.handle,
      avatar: row.avatar,
      presence: (row.presence as Conversation["contact"]["presence"]) ?? "offline",
    },
  };
}

export const listConversations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureSeed(context.userId);
    const sql = await getSql();
    const rows = await sql<ConvRow>`
      select c.id, c.last_body, c.last_at, c.unread,
             t.id as contact_id, t.name, t.handle, t.avatar, t.presence
      from conversations c
      join contacts t on t.id = c.contact_id
      where c.user_id = ${context.userId}
      order by c.last_at desc
    `;
    return rows.map(mapConv);
  });

export const getThread = createServerFn({ method: "GET" })
  .validator((input: { conversationId: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<Thread | null> => {
    const conversationId = data.conversationId;
    const sql = await getSql();
    const conv = await sql<ConvRow>`
      select c.id, c.last_body, c.last_at, c.unread,
             t.id as contact_id, t.name, t.handle, t.avatar, t.presence
      from conversations c
      join contacts t on t.id = c.contact_id
      where c.id = ${conversationId} and c.user_id = ${context.userId}
      limit 1
    `;
    const row = conv[0];
    if (!row) return null;
    const messages = await sql<{
      id: string;
      conversation_id: string;
      sender: string;
      body: string;
      kind: string;
      created_at: string;
    }>`
      select id, conversation_id, sender, body, kind, created_at
      from messages
      where conversation_id = ${conversationId} and user_id = ${context.userId}
      order by created_at asc
    `;
    await sql`
      update conversations set unread = 0
      where id = ${conversationId} and user_id = ${context.userId}
    `;
    return {
      conversation: mapConv({ ...row, unread: 0 }),
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        sender: m.sender === "me" ? "me" : "them",
        body: m.body,
        kind: m.kind === "call" ? "call" : "text",
        createdAt: iso(m.created_at),
      })),
    };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .validator((input: { conversationId: string; body: string }) => ({
    conversationId: input.conversationId,
    body: input.body.trim(),
  }))
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<ChatMessage | null> => {
    if (!data.body) return null;
    const sql = await getSql();
    const owned = await sql<{ id: string }>`
      select id from conversations
      where id = ${data.conversationId} and user_id = ${context.userId}
      limit 1
    `;
    if (!owned[0]) return null;
    const msgId = id();
    const createdAt = new Date().toISOString();
    await sql`
      insert into messages (id, user_id, conversation_id, sender, body, kind, created_at)
      values (${msgId}, ${context.userId}, ${data.conversationId}, ${"me"}, ${data.body}, ${"text"}, ${createdAt})
    `;
    await sql`
      update conversations
      set last_body = ${data.body}, last_at = ${createdAt}
      where id = ${data.conversationId} and user_id = ${context.userId}
    `;
    return {
      id: msgId,
      conversationId: data.conversationId,
      sender: "me",
      body: data.body,
      kind: "text",
      createdAt,
    };
  });

export const autoReply = createServerFn({ method: "POST" })
  .validator((conversationId: string) => conversationId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: conversationId }): Promise<ChatMessage | null> => {
    const sql = await getSql();
    const owned = await sql<{ id: string }>`
      select id from conversations
      where id = ${conversationId} and user_id = ${context.userId}
      limit 1
    `;
    if (!owned[0]) return null;
    const body = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)] ?? "تمام.";
    const msgId = id();
    const createdAt = new Date().toISOString();
    await sql`
      insert into messages (id, user_id, conversation_id, sender, body, kind, created_at)
      values (${msgId}, ${context.userId}, ${conversationId}, ${"them"}, ${body}, ${"text"}, ${createdAt})
    `;
    await sql`
      update conversations
      set last_body = ${body}, last_at = ${createdAt}, unread = unread + 1
      where id = ${conversationId} and user_id = ${context.userId}
    `;
    return {
      id: msgId,
      conversationId,
      sender: "them",
      body,
      kind: "text",
      createdAt,
    };
  });

export const recordCall = createServerFn({ method: "POST" })
  .validator(
    (input: {
      conversationId: string;
      kind: "video" | "audio";
      direction: "in" | "out";
      outcome: "answered" | "declined" | "missed";
      durationSec: number;
    }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const owned = await sql<{ id: string }>`
      select id from conversations
      where id = ${data.conversationId} and user_id = ${context.userId}
      limit 1
    `;
    if (!owned[0]) return;
    const label = data.kind === "video" ? "مكالمة فيديو" : "مكالمة صوتية";
    const outcome =
      data.outcome === "answered"
        ? data.durationSec > 0
          ? `${label} · ${formatDuration(data.durationSec)}`
          : `${label} · تم الرد`
        : data.outcome === "declined"
          ? `${label} · مرفوضة`
          : `${label} · فائتة`;
    const prefix = data.direction === "out" ? "صادرة: " : "واردة: ";
    const body = prefix + outcome;
    const createdAt = new Date().toISOString();
    await sql`
      insert into messages (id, user_id, conversation_id, sender, body, kind, created_at)
      values (${id()}, ${context.userId}, ${data.conversationId}, ${"me"}, ${body}, ${"call"}, ${createdAt})
    `;
    await sql`
      update conversations
      set last_body = ${body}, last_at = ${createdAt}
      where id = ${data.conversationId} and user_id = ${context.userId}
    `;
  });

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m <= 0) return `${s} ث`;
  return `${m} د ${s} ث`;
}
