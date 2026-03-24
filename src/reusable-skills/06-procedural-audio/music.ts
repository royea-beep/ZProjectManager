'use client';

// ═══════════════════════════════════════
// 9Soccer — Background Music System
// Procedural music via Web Audio API
// No external audio files required
// ═══════════════════════════════════════

export type MusicTheme = 'menu' | 'game' | 'battle' | 'victory' | 'tournament' | 'none';

const STORAGE_KEYS = {
  musicEnabled: 'musicEnabled',
  masterVolume: 'masterVolume',
  sfxEnabled: 'sfxEnabled',
} as const;

class MusicSystem {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private masterGain: GainNode | null = null;
  private musicVolume = 0.15;
  private nodes: OscillatorNode[] = [];
  private sources: AudioBufferSourceNode[] = [];
  private intervalIds: ReturnType<typeof setInterval>[] = [];
  private timeoutIds: ReturnType<typeof setTimeout>[] = [];
  private currentTheme: MusicTheme = 'none';
  private _enabled = false; // default OFF — user must opt-in
  private userInteracted = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEYS.musicEnabled);
      this._enabled = stored === 'true';
      const vol = localStorage.getItem(STORAGE_KEYS.masterVolume);
      if (vol !== null) this.musicVolume = parseFloat(vol) / 100 * 0.15;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  private ensureResumed(): boolean {
    const ctx = this.getContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return true;
  }

  /** Must call after user gesture to satisfy browser autoplay policy */
  handleUserInteraction(): void {
    if (this.userInteracted) return;
    this.userInteracted = true;
    this.ensureResumed();
  }

  get enabled(): boolean { return this._enabled; }
  get playing(): boolean { return this.isPlaying; }
  get theme(): MusicTheme { return this.currentTheme; }

  setEnabled(val: boolean): void {
    this._enabled = val;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.musicEnabled, String(val));
    }
    if (!val) this.stop();
  }

  setVolume(vol: number): void {
    // vol: 0-100
    this.musicVolume = (vol / 100) * 0.15;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.masterVolume, String(vol));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  getMasterVolume(): number {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(STORAGE_KEYS.masterVolume);
      if (v !== null) return parseFloat(v);
    }
    return 100;
  }

  // ─── Theme 1: Menu — Warm ambient pad ───
  startMenuMusic(): void {
    if (!this._enabled || !this.userInteracted) return;
    if (this.currentTheme === 'menu' && this.isPlaying) return;

    this.stop();
    const ctx = this.getContext();
    if (!ctx) return;
    this.ensureResumed();

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    // Low-pass filter with LFO
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;
    filter.connect(this.masterGain);

    // LFO on filter cutoff: 0.1Hz, modulates between ~400-1200Hz
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 400; // +/- 400Hz around 800Hz center
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(ctx.currentTime);
    this.nodes.push(lfo);

    // Oscillator 1: C4 (261Hz) detuned +3
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 261;
    osc1.detune.value = 3;
    osc1.connect(filter);
    osc1.start(ctx.currentTime);
    this.nodes.push(osc1);

    // Oscillator 2: E4 (329Hz) detuned -3
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 329;
    osc2.detune.value = -3;
    osc2.connect(filter);
    osc2.start(ctx.currentTime);
    this.nodes.push(osc2);

    // Fade in over 2 seconds
    this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(
