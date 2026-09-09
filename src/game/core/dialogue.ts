// Dialogue box, choice menu and list menu, styled with the pack's UI art and
// bitmap font. Pure presentation + input handling; the game drives them.

import type { NineSlice, Region } from '../assets/types';
import type { Ctx } from './gfx';
import type { TextRenderer } from './text';
import { drawNineSlice, drawRegion } from './ui';
import type { Input } from './input';

export interface UiArt {
  images: Map<string, HTMLImageElement>;
  /** box with the name tab baked into its top-left corner */
  dialogBox: NineSlice;
  /** plain box, used when nobody in particular is speaking */
  dialogBoxSimple?: NineSlice;
  choiceBox: NineSlice;
  nameTag: NineSlice;
  facesetBox?: Region;
  cursor?: Region;
  arrowDown?: Region;
}

export interface Speaker { name: string; face?: Region }

/** Screen-space reservations for HTML overlays (touch controls at the bottom, chips at the top), in game px. */
export const SAFE = { top: 0, bottom: 0 };

const INK = '#3b3226';
const INK_SHADOW = 'rgba(0,0,0,0.12)';
const HILITE = '#c8451f';

export class Dialogue {
  pages: string[][] = [];
  page = 0;
  chars = 0;           // characters revealed on this page
  speaker: Speaker | null = null;
  onClose: (() => void) | null = null;
  private blipT = 0;
  done = true;

  constructor(private text: TextRenderer, private art: UiArt, private onBlip: () => void) {}

  private raw: string[] = [];
  private lines = 3;

  private paginate(maxWidth: number) {
    this.pages = [];
    for (const p of this.raw) {
      const wrapped = this.text.wrap(p, maxWidth);
      for (let i = 0; i < wrapped.length; i += this.lines) this.pages.push(wrapped.slice(i, i + this.lines));
    }
    if (!this.pages.length) this.pages = [['']];
  }

  open(paragraphs: string[], speaker: Speaker | null, maxWidth: number, lines = 3, onClose?: () => void) {
    this.raw = paragraphs; this.lines = lines;
    this.paginate(maxWidth);
    this.page = 0; this.chars = 0; this.speaker = speaker; this.onClose = onClose ?? null; this.done = false;
  }

  /** Re-wrap after a resize; keeps the reader roughly where they were. */
  relayout(maxWidth: number) {
    if (this.done) return;
    const progress = this.page / Math.max(1, this.pages.length);
    this.paginate(maxWidth);
    this.page = Math.min(this.pages.length - 1, Math.floor(progress * this.pages.length));
    this.chars = this.total();
  }

  close() { this.done = true; this.onClose = null; }

  private total() { return this.pages[this.page].join(' ').length; }
  get complete() { return this.chars >= this.total(); }

  update(input: Input, dt: number) {
    if (this.done) return;
    if (!this.complete) {
      const fast = input.held.has('a') || input.held.has('b');
      this.chars += (fast ? 4 : 1.6) * dt * 60 / 2;
      this.blipT += dt;
      if (this.blipT > 0.06) { this.blipT = 0; this.onBlip(); }
      if (input.hit('a')) this.chars = this.total();
      return;
    }
    if (input.hit('a') || input.hit('b')) {
      if (this.page < this.pages.length - 1) { this.page++; this.chars = 0; }
      else { this.done = true; const cb = this.onClose; this.onClose = null; cb?.(); }
    }
  }

  layout(viewW: number, viewH: number) {
    const w = Math.min(viewW - 12, 340);
    const lines = 3;
    const h = 16 + lines * this.text.lineHeight + 6;
    const x = ((viewW - w) / 2) | 0;
    const y = viewH - h - 8 - SAFE.bottom;
    return { x, y, w, h };
  }

  draw(g: Ctx, viewW: number, viewH: number, time: number) {
    if (this.done) return;
    const { x, y, w, h } = this.layout(viewW, viewH);
    const named = !!this.speaker?.name;
    const box = named || !this.art.dialogBoxSimple ? this.art.dialogBox : this.art.dialogBoxSimple;
    drawNineSlice(g, this.art.images.get(box.region.sheet)!, box, x, y, w, h);

    let tx = x + 12;
    if (this.speaker?.face && this.art.facesetBox) {
      const fb = this.art.facesetBox;
      const fimg = this.art.images.get(fb.sheet)!;
      const fx = x + 6, fy = y + ((h - fb.h) / 2) | 0;
      drawRegion(g, fimg, fb, fx, fy);
      const face = this.speaker.face;
      const faceImg = this.art.images.get(face.sheet)!;
      const s = Math.floor(Math.min((fb.w - 8) / face.w, (fb.h - 8) / face.h)) || 1;
      g.drawImage(faceImg, face.x, face.y, face.w, face.h, fx + ((fb.w - face.w * s) / 2) | 0, fy + ((fb.h - face.h * s) / 2) | 0, face.w * s, face.h * s);
      tx = fx + fb.w + 8;
    }
    if (named) {
      // the tab is part of dialogBox's top-left corner piece; the name sits inside it
      this.text.draw(g, this.speaker!.name, x + 9, y + 1, { color: '#fff7ea' });
    }

    const lines = this.pages[this.page] ?? [];
    let remaining = Math.floor(this.chars);
    lines.forEach((line, i) => {
      const shown = line.slice(0, Math.max(0, remaining));
      remaining -= line.length + 1;
      this.text.draw(g, shown, tx, y + (named ? 14 : 11) + i * this.text.lineHeight, { color: INK, shadow: INK_SHADOW });
    });

    if (this.complete && Math.floor(time * 3) % 2 === 0) {
      const ax = x + w - 14, ay = y + h - 10 + Math.round(Math.sin(time * 6));
      if (this.art.arrowDown) drawRegion(g, this.art.images.get(this.art.arrowDown.sheet)!, this.art.arrowDown, ax, ay);
      else { g.fillStyle = HILITE; g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + 6, ay); g.lineTo(ax + 3, ay + 4); g.fill(); }
    }
  }
}

