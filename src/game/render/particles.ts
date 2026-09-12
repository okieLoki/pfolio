// Lightweight particle pool: drifting leaves, footstep dust, fireflies,
// grass rustle, water splashes and slow cloud shadows.

import type { Anim } from '../assets/types';
import type { Ctx } from '../core/gfx';
import { makeCanvas } from '../core/gfx';

export type ParticleKind = 'leaf' | 'dust' | 'firefly' | 'grass' | 'splash' | 'cloud' | 'spark' | 'rain' | 'snow';

export interface Particle {
  kind: ParticleKind;
  x: number; y: number; vx: number; vy: number;
  life: number; max: number;
  size: number;
  phase: number;
  anim?: Anim;
  img?: HTMLCanvasElement;
}

/** Cloud shadows are chunky pixel blobs (1 cell = 4 world px) so they sit in the art instead of on it. */
function cloudMask(): HTMLCanvasElement {
  const cw = 36 + (Math.random() * 20) | 0, ch = 18 + (Math.random() * 6) | 0;
  const [c, g] = makeCanvas(cw, ch);
  g.fillStyle = '#000';
  const blobs = 6 + (Math.random() * 4) | 0;
  for (let i = 0; i < blobs; i++) {
    const t = (i + 0.5) / blobs;
    const cx = 6 + t * (cw - 12) + (Math.random() - 0.5) * 4;
    const r = 3 + Math.random() * (ch / 2 - 5);            // always fits vertically
    const cy = r + 1 + Math.random() * (ch - 2 * r - 2);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const dx = (x + 0.5 - cx) / 1.6, dy = y + 0.5 - cy;   // wider than tall
      if (dx * dx + dy * dy <= r * r) g.fillRect(x, y, 1, 1);
    }
  }
  // knock off a few convex corner pixels so the outline is not a clean union of ellipses
  const data = g.getImageData(0, 0, cw, ch), d = data.data;
  const at = (x: number, y: number) => x >= 0 && y >= 0 && x < cw && y < ch && d[(y * cw + x) * 4 + 3] > 0;
  const kill: number[] = [];
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    if (!at(x, y)) continue;
    const empty = +!at(x - 1, y) + +!at(x + 1, y) + +!at(x, y - 1) + +!at(x, y + 1);
    if (empty >= 2 && Math.random() < 0.6) kill.push((y * cw + x) * 4 + 3);
  }
  for (const i of kill) d[i] = 0;
  g.putImageData(data, 0, 0);
  return c;
}

export class Particles {
  list: Particle[] = [];
  constructor(private images: Map<string, HTMLImageElement>, private fx: Record<string, Anim>) {}

  spawn(p: Omit<Particle, 'life' | 'phase'> & { phase?: number }) {
    if (this.list.length > 600) this.list.shift();
    this.list.push({ ...p, life: 0, phase: p.phase ?? Math.random() * Math.PI * 2 });
  }

  leaf(x: number, y: number, pink = false) {
    this.spawn({ kind: 'leaf', x, y, vx: -14 - Math.random() * 10, vy: 12 + Math.random() * 8, max: 7 + Math.random() * 4, size: 1, anim: this.fx[pink ? 'leafPink' : 'leaf'] });
  }
  dust(x: number, y: number) {
    for (let i = 0; i < 3; i++) this.spawn({ kind: 'dust', x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 2, vx: (Math.random() - 0.5) * 10, vy: -6 - Math.random() * 6, max: 0.35 + Math.random() * 0.2, size: 1 + Math.random() });
  }
  grass(x: number, y: number) {
    for (let i = 0; i < 4; i++) this.spawn({ kind: 'grass', x: x + (Math.random() - 0.5) * 10, y: y - 2, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 20, max: 0.5, size: 1, anim: this.fx.grass });
  }
  firefly(x: number, y: number) {
    this.spawn({ kind: 'firefly', x, y, vx: 0, vy: 0, max: 6 + Math.random() * 6, size: 1 });
  }
  splash(x: number, y: number) {
    for (let i = 0; i < 6; i++) this.spawn({ kind: 'splash', x, y, vx: (Math.random() - 0.5) * 40, vy: -30 - Math.random() * 30, max: 0.5, size: 1 });
  }
  private masks: HTMLCanvasElement[] = [];
  cloud(x: number, y: number) {
    if (this.masks.length < 6) this.masks.push(cloudMask());
    const img = this.masks[(Math.random() * this.masks.length) | 0];
    this.spawn({ kind: 'cloud', x, y, vx: 6 + Math.random() * 4, vy: 1.5, max: 120, size: 3 + Math.random() * 2, img });
  }
  rain(x: number, y: number, snow = false) {
    if (snow) this.spawn({ kind: 'snow', x, y, vx: -6, vy: 18 + Math.random() * 10, max: 6, size: 1 });
    else this.spawn({ kind: 'rain', x, y, vx: -40, vy: 260 + Math.random() * 60, max: 0.9, size: 1 });
  }
  spark(x: number, y: number) {
    this.spawn({ kind: 'spark', x, y, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, max: 0.6, size: 1, anim: this.fx.spark });
  }

