// A map definition. Authored by hand (see town.ts); everything positional is
// in TILES with (0,0) top-left. Props and houses are anchored by the
// bottom-left tile of their footprint, matching the manifest's Prop.footprint.

import type { Dir } from '../assets/types';

export interface PropPlacement { name: string; x: number; y: number; id?: string; text?: string }
export interface HousePlacement { name: string; x: number; y: number; id: string; label: string }
export interface NpcPlacement {
  id: string;
  /** key in CHARACTERS or ANIMALS */
  char: string;
  kind?: 'character' | 'animal';
  x: number; y: number;
  dir?: Dir;
  /** wander radius in tiles; 0 = stands still */
  wander?: number;
  /** display name for the dialogue name tag */
  name?: string;
}
export interface SignPlacement { x: number; y: number; id: string }
/** Stepping onto (x,y) moves the player to another map. */
export interface Warp { x: number; y: number; map: string; tx: number; ty: number; dir: Dir }
export interface Region { name: string; x: number; y: number; w: number; h: number }

export interface WorldDef {
  name: string;
  width: number;
  height: number;
  /** terrain name that fills the whole map beneath everything (e.g. 'sand') */
  base: string;
  /** exactly `height` strings of `width` chars; each char maps through `legend` to a terrain name */
  ground: string[];
  legend: Record<string, string>;
  props: PropPlacement[];
  houses: HousePlacement[];
  npcs: NpcPlacement[];
  /** interactable tiles that aren't a house door (sign posts, notice boards, mailbox) — the id is resolved to text by content.ts */
  signs: SignPlacement[];
  /** free-flying ambience: butterflies etc. spawn inside these rects */
  flutter?: Region[];
  regions?: Region[];
  warps?: Warp[];
  /** interiors: no weather, cosy lighting */
  indoor?: boolean;
  spawn: { x: number; y: number; dir: Dir };
}
