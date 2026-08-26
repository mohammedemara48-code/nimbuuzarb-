import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { BackLink } from "@/components/back-link";
import { Avatar } from "@/components/ui/avatar";
import { addFriend, commentPost, listNotifications, markNotificationRead } from "@/lib/nimb/server";
import { formatWhen } from "@/lib/nimb/time";

export const Route = createFileRoute("/notifications")({ component: Notifications });

function label(kind: string) {
  if (kind === "like") return "أعجب بمنشورك";
  if (kind === "comment") return "علّق";
  if (kind === "friend") return "أرسل إضافة";
  if (kind === "verify") return "طلب توثيق";
  return "";
}

function Notifications() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["notifications"], queryFn: () => listNotifications() });
  const items = q.data?.items ?? [];
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const done = (id: string) => {
    void markNotificationRead({ data: id }).then(() =>
      qc.invalidateQueries({ queryKey: ["notifications"] }),
    );
  };

  return (
    <AppShell
      title=" "
      action={<BackLink to="/" />}
    >
      <ul>
        {items.map((n) => (
          <li key={n.id} className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              {n.actor && (
                <Link to="/person/$id" params={{ id: n.actor.userId }} replace>
                  <Avatar src={n.actor.avatarUrl} name={n.actor.displayName} size="sm" />
                </Link>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="font-medium">{n.actor?.displayName}</span> {label(n.kind)}
                </p>
                {n.body ? <p className="truncate text-xs text-muted">{n.body}</p> : null}
                <p className="text-[11px] text-subtle">{formatWhen(n.createdAt)}</p>
              </div>
              {n.kind === "friend" && n.actor && (
                <button
                  type="button"
                  className="h-10 rounded-md bg-primary px-3 text-xs font-medium text-primary-fg"
                  onClick={() => {
                    void addFriend({ data: n.actor!.userId }).then(() => done(n.id));
                  }}
                >
                  قبول
                </button>
              )}
              {n.kind === "comment" && n.postId && (
                <button
                  type="button"
                  className="grid h-10 place-items-center rounded-md bg-elevated px-3 text-xs"
                  onClick={() => setReplyFor(replyFor === n.id ? null : n.id)}
                >
                  رد
                </button>
              )}
              {n.kind === "like" && n.actor && (
                <button
                  type="button"
                  className="grid h-10 place-items-center rounded-md bg-elevated px-3 text-xs"
                  onClick={() => {
                    void addFriend({ data: n.actor!.userId }).then(() => done(n.id));
                  }}
                >
                  رد
                </button>
              )}
            </div>
            {replyFor === n.id && n.postId && (
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = draft.trim();
                  if (!body) return;
                  setDraft("");
                  setReplyFor(null);
                  void commentPost({ data: { postId: n.postId!, body } }).then(() => done(n.id));
                }}
              >
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  autoFocus
                  className="h-10 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 text-sm"
                />
                <button type="submit" className="h-10 rounded-md bg-primary px-3 text-xs font-medium text-primary-fg">
                  إرسال
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
