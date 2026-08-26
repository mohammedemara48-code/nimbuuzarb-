import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Compass, Hash, Image, MessageCircle, UserRound } from "lucide-react";
import { listNotifications, listThreads } from "@/lib/nimb/server";
import { cn } from "@/lib/utils";
import { RequireAuth } from "./require-auth";

const TABS = [
  { to: "/", label: "استكشف", icon: Compass },
  { to: "/feed", label: "مجتمع", icon: Image },
  { to: "/rooms", label: "غرف", icon: Hash },
  { to: "/messages", label: "رسائل", icon: MessageCircle },
  { to: "/profile", label: "أنا", icon: UserRound },
] as const;

export function AppShell({
  title,
  action,
  children,
  hideNav = false,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  hideNav?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => listThreads() });
  const notes = useQuery({ queryKey: ["notifications"], queryFn: () => listNotifications() });
  const requestCount = threads.data?.requestCount ?? 0;
  const unread = notes.data?.unread ?? 0;
  return (
    <RequireAuth>
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg text-fg">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 pb-3 pt-[max(0.9rem,env(safe-area-inset-top))]">
          <h1 className="min-w-0 truncate text-xl font-semibold tracking-tight text-fg">{title}</h1>
          <div className="flex items-center gap-1">
            {action}
            <Link
              to="/notifications"
              replace
              className="relative grid size-11 place-items-center rounded-md text-fg"
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute end-1.5 top-1.5 size-2 rounded-full bg-primary" />
              )}
            </Link>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {!hideNav && (
          <nav className="grid grid-cols-5 border-t border-border bg-surface pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1">
            {TABS.map((tab) => {
              const active =
                tab.to === "/"
                  ? pathname === "/"
                  : pathname === tab.to || pathname.startsWith(`${tab.to}/`);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  replace
                  className={cn(
                    "relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                    active ? "text-primary" : "text-muted",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                  {tab.label}
                  {tab.to === "/messages" && requestCount > 0 && (
                    <span className="absolute start-1/2 top-1 ms-3 size-2 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </RequireAuth>
  );
}
