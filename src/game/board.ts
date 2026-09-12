// The doodle wall: a shared pixel canvas everyone can draw on.
// Storage is pluggable: localStorage by default; Supabase (realtime) when
// site.supabase is configured. Setup SQL for Supabase:
//
//   create table doodles (id bigint generated always as identity primary key,
//     created_at timestamptz default now(), stroke jsonb not null);
//   alter table doodles enable row level security;
//   create policy "read" on doodles for select using (true);
//   create policy "write" on doodles for insert with check (true);
//   alter publication supabase_realtime add table doodles;
//   -- optional, lets visitors undo their own last stroke (anyone could delete via the API):
//   create policy "undo" on doodles for delete using (true);

import type { Ctx } from './core/gfx';
import { makeCanvas } from './core/gfx';
import type { Input } from './core/input';
import type { TextRenderer } from './core/text';
import { SAFE } from './core/dialogue';

/** t: p=pen (polyline), l=line, r/R=rect outline/filled, o/O=ellipse outline/filled.
 *  c: palette index, -1 = eraser. s: brush size. p: flat [x0,y0,x1,y1,...]. */
export interface Stroke { id?: string; c: number; t?: Tool; s?: number; p: number[] }
export type Tool = 'p' | 'l' | 'r' | 'R' | 'o' | 'O';

export interface BoardStore {
  load(): Promise<Stroke[]>;
  add(s: Stroke): Promise<void>;
  remove(s: Stroke): Promise<void>;
  subscribe(cb: (s: Stroke) => void): () => void;
  readonly shared: boolean;
}

export class LocalStore implements BoardStore {
  shared = false;
  async load() { try { return JSON.parse(localStorage.getItem('doodle') ?? '[]') as Stroke[]; } catch { return []; } }
  private save(all: Stroke[]) { try { localStorage.setItem('doodle', JSON.stringify(all.slice(-4000))); } catch {} }
  async add(s: Stroke) { const all = await this.load(); all.push(s); this.save(all); }
  async remove(s: Stroke) { const all = await this.load(); this.save(all.filter((x) => x.id !== s.id)); }
  subscribe() { return () => {}; }
}

export class SupabaseStore implements BoardStore {
  shared = true;
  private client: any = null;
  constructor(private url: string, private key: string) {}
  private async sb() {
    if (!this.client) {
      const url = 'https://esm.sh/@supabase/supabase-js@2';
      const mod: any = await import(/* @vite-ignore */ url);
      this.client = mod.createClient(this.url, this.key, { realtime: { params: { eventsPerSecond: 20 } } });
    }
    return this.client;
  }
  async load() {
    const sb = await this.sb();
    const { data } = await sb.from('doodles').select('stroke').order('id', { ascending: true }).limit(5000);
    return (data ?? []).map((r: any) => r.stroke as Stroke);
  }
  async add(s: Stroke) { const sb = await this.sb(); await sb.from('doodles').insert({ stroke: s }); }
  async remove(s: Stroke) { const sb = await this.sb(); await sb.from('doodles').delete().eq('stroke->>id', s.id); }
  subscribe(cb: (s: Stroke) => void) {
    let ch: any;
    this.sb().then((sb) => { ch = sb.channel('doodles').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'doodles' }, (p: any) => cb(p.new.stroke)).subscribe(); });
    return () => { ch?.unsubscribe(); };
  }
}

export const PALETTE = ['#2b2b2b', '#e04c3a', '#f2a03d', '#ffd94a', '#58c060', '#4c8fe0', '#8b5fc9', '#f78ab9', '#fff7ea'];
const PAPER = '#f7efe1';
const INK = '#3b3226';
const TOOLS: Tool[] = ['p', 'l', 'r', 'R', 'o', 'O'];
const SIZES = [1, 2, 3];

type Item = { kind: 'color' | 'eraser' | 'tool' | 'size' | 'undo'; v: number; x: number; y: number; w: number };

