// Sound + voice notifications using Web Audio + Speech Synthesis
// All synthesized — no audio assets needed.

let _ctx: AudioContext | null = null;
function ctx() {
  if (typeof window === "undefined") return null;
  if (!_ctx) _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  // browsers suspend audio until a user gesture — try to resume on each call
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

/** Call once after a user gesture to unlock audio + speech on iOS/Safari. */
export function unlockAudio() {
  const c = ctx();
  if (!c) return;
  // play a 1ms silent buffer to unlock
  const buf = c.createBuffer(1, 1, 22050);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.start(0);
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.18, when = 0) {
  const c = ctx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.connect(g);
  g.connect(c.destination);
  const t = c.currentTime + when;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t);
  o.stop(t + dur);
}

export type SoundKind = "meeting" | "deadline" | "task";

export function playSound(kind: SoundKind) {
  switch (kind) {
    case "meeting":
      tone(523.25, 0.35, "sine", 0.15, 0);
      tone(659.25, 0.35, "sine", 0.15, 0.18);
      tone(783.99, 0.5, "sine", 0.18, 0.36);
      break;
    case "deadline":
      tone(880, 0.18, "square", 0.12, 0);
      tone(880, 0.18, "square", 0.12, 0.22);
      tone(1108.73, 0.32, "square", 0.14, 0.44);
      break;
    case "task":
      tone(660, 0.12, "triangle", 0.14, 0);
      tone(990, 0.18, "triangle", 0.12, 0.08);
      break;
  }
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1;
  u.pitch = 1;
  u.volume = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/** Request browser notification permission (call after a user gesture). */
export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "default") {
    try { return await Notification.requestPermission(); } catch { return "denied"; }
  }
  return Notification.permission;
}

export function pushNative(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/favicon.ico" }); } catch {}
  }
}
