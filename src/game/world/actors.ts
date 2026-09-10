// Grid-locked actors with smooth interpolation, Pokémon style. The player and
// every NPC/animal share this; only the controller differs.

import type { CharacterSheet, Dir } from '../assets/types';
import type { Ctx } from '../core/gfx';
import { TILE } from './world';

export const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

export class Actor {
  x: number; y: number;              // tile
  dir: Dir;
  moving = false;
  progress = 0;                      // px moved along current step
  speed = 2;                         // px per tick (60 Hz)
  animT = 0;                         // seconds walking, for frame selection
  wanderTimer = 1 + Math.random() * 3;
  frozen = 0;                        // seconds; NPC stands still (e.g. while talking)
  emote: { anim: string; t: number } | null = null;
  bob = 0;
  /** For single-facing sheets (animals): the direction the art faces; the opposite side is mirrored. */
  artFacing: Dir | null = null;

  constructor(
    public id: string,
    public sheet: CharacterSheet,
    x: number, y: number, dir: Dir = 'down',
    public home = { x, y },
    public wander = 0,
    public name = '',
  ) { this.x = x; this.y = y; this.dir = dir; }

  /** pixel position of the feet centre */
  get px() { const [dx] = DIRS[this.dir]; return this.x * TILE + TILE / 2 + (this.moving ? dx * this.progress : 0); }
  get py() { const [, dy] = DIRS[this.dir]; return this.y * TILE + TILE - 1 + (this.moving ? dy * this.progress : 0); }
  get sortY() { return this.py; }

  /** The tile in front of the actor. */
  facing(): [number, number] { const [dx, dy] = DIRS[this.dir]; return [this.x + dx, this.y + dy]; }
  /** Tile being moved into, or current tile. */
  target(): [number, number] { return this.moving ? this.facing() : [this.x, this.y]; }

  startStep(dir: Dir, canEnter: (x: number, y: number) => boolean): boolean {
    this.dir = dir;
    const [tx, ty] = this.facing();
    if (!canEnter(tx, ty)) return false;
    this.moving = true; this.progress = 0;
    return true;
  }

  /** Advance one 60 Hz tick. Returns true when a step completes. */
  tick(): boolean {
    if (this.emote && (this.emote.t -= 1 / 60) <= 0) this.emote = null;
    if (this.frozen > 0) this.frozen -= 1 / 60;
    if (!this.moving) { this.animT = 0; return false; }
    this.animT += 1 / 60;
    this.progress += this.speed;
    if (this.progress >= TILE) {
      const [dx, dy] = DIRS[this.dir];
      this.x += dx; this.y += dy; this.moving = false; this.progress = 0;
      return true;
    }
    return false;
  }

  frame(): { x: number; y: number } {
    const frames = this.sheet.walk[this.dir];
    if (!this.moving) return this.sheet.idle?.[this.dir] ?? frames[0];
    const fps = this.speed >= 4 ? 14 : 9;
    return frames[Math.floor(this.animT * fps) % frames.length];
  }

  draw(g: Ctx, img: HTMLImageElement, camX: number, camY: number, shadow?: { img: HTMLImageElement; x: number; y: number; w: number; h: number }) {
    const f = this.frame();
    const { frameW, frameH, feet } = this.sheet;
    const sx = (this.px - feet.x - camX) | 0;
    const sy = (this.py - feet.y - camY - this.bob) | 0;
    if (shadow) g.drawImage(shadow.img, shadow.x, shadow.y, shadow.w, shadow.h, (this.px - shadow.w / 2 - camX) | 0, (this.py - shadow.h + 2 - camY) | 0, shadow.w, shadow.h);
    const flip = this.artFacing && ((this.artFacing === 'right' && this.dir === 'left') || (this.artFacing === 'left' && this.dir === 'right'));
    if (flip) {
      g.save();
      g.translate(sx + frameW, sy);
      g.scale(-1, 1);
      g.drawImage(img, f.x, f.y, frameW, frameH, 0, 0, frameW, frameH);
      g.restore();
    } else {
      g.drawImage(img, f.x, f.y, frameW, frameH, sx, sy, frameW, frameH);
    }
  }
}
