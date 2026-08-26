export function formatSerial(n: number) {
  return `#${String(n).padStart(6, "0")}`;
}

export function parseSerial(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

export function safeDisplayName(name: string | null | undefined, email?: string | null) {
  const n = (name ?? "").trim();
  if (n && !n.includes("@")) return n;
  const local = (email ?? "").split("@")[0]?.trim();
  if (local) return local;
  return n.replace(/@.*$/, "") || "حساب";
}

export type PublicProfile = {
  userId: string;
  displayName: string;
  serial: number;
  serialLabel: string;
  avatarUrl: string;
  bio: string;
  city: string;
  looking: string;
  isOwner: boolean;
  verified: boolean;
  phone: string;
  dial: string;
  online: boolean;
};

export type FriendState = "none" | "friends" | "outgoing" | "incoming";