  update(dt: number) {
    for (const p of this.list) {
      p.life += dt;
      switch (p.kind) {
        case 'leaf':
          p.x += (p.vx + Math.sin(p.life * 2 + p.phase) * 12) * dt;
          p.y += (p.vy + Math.cos(p.life * 1.5 + p.phase) * 6) * dt;
          break;
        case 'firefly':
          p.x += Math.sin(p.life * 1.3 + p.phase) * 10 * dt;
          p.y += Math.cos(p.life * 1.7 + p.phase * 1.3) * 8 * dt;
          break;
        case 'dust': case 'grass':
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; break;
        case 'splash': case 'spark':
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; break;
        case 'cloud': case 'rain':
          p.x += p.vx * dt; p.y += p.vy * dt; break;
        case 'snow':
          p.x += (p.vx + Math.sin(p.life * 2 + p.phase) * 10) * dt; p.y += p.vy * dt; break;
      }
    }
    this.list = this.list.filter((p) => p.life < p.max);
  }

  /** Ground-level layer (cloud shadows) — call before sprites. */
  drawShadows(g: Ctx, cam: { x: number; y: number }, w: number, h: number) {
    for (const p of this.list) {
      if (p.kind !== 'cloud') continue;
      const img = p.img!, sw = img.width * p.size, sh = img.height * p.size;
      // snap to the cell grid so the blob scrolls in whole pixels
      const x = Math.floor((p.x - cam.x) / p.size) * p.size, y = Math.floor((p.y - cam.y) / p.size) * p.size;
      if (x < -sw || y < -sh || x > w || y > h) continue;
      const fade = Math.min(1, p.life / 6, (p.max - p.life) / 6);
      g.globalAlpha = 0.13 * fade;
      g.imageSmoothingEnabled = false;
      g.drawImage(img, x, y, sw, sh);
      g.globalAlpha = 1;
    }
  }

  /** Airborne layer — call after sprites, before lighting. */
  draw(g: Ctx, cam: { x: number; y: number }, w: number, h: number, time: number) {
    for (const p of this.list) {
      const x = (p.x - cam.x) | 0, y = (p.y - cam.y) | 0;
      if (x < -20 || y < -20 || x > w + 20 || y > h + 20) continue;
      const t = p.life / p.max;
      switch (p.kind) {
        case 'leaf': case 'grass': case 'spark': {
          const a = p.anim;
          if (!a) break;
          const img = this.images.get(a.sheet);
          if (!img) break;
          const f = Math.floor((time * a.fps + p.phase * 3) % a.frames);
          const sx = a.dir === 'down' ? a.x : a.x + f * a.w, sy = a.dir === 'down' ? a.y + f * a.h : a.y;
          g.globalAlpha = p.kind === 'leaf' ? Math.min(1, (1 - t) * 4) : 1 - t;
          g.drawImage(img, sx, sy, a.w, a.h, x - (a.w >> 1), y - (a.h >> 1), a.w, a.h);
          g.globalAlpha = 1;
          break;
        }
        case 'dust':
          g.globalAlpha = (1 - t) * 0.6;
          g.fillStyle = '#f6e8c8';
          g.fillRect(x, y, p.size | 0 || 1, p.size | 0 || 1);
          g.globalAlpha = 1;
          break;
        case 'rain':
          g.globalAlpha = 0.55;
          g.fillStyle = '#dff0ff';
          g.fillRect(x, y, 1, 5);
          g.globalAlpha = 1;
          break;
        case 'snow':
          g.globalAlpha = 0.9;
          g.fillStyle = '#ffffff';
          g.fillRect(x, y, 2, 2);
          g.globalAlpha = 1;
          break;
        case 'splash':
          g.globalAlpha = 1 - t;
          g.fillStyle = '#dff4ff';
          g.fillRect(x, y, 1, 1);
          g.globalAlpha = 1;
          break;
        case 'firefly': {
          const pulse = 0.5 + 0.5 * Math.sin(time * 4 + p.phase * 5);
          const fade = Math.min(1, p.life, p.max - p.life);
          g.globalCompositeOperation = 'lighter';
          g.globalAlpha = 0.9 * pulse * fade;
          const grad = g.createRadialGradient(x, y, 0, x, y, 5);
          grad.addColorStop(0, '#f8ffb0');
          grad.addColorStop(0.3, '#c8f060');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = grad;
          g.fillRect(x - 5, y - 5, 10, 10);
          g.globalAlpha = 1;
          g.globalCompositeOperation = 'source-over';
          break;
        }
      }
    }
  }
}
