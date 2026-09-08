// Autotiling. Two schemes, both keyed by an 8-bit neighbour mask:
//   N=1 NE=2 E=4 SE=8 S=16 SW=32 W=64 NW=128  (bit set = neighbour is "same")
// - Autotile13: composes a 16×16 tile from 8×8 quadrants of a 3×3 + 2×2 block.
// - AutotileBlob: direct lookup of the 47 canonical shapes.

import type { Autotile, Autotile13, AutotileBlob } from '../assets/types';
import { makeCanvas } from './gfx';

export const N = 1, NE = 2, E = 4, SE = 8, S = 16, SW = 32, W = 64, NW = 128;

/** Diagonals only matter when both adjacent cardinals are set. */
export function normalizeMask(m: number) {
  if (!((m & N) && (m & E))) m &= ~NE;
  if (!((m & E) && (m & S))) m &= ~SE;
  if (!((m & S) && (m & W))) m &= ~SW;
  if (!((m & W) && (m & N))) m &= ~NW;
  return m;
}

type Q = 'TL' | 'TR' | 'BL' | 'BR';

// Source tile offsets (in 16px tile units) inside the 3×3 block.
const ring = { TL: [0, 0], T: [1, 0], TR: [2, 0], L: [0, 1], C: [1, 1], R: [2, 1], BL: [0, 2], B: [1, 2], BR: [2, 2] } as const;

/**
 * For one quadrant, decide which source tile supplies it.
 * a = cardinal neighbour along the quadrant's vertical side (N for top quadrants, S for bottom)
 * b = cardinal neighbour along the horizontal side (W for left quadrants, E for right)
 * d = the diagonal between them.
 */
function pick(q: Q, a: boolean, b: boolean, d: boolean): { tile: keyof typeof ring | 'inner'; } {
  if (!a && !b) return { tile: q };                         // outer corner
  if (a && !b) return { tile: q === 'TL' || q === 'BL' ? 'L' : 'R' }; // vertical edge piece
  if (!a && b) return { tile: q === 'TL' || q === 'TR' ? 'T' : 'B' }; // horizontal edge piece
  if (!d) return { tile: 'inner' };                         // concave corner
  return { tile: 'C' };                                     // interior
}

const quadOffset: Record<Q, [number, number]> = { TL: [0, 0], TR: [8, 0], BL: [0, 8], BR: [8, 8] };

export function composeAuto13(img: HTMLImageElement, a: Autotile13, mask: number): HTMLCanvasElement {
  const [c, g] = makeCanvas(16, 16);
  const n = !!(mask & N), e = !!(mask & E), s = !!(mask & S), w = !!(mask & W);
  const ne = !!(mask & NE), se = !!(mask & SE), sw = !!(mask & SW), nw = !!(mask & NW);
  const quads: [Q, boolean, boolean, boolean][] = [
    ['TL', n, w, nw], ['TR', n, e, ne], ['BL', s, w, sw], ['BR', s, e, se],
  ];
  for (const [q, qa, qb, qd] of quads) {
    const { tile } = pick(q, qa, qb, qd);
    const [qx, qy] = quadOffset[q];
    let sx: number, sy: number;
    if (tile === 'inner') { sx = a.ix + qx; sy = a.iy + qy; }
    else { const [tx, ty] = ring[tile]; sx = a.x + tx * 16 + qx; sy = a.y + ty * 16 + qy; }
    g.drawImage(img, sx, sy, 8, 8, qx, qy, 8, 8);
  }
  return c;
}

export function blobLookup(b: AutotileBlob, mask: number) {
  return b.tiles[normalizeMask(mask)] ?? b.fill;
}

/** Caches composed/looked-up tiles per (autotile, mask). */
export class AutotileCache {
  private cache = new Map<string, HTMLCanvasElement>();
  constructor(private images: Map<string, HTMLImageElement>) {}

  tile(key: string, auto: Autotile, mask: number): HTMLCanvasElement {
    mask = normalizeMask(mask);
    const k = `${key}:${mask}`;
    let c = this.cache.get(k);
    if (c) return c;
    const img = this.images.get(auto.sheet)!;
    if (auto.kind === 'auto13') c = composeAuto13(img, auto, mask);
    else {
      const t = blobLookup(auto, mask);
      const [cv, g] = makeCanvas(16, 16);
      g.drawImage(img, t.x, t.y, 16, 16, 0, 0, 16, 16);
      c = cv;
    }
    this.cache.set(k, c);
    return c;
  }
}
