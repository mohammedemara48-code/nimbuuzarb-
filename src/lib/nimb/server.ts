import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { formatSerial, parseSerial, safeDisplayName, type FriendState, type PublicProfile } from "./format";

const ONLINE_MS = 2 * 60_000;

type ProfileRow = {
  user_id: string;
  display_name: string;
  email: string;
  serial: number;
  avatar_url: string;
  bio: string;
  city: string;
  looking: string;
  is_owner: boolean;
  online_at: string;
  phone: string;
  dial: string;
  verified: boolean;
};

type AuthUserRow = { id: string; name: string; email: string; image: string | null };

function toProfile(row: ProfileRow, now = Date.now()): PublicProfile {
  const onlineAt = new Date(row.online_at).getTime();
  return {
    userId: row.user_id,
    displayName: safeDisplayName(row.display_name, row.email),
    serial: Number(row.serial),
    serialLabel: formatSerial(Number(row.serial)),
    avatarUrl: row.avatar_url,
    bio: row.bio,
    city: row.city,
    looking: row.looking,
    isOwner: Boolean(row.is_owner),
    verified: Boolean(row.verified) || Boolean(row.is_owner),
    phone: row.phone ?? "",
    dial: row.dial ?? "+966",
    online: Number.isFinite(onlineAt) && now - onlineAt < ONLINE_MS,
  };
}

async function loadAuthUser(sql: Awaited<ReturnType<typeof getSql>>, userId: string) {
  const rows = await sql<AuthUserRow>`
    select id, name, email, image from "user" where id = ${userId} limit 1
  `;
  return rows[0] ?? null;
}

async function upsertProfile(userId: string) {
  const sql = await getSql();
  await sql`update nimb_profiles set online_at = now() where user_id = ${userId}`;
  const existing = await sql<ProfileRow>`
    select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
    from nimb_profiles where user_id = ${userId} limit 1
  `;
  if (existing[0]) {
    if (!existing[0].is_owner) {
      const owners = await sql<{ user_id: string }>`select user_id from nimb_profiles where is_owner = true limit 1`;
      if (!owners[0]) {
        const first = await sql<{ user_id: string }>`
          select user_id from nimb_profiles order by serial asc limit 1
        `;
        if (first[0]?.user_id === userId) {
          await sql`update nimb_profiles set is_owner = true, verified = true where user_id = ${userId}`;
          existing[0].is_owner = true;
          existing[0].verified = true;
        }
      }
    }
    return existing[0];
  }

  const authUser = await loadAuthUser(sql, userId);
  const email = (authUser?.email ?? "").trim().toLowerCase();
  const displayName = safeDisplayName(authUser?.name, email);
  const avatar = authUser?.image ?? "";
  const countRows = await sql<{ n: number }>`select count(*)::int as n from nimb_profiles`;
  const isOwner = Number(countRows[0]?.n ?? 0) === 0;
  const maxRows = await sql<{ max: number | null }>`select max(serial)::int as max from nimb_profiles`;
  const next = (maxRows[0]?.max ?? 0) + 1;
  await sql`
    insert into nimb_profiles (user_id, display_name, email, serial, avatar_url, is_owner, verified)
    values (${userId}, ${displayName}, ${email}, ${next}, ${avatar}, ${isOwner}, ${isOwner})
    on conflict (user_id) do nothing
  `;
  const created = await sql<ProfileRow>`
    select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
    from nimb_profiles where user_id = ${userId} limit 1
  `;
  return created[0]!;
}

async function friendState(sql: Awaited<ReturnType<typeof getSql>>, me: string, peer: string): Promise<FriendState> {
  if (me === peer) return "none";
  const rows = await sql<{ requester_id: string; addressee_id: string; status: string }>`
    select requester_id, addressee_id, status from nimb_friends
    where (requester_id = ${me} and addressee_id = ${peer})
       or (requester_id = ${peer} and addressee_id = ${me})
  `;
  if (rows.some((r) => r.status === "accepted")) return "friends";
  if (rows.some((r) => r.requester_id === me && r.status === "pending")) return "outgoing";
  if (rows.some((r) => r.addressee_id === me && r.status === "pending")) return "incoming";
  return "none";
}

export const ensureMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const row = await upsertProfile(context.userId);
    return toProfile(row);
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const row = await upsertProfile(context.userId);
    return { ...toProfile(row), email: row.email };
  });

