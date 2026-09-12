#!/usr/bin/env node
// Validates a town definition against the asset manifests.
// usage: node scripts/validate-town.mjs [town|townA|townB]
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const which = process.argv[2] ?? 'town';
const dir = mkdtempSync(join(tmpdir(), 'town-'));
const entry = join(dir, 'entry.ts');
writeFileSync(entry, `
  export { TOWN } from '${process.cwd()}/src/game/world/${which}.ts';
  export { TERRAINS, PIER } from '${process.cwd()}/src/game/assets/terrain.ts';
  export { PROPS, HOUSES } from '${process.cwd()}/src/game/assets/props.ts';
  export { CHARACTERS, ANIMALS } from '${process.cwd()}/src/game/assets/actors.ts';
`);
await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile: join(dir, 'out.mjs'), platform: 'neutral', logLevel: 'silent' });
const { TOWN, TERRAINS, PIER, PROPS, HOUSES, CHARACTERS, ANIMALS } = await import(pathToFileURL(join(dir, 'out.mjs')).href);
const props = { ...PROPS, ...PIER };

const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const W = TOWN.width, H = TOWN.height;
if (TOWN.ground.length !== H) err(`ground has ${TOWN.ground.length} rows, expected ${H}`);
TOWN.ground.forEach((r, y) => { if (r.length !== W) err(`row ${y} has ${r.length} chars, expected ${W}`); });
if (!TERRAINS[TOWN.base]) err(`unknown base terrain ${TOWN.base}`);
for (const [ch, name] of Object.entries(TOWN.legend)) if (!TERRAINS[name]) err(`legend '${ch}' -> unknown terrain ${name}`);
const used = new Set(TOWN.ground.join(''));
for (const ch of used) if (!TOWN.legend[ch]) err(`char '${ch}' used in ground but missing from legend`);

const terrain = (x, y) => TERRAINS[TOWN.legend[TOWN.ground[y]?.[x]] ?? TOWN.base] ?? TERRAINS[TOWN.base];
const solid = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => !terrain(x, y).walkable));
const owner = Array.from({ length: H }, () => Array(W).fill(null));
const doors = [];
const stamp = (prop, tx, ty, label) => {
  const fp = prop.footprint;
  for (let dx = 0; dx < fp.w; dx++) for (let dy = 0; dy < fp.h; dy++) {
    const x = tx + dx, y = ty - dy;
    if (x < 0 || y < 0 || x >= W || y >= H) { err(`${label} footprint out of bounds at ${x},${y}`); continue; }
    const walkway = prop.tags?.some((t) => t === 'pier' || t === 'dock' || t === 'bridge');
    if (walkway) solid[y][x] = false;
    else if (prop.solid) {
      if (owner[y][x]) warn(`${label} overlaps ${owner[y][x]} at ${x},${y}`);
      owner[y][x] = label; solid[y][x] = true;
    }
    if (!terrain(x, y).walkable && prop.solid && !walkway) warn(`${label} placed on water at ${x},${y}`);
  }
};
for (const p of TOWN.props) {
  const prop = props[p.name];
  if (!prop) { err(`unknown prop '${p.name}' at ${p.x},${p.y}`); continue; }
  stamp(prop, p.x, p.y, `${p.name}${p.id ? '#' + p.id : ''}`);
}
for (const h of TOWN.houses) {
  let house = HOUSES[h.name];
  if (!house) { err(`unknown house '${h.name}' (${h.id})`); continue; }
  const rows = Math.round(house.prop.region.h / 16);
  house = { ...house, prop: { ...house.prop, footprint: { ...house.prop.footprint, h: Math.max(house.prop.footprint.h, Math.min(2, rows - 1)) } } };
  stamp(house.prop, h.x, h.y, `house:${h.id}`);
  const fp = house.prop.footprint;
  const dx = h.x + house.door.tileX, dy = h.y - house.door.tileY;
  doors.push({ id: h.id, x: dx, y: dy + 1, label: h.label });
  if (dy + 1 >= H || solid[dy + 1][dx]) err(`door of ${h.id} at ${dx},${dy} has no walkable tile in front (${dx},${dy + 1})`);
}
// walkable BFS from spawn
const sp = TOWN.spawn;
if (solid[sp.y]?.[sp.x] !== false) err(`spawn ${sp.x},${sp.y} is not walkable`);
const seen = Array.from({ length: H }, () => Array(W).fill(false));
const q = [[sp.x, sp.y]]; seen[sp.y][sp.x] = true;
while (q.length) {
  const [x, y] = q.shift();
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen[ny][nx] || solid[ny][nx]) continue;
    seen[ny][nx] = true; q.push([nx, ny]);
  }
}
let reach = 0; for (const r of seen) for (const v of r) if (v) reach++;
for (const d of doors) if (!seen[d.y]?.[d.x]) err(`door of ${d.id} (front tile ${d.x},${d.y}) is not reachable from spawn`);
for (const n of TOWN.npcs) {
  if (!CHARACTERS[n.char] && !ANIMALS[n.char]) err(`npc ${n.id}: unknown char '${n.char}'`);
  if (solid[n.y]?.[n.x] !== false) err(`npc ${n.id} at ${n.x},${n.y} stands on a solid tile`);
  else if (!seen[n.y][n.x]) warn(`npc ${n.id} at ${n.x},${n.y} is in an area the player cannot reach`);
}
for (const s of TOWN.signs) {
  if (s.x < 0 || s.y < 0 || s.x >= W || s.y >= H) err(`sign ${s.id} out of bounds`);
  const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen[s.y + dy]?.[s.x + dx]);
  if (!around) err(`sign ${s.id} at ${s.x},${s.y} cannot be faced from any reachable tile`);
}
// border must be sealed
let leaks = 0;
for (let x = 0; x < W; x++) { if (seen[0][x]) leaks++; if (seen[H - 1][x]) leaks++; }
for (let y = 0; y < H; y++) { if (seen[y][0]) leaks++; if (seen[y][W - 1]) leaks++; }
if (leaks) err(`${leaks} border tiles are reachable: seal the map edge with trees/water/fences`);
// required ids
const need = { houses: ['home', 'office', 'library', 'workshop'], signs: ['sign-home', 'sign-office', 'sign-library', 'sign-workshop', 'sign-welcome', 'board', 'mailbox'], npcs: ['elder', 'kid', 'monk', 'worker', 'woman', 'hunter'] };
const ids = { houses: TOWN.houses.map((h) => h.id), signs: [...TOWN.signs.map((s) => s.id), ...TOWN.props.filter((p) => p.id).map((p) => p.id)], npcs: TOWN.npcs.map((n) => n.id) };
for (const [k, list] of Object.entries(need)) for (const id of list) if (!ids[k].includes(id)) err(`missing required ${k} id '${id}'`);
// stats
const count = (pred) => TOWN.props.filter(pred).length;
const stats = { size: `${W}x${H}`, reachableTiles: reach, props: TOWN.props.length, trees: count((p) => /tree/i.test(p.name)), flowers: count((p) => /flower|plant|bush|grass/i.test(p.name)), houses: TOWN.houses.length, npcs: TOWN.npcs.length, encounterTiles: TOWN.ground.join('').split('').filter((c) => TERRAINS[TOWN.legend[c]]?.encounter).length };
console.log(JSON.stringify({ ok: errors.length === 0, errors, warnings: warns.slice(0, 40), warningCount: warns.length, stats }, null, 2));
process.exit(errors.length ? 1 : 0);
