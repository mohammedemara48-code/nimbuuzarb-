import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ensureMe, listFeed, listOnline, searchBySerial } from "@/lib/nimb/server";

export const Route = createFileRoute("/")({ component: Discover });

function Discover() {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const me = useQuery({ queryKey: ["me"], queryFn: () => ensureMe() });
  const online = useQuery({ queryKey: ["online"], queryFn: () => listOnline(), refetchInterval: 20_000 });
  const feed = useQuery({ queryKey: ["feed"], queryFn: () => listFeed() });
  const found = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => searchBySerial({ data: submitted }),
    enabled: submitted.length > 0,
  });
  const posts = feed.data?.posts ?? [];

  return (
    <AppShell title="Nimbuuz">
      <div className="space-y-4 p-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(q.trim());
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              dir="ltr"
              inputMode="numeric"
              className="h-12 w-full rounded-md border border-border bg-surface pe-3 ps-10 text-sm text-fg"
            />
          </div>
          <Button type="submit">بحث</Button>
        </form>

        {found.data && !found.data.isSelf && (
          <Link
            to="/person/$id"
            params={{ id: found.data.profile.userId }}
            replace
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <Avatar src={found.data.profile.avatarUrl} name={found.data.profile.displayName} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-semibold">{found.data.profile.displayName}</span>
              <span className="block font-mono text-xs text-primary" dir="ltr">
                {found.data.profile.serialLabel}
              </span>
              <span className="block text-xs text-muted">
                {found.data.profile.city}
                {found.data.friendState === "friends" ? " · صديق" : ""}
              </span>
            </span>
          </Link>
        )}

        {(online.data ?? []).length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {(online.data ?? []).map((p) => (
              <Link
                key={p.userId}
                to="/person/$id"
                params={{ id: p.userId }}
                replace
                className="flex w-16 shrink-0 flex-col items-center gap-1"
              >
                <span className="relative">
                  <Avatar src={p.avatarUrl} name={p.displayName} />
                  <span className="absolute end-0 bottom-0 size-2.5 rounded-full bg-ok ring-2 ring-bg" />
                </span>
                <span className="w-full truncate text-center text-[11px] text-muted">{p.displayName}</span>
              </Link>
            ))}
          </div>
        )}

        <ul className="space-y-4 pb-6">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} myId={me.data?.userId} />
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