export const pingMe = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`update nimb_profiles set online_at = now() where user_id = ${context.userId}`;
    return { ok: true };
  });

export const updateMe = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { displayName?: string; bio?: string; city?: string; looking?: string; avatarUrl?: string; phone?: string; dial?: string }) => d)
  .handler(async ({ context, data }) => {
    await upsertProfile(context.userId);
    const sql = await getSql();
    const name = data.displayName?.trim();
    const bio = data.bio?.trim();
    const city = data.city?.trim();
    const looking = data.looking?.trim();
    const avatar = data.avatarUrl;
    const phone = data.phone?.trim();
    const dial = data.dial?.trim();
    await sql`
      update nimb_profiles set
        display_name = coalesce(${name ?? null}, display_name),
        bio = coalesce(${bio ?? null}, bio),
        city = coalesce(${city ?? null}, city),
        looking = coalesce(${looking ?? null}, looking),
        avatar_url = coalesce(${avatar ?? null}, avatar_url),
        phone = coalesce(${phone ?? null}, phone),
        dial = coalesce(${dial ?? null}, dial)
      where user_id = ${context.userId}
    `;
    const rows = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles where user_id = ${context.userId} limit 1
    `;
    return toProfile(rows[0]!);
  });

export const searchBySerial = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((raw: string) => raw)
  .handler(async ({ context, data }) => {
    await upsertProfile(context.userId);
    const n = parseSerial(data);
    if (n == null) return null;
    const sql = await getSql();
    const rows = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles where serial = ${n} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const state = await friendState(sql, context.userId, row.user_id);
    return { profile: toProfile(row), friendState: state, isSelf: row.user_id === context.userId };
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((userId: string) => userId)
  .handler(async ({ context, data: userId }) => {
    await upsertProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles where user_id = ${userId} limit 1
    `;
    const row = rows[0];
    if (!row) return null;
    const state = await friendState(sql, context.userId, row.user_id);
    return { profile: toProfile(row), friendState: state, isSelf: row.user_id === context.userId };
  });

