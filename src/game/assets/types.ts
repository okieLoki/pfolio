// Contract for the asset manifest. Every sprite the engine draws is described
// by one of these records, produced by analysing the Ninja Adventure pack
// (CC0, by Pixel-boy & AAA). `sheet` is always a URL under /game/.

export type Dir = 'down' | 'up' | 'left' | 'right';

/** A rectangle on a sheet, in pixels. */
export interface Region { sheet: string; x: number; y: number; w: number; h: number }

/** A strip of equally sized frames starting at (x,y), laid out to the right (default) or downward. */
export interface Anim { sheet: string; x: number; y: number; w: number; h: number; frames: number; dir?: 'right' | 'down'; fps: number }

/**
 * 13-tile autotile block (TilesetField style):
 *   3×3 block at (x,y):        [TL  T  TR]
 *                              [L   C  R ]
 *                              [BL  B  BR]
 *   2×2 inner-corner block at (ix,iy): [innerTL innerTR]
 *                                     [innerBL innerBR]
 * The engine composes any of the 47 shapes from 8×8 quadrants of these.
 */
export interface Autotile13 { kind: 'auto13'; sheet: string; x: number; y: number; ix: number; iy: number }

/**
 * 47-tile blob autotile (TilesetFloor / TilesetWater style): an explicit
 * lookup from an 8-bit neighbour mask to a tile. Bits: N=1, NE=2, E=4, SE=8,
 * S=16, SW=32, W=64, NW=128, set when that neighbour is the SAME terrain.
 * Diagonal bits are only meaningful when both adjacent cardinals are set;
 * the engine normalises masks before lookup, so only the 47 canonical masks
 * need entries. Missing masks fall back to `fill`.
 */
export interface AutotileBlob { kind: 'blob47'; sheet: string; tiles: Record<number, { x: number; y: number }>; fill: { x: number; y: number } }

export type Autotile = Autotile13 | AutotileBlob;

export interface Terrain {
  name: string;
  auto: Autotile;
  /** Draw order; higher terrains are drawn over lower ones. */
  priority: number;
  /** Optional plain variant tiles to sprinkle inside large fills (16×16). */
  variants?: { x: number; y: number }[];
  /** Optional animated overlay sprinkled onto this terrain (e.g. water ripples). */
  sparkle?: Anim;
  walkable: boolean;
  /** Player steps here can trigger wild encounters. */
  encounter?: boolean;
}

/** A free-standing sprite placed in the world (tree, house, sign, lamp...). */
export interface Prop {
  name: string;
  region: Region;
  /** Collision footprint in TILES, measured from the bottom-left of the sprite. */
  footprint: { w: number; h: number; ox?: number; oy?: number };
  solid: boolean;
  /** Draw above actors regardless of y (e.g. tree canopies handled by ySort; set true only for bridges/overhangs). */
  overhead?: boolean;
  anim?: Anim;
  /** Night-time emissive glow, in pixels relative to the sprite's bottom-left. */
  light?: { x: number; y: number; radius: number; color: string };
  tags?: string[];
}

export interface CharacterSheet {
  name: string;
  sheet: string;
  frameW: number;
  frameH: number;
  /** Walk frames per direction, in cycle order. Length ≥ 2. */
  walk: Record<Dir, { x: number; y: number }[]>;
  idle?: Record<Dir, { x: number; y: number }>;
  faceset?: Region;
  /** Pixel offset from the frame's top-left to the character's feet centre. */
  feet: { x: number; y: number };
}

export interface NineSlice { region: Region; inset: { l: number; t: number; r: number; b: number } }

export interface BitmapFont {
  region: Region;
  glyphW: number;
  glyphH: number;
  cols: number;
  /** Characters in sheet order, left-to-right, top-to-bottom. */
  charset: string;
  /** Per-glyph advance (visible width + 1) for proportional rendering. Defaults to glyphW. */
  advance?: Record<string, number>;
}

export interface AudioClip { url: string; volume?: number; loop?: boolean }
