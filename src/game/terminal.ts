// The office computer: a small shell over the portfolio. `help` lists what it knows.
// Typing goes through a hidden <input> so phones get a real keyboard and IMEs work;
// the game only reads the value back.

import type { Ctx } from './core/gfx';
import type { TextRenderer } from './core/text';
import { SAFE } from './core/dialogue';
import type { GameApi } from './content';
import { track } from '../lib/track';

type Line = { text: string; color?: string };

const C = {
  out: '#9fe89a', dim: '#5fa66a', bright: '#e8ffe6', err: '#ff8a7a', link: '#8ad8ff', prompt: '#ffd25a', title: '#7be07a',
};
const PROMPT = 'guest@office:~$ ';
const FILES = ['about.txt', 'now.txt', 'work.log', 'links.txt', 'projects/', 'posts/'];
const FORTUNES = [
  'It works on my machine. Ship the machine.',
  'There are 10 kinds of people: those who read the docs and those who ask in Slack.',
  'A deploy on Friday is a weekend plan.',
  'The bug is always in the line you did not read.',
  'Naming things is hard. So is cache invalidation. So is off-by-one.',
  'Any sufficiently advanced regex is indistinguishable from a cry for help.',
  'Rewrite it in Rust. (This message brought to you by the Rust Evangelism Strike Force.)',
  'Today\'s forecast: 90% chance of merge conflicts.',
];
const strip = (s: string) => s.replace(/<[^>]+>/g, '');

export class Terminal {
  open = false;
  private lines: Line[] = [];
  private input = '';
  private history: string[] = [];
  private hIdx = -1;
  private scroll = 0;
  private t = 0;
  private el: HTMLInputElement;
  private resolve: (() => void) | null = null;
  private chips: { label: string; cmd: string; x: number; y: number; w: number; h: number }[] = [];
  private inputRect = { x: 0, y: 0, w: 0, h: 0 };
  private touch = false;
  private after: (() => void) | null = null;

  constructor(private api: GameApi) {
    this.el = document.createElement('input');
    Object.assign(this.el, { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: false, inputMode: 'text', enterKeyHint: 'send' } as Partial<HTMLInputElement>);
    this.el.setAttribute('autocorrect', 'off');
    this.el.setAttribute('aria-label', 'Terminal input');
    this.el.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px;pointer-events:none;z-index:-1';
    document.body.appendChild(this.el);
    this.el.addEventListener('input', () => { this.input = this.el.value; this.scroll = 0; });
    window.addEventListener('keydown', (e) => this.onKey(e), true);
    window.addEventListener('wheel', (e) => { if (this.open) this.scrollBy(Math.sign(e.deltaY) * -2); }, { passive: true });
  }

  /** Opens the shell; resolves when the user exits. */
  show(): Promise<void> {
    this.open = true;
    this.touch = matchMedia('(pointer: coarse)').matches;
    this.lines = [];
    this.input = ''; this.el.value = ''; this.hIdx = -1; this.scroll = 0;
    this.print(`UDDEEPTA-OS 1.0  (tty1)  ${this.api.data.site.location}`, C.title);
    this.print('');
    this.print(`Welcome. Type ${this.touch ? 'or tap' : ''} "help" to see what this machine can do.`, C.dim);
    this.print('');
    this.focus();
    return new Promise((r) => { this.resolve = r; });
  }

  hide() {
    this.open = false;
    this.el.blur();
    const r = this.resolve; this.resolve = null; r?.();
    const a = this.after; this.after = null; a?.();
  }

  /** Called from a real pointer gesture on the canvas — the only time phones will show the keyboard. */
  pointer(gx: number, gy: number) {
    for (const c of this.chips) if (gx >= c.x && gy >= c.y && gx < c.x + c.w && gy < c.y + c.h) { this.submit(c.cmd); return; }
    this.focus();
  }

  private focus() { try { this.el.focus({ preventScroll: true }); } catch {} }

  private onKey(e: KeyboardEvent) {
    if (!this.open) return;
    if (e.metaKey || e.altKey) return;          // leave browser shortcuts alone
    if (e.ctrlKey) {
      if (e.key === 'l') { this.lines = []; e.preventDefault(); }
      if (e.key === 'c') { this.print(PROMPT + this.input + '^C', C.dim); this.setInput(''); e.preventDefault(); }
      e.stopPropagation();
      return;
    }
    e.stopPropagation();                        // the game's Input must not see these
    switch (e.key) {
      case 'Enter': this.submit(this.input); e.preventDefault(); break;
      case 'Escape': this.hide(); e.preventDefault(); break;
      case 'ArrowUp': this.recall(1); e.preventDefault(); break;
      case 'ArrowDown': this.recall(-1); e.preventDefault(); break;
      case 'PageUp': this.scrollBy(6); e.preventDefault(); break;
      case 'PageDown': this.scrollBy(-6); e.preventDefault(); break;
      case 'Tab': this.complete(); e.preventDefault(); break;
      default:
        if (document.activeElement !== this.el) {
          // focus drifted (clicked the canvas): take the keystroke ourselves so nothing is lost
          if (e.key.length === 1) { this.setInput(this.input + e.key); e.preventDefault(); }
          else if (e.key === 'Backspace') { this.setInput(this.input.slice(0, -1)); e.preventDefault(); }
          this.focus();
        }
    }
  }

