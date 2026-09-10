// Time of day. The town follows the owner's local time; visitors can pin a
// phase with SELECT (persisted) or ?phase=.

export type Phase = 'dawn' | 'day' | 'dusk' | 'night';
export const PHASES: Phase[] = ['dawn', 'day', 'dusk', 'night'];

export interface Ambient {
  /** multiply colour applied over the scene ('#ffffff' = untouched) */
  tint: string;
  /** whether lanterns/windows glow */
  lights: boolean;
  /** additive haze colour drawn at low alpha (sun rays at day, warm at dusk) */
  haze: string | null;
  hazeAlpha: number;
  fireflies: boolean;
  label: string;
}

export const AMBIENT: Record<Phase, Ambient> = {
  dawn: { tint: '#d8d0e8', lights: true, haze: '#ffb0a0', hazeAlpha: 0.14, fireflies: false, label: 'DAWN' },
  day: { tint: '#ffffff', lights: false, haze: '#fff4c8', hazeAlpha: 0.05, fireflies: false, label: 'DAY' },
  dusk: { tint: '#d89a7a', lights: true, haze: '#ff7a40', hazeAlpha: 0.12, fireflies: true, label: 'DUSK' },
  night: { tint: '#4c5aa8', lights: true, haze: null, hazeAlpha: 0, fireflies: true, label: 'NIGHT' },
};

export function autoPhase(timeZone: string): Phase {
  let h = new Date().getHours();
  try { h = +new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(new Date()); } catch {}
  return h < 5 ? 'night' : h < 8 ? 'dawn' : h < 17 ? 'day' : h < 20 ? 'dusk' : 'night';
}

export function pinnedPhase(): Phase | null {
  const url = new URLSearchParams(location.search).get('phase') as Phase | null;
  if (url && PHASES.includes(url)) return url;
  try {
    const s = localStorage.getItem('phase') as Phase | null;
    if (s && PHASES.includes(s)) return s;
  } catch {}
  return null;
}

export function pinPhase(p: Phase | null) {
  try { p ? localStorage.setItem('phase', p) : localStorage.removeItem('phase'); } catch {}
}
