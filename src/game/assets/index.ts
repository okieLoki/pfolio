// Stitches the per-slice manifests into the single Manifest the engine consumes.

import type { Manifest } from '../game';
import { TERRAINS, PIER } from './terrain';
import { PROPS, HOUSES } from './props';
import { CHARACTERS, ANIMALS, ANIMAL_FACING, MONSTERS, SHADOW } from './actors';
import { UI, FONT, FONT_BEARING, TTF, EMOTES, FX, OVERLAYS } from './ui';
import { MUSIC, SFX } from './audio';
import { FLOORS, FURNITURE, wallSet, type WallStyle } from './interior';

// Buildings block their wall rows too, not just the doorstep row; the roof row stays walk-behind.
const houses = Object.fromEntries(Object.entries(HOUSES).map(([k, h]) => {
  const rows = Math.round(h.prop.region.h / 16);
  const fh = Math.max(h.prop.footprint.h, Math.min(2, rows - 1));
  return [k, { ...h, prop: { ...h.prop, footprint: { ...h.prop.footprint, h: fh } } }];
})) as typeof HOUSES;

// wall ring pieces as ordinary solid props: wall_<style>_<piece>
const WALLS = Object.fromEntries((['beige', 'orange', 'brown', 'green'] as WallStyle[]).flatMap((style) =>
  Object.entries(wallSet(style)).map(([piece, region]) => [`wall_${style}_${piece}`, { name: 'Wall', region, footprint: { w: 1, h: 1 }, solid: true, tags: ['wall'] }])));

export const MANIFEST: Manifest = {
  terrains: { ...TERRAINS, ...FLOORS },
  props: { ...PROPS, ...PIER, ...FURNITURE, ...WALLS, stoneArch: { ...PROPS.stoneArch, solid: false } },
  houses,
  characters: CHARACTERS,
  animals: ANIMALS,
  animalFacing: ANIMAL_FACING,
  monsters: MONSTERS,
  shadow: SHADOW,
  ui: UI,
  font: FONT,
  fontBearing: FONT_BEARING,
  ttf: TTF,
  emotes: EMOTES,
  fx: FX,
  overlays: OVERLAYS,
  music: MUSIC,
  sfx: SFX,
};

export { CREDITS } from './audio';