export const listOnline = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await upsertProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles
      where user_id <> ${context.userId}
        and online_at > now() - interval '2 minutes'
      order by online_at desc
      limit 40
    `;
    return rows.map((r) => toProfile(r));
  });

export const addFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((peerId: string) => peerId)
  .handler(async ({ context, data: peerId }) => {
    if (!peerId || peerId === context.userId) return { state: "none" as FriendState };
    await upsertProfile(context.userId);
    const sql = await getSql();
    const incoming = await sql<{ status: string }>`
      select status from nimb_friends
      where requester_id = ${peerId} and addressee_id = ${context.userId}
    `;
    if (incoming[0]?.status === "pending" || incoming[0]?.status === "accepted") {
      await sql`
        update nimb_friends set status = 'accepted'
        where (requester_id = ${peerId} and addressee_id = ${context.userId})
           or (requester_id = ${context.userId} and addressee_id = ${peerId})
      `;
      await sql`
        insert into nimb_friends (requester_id, addressee_id, status)
        values (${context.userId}, ${peerId}, 'accepted')
        on conflict (requester_id, addressee_id) do update set status = 'accepted'
      `;
      return { state: "friends" as FriendState };
    }
    await sql`
      insert into nimb_friends (requester_id, addressee_id, status)
      values (${context.userId}, ${peerId}, 'pending')
      on conflict (requester_id, addressee_id) do nothing
    `;
    await sql`
      insert into nimb_notifications (id, user_id, actor_id, kind, body)
      values (${crypto.randomUUID()}, ${peerId}, ${context.userId}, 'friend', '')
    `;
    return { state: "outgoing" as FriendState };
  });

export const removeFriend = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((peerId: string) => peerId)
  .handler(async ({ context, data: peerId }) => {
    const sql = await getSql();
    await sql`
      delete from nimb_friends
      where (requester_id = ${context.userId} and addressee_id = ${peerId})
         or (requester_id = ${peerId} and addressee_id = ${context.userId})
    `;
    return { state: "none" as FriendState };
  });

export const listFriends = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await upsertProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<ProfileRow>`
      select p.user_id, p.display_name, p.email, p.serial, p.avatar_url, p.bio, p.city, p.looking, p.is_owner, p.online_at, p.phone, p.dial, p.verified
      from nimb_profiles p
      join nimb_friends f
        on ((f.requester_id = ${context.userId} and f.addressee_id = p.user_id)
         or (f.addressee_id = ${context.userId} and f.requester_id = p.user_id))
      where f.status = 'accepted' and p.user_id <> ${context.userId}
      order by p.display_name
    `;
    return rows.map((r) => toProfile(r));
  });

type MsgRow = {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  room_id: string | null;
  kind: string;
  body: string;
  media: string | null;
  view_once: boolean;
  viewed: boolean;
  created_at: string;
};

function mapMsg(row: MsgRow, me: string) {
  return {
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    roomId: row.room_id,
    mine: row.sender_id === me,
    kind: row.kind as "text" | "image" | "audio" | "video",
    body: row.body,
    media: row.media ?? undefined,
    viewOnce: Boolean(row.view_once),
    viewed: Boolean(row.viewed),
    createdAt: row.created_at,
  };
}

export const listThreads = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await upsertProfile(context.userId);
    const sql = await getSql();
    const me = context.userId;
    const peers = await sql<{ peer_id: string; last_body: string; last_at: string }>`
      select peer_id, last_body, last_at from (
        select case when sender_id = ${me} then recipient_id else sender_id end as peer_id,
               body as last_body,
               created_at as last_at,
               row_number() over (
                 partition by case when sender_id = ${me} then recipient_id else sender_id end
                 order by created_at desc
               ) as rn
        from nimb_messages
        where room_id is null
          and (sender_id = ${me} or recipient_id = ${me})
      ) t where rn = 1
    `;
    const friendRows = await sql<ProfileRow>`
      select p.user_id, p.display_name, p.email, p.serial, p.avatar_url, p.bio, p.city, p.looking, p.is_owner, p.online_at, p.phone, p.dial, p.verified
      from nimb_profiles p
      join nimb_friends f
        on ((f.requester_id = ${me} and f.addressee_id = p.user_id)
         or (f.addressee_id = ${me} and f.requester_id = p.user_id))
      where f.status = 'accepted' and p.user_id <> ${me}
    `;
    const friends = friendRows.map((r) => toProfile(r));
    const friendIds = new Set(friends.map((f) => f.userId));
    const profiles = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles
    `;
    const byId = new Map(profiles.map((p) => [p.user_id, toProfile(p)]));
    const inbox = [];
    const requests = [];
    for (const t of peers) {
      if (!t.peer_id) continue;
      const profile = byId.get(t.peer_id);
      if (!profile) continue;
      const item = { profile, lastBody: t.last_body, lastAt: t.last_at };
      if (friendIds.has(t.peer_id)) inbox.push(item);
      else requests.push(item);
    }
    for (const f of friends) {
      if (!inbox.some((i) => i.profile.userId === f.userId)) {
        inbox.push({ profile: f, lastBody: "", lastAt: "" });
      }
    }
    return { inbox, requests, requestCount: requests.length };
  });

export const listDm = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((peerId: string) => peerId)
  .handler(async ({ context, data: peerId }) => {
    const sql = await getSql();
    const me = context.userId;
    const rows = await sql<MsgRow>`
      select id, sender_id, recipient_id, room_id, kind, body, media, view_once, viewed, created_at
      from nimb_messages
      where room_id is null
        and ((sender_id = ${me} and recipient_id = ${peerId})
          or (sender_id = ${peerId} and recipient_id = ${me}))
      order by created_at asc
    `;
    return rows.map((r) => mapMsg(r, me));
  });

export const sendDm = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { peerId: string; body: string; kind?: string; media?: string; viewOnce?: boolean }) => d)
  .handler(async ({ context, data }) => {
    await upsertProfile(context.userId);
    const body = data.body.trim();
    if (!data.peerId || (!body && !data.media)) return { ok: false };
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into nimb_messages (id, sender_id, recipient_id, kind, body, media, view_once)
      values (
        ${id},
        ${context.userId},
        ${data.peerId},
        ${data.kind ?? "text"},
        ${body},
        ${data.media ?? null},
        ${Boolean(data.viewOnce)}
      )
    `;
    return { ok: true, id };
  });

export const markViewed = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      update nimb_messages set viewed = true
      where id = ${id} and recipient_id = ${context.userId} and view_once = true
    `;
    return { ok: true };
  });

