import { useEffect, useRef } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, UserMinus, UserPlus, Video } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { MediaComposer } from "@/components/media-composer";
import { MessageBubble } from "@/components/message-bubble";
import { RequireAuth } from "@/components/require-auth";
import { Avatar } from "@/components/ui/avatar";
import { useCallStore } from "@/lib/chat/call-store";
import { addFriend, getProfile, listDm, markViewed, removeFriend, sendDm } from "@/lib/nimb/server";

export const Route = createFileRoute("/chat/$id")({ component: Dm });

function Dm() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["profile", id], queryFn: () => getProfile({ data: id }) });
  const msgs = useQuery({
    queryKey: ["dm", id],
    queryFn: () => listDm({ data: id }),
    refetchInterval: 2500,
  });
  const send = useMutation({
    mutationFn: (input: { body: string; kind: string; media?: string; viewOnce: boolean }) =>
      sendDm({ data: { peerId: id, ...input } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["dm", id] }),
  });
  const endRef = useRef<HTMLDivElement>(null);
  const messages = msgs.data ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const p = profile.data?.profile;
  const state = profile.data?.friendState;
  const friends = state === "friends";

  if (profile.isFetched && !p) {
    return (
      <RequireAuth>
        <div className="min-h-dvh bg-bg" />
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg">
        <header className="flex items-center gap-2 border-b border-border bg-surface px-2 pb-2 pt-[max(0.6rem,env(safe-area-inset-top))]">
          <BackLink to="/messages" />
          {p && (
            <Link to="/person/$id" params={{ id }} replace className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar src={p.avatarUrl} name={p.displayName} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{p.displayName}</span>
                <span className="block font-mono text-[11px] text-muted" dir="ltr">
                  {p.serialLabel}
                </span>
              </span>
            </Link>
          )}
          {p && (
            <>
              <button
                type="button"
                aria-label="صوت"
                className="grid size-11 place-items-center rounded-md text-fg"
                onClick={() =>
                  void useCallStore.getState().startOutgoing(
                    { id: p.userId, name: p.displayName, avatar: p.avatarUrl, conversationId: p.userId },
                    "audio",
                  )
                }
              >
                <Phone className="size-5" />
              </button>
              <button
                type="button"
                aria-label="فيديو"
                className="grid size-11 place-items-center rounded-md text-fg"
                onClick={() =>
                  void useCallStore.getState().startOutgoing(
                    { id: p.userId, name: p.displayName, avatar: p.avatarUrl, conversationId: p.userId },
                    "video",
                  )
                }
              >
                <Video className="size-5" />
              </button>
              <button
                type="button"
                aria-label={friends ? "إلغاء صداقة" : "إضافة"}
                className="grid size-11 place-items-center rounded-md text-primary"
                onClick={() =>
                  void (friends ? removeFriend({ data: id }) : addFriend({ data: id })).then(() => {
                    void qc.invalidateQueries({ queryKey: ["profile", id] });
                    void qc.invalidateQueries({ queryKey: ["threads"] });
                  })
                }
              >
                {friends ? <UserMinus className="size-5" /> : <UserPlus className="size-5" />}
              </button>
            </>
          )}
        </header>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={{
                id: m.id,
                threadId: id,
                sender: m.mine ? "me" : "them",
                kind: m.kind,
                body: m.body,
                media: m.media,
                viewOnce: m.viewOnce,
                viewed: m.viewed,
                createdAt: m.createdAt,
              }}
              mine={m.mine}
              onViewOnce={(mid) => void markViewed({ data: mid })}
            />
          ))}
          <div ref={endRef} />
        </div>
        <MediaComposer
          onSend={({ body, kind, media, viewOnce }) => send.mutate({ body, kind, media, viewOnce })}
        />
      </div>
    </RequireAuth>
  );
}
