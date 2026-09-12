import puppeteer from 'puppeteer-core';
const [,, out, mode = 'desktop'] = process.argv;
const mobile = mode === 'mobile';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--disable-gpu', '--hide-scrollbars', '--mute-audio'] });
const page = await browser.newPage();
await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 1, hasTouch: true, isMobile: true } : { width: 1280, height: 720, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.stack ?? e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console.error:', m.text()); });
await page.evaluateOnNewDocument(() => { localStorage.setItem('doodle', JSON.stringify([{ c: 0, p: [10, 10, 60, 40, 100, 20] }, { c: 4, t: 'O', s: 1, p: [200, 100, 260, 140] }])); });
await page.goto('http://localhost:4400/?scene=doodle', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 2000));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rect = await page.evaluate(() => window.__game?.board?.rect ?? null);
console.log('rect', rect);
const drag = async (pts) => {
  await page.mouse.move(pts[0][0], pts[0][1]); await page.mouse.down();
  for (const [x, y] of pts.slice(1)) { await page.mouse.move(x, y, { steps: 6 }); await sleep(30); }
  await page.mouse.up(); await sleep(100);
};
const click = async (x, y) => { await page.mouse.click(x, y); await sleep(80); };
if (rect) {
  const sc = await page.evaluate(() => window.__game.scale);
  const P = (bx, by) => [(rect.x + bx * rect.s) * sc, (rect.y + by * rect.s) * sc];
  const items = await page.evaluate(() => window.__game.board.items.map((i) => ({ ...i })));
  const it = (kind, v) => { const i = items.find((i) => i.kind === kind && i.v === v); return [(i.x + i.w / 2) * sc, (i.y + i.w / 2) * sc]; };
  await drag([P(20, 120), P(60, 90), P(120, 130), P(160, 80)]);      // pen red
  await click(...it('color', 5)); await click(...it('tool', 2)); await click(...it('size', 1));
  await drag([P(180, 20), P(300, 80)]);                                 // blue rect
  await click(...it('color', 2)); await click(...it('tool', 5));
  await drag([P(30, 20), P(90, 70)]);                                   // orange filled ellipse
  await click(...it('color', 6)); await click(...it('tool', 1)); await click(...it('size', 2));
  await drag([P(120, 30), P(300, 150)]);                                // purple thick line
  await click(...it('eraser', 0));
  await drag([P(200, 40), P(260, 60)]);                                 // erase through rect
  await sleep(200);
}
await page.screenshot({ path: out });
console.log('saved', out);
await browser.close();