export const listRooms = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await upsertProfile(context.userId);
    const sql = await getSql();
    const rooms = await sql<{ id: string; name: string; topic: string }>`
      select id, name, topic from nimb_rooms order by name
    `;
    const last = await sql<{ room_id: string; body: string; created_at: string }>`
      select distinct on (room_id) room_id, body, created_at
      from nimb_messages
      where room_id is not null
      order by room_id, created_at desc
    `;
    const lastBy = new Map(last.map((r) => [r.room_id, r]));
    return rooms.map((r) => ({
      id: r.id,
      name: r.name,
      topic: r.topic,
      lastBody: lastBy.get(r.id)?.body ?? "",
      lastAt: lastBy.get(r.id)?.created_at ?? "",
    }));
  });

export const listRoom = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((roomId: string) => roomId)
  .handler(async ({ context, data: roomId }) => {
    const sql = await getSql();
    const room = (await sql<{ id: string; name: string; topic: string }>`
      select id, name, topic from nimb_rooms where id = ${roomId} limit 1
    `)[0];
    const rows = await sql<MsgRow>`
      select id, sender_id, recipient_id, room_id, kind, body, media, view_once, viewed, created_at
      from nimb_messages where room_id = ${roomId} order by created_at asc
    `;
    const authors = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles
    `;
    const byId = new Map(authors.map((p) => [p.user_id, toProfile(p)]));
    return {
      room: room ?? null,
      messages: rows.map((r) => ({
        ...mapMsg(r, context.userId),
        author: byId.get(r.sender_id) ?? null,
      })),
    };
  });

export const sendRoom = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { roomId: string; body: string }) => d)
  .handler(async ({ context, data }) => {
    const body = data.body.trim();
    if (!body) return { ok: false };
    await upsertProfile(context.userId);
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into nimb_messages (id, sender_id, room_id, kind, body)
      values (${id}, ${context.userId}, ${data.roomId}, 'text', ${body})
    `;
    return { ok: true };
  });

export const listFeed = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await upsertProfile(context.userId);
    const sql = await getSql();
    const posts = await sql<{ id: string; author_id: string; kind: string; body: string; image: string | null; created_at: string }>`
      select id, author_id, kind, body, image, created_at from nimb_posts order by created_at desc limit 80
    `;
    const likes = await sql<{ post_id: string; user_id: string }>`select post_id, user_id from nimb_post_likes`;
    const comments = await sql<{ id: string; post_id: string; author_id: string; body: string; created_at: string }>`
      select id, post_id, author_id, body, created_at from nimb_post_comments order by created_at asc
    `;
    const stories = await sql<{ id: string; author_id: string; image: string; created_at: string }>`
      select id, author_id, image, created_at from nimb_stories
      where created_at > now() - interval '24 hours'
      order by created_at desc
    `;
    const authors = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles
    `;
    const byId = new Map(authors.map((p) => [p.user_id, toProfile(p)]));
    return {
      stories: stories.map((s) => ({
        id: s.id,
        image: s.image,
        createdAt: s.created_at,
        author: byId.get(s.author_id) ?? null,
      })),
      posts: posts.map((p) => ({
        id: p.id,
        kind: p.kind,
        body: p.body,
        image: p.image ?? undefined,
        createdAt: p.created_at,
        author: byId.get(p.author_id) ?? null,
        likes: likes.filter((l) => l.post_id === p.id).map((l) => l.user_id),
        comments: comments
          .filter((c) => c.post_id === p.id)
          .map((c) => ({
            id: c.id,
            body: c.body,
            createdAt: c.created_at,
            author: byId.get(c.author_id) ?? null,
          })),
      })),
    };
  });

export const addPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { kind: "photo" | "story"; body: string; image?: string }) => d)
  .handler(async ({ context, data }) => {
    const body = data.body.trim();
    if (!body && !data.image) return { ok: false };
    await upsertProfile(context.userId);
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into nimb_posts (id, author_id, kind, body, image)
      values (${id}, ${context.userId}, ${data.kind}, ${body}, ${data.image ?? null})
    `;
    return { ok: true };
  });

export const addStory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { image: string }) => d)
  .handler(async ({ context, data }) => {
    if (!data.image) return { ok: false };
    await upsertProfile(context.userId);
    const sql = await getSql();
    const id = crypto.randomUUID();
    await sql`
      insert into nimb_stories (id, author_id, image)
      values (${id}, ${context.userId}, ${data.image})
    `;
    return { ok: true };
  });

