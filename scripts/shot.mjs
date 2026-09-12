#!/usr/bin/env node
// Scripted screenshots of the running game via the installed Chrome.
// usage: node scripts/shot.mjs <url> <out.png> [--size 1440x900] [--wait 1500]
//        [--keys "ArrowRight*6,z,Enter"] [--gap 120] [--hold 0] [--mobile] [--fps]
// Keys are pressed in order; "Name*N" repeats; "~500" sleeps 500 ms; "+Name" holds a key down until "-Name".
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const url = args[0], out = args[1];
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const [w, h] = opt('--size', '1440x900').split('x').map(Number);
const wait = +opt('--wait', 1500);
const gap = +opt('--gap', 120);
const keys = opt('--keys', '');
const mobile = has('--mobile');

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--disable-gpu', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required', '--mute-audio'],
});
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.stack ?? e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error(`console.${m.type()}:`, m.text()); });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, wait));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const tok of keys.split(',').map((s) => s.trim()).filter(Boolean)) {
  if (tok.startsWith('~')) { await sleep(+tok.slice(1)); continue; }
  if (tok.startsWith('+')) { await page.keyboard.down(tok.slice(1)); continue; }
  if (tok.startsWith('-')) { await page.keyboard.up(tok.slice(1)); continue; }
  const [name, n] = tok.split('*');
  for (let i = 0; i < +(n ?? 1); i++) { await page.keyboard.down(name); await sleep(40); await page.keyboard.up(name); await sleep(gap); }
}

if (has('--fps')) {
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));
  console.log(`fps ~ ${fps.toFixed(0)}`);
}
await page.screenshot({ path: out });
console.log('saved', out);
await browser.close();
