// Music via HTMLAudio (streams, loops, crossfades) and SFX via Web Audio
// (decoded buffers, zero-latency). Picks a container the browser can play.

export interface MusicDef { ogg?: string; m4a: string; loop: boolean; volume: number }
export interface SfxDef { m4a: string; wav: string; volume: number }

const probe = document.createElement('audio');
const canOgg = !!probe.canPlayType('audio/ogg; codecs="vorbis"');
const canM4a = !!probe.canPlayType('audio/mp4; codecs="mp4a.40.2"');

export class AudioBus {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private current: { el: HTMLAudioElement; key: string; target: number } | null = null;
  private fading = new Set<HTMLAudioElement>();
  muted = false;
  musicVolume = 0.6;
  sfxVolume = 0.8;
  unlocked = false;

  constructor(private music: Record<string, MusicDef>, private sfx: Record<string, SfxDef>) {
    try { this.muted = localStorage.getItem('muted') === '1'; } catch {}
  }

  /** Call synchronously from a user gesture (iOS only honours play() inside the gesture's own call stack). */
  unlock() {
    if (this.unlocked) return;
    try {
      this.ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = this.ctx;
      ctx.resume().then(() => { if (ctx.state === 'running' && !this.current) this.unlocked = true; }).catch(() => {});
    } catch { this.ctx = null; }
    const el = this.current?.el;
    if (el) {
      const p = el.play();
      // play() resolving is the only reliable signal on mobile; a gamepad "gesture" gets rejected and we retry later
      if (p) p.then(() => { this.unlocked = true; }).catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem('muted', this.muted ? '1' : '0'); } catch {}
    this.applyMute();
    if (!this.muted) this.unlock(); // the toggle itself is a gesture — start playback if it never got unlocked
    return this.muted;
  }

  /** iOS ignores HTMLMediaElement.volume, so mute via the `muted` flag as well. */
  private applyMute() {
    const cur = this.current;
    if (!cur) return;
    cur.el.muted = this.muted;
    if (!this.fading.has(cur.el)) cur.el.volume = this.muted ? 0 : cur.target;
  }

  private musicUrl(d: MusicDef) { return canOgg && d.ogg ? d.ogg : canM4a ? d.m4a : d.ogg ?? d.m4a; }
  private sfxUrl(d: SfxDef) { return canM4a ? d.m4a : d.wav; }

  playMusic(key: string, fadeMs = 800) {
    const def = this.music[key];
    if (!def || this.current?.key === key) return;
    const prev = this.current;
    const el = new Audio(this.musicUrl(def));
    el.loop = def.loop;
    el.preload = 'auto';
    const target = def.volume * this.musicVolume;
    el.volume = 0;
    el.muted = this.muted;
    this.current = { el, key, target };
    // a fresh element can be refused outside a gesture (iOS); fall back to re-unlocking on the next tap
    if (this.unlocked) el.play().catch(() => { this.unlocked = false; });
    this.fade(el, this.muted ? 0 : target, fadeMs);
    if (prev) this.fade(prev.el, 0, fadeMs, () => { prev.el.pause(); prev.el.src = ''; });
  }

  stopMusic(fadeMs = 600) {
    const prev = this.current;
    this.current = null;
    if (prev) this.fade(prev.el, 0, fadeMs, () => { prev.el.pause(); prev.el.src = ''; });
  }

  private fade(el: HTMLAudioElement, to: number, ms: number, done?: () => void) {
    const from = el.volume;
    const start = performance.now();
    this.fading.add(el);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const v = Math.min(1, Math.max(0, from + (to - from) * t));
      el.volume = this.muted && el === this.current?.el ? 0 : v;
      if (t < 1) requestAnimationFrame(step);
      else { this.fading.delete(el); done?.(); }
    };
    requestAnimationFrame(step);
  }

  private buffer(url: string): Promise<AudioBuffer | null> {
    let p = this.buffers.get(url);
    if (!p) {
      p = (async () => {
        if (!this.ctx) return null;
        try {
          const res = await fetch(url);
          return await this.ctx.decodeAudioData(await res.arrayBuffer());
        } catch { return null; }
      })();
      this.buffers.set(url, p);
    }
    return p;
  }

  /** Warm the SFX cache after unlock. */
  preloadSfx() { for (const d of Object.values(this.sfx)) this.buffer(this.sfxUrl(d)); }

  async play(key: string, opts: { volume?: number; rate?: number } = {}) {
    if (this.muted || !this.ctx) return;
    const def = this.sfx[key];
    if (!def) return;
    const buf = await this.buffer(this.sfxUrl(def));
    if (!buf || !this.ctx) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? 1;
    const gain = this.ctx.createGain();
    gain.gain.value = def.volume * this.sfxVolume * (opts.volume ?? 1);
    src.connect(gain).connect(this.ctx.destination);
    src.start();
  }
}