export const likePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((postId: string) => postId)
  .handler(async ({ context, data: postId }) => {
    const sql = await getSql();
    const existing = await sql<{ post_id: string }>`
      select post_id from nimb_post_likes where post_id = ${postId} and user_id = ${context.userId}
    `;
    if (existing[0]) {
      await sql`delete from nimb_post_likes where post_id = ${postId} and user_id = ${context.userId}`;
    } else {
      await sql`insert into nimb_post_likes (post_id, user_id) values (${postId}, ${context.userId})`;
      const authors = await sql<{ author_id: string }>`select author_id from nimb_posts where id = ${postId} limit 1`;
      const authorId = authors[0]?.author_id;
      if (authorId && authorId !== context.userId) {
        await sql`
          insert into nimb_notifications (id, user_id, actor_id, kind, post_id, body)
          values (${crypto.randomUUID()}, ${authorId}, ${context.userId}, 'like', ${postId}, '')
        `;
      }
    }
    return { ok: true };
  });

export const commentPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { postId: string; body: string }) => d)
  .handler(async ({ context, data }) => {
    const body = data.body.trim();
    if (!body) return { ok: false };
    await upsertProfile(context.userId);
    const sql = await getSql();
    await sql`
      insert into nimb_post_comments (id, post_id, author_id, body)
      values (${crypto.randomUUID()}, ${data.postId}, ${context.userId}, ${body})
    `;
    const authors = await sql<{ author_id: string }>`select author_id from nimb_posts where id = ${data.postId} limit 1`;
    const authorId = authors[0]?.author_id;
    if (authorId && authorId !== context.userId) {
      await sql`
        insert into nimb_notifications (id, user_id, actor_id, kind, post_id, body)
        values (${crypto.randomUUID()}, ${authorId}, ${context.userId}, 'comment', ${data.postId}, ${body})
      `;
    }
    return { ok: true };
  });

export const getStory = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const sql = await getSql();
    const rows = await sql<{ id: string; author_id: string; image: string; created_at: string }>`
      select id, author_id, image, created_at from nimb_stories where id = ${id} limit 1
    `;
    const s = rows[0];
    if (!s) return null;
    const authors = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles where user_id = ${s.author_id} limit 1
    `;
    return { id: s.id, image: s.image, createdAt: s.created_at, author: authors[0] ? toProfile(authors[0]) : null };
  });

export const recordCallLog = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { peerId: string; kind: string; direction: string; outcome: string; durationSec: number }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      insert into nimb_call_logs (id, user_id, peer_id, kind, direction, outcome, duration_sec)
      values (
        ${crypto.randomUUID()},
        ${context.userId},
        ${data.peerId},
        ${data.kind},
        ${data.direction},
        ${data.outcome},
        ${data.durationSec}
      )
    `;
    return { ok: true };
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await upsertProfile(context.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      actor_id: string;
      kind: string;
      post_id: string | null;
      body: string;
      read: boolean;
      created_at: string;
    }>`
      select id, actor_id, kind, post_id, body, read, created_at
      from nimb_notifications
      where user_id = ${context.userId}
      order by created_at desc
      limit 80
    `;
    const actors = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles
    `;
    const byId = new Map(actors.map((p) => [p.user_id, toProfile(p)]));
    return {
      unread: rows.filter((r) => !r.read).length,
      items: rows.map((r) => ({
        id: r.id,
        kind: r.kind,
        postId: r.post_id,
        body: r.body,
        read: Boolean(r.read),
        createdAt: r.created_at,
        actor: byId.get(r.actor_id) ?? null,
      })),
    };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`
      update nimb_notifications set read = true
      where id = ${id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const blockUser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((peerId: string) => peerId)
  .handler(async ({ context, data: peerId }) => {
    if (!peerId || peerId === context.userId) return { ok: false };
    const sql = await getSql();
    await sql`
      insert into nimb_blocks (user_id, peer_id)
      values (${context.userId}, ${peerId})
      on conflict (user_id, peer_id) do nothing
    `;
    await sql`
      delete from nimb_friends
      where (requester_id = ${context.userId} and addressee_id = ${peerId})
         or (requester_id = ${peerId} and addressee_id = ${context.userId})
    `;
    return { ok: true };
  });

export const listHighlights = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const sql = await getSql();
    return sql<{ id: string; title: string; body: string; pinned: boolean; created_at: string }>`
      select id, title, body, pinned, created_at
      from nimb_highlights
      where user_id = ${userId}
      order by pinned desc, created_at desc
    `;
  });

