import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallStore } from "@/lib/chat/call-store";
import { recordCallLog } from "@/lib/nimb/server";
import { cn } from "@/lib/utils";

function formatElapsed(startedAt: number | null) {
  if (!startedAt) return "00:00";
  const sec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function LocalVideo({
  stream,
  cameraOff,
}: {
  stream: MediaStream | null;
  cameraOff: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => {});
  }, [stream]);

  return (
    <div className="pointer-events-none absolute bottom-[7.5rem] start-4 z-20 aspect-[3/4] w-[min(52vw,13rem)] overflow-hidden rounded-xl border border-white/25 bg-ink shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
      <video
        ref={ref}
        autoPlay
        muted
        playsInline
        className={cn(
          "h-full w-full bg-ink object-contain object-center",
          (!stream || cameraOff) && "opacity-0",
        )}
        style={{ transform: "none" }}
      />
      {(!stream || cameraOff) && (
        <div className="absolute inset-0 grid place-items-center text-xs text-ink-muted">
          الكاميرا مغلقة
        </div>
      )}
    </div>
  );
}

function RemoteStage({
  avatar,
  name,
  kind,
  status,
}: {
  avatar: string;
  name: string;
  kind: "video" | "audio";
  status: "outgoing" | "incoming" | "active";
}) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-ink">
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className={cn(
            "max-h-full max-w-full bg-ink object-contain object-center",
            kind === "audio" || status !== "active" ? "h-[min(72vh,34rem)] w-auto rounded-full" : "h-full w-full",
          )}
        />
      ) : (
        <div className="grid size-40 place-items-center rounded-full bg-elevated text-4xl font-semibold text-ink-fg">
          {name.charAt(0)}
        </div>
      )}
      {status !== "active" && (
        <div className="absolute inset-0 bg-ink/45" />
      )}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-ink/90 to-transparent" />
      {status !== "active" && (
        <div className="absolute top-[18%] flex flex-col items-center gap-3 text-center">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              className="size-28 rounded-full object-cover object-center ring-2 ring-white/20"
            />
          ) : (
            <span className="grid size-28 place-items-center rounded-full bg-elevated text-3xl font-semibold text-ink-fg ring-2 ring-white/20">
              {name.charAt(0)}
            </span>
          )}
          <h2 className="text-2xl font-semibold text-ink-fg">{name}</h2>
          <p className="text-sm text-ink-muted">
            {status === "outgoing"
              ? kind === "video"
                ? "جاري الاتصال بالفيديو…"
                : "جاري الاتصال…"
              : kind === "video"
                ? "مكالمة فيديو واردة"
                : "مكالمة صوتية واردة"}
          </p>
        </div>
      )}
    </div>
  );
}

function RoundControl({
  label,
  onClick,
  tone = "neutral",
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: "neutral" | "danger" | "call" | "on";
  children: ReactNode;
}) {
  const toneClass =
    tone === "danger"
      ? "bg-danger text-danger-fg"
      : tone === "call"
        ? "bg-call text-call-fg"
        : tone === "on"
          ? "bg-primary text-primary-fg"
          : "bg-white/12 text-ink-fg";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1.5"
    >
      <span className={cn("grid size-14 place-items-center rounded-full", toneClass)}>
        {children}
      </span>
      <span className="text-[11px] text-ink-muted">{label}</span>
    </button>
  );
}

