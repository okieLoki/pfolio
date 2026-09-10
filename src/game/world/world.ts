// Runtime world: resolves a WorldDef against the asset manifests into a
// collision grid, interaction lookup, y-sorted prop instances, light sources
// and a pre-rendered ground layer.

import type { Prop, Terrain, Region as SheetRegion } from '../assets/types';
import { AutotileCache, N, NE, E, SE, S, SW, W, NW } from '../core/autotile';
import { makeCanvas, rng, type Ctx } from '../core/gfx';
import type { WorldDef, HousePlacement, NpcPlacement, SignPlacement } from './types';

export const TILE = 16;

export interface PropInstance {
  prop: Prop;
  /** pixel position of the sprite's top-left */
  px: number; py: number;
  /** pixel y used for depth sorting (bottom of footprint) */
  sortY: number;
  /** footprint tiles */
  tx: number; ty: number; tw: number; th: number;
  id?: string;
  text?: string;
  animT: number;
  house?: HousePlacement;
}

export type Interactable =
  | { type: 'door'; id: string; label: string; house: PropInstance }
  | { type: 'house'; id: string; label: string; house: PropInstance }
  | { type: 'sign'; id: string }
  | { type: 'prop'; id: string; inst: PropInstance };

export interface Light { x: number; y: number; radius: number; color: string; flicker?: boolean }

export interface WorldAssets {
  images: Map<string, HTMLImageElement>;
  terrains: Record<string, Terrain>;
  props: Record<string, Prop>;
  houses: Record<string, { prop: Prop; door: { tileX: number; tileY: number } }>;
}

export class World {
  readonly w: number;
  readonly h: number;
  readonly terrain: Terrain[];           // per cell
  readonly solid: Uint8Array;            // per cell, 1 = blocked
  readonly interact = new Map<string, Interactable>();
  readonly props: PropInstance[] = [];
  readonly lights: Light[] = [];
  readonly ground: HTMLCanvasElement;    // whole map, static
  readonly sparkles: { x: number; y: number; anim: NonNullable<Terrain['sparkle']>; t: number }[] = [];
  readonly npcs: NpcPlacement[];
  private autotiles: AutotileCache;

  constructor(public def: WorldDef, private assets: WorldAssets) {
    this.w = def.width; this.h = def.height;
    this.npcs = def.npcs;
    this.autotiles = new AutotileCache(assets.images);

    // terrain grid
    const base = assets.terrains[def.base];
    if (!base) throw new Error(`Unknown base terrain ${def.base}`);
    this.terrain = new Array(this.w * this.h).fill(base);
    def.ground.forEach((row, y) => {
      for (let x = 0; x < this.w; x++) {
        const ch = row[x] ?? ' ';
        const name = def.legend[ch];
        if (name && assets.terrains[name]) this.terrain[y * this.w + x] = assets.terrains[name];
      }
    });

    this.solid = new Uint8Array(this.w * this.h);
    for (let i = 0; i < this.solid.length; i++) if (!this.terrain[i].walkable) this.solid[i] = 1;

    // props & houses
    for (const p of def.props) {
      const prop = assets.props[p.name];
      if (!prop) { console.warn(`Unknown prop ${p.name}`); continue; }
      const inst = this.place(prop, p.x, p.y, p.id, p.text);
      if (p.id) for (let dx = 0; dx < inst.tw; dx++) for (let dy = 0; dy < inst.th; dy++) {
        this.interact.set(`${inst.tx + dx},${inst.ty + dy}`, { type: 'prop', id: p.id, inst });
      }
    }
    for (const hp of def.houses) {
      const h = assets.houses[hp.name];
      if (!h) { console.warn(`Unknown house ${hp.name}`); continue; }
      const inst = this.place(h.prop, hp.x, hp.y, hp.id);
      inst.house = hp;
      for (let dx = 0; dx < inst.tw; dx++) for (let dy = 0; dy < inst.th; dy++) {
        this.interact.set(`${inst.tx + dx},${inst.ty + dy}`, { type: 'house', id: hp.id, label: hp.label, house: inst });
      }
      const doorX = inst.tx + h.door.tileX, doorY = inst.ty + inst.th - 1 - h.door.tileY;
      this.interact.set(`${doorX},${doorY}`, { type: 'door', id: hp.id, label: hp.label, house: inst });
      // warm window light for every house at night
      this.lights.push({ x: inst.px + h.prop.region.w / 2, y: inst.py + h.prop.region.h - 12, radius: Math.max(28, h.prop.region.w * 0.6), color: '#ffb35c' });
    }
    for (const s of def.signs) this.interact.set(`${s.x},${s.y}`, { type: 'sign', id: s.id });

    this.props.sort((a, b) => a.sortY - b.sortY);
    this.ground = this.renderGround();
    this.seedSparkles();
  }

