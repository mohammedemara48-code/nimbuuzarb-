import { useState } from "react";
import { Timer } from "lucide-react";
import { formatClock } from "@/lib/nimb/time";
import type { ChatMessage } from "@/lib/nimb/types";
import { cn } from "@/lib/utils";

export function MessageBubble({
  message,
  mine,
  onViewOnce,
}: {
  message: ChatMessage;
  mine: boolean;
  onViewOnce: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const locked = message.viewOnce && message.viewed;

  if (locked) {
    return (
      <div className={cn("flex w-full", mine ? "justify-start" : "justify-end")}>
        <div className="max-w-[80%] rounded-lg border border-border bg-elevated px-3 py-2 text-xs text-muted">
          تم العرض · مرة واحدة
        </div>
      </div>
    );
  }

  const media = message.kind !== "text";
  return (
    <div className={cn("flex w-full", mine ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] overflow-hidden rounded-lg px-3 py-2",
          mine ? "bg-me text-me-fg" : "bg-them text-them-fg",
        )}
      >
        {message.viewOnce && (
          <p className="mb-1 flex items-center gap-1 text-[10px] text-muted">
            <Timer className="size-3" />
            مرة واحدة
          </p>
        )}
        {message.kind === "image" && message.media && (!message.viewOnce || open) && (
          <img src={message.media} alt="" className="mb-1 max-h-56 w-full rounded-md object-cover" />
        )}
        {message.kind === "video" && message.media && (!message.viewOnce || open) && (
          <video src={message.media} controls className="mb-1 max-h-56 w-full rounded-md" />
        )}
        {message.kind === "audio" && (!message.viewOnce || open) && (
          <p className="text-sm">{message.body || "رسالة صوتية"}</p>
        )}
        {message.kind === "text" && <p className="text-sm leading-relaxed">{message.body}</p>}
        {media && message.viewOnce && !open && (
          <button
            type="button"
            className="text-sm font-medium text-primary"
            onClick={() => {
              setOpen(true);
              window.setTimeout(() => onViewOnce(message.id), 2500);
            }}
          >
            اضغط للعرض
          </button>
        )}
        <p className="mt-1 text-[10px] text-subtle">{formatClock(message.createdAt)}</p>
      </div>
    </div>
  );
}
