/**
 * Signature GiftKart Notification Chime (Web Audio API)
 * Synthesizes a distinctive, pleasant 3-note crystalline gift-bell motif
 * with harmonic shimmer — zero external audio file dependencies.
 */

let sharedAudioCtx: AudioContext | null = null;
let unlockBound = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

export function unlockNotificationAudio(): void {
  if (typeof window === 'undefined' || unlockBound) return;
  unlockBound = true;

  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume();
      }
    } catch {
      // Ignore autoplay restriction errors until next user gesture
    }
  };

  window.addEventListener('pointerdown', unlock, { passive: true, capture: true });
  window.addEventListener('keydown', unlock, { passive: true, capture: true });
  window.addEventListener('touchstart', unlock, { passive: true, capture: true });
}

export function playGiftKartNotificationChime(withVibrate = true): boolean {
  if (typeof window === 'undefined') return false;

  if (withVibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([180, 90, 220]);
    } catch {
      // Ignore vibration failures on unsupported devices
    }
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime + 0.015;

    // Master gain for clean headroom without clipping
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.45, now);
    master.connect(ctx.destination);

    // GiftKart 3-note crystalline bell chord: G5 -> B5 -> D6 + airy G6 sparkle
    const notes = [
      { freq: 783.99, start: 0, duration: 0.28, gain: 0.36, type: 'sine' as OscillatorType },
      { freq: 1567.98, start: 0, duration: 0.16, gain: 0.1, type: 'triangle' as OscillatorType },
      { freq: 987.77, start: 0.11, duration: 0.3, gain: 0.34, type: 'sine' as OscillatorType },
      { freq: 1174.66, start: 0.22, duration: 0.44, gain: 0.38, type: 'sine' as OscillatorType },
      { freq: 1567.98, start: 0.25, duration: 0.48, gain: 0.16, type: 'sine' as OscillatorType },
    ];

    for (const note of notes) {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = note.type;
      osc.frequency.setValueAtTime(note.freq, now + note.start);

      noteGain.gain.setValueAtTime(0.0001, now + note.start);
      noteGain.gain.linearRampToValueAtTime(note.gain, now + note.start + 0.014);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration);

      osc.connect(noteGain);
      noteGain.connect(master);

      osc.start(now + note.start);
      osc.stop(now + note.start + note.duration + 0.02);
    }

    return true;
  } catch {
    return false;
  }
}
