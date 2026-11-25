// Dapur Kilat — sound effects, synthesized with WebAudio only.
// No audio files, no network requests: every sound is generated here.

let audioContext = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function context() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(frequency, duration, type, volume, when = 0) {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  const start = ctx.currentTime + when;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function noiseBurst(duration, volume, filterFrequency) {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFrequency;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

// Calm warung ambience: a soft pentatonic pluck every beat or so, like a
// gamelan lullaby, plus a very gentle chatter murmur — never an alarm.
// It starts only after the first click or key, so the page stays silent
// until the player chooses to play. Mute (M) silences it.
let ambienceTimer = null;
const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
let ambienceStep = 0;

export function startAmbience() {
  if (ambienceTimer) return;
  ambienceTimer = setInterval(() => {
    if (muted) return;
    ambienceStep += 1;
    // A slow, wandering melody: mostly stepwise, sometimes a rest.
    const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
    tone(note, 0.9, 'sine', 0.035);
    if (ambienceStep % 3 === 0) tone(note / 2, 1.4, 'sine', 0.02);
    if (ambienceStep % 4 === 0) noiseBurst(0.5, 0.012, 500); // soft chatter
  }, 900);
}

export const sounds = {
  click() { tone(660, 0.07, 'triangle', 0.12); },
  chop() { noiseBurst(0.08, 0.25, 1800); tone(180, 0.06, 'square', 0.08); },
  sizzle() { noiseBurst(0.35, 0.12, 5200); },
  ready() { tone(880, 0.1, 'sine', 0.14); tone(1174, 0.12, 'sine', 0.12, 0.09); },
  place() { tone(520, 0.08, 'triangle', 0.14); },
  serve() { tone(523, 0.1, 'sine', 0.15); tone(659, 0.1, 'sine', 0.15, 0.09); tone(784, 0.18, 'sine', 0.16, 0.18); },
  wrong() { tone(220, 0.16, 'sawtooth', 0.08); },
  tick() { tone(980, 0.05, 'square', 0.06); },
  combo(combo) { tone(600 + combo * 60, 0.09, 'sine', 0.13); },
  dayEnd() { tone(523, 0.14, 'sine', 0.15); tone(659, 0.14, 'sine', 0.15, 0.12); tone(784, 0.14, 'sine', 0.15, 0.24); tone(1046, 0.3, 'sine', 0.16, 0.36); },
};
