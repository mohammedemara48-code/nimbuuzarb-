const ROSTER_KEY = "wasl.accounts";
const REMEMBER_KEY = "wasl.remember";
const PENDING_KEY = "wasl.pendingRemember";

export type SavedAccount = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  lastUsed: number;
};

function readJson<T>(storage: Storage, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function listSavedAccounts(): SavedAccount[] {
  if (typeof window === "undefined") return [];
  const list = readJson<SavedAccount[]>(window.localStorage, ROSTER_KEY, []);
  return [...list].sort((a, b) => b.lastUsed - a.lastUsed);
}

export function rememberPrefDefault(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(REMEMBER_KEY);
  if (v === null) return true;
  return v === "1";
}

export function setRememberPref(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_KEY, on ? "1" : "0");
  window.sessionStorage.setItem(PENDING_KEY, on ? "1" : "0");
}

export function pendingRemember(): boolean {
  if (typeof window === "undefined") return true;
  const pending = window.sessionStorage.getItem(PENDING_KEY);
  if (pending === "0") return false;
  if (pending === "1") return true;
  return rememberPrefDefault();
}

export function clearPendingRemember() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_KEY);
}

export function upsertSavedAccount(account: Omit<SavedAccount, "lastUsed">) {
  if (typeof window === "undefined") return;
  if (!account.email && !account.id) return;
  const list = listSavedAccounts().filter(
    (a) => a.id !== account.id && a.email !== account.email,
  );
  list.unshift({ ...account, lastUsed: Date.now() });
  window.localStorage.setItem(ROSTER_KEY, JSON.stringify(list.slice(0, 8)));
}

export function touchSavedAccount(id: string) {
  if (typeof window === "undefined") return;
  const list = listSavedAccounts().map((a) =>
    a.id === id ? { ...a, lastUsed: Date.now() } : a,
  );
  window.localStorage.setItem(ROSTER_KEY, JSON.stringify(list));
}

export function removeSavedAccount(id: string) {
  if (typeof window === "undefined") return;
  const list = listSavedAccounts().filter((a) => a.id !== id);
  window.localStorage.setItem(ROSTER_KEY, JSON.stringify(list));
}
