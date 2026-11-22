import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { rememberPrefDefault, setRememberPref, upsertSavedAccount } from "@/lib/chat/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DIAL_CODES, onlyEmailChars, onlyPhoneDigits } from "@/lib/nimb/countries";
import { updateMe } from "@/lib/nimb/server";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dial, setDial] = useState("+966");
  const [phone, setPhone] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setRemember(rememberPrefDefault());
  }, []);

  if (isPending) {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary text-2xl font-semibold text-primary-fg">
          N
        </span>
      </main>
    );
  }
  if (user) return <Navigate to="/" replace />;

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (mode === "signup" && !trimmedName) {
      setError("الاسم مطلوب");
      return;
    }
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim())) {
      setError("البريد غير صالح");
      return;
    }
    setBusy(true);
    setRememberPref(remember);
    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: trimmedName,
        });
        if (err) throw new Error(err.message ?? "تعذر إنشاء الحساب");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
          rememberMe: remember,
        });
        if (err) throw new Error(err.message ?? "بيانات الدخول غير صحيحة");
      }
      const session = await authClient.getSession();
      const u = session.data?.user;
      if (u && remember) {
        upsertSavedAccount({
          id: u.id,
          name: u.name ?? trimmedName,
          email: u.email,
          image: u.image ?? null,
        });
      }
      if (mode === "signup") {
        try {
          await updateMe({
            data: {
              displayName: trimmedName,
              phone,
              dial,
            },
          });
        } catch {
          /* profile is created on first authenticated request */
        }
      }
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-dvh w-full justify-center bg-bg px-5 pb-10 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="flex w-full max-w-lg flex-col">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary text-2xl font-semibold text-primary-fg">
            N
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Nimbuuz</h1>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-4 text-base font-semibold">
            {mode === "signup" ? "إنشاء حساب" : "تسجيل الدخول"}
          </h2>
          <form onSubmit={submitEmail} className="space-y-3">
            {mode === "signup" && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">الاسم</span>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  inputMode="text"
                  required
                />
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">البريد</span>
              <Input
                type="text"
                inputMode="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                lang="en"
                required
                value={email}
                onChange={(e) => setEmail(onlyEmailChars(e.target.value))}
                autoComplete="username"
                dir="ltr"
              />
            </label>
            {mode === "signup" && (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted">الجوال</span>
                <div className="flex gap-2">
                  <select
                    value={dial}
                    onChange={(e) => setDial(e.target.value)}
                    className="h-11 max-w-[10.5rem] rounded-md border border-border bg-bg px-2 text-sm"
                    dir="ltr"
                    aria-label="مفتاح الدولة"
                  >
                    {DIAL_CODES.map((c) => (
                      <option key={c.code + c.name} value={c.code}>
                        {c.code} {c.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(onlyPhoneDigits(e.target.value))}
                    dir="ltr"
                    className="flex-1"
                    autoComplete="tel-national"
                  />
                </div>
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">كلمة المرور</span>
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                dir="ltr"
              />
            </label>
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-bg px-3">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span className="text-sm font-medium">حفظ تسجيل الدخول</span>
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy || !authEnabled}>
              {busy ? "جارٍ…" : mode === "signup" ? "إنشاء حساب" : "دخول"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-primary"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
            >
              {mode === "signin" ? "إنشاء حساب" : "تسجيل الدخول"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
