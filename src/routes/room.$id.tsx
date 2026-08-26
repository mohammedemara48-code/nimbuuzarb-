import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BackLink } from "@/components/back-link";
import { RequireAuth } from "@/components/require-auth";
import { Avatar } from "@/components/ui/avatar";
import { listRoom, sendRoom } from "@/lib/nimb/server";
import { formatClock } from "@/lib/nimb/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/room/$id")({ component: RoomThread });

function RoomThread() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["room", id],
    queryFn: () => listRoom({ data: id }),
    refetchInterval: 2500,
  });
  const send = useMutation({
    mutationFn: (body: string) => sendRoom({ data: { roomId: id, body } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["room", id] }),
  });
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const messages = q.data?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <RequireAuth>
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-bg">
        <header className="flex items-center gap-2 border-b border-border bg-surface px-2 pb-2 pt-[max(0.6rem,env(safe-area-inset-top))]">
          <BackLink to="/rooms" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{q.data?.room?.name ?? "غرفة"}</p>
          </div>
        </header>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex w-full gap-2", m.mine ? "justify-start" : "justify-end")}>
              {!m.mine && (
                <Avatar src={m.author?.avatarUrl} name={m.author?.displayName ?? "؟"} size="sm" />
              )}
              <div className={cn("max-w-[75%] rounded-lg px-3 py-2", m.mine ? "bg-me" : "bg-surface")}>
                {!m.mine && (
                  <p className="mb-0.5 text-[11px] font-medium text-primary">{m.author?.displayName}</p>
                )}
                <p className="text-sm leading-relaxed">{m.body}</p>
                <p className="mt-1 text-[10px] text-subtle">{formatClock(m.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form
          className="flex items-center gap-2 border-t border-border bg-surface px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault();
            const body = draft.trim();
            if (!body) return;
            setDraft("");
            send.mutate(body);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="h-11 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 text-sm"
          />
          <button
            type="submit"
            className="h-11 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg disabled:opacity-40"
            disabled={!draft.trim()}
          >
            إرسال
          </button>
        </form>
      </div>
    </RequireAuth>
  );
}
