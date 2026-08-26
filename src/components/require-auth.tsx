import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureMe, pingMe } from "@/lib/nimb/server";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  useQuery({
    queryKey: ["me"],
    queryFn: () => ensureMe(),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!user) return;
    void pingMe();
    const t = window.setInterval(() => void pingMe(), 45_000);
    return () => window.clearInterval(t);
  }, [user]);

  if (isPending) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <span className="grid size-16 place-items-center rounded-2xl bg-primary text-2xl font-semibold text-primary-fg">
          N
        </span>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <>{children}</>;
}
