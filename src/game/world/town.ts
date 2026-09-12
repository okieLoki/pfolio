// The town. Painted procedurally from a handful of zones so the shapes stay
// organic and the file stays readable. Coordinates are tiles; (0,0) top-left.

import type { WorldDef, PropPlacement, NpcPlacement } from './types';
import { rng } from '../core/gfx';

const W = 64, H = 48;

// ---------- ground ----------
const grid: string[][] = Array.from({ length: H }, () => Array(W).fill('.'));
const put = (ch: string, x: number, y: number) => { if (x >= 0 && y >= 0 && x < W && y < H) grid[y][x] = ch; };
const fill = (ch: string, x: number, y: number, w: number, h: number) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(ch, x + i, y + j); };
const ellipse = (ch: string, cx: number, cy: number, rx: number, ry: number) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x - cx) / rx, dy = (y - cy) / ry;
    if (dx * dx + dy * dy <= 1) put(ch, x, y);
  }
};
const at = (x: number, y: number) => grid[y]?.[x] ?? '.';

// grass zones
ellipse('G', 12, 10, 9, 5.5);          // home garden
ellipse('G', 32, 23, 10, 6.5);         // park
ellipse('G', 52, 24, 9.5, 7.5);        // pond meadow
ellipse('G', 12, 38, 11, 8); ellipse('G', 18, 35, 8, 5); ellipse('G', 8, 42, 7, 4.5); // forest floor (SW)
ellipse('G', 52, 39, 10, 7);           // shrine grounds
ellipse('R', 52, 39, 4, 2.5);          // rose petals under the shrine trees
ellipse('G', 51, 9, 8, 5);             // office lawn
// tall grass (encounters) inside the forest
ellipse('T', 9, 38, 6, 4.5);
ellipse('T', 18, 36, 4.5, 3);
ellipse('T', 14, 43, 5, 2);
// pond
ellipse('W', 52, 24, 5.5, 3.6);
ellipse('W', 49, 26, 3.5, 2.4);
ellipse('W', 55, 22, 3, 2);

// roads: 'P' = sand path, 'D' = dirt (reads better on grass)
const road = (x: number, y: number, w: number, h: number) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { if (at(x + i, y + j) === 'W') continue; put('P', x + i, y + j); } };
road(4, 16, 56, 2);        // main street
road(31, 3, 2, 42);        // north–south avenue
road(9, 10, 2, 6);         // home drive
road(48, 10, 2, 6);        // office drive
road(11, 26, 21, 2);       // workshop lane
road(33, 24, 13, 2);       // pond lane
road(33, 38, 6, 2);        // library approach
road(33, 41, 20, 2);       // shrine approach
road(53, 41, 2, 1);        // shrine step
road(26, 6, 13, 8);        // plaza

// ---------- props ----------
const props: PropPlacement[] = [];
const rand = rng(7);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const add = (name: string, x: number, y: number, extra: Partial<PropPlacement> = {}) => props.push({ name, x, y, ...extra });
const occupied = new Set<string>();
const claim = (x: number, y: number, w = 1, h = 1) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) occupied.add(`${x + i},${y - j}`); };
const free = (x: number, y: number, w = 1, h = 1) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) if (occupied.has(`${x + i},${y - j}`)) return false; return true; };
const solidAdd = (name: string, x: number, y: number, w = 1, h = 1, extra: Partial<PropPlacement> = {}) => { add(name, x, y, extra); claim(x, y, w, h); };

// forest border, two tiles deep, sealed
const borderTrees = ['treeGreenRound', 'treeDarkGreenRound', 'treeGreenRoundB', 'treeGreenRound'];
for (let x = 0; x < W; x += 2) { solidAdd(pick(borderTrees), x, 1, 2); solidAdd(pick(borderTrees), x, H - 1, 2); }
for (let x = 1; x < W - 1; x += 2) { solidAdd(pick(borderTrees), x, 2, 2); solidAdd(pick(borderTrees), x, H - 2, 2); }
for (let y = 3; y < H - 2; y += 1) { solidAdd(pick(borderTrees), y % 2 ? 0 : 1, y, 2); solidAdd(pick(borderTrees), y % 2 ? W - 2 : W - 3, y, 2); }

