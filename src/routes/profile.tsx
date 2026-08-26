import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/verified-badge";
import { addHighlight, ensureMe, listHighlights, listUserPosts, pinHighlight } from "@/lib/nimb/server";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ["me"], queryFn: () => ensureMe() });
  const highlights = useQuery({
    queryKey: ["highlights", me.data?.userId],
    queryFn: () => listHighlights({ data: me.data!.userId }),
    enabled: Boolean(me.data?.userId),
  });
  const posts = useQuery({
    queryKey: ["user-posts", me.data?.userId],
    queryFn: () => listUserPosts({ data: me.data!.userId }),
    enabled: Boolean(me.data?.userId),
  });
  const [adding, setAdding] = useState(false);
  const [status, setStatus] = useState("");
  const [circle, setCircle] = useState("");
  const p = me.data;
  const saved = highlights.data ?? [];
  const pinned = saved.find((h) => h.pinned);

  return (
    <AppShell
      title={p?.displayName || " "}
      action={
        <Link to="/settings" replace className="grid size-11 place-items-center rounded-md">
          <Settings className="size-5" />
        </Link>
      }
    >
      {!p ? (
        <div className="h-40" />
      ) : (
        <div className="space-y-5 p-4">
          <div className="flex flex-col items-center gap-2">
            <Avatar src={p.avatarUrl} name={p.displayName} size="xl" />
            <h2 className="inline-flex items-center gap-1.5 text-lg font-semibold">
              {p.displayName}
              {p.verified && <VerifiedBadge className="size-5" />}
            </h2>
            <p className="font-mono text-sm text-primary" dir="ltr">
              {p.serialLabel}
            </p>
            {pinned?.body ? <p className="text-center text-sm text-muted">{pinned.body}</p> : null}
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="flex w-16 shrink-0 flex-col items-center gap-1"
            >
              <span className="grid size-14 place-items-center rounded-full border border-dashed border-primary text-primary">
                <Plus className="size-5" />
              </span>
            </button>
            {saved.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() =>
                  void pinHighlight({ data: h.id }).then(() =>
                    qc.invalidateQueries({ queryKey: ["highlights"] }),
                  )
                }
                className="flex w-16 shrink-0 flex-col items-center gap-1"
              >
                <span
                  className={
                    h.pinned
                      ? "grid size-14 place-items-center rounded-full bg-primary px-1 text-center text-[10px] font-medium leading-tight text-primary-fg"
                      : "grid size-14 place-items-center rounded-full border border-border bg-surface px-1 text-center text-[10px] leading-tight"
                  }
                >
                  {h.title.slice(0, 8)}
                </span>
              </button>
            ))}
          </div>

          {adding && (
            <div className="space-y-2 rounded-xl border border-border bg-surface p-3">
              <input
                value={circle}
                onChange={(e) => setCircle(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
              />
              <input
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
              />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setAdding(false)}>
                  إلغاء
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    void addHighlight({ data: { title: circle, body: status, pinned: true } }).then(
                      () => {
                        setStatus("");
                        setCircle("");
                        setAdding(false);
                        void qc.invalidateQueries({ queryKey: ["highlights"] });
                      },
                    );
                  }}
                >
                  حفظ
                </Button>
              </div>
            </div>
          )}

          <ul className="space-y-4">
            {(posts.data ?? []).map((post) => (
              <li key={post.id}>
                <PostCard post={post} myId={p.userId} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppShell>
  );
}