  private place(prop: Prop, tx: number, ty: number, id?: string, text?: string): PropInstance {
    const fp = prop.footprint;
    const ox = fp.ox ?? 0, oy = fp.oy ?? 0;
    // the sprite's bottom-left sits on tile (tx, ty); footprint may be offset within the sprite
    const px = tx * TILE - ox * TILE;
    const bottom = (ty + 1) * TILE + oy * TILE;
    const py = bottom - prop.region.h;
    const inst: PropInstance = { prop, px, py, sortY: bottom - 1, tx, ty: ty - fp.h + 1, tw: fp.w, th: fp.h, id, text, animT: Math.random() * 10 };
    if (prop.overhead) inst.sortY = 1e9;
    if (prop.tags?.some((t) => t === 'floor' || t === 'decal' || t === 'pier' || t === 'dock' || t === 'bridge')) inst.sortY = -1e9;
    const walkway = prop.tags?.some((t) => t === 'pier' || t === 'dock' || t === 'bridge');
    if (prop.solid || walkway) {
      for (let dx = 0; dx < fp.w; dx++) for (let dy = 0; dy < fp.h; dy++) {
        const cx = tx + dx, cy = ty - dy;
        if (cx >= 0 && cy >= 0 && cx < this.w && cy < this.h) this.solid[cy * this.w + cx] = walkway ? 0 : 1;
      }
    }
    if (prop.light) this.lights.push({ x: px + prop.light.x, y: bottom + prop.light.y, radius: prop.light.radius, color: prop.light.color, flicker: true });
    this.props.push(inst);
    return inst;
  }

  terrainAt(x: number, y: number): Terrain {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this.terrain[0];
    return this.terrain[y * this.w + x];
  }
  isSolid(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return true;
    return this.solid[y * this.w + x] === 1;
  }
  interactAt(x: number, y: number) { return this.interact.get(`${x},${y}`); }
  regionAt(x: number, y: number) {
    return this.def.regions?.find((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h);
  }

  /** Neighbour mask for terrain t at (x,y): same terrain OR any higher-priority terrain counts as "same". */
  private mask(x: number, y: number, t: Terrain) {
    const same = (nx: number, ny: number) => {
      if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) return true;
      const o = this.terrain[ny * this.w + nx];
      return o === t || o.priority > t.priority;
    };
    let m = 0;
    if (same(x, y - 1)) m |= N; if (same(x + 1, y - 1)) m |= NE; if (same(x + 1, y)) m |= E; if (same(x + 1, y + 1)) m |= SE;
    if (same(x, y + 1)) m |= S; if (same(x - 1, y + 1)) m |= SW; if (same(x - 1, y)) m |= W; if (same(x - 1, y - 1)) m |= NW;
    return m;
  }

  private renderGround(): HTMLCanvasElement {
    const [c, g] = makeCanvas(this.w * TILE, this.h * TILE);
    const rand = rng(1234);
    const base = this.assets.terrains[this.def.base];
    const order = [...new Set(this.terrain)].sort((a, b) => a.priority - b.priority);
    // base fill everywhere first, so transparent edge tiles reveal it
    const baseTile = this.autotiles.tile(base.name, base.auto, 255);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g.drawImage(baseTile, x * TILE, y * TILE);
    for (const t of order) {
      if (t === base) continue;
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.terrain[y * this.w + x] !== t) continue;
        const m = this.mask(x, y, t);
        let tile = this.autotiles.tile(t.name, t.auto, m);
        if (m === 255 && t.variants?.length && rand() < 0.12) {
          const v = t.variants[Math.floor(rand() * t.variants.length)];
          const img = this.assets.images.get(t.auto.sheet)!;
          g.drawImage(img, v.x, v.y, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
          continue;
        }
        g.drawImage(tile, x * TILE, y * TILE);
      }
    }
    // variants on the base terrain too
    if (base.variants?.length) {
      const img = this.assets.images.get(base.auto.sheet)!;
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.terrain[y * this.w + x] === base && rand() < 0.06) {
          const v = base.variants[Math.floor(rand() * base.variants.length)];
          g.drawImage(img, v.x, v.y, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
        }
      }
    }
    return c;
  }

  private seedSparkles() {
    const rand = rng(99);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const t = this.terrain[y * this.w + x];
      // only deep inside a body of water, where the ripple's own background matches the fill
      if (t.sparkle && this.mask(x, y, t) === 255 && rand() < 0.1) this.sparkles.push({ x: x * TILE, y: y * TILE, anim: t.sparkle, t: rand() * 4 });
    }
  }

  drawProp(g: Ctx, inst: PropInstance, time: number) {
    const img = this.assets.images.get(inst.prop.region.sheet)!;
    const r: SheetRegion = inst.prop.region;
    if (inst.prop.anim) {
      const a = inst.prop.anim;
      const f = Math.floor((time + inst.animT) * a.fps) % a.frames;
      const sx = a.dir === 'down' ? a.x : a.x + f * a.w;
      const sy = a.dir === 'down' ? a.y + f * a.h : a.y;
      g.drawImage(this.assets.images.get(a.sheet)!, sx, sy, a.w, a.h, inst.px, inst.py + (r.h - a.h), a.w, a.h);
      return;
    }
    g.drawImage(img, r.x, r.y, r.w, r.h, inst.px, inst.py, r.w, r.h);
  }
}
