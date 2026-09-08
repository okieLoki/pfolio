// Indoor tiles and furniture (Ninja Adventure pack, CC0). Measured by hand
// from Interior/TilesetInteriorFloor.png, Interior/TilesetWallSimple.png,
// tileset_bed.png and TilesetElement.png (the last is already in /game/props).

import type { Prop, Region, Terrain } from './types';

const FLOOR = '/game/interior/TilesetInteriorFloor.png';
const WALL = '/game/interior/TilesetWallSimple.png';
const BED = '/game/interior/tileset_bed.png';
const ELEM = '/game/props/TilesetElement.png';

/** A plain, seamlessly repeating floor: every mask maps to the same tile. */
const plain = (name: string, label: string, x: number, y: number, priority = 1): Terrain => ({
  name: label,
  auto: { kind: 'blob47', sheet: FLOOR, tiles: {}, fill: { x, y } },
  priority,
  walkable: true,
});

export const FLOORS: Record<string, Terrain> = {
  floorPlanks: plain('floorPlanks', 'Wooden planks', 32, 208),
  floorPlanksDark: plain('floorPlanksDark', 'Dark planks', 240, 224),
  floorCream: plain('floorCream', 'Cream tiles', 16, 32),
  floorTan: plain('floorTan', 'Tan panels', 208, 32),
  floorGreen: plain('floorGreen', 'Green panels', 208, 128),
  floorOrange: plain('floorOrange', 'Orange tiles', 16, 128),
};

export type WallStyle = 'beige' | 'orange' | 'brown' | 'green';
const wallOrigin: Record<WallStyle, [number, number]> = { beige: [0, 0], orange: [80, 0], brown: [0, 96], green: [80, 96] };

/** Wall ring pieces for a room, as 16×16 regions. */
export function wallSet(style: WallStyle): Record<'tl' | 't' | 'tr' | 'l' | 'r' | 'bl' | 'b' | 'br', Region> {
  const [bx, by] = wallOrigin[style];
  const r = (x: number, y: number): Region => ({ sheet: WALL, x: bx + x, y: by + y, w: 16, h: 16 });
  return { tl: r(0, 0), t: r(16, 0), tr: r(64, 0), l: r(0, 16), r: r(64, 16), bl: r(0, 64), b: r(16, 64), br: r(64, 64) };
}

const P = (name: string, sheet: string, x: number, y: number, w: number, h: number, fw: number, fh: number, solid = true, extra: Partial<Prop> = {}): Prop =>
  ({ name, region: { sheet, x, y, w, h }, footprint: { w: fw, h: fh }, solid, ...extra });

export const FURNITURE: Record<string, Prop> = {
  // shelves & storage
  bookshelfFull: P('Bookshelf', ELEM, 128, 112, 32, 32, 2, 1),
  bookshelfEmpty: P('Empty bookshelf', ELEM, 160, 112, 32, 32, 2, 1),
  cabinetBooksA: P('Book cabinet', ELEM, 48, 112, 16, 32, 1, 1),
  cabinetBooksB: P('Book cabinet', ELEM, 64, 112, 16, 32, 1, 1),
  cupboardA: P('Cupboard', ELEM, 16, 112, 16, 32, 1, 1),
  cupboardB: P('Cupboard', ELEM, 32, 112, 16, 32, 1, 1),
  dresser: P('Dresser', ELEM, 96, 112, 32, 32, 2, 1),
  shelfWoodTall: P('Wooden shelf', BED, 128, 96, 32, 48, 2, 1),
  // tables & seats
  deskSmall: P('Desk', ELEM, 80, 112, 16, 32, 1, 1),
  tableLow: P('Low table', ELEM, 176, 32, 48, 16, 3, 1),
  chairSmall: P('Chair', ELEM, 0, 144, 16, 16, 1, 1),
  cushion: P('Cushion', ELEM, 112, 160, 16, 16, 1, 1, false),
  // beds
  bedOrange: P('Bed', BED, 0, 0, 32, 48, 2, 2),
  bedGreen: P('Bed', BED, 128, 0, 32, 48, 2, 2),
  bedRed: P('Bed', BED, 0, 64, 32, 48, 2, 2),
  bedBlue: P('Bed', BED, 128, 64, 32, 48, 2, 2),
  bedSmallBlue: P('Small bed', BED, 208, 64, 16, 32, 1, 1),
  // decor
  plantPotTall: P('Potted plant', ELEM, 0, 112, 16, 32, 1, 1),
  vaseBig: P('Vase', ELEM, 32, 144, 16, 16, 1, 1),
  paintingSmall: P('Painting', ELEM, 48, 144, 16, 16, 1, 1, false),
  scrollWall: P('Scroll', ELEM, 64, 144, 16, 16, 1, 1, false),
  curtainRed: P('Curtain', ELEM, 128, 144, 16, 16, 1, 1, false),
  curtainsRedWide: P('Curtains', ELEM, 144, 144, 32, 16, 2, 1, false),
  tatamiMat: P('Tatami mat', ELEM, 208, 64, 48, 48, 3, 3, false, { tags: ['floor'] }),
  doorMat: P('Door mat', BED, 80, 96, 16, 32, 1, 1, false, { tags: ['floor'] }),
  doorLight: P('Door', ELEM, 96, 192, 16, 32, 1, 1, false),
  doorDark: P('Door', ELEM, 128, 192, 16, 32, 1, 1, false),
  windowLight: P('Window', ELEM, 96, 224, 16, 16, 1, 1, false),
  windowDark: P('Window', ELEM, 128, 224, 16, 16, 1, 1, false),
  lanternFloor: P('Floor lantern', ELEM, 224, 0, 16, 32, 1, 1, true, { light: { x: 8, y: -14, radius: 40, color: '#ffc27a' } }),
};
