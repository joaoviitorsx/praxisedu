import { Platform } from 'react-native';

// Safe require for expo-haptics
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch {
  // Graceful fallback
}

// Safe require for expo-audio on native
let createAudioPlayer = null;
let setAudioModeAsync = null;
try {
  const Audio = require('expo-audio');
  createAudioPlayer = Audio.createAudioPlayer;
  setAudioModeAsync = Audio.setAudioModeAsync;
  if (setAudioModeAsync) {
    setAudioModeAsync({
      playsInSilentMode: true,
    }).catch(() => {});
  }
} catch {
  // Graceful fallback if native module is unavailable
}

// Sound asset mapping
const soundAssets = {
  correct: require('../../assets/sounds/correct.wav'),
  wrong: require('../../assets/sounds/wrong.wav'),
  victory: require('../../assets/sounds/victory.wav'),
  click: require('../../assets/sounds/click.wav'),
  start: require('../../assets/sounds/start.wav'),
  open: require('../../assets/sounds/open.wav'),
  tap: require('../../assets/sounds/tap.wav'),
  select: require('../../assets/sounds/select.wav'),
  tab: require('../../assets/sounds/tab.wav'),
  back: require('../../assets/sounds/back.wav'),
  sheet: require('../../assets/sounds/sheet.wav'),
  send: require('../../assets/sounds/send.wav'),
  success: require('../../assets/sounds/success.wav'),
  error: require('../../assets/sounds/error.wav'),
  notify: require('../../assets/sounds/notify.wav'),
};

const players = {};

function getPlayer(name) {
  if (Platform.OS === 'web') return null;
  if (!createAudioPlayer) return null;
  try {
    if (!players[name]) {
      players[name] = createAudioPlayer(soundAssets[name]);
    }
    return players[name];
  } catch {
    return null;
  }
}

let webCtx = null;

// Web Audio API synthesizer for instant zero-latency feedback on Web
function playWebTone(type) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    // One shared context: browsers limit how many can be open at once.
    webCtx = webCtx || new AudioCtx();
    const ctx = webCtx;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    if (type === 'correct') {
      // 2-tone pleasant ascending chime (587Hz -> 880Hz)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880.0, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'wrong') {
      // Low descending bump (220Hz -> 160Hz)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(164.8, now + 0.14);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'victory') {
      // Celebration 4-note arpeggio (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const start = ctx.currentTime + i * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } else if (type === 'start') {
      // Quick rising arpeggio (C5, E5, G5, C6)
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const start = ctx.currentTime + i * 0.055;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } else if (type === 'open') {
      // Soft upward pop
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1500, now + 0.12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (type === 'click') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch {
    // Ignore audio context errors
  }
}

async function playNativeSound(name) {
  try {
    const player = getPlayer(name);
    if (player) {
      if (typeof player.seekTo === 'function') {
        try {
          await player.seekTo(0);
        } catch {}
      }
      player.play();
    }
  } catch {
    // Fallback or ignore
  }
}

export function playCorrectSound() {
  // 1. Play sound
  if (Platform.OS === 'web') {
    playWebTone('correct');
  } else {
    playNativeSound('correct');
  }

  // 2. Trigger haptic
  try {
    if (Haptics?.notificationAsync) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)?.catch?.(() => {});
    }
  } catch {}
}

export function playWrongSound() {
  if (Platform.OS === 'web') {
    playWebTone('wrong');
  } else {
    playNativeSound('wrong');
  }

  try {
    if (Haptics?.notificationAsync) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)?.catch?.(() => {});
    }
  } catch {}
}

export function playVictorySound() {
  if (Platform.OS === 'web') {
    playWebTone('victory');
  } else {
    playNativeSound('victory');
  }

  try {
    if (Haptics?.notificationAsync) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)?.catch?.(() => {});
    }
  } catch {}
}

export function playClickSound() {
  if (Platform.OS === 'web') {
    playWebTone('click');
  } else {
    playNativeSound('click');
  }

  try {
    if (Haptics?.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)?.catch?.(() => {});
    }
  } catch {}
}

function playWithImpact(name, style) {
  if (Platform.OS === 'web') {
    playWebTone(name);
  } else {
    playNativeSound(name);
  }

  try {
    if (Haptics?.impactAsync) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style])?.catch?.(() => {});
    }
  } catch {}
}

// "Jogar"/"Estudar" on a trail stage.
export function playStartSound() {
  playWithImpact('start', 'Light');
}

// Opening a trail/unit.
export function playOpenSound() {
  playWithImpact('open', 'Soft');
}

// Subtle UI sound family (G major, quieter than correct/victory).
// [web notes as [freqFrom, freqTo, offsetSec, durSec], gain, haptic]
const UI_SOUNDS = {
  tap: [[[1175, 1175, 0, 0.05]], 0.04, 'Light'],
  select: [[[784, 784, 0, 0.08], [1175, 1175, 0.035, 0.08]], 0.05, 'selection'],
  tab: [[[988, 988, 0, 0.07]], 0.05, 'selection'],
  back: [[[1175, 784, 0, 0.11]], 0.04, 'Light'],
  sheet: [[[784, 1175, 0, 0.13]], 0.05, 'Soft'],
  send: [[[587, 1568, 0, 0.13]], 0.06, 'Medium'],
  success: [[[784, 784, 0, 0.1], [988, 988, 0.06, 0.1], [1175, 1175, 0.12, 0.15]], 0.06, 'success'],
  error: [[[659, 659, 0, 0.12], [587, 587, 0.07, 0.15]], 0.05, 'warning'],
  notify: [[[1175, 1175, 0, 0.13], [1568, 1568, 0.08, 0.18]], 0.07, 'Medium'],
};

let soundEnabled = true;
export function setSoundEnabled(on) { soundEnabled = !!on; }

const lastPlayed = {};

// Generic subtle interaction sound + matching haptic. Same sound within 80ms is ignored.
export function playUiSound(name) {
  try {
    const def = UI_SOUNDS[name];
    if (!def) return;
    const now = Date.now();
    if (now - (lastPlayed[name] ?? 0) < 80) return;
    lastPlayed[name] = now;
    const [notes, peak, haptic] = def;
    if (soundEnabled) {
      if (Platform.OS === 'web') playWebNotes(notes, peak);
      else playNativeSound(name);
    }
    if (haptic === 'selection') Haptics?.selectionAsync?.()?.catch?.(() => {});
    else if (haptic === 'success' || haptic === 'warning') Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType[haptic === 'success' ? 'Success' : 'Warning'])?.catch?.(() => {});
    else Haptics?.impactAsync?.(Haptics.ImpactFeedbackStyle[haptic])?.catch?.(() => {});
  } catch {}
}

function playWebNotes(notes, peak) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    webCtx = webCtx || new AudioCtx();
    const ctx = webCtx;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    notes.forEach(([f0, f1, off, dur]) => {
      const t = ctx.currentTime + off;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + 0.06);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(peak, t + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
    });
  } catch {}
}
