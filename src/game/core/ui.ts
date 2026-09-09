// 9-slice panels and the dialogue/menu widgets, drawn with the pack's UI art.

import type { NineSlice, Region } from '../assets/types';
import type { Ctx } from './gfx';

export function drawNineSlice(g: Ctx, img: HTMLImageElement, ns: NineSlice, x: number, y: number, w: number, h: number) {
  const { region: r, inset: i } = ns;
  x |= 0; y |= 0; w |= 0; h |= 0;
  const midW = r.w - i.l - i.r, midH = r.h - i.t - i.b;
  const dw = Math.max(0, w - i.l - i.r), dh = Math.max(0, h - i.t - i.b);
  const d = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, ddw: number, ddh: number) => {
    if (sw <= 0 || sh <= 0 || ddw <= 0 || ddh <= 0) return;
    g.drawImage(img, r.x + sx, r.y + sy, sw, sh, x + dx, y + dy, ddw, ddh);
  };
  // corners
  d(0, 0, i.l, i.t, 0, 0, i.l, i.t);
  d(r.w - i.r, 0, i.r, i.t, w - i.r, 0, i.r, i.t);
  d(0, r.h - i.b, i.l, i.b, 0, h - i.b, i.l, i.b);
  d(r.w - i.r, r.h - i.b, i.r, i.b, w - i.r, h - i.b, i.r, i.b);
  // edges
  d(i.l, 0, midW, i.t, i.l, 0, dw, i.t);
  d(i.l, r.h - i.b, midW, i.b, i.l, h - i.b, dw, i.b);
  d(0, i.t, i.l, midH, 0, i.t, i.l, dh);
  d(r.w - i.r, i.t, i.r, midH, w - i.r, i.t, i.r, dh);
  // centre
  d(i.l, i.t, midW, midH, i.l, i.t, dw, dh);
}

export function drawRegion(g: Ctx, img: HTMLImageElement, r: Region, x: number, y: number, w = r.w, h = r.h) {
  g.drawImage(img, r.x, r.y, r.w, r.h, x | 0, y | 0, w, h);
}
