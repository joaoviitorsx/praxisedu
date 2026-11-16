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
