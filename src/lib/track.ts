// First-party visitor log: who came, from where, on what, and everything they did in
// the session. Events go straight into a Supabase table (no SDK, one fetch); the /admin
// page reads them back through a password-checked RPC. Nothing runs unless
// site.supabase is configured. Setup SQL — run once in the Supabase SQL editor:
//
//   create extension if not exists pgcrypto;
//   create table if not exists events (
//     id bigint generated always as identity primary key,
//     ts timestamptz not null default now(),
//     visitor text, session text, type text not null, name text, path text, ref text,
//     country text, region text, city text,
//     ua text, device text, lang text, tz text, screen text, props jsonb
//   );
//   create index if not exists events_ts on events (ts desc);
//   alter table events enable row level security;
//   create policy "anyone can log" on events for insert to anon, authenticated with check (true);
//   -- (no select policy: visitors can write to the log but never read it)
//
//   create table if not exists admin_secret (id int primary key default 1, hash text not null);
//   alter table admin_secret enable row level security;   -- no policies: unreachable through the API
//   create or replace function set_admin_password(pw text) returns void
//     language sql security definer set search_path = public, extensions as $$
//     insert into admin_secret (id, hash) values (1, crypt(pw, gen_salt('bf')))
//     on conflict (id) do update set hash = excluded.hash;
//   $$;
//   revoke execute on function set_admin_password(text) from public, anon, authenticated;
//   select set_admin_password('change-me');   -- <- your /admin password (re-run to change it)
//
//   create or replace function admin_events(pw text, days int default 30, max_rows int default 20000)
//     returns setof events language plpgsql security definer set search_path = public, extensions as $$
//   begin
//     if not exists (select 1 from admin_secret where hash = crypt(pw, hash)) then
//       perform pg_sleep(1); raise exception 'wrong password';
//     end if;
//     return query select * from events where ts > now() - make_interval(days => days) order by ts desc limit max_rows;
//   end $$;
//   grant execute on function admin_events(text, int, int) to anon;

import { site } from '../data/site';

export type EventType = 'session' | 'pageview' | 'heartbeat' | 'leave' | 'click' | 'game' | 'error';

const cfg = site.supabase;
const isBrowser = typeof window !== 'undefined';
const DEV = isBrowser && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

function optedOut(): boolean {
  try { if (localStorage.getItem('notrack') === '1') return true; } catch {}
  return !!(navigator as any).globalPrivacyControl;
}
const isAdmin = isBrowser && location.pathname.startsWith('/admin');
export const enabled = isBrowser && !isAdmin && !!(cfg?.url && cfg?.anonKey) && !optedOut();

const id = (store: Storage, key: string) => {
  try {
    let v = store.getItem(key);
    if (!v) { v = crypto.randomUUID().slice(0, 12); store.setItem(key, v); }
    return v;
  } catch { return 'anon'; }
};
const visitor = isBrowser ? id(localStorage, 'vid') : '';
const session = isBrowser ? id(sessionStorage, 'sid') : '';
const visits = (() => { if (!isBrowser) return 0; try { const n = +(localStorage.getItem('visits') ?? 0) + (sessionStorage.getItem('counted') ? 0 : 1); localStorage.setItem('visits', String(n)); sessionStorage.setItem('counted', '1'); return n; } catch { return 0; } })();

const device = () => {
  const ua = navigator.userAgent;
  if (/iPad|Tablet|(Android(?!.*Mobile))/i.test(ua)) return 'tablet';
  if (/Mobi|iPhone|Android/i.test(ua) || matchMedia('(pointer: coarse)').matches) return 'mobile';
  return 'desktop';
};

