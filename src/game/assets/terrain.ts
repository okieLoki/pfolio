// Terrain slice of the Ninja Adventure asset manifest (CC0, Pixel-boy & AAA).
// Generated from pixel analysis - see catalogue/build_terrain.py + decode.py.
//
// Source sheets (copied verbatim to /public/game/terrain/):
//   TilesetField.png  (80x240)  five 13-tile autotiles: 3x3 block at (0, b*48), 2x2 inner corners at (48, b*48)
//                     b = 0 orange sand, 1 light grass, 2 dark grass, 3 rose, 4 snow.  Edges are transparent
//                     outside a dark outline, so they layer over any base.
//   TilesetFloor.png  (352x417) six 47-tile blob autotiles (11x5 cells each, origins (0,0) (176,0) (0,112)
//                     (176,112) (0,224) (176,224)) + two 46-tile clover-pattern blobs at (0,336) (176,336).
//                     Blob tiles are fully opaque: the area outside the wavy edge is painted in the base colour
//                     the blob was designed for (path -> Field sand, dirt -> Field grass, dirtDark -> Field dark
//                     grass, pathRose -> Field rose, snowDrift -> pale grey, dirtBrown -> tan, patterns -> white).
//   TilesetWater.png  (448x272) four 47-tile water blobs (origins (0,0) sand shore, (208,0) snow/ice shore,
//                     (0,96) grass shore, (208,96) purple on brown earth), 16x16 variant tiles in the column
//                     right of each top blob, wooden pier pieces in rows 12-16, boat/post props, and two OPAQUE
//                     boulder-in-water tiles at (192,0) [plain blue] and (384,0) [icy pattern].
//   Animated/Water Ripples/SpriteSheet16x16.png + SpriteSheetPurple.png (64x16, 4 frames) - sparkle overlays.
//
// Blob decoding method (decode.py): every 16x16 cell of a blob group is classified pixel-by-pixel into
// "interior" (the blob's fill palette) vs "exterior" (edge + base colours). A cardinal neighbour bit is set iff
// the tile's edge line on that side (ignoring the two end pixels) carries at least one interior pixel - an edge
// facing foreign terrain is covered by an unbroken exterior band, an edge facing the same terrain is interior
// except where inner-corner discs cut it. A diagonal bit is set iff the corner pixel itself is interior. After
// normalising (diagonals only count when both adjacent cardinals are set) every group yields exactly the 47
// distinct canonical masks (46 for the pattern blobs, which lack an isolated tile; mask 0 falls back to fill).
// All groups share the same cell layout. Seams were verified by compositing random maps (verify_seams.py).
// waterGrass / waterPurple omit mask 0 on purpose: the pack fills that slot with a dry sand / earth spot that
// contains no water, so an isolated cell falls back to the plain fill instead (avoid 1-cell ponds there).
//
// Engine notes:
//  * Every PIER piece is tagged 'floor': the player stands ON it, and the contract has no floor flag, so the
//    renderer must draw 'floor'-tagged props in the ground pass (beneath actors) rather than y-sorting them by
//    bottom edge - a 16px prop y-sorted normally covers the feet of whoever stands on it. (world.ts already
//    clears collision for 'pier'.)
//  * The boulder tiles (192,0) / (384,0) are fully opaque water tiles: the pixels around the rock ARE the plain
//    fill of `water`/`waterGrass` and the icy fill of `waterIce` (measured pixel-identical). They are listed as
//    variants of those terrains (drawn only on mask-255 cells) and also as 'water-only' WATER_PROPS for manual
//    placement - never put them on a shore tile or on land.
//  * The 4x4 pier deck has hand-drawn nail marks that straddle its tile seams; the 1x1 deck kit therefore has
//    A/B alternates and a clean centre piece - see the comment above `pierDeck`.
//
// Deliberately skipped: TilesetFloor rows 5-6 of each group (plain base tile + 4 decorated base variants and
// 6 grass-on-sand transition strips - they belong to the Field terrains but live on another sheet, and
// Terrain.variants must share the autotile's sheet); the plain deep-blue tile (176,0); the snow-group
// boat/post duplicates; TilesetFloorB/Detail/Relief (not in this slice).

import type { Terrain, Prop } from './types';

