import { useRef, useState } from "react";
import { Image, Mic, Send, Timer, Video } from "lucide-react";
import { readAsDataUrl } from "@/lib/nimb/files";
import type { ChatKind } from "@/lib/nimb/types";
import { cn } from "@/lib/utils";

export function MediaComposer({
  onSend,
}: {
  onSend: (input: { body: string; kind: ChatKind; media?: string; viewOnce: boolean }) => void;
}) {
  const [draft, setDraft] = useState("");
  const [viewOnce, setViewOnce] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const sendText = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    onSend({ body, kind: "text", viewOnce: false });
  };

  const sendFile = async (file: File | undefined, kind: ChatKind) => {
    if (!file) return;
    const media = await readAsDataUrl(file);
    onSend({
      body: kind === "image" ? "صورة" : kind === "video" ? "فيديو" : "صوت",
      kind,
      media,
      viewOnce,
    });
    setViewOnce(false);
  };

  return (
    <div className="border-t border-border bg-surface px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
      <div className="mb-2 flex gap-2">
        <button
          type="button"
          onClick={() => setViewOnce((v) => !v)}
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium",
            viewOnce ? "bg-primary text-primary-fg" : "bg-elevated text-muted",
          )}
        >
          <Timer className="size-3.5" />
          مرة واحدة
        </button>
      </div>
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          sendText();
        }}
      >
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void sendFile(e.target.files?.[0], "image")}
        />
        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => void sendFile(e.target.files?.[0], "video")}
        />
        <button
          type="button"
          aria-label="صورة"
          className="grid size-11 place-items-center rounded-md text-muted hover:bg-elevated"
          onClick={() => imageRef.current?.click()}
        >
          <Image className="size-5" />
        </button>
        <button
          type="button"
          aria-label="فيديو"
          className="grid size-11 place-items-center rounded-md text-muted hover:bg-elevated"
          onClick={() => videoRef.current?.click()}
        >
          <Video className="size-5" />
        </button>
        <button
          type="button"
          aria-label="صوت"
          className="grid size-11 place-items-center rounded-md text-muted hover:bg-elevated"
          onClick={() =>
            onSend({ body: "رسالة صوتية · 0:04", kind: "audio", viewOnce, media: undefined })
          }
        >
          <Mic className="size-5" />
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-11 min-w-0 flex-1 rounded-md border border-border bg-bg px-3 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        />
        <button
          type="submit"
          aria-label="إرسال"
          disabled={!draft.trim()}
          className="grid size-11 place-items-center rounded-md bg-primary text-primary-fg disabled:opacity-40"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