export interface MenuItem { label: string; description?: string; disabled?: boolean }

export class Menu {
  items: MenuItem[] = [];
  index = 0;
  title = '';
  onSelect: ((i: number) => void) | null = null;
  onCancel: (() => void) | null = null;
  anchor: 'topRight' | 'bottomRight' | 'center' | 'topLeft' = 'topRight';
  visibleRows = 7;
  done = true;
  private first = 0;

  constructor(private text: TextRenderer, private art: UiArt, private sfx: (k: string) => void) {}

  open(items: MenuItem[], onSelect: (i: number) => void, opts: { title?: string; anchor?: Menu['anchor']; onCancel?: () => void; rows?: number; index?: number } = {}) {
    this.items = items; this.index = Math.min(items.length - 1, Math.max(0, opts.index ?? 0)); this.first = 0; this.done = false;
    if (this.index >= (opts.rows ?? 7)) this.first = this.index - (opts.rows ?? 7) + 1;
    this.onSelect = onSelect; this.onCancel = opts.onCancel ?? null;
    this.title = opts.title ?? ''; this.anchor = opts.anchor ?? 'topRight'; this.visibleRows = opts.rows ?? 7;
  }
  close() { this.done = true; }

  update(input: Input) {
    if (this.done) return;
    const n = this.items.length;
    if (input.hit('up')) { this.index = (this.index + n - 1) % n; this.sfx('cursorMove'); }
    if (input.hit('down')) { this.index = (this.index + 1) % n; this.sfx('cursorMove'); }
    if (this.index < this.first) this.first = this.index;
    if (this.index >= this.first + this.visibleRows) this.first = this.index - this.visibleRows + 1;
    if (input.hit('a')) {
      if (this.items[this.index].disabled) { this.sfx('cancel'); return; }
      this.sfx('confirm');
      const i = this.index; const cb = this.onSelect;
      this.done = true; cb?.(i);
    } else if (input.hit('b') || input.hit('start')) {
      this.sfx('cancel');
      const cb = this.onCancel; this.done = true; cb?.();
    }
  }

  private box(viewW: number, viewH: number) {
    const rows = Math.min(this.items.length, this.visibleRows);
    const textW = Math.max(...this.items.map((i) => this.text.width(i.label)), this.text.width(this.title));
    const w = Math.min(viewW - 16, textW + 34);
    const h = rows * this.text.lineHeight + 16 + (this.title ? 12 : 0);
    let x = 8, y = 8 + SAFE.top;
    if (this.anchor === 'topRight') x = viewW - w - 8;
    if (this.anchor === 'bottomRight') { x = viewW - w - 8; y = viewH - h - 8 - SAFE.bottom; }
    if (this.anchor === 'center') { x = ((viewW - w) / 2) | 0; y = ((viewH - h) / 2) | 0; }
    return { x, y, w, h, rows };
  }

  draw(g: Ctx, viewW: number, viewH: number, time: number, descBox?: Dialogue) {
    if (this.done) return;
    const { x, y, w, h, rows } = this.box(viewW, viewH);
    const img = this.art.images.get(this.art.choiceBox.region.sheet)!;
    drawNineSlice(g, img, this.art.choiceBox, x, y, w, h);
    let ty = y + 9;
    if (this.title) { this.text.draw(g, this.title, x + 10, ty, { color: '#7a6a55' }); ty += 12; }
    for (let r = 0; r < rows; r++) {
      const i = this.first + r;
      const item = this.items[i];
      const ly = ty + r * this.text.lineHeight;
      if (i === this.index) {
        const cx = x + 8 + (Math.floor(time * 4) % 2);
        if (this.art.cursor) drawRegion(g, this.art.images.get(this.art.cursor.sheet)!, this.art.cursor, cx, ly);
        else { g.fillStyle = HILITE; g.beginPath(); g.moveTo(cx, ly); g.lineTo(cx + 4, ly + 3); g.lineTo(cx, ly + 6); g.fill(); }
      }
      let label = item.label;
      const maxW = w - 30;
      if (this.text.width(label) > maxW) { while (label.length > 1 && this.text.width(label + '..') > maxW) label = label.slice(0, -1); label += '..'; }
      this.text.draw(g, label, x + 20, ly, { color: item.disabled ? '#a89c88' : i === this.index ? HILITE : INK, shadow: INK_SHADOW });
    }
    if (this.first > 0) this.text.draw(g, '^', x + w - 12, y + 3, { color: '#a89c88' });
    if (this.first + rows < this.items.length) this.text.draw(g, 'v', x + w - 12, y + h - 11, { color: '#a89c88' });

    const desc = this.items[this.index]?.description;
    if (desc && descBox) {
      const lay = descBox.layout(viewW, viewH);
      const box = this.art.dialogBoxSimple ?? this.art.dialogBox;
      drawNineSlice(g, this.art.images.get(box.region.sheet)!, box, lay.x, lay.y, lay.w, lay.h);
      this.text.wrap(desc, lay.w - 24).slice(0, 3).forEach((line, i) =>
        this.text.draw(g, line, lay.x + 12, lay.y + 11 + i * this.text.lineHeight, { color: INK, shadow: INK_SHADOW }));
    }
  }
}
