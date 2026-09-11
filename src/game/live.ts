// Live data, all optional and failure-tolerant: real weather at the owner's
// location drives rain/clouds in the town; GitHub feeds the Workshop.

export type Weather = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow';

export interface LiveWeather { weather: Weather; tempC: number; description: string }

const WMO: [number, number, Weather, string][] = [
  [0, 0, 'clear', 'clear skies'], [1, 2, 'clear', 'a few clouds'], [3, 3, 'cloudy', 'overcast'],
  [45, 48, 'cloudy', 'fog'], [51, 57, 'rain', 'drizzle'], [61, 67, 'rain', 'rain'], [71, 77, 'snow', 'snow'],
  [80, 82, 'rain', 'showers'], [85, 86, 'snow', 'snow showers'], [95, 99, 'storm', 'a thunderstorm'],
];

/** Open-Meteo: free, no key. Geocodes the place name, then reads current weather. */
export async function fetchWeather(place: string): Promise<LiveWeather | null> {
  try {
    const city = place.split(',')[0].trim();
    const geo = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`)).json();
    const hit = geo?.results?.[0];
    if (!hit) return null;
    const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&current=temperature_2m,weather_code`)).json();
    const code = w?.current?.weather_code ?? 0;
    const row = WMO.find(([a, b]) => code >= a && code <= b) ?? WMO[0];
    return { weather: row[2], tempC: Math.round(w?.current?.temperature_2m ?? 0), description: row[3] };
  } catch {
    return null;
  }
}

export interface Repo { name: string; description: string; url: string; stars: number; language: string; pushed: string }

/** Latest public repos for a GitHub user (unauthenticated: 60 req/h per IP — cached for an hour). */
export async function fetchRepos(user: string): Promise<Repo[]> {
  if (!user) return [];
  const key = `gh:${user}`;
  try {
    const cached = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (cached && Date.now() - cached.t < 3600_000) return cached.repos;
  } catch {}
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?sort=pushed&per_page=8&type=owner`);
    if (!res.ok) return [];
    const list = await res.json();
    const repos: Repo[] = (list as any[]).filter((r) => !r.fork).slice(0, 6).map((r) => ({
      name: r.name, description: r.description ?? '', url: r.html_url, stars: r.stargazers_count ?? 0, language: r.language ?? '', pushed: (r.pushed_at ?? '').slice(0, 10),
    }));
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), repos })); } catch {}
    return repos;
  } catch {
    return [];
  }
}
