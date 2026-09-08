// Small canvas helpers shared by the renderer and UI.

export type Ctx = CanvasRenderingContext2D;

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w | 0);
  c.height = Math.max(1, h | 0);
  const g = c.getContext('2d', { alpha: true })!;
  g.imageSmoothingEnabled = false;
  return [c, g];
}

export interface Rect { x: number; y: number; w: number; h: number }

export function blit(g: Ctx, img: CanvasImageSource, src: Rect, dx: number, dy: number, dw = src.w, dh = src.h) {
  g.drawImage(img, src.x, src.y, src.w, src.h, dx | 0, dy | 0, dw, dh);
}

export function clamp(v: number, lo: number, hi: number) { return v < lo ? lo : v > hi ? hi : v; }
export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

/** Deterministic PRNG (mulberry32) so decorations don't reshuffle every load. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
