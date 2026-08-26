/**
 * Call audio: incoming ringtone, outgoing ringback, speaker routing.
 * Web-only approximation of earpiece vs speaker (gain + setSinkId).
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ringSources: Array<OscillatorNode | GainNode> = [];
let ringTimer: ReturnType<typeof setInterval> | null = null;
let speakerOn = true;
let remoteAudio: HTMLAudioElement | null = null;

function ensureCtx() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.connect(ctx.destination);
    applySpeakerGain();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, master: master! };
}

function applySpeakerGain() {
  if (!master || !ctx) return;
  master.gain.setTargetAtTime(speakerOn ? 1 : 0.14, ctx.currentTime, 0.03);
  if (remoteAudio) {
    remoteAudio.volume = speakerOn ? 1 : 0.2;
  }
}

async function applySink() {
  if (!remoteAudio) return;
  const el = remoteAudio as HTMLAudioElement & {
    setSinkId?: (id: string) => Promise<void>;
  };
  if (typeof el.setSinkId !== "function") return;
  try {
    await el.setSinkId(speakerOn ? "default" : "communications");
  } catch {
    /* device missing — keep default output */
  }
}

export function getSpeakerOn() {
  return speakerOn;
}

export function setSpeakerOn(on: boolean) {
  speakerOn = on;
  applySpeakerGain();
  void applySink();
}

function stopOscillators() {
  for (const node of ringSources) {
    try {
      if ("stop" in node) (node as OscillatorNode).stop();
      node.disconnect();
    } catch {
      /* already stopped */
    }
  }
  ringSources = [];
}

export function stopRing() {
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
  stopOscillators();
}

function tone(
  audio: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  gain = 0.18,
) {
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  g.gain.setValueAtTime(gain, start + dur - 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.02);
  ringSources.push(osc, g);
}

function playIncomingBurst() {
  const { ctx: audio, master: dest } = ensureCtx();
  const t = audio.currentTime + 0.01;
  // Dual-tone telephone ring — clearly a call, not a UI blip.
  tone(audio, dest, 440, t, 0.42, 0.16);
  tone(audio, dest, 480, t, 0.42, 0.14);
  tone(audio, dest, 440, t + 0.52, 0.42, 0.16);
  tone(audio, dest, 480, t + 0.52, 0.42, 0.14);
}

function playOutgoingBurst() {
  const { ctx: audio, master: dest } = ensureCtx();
  const t = audio.currentTime + 0.01;
  // Ringback (busy-waiting) — single pair of beeps.
  tone(audio, dest, 425, t, 0.38, 0.14);
  tone(audio, dest, 425, t + 0.5, 0.38, 0.14);
}

export function startIncomingRing() {
  stopRing();
  ensureCtx();
  playIncomingBurst();
  ringTimer = setInterval(playIncomingBurst, 2200);
  try {
    navigator.vibrate?.([280, 120, 280, 500]);
  } catch {
    /* ignore */
  }
}

export function startOutgoingRing() {
  stopRing();
  ensureCtx();
  playOutgoingBurst();
  ringTimer = setInterval(playOutgoingBurst, 2000);
}

export function attachRemoteAudio(stream: MediaStream) {
  stopRing();
  if (!remoteAudio) {
    remoteAudio = new Audio();
    remoteAudio.autoplay = true;
    remoteAudio.setAttribute("playsinline", "true");
  }
  remoteAudio.srcObject = stream;
  remoteAudio.volume = speakerOn ? 1 : 0.2;
  void remoteAudio.play().catch(() => {});
  void applySink();
}

export function disposeCallAudio() {
  stopRing();
  if (remoteAudio) {
    remoteAudio.pause();
    remoteAudio.srcObject = null;
    remoteAudio = null;
  }
}