// houses (bottom-left tile of footprint)
const houses = [
  { name: 'houseOrangeRoofA', x: 8, y: 9, id: 'home', label: 'HOME' },
  { name: 'shopGreenRoof', x: 46, y: 9, id: 'office', label: 'OFFICE' },
  { name: 'houseWoodGable', x: 9, y: 26, id: 'workshop', label: 'WORKSHOP' },
  { name: 'innWoodTwoStorey', x: 36, y: 37, id: 'library', label: 'LIBRARY' },
  { name: 'houseRedTiled', x: 52, y: 40, id: 'shrine', label: 'SHRINE' },
];
claim(8, 9, 4, 3); claim(46, 9, 4, 3); claim(9, 26, 3, 3); claim(36, 37, 4, 4); claim(52, 40, 4, 3);
// keep the door approaches clear
for (const [x, y] of [[9, 10], [48, 10], [10, 27], [37, 38], [53, 41]]) claim(x, y);

// fences: helper draws a rectangle with optional gaps
const fenceRect = (style: 'Rail' | 'Palisade', x: number, y: number, w: number, h: number, gaps: [number, number][] = []) => {
  const gap = (gx: number, gy: number) => gaps.some(([a, b]) => a === gx && b === gy);
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const gx = x + i, gy = y + j;
    const edge = i === 0 || j === 0 || i === w - 1 || j === h - 1;
    if (!edge || gap(gx, gy) || !free(gx, gy)) continue;
    let piece = 'H';
    if (i === 0 && j === 0) piece = 'CornerTL'; else if (i === w - 1 && j === 0) piece = 'CornerTR';
    else if (i === 0 && j === h - 1) piece = 'CornerBL'; else if (i === w - 1 && j === h - 1) piece = 'CornerBR';
    else if (i === 0 || i === w - 1) piece = 'V';
    if (piece === 'H' && gap(gx - 1, gy)) piece = 'EndR'; else if (piece === 'H' && gap(gx + 1, gy)) piece = 'EndL';
    solidAdd(`fence${style}${piece}`, gx, gy);
  }
};
fenceRect('Rail', 4, 5, 13, 9, [[9, 13], [10, 13]]);                 // home garden, gate at the drive
fenceRect('Palisade', 4, 19, 6, 6, [[9, 21], [9, 22]]);              // animal pen with a gap
fenceRect('Rail', 43, 5, 15, 8, [[48, 12], [49, 12]]);               // office lawn

// home
solidAdd('chestClosed', 12, 9, 1, 1, { id: 'mailbox' });
solidAdd('signPostRed', 12, 11, 1, 1, { id: 'sign-home' });

solidAdd('treePinkRound', 5, 6, 2);
solidAdd('logBench', 13, 12, 3);

// pen
solidAdd('hayPile', 5, 21, 2); solidAdd('hayBaleH', 5, 23, 2); solidAdd('scarecrowOwl', 8, 20); solidAdd('bucketWater', 8, 23);
// welcome sign near the junction
solidAdd('signPostRed', 12, 15, 1, 1, { id: 'sign-welcome' });

// plaza
solidAdd('statueBuddhaTan', 35, 8, 2, 1, { id: 'statue' });
solidAdd('noticeBoard', 28, 8, 1, 1, { id: 'board' });
solidAdd('doodleWall', 30, 7, 3, 1, { id: 'doodle' });
solidAdd('lampPostWood', 26, 6); solidAdd('lampPostWood', 38, 6); solidAdd('lampPostWood', 26, 13); solidAdd('lampPostWood', 38, 13);
solidAdd('stallCurtained', 36, 12, 2);
solidAdd('logBench', 29, 14, 3); solidAdd('logBench', 34, 14, 3);

// office
solidAdd('signPostRed', 51, 10, 1, 1, { id: 'sign-office' });
solidAdd('lanternRedPaper', 45, 10); solidAdd('lanternRedPaper', 50, 10);
solidAdd('bannerRed', 44, 7); solidAdd('bannerRed', 56, 7);

solidAdd('treeLimeRound', 44, 13, 2); solidAdd('treeLimeRound', 55, 13, 2);

// workshop
solidAdd('signPostRed', 12, 27, 1, 1, { id: 'sign-workshop' });
solidAdd('workbench', 6, 27, 2); solidAdd('weaponRackA', 13, 25, 2); solidAdd('crateWood', 6, 29);
solidAdd('barrelClosedA', 13, 28); solidAdd('stumpBrown', 4, 29, 2);
solidAdd('firePitStone', 15, 30, 2, 2); add('campfireFlame', 15, 29); solidAdd('logBench', 12, 31, 3);


