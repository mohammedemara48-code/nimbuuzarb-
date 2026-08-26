import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountSwitcher } from "@/components/account-switcher";
import { BackLink } from "@/components/back-link";
import { RequireAuth } from "@/components/require-auth";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { DIAL_CODES, onlyPhoneDigits } from "@/lib/nimb/countries";
import { readAvatar } from "@/lib/nimb/files";
import {
  decideVerify,
  getMe,
  listVerifyRequests,
  requestVerify,
  updateMe,
} from "@/lib/nimb/server";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const authUser = useCurrentUser();
  const me = useQuery({ queryKey: ["me-full"], queryFn: () => getMe() });
  const requests = useQuery({
    queryKey: ["verify-requests"],
    queryFn: () => listVerifyRequests(),
    enabled: Boolean(me.data?.isOwner),
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const p = me.data;
  const [name, setName] = useState<string | null>(null);
  const [bio, setBio] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [looking, setLooking] = useState<string | null>(null);
  const [dial, setDial] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <RequireAuth>
      <div className="mx-auto min-h-dvh w-full max-w-lg bg-bg">
        <header className="flex items-center gap-2 border-b border-border px-2 pb-2 pt-[max(0.6rem,env(safe-area-inset-top))]">
          <BackLink to="/profile" />
          <h1 className="text-base font-semibold">{p?.displayName}</h1>
        </header>
        {!p ? (
          <div className="h-40" />
        ) : (
          <div className="space-y-4 p-4">
            <button type="button" onClick={() => fileRef.current?.click()} className="mx-auto block">
              <Avatar src={p.avatarUrl} name={p.displayName} size="xl" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void readAvatar(file).then((avatarUrl) =>
                  updateMe({ data: { avatarUrl } }).then(() => {
                    void qc.invalidateQueries({ queryKey: ["me"] });
                    void qc.invalidateQueries({ queryKey: ["me-full"] });
                  }),
                );
              }}
            />
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">الاسم</span>
              <input
                value={name ?? p.displayName}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">نبذة</span>
              <textarea
                value={bio ?? p.bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">المدينة</span>
              <input
                value={city ?? p.city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">أبحث عن</span>
              <select
                value={looking ?? p.looking}
                onChange={(e) => setLooking(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
              >
                <option value="">—</option>
                <option value="رجال">رجال</option>
                <option value="نساء">نساء</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">الجوال</span>
              <div className="flex gap-2">
                <select
                  value={dial ?? p.dial}
                  onChange={(e) => setDial(e.target.value)}
                  className="h-11 max-w-[10.5rem] rounded-md border border-border bg-surface px-2 text-sm"
                  dir="ltr"
                >
                  {DIAL_CODES.map((c) => (
                    <option key={c.code + c.name} value={c.code}>
                      {c.code} {c.name}
                    </option>
                  ))}
                </select>
                <input
                  value={phone ?? p.phone}
                  onChange={(e) => setPhone(onlyPhoneDigits(e.target.value))}
                  dir="ltr"
                  className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-sm"
                />
              </div>
            </label>
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void updateMe({
                  data: {
                    displayName: name ?? p.displayName,
                    bio: bio ?? p.bio,
                    city: city ?? p.city,
                    looking: looking ?? p.looking,
                    dial: dial ?? p.dial,
                    phone: phone ?? p.phone,
                  },
                }).then(() => {
                  setBusy(false);
                  void qc.invalidateQueries({ queryKey: ["me"] });
                  void qc.invalidateQueries({ queryKey: ["me-full"] });
                });
              }}
            >
              حفظ
            </Button>
            {!p.verified && (
              <Button variant="secondary" className="w-full" onClick={() => void requestVerify()}>
                توثيق
              </Button>
            )}
            {p.isOwner && (requests.data?.length ?? 0) > 0 && (
              <ul className="space-y-2">
                {requests.data?.map((r) =>
                  r.profile ? (
                    <li key={r.userId} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
                      <Avatar src={r.profile.avatarUrl} name={r.profile.displayName} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm">{r.profile.displayName}</span>
                      <Button
                        size="sm"
                        onClick={() =>
                          void decideVerify({ data: { userId: r.userId, approve: true } }).then(() =>
                            qc.invalidateQueries({ queryKey: ["verify-requests"] }),
                          )
                        }
                      >
                        قبول
                      </Button>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
            {authUser && <AccountSwitcher user={authUser} />}
            <Button variant="secondary" className="w-full" onClick={() => void signOut()}>
              خروج
            </Button>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
