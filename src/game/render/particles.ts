// Lightweight particle pool: drifting leaves, footstep dust, fireflies,
// grass rustle, water splashes and slow cloud shadows.

import type { Anim } from '../assets/types';
import type { Ctx } from '../core/gfx';

export type ParticleKind = 'leaf' | 'dust' | 'firefly' | 'grass' | 'splash' | 'cloud' | 'spark' | 'rain' | 'snow';

export interface Particle {
  kind: ParticleKind;
  x: number; y: number; vx: number; vy: number;
  life: number; max: number;
  size: number;
  phase: number;
  anim?: Anim;
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
  cloud(x: number, y: number) {
    this.spawn({ kind: 'cloud', x, y, vx: 6 + Math.random() * 4, vy: 1.5, max: 120, size: 60 + Math.random() * 50 });
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
      const x = p.x - cam.x, y = p.y - cam.y;
      if (x < -p.size * 2 || y < -p.size || x > w + p.size * 2 || y > h + p.size) continue;
      const fade = Math.min(1, p.life / 6, (p.max - p.life) / 6);
      g.globalAlpha = 0.16 * fade;
      g.fillStyle = '#233';
      g.beginPath();
      g.ellipse(x, y, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      g.ellipse(x + p.size * 0.7, y + p.size * 0.2, p.size * 0.7, p.size * 0.4, 0, 0, Math.PI * 2);
      g.fill();
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