export const TERRAINS = {
  sand: {
    name: 'Sand',
    auto: {
      kind: 'auto13',
      sheet: '/game/terrain/TilesetField.png',
      x: 0,
      y: 0,
      ix: 48,
      iy: 0,
    },
    priority: 0,
    walkable: true,
  },
  path: {
    name: 'Sand path',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetFloor.png',
      tiles: {
        0: { x: 48, y: 48 }, // none (isolated)
        1: { x: 48, y: 32 }, // N
        4: { x: 0, y: 48 }, // E
        5: { x: 64, y: 48 }, // N E
        7: { x: 0, y: 32 }, // N NE E
        16: { x: 48, y: 0 }, // S
        17: { x: 48, y: 16 }, // N S
        20: { x: 64, y: 0 }, // E S
        21: { x: 64, y: 64 }, // N E S
        23: { x: 64, y: 16 }, // N NE E S
        28: { x: 0, y: 0 }, // E SE S
        29: { x: 64, y: 32 }, // N E SE S
        31: { x: 0, y: 16 }, // N NE E SE S
        64: { x: 32, y: 48 }, // W
        65: { x: 112, y: 48 }, // N W
        68: { x: 16, y: 48 }, // E W
        69: { x: 128, y: 48 }, // N E W
        71: { x: 96, y: 48 }, // N NE E W
        80: { x: 112, y: 0 }, // S W
        81: { x: 112, y: 64 }, // N S W
        84: { x: 128, y: 0 }, // E S W
        85: { x: 128, y: 64 }, // N E S W
        87: { x: 144, y: 48 }, // N NE E S W
        92: { x: 96, y: 0 }, // E SE S W
        93: { x: 144, y: 32 }, // N E SE S W
        95: { x: 96, y: 64 }, // N NE E SE S W
        112: { x: 32, y: 0 }, // S SW W
        113: { x: 112, y: 32 }, // N S SW W
        116: { x: 80, y: 0 }, // E S SW W
        117: { x: 160, y: 32 }, // N E S SW W
        119: { x: 144, y: 16 }, // N NE E S SW W
        124: { x: 16, y: 0 }, // E SE S SW W
        125: { x: 128, y: 32 }, // N E SE S SW W
        127: { x: 96, y: 32 }, // N NE E SE S SW W
        193: { x: 32, y: 32 }, // N W NW
        197: { x: 80, y: 48 }, // N E W NW
        199: { x: 16, y: 32 }, // N NE E W NW
        209: { x: 112, y: 16 }, // N S W NW
        213: { x: 160, y: 48 }, // N E S W NW
        215: { x: 128, y: 16 }, // N NE E S W NW
        221: { x: 144, y: 0 }, // N E SE S W NW
        223: { x: 96, y: 16 }, // N NE E SE S W NW
        241: { x: 32, y: 16 }, // N S SW W NW
        245: { x: 80, y: 64 }, // N E S SW W NW
        247: { x: 80, y: 16 }, // N NE E S SW W NW
        253: { x: 80, y: 32 }, // N E SE S SW W NW
        255: { x: 16, y: 16 }, // N NE E SE S SW W NW
      },
      fill: { x: 16, y: 16 },
    },
    priority: 1,
    variants: [{ x: 0, y: 64 }, { x: 16, y: 64 }],
    walkable: true,
  },
  pathRose: {
    name: 'Sand path on rose',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetFloor.png',
      tiles: {
        0: { x: 224, y: 48 }, // none (isolated)
        1: { x: 224, y: 32 }, // N
        4: { x: 176, y: 48 }, // E
        5: { x: 240, y: 48 }, // N E
        7: { x: 176, y: 32 }, // N NE E
        16: { x: 224, y: 0 }, // S
        17: { x: 224, y: 16 }, // N S
        20: { x: 240, y: 0 }, // E S
        21: { x: 240, y: 64 }, // N E S
        23: { x: 240, y: 16 }, // N NE E S
        28: { x: 176, y: 0 }, // E SE S
        29: { x: 240, y: 32 }, // N E SE S
        31: { x: 176, y: 16 }, // N NE E SE S
        64: { x: 208, y: 48 }, // W
        65: { x: 288, y: 48 }, // N W
        68: { x: 192, y: 48 }, // E W
        69: { x: 304, y: 48 }, // N E W
        71: { x: 272, y: 48 }, // N NE E W
        80: { x: 288, y: 0 }, // S W
        81: { x: 288, y: 64 }, // N S W
        84: { x: 304, y: 0 }, // E S W
        85: { x: 304, y: 64 }, // N E S W
        87: { x: 320, y: 48 }, // N NE E S W
        92: { x: 272, y: 0 }, // E SE S W
        93: { x: 320, y: 32 }, // N E SE S W
        95: { x: 272, y: 64 }, // N NE E SE S W
        112: { x: 208, y: 0 }, // S SW W
        113: { x: 288, y: 32 }, // N S SW W
        116: { x: 256, y: 0 }, // E S SW W
        117: { x: 336, y: 32 }, // N E S SW W
        119: { x: 320, y: 16 }, // N NE E S SW W
        124: { x: 192, y: 0 }, // E SE S SW W
        125: { x: 304, y: 32 }, // N E SE S SW W
        127: { x: 272, y: 32 }, // N NE E SE S SW W
        193: { x: 208, y: 32 }, // N W NW
        197: { x: 256, y: 48 }, // N E W NW
        199: { x: 192, y: 32 }, // N NE E W NW
        209: { x: 288, y: 16 }, // N S W NW
        213: { x: 336, y: 48 }, // N E S W NW
        215: { x: 304, y: 16 }, // N NE E S W NW
        221: { x: 320, y: 0 }, // N E SE S W NW
        223: { x: 272, y: 16 }, // N NE E SE S W NW
        241: { x: 208, y: 16 }, // N S SW W NW
        245: { x: 256, y: 64 }, // N E S SW W NW
        247: { x: 256, y: 16 }, // N NE E S SW W NW
        253: { x: 256, y: 32 }, // N E SE S SW W NW
        255: { x: 192, y: 16 }, // N NE E SE S SW W NW
      },
      fill: { x: 192, y: 16 },
    },
    priority: 1,
    variants: [{ x: 176, y: 64 }, { x: 192, y: 64 }],
    walkable: true,
  },
  grass: {
    name: 'Grass',
    auto: {
      kind: 'auto13',
      sheet: '/game/terrain/TilesetField.png',
      x: 0,
      y: 48,
      ix: 48,
      iy: 48,
    },
    priority: 2,
    walkable: true,
  },
  rose: {
    name: 'Rose petals',
    auto: {
      kind: 'auto13',
      sheet: '/game/terrain/TilesetField.png',
      x: 0,
      y: 144,
      ix: 48,
      iy: 144,
    },
    priority: 2,
    walkable: true,
  },
  snow: {
    name: 'Snow',
    auto: {
      kind: 'auto13',
      sheet: '/game/terrain/TilesetField.png',
      x: 0,
      y: 192,
      ix: 48,
      iy: 192,
    },
    priority: 2,
    walkable: true,
  },
  grassDark: {
    name: 'Tall grass',
    auto: {
      kind: 'auto13',
      sheet: '/game/terrain/TilesetField.png',
      x: 0,
      y: 96,
      ix: 48,
      iy: 96,
    },
    priority: 3,
    walkable: true,
    encounter: true,
  },
  dirt: {
    name: 'Dirt on grass',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetFloor.png',
      tiles: {
        0: { x: 48, y: 160 }, // none (isolated)
        1: { x: 48, y: 144 }, // N
        4: { x: 0, y: 160 }, // E
        5: { x: 64, y: 160 }, // N E
        7: { x: 0, y: 144 }, // N NE E
        16: { x: 48, y: 112 }, // S
        17: { x: 48, y: 128 }, // N S
        20: { x: 64, y: 112 }, // E S
        21: { x: 64, y: 176 }, // N E S
        23: { x: 64, y: 128 }, // N NE E S
        28: { x: 0, y: 112 }, // E SE S
        29: { x: 64, y: 144 }, // N E SE S
        31: { x: 0, y: 128 }, // N NE E SE S
        64: { x: 32, y: 160 }, // W
        65: { x: 112, y: 160 }, // N W
        68: { x: 16, y: 160 }, // E W
        69: { x: 128, y: 160 }, // N E W
        71: { x: 96, y: 160 }, // N NE E W
        80: { x: 112, y: 112 }, // S W
        81: { x: 112, y: 176 }, // N S W
        84: { x: 128, y: 112 }, // E S W
        85: { x: 128, y: 176 }, // N E S W
        87: { x: 144, y: 160 }, // N NE E S W
        92: { x: 96, y: 112 }, // E SE S W
        93: { x: 144, y: 144 }, // N E SE S W
        95: { x: 96, y: 176 }, // N NE E SE S W
        112: { x: 32, y: 112 }, // S SW W
        113: { x: 112, y: 144 }, // N S SW W
        116: { x: 80, y: 112 }, // E S SW W
        117: { x: 160, y: 144 }, // N E S SW W
        119: { x: 144, y: 128 }, // N NE E S SW W
        124: { x: 16, y: 112 }, // E SE S SW W
        125: { x: 128, y: 144 }, // N E SE S SW W
        127: { x: 96, y: 144 }, // N NE E SE S SW W
        193: { x: 32, y: 144 }, // N W NW
        197: { x: 80, y: 160 }, // N E W NW
        199: { x: 16, y: 144 }, // N NE E W NW
        209: { x: 112, y: 128 }, // N S W NW
        213: { x: 160, y: 160 }, // N E S W NW
        215: { x: 128, y: 128 }, // N NE E S W NW
        221: { x: 144, y: 112 }, // N E SE S W NW
        223: { x: 96, y: 128 }, // N NE E SE S W NW
        241: { x: 32, y: 128 }, // N S SW W NW
        245: { x: 80, y: 176 }, // N E S SW W NW
        247: { x: 80, y: 128 }, // N NE E S SW W NW
        253: { x: 80, y: 144 }, // N E SE S SW W NW
        255: { x: 16, y: 128 }, // N NE E SE S SW W NW
      },
      fill: { x: 16, y: 128 },
    },
    priority: 4,
    variants: [{ x: 0, y: 176 }, { x: 16, y: 176 }],
    walkable: true,
  },
  dirtDark: {
    name: 'Dirt on tall grass',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetFloor.png',
      tiles: {
        0: { x: 224, y: 160 }, // none (isolated)
        1: { x: 224, y: 144 }, // N
        4: { x: 176, y: 160 }, // E
        5: { x: 240, y: 160 }, // N E
        7: { x: 176, y: 144 }, // N NE E
        16: { x: 224, y: 112 }, // S
        17: { x: 224, y: 128 }, // N S
        20: { x: 240, y: 112 }, // E S
        21: { x: 240, y: 176 }, // N E S
        23: { x: 240, y: 128 }, // N NE E S
        28: { x: 176, y: 112 }, // E SE S
        29: { x: 240, y: 144 }, // N E SE S
        31: { x: 176, y: 128 }, // N NE E SE S
        64: { x: 208, y: 160 }, // W
        65: { x: 288, y: 160 }, // N W
        68: { x: 192, y: 160 }, // E W
        69: { x: 304, y: 160 }, // N E W
        71: { x: 272, y: 160 }, // N NE E W
        80: { x: 288, y: 112 }, // S W
        81: { x: 288, y: 176 }, // N S W
        84: { x: 304, y: 112 }, // E S W
        85: { x: 304, y: 176 }, // N E S W
        87: { x: 320, y: 160 }, // N NE E S W
        92: { x: 272, y: 112 }, // E SE S W
        93: { x: 320, y: 144 }, // N E SE S W
        95: { x: 272, y: 176 }, // N NE E SE S W
        112: { x: 208, y: 112 }, // S SW W
        113: { x: 288, y: 144 }, // N S SW W
        116: { x: 256, y: 112 }, // E S SW W
        117: { x: 336, y: 144 }, // N E S SW W
        119: { x: 320, y: 128 }, // N NE E S SW W
        124: { x: 192, y: 112 }, // E SE S SW W
        125: { x: 304, y: 144 }, // N E SE S SW W
        127: { x: 272, y: 144 }, // N NE E SE S SW W
        193: { x: 208, y: 144 }, // N W NW
        197: { x: 256, y: 160 }, // N E W NW
        199: { x: 192, y: 144 }, // N NE E W NW
        209: { x: 288, y: 128 }, // N S W NW
        213: { x: 336, y: 160 }, // N E S W NW
        215: { x: 304, y: 128 }, // N NE E S W NW
        221: { x: 320, y: 112 }, // N E SE S W NW
        223: { x: 272, y: 128 }, // N NE E SE S W NW
        241: { x: 208, y: 128 }, // N S SW W NW
        245: { x: 256, y: 176 }, // N E S SW W NW
        247: { x: 256, y: 128 }, // N NE E S SW W NW
        253: { x: 256, y: 144 }, // N E SE S SW W NW
        255: { x: 192, y: 128 }, // N NE E SE S SW W NW
      },
      fill: { x: 192, y: 128 },
    },
    priority: 4,
    variants: [{ x: 176, y: 176 }, { x: 192, y: 176 }],
    walkable: true,
  },
  snowDrift: {
    name: 'Snow drift',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetFloor.png',
      tiles: {
        0: { x: 48, y: 272 }, // none (isolated)
        1: { x: 48, y: 256 }, // N
        4: { x: 0, y: 272 }, // E
        5: { x: 64, y: 272 }, // N E
        7: { x: 0, y: 256 }, // N NE E
        16: { x: 48, y: 224 }, // S
        17: { x: 48, y: 240 }, // N S
        20: { x: 64, y: 224 }, // E S
        21: { x: 64, y: 288 }, // N E S
        23: { x: 64, y: 240 }, // N NE E S
        28: { x: 0, y: 224 }, // E SE S
        29: { x: 64, y: 256 }, // N E SE S
        31: { x: 0, y: 240 }, // N NE E SE S
        64: { x: 32, y: 272 }, // W
        65: { x: 112, y: 272 }, // N W
        68: { x: 16, y: 272 }, // E W
        69: { x: 128, y: 272 }, // N E W
        71: { x: 96, y: 272 }, // N NE E W
        80: { x: 112, y: 224 }, // S W
        81: { x: 112, y: 288 }, // N S W
        84: { x: 128, y: 224 }, // E S W
        85: { x: 128, y: 288 }, // N E S W
        87: { x: 144, y: 272 }, // N NE E S W
        92: { x: 96, y: 224 }, // E SE S W
        93: { x: 144, y: 256 }, // N E SE S W
        95: { x: 96, y: 288 }, // N NE E SE S W
        112: { x: 32, y: 224 }, // S SW W
        113: { x: 112, y: 256 }, // N S SW W
        116: { x: 80, y: 224 }, // E S SW W
        117: { x: 160, y: 256 }, // N E S SW W
        119: { x: 144, y: 240 }, // N NE E S SW W
        124: { x: 16, y: 224 }, // E SE S SW W
        125: { x: 128, y: 256 }, // N E SE S SW W
        127: { x: 96, y: 256 }, // N NE E SE S SW W
        193: { x: 32, y: 256 }, // N W NW
        197: { x: 80, y: 272 }, // N E W NW
        199: { x: 16, y: 256 }, // N NE E W NW
        209: { x: 112, y: 240 }, // N S W NW
        213: { x: 160, y: 272 }, // N E S W NW
        215: { x: 128, y: 240 }, // N NE E S W NW
        221: { x: 144, y: 224 }, // N E SE S W NW
        223: { x: 96, y: 240 }, // N NE E SE S W NW
        241: { x: 32, y: 240 }, // N S SW W NW
        245: { x: 80, y: 288 }, // N E S SW W NW
        247: { x: 80, y: 240 }, // N NE E S SW W NW
        253: { x: 80, y: 256 }, // N E SE S SW W NW
        255: { x: 16, y: 240 }, // N NE E SE S SW W NW
      },
      fill: { x: 16, y: 240 },
    },
    priority: 4,
    variants: [{ x: 0, y: 288 }, { x: 16, y: 288 }],
    walkable: true,
  },
  dirtBrown: {
    name: 'Brown earth',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetFloor.png',
      tiles: {
        0: { x: 224, y: 272 }, // none (isolated)
        1: { x: 224, y: 256 }, // N
        4: { x: 176, y: 272 }, // E
        5: { x: 240, y: 272 }, // N E
        7: { x: 176, y: 256 }, // N NE E
        16: { x: 224, y: 224 }, // S
        17: { x: 224, y: 240 }, // N S
        20: { x: 240, y: 224 }, // E S
        21: { x: 240, y: 288 }, // N E S
        23: { x: 240, y: 240 }, // N NE E S
        28: { x: 176, y: 224 }, // E SE S
        29: { x: 240, y: 256 }, // N E SE S
        31: { x: 176, y: 240 }, // N NE E SE S
        64: { x: 208, y: 272 }, // W
        65: { x: 288, y: 272 }, // N W
        68: { x: 192, y: 272 }, // E W
        69: { x: 304, y: 272 }, // N E W
        71: { x: 272, y: 272 }, // N NE E W
        80: { x: 288, y: 224 }, // S W
        81: { x: 288, y: 288 }, // N S W
        84: { x: 304, y: 224 }, // E S W
        85: { x: 304, y: 288 }, // N E S W
        87: { x: 320, y: 272 }, // N NE E S W
        92: { x: 272, y: 224 }, // E SE S W
        93: { x: 320, y: 256 }, // N E SE S W
        95: { x: 272, y: 288 }, // N NE E SE S W
        112: { x: 208, y: 224 }, // S SW W
        113: { x: 288, y: 256 }, // N S SW W
        116: { x: 256, y: 224 }, // E S SW W
        117: { x: 336, y: 256 }, // N E S SW W
        119: { x: 320, y: 240 }, // N NE E S SW W
        124: { x: 192, y: 224 }, // E SE S SW W
        125: { x: 304, y: 256 }, // N E SE S SW W
        127: { x: 272, y: 256 }, // N NE E SE S SW W
        193: { x: 208, y: 256 }, // N W NW
        197: { x: 256, y: 272 }, // N E W NW
        199: { x: 192, y: 256 }, // N NE E W NW
        209: { x: 288, y: 240 }, // N S W NW
        213: { x: 336, y: 272 }, // N E S W NW
        215: { x: 304, y: 240 }, // N NE E S W NW
        221: { x: 320, y: 224 }, // N E SE S W NW
        223: { x: 272, y: 240 }, // N NE E SE S W NW
        241: { x: 208, y: 240 }, // N S SW W NW
        245: { x: 256, y: 288 }, // N E S SW W NW
        247: { x: 256, y: 240 }, // N NE E S SW W NW
        253: { x: 256, y: 256 }, // N E SE S SW W NW
        255: { x: 192, y: 240 }, // N NE E SE S SW W NW
      },
      fill: { x: 192, y: 240 },
    },
    priority: 4,
    variants: [{ x: 176, y: 288 }, { x: 192, y: 288 }],
    walkable: true,
  },
  patternBlue: {
    name: 'Blue clover pattern',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetFloor.png',
      tiles: {
        1: { x: 48, y: 368 }, // N
        4: { x: 0, y: 384 }, // E
        5: { x: 64, y: 384 }, // N E
        7: { x: 0, y: 368 }, // N NE E
        16: { x: 48, y: 336 }, // S
        17: { x: 48, y: 352 }, // N S
        20: { x: 64, y: 336 }, // E S
        21: { x: 64, y: 400 }, // N E S
        23: { x: 64, y: 352 }, // N NE E S
        28: { x: 0, y: 336 }, // E SE S
        29: { x: 64, y: 368 }, // N E SE S
        31: { x: 0, y: 352 }, // N NE E SE S
        64: { x: 32, y: 384 }, // W
        65: { x: 112, y: 384 }, // N W
        68: { x: 16, y: 384 }, // E W
        69: { x: 128, y: 384 }, // N E W
        71: { x: 96, y: 384 }, // N NE E W
        80: { x: 112, y: 336 }, // S W
        81: { x: 112, y: 400 }, // N S W
        84: { x: 128, y: 336 }, // E S W
        85: { x: 128, y: 400 }, // N E S W
        87: { x: 144, y: 384 }, // N NE E S W
        92: { x: 96, y: 336 }, // E SE S W
        93: { x: 144, y: 368 }, // N E SE S W
        95: { x: 96, y: 400 }, // N NE E SE S W
        112: { x: 32, y: 336 }, // S SW W
        113: { x: 112, y: 368 }, // N S SW W
        116: { x: 80, y: 336 }, // E S SW W
        117: { x: 160, y: 368 }, // N E S SW W
        119: { x: 144, y: 352 }, // N NE E S SW W
        124: { x: 16, y: 336 }, // E SE S SW W
        125: { x: 128, y: 368 }, // N E SE S SW W
        127: { x: 96, y: 368 }, // N NE E SE S SW W
        193: { x: 32, y: 368 }, // N W NW
        197: { x: 80, y: 384 }, // N E W NW
        199: { x: 16, y: 368 }, // N NE E W NW
        209: { x: 112, y: 352 }, // N S W NW
        213: { x: 160, y: 384 }, // N E S W NW
        215: { x: 128, y: 352 }, // N NE E S W NW
        221: { x: 144, y: 336 }, // N E SE S W NW
        223: { x: 96, y: 352 }, // N NE E SE S W NW
        241: { x: 32, y: 352 }, // N S SW W NW
        245: { x: 80, y: 400 }, // N E S SW W NW
        247: { x: 80, y: 352 }, // N NE E S SW W NW
        253: { x: 80, y: 368 }, // N E SE S SW W NW
        255: { x: 16, y: 352 }, // N NE E SE S SW W NW
      },
      fill: { x: 16, y: 352 },
    },
    priority: 5,
    walkable: true,
  },
  patternOrange: {
    name: 'Orange clover pattern',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetFloor.png',
      tiles: {
        1: { x: 224, y: 368 }, // N
        4: { x: 176, y: 384 }, // E
        5: { x: 240, y: 384 }, // N E
        7: { x: 176, y: 368 }, // N NE E
        16: { x: 224, y: 336 }, // S
        17: { x: 224, y: 352 }, // N S
        20: { x: 240, y: 336 }, // E S
        21: { x: 240, y: 400 }, // N E S
        23: { x: 240, y: 352 }, // N NE E S
        28: { x: 176, y: 336 }, // E SE S
        29: { x: 240, y: 368 }, // N E SE S
        31: { x: 176, y: 352 }, // N NE E SE S
        64: { x: 208, y: 384 }, // W
        65: { x: 288, y: 384 }, // N W
        68: { x: 192, y: 384 }, // E W
        69: { x: 304, y: 384 }, // N E W
        71: { x: 272, y: 384 }, // N NE E W
        80: { x: 288, y: 336 }, // S W
        81: { x: 288, y: 400 }, // N S W
        84: { x: 304, y: 336 }, // E S W
        85: { x: 304, y: 400 }, // N E S W
        87: { x: 320, y: 384 }, // N NE E S W
        92: { x: 272, y: 336 }, // E SE S W
        93: { x: 320, y: 368 }, // N E SE S W
        95: { x: 272, y: 400 }, // N NE E SE S W
        112: { x: 208, y: 336 }, // S SW W
        113: { x: 288, y: 368 }, // N S SW W
        116: { x: 256, y: 336 }, // E S SW W
        117: { x: 336, y: 368 }, // N E S SW W
        119: { x: 320, y: 352 }, // N NE E S SW W
        124: { x: 192, y: 336 }, // E SE S SW W
        125: { x: 304, y: 368 }, // N E SE S SW W
        127: { x: 272, y: 368 }, // N NE E SE S SW W
        193: { x: 208, y: 368 }, // N W NW
        197: { x: 256, y: 384 }, // N E W NW
        199: { x: 192, y: 368 }, // N NE E W NW
        209: { x: 288, y: 352 }, // N S W NW
        213: { x: 336, y: 384 }, // N E S W NW
        215: { x: 304, y: 352 }, // N NE E S W NW
        221: { x: 320, y: 336 }, // N E SE S W NW
        223: { x: 272, y: 352 }, // N NE E SE S W NW
        241: { x: 208, y: 352 }, // N S SW W NW
        245: { x: 256, y: 400 }, // N E S SW W NW
        247: { x: 256, y: 352 }, // N NE E S SW W NW
        253: { x: 256, y: 368 }, // N E SE S SW W NW
        255: { x: 192, y: 352 }, // N NE E SE S SW W NW
      },
      fill: { x: 192, y: 352 },
    },
    priority: 5,
    walkable: true,
  },
  water: {
    name: 'Water (sand shore)',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetWater.png',
      tiles: {
        0: { x: 48, y: 48 }, // none (isolated)
        1: { x: 48, y: 32 }, // N
        4: { x: 0, y: 48 }, // E
        5: { x: 64, y: 48 }, // N E
        7: { x: 0, y: 32 }, // N NE E
        16: { x: 48, y: 0 }, // S
        17: { x: 48, y: 16 }, // N S
        20: { x: 64, y: 0 }, // E S
        21: { x: 64, y: 64 }, // N E S
        23: { x: 64, y: 16 }, // N NE E S
        28: { x: 0, y: 0 }, // E SE S
        29: { x: 64, y: 32 }, // N E SE S
        31: { x: 0, y: 16 }, // N NE E SE S
        64: { x: 32, y: 48 }, // W
        65: { x: 112, y: 48 }, // N W
        68: { x: 16, y: 48 }, // E W
        69: { x: 128, y: 48 }, // N E W
        71: { x: 96, y: 48 }, // N NE E W
        80: { x: 112, y: 0 }, // S W
        81: { x: 112, y: 64 }, // N S W
        84: { x: 128, y: 0 }, // E S W
        85: { x: 128, y: 64 }, // N E S W
        87: { x: 144, y: 48 }, // N NE E S W
        92: { x: 96, y: 0 }, // E SE S W
        93: { x: 144, y: 32 }, // N E SE S W
        95: { x: 96, y: 64 }, // N NE E SE S W
        112: { x: 32, y: 0 }, // S SW W
        113: { x: 112, y: 32 }, // N S SW W
        116: { x: 80, y: 0 }, // E S SW W
        117: { x: 160, y: 32 }, // N E S SW W
        119: { x: 144, y: 16 }, // N NE E S SW W
        124: { x: 16, y: 0 }, // E SE S SW W
        125: { x: 128, y: 32 }, // N E SE S SW W
        127: { x: 96, y: 32 }, // N NE E SE S SW W
        193: { x: 32, y: 32 }, // N W NW
        197: { x: 80, y: 48 }, // N E W NW
        199: { x: 16, y: 32 }, // N NE E W NW
        209: { x: 112, y: 16 }, // N S W NW
        213: { x: 160, y: 48 }, // N E S W NW
        215: { x: 128, y: 16 }, // N NE E S W NW
        221: { x: 144, y: 0 }, // N E SE S W NW
        223: { x: 96, y: 16 }, // N NE E SE S W NW
        241: { x: 32, y: 16 }, // N S SW W NW
        245: { x: 80, y: 64 }, // N E S SW W NW
        247: { x: 80, y: 16 }, // N NE E S SW W NW
        253: { x: 80, y: 32 }, // N E SE S SW W NW
        255: { x: 16, y: 16 }, // N NE E SE S SW W NW
      },
      fill: { x: 16, y: 16 },
    },
    priority: 10,
    variants: [{ x: 176, y: 16 }, { x: 176, y: 32 }, { x: 176, y: 48 }, { x: 176, y: 64 }, { x: 192, y: 0 }],
    sparkle: { sheet: '/game/terrain/SpriteSheet16x16.png', x: 0, y: 0, w: 16, h: 16, frames: 4, dir: 'right', fps: 6 },
    walkable: false,
  },
  waterGrass: {
    name: 'Water (grass shore)',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetWater.png',
      tiles: {
        1: { x: 48, y: 128 }, // N
        4: { x: 0, y: 144 }, // E
        5: { x: 64, y: 144 }, // N E
        7: { x: 0, y: 128 }, // N NE E
        16: { x: 48, y: 96 }, // S
        17: { x: 48, y: 112 }, // N S
        20: { x: 64, y: 96 }, // E S
        21: { x: 64, y: 160 }, // N E S
        23: { x: 64, y: 112 }, // N NE E S
        28: { x: 0, y: 96 }, // E SE S
        29: { x: 64, y: 128 }, // N E SE S
        31: { x: 0, y: 112 }, // N NE E SE S
        64: { x: 32, y: 144 }, // W
        65: { x: 112, y: 144 }, // N W
        68: { x: 16, y: 144 }, // E W
        69: { x: 128, y: 144 }, // N E W
        71: { x: 96, y: 144 }, // N NE E W
        80: { x: 112, y: 96 }, // S W
        81: { x: 112, y: 160 }, // N S W
        84: { x: 128, y: 96 }, // E S W
        85: { x: 128, y: 160 }, // N E S W
        87: { x: 144, y: 144 }, // N NE E S W
        92: { x: 96, y: 96 }, // E SE S W
        93: { x: 144, y: 128 }, // N E SE S W
        95: { x: 96, y: 160 }, // N NE E SE S W
        112: { x: 32, y: 96 }, // S SW W
        113: { x: 112, y: 128 }, // N S SW W
        116: { x: 80, y: 96 }, // E S SW W
        117: { x: 160, y: 128 }, // N E S SW W
        119: { x: 144, y: 112 }, // N NE E S SW W
        124: { x: 16, y: 96 }, // E SE S SW W
        125: { x: 128, y: 128 }, // N E SE S SW W
        127: { x: 96, y: 128 }, // N NE E SE S SW W
        193: { x: 32, y: 128 }, // N W NW
        197: { x: 80, y: 144 }, // N E W NW
        199: { x: 16, y: 128 }, // N NE E W NW
        209: { x: 112, y: 112 }, // N S W NW
        213: { x: 160, y: 144 }, // N E S W NW
        215: { x: 128, y: 112 }, // N NE E S W NW
        221: { x: 144, y: 96 }, // N E SE S W NW
        223: { x: 96, y: 112 }, // N NE E SE S W NW
        241: { x: 32, y: 112 }, // N S SW W NW
        245: { x: 80, y: 160 }, // N E S SW W NW
        247: { x: 80, y: 112 }, // N NE E S SW W NW
        253: { x: 80, y: 128 }, // N E SE S SW W NW
        255: { x: 16, y: 112 }, // N NE E SE S SW W NW
      },
      fill: { x: 16, y: 112 },
    },
    priority: 10,
    variants: [{ x: 176, y: 16 }, { x: 176, y: 32 }, { x: 176, y: 48 }, { x: 176, y: 64 }, { x: 192, y: 0 }],
    sparkle: { sheet: '/game/terrain/SpriteSheet16x16.png', x: 0, y: 0, w: 16, h: 16, frames: 4, dir: 'right', fps: 6 },
    walkable: false,
  },
  waterIce: {
    name: 'Icy water (snow shore)',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetWater.png',
      tiles: {
        0: { x: 256, y: 48 }, // none (isolated)
        1: { x: 256, y: 32 }, // N
        4: { x: 208, y: 48 }, // E
        5: { x: 272, y: 48 }, // N E
        7: { x: 208, y: 32 }, // N NE E
        16: { x: 256, y: 0 }, // S
        17: { x: 256, y: 16 }, // N S
        20: { x: 272, y: 0 }, // E S
        21: { x: 272, y: 64 }, // N E S
        23: { x: 272, y: 16 }, // N NE E S
        28: { x: 208, y: 0 }, // E SE S
        29: { x: 272, y: 32 }, // N E SE S
        31: { x: 208, y: 16 }, // N NE E SE S
        64: { x: 240, y: 48 }, // W
        65: { x: 320, y: 48 }, // N W
        68: { x: 224, y: 48 }, // E W
        69: { x: 336, y: 48 }, // N E W
        71: { x: 304, y: 48 }, // N NE E W
        80: { x: 320, y: 0 }, // S W
        81: { x: 320, y: 64 }, // N S W
        84: { x: 336, y: 0 }, // E S W
        85: { x: 336, y: 64 }, // N E S W
        87: { x: 352, y: 48 }, // N NE E S W
        92: { x: 304, y: 0 }, // E SE S W
        93: { x: 352, y: 32 }, // N E SE S W
        95: { x: 304, y: 64 }, // N NE E SE S W
        112: { x: 240, y: 0 }, // S SW W
        113: { x: 320, y: 32 }, // N S SW W
        116: { x: 288, y: 0 }, // E S SW W
        117: { x: 368, y: 32 }, // N E S SW W
        119: { x: 352, y: 16 }, // N NE E S SW W
        124: { x: 224, y: 0 }, // E SE S SW W
        125: { x: 336, y: 32 }, // N E SE S SW W
        127: { x: 304, y: 32 }, // N NE E SE S SW W
        193: { x: 240, y: 32 }, // N W NW
        197: { x: 288, y: 48 }, // N E W NW
        199: { x: 224, y: 32 }, // N NE E W NW
        209: { x: 320, y: 16 }, // N S W NW
        213: { x: 368, y: 48 }, // N E S W NW
        215: { x: 336, y: 16 }, // N NE E S W NW
        221: { x: 352, y: 0 }, // N E SE S W NW
        223: { x: 304, y: 16 }, // N NE E SE S W NW
        241: { x: 240, y: 16 }, // N S SW W NW
        245: { x: 288, y: 64 }, // N E S SW W NW
        247: { x: 288, y: 16 }, // N NE E S SW W NW
        253: { x: 288, y: 32 }, // N E SE S SW W NW
        255: { x: 224, y: 16 }, // N NE E SE S SW W NW
      },
      fill: { x: 224, y: 16 },
    },
    priority: 10,
    variants: [{ x: 384, y: 16 }, { x: 384, y: 32 }, { x: 384, y: 48 }, { x: 384, y: 64 }, { x: 384, y: 0 }],
    walkable: false,
  },
  waterPurple: {
    name: 'Poison water (earth shore)',
    auto: {
      kind: 'blob47',
      sheet: '/game/terrain/TilesetWater.png',
      tiles: {
        1: { x: 256, y: 128 }, // N
        4: { x: 208, y: 144 }, // E
        5: { x: 272, y: 144 }, // N E
        7: { x: 208, y: 128 }, // N NE E
        16: { x: 256, y: 96 }, // S
        17: { x: 256, y: 112 }, // N S
        20: { x: 272, y: 96 }, // E S
        21: { x: 272, y: 160 }, // N E S
        23: { x: 272, y: 112 }, // N NE E S
        28: { x: 208, y: 96 }, // E SE S
        29: { x: 272, y: 128 }, // N E SE S
        31: { x: 208, y: 112 }, // N NE E SE S
        64: { x: 240, y: 144 }, // W
        65: { x: 320, y: 144 }, // N W
        68: { x: 224, y: 144 }, // E W
        69: { x: 336, y: 144 }, // N E W
        71: { x: 304, y: 144 }, // N NE E W
        80: { x: 320, y: 96 }, // S W
        81: { x: 320, y: 160 }, // N S W
        84: { x: 336, y: 96 }, // E S W
        85: { x: 336, y: 160 }, // N E S W
        87: { x: 352, y: 144 }, // N NE E S W
        92: { x: 304, y: 96 }, // E SE S W
        93: { x: 352, y: 128 }, // N E SE S W
        95: { x: 304, y: 160 }, // N NE E SE S W
        112: { x: 240, y: 96 }, // S SW W
        113: { x: 320, y: 128 }, // N S SW W
        116: { x: 288, y: 96 }, // E S SW W
        117: { x: 368, y: 128 }, // N E S SW W
        119: { x: 352, y: 112 }, // N NE E S SW W
        124: { x: 224, y: 96 }, // E SE S SW W
        125: { x: 336, y: 128 }, // N E SE S SW W
        127: { x: 304, y: 128 }, // N NE E SE S SW W
        193: { x: 240, y: 128 }, // N W NW
        197: { x: 288, y: 144 }, // N E W NW
        199: { x: 224, y: 128 }, // N NE E W NW
        209: { x: 320, y: 112 }, // N S W NW
        213: { x: 368, y: 144 }, // N E S W NW
        215: { x: 336, y: 112 }, // N NE E S W NW
        221: { x: 352, y: 96 }, // N E SE S W NW
        223: { x: 304, y: 112 }, // N NE E SE S W NW
        241: { x: 240, y: 112 }, // N S SW W NW
        245: { x: 288, y: 160 }, // N E S SW W NW
        247: { x: 288, y: 112 }, // N NE E S SW W NW
        253: { x: 288, y: 128 }, // N E SE S SW W NW
        255: { x: 224, y: 112 }, // N NE E SE S SW W NW
      },
      fill: { x: 224, y: 112 },
    },
    priority: 10,
    sparkle: { sheet: '/game/terrain/SpriteSheetPurple.png', x: 0, y: 0, w: 16, h: 16, frames: 4, dir: 'right', fps: 6 },
    walkable: false,
  },
} satisfies Record<string, Terrain>;

