import { create } from "zustand";
import { openCallMedia, stopStream } from "./media";
import {
  disposeCallAudio,
  setSpeakerOn,
  startIncomingRing,
  startOutgoingRing,
  stopRing,
} from "./ringtone";

export type CallKind = "video" | "audio";
export type CallStatus = "idle" | "outgoing" | "incoming" | "active";

export type CallContact = {
  id: string;
  name: string;
  avatar: string;
  conversationId: string;
};

type CallState = {
  status: CallStatus;
  kind: CallKind;
  contact: CallContact | null;
  speakerOn: boolean;
  muted: boolean;
  cameraOff: boolean;
  startedAt: number | null;
  localStream: MediaStream | null;
  cameraError: string | null;
  startOutgoing: (contact: CallContact, kind: CallKind) => Promise<void>;
  startIncoming: (contact: CallContact, kind: CallKind) => void;
  accept: () => Promise<void>;
  decline: () => void;
  hangup: () => { durationSec: number; outcome: "answered" | "declined" | "missed"; direction: "in" | "out" } | null;
  toggleSpeaker: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
};

let answerTimer: ReturnType<typeof setTimeout> | null = null;
let direction: "in" | "out" = "out";

function clearAnswerTimer() {
  if (answerTimer) {
    clearTimeout(answerTimer);
    answerTimer = null;
  }
}

export const useCallStore = create<CallState>((set, get) => ({
  status: "idle",
  kind: "video",
  contact: null,
  speakerOn: true,
  muted: false,
  cameraOff: false,
  startedAt: null,
  localStream: null,
  cameraError: null,

  async startOutgoing(contact, kind) {
    clearAnswerTimer();
    const prev = get().localStream;
    stopStream(prev);
    disposeCallAudio();
    direction = "out";
    const speakerOn = kind === "video";
    setSpeakerOn(speakerOn);
    set({
      status: "outgoing",
      kind,
      contact,
      speakerOn,
      muted: false,
      cameraOff: kind === "audio",
      startedAt: null,
      cameraError: null,
      localStream: null,
    });
    startOutgoingRing();
    try {
      const stream = await openCallMedia(kind);
      set({ localStream: stream });
    } catch {
      set({ cameraError: "تعذر فتح الكاميرا أو الميكروفون." });
    }
    answerTimer = setTimeout(() => {
      get().hangup();
    }, 20_000);
  },

  startIncoming(contact, kind) {
    clearAnswerTimer();
    const prev = get().localStream;
    stopStream(prev);
    disposeCallAudio();
    direction = "in";
    const speakerOn = true;
    setSpeakerOn(speakerOn);
    set({
      status: "incoming",
      kind,
      contact,
      speakerOn,
      muted: false,
      cameraOff: kind === "audio",
      startedAt: null,
      cameraError: null,
      localStream: null,
    });
    startIncomingRing();
  },

  async accept() {
    clearAnswerTimer();
    const { kind } = get();
    stopRing();
    try {
      const stream = await openCallMedia(kind);
      set({ localStream: stream, status: "active", startedAt: Date.now(), cameraError: null });
    } catch {
      set({
        status: "active",
        startedAt: Date.now(),
        cameraError: "تعذر فتح الكاميرا أو الميكروفون.",
      });
    }
  },

  decline() {
    clearAnswerTimer();
    stopStream(get().localStream);
    disposeCallAudio();
    set({
      status: "idle",
      contact: null,
      localStream: null,
      startedAt: null,
      cameraError: null,
    });
  },

  hangup() {
    clearAnswerTimer();
    const { status, startedAt } = get();
    if (status === "idle") return null;
    const outcome =
      status === "active" ? "answered" : status === "incoming" ? "declined" : "missed";
    const durationSec =
      status === "active" && startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0;
    const dir = direction;
    stopStream(get().localStream);
    disposeCallAudio();
    set({
      status: "idle",
      contact: null,
      localStream: null,
      startedAt: null,
      cameraError: null,
    });
    return { durationSec, outcome, direction: dir };
  },

  toggleSpeaker() {
    const next = !get().speakerOn;
    setSpeakerOn(next);
    set({ speakerOn: next });
  },

  toggleMute() {
    const { localStream, muted } = get();
    const next = !muted;
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !next;
    });
    set({ muted: next });
  },

  toggleCamera() {
    const { localStream, cameraOff, kind } = get();
    if (kind !== "video") return;
    const next = !cameraOff;
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !next;
    });
    set({ cameraOff: next });
  },
}));
