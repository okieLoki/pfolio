// Indoor rooms: a wall ring around a plain floor, furniture with ids that
// content.ts turns into dialogue, and an exit mat that warps back to town.

import type { WorldDef, PropPlacement, NpcPlacement } from './types';
import type { WallStyle } from '../assets/interior';

interface RoomSpec {
  id: string;
  name: string;
  w: number; h: number;
  wall: WallStyle;
  floor: string;
  exitX: number;
  /** where the exit drops you in town (the tile in front of the door) */
  returnTo: { x: number; y: number };
  furniture: PropPlacement[];
  npcs: NpcPlacement[];
}

function room(spec: RoomSpec): WorldDef {
  const { w, h, wall, exitX } = spec;
  const props: PropPlacement[] = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
    if (!edge) continue;
    if (x === exitX && y === h - 1) continue; // the doorway
    const piece = x === 0 && y === 0 ? 'tl' : x === w - 1 && y === 0 ? 'tr' : x === 0 && y === h - 1 ? 'bl' : x === w - 1 && y === h - 1 ? 'br'
      : y === 0 ? 't' : y === h - 1 ? 'b' : x === 0 ? 'l' : 'r';
    props.push({ name: `wall_${wall}_${piece}`, x, y });
  }
  return {
    name: spec.name,
    width: w, height: h,
    base: spec.floor,
    ground: Array.from({ length: h }, () => '.'.repeat(w)),
    legend: { '.': spec.floor },
    props: [...props, ...spec.furniture],
    houses: [],
    npcs: spec.npcs,
    signs: [],
    regions: [{ name: spec.name, x: 0, y: 0, w, h }],
    warps: [{ x: exitX, y: h - 1, map: 'town', tx: spec.returnTo.x, ty: spec.returnTo.y, dir: 'down' }],
    indoor: true,
    spawn: { x: exitX, y: h - 2, dir: 'up' },
  };
}

export const HOME = room({
  id: 'home', name: 'HOME', w: 12, h: 9, wall: 'beige', floor: 'floorPlanks', exitX: 5, returnTo: { x: 9, y: 10 },
  furniture: [
    { name: 'windowLight', x: 3, y: 0 }, { name: 'curtainsRedWide', x: 5, y: 0 }, { name: 'windowLight', x: 8, y: 0 },
    { name: 'bedOrange', x: 1, y: 3, id: 'home:bed' },
    { name: 'dresser', x: 6, y: 1, id: 'home:dresser' },
    { name: 'bookshelfFull', x: 8, y: 1, id: 'home:books' },
    { name: 'deskSmall', x: 10, y: 2, id: 'home:desk' },
    { name: 'tatamiMat', x: 4, y: 6 },
    { name: 'tableLow', x: 4, y: 5, id: 'home:table' },
    { name: 'cushion', x: 5, y: 4 }, { name: 'cushion', x: 5, y: 6 },
    { name: 'plantPotTall', x: 10, y: 7 }, { name: 'cupboardA', x: 1, y: 7 }, { name: 'vaseBig', x: 10, y: 4 },
    { name: 'lanternFloor', x: 1, y: 5 },
  ],
  npcs: [{ id: 'homecat', char: 'catWhite', kind: 'animal', x: 8, y: 6, wander: 2 }],
});

export const OFFICE = room({
  id: 'office', name: 'OFFICE', w: 16, h: 10, wall: 'green', floor: 'floorTan', exitX: 7, returnTo: { x: 48, y: 10 },
  furniture: [
    { name: 'windowDark', x: 2, y: 0 }, { name: 'noticeBoard', x: 7, y: 0, id: 'office:board' }, { name: 'windowDark', x: 12, y: 0 },
    { name: 'deskSmall', x: 3, y: 3, id: 'desk:0' }, { name: 'chairSmall', x: 3, y: 4 },
    { name: 'deskSmall', x: 7, y: 3, id: 'desk:1' }, { name: 'chairSmall', x: 7, y: 4 },
    { name: 'deskSmall', x: 11, y: 3, id: 'desk:2' }, { name: 'chairSmall', x: 11, y: 4 },
    { name: 'deskSmall', x: 3, y: 6, id: 'desk:3' }, { name: 'chairSmall', x: 3, y: 7 },
    { name: 'deskSmall', x: 11, y: 6, id: 'desk:4' }, { name: 'chairSmall', x: 11, y: 7 },
    { name: 'bookshelfEmpty', x: 13, y: 1 }, { name: 'cabinetBooksA', x: 1, y: 1 }, { name: 'cabinetBooksB', x: 2, y: 1 },
    { name: 'tableLow', x: 6, y: 8, id: 'office:kettle' }, { name: 'kettleGrey', x: 7, y: 7 },
    { name: 'plantPotTall', x: 14, y: 8 }, { name: 'plantPotTall', x: 1, y: 8 },
    { name: 'lanternFloor', x: 14, y: 5 }, { name: 'lanternFloor', x: 1, y: 5 },
  ],
  npcs: [
    { id: 'coworker1', char: 'villager2', x: 4, y: 4, wander: 0, dir: 'up', name: 'Coworker' },
    { id: 'coworker2', char: 'villager3', x: 8, y: 4, wander: 0, dir: 'up', name: 'Coworker' },
    { id: 'boss', char: 'inspector', x: 12, y: 2, wander: 1, name: 'The Inspector' },
  ],
});

export const LIBRARY = room({
  id: 'library', name: 'LIBRARY', w: 16, h: 11, wall: 'brown', floor: 'floorPlanksDark', exitX: 7, returnTo: { x: 37, y: 38 },
  furniture: [
    ...[1, 3, 5, 9, 11, 13].map((x, i) => ({ name: 'bookshelfFull', x, y: 1, id: `shelf:${i}` })),
    ...[2, 4].map((x, i) => ({ name: 'bookshelfFull', x, y: 4, id: `shelf:${6 + i}` })),
    ...[10, 12].map((x, i) => ({ name: 'bookshelfFull', x, y: 4, id: `shelf:${8 + i}` })),
    { name: 'scrollWall', x: 7, y: 0 },
    { name: 'tableLow', x: 6, y: 7, id: 'library:table' }, { name: 'cushion', x: 6, y: 8 }, { name: 'cushion', x: 8, y: 8 }, { name: 'cushion', x: 7, y: 6 },
    { name: 'cabinetBooksA', x: 14, y: 7 }, { name: 'cabinetBooksB', x: 1, y: 7 },
    { name: 'lanternFloor', x: 1, y: 9 }, { name: 'lanternFloor', x: 14, y: 9 }, { name: 'plantPotTall', x: 14, y: 2 },
  ],
  npcs: [{ id: 'librarian', char: 'monk', x: 7, y: 3, wander: 1, name: 'Librarian' }],
});