// park
solidAdd('treePinkLarge', 24, 21, 4); solidAdd('treePinkRound', 39, 20, 2); solidAdd('treeGreenBig', 36, 29, 1);
solidAdd('stoneArch', 30, 30, 3); solidAdd('logBench', 26, 24, 3); solidAdd('logBench', 36, 21, 3);
solidAdd('statueFrogTan', 28, 20); solidAdd('lanternStone', 26, 28); solidAdd('lanternStone', 38, 28);

// pond
solidAdd('signPostRed', 45, 22, 1, 1, { id: 'sign-pond' });
add('dockCornerWood', 47, 25); claim(47, 25, 3, 2);   // walkable dock over the water
add('reeds', 46, 27); add('reeds', 57, 21); add('reeds', 58, 25); add('reeds', 50, 29);
solidAdd('boulderBrown', 58, 27, 2);
solidAdd('treeGreenLarge', 55, 18, 4); solidAdd('treeGreenRound', 59, 30, 2); solidAdd('treeDarkGreenRound', 44, 30, 2);
solidAdd('lampPostWood', 45, 23);

// forest edge
solidAdd('signPostRed', 29, 33, 1, 1, { id: 'sign-forest' });
const forestTrees = ['treeDarkGreenRound', 'treeGreenRound', 'treeDarkGreenLarge', 'treeGreenLarge', 'treeGreenBig', 'treeBushSmall'];
for (const [x, y] of [[4, 33], [8, 32], [14, 32], [20, 33], [23, 36], [4, 41], [22, 42], [6, 45], [12, 45], [19, 45], [24, 44], [3, 37], [11, 35]]) {
  const name = pick(forestTrees);
  const w = name.includes('Large') ? 4 : name === 'treeGreenBig' ? 1 : 2;
  if (free(x, y, w)) solidAdd(name, x, y, w);
}
solidAdd('stumpBrown', 17, 40, 2); solidAdd('boulderBrown', 6, 36, 2);
add('mushroomsRed', 9, 34); add('mushroomOrangeA', 5, 39);

// library
solidAdd('signPostRed', 40, 39, 1, 1, { id: 'sign-library' });
solidAdd('lanternStone', 35, 38); solidAdd('lanternStone', 40, 37);

solidAdd('treeGreenRound', 27, 37, 2); solidAdd('treeGreenRound', 42, 44, 2); solidAdd('bushLeafy', 28, 41); solidAdd('bushRound', 29, 44);

// shrine
solidAdd('signPostRed', 50, 41, 1, 1, { id: 'sign-shrine' });
solidAdd('torii', 56, 43, 2); solidAdd('statueFoxTan', 51, 43); solidAdd('statueFoxTan', 55, 42);
solidAdd('lanternStone', 50, 43); solidAdd('lanternStone', 58, 43);
solidAdd('treePinkRound', 47, 36, 2); solidAdd('treePinkLarge', 56, 35, 4);
solidAdd('gravestoneRound', 46, 42); solidAdd('statueBuddhaOrbTan', 47, 39, 2);

// fill the open sand with a little life
for (const [name, x, y, w] of [['treeGreenRound', 18, 21, 2], ['treeDarkGreenRound', 22, 12, 2], ['treeGreenRound', 40, 31, 2], ['treeDarkGreenLarge', 44, 33, 4], ['treeGreenRound', 20, 30, 2], ['treeGreenRoundB', 58, 33, 2], ['treeDarkGreenRound', 42, 4, 2], ['treeGreenRound', 24, 4, 2], ['treeGreenRoundB', 4, 15, 2], ['bushLeafy', 25, 15, 1], ['bushRound', 41, 21, 1], ['bushLeafy', 47, 31, 1], ['bushRound', 43, 15, 1], ['woodGateSmall', 30, 2, 3]] as const) {
  if (free(x, y, w)) solidAdd(name, x, y, w);
}

// road-side lanterns along the avenue and main street
for (const y of [20, 30, 44]) { if (free(30, y)) solidAdd('lanternStone', 30, y); if (free(33, y)) solidAdd('lanternStone', 33, y); }
for (const x of [22, 40, 56]) { if (free(x, 15)) solidAdd('lampPostWood', x, 15); }

