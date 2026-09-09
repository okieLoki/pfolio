// Text rendering with the pack's pixel TTF (NormalFont, 9px design grid).
// Same interface as BitmapText so the UI can use either.

import type { Ctx } from './gfx';
import type { TextStyle } from './text';

export class TtfText {
  readonly lineHeight: number;
  private measureCache = new Map<string, number>();
  private g: Ctx;

  constructor(private family: string, private size = 9, lineHeight = 12) {
    this.lineHeight = lineHeight;
    const c = document.createElement('canvas');
    this.g = c.getContext('2d')!;
  }

  private font(scale = 1) { return `${this.size * scale}px "${this.family}", monospace`; }

  /** The pack's TTF ships a zero-width space, so words are laid out by hand. */
  private spaceW(scale = 1) { return Math.round(this.size * 0.5) * scale; }

  private wordWidth(word: string, scale = 1): number {
    const key = `${scale}:${word}`;
    let w = this.measureCache.get(key);
    if (w === undefined) {
      this.g.font = this.font(scale);
      w = Math.ceil(this.g.measureText(word).width);
      if (this.measureCache.size > 4000) this.measureCache.clear();
      this.measureCache.set(key, w);
    }
    return w;
  }

  width(text: string, scale = 1): number {
    const words = text.split(' ');
    let w = 0;
    words.forEach((word, i) => { w += this.wordWidth(word, scale); if (i < words.length - 1) w += this.spaceW(scale); });
    return w;
  }

  draw(g: Ctx, text: string, x: number, y: number, style: TextStyle = {}): number {
    const { color = '#3a3a3a', shadow = null, scale = 1, alpha = 1 } = style;
    g.font = this.font(scale);
    g.textBaseline = 'top';
    g.textAlign = 'left';
    const prev = g.globalAlpha;
    g.globalAlpha = alpha;
    let cx = x | 0;
    const words = text.split(' ');
    words.forEach((word, i) => {
      if (word) {
        if (shadow) { g.fillStyle = shadow; g.fillText(word, cx + scale, (y | 0) + scale); }
        g.fillStyle = color;
        g.fillText(word, cx, y | 0);
        cx += this.wordWidth(word, scale);
      }
      if (i < words.length - 1) cx += this.spaceW(scale);
    });
    g.globalAlpha = prev;
    return cx - (x | 0);
  }

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