export function CallOverlay() {
  const navigate = useNavigate();
  const status = useCallStore((s) => s.status);
  const kind = useCallStore((s) => s.kind);
  const contact = useCallStore((s) => s.contact);
  const speakerOn = useCallStore((s) => s.speakerOn);
  const muted = useCallStore((s) => s.muted);
  const cameraOff = useCallStore((s) => s.cameraOff);
  const startedAt = useCallStore((s) => s.startedAt);
  const localStream = useCallStore((s) => s.localStream);
  const cameraError = useCallStore((s) => s.cameraError);

  const lastPeer = useRef<string | null>(null);
  const prevStatus = useRef(status);
  if (contact?.id) lastPeer.current = contact.id;

  useEffect(() => {
    const prev = prevStatus.current;
    prevStatus.current = status;
    if (prev !== "idle" && status === "idle" && lastPeer.current) {
      const id = lastPeer.current;
      void navigate({ to: "/chat/$id", params: { id }, replace: true });
    }
  }, [status, navigate]);

  if (status === "idle" || !contact) return null;

  const end = () => {
    const peerId = contact.id;
    const k = kind;
    const result = useCallStore.getState().hangup();
    if (result && peerId) {
      void recordCallLog({
        data: {
          peerId,
          kind: k,
          direction: result.direction,
          outcome: result.outcome,
          durationSec: result.durationSec,
        },
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink text-ink-fg"
      role="dialog"
      aria-modal="true"
      aria-label="مكالمة"
    >
      <RemoteStage avatar={contact.avatar} name={contact.name} kind={kind} status={status} />

      {kind === "video" && status !== "incoming" && (
        <LocalVideo stream={localStream} cameraOff={cameraOff} />
      )}

      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <div>
          {status === "active" && (
            <>
              <p className="text-base font-medium text-ink-fg">{contact.name}</p>
              <p className="tabular-nums text-xs text-ink-muted">
                <Elapsed startedAt={startedAt} />
              </p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={() => useCallStore.getState().toggleSpeaker()}
          className={cn(
            "grid size-11 place-items-center rounded-full",
            speakerOn ? "bg-primary text-primary-fg" : "bg-white/12 text-ink-fg",
          )}
          aria-pressed={speakerOn}
          aria-label={speakerOn ? "مكبر الصوت يعمل" : "مكبر الصوت مغلق"}
        >
          {speakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
        </button>
      </div>

      {cameraError && (
        <p className="absolute inset-x-4 top-24 rounded-md bg-ink/70 px-3 py-2 text-center text-xs text-ink-muted">
          {cameraError}
        </p>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-5 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        {status === "incoming" ? (
          <>
            <RoundControl
              label="مكبر"
              tone={speakerOn ? "on" : "neutral"}
              onClick={() => useCallStore.getState().toggleSpeaker()}
            >
              {speakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </RoundControl>
            <RoundControl
              label="رفض"
              tone="danger"
              onClick={() => {
                const k = kind;
                useCallStore.getState().decline();
                void recordCallLog({
                  data: {
                    peerId: contact.id,
                    kind: k,
                    direction: "in",
                    outcome: "declined",
                    durationSec: 0,
                  },
                });
              }}
            >
              <PhoneOff className="size-6" />
            </RoundControl>
            <RoundControl
              label="رد"
              tone="call"
              onClick={() => void useCallStore.getState().accept()}
            >
              {kind === "video" ? <Video className="size-6" /> : <Phone className="size-6" />}
            </RoundControl>
          </>
        ) : (
          <>
            <RoundControl
              label={muted ? "الميكروفون" : "كتم"}
              tone={muted ? "on" : "neutral"}
              onClick={() => useCallStore.getState().toggleMute()}
            >
              {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </RoundControl>
            {kind === "video" && (
              <RoundControl
                label={cameraOff ? "تشغيل" : "كاميرا"}
                tone={cameraOff ? "on" : "neutral"}
                onClick={() => useCallStore.getState().toggleCamera()}
              >
                {cameraOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
              </RoundControl>
            )}
            <RoundControl
              label="مكبر الصوت"
              tone={speakerOn ? "on" : "neutral"}
              onClick={() => useCallStore.getState().toggleSpeaker()}
            >
              {speakerOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
            </RoundControl>
            <RoundControl label="إنهاء" tone="danger" onClick={end}>
              <PhoneOff className="size-6" />
            </RoundControl>
          </>
        )}
      </div>
    </div>
  );
}

function Elapsed({ startedAt }: { startedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [startedAt]);
  return <>{formatElapsed(startedAt ?? now)}</>;
}