/** Everything the browser will tell us about itself, sent once per session. */
function environment() {
  const n = navigator as any, c = n.connection ?? {};
  const utm: Record<string, string> = {};
  new URLSearchParams(location.search).forEach((v, k) => { if (/^(utm_|ref$|source$)/.test(k)) utm[k] = v.slice(0, 80); });
  return {
    platform: n.userAgentData?.platform ?? n.platform, brands: n.userAgentData?.brands?.map((b: any) => `${b.brand} ${b.version}`).join(', '),
    mobileHint: n.userAgentData?.mobile, vendor: n.vendor,
    languages: (n.languages ?? []).slice(0, 4).join(','), tzOffset: new Date().getTimezoneOffset(),
    viewport: `${innerWidth}x${innerHeight}`, dpr: devicePixelRatio, colorDepth: screen.colorDepth,
    orientation: screen.orientation?.type, touchPoints: n.maxTouchPoints, coarse: matchMedia('(pointer: coarse)').matches,
    darkMode: matchMedia('(prefers-color-scheme: dark)').matches, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    cores: n.hardwareConcurrency, memoryGB: n.deviceMemory, connection: c.effectiveType, downlink: c.downlink, saveData: c.saveData,
    cookies: n.cookieEnabled, doNotTrack: n.doNotTrack, online: n.onLine, pdf: n.pdfViewerEnabled, webdriver: n.webdriver,
    standalone: matchMedia('(display-mode: standalone)').matches, referrer: document.referrer.slice(0, 300), landing: location.pathname + location.search,
    utm, visits, returning: visits > 1,
    entryType: (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type,
  };
}

/** Coarse location from the visitor's IP, cached for the session. Blocked by some ad blockers — then it is just empty. */
let geoP: Promise<{ country?: string; region?: string; city?: string; isp?: string; ip?: string }> | null = null;
function geo() {
  if (geoP) return geoP;
  geoP = (async () => {
    try { const c = sessionStorage.getItem('geo'); if (c) return JSON.parse(c); } catch {}
    const get = async (url: string, map: (j: any) => any) => {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
      try { const r = await fetch(url, { signal: ctl.signal }); const j = await r.json(); return map(j); } finally { clearTimeout(t); }
    };
    let g: any = {};
    try { g = await get('https://ipapi.co/json/', (j) => ({ country: j.country_name, region: j.region, city: j.city, isp: j.org, ip: j.ip })); } catch {}
    if (!g?.country) { try { g = await get('https://ipwho.is/', (j) => ({ country: j.country, region: j.region, city: j.city, isp: j.connection?.isp, ip: j.ip })); } catch { g = {}; } }
    try { sessionStorage.setItem('geo', JSON.stringify(g ?? {})); } catch {}
    return g ?? {};
  })();
  return geoP;
}

const refHost = () => { try { const h = new URL(document.referrer).hostname; return h === location.hostname ? '' : h; } catch { return ''; } };

async function send(row: Record<string, unknown>) {
  try {
    await fetch(`${cfg.url}/rest/v1/events`, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
  } catch {}
}

let seq = 0;
const t0 = isBrowser ? performance.now() : 0;

/** Log one event. Safe to call anywhere; a no-op when tracking is off. */
export async function track(type: EventType, name = '', props: Record<string, unknown> = {}) {
  if (!enabled) return;
  const n = ++seq, at = Math.round((performance.now() - t0) / 100) / 10;
  const g = await geo();
  void send({
    visitor, session, type, name: String(name).slice(0, 200), path: location.pathname, ref: refHost(),
    country: g.country ?? null, region: g.region ?? null, city: g.city ?? null,
    ua: navigator.userAgent.slice(0, 300), device: device(), lang: navigator.language,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone, screen: `${screen.width}x${screen.height}`,
    props: { ...props, seq: n, at, ...(g.isp ? { isp: g.isp } : {}), ...(g.ip ? { ip: g.ip } : {}), ...(DEV ? { dev: true } : {}) },
  });
}

// ---- page-level auto tracking (runs once per page load) ----
if (enabled && !(window as any).__tracked) {
  (window as any).__tracked = true;

  let first = false;
  try { first = !sessionStorage.getItem('sess'); sessionStorage.setItem('sess', '1'); } catch {}
  if (first) void track('session', location.pathname, environment());
  void track('pageview', document.title, { viewport: `${innerWidth}x${innerHeight}`, query: location.search.slice(0, 200), hash: location.hash.slice(0, 80) });

  // clicks on anything: links get their href, other things a short description of what was hit
  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement | null; if (!t) return;
    const a = t.closest?.('a[href]') as HTMLAnchorElement | null;
    const btn = t.closest?.('button,[role=button],summary,label') as HTMLElement | null;
    const el = a ?? btn ?? t;
    const label = (el.getAttribute?.('aria-label') ?? el.textContent ?? '').trim().slice(0, 60);
    const name = a ? (a.getAttribute('href') ?? '') : `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`;
    if (!a && !btn && !label) return; // ignore clicks on bare space
    void track('click', name, { text: label, external: !!a && /^https?:/.test(name) && !name.includes(location.hostname), x: Math.round(e.clientX), y: Math.round(e.clientY) });
  }, { capture: true });

  // scroll depth + active time
  let maxScroll = 0, active = 0, lastTick = performance.now();
  const onScroll = () => { const d = document.documentElement; const depth = (scrollY + innerHeight) / Math.max(1, d.scrollHeight); maxScroll = Math.max(maxScroll, Math.min(1, depth)); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const tick = () => { const now = performance.now(); if (document.visibilityState === 'visible') active += now - lastTick; lastTick = now; };
  setInterval(tick, 1000);

  // heartbeat every 30s while visible: shows "still here" and survives tab kills
  setInterval(() => { tick(); if (document.visibilityState === 'visible') void track('heartbeat', document.title, { seconds: Math.round((performance.now() - t0) / 1000), active: Math.round(active / 1000), scroll: Math.round(maxScroll * 100), ...(window as any).__gameStats?.() }); }, 30000);

  let left = false;
  const leave = () => {
    if (left) return; left = true; tick();
    void track('leave', document.title, { seconds: Math.round((performance.now() - t0) / 1000), active: Math.round(active / 1000), scroll: Math.round(maxScroll * 100), ...(window as any).__gameStats?.() });
  };
  addEventListener('pagehide', leave);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') leave(); else left = false; });

  addEventListener('error', (e) => void track('error', (e.message ?? 'error').slice(0, 200), { src: `${e.filename ?? ''}:${e.lineno ?? 0}` }));
  addEventListener('unhandledrejection', (e) => void track('error', String((e as PromiseRejectionEvent).reason ?? 'rejection').slice(0, 200)));
}