  private setInput(v: string) { this.input = v; this.el.value = v; this.scroll = 0; }
  private recall(dir: number) {
    if (!this.history.length) return;
    this.hIdx = Math.max(-1, Math.min(this.history.length - 1, this.hIdx + dir));
    this.setInput(this.hIdx < 0 ? '' : this.history[this.history.length - 1 - this.hIdx]);
  }
  private complete() {
    const [head, ...rest] = this.input.split(' ');
    if (rest.length === 0) {
      const m = Object.keys(this.commands()).filter((c) => c.startsWith(head));
      if (m.length === 1) this.setInput(m[0] + ' ');
      else if (m.length > 1) this.print(m.join('  '), C.dim);
    } else if (head === 'cat' || head === 'open') {
      const m = FILES.filter((f) => f.startsWith(rest[rest.length - 1]));
      if (m.length === 1) this.setInput(`${head} ${m[0]}`);
    }
  }
  private scrollBy(n: number) { this.scroll = Math.max(0, Math.min(Math.max(0, this.lines.length - 3), this.scroll + n)); }

  private print(text: string, color?: string) {
    this.lines.push({ text, color });
    if (this.lines.length > 400) this.lines.splice(0, this.lines.length - 400);
  }

  private submit(raw: string) {
    const cmd = raw.trim();
    this.print(PROMPT + cmd, C.bright);
    this.setInput('');
    if (!cmd) return;
    if (this.history[this.history.length - 1] !== cmd) this.history.push(cmd);
    this.hIdx = -1;
    const [name, ...args] = cmd.split(/\s+/);
    const fn = this.commands()[name.toLowerCase()];
    track('game', 'terminal', { cmd: cmd.slice(0, 80), known: !!fn });
    if (fn) { try { fn(args, cmd); } catch { this.print('segmentation fault (core dumped, sorry)', C.err); } }
    else this.print(`${name}: command not found. Try "help".`, C.err);
    this.api.sfx('select');
  }

  private openUrl(href: string) {
    this.print(`opening ${href} ...`, C.link);
    setTimeout(() => this.api.goTo(href), 350);
  }