// scatter: flowers on grass, pebbles on sand, tufts in the forest
const grassDecor = ['flowerWhite', 'flowerRedTulip', 'clover', 'tuftGreenA', 'grassTuft', 'sunflowerA', 'decalFlowerPatch', 'flowerWhiteAnim', 'plantLeafA', 'decalPetals'];
const sandDecor = ['pebblesSandA', 'pebblesSandB', 'pebblesSandC', 'decalSandMounds', 'grassShort'];
const forestDecor = ['tuftGreenA', 'tuftGreenB', 'grassTall', 'fernA', 'mushroomsRed', 'sproutA', 'decalLeafScatter'];
for (let i = 0; i < 380; i++) {
  const x = 2 + Math.floor(rand() * (W - 4)), y = 3 + Math.floor(rand() * (H - 6));
  const c = at(x, y);
  if (!free(x, y) || c === 'W' || c === 'P' || c === 'D') continue;
  if (c === 'G' && rand() < 0.35) { add(pick(grassDecor), x, y); claim(x, y); }
  else if (c === 'T' && rand() < 0.3) { add(pick(forestDecor), x, y); claim(x, y); }
  else if (c === '.' && rand() < 0.25) { add(pick(sandDecor), x, y); claim(x, y); }
}

// ---------- people & animals ----------
const npcs: NpcPlacement[] = [
  { id: 'woman', char: 'woman', x: 14, y: 10, wander: 2, name: 'Villager' },
  { id: 'elder', char: 'oldMan', x: 29, y: 9, wander: 3, name: 'Elder' },
  { id: 'kid', char: 'child', x: 34, y: 20, wander: 4, name: 'Kid' },
  { id: 'worker', char: 'villager2', x: 47, y: 13, wander: 2, name: 'Worker' },
  { id: 'monk', char: 'monk', x: 39, y: 42, wander: 1, name: 'Monk' },
  { id: 'hunter', char: 'hunter', x: 15, y: 33, wander: 2, name: 'Hunter' },
  { id: 'fisher', char: 'villager4', x: 48, y: 24, wander: 0, dir: 'down', name: 'Fisher' },
  { id: 'guard', char: 'samurai', x: 54, y: 43, wander: 1, name: 'Guard' },
  { id: 'dog', char: 'dog', kind: 'animal', x: 11, y: 12, wander: 3 },
  { id: 'cat', char: 'catOrange', kind: 'animal', x: 31, y: 11, wander: 3 },
  { id: 'cat2', char: 'catWhite', kind: 'animal', x: 38, y: 40, wander: 2 },
  { id: 'chicken1', char: 'chicken', kind: 'animal', x: 6, y: 22, wander: 2 },
  { id: 'chicken2', char: 'chicken', kind: 'animal', x: 7, y: 20, wander: 2 },
  { id: 'pig', char: 'pig', kind: 'animal', x: 7, y: 22, wander: 1 },
  { id: 'cow', char: 'cow', kind: 'animal', x: 7, y: 23, wander: 1 },
  { id: 'frog', char: 'frog', kind: 'animal', x: 47, y: 28, wander: 2 },
];

export const TOWN: WorldDef = {
  name: 'Uddeepta Town',
  width: W,
  height: H,
  base: 'sand',
  ground: grid.map((r) => r.join('')),
  legend: { '.': 'sand', 'G': 'grass', 'T': 'grassDark', 'R': 'rose', 'P': 'path', 'D': 'dirt', 'W': 'water' },
  props,
  houses,
  npcs,
  signs: [],
  flutter: [
    { name: 'garden', x: 5, y: 6, w: 11, h: 7 },
    { name: 'park', x: 24, y: 19, w: 16, h: 9 },
    { name: 'shrine', x: 44, y: 34, w: 16, h: 10 },
  ],
  regions: [
    { name: 'HOME', x: 3, y: 3, w: 20, h: 12 },
    { name: 'TOWN SQUARE', x: 24, y: 3, w: 17, h: 12 },
    { name: 'OFFICE', x: 42, y: 3, w: 20, h: 12 },
    { name: 'WORKSHOP', x: 3, y: 18, w: 19, h: 12 },
    { name: 'THE PARK', x: 22, y: 18, w: 21, h: 12 },
    { name: 'THE POND', x: 43, y: 18, w: 19, h: 14 },
    { name: 'FOREST EDGE', x: 3, y: 31, w: 23, h: 15 },
    { name: 'LIBRARY', x: 26, y: 32, w: 17, h: 14 },
    { name: 'SHRINE', x: 43, y: 33, w: 19, h: 13 },
  ],
  spawn: { x: 9, y: 11, dir: 'down' },
};