/** Wooden pier / boardwalk pieces: non-solid props the player walks ON over water (all tagged 'pier' + 'floor'). */
export const PIER = {
  pierTopLeft: {
    name: 'Pier platform top-left',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 0, y: 192, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierTop: {
    name: 'Pier platform top',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 16, y: 192, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierTopRight: {
    name: 'Pier platform top-right',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 32, y: 192, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierLeft: {
    name: 'Pier platform left',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 0, y: 208, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierCenter: {
    name: 'Pier platform centre',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 16, y: 208, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierRight: {
    name: 'Pier platform right',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 32, y: 208, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierBottomLeft: {
    name: 'Pier platform bottom-left',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 0, y: 224, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierBottom: {
    name: 'Pier platform bottom',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 16, y: 224, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierBottomRight: {
    name: 'Pier platform bottom-right',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 32, y: 224, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierPlatform: {
    name: 'Pier platform 3x3',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 0, y: 192, w: 48, h: 48 },
    footprint: { w: 3, h: 3 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierVTop: {
    name: 'Vertical pier, top end',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 48, y: 192, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierV: {
    name: 'Vertical pier, straight',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 48, y: 208, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierVBottom: {
    name: 'Vertical pier, bottom end',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 48, y: 224, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierHLeft: {
    name: 'Horizontal pier, left end',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 0, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierH: {
    name: 'Horizontal pier, straight',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 16, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierHRight: {
    name: 'Horizontal pier, right end',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 32, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierSingle: {
    name: 'Single pier tile',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 48, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  // 4x4 deck (64,192)-(127,255). The artist drew nail / post-cap marks ON the plank seams (y=206-207, 222-224, 240
  // and x=79, 95-97, 112-113), so every 1x1 piece below carries only its half of a mark: e.g. pierDeckTop ends in a
  // 1px dark notch at x=15 (rows 14-15) and pierDeckTopB starts with the other 2px of that nail head plus a
  // transparent shadow hole at (0,15). Consequences (cosmetic, 1-3 px): repeating pierDeckTop shows only the 1px
  // notch at each seam (the same notch the source has at x=79); the A/B pairs in order [Left, A, B, Right] rebuild
  // the source rows exactly; pierDeckCenter is the cleanest infinite fill (planks + one nail pixel at its top-right
  // corner). Use this 64x64 composite when you just want the original deck.
  pierDeck: {
    name: 'Pier deck 4x4 (posts)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 64, y: 192, w: 64, h: 64 },
    footprint: { w: 4, h: 4 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckTopLeft: {
    name: 'Deck top-left',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 64, y: 192, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckTop: {
    name: 'Deck top (A)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 80, y: 192, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckTopB: {
    name: 'Deck top (B)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 96, y: 192, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckTopRight: {
    name: 'Deck top-right',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 112, y: 192, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckLeft: {
    name: 'Deck left (A)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 64, y: 208, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckInner: {
    name: 'Deck inner (A)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 80, y: 208, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckInnerB: {
    name: 'Deck inner (B)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 96, y: 208, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckRight: {
    name: 'Deck right (A)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 112, y: 208, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckLeftB: {
    name: 'Deck left (B)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 64, y: 224, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckCenter: {
    name: 'Deck centre (clean fill)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 80, y: 224, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckCenterB: {
    name: 'Deck centre (B)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 96, y: 224, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckRightB: {
    name: 'Deck right (B)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 112, y: 224, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckBottomLeft: {
    name: 'Deck bottom-left',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 64, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckBottom: {
    name: 'Deck bottom (A)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 80, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckBottomB: {
    name: 'Deck bottom (B)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 96, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierDeckBottomRight: {
    name: 'Deck bottom-right',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 112, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  // Loose plank tiles in columns 8-9 (no deck outline); plankPlain has just one nail pixel in each top corner.
  plankPlain: {
    name: 'Plain planks (no outline)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 128, y: 224, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  plankPosts: {
    name: 'Planks with posts',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 144, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  plankTopPosts: {
    name: 'Planks, top outline, posts',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 128, y: 192, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  plankBottomPosts: {
    name: 'Planks, bottom face, posts',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 128, y: 240, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
  pierBrokenEnd: {
    name: 'Broken pier end',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 0, y: 256, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor', 'broken'],
  },
  pierBrokenHole: {
    name: 'Pier with hole',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 16, y: 256, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor', 'broken'],
  },
  pierHatch: {
    name: 'Planks with hatch',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 48, y: 256, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['pier', 'wood', 'floor'],
  },
} satisfies Record<string, Prop>;

/** Other props found on the water sheet. 'water-only' = opaque tile that must sit on a plain fill cell of its water. */
export const WATER_PROPS = {
  boatWooden: {
    name: 'Wooden rowing boat',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 416, y: 0, w: 32, h: 16 },
    footprint: { w: 2, h: 1 },
    solid: true,
    tags: ['boat', 'wood'],
  },
  mooringPost: {
    name: 'Mooring post',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 400, y: 16, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: true,
    tags: ['pier', 'wood'],
  },
  driftwood: {
    name: 'Driftwood scraps',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 400, y: 0, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: false,
    tags: ['debris', 'wood'],
  },
  // Both boulders are FULLY OPAQUE 16x16 tiles (256/256 px alpha 255): the pixels around the rock are the water fill
  // itself - plain (113,221,238) for rockWater (== fill of water / waterGrass), the two-tone icy pattern for rockWaterIce
  // (== fill of waterIce), measured pixel-identical. They only look right on a mask-255 cell of that water; on a shore
  // tile or on land they show square blue corners. They are also listed as `variants` of those terrains, which is the
  // safe automatic way to get them. (`solid` is moot on water, kept for engines that let boats cross.)
  rockWater: {
    name: 'Boulder in water (opaque water tile)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 192, y: 0, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: true,
    tags: ['rock', 'water-only'],
  },
  rockWaterIce: {
    name: 'Boulder in icy water (opaque water tile)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 384, y: 0, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: true,
    tags: ['rock', 'water-only'],
  },
  barrelWooden: {
    name: 'Wooden barrel (top view)',
    region: { sheet: '/game/terrain/TilesetWater.png', x: 32, y: 256, w: 16, h: 16 },
    footprint: { w: 1, h: 1 },
    solid: true,
    tags: ['barrel', 'wood'],
  },
} satisfies Record<string, Prop>;
