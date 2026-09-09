// Text rendering with the pack's 8×8 bitmap font (proportional via the
// advance table) and an optional TTF fallback for larger display text.

import type { BitmapFont } from '../assets/types';
import type { Ctx } from './gfx';
import { makeCanvas } from './gfx';

export interface TextStyle { color?: string; shadow?: string | null; scale?: number; alpha?: number }

/** What the UI needs from a text renderer (BitmapText or TtfText). */
export interface TextRenderer {
  readonly lineHeight: number;
  width(text: string): number;
  draw(g: Ctx, text: string, x: number, y: number, style?: TextStyle): number;
  wrap(text: string, maxWidth: number): string[];
}

export class BitmapText {
  private glyphs = new Map<string, { x: number; y: number; adv: number; bx: number; bw: number }>();
  private tinted = new Map<string, HTMLCanvasElement>();
  readonly lineHeight: number;

  /**
   * @param bearing optional left bearing per glyph (first visible column inside the cell);
   *                glyphs are blitted from that column, `advance - 1` px wide.
   */
  constructor(private img: HTMLImageElement, private font: BitmapFont, bearing?: Record<string, number>) {
    const { charset, cols, glyphW, glyphH, region, advance } = font;
    [...charset].forEach((ch, i) => {
      const adv = advance?.[ch] ?? glyphW;
      const bx = bearing?.[ch] ?? 0;
      this.glyphs.set(ch, {
        x: region.x + (i % cols) * glyphW,
        y: region.y + Math.floor(i / cols) * glyphH,
        adv,
        bx,
        bw: Math.max(1, Math.min(glyphW - bx, advance ? adv - 1 : glyphW)),
      });
    });
    this.lineHeight = glyphH + 2;
  }

  private sheet(color: string): HTMLCanvasElement {
    let c = this.tinted.get(color);
    if (c) return c;
    const [cv, g] = makeCanvas(this.img.width, this.img.height);
    g.drawImage(this.img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, cv.width, cv.height);
    this.tinted.set(color, cv);
    return cv;
  }

  width(text: string): number {
    let w = 0;
    for (const ch of text) w += this.glyphs.get(ch)?.adv ?? this.glyphs.get('?')?.adv ?? this.font.glyphW;
    return w;
  }

  draw(g: Ctx, text: string, x: number, y: number, style: TextStyle = {}): number {
    const { color = '#3a3a3a', shadow = null, scale = 1, alpha = 1 } = style;
    const { glyphH } = this.font;
    const main = this.sheet(color);
    const sh = shadow ? this.sheet(shadow) : null;
    const prevAlpha = g.globalAlpha;
    g.globalAlpha = alpha;
    let cx = x;
    for (const ch of text) {
      const gl = this.glyphs.get(ch) ?? this.glyphs.get('?');
      if (!gl) continue;
      if (ch !== ' ') {
        if (sh) g.drawImage(sh, gl.x + gl.bx, gl.y, gl.bw, glyphH, cx + scale, y + scale, gl.bw * scale, glyphH * scale);
        g.drawImage(main, gl.x + gl.bx, gl.y, gl.bw, glyphH, cx, y, gl.bw * scale, glyphH * scale);
      }
      cx += gl.adv * scale;
    }
    g.globalAlpha = prevAlpha;
    return cx - x;
  }

  /** Word-wrap to a pixel width. Honours explicit \n. */
  wrap(text: string, maxWidth: number): string[] {
    const out: string[] = [];
    for (const para of text.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const trial = line ? `${line} ${word}` : word;
        if (this.width(trial) <= maxWidth || !line) line = trial;
        else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out;
  }
}
