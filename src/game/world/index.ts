import { TOWN } from './town';
import { HOME, OFFICE, LIBRARY } from './interiors';
import type { WorldDef } from './types';

export const MAPS: Record<string, WorldDef> = { town: TOWN, home: HOME, office: OFFICE, library: LIBRARY };

export function pickTown(): WorldDef {
  const m = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('map') : null;
  return (m && MAPS[m]) || TOWN;
}
