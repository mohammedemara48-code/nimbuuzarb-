import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, MoreHorizontal, Phone, UserPlus, Video } from "lucide-react";
import { ActionMenu } from "@/components/action-menu";
import { BackLink } from "@/components/back-link";
import { PostCard } from "@/components/post-card";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/verified-badge";
import { useCallStore } from "@/lib/chat/call-store";
import {
  addFriend,
  blockUser,
  ensureMe,
  getProfile,
  listHighlights,
  listUserPosts,
  removeFriend,
} from "@/lib/nimb/server";

export const Route = createFileRoute("/person/$id")({ component: PersonPage });

function PersonPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [menu, setMenu] = useState(false);
  const me = useQuery({ queryKey: ["me"], queryFn: () => ensureMe() });
  const q = useQuery({ queryKey: ["profile", id], queryFn: () => getProfile({ data: id }) });
  const highlights = useQuery({ queryKey: ["highlights", id], queryFn: () => listHighlights({ data: id }) });
  const posts = useQuery({ queryKey: ["user-posts", id], queryFn: () => listUserPosts({ data: id }) });
  const add = useMutation({
    mutationFn: () => addFriend({ data: id }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["profile", id] }),
  });
  const data = q.data;
  if (q.isPending) {
    return (
      <RequireAuth>
        <div className="min-h-dvh bg-bg" />
      </RequireAuth>
    );
  }
  if (!data) {
    return (
      <RequireAuth>
        <div className="min-h-dvh bg-bg" />
      </RequireAuth>
    );
  }
  const p = data.profile;
  const friends = data.friendState === "friends";
  const call = (kind: "audio" | "video") => {
    void useCallStore.getState().startOutgoing(
      { id: p.userId, name: p.displayName, avatar: p.avatarUrl, conversationId: p.userId },
      kind,
    );
  };
  const pinned = (highlights.data ?? []).find((h) => h.pinned);

  return (
    <RequireAuth>
      <div className="relative mx-auto min-h-dvh w-full max-w-lg bg-bg pb-10">
        <header className="absolute z-10 flex w-full max-w-lg items-center justify-between px-2 pt-[max(0.6rem,env(safe-area-inset-top))]">
          <BackLink
            to="/"
            className="grid size-11 place-items-center rounded-full bg-bg/70 text-fg"
          />
          {!data.isSelf && (
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full bg-bg/70"
              onClick={() => setMenu((v) => !v)}
            >
              <MoreHorizontal className="size-5" />
            </button>
          )}
        </header>
        <ActionMenu open={menu} onClose={() => setMenu(false)}>
          {friends && (
            <button
              type="button"
              className="block h-11 w-full px-4 text-start text-sm"
              onClick={() => {
                setMenu(false);
                void removeFriend({ data: id }).then(() => qc.invalidateQueries({ queryKey: ["profile", id] }));
              }}
            >
              إلغاء
            </button>
          )}
          <button
            type="button"
            className="block h-11 w-full px-4 text-start text-sm text-danger"
            onClick={() => {
              setMenu(false);
              void blockUser({ data: id }).then(() => navigate({ to: "/", replace: true }));
            }}
          >
            حظر
          </button>
        </ActionMenu>
        {p.avatarUrl ? (
          <img src={p.avatarUrl} alt="" className="aspect-[3/4] w-full object-cover" />
        ) : (
          <div className="grid aspect-[3/4] w-full place-items-center bg-elevated text-6xl font-semibold text-muted">
            {p.displayName.charAt(0)}
          </div>
        )}
        <div className="space-y-4 px-4 pt-4">
          <div>
            <h1 className="inline-flex items-center gap-1.5 text-2xl font-semibold">
              {p.displayName}
              {p.verified && <VerifiedBadge className="size-5" />}
            </h1>
            <p className="font-mono text-sm text-primary" dir="ltr">
              {p.serialLabel}
            </p>
            {pinned?.body ? <p className="mt-2 text-sm text-muted">{pinned.body}</p> : null}
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {(highlights.data ?? []).map((h) => (
              <span key={h.id} className="flex w-16 shrink-0 flex-col items-center gap-1">
                <span className="grid size-14 place-items-center rounded-full border border-primary px-1 text-center text-[10px] leading-tight">
                  {h.title.slice(0, 8)}
                </span>
              </span>
            ))}
          </div>
          {p.bio ? <p className="text-sm leading-relaxed">{p.bio}</p> : null}
          {!data.isSelf && (
            <>
              <div className="flex gap-2">
                {!friends && (
                  <Button className="flex-1" onClick={() => add.mutate()}>
                    <UserPlus className="size-4" />
                    إضافة
                  </Button>
                )}
                <Link
                  to="/chat/$id"
                  params={{ id }}
                  replace
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm font-medium"
                >
                  <MessageCircle className="size-4" />
                </Link>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => call("audio")}>
                  <Phone className="size-4" />
                </Button>
                <Button className="flex-1" onClick={() => call("video")}>
                  <Video className="size-4" />
                </Button>
              </div>
            </>
          )}
          <ul className="space-y-4">
            {(posts.data ?? []).map((post) => (
              <li key={post.id}>
                <PostCard post={post} myId={me.data?.userId} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </RequireAuth>
  );
}
