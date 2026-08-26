import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { listThreads } from "@/lib/nimb/server";
import { formatWhen } from "@/lib/nimb/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({ component: Messages });

function Messages() {
  const [tab, setTab] = useState<"inbox" | "requests">("inbox");
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => listThreads() });
  const ids = tab === "inbox" ? threads.data?.inbox ?? [] : threads.data?.requests ?? [];

  return (
    <AppShell title="الرسائل">
      <div className="flex gap-1 px-4 pt-3">
        <button
          type="button"
          onClick={() => setTab("inbox")}
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium",
            tab === "inbox" ? "bg-primary text-primary-fg" : "bg-elevated text-muted",
          )}
        >
          الأصدقاء
        </button>
        <button
          type="button"
          onClick={() => setTab("requests")}
          className={cn(
            "h-9 flex-1 rounded-md text-sm font-medium",
            tab === "requests" ? "bg-primary text-primary-fg" : "bg-elevated text-muted",
          )}
        >
          الطلبات
          {threads.data?.requestCount ? ` · ${threads.data.requestCount}` : ""}
        </button>
      </div>
      <ul className="mt-2">
        {ids.map((item) => (
          <li key={item.profile.userId}>
            <Link
              to="/chat/$id"
              params={{ id: item.profile.userId }}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface"
            >
              <span className="relative shrink-0">
                <Avatar src={item.profile.avatarUrl} name={item.profile.displayName} />
                {item.profile.online && (
                  <span className="absolute end-0 bottom-0 size-2.5 rounded-full bg-ok ring-2 ring-bg" />
                )}
              </span>
              <span className="min-w-0 flex-1 border-b border-border py-2">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{item.profile.displayName}</span>
                  {item.lastAt && (
                    <span className="text-[11px] text-subtle">{formatWhen(item.lastAt)}</span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {item.lastBody}
                </span>
                <span className="block font-mono text-[10px] text-subtle" dir="ltr">
                  {item.profile.serialLabel}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
