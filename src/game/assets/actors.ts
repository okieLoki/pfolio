// Ninja Adventure asset pack (CC0, Pixel-boy & AAA) — ACTORS slice.
// Generated from pixel measurements (Pillow); see scratchpad/catalogue/gen_actors.py.
//
// Source sheets used (copied verbatim to /public/game/actors/<Name>/):
//   Actor/Character/<Name>/SpriteSheet.png (64×112) + Faceset.png (38×38)
//     4 columns = facing: col0 down (face visible), col1 up (back of head), col2 left, col3 right.
//     Rows 0–3 = the 4-frame walk cycle in order; row 0 is the neutral stand and doubles as idle.
//     The nominal cycle is stand / step / stand / other-step, but the number of pixel-DISTINCT
//     poses varies per sheet and direction (see the "distinct poses d/u/l/r" comment on each
//     record): 4 = every row differs; 3 = one row is a pixel copy of another (for characters it is
//     always row 2 == row 0; monsters vary, e.g. Eye rows 1==2, Snake rows 1==3); 2 = rows 0==2 AND
//     1==3 (Samurai down/up/left, Racoon up). All 4 coordinates are always valid and the cycle
//     still animates, just with fewer unique poses.
//     Rows 4 (attack), 5 (jump), 6 (dead/item/special1/special2) exist but are NOT catalogued.
//   Actor/Character/{OldWoman,Child}/SpriteSheet.png (64×32): same 4 columns, only 2 walk rows.
//   Actor/Character/Shadow.png (12×7) — the drop shadow blob.
//   Actor/Animal/<Name>/SpriteSheet*.png: every animal is a 2-frame strip with a SINGLE facing
//     (no 4-direction walks exist in the pack) — see ANIMAL_FACING; mirror horizontally for the
//     opposite side. Several strips are not 16-px aligned (frame sizes measured per sheet).
//     Frog and Hamster: frame 0 sits facing the camera, frame 1 is a 3/4-view leap/stride to the
//     RIGHT, so they are tagged 'right' (mirror when moving left; either orientation is fine for
//     up/down travel). Cow, Horse, Donkey (non-Side sheets) are true front views ('down').
//   Actor/Monster/<Name>/{SpriteSheet,<Name>}.png (64×64): same 4 columns as characters,
//     rows 0–3 = frames. 'down' column (x = 0) is the battle-facing one.
// Deliberately skipped: CharacterAnimated/ (32×32 variants), Boss/, all non-listed palette
//   swaps (SpriteSheetBlack/Gray/…), Character SeparateAnim/ folders (redundant with SpriteSheet),
//   attack/jump/dead rows, and the Animal/Preview.gif.
// Walk timing suggestion: ~8 fps for 4-frame cycles, ~4 fps for 2-frame animals.
import type { CharacterSheet, Dir, Region } from './types';
/** Humanoid NPCs / player candidates. 16×16 frames, 4 dirs × 4 walk frames (oldWoman, child: 2 frames). */
export const CHARACTERS = {
  boy: {  // distinct poses d/u/l/r: 3/3/4/4
    name: 'Boy', sheet: '/game/actors/Boy/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Boy/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  villager: {  // distinct poses d/u/l/r: 4/3/4/4
    name: 'Villager', sheet: '/game/actors/Villager/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Villager/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  ninjaGreen: {  // distinct poses d/u/l/r: 3/3/3/3
    name: 'Green Ninja', sheet: '/game/actors/NinjaGreen/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/NinjaGreen/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  oldMan: {  // distinct poses d/u/l/r: 4/3/4/4
    name: 'Old Man', sheet: '/game/actors/OldMan/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/OldMan/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  oldMan2: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Old Man 2', sheet: '/game/actors/OldMan2/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/OldMan2/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  oldWoman: {
    name: 'Old Woman', sheet: '/game/actors/OldWoman/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/OldWoman/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  woman: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Woman', sheet: '/game/actors/Woman/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Woman/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  child: {
    name: 'Child', sheet: '/game/actors/Child/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Child/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  villager2: {  // distinct poses d/u/l/r: 3/4/3/3
    name: 'Villager 2', sheet: '/game/actors/Villager2/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Villager2/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  villager3: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Villager 3', sheet: '/game/actors/Villager3/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Villager3/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  villager4: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Villager 4', sheet: '/game/actors/Villager4/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Villager4/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  monk: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Monk', sheet: '/game/actors/Monk/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Monk/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  master: {  // distinct poses d/u/l/r: 3/3/4/3
    name: 'Master', sheet: '/game/actors/Master/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Master/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  hunter: {  // distinct poses d/u/l/r: 4/4/3/4
    name: 'Hunter', sheet: '/game/actors/Hunter/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Hunter/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  inspector: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Inspector', sheet: '/game/actors/Inspector/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Inspector/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  noble: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Noble', sheet: '/game/actors/Noble/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Noble/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  princess: {  // distinct poses d/u/l/r: 3/3/4/4
    name: 'Princess', sheet: '/game/actors/Princess/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Princess/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  samurai: {  // distinct poses d/u/l/r: 2/2/2/3 (some rows are pixel-identical; still animates)
    name: 'Samurai', sheet: '/game/actors/Samurai/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Samurai/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  shaman: {  // distinct poses d/u/l/r: 3/3/3/3
    name: 'Shaman', sheet: '/game/actors/Shaman/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Shaman/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
} satisfies Record<string, CharacterSheet>;

/** Animals: 2 frames each, single facing (see ANIMAL_FACING). All four walk dirs point at the same 2 frames. */
export const ANIMALS = {
  cat: {
    name: 'Cat', sheet: '/game/actors/Cat/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Cat/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 13 },
  },
  catOrange: {
    name: 'Orange Cat', sheet: '/game/actors/CatOrange/SpriteSheet.png', frameW: 22, frameH: 17,
    walk: { down: [{ x: 0, y: 0 }, { x: 22, y: 0 }], up: [{ x: 0, y: 0 }, { x: 22, y: 0 }], left: [{ x: 0, y: 0 }, { x: 22, y: 0 }], right: [{ x: 0, y: 0 }, { x: 22, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/CatOrange/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 11, y: 17 },
  },
  catWhite: {
    name: 'White Cat', sheet: '/game/actors/CatWhite/SpriteSheet.png', frameW: 17, frameH: 15,
    walk: { down: [{ x: 0, y: 0 }, { x: 17, y: 0 }], up: [{ x: 0, y: 0 }, { x: 17, y: 0 }], left: [{ x: 0, y: 0 }, { x: 17, y: 0 }], right: [{ x: 0, y: 0 }, { x: 17, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/CatWhite/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 15 },
  },
  dog: {
    name: 'Dog', sheet: '/game/actors/Dog/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Dog/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 13 },
  },
  dogYellow: {
    name: 'Yellow Dog', sheet: '/game/actors/DogYellow/SpriteSheet.png', frameW: 21, frameH: 17,
    walk: { down: [{ x: 0, y: 0 }, { x: 21, y: 0 }], up: [{ x: 0, y: 0 }, { x: 21, y: 0 }], left: [{ x: 0, y: 0 }, { x: 21, y: 0 }], right: [{ x: 0, y: 0 }, { x: 21, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/DogYellow/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 10, y: 17 },
  },
  chicken: {
    name: 'Chicken', sheet: '/game/actors/Chicken/SpriteSheetWhite.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Chicken/FacesetWhite.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  chickenBrown: {
    name: 'Brown Chicken', sheet: '/game/actors/Chicken/SpriteSheetBrown.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Chicken/FacesetBrown.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  cow: {
    name: 'Cow', sheet: '/game/actors/Cow/SpriteSheetWhite.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Cow/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  cowSide: {
    name: 'Cow (side)', sheet: '/game/actors/Cow/SpriteSheetWhiteSide.png', frameW: 24, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 24, y: 0 }], up: [{ x: 0, y: 0 }, { x: 24, y: 0 }], left: [{ x: 0, y: 0 }, { x: 24, y: 0 }], right: [{ x: 0, y: 0 }, { x: 24, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Cow/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 12, y: 16 },
  },
  pig: {
    name: 'Pig', sheet: '/game/actors/Pig/SpriteSheetPink.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Pig/FacesetPink.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 15 },
  },
  pigBlack: {
    name: 'Black Pig', sheet: '/game/actors/Pig/SpriteSheetBlack.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Pig/FacesetBlack.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 15 },
  },
  frog: {
    name: 'Frog', sheet: '/game/actors/Frog/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Frog/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 13 },
  },
  hamster: {
    name: 'Hamster', sheet: '/game/actors/Hamster/SpriteSheet.png', frameW: 15, frameH: 15,
    walk: { down: [{ x: 0, y: 0 }, { x: 15, y: 0 }], up: [{ x: 0, y: 0 }, { x: 15, y: 0 }], left: [{ x: 0, y: 0 }, { x: 15, y: 0 }], right: [{ x: 0, y: 0 }, { x: 15, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Hamster/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 7, y: 15 },
  },
  parrot: {
    name: 'Parrot', sheet: '/game/actors/Parrot/SpriteSheetRed.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Parrot/FacesetRed.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  horse: {
    name: 'Horse', sheet: '/game/actors/Horse/SpriteSheetBrown.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Horse/FacesetBrown.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  horseSide: {
    name: 'Horse (side)', sheet: '/game/actors/Horse/SpriteSheetBrownSide.png', frameW: 23, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 23, y: 0 }], up: [{ x: 0, y: 0 }, { x: 23, y: 0 }], left: [{ x: 0, y: 0 }, { x: 23, y: 0 }], right: [{ x: 0, y: 0 }, { x: 23, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Horse/FacesetBrown.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 11, y: 16 },
  },
  donkey: {
    name: 'Donkey', sheet: '/game/actors/Donkey/SpriteSheetGrey.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Donkey/FacesetGrey.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  donkeySide: {
    name: 'Donkey (side)', sheet: '/game/actors/Donkey/SpriteSheeGreySide.png', frameW: 23, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 23, y: 0 }], up: [{ x: 0, y: 0 }, { x: 23, y: 0 }], left: [{ x: 0, y: 0 }, { x: 23, y: 0 }], right: [{ x: 0, y: 0 }, { x: 23, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Donkey/FacesetGrey.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 11, y: 16 },
  },
  fish: {
    name: 'Fish', sheet: '/game/actors/Fish/SpriteSheetWhite.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 16, y: 0 }], up: [{ x: 0, y: 0 }, { x: 16, y: 0 }], left: [{ x: 0, y: 0 }, { x: 16, y: 0 }], right: [{ x: 0, y: 0 }, { x: 16, y: 0 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 0, y: 0 }, left: { x: 0, y: 0 }, right: { x: 0, y: 0 } },
    faceset: { sheet: '/game/actors/Fish/FacesetWhite.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 15 },
  },
} satisfies Record<string, CharacterSheet>;

/** Monsters: 16×16 frames, 4 dirs × 4 frames; use walk.down for battle sprites. */
export const MONSTERS = {
  slime: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Slime', sheet: '/game/actors/Slime/Slime.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Slime/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 15 },
  },
  slime2: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Green Slime', sheet: '/game/actors/Slime2/Slime2.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Slime2/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 15 },
  },
  larva: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Larva', sheet: '/game/actors/Larva/Larva.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Larva/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  mushroom: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Mushroom', sheet: '/game/actors/Mushroom/mushroom.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Mushroom/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  mole: {  // distinct poses d/u/l/r: 3/3/3/3
    name: 'Mole', sheet: '/game/actors/Mole/Mole.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Mole/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  snake: {  // distinct poses d/u/l/r: 3/3/4/4
    name: 'Snake', sheet: '/game/actors/Snake/Snake.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Snake/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  spiderRed: {  // distinct poses d/u/l/r: 4/3/3/3
    name: 'Red Spider', sheet: '/game/actors/SpiderRed/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/SpiderRed/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  butterfly: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Butterfly', sheet: '/game/actors/Butterfly/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Butterfly/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  butterflyBlue: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Blue Butterfly', sheet: '/game/actors/ButterflyBlue/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/ButterflyBlue/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  blueBat: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Blue Bat', sheet: '/game/actors/BlueBat/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/BlueBat/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  owl: {  // distinct poses d/u/l/r: 3/4/3/3
    name: 'Owl', sheet: '/game/actors/Owl/Owl.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Owl/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  mouse: {  // distinct poses d/u/l/r: 3/4/4/4
    name: 'Mouse', sheet: '/game/actors/Mouse/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Mouse/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  kappaGreen: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Green Kappa', sheet: '/game/actors/KappaGreen/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/KappaGreen/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  racoon: {  // distinct poses d/u/l/r: 4/2/4/4 (some rows are pixel-identical; still animates)
    name: 'Racoon', sheet: '/game/actors/Racoon/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Racoon/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  bamboo: {  // distinct poses d/u/l/r: 3/3/3/3
    name: 'Bamboo', sheet: '/game/actors/Bamboo/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Bamboo/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  eye: {  // distinct poses d/u/l/r: 3/3/3/3
    name: 'Eye', sheet: '/game/actors/Eye/Eye.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Eye/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
  flam: {  // distinct poses d/u/l/r: 4/4/4/4
    name: 'Flame', sheet: '/game/actors/Flam/SpriteSheet.png', frameW: 16, frameH: 16,
    walk: { down: [{ x: 0, y: 0 }, { x: 0, y: 16 }, { x: 0, y: 32 }, { x: 0, y: 48 }], up: [{ x: 16, y: 0 }, { x: 16, y: 16 }, { x: 16, y: 32 }, { x: 16, y: 48 }], left: [{ x: 32, y: 0 }, { x: 32, y: 16 }, { x: 32, y: 32 }, { x: 32, y: 48 }], right: [{ x: 48, y: 0 }, { x: 48, y: 16 }, { x: 48, y: 32 }, { x: 48, y: 48 }] },
    idle: { down: { x: 0, y: 0 }, up: { x: 16, y: 0 }, left: { x: 32, y: 0 }, right: { x: 48, y: 0 } },
    faceset: { sheet: '/game/actors/Flam/Faceset.png', x: 0, y: 0, w: 38, h: 38 },
    feet: { x: 8, y: 16 },
  },
} satisfies Record<string, CharacterSheet>;

/** Which way each single-facing animal strip actually points; flip horizontally for the opposite side.
 *  'right'/'left' = side or 3/4 view whose moving frame travels that way (frog, hamster: frame 1); 'down' = true front view. */
export const ANIMAL_FACING = {
  cat: 'right',
  catOrange: 'right',
  catWhite: 'right',
  dog: 'right',
  dogYellow: 'right',
  chicken: 'right',
  chickenBrown: 'right',
  cow: 'down',
  cowSide: 'right',
  pig: 'right',
  pigBlack: 'right',
  frog: 'right',
  hamster: 'right',
  parrot: 'right',
  horse: 'down',
  horseSide: 'right',
  donkey: 'down',
  donkeySide: 'right',
  fish: 'left',
} satisfies Record<keyof typeof ANIMALS, Dir>;

/** Drop-shadow blob drawn under actors (centre it on CharacterSheet.feet). */
export const SHADOW = { sheet: '/game/actors/Shadow.png', x: 0, y: 0, w: 12, h: 7 } satisfies Region;