export class Board {
  readonly W = 320;
  readonly H = 150;
  private surface: HTMLCanvasElement;
  private sg: Ctx;
  private preview: HTMLCanvasElement;
  private pg: Ctx;
  private color = 1;
  private eraser = false;
  private tool: Tool = 'p';
  private size = 1;
  private drawing: Stroke | null = null;
  private last: [number, number] | null = null;
  private unsub: (() => void) | null = null;
  private all: Stroke[] = [];
  private mine: Stroke[] = [];
  private items: Item[] = [];
  private version = 0;
  private thumb: { c: HTMLCanvasElement; g: Ctx; v: number } | null = null;
  private loaded = false;
  open = false;
  /** screen rect of the drawing area in game px, set by draw() */
  rect = { x: 0, y: 0, w: 0, h: 0, s: 1 };

  constructor(private store: BoardStore) {
    [this.surface, this.sg] = makeCanvas(this.W, this.H);
    [this.preview, this.pg] = makeCanvas(this.W, this.H);
    this.clearSurface();
  }

  private clearSurface() { this.sg.fillStyle = PAPER; this.sg.fillRect(0, 0, this.W, this.H); this.version++; }
  private repaint() { this.clearSurface(); for (const s of this.all) this.paint(s); }

  /** Load the strokes once at boot so the wall in the town square shows the current drawing. */
  async preload() {
    if (this.loaded) return;
    this.loaded = true;
    try { this.all = await this.store.load(); this.repaint(); } catch {}
  }

  async show() {
    this.open = true;
    if (!this.loaded) await this.preload();
    else { this.all = await this.store.load(); this.repaint(); }
    this.unsub = this.store.subscribe((s) => {
      if (this.all.some((x) => x.id && x.id === s.id)) return; // our own echo
      this.all.push(s); this.paint(s);
    });
  }

