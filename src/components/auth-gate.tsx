import { useEffect, type ReactNode } from "react";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState, type AppUser } from "@/lib/auth/use-current-user";
import {
  clearPendingRemember,
  pendingRemember,
  touchSavedAccount,
  upsertSavedAccount,
} from "@/lib/chat/accounts";

export function AuthGate({
  children,
}: {
  children: (user: AppUser) => ReactNode;
}) {
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (!user) return;
    if (pendingRemember()) {
      upsertSavedAccount({
        id: user.id,
        name: user.displayName ?? user.primaryEmail ?? "حساب",
        email: user.primaryEmail ?? "",
        image: user.profileImageUrl,
      });
    } else {
      touchSavedAccount(user.id);
    }
    clearPendingRemember();
  }, [user]);

  if (isPending) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg">
        <div className="h-14 border-b border-border" />
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-12 animate-pulse rounded-full bg-border" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-border" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-border" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;
  return <>{children(user)}</>;
}
