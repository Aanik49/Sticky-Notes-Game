import { ThemeId } from './types';

export type MusicTrack = 'home' | 'gameplay';

// Warm major pentatonic frequencies for rising peel combos (C5 to E6)
const COMBO_SCALE = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  1046.5, // C6
  1174.66,// D6
  1318.51,// E6
];

// Cozy Home Screen progression: Fmaj7 -> Dm7 -> Cmaj7 -> G6 (warm felt Rhodes + kalimba)
const HOME_CHORDS: number[][] = [
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [146.83, 220.0, 261.63, 329.63], // Dm9
  [130.81, 196.0, 246.94, 329.63], // Cmaj7
  [196.0, 246.94, 293.66, 329.63], // G6
];

const HOME_MELODY: (number | null)[] = [
  523.25, null, 659.25, 587.33, null, 523.25, 440.0, null,
  587.33, null, 659.25, 523.25, null, 440.0, 392.0, null,
  523.25, null, 659.25, 783.99, null, 659.25, 587.33, null,
  587.33, 523.25, 440.0, null, 392.0, null, 440.0, null,
];

// Focused Gameplay loop: Cmaj7 -> Am7 -> Fmaj7 -> G6 (gentle marimba + soft bass groove)
const GAME_CHORDS: number[][] = [
  [130.81, 196.0, 246.94, 329.63], // Cmaj7
  [110.0, 164.81, 196.0, 261.63],  // Am7
  [174.61, 220.0, 261.63, 329.63], // Fmaj7
  [196.0, 246.94, 293.66, 329.63], // G6
];

const GAME_BASS: (number | null)[] = [
  130.81, null, null, 196.0, null, null, 130.81, null,
  110.0, null, null, 164.81, null, null, 110.0, null,
  174.61, null, null, 130.81, null, null, 174.61, null,
  196.0, null, null, 146.83, null, null, 196.0, null,
];