  /** Tiny max-pooled preview (thin strokes survive the downscale) for the in-world prop. */
  thumbnail(w: number, h: number): HTMLCanvasElement {
    if (this.thumb && this.thumb.v === this.version && this.thumb.c.width === w && this.thumb.c.height === h) return this.thumb.c;
    if (!this.thumb || this.thumb.c.width !== w || this.thumb.c.height !== h) { const [c, g] = makeCanvas(w, h); this.thumb = { c, g, v: -1 }; }
    const { g } = this.thumb;
    const src = this.sg.getImageData(0, 0, this.W, this.H).data;
    const out = g.createImageData(w, h);
    const bw = this.W / w, bh = this.H / h;
    for (let ty = 0; ty < h; ty++) for (let tx = 0; tx < w; tx++) {
      const x0 = Math.floor(tx * bw), x1 = Math.floor((tx + 1) * bw), y0 = Math.floor(ty * bh), y1 = Math.floor((ty + 1) * bh);
      let best = -1, bestScore = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
        const i = (y * this.W + x) * 4;
        const r = src[i], gg = src[i + 1], b = src[i + 2];
        const score = Math.abs(r - 0xf7) + Math.abs(gg - 0xef) + Math.abs(b - 0xe1); // distance from paper
        if (score > bestScore + 20) { bestScore = score; best = i; }
      }
      const o = (ty * w + tx) * 4;
      if (best >= 0) { out.data[o] = src[best]; out.data[o + 1] = src[best + 1]; out.data[o + 2] = src[best + 2]; out.data[o + 3] = 255; }
    }
    g.putImageData(out, 0, 0);
    this.thumb.v = this.version;
    return this.thumb.c;
  }

  hide() { this.open = false; this.unsub?.(); this.unsub = null; this.drawing = null; this.last = null; this.pg.clearRect(0, 0, this.W, this.H); }

  undo() {
    const s = this.mine.pop();
    if (!s) return false;
    this.all = this.all.filter((x) => x !== s && x.id !== s.id);
    this.repaint();
    this.store.remove(s).catch(() => {});
    return true;
  }

  // ------------------------------------------------------------ rasterising

  private brush(s: Stroke) { return s.s ?? (s.c < 0 ? 4 : 1); }
  private ink(s: Stroke) { return s.c < 0 ? PAPER : PALETTE[s.c] ?? '#000'; }

  private paint(s: Stroke, g: Ctx = this.sg) {
    if (g === this.sg) this.version++;
    g.fillStyle = this.ink(s);
    const size = this.brush(s), p = s.p, t = s.t ?? 'p';
    if (p.length < 2) return;
    if (t === 'p' || p.length < 4) {
      this.dot(g, p[0], p[1], size);
      for (let i = 2; i + 1 < p.length; i += 2) this.line(g, p[i - 2], p[i - 1], p[i], p[i + 1], size);
      return;
    }
    const x0 = p[0], y0 = p[1], x1 = p[p.length - 2], y1 = p[p.length - 1];
    const lx = Math.min(x0, x1), ly = Math.min(y0, y1), hx = Math.max(x0, x1), hy = Math.max(y0, y1);
    switch (t) {
      case 'l': this.line(g, x0, y0, x1, y1, size); break;
      case 'r':
        this.line(g, lx, ly, hx, ly, size); this.line(g, hx, ly, hx, hy, size);
        this.line(g, hx, hy, lx, hy, size); this.line(g, lx, hy, lx, ly, size); break;
      case 'R': g.fillRect(lx, ly, hx - lx + 1, hy - ly + 1); break;
      case 'o': case 'O': this.ellipse(g, lx, ly, hx, hy, size, t === 'O'); break;
    }
  }
  private dot(g: Ctx, x: number, y: number, size: number) { g.fillRect(x - (size >> 1), y - (size >> 1), size, size); }
  private line(g: Ctx, x0: number, y0: number, x1: number, y1: number, size: number) {
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.dot(g, x0, y0, size);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  private ellipse(g: Ctx, lx: number, ly: number, hx: number, hy: number, size: number, fill: boolean) {
    const cx = (lx + hx) / 2, cy = (ly + hy) / 2, rx = (hx - lx) / 2, ry = (hy - ly) / 2;
    if (fill) {
      for (let y = ly; y <= hy; y++) {
        const k = ry ? (y - cy) / ry : 0;
        const half = rx * Math.sqrt(Math.max(0, 1 - k * k));
        g.fillRect(Math.round(cx - half), y, Math.max(1, Math.round(half * 2)), 1);
      }
      return;
    }
    const n = Math.max(12, Math.ceil(Math.PI * (rx + ry)));
    let px = 0, py = 0;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(a) * rx), y = Math.round(cy + Math.sin(a) * ry);
      if (i) this.line(g, px, py, x, y, size); else this.dot(g, x, y, size);
      px = x; py = y;
    }
  }

  // ------------------------------------------------------------ pointer

  /** Pointer position in game px → board px (clamped when `clamp`), or null when outside. */
  toBoard(gx: number, gy: number, clamp = false): [number, number] | null {
    const { x, y, w, h, s } = this.rect;
    if (!clamp && (gx < x || gy < y || gx >= x + w || gy >= y + h)) return null;
    const bx = Math.min(this.W - 1, Math.max(0, Math.floor((gx - x) / s)));
    const by = Math.min(this.H - 1, Math.max(0, Math.floor((gy - y) / s)));
    return [bx, by];
  }

  private current(): Stroke {
    return { id: Math.random().toString(36).slice(2, 10), c: this.eraser ? -1 : this.color, t: this.eraser ? 'p' : this.tool, s: this.eraser ? this.size * 4 : this.size, p: [] };
  }

  pointerDown(gx: number, gy: number) {
    const b = this.toBoard(gx, gy);
    if (!b) { this.pickItem(gx, gy); return; }
    this.drawing = this.current();
    this.drawing.p.push(...b);
    this.last = b;
    if (this.drawing.t === 'p') this.paint(this.drawing);
    else this.paintPreview();
  }
  pointerMove(gx: number, gy: number) {
    if (!this.drawing) return;
    const b = this.toBoard(gx, gy, true)!;
    if (!this.last || (b[0] === this.last[0] && b[1] === this.last[1])) return;
    if (this.drawing.t === 'p') {
      this.version++;
      this.sg.fillStyle = this.ink(this.drawing);
      this.line(this.sg, this.last[0], this.last[1], b[0], b[1], this.brush(this.drawing));
      this.drawing.p.push(...b);
    } else {
      this.drawing.p = [this.drawing.p[0], this.drawing.p[1], ...b];
      this.paintPreview();
    }
    this.last = b;
  }
  pointerUp() {
    const s = this.drawing;
    this.drawing = null; this.last = null;
    this.pg.clearRect(0, 0, this.W, this.H);
    if (!s || s.p.length < 2) return;
    if (s.t !== 'p') this.paint(s);
    this.all.push(s); this.mine.push(s);
    this.store.add(s).catch(() => {});
  }
  private paintPreview() {
    this.pg.clearRect(0, 0, this.W, this.H);
    if (this.drawing) this.paint(this.drawing, this.pg);
  }

  private pickItem(gx: number, gy: number) {
    for (const it of this.items) {
      if (gx < it.x || gy < it.y || gx >= it.x + it.w || gy >= it.y + it.w) continue;
      switch (it.kind) {
        case 'color': this.color = it.v; this.eraser = false; break;
        case 'eraser': this.eraser = !this.eraser; break;
        case 'tool': this.tool = TOOLS[it.v]; this.eraser = false; break;
        case 'size': this.size = SIZES[it.v]; break;
        case 'undo': this.undo(); break;
      }
      return;
    }
  }

  update(input: Input) {
    if (input.hit('left')) this.color = (this.color + PALETTE.length - 1) % PALETTE.length, this.eraser = false;
    if (input.hit('right')) this.color = (this.color + 1) % PALETTE.length, this.eraser = false;
    if (input.hit('down')) this.tool = TOOLS[(TOOLS.indexOf(this.tool) + 1) % TOOLS.length], this.eraser = false;
    if (input.hit('up')) this.tool = TOOLS[(TOOLS.indexOf(this.tool) + TOOLS.length - 1) % TOOLS.length], this.eraser = false;
    if (input.hit('select')) this.size = SIZES[(SIZES.indexOf(this.size) + 1) % SIZES.length];
    if (input.hit('a')) this.undo();
    return input.hit('b') || input.hit('start');
  }

  // ------------------------------------------------------------ layout + draw

  /** Flow the toolbar items into rows of at most `width` px. Returns row count. */
  private layoutItems(x0: number, y0: number, width: number, cell: number): number {
    const gap = 3, sep = 6;
    const list: Array<Item['kind'] | 'sep'> = [
      ...PALETTE.map(() => 'color' as const), 'eraser', 'sep',
      ...TOOLS.map(() => 'tool' as const), 'sep',
      ...SIZES.map(() => 'size' as const), 'sep', 'undo',
    ];
    const counters: Record<string, number> = {};
    this.items = [];
    let x = x0, y = y0, rows = 1;
    for (const kind of list) {
      if (kind === 'sep') { if (x > x0) x += sep; continue; }
      if (x > x0 && x + cell > x0 + width) { x = x0; y += cell + gap; rows++; }
      const v = counters[kind] = (counters[kind] ?? 0);
      counters[kind]++;
      this.items.push({ kind, v, x, y, w: cell });
      x += cell + gap;
    }
    return rows;
  }

  draw(g: Ctx, vw: number, vh: number, text: TextRenderer, ninePanel: (x: number, y: number, w: number, h: number) => void) {
    const touch = matchMedia('(pointer: coarse)').matches;
    const pad = 7, cell = touch ? 16 : 12, gap = 3, lh = text.lineHeight;
    const title = 'DOODLE WALL';
    const hint = touch ? 'Draw with your finger. B closes.' : '←→ colour   ↑↓ shape   Shift size   Z undo   X close';
    const availW = vw - 16 - pad * 2, availH = vh - SAFE.top - SAFE.bottom - 4 - pad * 2;

    // fit the board: integer upscale when possible, fractional downscale on small screens.
    // The toolbar/hint wrap depends on the width, so iterate until the layout is stable.
    let rows = 1, lines: string[] = [hint];
    let s = 1, w = this.W, h = this.H;
    for (let pass = 0; pass < 5; pass++) {
      const chrome = lh + 4 + gap * 2 + rows * (cell + gap) + lines.length * lh;
      s = Math.min(availW / this.W, (availH - chrome) / this.H);
      s = s >= 1 ? Math.floor(s) : Math.max(0.25, s);
      w = Math.round(this.W * s); h = Math.round(this.H * s);
      const nl = text.wrap(hint, w), nr = this.layoutItems(0, 0, w, cell);
      const stable = nl.length === lines.length && nr === rows;
      lines = nl; rows = nr;
      if (stable) break;
    }
    const toolbarH = rows * (cell + gap) - gap;
    const bottom = lines;
    const totalH = pad + lh + 4 + h + 6 + toolbarH + 6 + bottom.length * lh + pad;
    const px = ((vw - (w + pad * 2)) / 2) | 0;
    const py = (SAFE.top + 4 + Math.max(0, (availH + pad * 2 - totalH) / 2)) | 0;
    const x = px + pad, y = py + pad + lh + 4;
    this.rect = { x, y, w, h, s };
    this.layoutItems(x, y + h + 6, w, cell);

    g.fillStyle = 'rgba(10,8,20,0.55)'; g.fillRect(0, 0, vw, vh);
    ninePanel(px, py, w + pad * 2, totalH);
    text.draw(g, title, x, py + pad, { color: INK });

    g.imageSmoothingEnabled = s < 1;
    g.drawImage(this.surface, x, y, w, h);
    g.drawImage(this.preview, x, y, w, h);
    g.imageSmoothingEnabled = false;
    g.strokeStyle = INK; g.lineWidth = 1; g.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);

    for (const it of this.items) this.drawItem(g, it);

    let ty = y + h + 6 + toolbarH + 6;
    for (const line of bottom) { text.draw(g, line, x, ty, { color: '#7a6a55' }); ty += lh; }
  }

  private drawItem(g: Ctx, it: Item) {
    const { x, y, w } = it;
    const sel = it.kind === 'color' ? !this.eraser && it.v === this.color
      : it.kind === 'eraser' ? this.eraser
      : it.kind === 'tool' ? !this.eraser && TOOLS[it.v] === this.tool
      : it.kind === 'size' ? SIZES[it.v] === this.size : false;
    g.fillStyle = it.kind === 'color' ? PALETTE[it.v] : PAPER;
    g.fillRect(x, y, w, w);
    g.strokeStyle = sel ? '#e04c3a' : INK; g.lineWidth = sel ? 2 : 1;
    g.strokeRect(x + 0.5, y + 0.5, w - 1, w - 1);
    g.fillStyle = INK; g.strokeStyle = INK; g.lineWidth = 1;
    const m = 3, a = x + m, b = x + w - m, c = x + w / 2, d = y + m, e = y + w - m, f = y + w / 2;
    switch (it.kind) {
      case 'eraser': g.fillStyle = '#f78ab9'; g.fillRect(a, f - 1, b - a, 3); g.fillStyle = INK; g.fillRect(a, f + 2, b - a, 1); break;
      case 'tool':
        switch (TOOLS[it.v]) {
          case 'p': g.lineWidth = 2; g.beginPath(); g.moveTo(a + 2, e - 2); g.lineTo(b - 1, d + 1); g.stroke(); g.lineWidth = 1; g.fillRect(a, e - 1, 2, 1); g.fillRect(a, e - 2, 1, 2); break;
          case 'l': g.beginPath(); g.moveTo(a + 0.5, e - 0.5); g.lineTo(b - 0.5, d + 0.5); g.stroke(); break;
          case 'r': g.strokeRect(a + 0.5, d + 0.5, b - a - 1, e - d - 1); break;
          case 'R': g.fillRect(a, d, b - a, e - d); break;
          case 'o': g.beginPath(); g.ellipse(c, f, (b - a) / 2 - 0.5, (e - d) / 2 - 0.5, 0, 0, Math.PI * 2); g.stroke(); break;
          case 'O': g.beginPath(); g.ellipse(c, f, (b - a) / 2, (e - d) / 2, 0, 0, Math.PI * 2); g.fill(); break;
        }
        break;
      case 'size': { const r = SIZES[it.v] * (w >= 16 ? 1.5 : 1); g.beginPath(); g.arc(c, f, r, 0, Math.PI * 2); g.fill(); break; }
      case 'undo': {
        const r = (w - 7) / 2;
        g.beginPath(); g.arc(c, f + 0.5, r, Math.PI * 1.0, Math.PI * 2.5); g.stroke();
        g.beginPath(); g.moveTo(c - r - 2.5, f + 0.5); g.lineTo(c - r + 2.5, f + 0.5); g.lineTo(c - r, f - 3); g.closePath(); g.fill();
        break;
      }
    }
  }
}