export const addHighlight = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { title: string; body: string; pinned?: boolean }) => d)
  .handler(async ({ context, data }) => {
    const title = data.title.trim();
    const body = data.body.trim();
    if (!title && !body) return { ok: false };
    const sql = await getSql();
    if (data.pinned) {
      await sql`update nimb_highlights set pinned = false where user_id = ${context.userId}`;
    }
    await sql`
      insert into nimb_highlights (id, user_id, title, body, pinned)
      values (${crypto.randomUUID()}, ${context.userId}, ${title || "حالة"}, ${body}, ${Boolean(data.pinned)})
    `;
    return { ok: true };
  });

export const pinHighlight = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await sql`update nimb_highlights set pinned = false where user_id = ${context.userId}`;
    await sql`
      update nimb_highlights set pinned = true
      where id = ${id} and user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const requestVerify = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await sql`
      insert into nimb_verify_requests (user_id, status)
      values (${context.userId}, 'pending')
      on conflict (user_id) do update set status = 'pending'
    `;
    const owners = await sql<{ user_id: string }>`select user_id from nimb_profiles where is_owner = true`;
    for (const o of owners) {
      if (o.user_id === context.userId) continue;
      await sql`
        insert into nimb_notifications (id, user_id, actor_id, kind, body)
        values (${crypto.randomUUID()}, ${o.user_id}, ${context.userId}, 'verify', '')
      `;
    }
    return { ok: true };
  });

export const listVerifyRequests = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await sql<{ is_owner: boolean }>`
      select is_owner from nimb_profiles where user_id = ${context.userId} limit 1
    `;
    if (!me[0]?.is_owner) return [];
    const rows = await sql<{ user_id: string; status: string; created_at: string }>`
      select user_id, status, created_at from nimb_verify_requests
      where status = 'pending'
      order by created_at asc
    `;
    const profiles = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles
    `;
    const byId = new Map(profiles.map((p) => [p.user_id, toProfile(p)]));
    return rows.map((r) => ({
      userId: r.user_id,
      status: r.status,
      createdAt: r.created_at,
      profile: byId.get(r.user_id) ?? null,
    }));
  });

export const decideVerify = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { userId: string; approve: boolean }) => d)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await sql<{ is_owner: boolean }>`
      select is_owner from nimb_profiles where user_id = ${context.userId} limit 1
    `;
    if (!me[0]?.is_owner) return { ok: false };
    await sql`
      update nimb_verify_requests
      set status = ${data.approve ? "approved" : "denied"}
      where user_id = ${data.userId}
    `;
    if (data.approve) {
      await sql`update nimb_profiles set verified = true where user_id = ${data.userId}`;
    }
    return { ok: true };
  });

export const listUserPosts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((userId: string) => userId)
  .handler(async ({ context, data: userId }) => {
    await upsertProfile(context.userId);
    const sql = await getSql();
    const posts = await sql<{ id: string; author_id: string; kind: string; body: string; image: string | null; created_at: string }>`
      select id, author_id, kind, body, image, created_at
      from nimb_posts where author_id = ${userId}
      order by created_at desc limit 40
    `;
    const likes = await sql<{ post_id: string; user_id: string }>`select post_id, user_id from nimb_post_likes`;
    const comments = await sql<{ id: string; post_id: string; author_id: string; body: string; created_at: string }>`
      select id, post_id, author_id, body, created_at from nimb_post_comments order by created_at asc
    `;
    const authors = await sql<ProfileRow>`
      select user_id, display_name, email, serial, avatar_url, bio, city, looking, is_owner, online_at, phone, dial, verified
      from nimb_profiles where user_id = ${userId} limit 1
    `;
    const author = authors[0] ? toProfile(authors[0]) : null;
    return posts.map((p) => ({
      id: p.id,
      kind: p.kind,
      body: p.body,
      image: p.image ?? undefined,
      createdAt: p.created_at,
      author,
      likes: likes.filter((l) => l.post_id === p.id).map((l) => l.user_id),
      comments: comments
        .filter((c) => c.post_id === p.id)
        .map((c) => ({
          id: c.id,
          body: c.body,
          createdAt: c.created_at,
          author,
        })),
    }));
  });