const GAME_MARIMBA: (number | null)[] = [
  523.25, null, 659.25, null, 783.99, 659.25, 523.25, null,
  440.0, null, 523.25, null, 659.25, 523.25, 440.0, null,
  523.25, null, 587.33, null, 659.25, null, 523.25, 587.33,
  587.33, null, 659.25, 587.33, 523.25, null, 392.0, null,
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicBus: GainNode | null = null;
  private musicTimer: number | null = null;
  private stepIndex = 0;
  private currentTrack: MusicTrack = 'home';
  private isMusicRunning = false;

  public muted = false;
  public musicMuted = false;

  private initContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.musicBus && this.ctx) {
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicMuted ? 0 : 0.72;
      this.musicBus.connect(this.ctx.destination);
    }
    if (!this.noiseBuffer && this.ctx) {
      const len = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const ch = buffer.getChannelData(0);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.95 * b2 + white * 0.048;
        ch[i] = (b0 + b1 + b2 + white * 0.18) * 1.4;
      }
      this.noiseBuffer = buffer;
    }
    return this.ctx;
  }

  private ensureSfxContext(): AudioContext | null {
    if (this.muted) return null;
    return this.initContext();
  }

  /* =========================================================================
     PROCEDURAL BACKGROUND MUSIC ENGINE (HOME & GAMEPLAY TRACKS)
     ========================================================================= */

  public setMusicTrack(track: MusicTrack): void {
    if (this.currentTrack === track) return;
    this.currentTrack = track;
    this.stepIndex = 0;
    if (this.isMusicRunning && !this.musicMuted) {
      this.restartScheduler();
    }
  }

  public setMusicMuted(muted: boolean): void {
    this.musicMuted = muted;
    if (this.musicBus && this.ctx) {
      const now = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setTargetAtTime(muted ? 0.0001 : 0.72, now, 0.08);
    }
    if (muted) {
      this.stopMusicLoop();
    } else {
      this.startMusic();
    }
  }

  /**
   * Starts or unlocks the background music loop (safe to call on first user interaction).
   */
  public startMusic(): void {
    if (this.musicMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;
    if (this.musicBus) {
      const now = ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setTargetAtTime(0.72, now, 0.12);
    }
    if (this.isMusicRunning) return;
    this.isMusicRunning = true;
    this.restartScheduler();
  }

  public stopMusicLoop(): void {
    this.isMusicRunning = false;
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public setTabVisible(visible: boolean): void {
    if (!visible) {
      if (this.musicTimer !== null) {
        window.clearInterval(this.musicTimer);
        this.musicTimer = null;
      }
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else if (!this.musicMuted && this.isMusicRunning) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.restartScheduler();
    }
  }

  private restartScheduler(): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    // Eighth-note step interval: ~350ms on Home (relaxed 85 BPM), ~305ms on Gameplay (light 98 BPM)
    const stepMs = this.currentTrack === 'home' ? 355 : 305;
    this.playMusicStep();
    this.musicTimer = window.setInterval(() => {
      if (this.musicMuted || !this.isMusicRunning) {
        this.stopMusicLoop();
        return;
      }
      this.playMusicStep();
    }, stepMs);
  }

  private playMusicStep(): void {
    if (!this.ctx || !this.musicBus || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime + 0.02;
    const step = this.stepIndex % 32;
    const bar = Math.floor(step / 8);
    const beatInBar = step % 8;

    if (this.currentTrack === 'home') {
      // Warm felt Rhodes chord every bar (step 0, 8, 16, 24)
      if (beatInBar === 0) {
        const chord = HOME_CHORDS[bar];
        chord.forEach((freq, i) => {
          this.scheduleWarmPad(freq, now + i * 0.032, 2.75, 0.034);
        });
      }
      // Gentle kalimba shimmer melody
      const note = HOME_MELODY[step];
      if (note) {
        this.scheduleKalimba(note, now, 0.55, 0.042);
      }
    } else {
      // Gameplay: soft Rhodes bed on bar downbeat
      if (beatInBar === 0) {
        const chord = GAME_CHORDS[bar];
        chord.forEach((freq, i) => {
          this.scheduleWarmPad(freq, now + i * 0.022, 2.3, 0.024);
        });
      }
      // Gentle warm bass pulse
      const bass = GAME_BASS[step];
      if (bass) {
        this.scheduleBass(bass, now, 0.42, 0.055);
      }
      // Playful wooden marimba ostinato
      const mel = GAME_MARIMBA[step];
      if (mel) {
        this.scheduleMarimba(mel, now, 0.28, 0.038);
      }
    }

    this.stepIndex = (this.stepIndex + 1) % 32;
  }

  private scheduleWarmPad(freq: number, start: number, dur: number, peak: number): void {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(920, start);
    filter.frequency.exponentialRampToValueAtTime(480, start + dur);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);
    osc.start(start);
    osc.stop(start + dur + 0.04);
  }

  private scheduleKalimba(freq: number, start: number, dur: number, peak: number): void {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const harmonic = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(freq * 2, start);
    harmGain.gain.value = 0.16;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(gain);
    harmonic.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(this.musicBus);

    osc.start(start);
    harmonic.start(start);
    osc.stop(start + dur + 0.02);
    harmonic.stop(start + dur + 0.02);
  }

  private scheduleMarimba(freq: number, start: number, dur: number, peak: number): void {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  private scheduleBass(freq: number, start: number, dur: number, peak: number): void {
    if (!this.ctx || !this.musicBus) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicBus);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  }

  /* =========================================================================
     TACTILE FOLEY SOUND EFFECTS
     ========================================================================= */

  public playPeel(combo = 1, theme: ThemeId = 'fridge', isDoubleLayer = false): void {
    const ctx = this.ensureSfxContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const peelDur = 0.21;

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.Q.value =
      theme === 'fridge' || theme === 'gallery'
        ? 3.2
        : theme === 'drafting' || theme === 'atelier'
          ? 2.8
          : 2.1;

    const baseStart =
      theme === 'cork'
        ? 680
        : theme === 'midnight'
          ? 760
          : theme === 'atelier'
            ? 840
            : theme === 'gallery'
              ? 1020
              : 940;
    const baseEnd = theme === 'cork' ? 2700 : theme === 'atelier' ? 3300 : 3700;
    bandpass.frequency.setValueAtTime(baseStart, now);
    bandpass.frequency.exponentialRampToValueAtTime(baseEnd, now + peelDur);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.32, now + 0.025);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + peelDur);

    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + peelDur + 0.02);

    const flickOsc = ctx.createOscillator();
    const flickGain = ctx.createGain();
    flickOsc.type = 'triangle';
    flickOsc.frequency.setValueAtTime(isDoubleLayer ? 420 : 320, now + 0.03);
    flickOsc.frequency.exponentialRampToValueAtTime(isDoubleLayer ? 960 : 720, now + 0.11);
    flickGain.gain.setValueAtTime(0.001, now + 0.03);
    flickGain.gain.linearRampToValueAtTime(0.09, now + 0.045);
    flickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    flickOsc.connect(flickGain);
    flickGain.connect(ctx.destination);
    flickOsc.start(now + 0.03);
    flickOsc.stop(now + 0.13);

    const noteIdx = Math.min(COMBO_SCALE.length - 1, Math.max(0, combo - 1));
    const freq = COMBO_SCALE[noteIdx];
    const tone = ctx.createOscillator();
    const toneGain = ctx.createGain();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(freq, now + 0.02);

    toneGain.gain.setValueAtTime(0.001, now + 0.02);
    toneGain.gain.linearRampToValueAtTime(combo > 1 ? 0.14 : 0.085, now + 0.035);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    tone.connect(toneGain);
    toneGain.connect(ctx.destination);
    tone.start(now + 0.02);
    tone.stop(now + 0.3);
  }

  public playBump(theme: ThemeId = 'fridge'): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const startFreq =
      theme === 'fridge' || theme === 'gallery' || theme === 'lab-tape' || theme === 'lab-master'
        ? 185
        : theme === 'cork' || theme === 'atelier' || theme === 'lab-pivot' || theme === 'lab-matrix'
          ? 142
          : 160;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.13);

    gain.gain.setValueAtTime(0.26, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    if (this.noiseBuffer) {
      const n = ctx.createBufferSource();
      n.buffer = this.noiseBuffer;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(650, now);
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.12, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      n.connect(lp);
      lp.connect(ng);
      ng.connect(ctx.destination);
      n.start(now);
      n.stop(now + 0.08);
    }
  }

  /** Crisp ascending two-note snap when a Key Note unlocks a Taped Note */
  public playUnlockTape(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [659.25, 987.77].forEach((freq, i) => {
      const t = now + i * 0.055;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.14, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  /** Subtle mechanical watch-click when Pivot Notes rotate 90° clockwise */
  public playPivotTick(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const now = ctx.currentTime + 0.04;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1180, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.035);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  public playUndo(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx || !this.noiseBuffer) return;

    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 2.0;
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.17);
  }

  public playHint(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, idx) => {
      const t = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.34);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playClick(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.045);
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  /**
   * Joyful, unmistakable positive win fanfare (rising major arpeggio + sparkling finish chord).
   */
  public playVictory(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;

    const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5 E5 G5 C6 E6
    arpeggio.forEach((freq, idx) => {
      const t = ctx.currentTime + idx * 0.072;
      const osc = ctx.createOscillator();
      const sparkle = ctx.createOscillator();
      const gain = ctx.createGain();
      const sparkleGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(freq * 2, t);
      sparkleGain.gain.value = 0.2;

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(gain);
      sparkle.connect(sparkleGain);
      sparkleGain.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      sparkle.start(t);
      osc.stop(t + 0.68);
      sparkle.stop(t + 0.68);
    });

    // Warm celebratory final C major resolution chord
    const chordStart = ctx.currentTime + 0.34;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, chordStart);
      g.gain.setValueAtTime(0.001, chordStart);
      g.gain.linearRampToValueAtTime(0.085, chordStart + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, chordStart + 0.95);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(chordStart);
      osc.stop(chordStart + 0.98);
    });
  }

  /**
   * Unmistakable negative fail cadence (chromatic descending wah-wah + soft low thud).
   */
  public playFail(): void {
    const ctx = this.ensureSfxContext();
    if (!ctx) return;

    const steps = [
      { freq: 392.0, endFreq: 376.0, delay: 0.0, dur: 0.22 },   // G4
      { freq: 369.99, endFreq: 352.0, delay: 0.19, dur: 0.22 }, // F#4
      { freq: 349.23, endFreq: 332.0, delay: 0.38, dur: 0.24 }, // F4
      { freq: 311.13, endFreq: 261.63, delay: 0.58, dur: 0.55 },// Eb4 -> C4 droop
    ];

    steps.forEach(({ freq, endFreq, delay, dur }) => {
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(860, t);
      filter.frequency.exponentialRampToValueAtTime(340, t + dur);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    });
  }
}

export const sound = new SoundEngine();
