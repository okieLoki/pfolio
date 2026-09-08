// Image + font loading with de-duplication. Everything the manifests reference
// is fetched once up front so the frame loop never waits on the network.

const cache = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(url: string): Promise<HTMLImageElement> {
  let p = cache.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${url}`));
      img.src = url;
    });
    cache.set(url, p);
  }
  return p;
}

export async function loadImages(urls: Iterable<string>, onProgress?: (done: number, total: number) => void) {
  const list = [...new Set(urls)];
  const out = new Map<string, HTMLImageElement>();
  let done = 0;
  await Promise.all(list.map(async (u) => {
    out.set(u, await loadImage(u));
    onProgress?.(++done, list.length);
  }));
  return out;
}

export async function loadFont(family: string, url: string) {
  try {
    const face = new FontFace(family, `url(${url})`);
    await face.load();
    document.fonts.add(face);
    return true;
  } catch {
    return false;
  }
}

/** Walk any manifest object and collect every `sheet`/`url` string under /game/. */
export function collectUrls(obj: unknown, out = new Set<string>()): Set<string> {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if ((k === 'sheet' || k === 'url') && typeof v === 'string' && v.endsWith('.png')) out.add(v);
    else if (v && typeof v === 'object') collectUrls(v, out);
  }
  return out;
}