  private commands(): Record<string, (args: string[], raw: string) => void> {
    const d = this.api.data, p = (s: string, c?: string) => this.print(s, c);
    const posts = () => { d.posts.forEach((x, i) => p(`  [${i + 1}] ${x.title}  (${x.date})`)); if (!d.posts.length) p('  (nothing here yet)', C.dim); p('open <n> reads one.', C.dim); };
    const projects = () => {
      d.projects.forEach((x, i) => p(`  [${i + 1}] ${x.name} - ${x.description}`));
      const repos = this.api.repos();
      if (repos.length) { p(''); p(`  latest on github (${d.site.github}):`, C.dim); repos.slice(0, 5).forEach((r, i) => p(`  [g${i + 1}] ${r.name}${r.stars ? ` *${r.stars}` : ''}  ${r.description || ''}`)); }
      p('open <n> / open g<n> visits one.', C.dim);
    };
    const work = () => d.work.forEach((w) => p(`  ${w.start}-${w.end}  ${w.role} @ ${w.org}`));
    const links = () => d.elsewhere.forEach((l, i) => p(`  [${l.label.toLowerCase()}] ${l.value}`));
    const about = () => { p(strip(d.site.headline.replace(/\*/g, '')), C.bright); d.intro.forEach((s) => { p(''); p(strip(s)); }); };
    const now = () => d.now.forEach((s) => p(`  - ${strip(s)}`));
    const cat = (f?: string) => {
      switch ((f ?? '').replace(/\/$/, '')) {
        case 'about.txt': return about();
        case 'now.txt': return now();
        case 'work.log': return work();
        case 'links.txt': return links();
        case 'projects': return projects();
        case 'posts': return posts();
        case '': return p('cat: which file? try ls', C.err);
        default: return p(`cat: ${f}: no such file`, C.err);
      }
    };
    const open = (what?: string) => {
      if (!what) return p('open what? a post number, g<n> for a repo, or a link name (github, x, linkedin, email)', C.err);
      const n = +what;
      if (n && d.posts[n - 1]) return this.openUrl(`/posts/${d.posts[n - 1].id}`);
      if (/^g\d+$/.test(what)) { const r = this.api.repos()[+what.slice(1) - 1]; return r ? this.openUrl(r.url) : p('no such repo', C.err); }
      const pr = d.projects.find((x) => x.name.toLowerCase() === what.toLowerCase());
      if (pr && pr.href && pr.href !== '#') return this.openUrl(pr.href);
      const l = d.elsewhere.find((x) => x.label.toLowerCase() === what.toLowerCase());
      if (l) return this.openUrl(l.href);
      if (/^https?:\/\//.test(what)) return this.openUrl(what);
      p(`open: don't know "${what}"`, C.err);
    };
    const time = () => {
      const now = new Date();
      const local = now.toLocaleTimeString('en-IN', { timeZone: d.site.timeZone, hour: '2-digit', minute: '2-digit' });
      p(`${now.toDateString()}  ${local} in ${d.site.location} (${this.api.phaseLabel().toLowerCase()})`);
    };
    const weather = () => { const w = this.api.weather(); w ? p(`${d.site.location}: ${w.description}, ${Math.round(w.tempC)} C`) : p('weather: no signal (offline?)', C.err); };

    return {
      help: () => {
        p('commands:', C.bright);
        [['help', 'this list'], ['about', 'who runs this town'], ['now', 'what I am up to'], ['work', 'work history'], ['projects', 'things I built (+ live github)'],
          ['posts', 'blog posts'], ['open <n|name>', 'open a post, repo or link'], ['links', 'where to find me'], ['mail', 'send me an email'],
          ['weather', 'live weather here'], ['date', 'local time'], ['bugs', 'bugs you have fixed'], ['neofetch', 'system info'], ['fortune', 'wisdom'],
          ['cowsay <text>', 'moo'], ['music on|off', 'toggle music'], ['doodle', 'open the doodle wall'], ['ls, cat, pwd, echo, clear', 'the usual'], ['exit', 'leave the computer']]
          .forEach(([c, h]) => p(`  ${c.padEnd(24, ' ')}${h}`));
      },
      about, whoami: () => p(`${d.site.name} - ${strip(d.site.headline.replace(/\*/g, ''))}`), now, work, projects, posts, blog: posts, links, contact: links,
      ls: (a) => (a[0] ? cat(a[0]) : p(FILES.join('   '))),
      cat: (a) => cat(a[0]),
      open: (a) => open(a[0]), read: (a) => open(a[0]),
      mail: () => this.openUrl(`mailto:${d.site.email}`),
      github: () => (d.site.github ? this.openUrl(`https://github.com/${d.site.github}`) : p('no github configured', C.err)),
      weather, date: time, time,
      bugs: () => { const n = this.api.bugsFixed(); p(n ? `you have squashed ${n} bug${n === 1 ? '' : 's'} in this town. hero.` : 'no bugs fixed yet. walk in the tall grass.'); },
      pwd: () => p('/home/guest/office'),
      echo: (_a, raw) => p(raw.slice(5)),
      clear: () => { this.lines = []; },
      neofetch: () => {
        const w = this.api.weather();
        [`  ${d.site.name}@town`, '  ------------------', '  OS: UDDEEPTA-OS 1.0 (pixel)', `  Host: ${d.site.location}`, `  Uptime: since ${d.work[d.work.length - 1]?.start ?? '?'}`,
          `  Shell: guest-sh`, `  Job: ${d.work[0]?.role ?? '?'} @ ${d.work[0]?.org ?? '?'}`, `  Weather: ${w ? `${w.description}, ${Math.round(w.tempC)} C` : 'unknown'}`,
          `  Bugs fixed: ${this.api.bugsFixed()}`, `  Theme: ${this.api.phaseLabel().toLowerCase()}`].forEach((l) => p(l, C.out));
      },
      fortune: () => p(FORTUNES[Math.floor(Math.random() * FORTUNES.length)]),
      cowsay: (_a, raw) => {
        const msg = raw.slice(7).trim() || 'moo';
        [` ${'_'.repeat(msg.length + 2)}`, `< ${msg} >`, ` ${'-'.repeat(msg.length + 2)}`, '        \\   ^__^', '         \\  (oo)\\_______', '            (__)\\       )\\/\\', '                ||----w |', '                ||     ||'].forEach((l) => p(l));
      },
      music: (a) => { const want = a[0]; const muted = this.api.isMuted(); if ((want === 'on' && muted) || (want === 'off' && !muted) || !want) this.api.toggleMute(); p(`music ${this.api.isMuted() ? 'off' : 'on'}`); },
      doodle: () => { this.after = () => { this.api.doodle(); }; this.hide(); },
      sudo: () => p('guest is not in the sudoers file. This incident will be reported to The Inspector.', C.err),
      rm: (a) => p(a.join(' ').includes('-rf') ? 'rm: permission denied. The town needs those files.' : 'rm: nothing happened, and that is for the best.', C.err),
      vim: () => p('E37: No write since last change. (Also: how do I exit this?)', C.err), vi: () => p('use vim', C.dim), nano: () => p('a person of taste.', C.dim), emacs: () => p('emacs: not enough RAM in this town.', C.err),
      hire: () => { p('great idea. opening mail...'); this.openUrl(`mailto:${d.site.email}?subject=Hello from your town`); },
      man: (a) => p(a[0] ? `no manual entry for ${a[0]}. try "help".` : 'what manual page do you want?', C.dim),
      hello: () => p('hi! type help.'), hi: () => p('hello. type help.'),
      exit: () => this.hide(), quit: () => this.hide(), logout: () => this.hide(), q: () => this.hide(),
    };
  }

  update(dt: number) { this.t += dt; }

  draw(g: Ctx, vw: number, vh: number, text: TextRenderer) {
    const lh = text.lineHeight, pad = 6;
    const x0 = 6, y0 = SAFE.top + 4, w = vw - 12, h = vh - SAFE.top - SAFE.bottom - 8;
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, vw, vh);
    g.fillStyle = '#06110c'; g.fillRect(x0, y0, w, h);
    g.strokeStyle = '#2f6b47'; g.lineWidth = 1; g.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
    // header
    g.fillStyle = '#0d2418'; g.fillRect(x0 + 1, y0 + 1, w - 2, lh + 2);
    text.draw(g, 'OFFICE TERMINAL', x0 + pad, y0 + 2, { color: C.title });
    const hint = this.touch ? 'tap a command or the line to type' : 'ESC exits';
    text.draw(g, hint, x0 + w - pad - text.width(hint), y0 + 2, { color: C.dim });

    // command chips for touch screens
    this.chips = [];
    let bottom = y0 + h - pad;
    if (this.touch) {
      const items: [string, string][] = [['help', 'help'], ['about', 'about'], ['work', 'work'], ['projects', 'projects'], ['posts', 'posts'], ['links', 'links'], ['exit', 'exit']];
      const ch = lh + 4, gap = 3; let cx = x0 + pad, cy = bottom - ch;
      for (const [label, cmd] of items) {
        const cw = text.width(label) + 8;
        if (cx + cw > x0 + w - pad) { cx = x0 + pad; cy -= ch + gap; }
        this.chips.push({ label, cmd, x: cx, y: cy, w: cw, h: ch });
        cx += cw + gap;
      }
      const top = Math.min(...this.chips.map((c) => c.y));
      for (const c of this.chips) {
        g.fillStyle = '#123a26'; g.fillRect(c.x, c.y, c.w, c.h);
        g.strokeStyle = '#3f8a5c'; g.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
        text.draw(g, c.label, c.x + 4, c.y + 2, { color: C.bright });
      }
      bottom = top - pad;
    }

    // the input line, then the scrollback growing upwards
    const maxW = w - pad * 2;
    const cursor = Math.floor(this.t * 2.5) % 2 === 0 ? '_' : ' ';
    const inputLines = text.wrap(PROMPT + this.input + cursor, maxW);
    let y = bottom - inputLines.length * lh;
    this.inputRect = { x: x0, y, w, h: inputLines.length * lh };
    inputLines.forEach((l, i) => text.draw(g, l, x0 + pad, y + i * lh, { color: i === 0 ? C.prompt : C.bright }));
    if (this.touch && !this.input) text.draw(g, '(tap here to type)', x0 + pad + text.width(PROMPT), y, { color: C.dim });

    const top = y0 + lh + 4 + pad;
    let idx = this.lines.length - 1 - this.scroll;
    while (y > top && idx >= 0) {
      const line = this.lines[idx--];
      const wrapped = line.text ? text.wrap(line.text, maxW) : [''];
      for (let i = wrapped.length - 1; i >= 0; i--) {
        y -= lh;
        if (y < top) break;
        text.draw(g, wrapped[i], x0 + pad, y, { color: line.color ?? C.out });
      }
    }
    if (this.scroll > 0) text.draw(g, `... ${this.scroll} more below`, x0 + w - pad - text.width(`... ${this.scroll} more below`), top, { color: C.dim });

    // scanlines + faint phosphor glow
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let sy = y0 + 1; sy < y0 + h - 1; sy += 3) g.fillRect(x0 + 1, sy, w - 2, 1);
  }
}
