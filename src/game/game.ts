// The game: boot → title → town (→ battle). Owns the loop, camera, rendering
// order, actors, scripting, and the full-screen pixel-perfect presentation.

import type { Anim, CharacterSheet, Prop, Region, Terrain, NineSlice, BitmapFont } from './assets/types';
import { loadImages, loadFont, collectUrls } from './core/loader';
import { makeCanvas, clamp, lerp, type Ctx } from './core/gfx';
import { BitmapText, type TextRenderer } from './core/text';
import { TtfText } from './core/ttftext';
import { drawNineSlice, drawRegion } from './core/ui';
import { Input, DIR_BTNS, type Btn } from './core/input';
import { AudioBus, type MusicDef, type SfxDef } from './core/audio';
import { Dialogue, Menu, SAFE, type MenuItem, type UiArt } from './core/dialogue';
import { World, TILE, type PropInstance } from './world/world';
import { Actor, DIRS, OPPOSITE } from './world/actors';
import type { WorldDef } from './world/types';
import { Lighting } from './render/lighting';
import { Particles } from './render/particles';
import { AMBIENT, PHASES, autoPhase, pinnedPhase, pinPhase, type Phase } from './render/daylight';
import { buildContent, MONSTER_NAMES, TRIVIA, JOKE_MOVES, type GameData, type GameApi, type Speaker, type Script } from './content';
import { fetchWeather, fetchRepos, type LiveWeather, type Repo } from './live';
import { Board, LocalStore, SupabaseStore } from './board';
import { Terminal } from './terminal';
import { track } from '../lib/track';

export interface Manifest {
  terrains: Record<string, Terrain>;
  props: Record<string, Prop>;
  houses: Record<string, { prop: Prop; door: { tileX: number; tileY: number } }>;
  characters: Record<string, CharacterSheet>;
  animals: Record<string, CharacterSheet>;
  animalFacing: Record<string, 'down' | 'up' | 'left' | 'right'>;
  monsters: Record<string, CharacterSheet>;
  shadow: Region;
  ui: { dialogBox: NineSlice; dialogBoxSimple?: NineSlice; choiceBox: NineSlice; nameTag: NineSlice; facesetBox?: Region; cursor?: Region; arrowDown?: Region };
  font: BitmapFont;
  fontBearing?: Record<string, number>;
  ttf?: { url: string; family: string; pixelSize: number };
  emotes: Record<string, Anim>;
  fx: Record<string, Anim>;
  overlays?: { raylight?: Region; fog?: Region };
  music: Record<string, MusicDef>;
  sfx: Record<string, SfxDef>;
}

type State = 'boot' | 'title' | 'world' | 'battle';

interface Flutter { anim: CharacterSheet; x: number; y: number; t: number; region: { x: number; y: number; w: number; h: number }; phase: number }

export class Game {
  private screen: Ctx;
  private scene!: HTMLCanvasElement;
  private g!: Ctx;
  private scale = 3;
  private vw = 480;
  private vh = 300;
  private dpr = 1;

  private input = new Input();
  private audio!: AudioBus;
  private images!: Map<string, HTMLImageElement>;
  private text!: TextRenderer;
  private uiArt!: UiArt;
  private dialogue!: Dialogue;
  private menu!: Menu;
  private world!: World;
  private particles!: Particles;
  private lighting!: Lighting;
  private content!: ReturnType<typeof buildContent>;

  private state: State = 'boot';
  private phase: Phase = 'day';
  private pinned: Phase | null = null;
  private time = 0;
  private tickAcc = 0;
  private loadProgress = 0;

  private player!: Actor;
  private npcs: Actor[] = [];
  private flutters: Flutter[] = [];
  private cam = { x: 0, y: 0 };
  private camTarget = { x: 0, y: 0 };
  private fade = { alpha: 1, target: 0, speed: 1.5, cb: null as null | (() => void) };
  private flash = 0;
  private toastMsg: { text: string; t: number } | null = null;
  private lastRegion: string | null = null;
  private busy = false;               // a script is running
  private leafT = 0; private cloudT = 0; private fireflyT = 0; private ambientT = 0;
  private stepCount = 0;
  private titlePan = 0;
  private battle: { monster: CharacterSheet; key: string; hp: number; shake: number; t: number } | null = null;
  private saveT = 0;
  private hintShown = false;
  private queuedDir: 'up' | 'down' | 'left' | 'right' | null = null;
  private live: { weather: LiveWeather | null; repos: Repo[] } = { weather: null, repos: [] };
  private rainT = 0;
  private board!: Board;
  private terminal!: Terminal;
  /** what this visitor did with the game; attached to heartbeat/leave events */
  private tally = { steps: 0, talks: 0, battles: 0, wins: 0, signs: 0, maps: new Set<string>() };
  private boardResolve: (() => void) | null = null;

  private maps: Record<string, WorldDef>;
  private mapId = 'town';
  private worlds = new Map<string, World>();
  private actorsByMap = new Map<string, Actor[]>();
  private flutterByMap = new Map<string, Flutter[]>();
  private get worldDef() { return this.maps[this.mapId]; }
  private get indoor() { return !!this.worldDef.indoor; }

  constructor(private canvas: HTMLCanvasElement, private data: GameData, private manifest: Manifest, maps: Record<string, WorldDef>, touchRoot: HTMLElement | null) {
    this.maps = maps;
    this.screen = canvas.getContext('2d')!;
    if (touchRoot) this.input.bindTouch(touchRoot);
    this.input.onInteraction = (gesture) => { if (gesture) { this.audio.unlock(); this.audio.preloadSfx(); } };
    window.addEventListener('resize', () => this.resize());
    // coming back via the browser's Back button restores the page from bfcache mid-fade
    window.addEventListener('pageshow', (e) => {
      if (!(e as PageTransitionEvent).persisted) return;
      this.busy = false; this.dialogue?.close(); this.menu?.close();
      this.fadeTo(0);
      if (this.state === 'world') this.audio.playMusic(this.phase === 'night' ? 'overworldNight' : 'overworld');
      else if (this.state === 'battle') this.audio.playMusic('battle');
    });
    this.pinned = pinnedPhase();
    this.phase = this.pinned ?? autoPhase(data.site.timeZone);
  }

  // ------------------------------------------------------------ boot

  async start() {
    this.audio = new AudioBus(this.manifest.music, this.manifest.sfx);
    this.resize();
    const urls = collectUrls(this.manifest);
    const fontP = this.manifest.ttf ? loadFont(this.manifest.ttf.family, this.manifest.ttf.url) : Promise.resolve(false);
    this.images = await loadImages(urls, (d, t) => { this.loadProgress = d / t; this.renderBoot(); });
    const ttfOk = await fontP;

    this.text = ttfOk && this.manifest.ttf
      ? new TtfText(this.manifest.ttf.family, this.manifest.ttf.pixelSize, 12)
      : new BitmapText(this.images.get(this.manifest.font.region.sheet)!, this.manifest.font, this.manifest.fontBearing);
    this.uiArt = { images: this.images, ...this.manifest.ui };
    this.dialogue = new Dialogue(this.text, this.uiArt, () => this.audio.play('textBlip', { volume: 0.35 }));
    this.menu = new Menu(this.text, this.uiArt, (k) => this.audio.play(k));
    this.particles = new Particles(this.images, this.manifest.fx);
    this.lighting = new Lighting(this.vw, this.vh);
    this.content = buildContent(this.data);
    const sb = this.data.site.supabase;
    this.board = new Board(sb?.url && sb?.anonKey ? new SupabaseStore(sb.url, sb.anonKey) : new LocalStore());
    this.board.preload();
    (window as any).__gameStats = () => ({ steps: this.tally.steps, talks: this.tally.talks, signs: this.tally.signs, battles: this.tally.battles, wins: this.tally.wins, maps: [...this.tally.maps].join(','), map: this.mapId, phase: this.phase, state: this.state });
    this.bindPointer();
    this.buildWorld();
    // live data, best effort
    fetchWeather(this.data.site.timeZone ? this.data.site.location : '').then((w) => { this.live.weather = w; if (w && (w.weather === 'rain' || w.weather === 'storm')) this.showToast(`IT IS RAINING IN ${this.data.site.location.split(',')[0].toUpperCase()}`, 3); });
    fetchRepos(this.data.site.github ?? '').then((r) => { this.live.repos = r; });

    const params = new URLSearchParams(location.search);
    const scene = params.get('scene');
    this.state = scene && scene !== 'title' ? 'world' : 'title';
    if (this.state === 'world') this.enterWorld(false);
    else { if (this.mapId !== 'town') { this.loadMap('town'); const sp = this.maps.town.spawn; this.player.x = sp.x; this.player.y = sp.y; this.player.dir = sp.dir; } this.audio.playMusic('title'); }
    if (scene === 'battle') this.startBattle();
    if (scene === 'menu') this.run(this.content.startMenu);
    if (scene === 'library') this.run(this.content.writing);
    if (scene === 'doodle') this.run(async (g) => g.doodle());
    if (scene === 'terminal') this.run(async (g) => g.terminal());
    if (scene === 'talk') this.run(async (g) => g.say(['A wild TEST appeared! This is a dialogue box, with a full three lines of text to check wrapping.'], { name: 'Tester' }));
    const ff = +(params.get('t') ?? 0);
    for (let i = 0; i < ff; i++) this.update(1 / 60);

    let last = performance.now();
    const loop = (now: number) => {
      const dt = clamp((now - last) / 1000, 0, 0.1); last = now;
      this.time += dt;
      this.tickAcc += dt;
      while (this.tickAcc >= 1 / 60) { this.update(1 / 60); this.tickAcc -= 1 / 60; }
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private buildWorld() {
    const m = this.manifest;
    const playerSheet = m.characters.boy ?? Object.values(m.characters)[0];
    let mapId = 'town';
    let spawn = this.maps.town.spawn;
    try {
      const s = JSON.parse(localStorage.getItem('save') ?? 'null');
      if (s && Number.isInteger(s.x) && Number.isInteger(s.y) && s.dir in DIRS && this.maps[s.map ?? 'town']) { mapId = s.map ?? 'town'; spawn = { x: s.x, y: s.y, dir: s.dir }; }
    } catch {}
    const url = new URLSearchParams(location.search).get('map');
    if (url && this.maps[url]) { mapId = url; spawn = this.maps[url].spawn; }
    this.player = new Actor('player', playerSheet, spawn.x, spawn.y, spawn.dir, spawn, 0, this.data.site.shortName);
    this.loadMap(mapId);
    if (this.world.isSolid(this.player.x, this.player.y)) { const sp = this.worldDef.spawn; this.player.x = sp.x; this.player.y = sp.y; this.player.dir = sp.dir; }
    this.snapCamera();
  }

  /** Switches the active map; worlds and their inhabitants are built once and kept. */
  private loadMap(id: string) {
    const m = this.manifest;
    this.mapId = id;
    let world = this.worlds.get(id);
    if (!world) {
      world = new World(this.worldDef, { images: this.images, terrains: m.terrains, props: m.props, houses: m.houses });
      this.worlds.set(id, world);
    }
    this.world = world;
    const sheet = (key: string, kind: 'character' | 'animal' = 'character') => (kind === 'animal' ? m.animals[key] : m.characters[key]) ?? m.characters[key] ?? m.animals[key];
    let actors = this.actorsByMap.get(id);
    if (!actors) {
      actors = this.worldDef.npcs.flatMap((n) => {
        const s = sheet(n.char, n.kind);
        if (!s) { console.warn(`Unknown actor ${n.char}`); return []; }
        const a = new Actor(n.id, s, n.x, n.y, n.dir ?? 'down', { x: n.x, y: n.y }, n.wander ?? 2, n.name ?? '');
        a.speed = 1;
        if (m.animals[n.char] && !m.characters[n.char]) a.artFacing = m.animalFacing[n.char] ?? null;
        return [a];
      });
      this.actorsByMap.set(id, actors);
    }
    this.npcs = actors;
    let flutters = this.flutterByMap.get(id);
    if (!flutters) {
      flutters = [];
      const butterfly = m.monsters.butterfly ?? m.monsters.butterflyBlue;
      for (const r of this.worldDef.flutter ?? []) for (let i = 0; i < 3; i++) if (butterfly) {
        flutters.push({ anim: Math.random() < 0.5 && m.monsters.butterflyBlue ? m.monsters.butterflyBlue : butterfly, x: (r.x + Math.random() * r.w) * TILE, y: (r.y + Math.random() * r.h) * TILE, t: Math.random() * 10, region: r, phase: Math.random() * 6 });
      }
      this.flutterByMap.set(id, flutters);
    }
    this.flutters = flutters;
    this.particles.list = [];
    this.lastRegion = null;
    this.resize();
  }

  private warp(map: string, x: number, y: number, dir: Actor['dir']) {
    if (!this.maps[map]) return;
    track('game', 'enter', { map, from: this.mapId });
    this.tally.maps.add(map);
    this.busy = true;
    this.fadeTo(1, () => {
      this.loadMap(map);
      const p = this.player;
      p.x = x; p.y = y; p.dir = dir; p.moving = false; p.progress = 0;
      this.snapCamera();
      this.save();
      this.fadeTo(0, () => { this.busy = false; });
    }, 3);
  }

  private computeScale(w: number, h: number) {
    if (this.worldDef?.indoor && this.world) {
      // zoom in on small rooms: fit the room plus a margin
      const pw = this.world.w * TILE + 48, ph = this.world.h * TILE + 48;
      return clamp(Math.floor(Math.min(w / pw, h / ph)), 2, 6);
    }
    if (w < 700) return 2;
    // the integer scale whose view is closest to ~480×270 game px
    let best = 3, bestErr = Infinity;
    for (let sc = 2; sc <= 6; sc++) { const err = Math.abs(w / sc - 480) + Math.abs(h / sc - 270); if (err < bestErr) { best = sc; bestErr = err; } }
    return best;
  }

  private resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.scale = this.computeScale(w, h);
    this.vw = Math.ceil(w / this.scale);
    this.vh = Math.ceil(h / this.scale);
    const touch = matchMedia('(pointer: coarse)').matches;
    SAFE.bottom = touch ? Math.ceil(150 / this.scale) : 0;
    SAFE.top = Math.ceil((touch ? 40 : 30) / this.scale);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    [this.scene, this.g] = makeCanvas(this.vw, this.vh);
    this.lighting?.resize(this.vw, this.vh);
    if (this.world) this.snapCamera();
    if (this.dialogue && !this.dialogue.done) {
      const lay = this.dialogue.layout(this.vw, this.vh);
      const faceW = this.dialogue.speaker?.face && this.uiArt.facesetBox ? this.uiArt.facesetBox.w + 8 : 0;
      this.dialogue.relayout(lay.w - 26 - faceW);
    }
  }

  // ------------------------------------------------------------ scripting API

  private api: GameApi = {
    data: null as unknown as GameData,
    say: (paragraphs, speaker = null) => new Promise<void>((resolve) => {
      const lay = this.dialogue.layout(this.vw, this.vh);
      const faceW = speaker?.face && this.uiArt.facesetBox ? this.uiArt.facesetBox.w + 8 : 0;
      this.dialogue.open(paragraphs, speaker, lay.w - 26 - faceW, 3, resolve);
    }),
    choose: (items, opts = {}) => new Promise<number>((resolve) => {
      const done = (i: number) => { track('game', 'choose', { title: opts.title ?? '', pick: i < 0 ? '(cancel)' : items[i]?.label ?? String(i) }); resolve(i); };
      this.menu.open(items, done, { ...opts, onCancel: () => done(-1) });
    }),
    goTo: (href) => {
      this.audio.play('confirm');
      track('click', href, { from: 'game', map: this.mapId });
      const sameOrigin = /^\/(?!\/)/.test(href) || href.startsWith(location.origin);
      if (!sameOrigin) { window.open(href, '_blank', 'noopener'); return; }
      this.busy = true;
      this.fadeTo(1, () => { this.audio.stopMusic(300); location.assign(href); });
    },
    toast: (text) => this.showToast(text),
    sfx: (k) => this.audio.play(k),
    cyclePhase: () => this.cyclePhase(),
    sleep: () => { this.busy = true; this.fadeTo(1, () => { this.cyclePhase(); this.fadeTo(0, () => { this.busy = false; }); }, 1.2); },
    toggleMute: () => { const m = this.audio.toggleMute(); window.dispatchEvent(new CustomEvent('game:mute', { detail: m })); return m; },
    isMuted: () => this.audio.muted,
    bugsFixed: () => this.bugsFixed(),
    doodle: () => new Promise<void>((resolve) => { this.boardResolve = resolve; this.board.show(); }),
    terminal: () => (this.terminal ??= new Terminal(this.api)).show(),
    weather: () => this.live.weather,
    repos: () => this.live.repos,
    phaseLabel: () => AMBIENT[this.phase].label,
  };

  private async run(script: Script) {
    if (this.busy) return;
    this.busy = true;
    this.api.data = this.data;
    try { await script(this.api); } catch (e) { console.error(e); }
    this.busy = false;
  }

  private bindPointer() {
    const toGame = (e: PointerEvent): [number, number] => [e.clientX / this.scale, e.clientY / this.scale];
    this.canvas.addEventListener('pointerdown', (e) => {
      this.input.onInteraction?.(true);
      if (this.terminal?.open) { e.preventDefault(); this.terminal.pointer(...toGame(e)); return; }
      if (!this.board.open) return;
      e.preventDefault(); this.canvas.setPointerCapture(e.pointerId);
      this.board.pointerDown(...toGame(e));
    });
    this.canvas.addEventListener('pointermove', (e) => { if (this.board.open) this.board.pointerMove(...toGame(e)); });
    const up = () => { if (this.board.open) this.board.pointerUp(); };
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
  }

  // ------------------------------------------------------------ update

  private update(dt: number) {
    this.input.pollGamepad();
    if (this.toastMsg && (this.toastMsg.t -= dt) <= 0) this.toastMsg = null;
    if (this.flash > 0) this.flash -= dt;

    if (this.fade.alpha !== this.fade.target) {
      const dir = Math.sign(this.fade.target - this.fade.alpha);
      this.fade.alpha = clamp(this.fade.alpha + dir * this.fade.speed * dt, 0, 1);
      if (this.fade.alpha === this.fade.target) { const cb = this.fade.cb; this.fade.cb = null; cb?.(); }
      this.input.endFrame();
      return;
    }

    if (this.state === 'title') this.updateTitle(dt);
    else if (this.terminal?.open) this.terminal.update(dt);
    else if (this.board.open) {
      if (this.board.update(this.input)) { this.board.hide(); this.audio.play('cancel'); const r = this.boardResolve; this.boardResolve = null; r?.(); }
    } else {
      // UI layers consume input first
      if (!this.dialogue.done) this.dialogue.update(this.input, dt);
      else if (!this.menu.done) this.menu.update(this.input);
      else if (this.state === 'world') this.updateWorld(dt);
      else if (this.state === 'battle') this.updateBattle(dt);
      this.updateAmbience(dt);
    }
    this.particles.update(dt);
    this.input.endFrame();
  }

  private updateTitle(dt: number) {
    this.titlePan += dt;
    const W = this.world.w * TILE - this.vw, H = this.world.h * TILE - this.vh;
    const t = this.titlePan * 0.05;
    this.cam.x = clamp((0.5 + 0.45 * Math.sin(t)) * W, 0, Math.max(0, W));
    this.cam.y = clamp((0.5 + 0.45 * Math.cos(t * 0.7)) * H, 0, Math.max(0, H));
    this.updateAmbience(dt);
    for (const n of this.npcs) this.wander(n, dt);
    for (const n of this.npcs) n.tick();
    if (this.input.hit('a') || this.input.hit('start')) {
      this.audio.play('confirm');
      track('game', 'start', { after: Math.round(this.titlePan) });
      this.fadeTo(1, () => { this.enterWorld(true); this.fadeTo(0); }, 2.5);
    }
  }

  private enterWorld(fromTitle: boolean) {
    this.state = 'world';
    this.snapCamera();
    this.audio.playMusic(this.phase === 'night' ? 'overworldNight' : 'overworld');
    this.lastRegion = this.world.regionAt(this.player.x, this.player.y)?.name ?? null;
    if (fromTitle && !this.hintShown) {
      this.hintShown = true;
      const touch = matchMedia('(pointer: coarse)').matches;
      this.showToast(touch ? 'D-PAD to walk  A to talk  START for menu' : 'ARROWS to walk   Z to talk   TAB for menu', 5);
    }
  }

  private updateWorld(dt: number) {
    if (this.busy) { for (const n of this.npcs) n.tick(); return; }
    const p = this.player;
    if (this.input.hit('start')) { this.audio.play('confirm'); this.run(this.content.startMenu); return; }
    if (this.input.hit('select')) { this.cyclePhase(); return; }
    if (this.input.hit('a') && !p.moving) { this.interact(); return; }

    // player movement (a tap during a step is remembered and used for the next one)
    p.speed = this.input.held.has('b') ? 4 : 2;
    if (p.moving) { const q = DIR_BTNS.find((b) => this.input.hit(b)); if (q) this.queuedDir = q as typeof this.queuedDir; }
    if (!p.moving) {
      const d = this.input.dir() ?? this.queuedDir;
      this.queuedDir = null;
      if (d) {
        const dir = d as Exclude<Btn, 'a' | 'b' | 'start' | 'select'>;
        const ok = p.startStep(dir, (x, y) => this.canEnter(x, y, p));
        if (!ok) {
          const [fx, fy] = p.facing();
          const it = this.world.interactAt(fx, fy);
          if (it?.type === 'door') { if (this.input.hit(d)) this.enterDoor(it.id, it.label); return; }
          if (this.input.hit(d)) this.audio.play('bump', { volume: 0.4 });
        }
      }
    }
    if (p.tick()) this.onStep();

    for (const n of this.npcs) { this.wander(n, dt); n.tick(); }

    // region toasts
    const r = this.world.regionAt(p.x, p.y);
    const name = r?.name ?? null;
    if (name !== this.lastRegion) { this.lastRegion = name; if (name) this.showToast(name, 2.2); }

    // camera
    this.camTarget.x = p.px - this.vw / 2;
    this.camTarget.y = p.py - this.vh / 2 - 8;
    const k = 1 - Math.pow(0.001, dt);
    this.cam.x = lerp(this.cam.x, this.camTarget.x, k);
    this.cam.y = lerp(this.cam.y, this.camTarget.y, k);
    this.clampCamera();

    if ((this.saveT += dt) > 2) { this.saveT = 0; this.save(); }
  }

  private canEnter(x: number, y: number, who: Actor) {
    if (this.world.isSolid(x, y)) return false;
    const occ = (a: Actor) => { if (a === who) return false; const [tx, ty] = a.target(); return (a.x === x && a.y === y) || (tx === x && ty === y); };
    if (occ(this.player)) return false;
    return !this.npcs.some(occ);
  }

  private onStep() {
    const p = this.player;
    this.stepCount++;
    const t = this.world.terrainAt(p.x, p.y);
    if (this.indoor) { this.audio.play('footstepSand', { volume: 0.18, rate: 1.2 + Math.random() * 0.1 }); }
    else if (/sand|path|dirt|earth/i.test(t.name)) { if (this.stepCount % 2 === 0) this.particles.dust(p.px, p.py); this.audio.play('footstepSand', { volume: 0.25, rate: 0.9 + Math.random() * 0.2 }); }
    else { this.audio.play('footstepGrass', { volume: 0.25, rate: 0.9 + Math.random() * 0.2 }); }
    if (t.encounter) {
      this.particles.grass(p.px, p.py);
      if (Math.random() < 0.09) this.startBattle();
    }
    this.tally.steps++;
    const wp = this.worldDef.warps?.find((w) => w.x === p.x && w.y === p.y);
    if (wp) { this.audio.play('doorOpen', { volume: 0.6 }); this.warp(wp.map, wp.tx, wp.ty, wp.dir); return; }
    const it = this.world.interactAt(p.x, p.y);
    if (it?.type === 'door') this.enterDoor(it.id, it.label);
  }

  private wander(n: Actor, dt: number) {
    if (n.moving || n.frozen > 0 || n.wander <= 0) return;
    if ((n.wanderTimer -= dt) > 0) return;
    n.wanderTimer = 1.5 + Math.random() * 3.5;
    if (Math.random() < 0.3) { n.dir = (['up', 'down', 'left', 'right'] as const)[Math.floor(Math.random() * 4)]; return; }
    const dir = (['up', 'down', 'left', 'right'] as const)[Math.floor(Math.random() * 4)];
    const [dx, dy] = DIRS[dir];
    const nx = n.x + dx, ny = n.y + dy;
    if (Math.abs(nx - n.home.x) > n.wander || Math.abs(ny - n.home.y) > n.wander) { n.dir = dir; return; }
    if (this.world.terrainAt(nx, ny).encounter && n.id !== 'hunter') return;
    n.startStep(dir, (x, y) => this.canEnter(x, y, n));
  }

  private interact() {
    const p = this.player;
    const [fx, fy] = p.facing();
    const npc = this.npcs.find((n) => !n.moving && n.x === fx && n.y === fy);
    if (npc) {
      npc.dir = OPPOSITE[p.dir];
      npc.frozen = 6;
      const isAnimal = !!this.manifest.animals[Object.keys(this.manifest.animals).find((k) => this.manifest.animals[k] === npc.sheet) ?? ''];
      const c = this.content.npcs[npc.id];
      track('game', 'talk', { id: npc.id, name: npc.name || npc.id, map: this.mapId });
      this.tally.talks++;
      if (c && !isAnimal) {
        npc.emote = { anim: 'exclamation', t: 0.8 };
        const face = npc.sheet.faceset;
        this.run((g) => c.script({ ...g, say: (pp, s) => g.say(pp, s ?? { name: npc.name || c.name, face }) }));
      } else {
        const key = Object.keys(this.manifest.animals).find((k) => this.manifest.animals[k] === npc.sheet) ?? 'default';
        const base = key.replace(/[A-Z0-9].*$/, '') || key;
        const lines = this.content.animalLines[base] ?? this.content.animalLines[key] ?? this.content.animalLines.default;
        npc.emote = { anim: 'heart', t: 1 };
        this.audio.play(base === 'dog' ? 'dogBark' : base === 'chicken' || base === 'parrot' ? 'birdChirp' : 'cursorMove');
        this.run((g) => g.say([lines[Math.floor(Math.random() * lines.length)]], { name: npc.name || base.toUpperCase() }));
      }
      return;
    }
    const it = this.world.interactAt(fx, fy);
    if (!it) return;
    if (it.type !== 'door') { track('game', 'read', { id: it.id, kind: it.type, map: this.mapId }); this.tally.signs++; }
    if (it.type === 'door') return this.enterDoor(it.id, it.label);
    if (it.type === 'house') { this.run((g) => g.say([`${it.label}. The door is around the front.`])); return; }
    if (it.type === 'sign') {
      const s = this.content.signs[it.id];
      this.audio.play('confirm', { volume: 0.5 });
      if (s) this.run(s);
      else { const sp = this.worldDef.signs.find((x) => x.id === it.id); this.run((g) => g.say([(sp as any)?.text ?? it.id])); }
      return;
    }
    if (it.type === 'prop') {
      const s = this.content.signs[it.id] ?? this.content.resolve(it.id);
      this.audio.play('confirm', { volume: 0.5 });
      if (s) this.run(s);
      else if (it.inst.text) this.run((g) => g.say([it.inst.text!]));
    }
  }

  private enterDoor(id: string, label: string) {
    if (this.maps[id]) {
      this.audio.play('doorOpen');
      const sp = this.maps[id].spawn;
      this.warp(id, sp.x, sp.y, sp.dir);
      return;
    }
    const s = this.content.doors[id];
    if (!s) { this.run((g) => g.say([`${label}. Locked.`])); return; }
    this.run(async (g) => {
      await new Promise<void>((r) => this.fadeTo(1, r, 3));
      this.player.dir = 'down';
      await new Promise<void>((r) => this.fadeTo(0, r, 3));
      await s(g);
    });
  }

  private cyclePhase() {
    const next = PHASES[(PHASES.indexOf(this.phase) + 1) % PHASES.length];
    this.pinned = next; this.phase = next; pinPhase(next);
    this.audio.play('confirm');
    this.showToast(`TIME: ${AMBIENT[next].label}`, 1.6);
    if (this.state === 'world') this.audio.playMusic(next === 'night' ? 'overworldNight' : 'overworld', 1200);
  }

  private updateAmbience(dt: number) {
    if (this.indoor) return;
    const amb = AMBIENT[this.phase];
    const inView = () => ({ x: this.cam.x + Math.random() * this.vw, y: this.cam.y + Math.random() * this.vh });
    if ((this.leafT += dt) > (this.phase === 'day' ? 0.9 : 1.8)) { this.leafT = 0; const p = inView(); this.particles.leaf(this.cam.x + this.vw + 8, this.cam.y + Math.random() * this.vh * 0.7 - 20, Math.random() < 0.25); void p; }
    const wx = this.live.weather?.weather ?? 'clear';
    const cloudEvery = wx === 'cloudy' || wx === 'rain' || wx === 'storm' ? 5 : 14;
    if ((this.cloudT += dt) > cloudEvery && this.phase !== 'night') { this.cloudT = Math.random() * 4; this.particles.cloud(this.cam.x - 200, this.cam.y + Math.random() * this.vh); }
    if (wx === 'rain' || wx === 'storm' || wx === 'snow') {
      this.rainT += dt;
      const perSec = wx === 'storm' ? 220 : wx === 'rain' ? 120 : 40;
      while (this.rainT > 1 / perSec) { this.rainT -= 1 / perSec; this.particles.rain(this.cam.x + Math.random() * (this.vw + 40) - 20, this.cam.y - 10 + Math.random() * this.vh, wx === 'snow'); }
      if (wx === 'storm' && Math.random() < dt * 0.08) { this.flash = 0.12; this.audio.play('encounterAlert', { volume: 0.15, rate: 0.5 }); }
    }
    if (amb.fireflies && (this.fireflyT += dt) > 0.35) {
      this.fireflyT = 0;
      for (let i = 0; i < 3; i++) {
        const p = inView();
        const t = this.world.terrainAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE));
        if (/grass|water/i.test(t.name)) this.particles.firefly(p.x, p.y - 6);
      }
    }
    if ((this.ambientT += dt) > 9) {
      this.ambientT = Math.random() * 4;
      if (this.phase !== 'night' && Math.random() < 0.6) this.audio.play('birdChirp', { volume: 0.25, rate: 0.9 + Math.random() * 0.3 });
      // a fish jumps somewhere in view
      for (let i = 0; i < 20; i++) {
        const p = inView();
        if (!this.world.terrainAt(Math.floor(p.x / TILE), Math.floor(p.y / TILE)).walkable) { this.particles.splash(p.x, p.y); this.audio.play('splash', { volume: 0.2 }); break; }
      }
    }
    for (const f of this.flutters) {
      f.t += dt;
      const r = f.region;
      f.x += Math.sin(f.t * 0.9 + f.phase) * 14 * dt;
      f.y += Math.cos(f.t * 1.3 + f.phase * 0.7) * 10 * dt;
      f.x = clamp(f.x, r.x * TILE, (r.x + r.w) * TILE); f.y = clamp(f.y, r.y * TILE, (r.y + r.h) * TILE);
    }
    // NPC idle emotes
    if (Math.random() < dt * 0.05) { const n = this.npcs[Math.floor(Math.random() * this.npcs.length)]; if (n && !n.emote) n.emote = { anim: Math.random() < 0.5 ? 'music' : 'ellipsis', t: 1.5 }; }
  }

  // ------------------------------------------------------------ battle

  private startBattle() {
    const keys = Object.keys(this.manifest.monsters).filter((k) => MONSTER_NAMES[k] && !k.startsWith('butterfly'));
    const key = keys[Math.floor(Math.random() * keys.length)] ?? Object.keys(this.manifest.monsters)[0];
    const monster = this.manifest.monsters[key];
    track('game', 'battle', { event: 'start', monster: key });
    this.tally.battles++;
    this.audio.play('encounterAlert');
    this.flash = 0.7;
    this.busy = true;
    this.fadeTo(1, () => {
      this.state = 'battle';
      this.battle = { monster, key, hp: 1, shake: 0, t: 0 };
      this.audio.playMusic('battle', 300);
      this.fadeTo(0, () => { this.busy = false; this.run(this.battleScript); });
    }, 2.5);
  }

  private bugsFixed(): number { try { return +(localStorage.getItem('bugsFixed') ?? 0) || 0; } catch { return 0; } }

  /** A wild bug challenges you to dev trivia. Answer right and it faints. */
  private battleScript: Script = async (g) => {
    const b = this.battle!;
    const name = MONSTER_NAMES[b.key] ?? b.key.toUpperCase();
    const me = this.data.site.shortName.toUpperCase();
    const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    const joke = JOKE_MOVES[Math.floor(Math.random() * JOKE_MOVES.length)];
    await g.say([`A wild ${name} appeared!`, `${name}: "Answer me this, ${me}..."`], { name });
    const win = async (line: string) => {
      this.audio.play('attackHit'); b.shake = 0.5; b.hp = 0;
      for (let k = 0; k < 10; k++) this.particles.spark(this.vw * 0.72 + Math.random() * 24, this.vh * 0.3 + Math.random() * 24);
      await g.say(["It's super effective!", line]);
      this.audio.playMusic('victory', 200);
      try { localStorage.setItem('bugsFixed', String(this.bugsFixed() + 1)); } catch {}
      await g.say([`${me} fixed a bug! Bugs fixed: ${this.bugsFixed()}.`]);
      track('game', 'battle', { event: 'win', monster: b.key, question: q.q.slice(0, 80) });
      this.tally.wins++;
    };
    const lose = async (line: string) => { this.audio.play('cancel'); track('game', 'battle', { event: 'lose', monster: b.key, question: q.q.slice(0, 80) }); await g.say([line]); };
    let tries = 0;
    for (;;) {
      const i = await g.choose(
        [...q.answers.map((a) => ({ label: a })), { label: joke.label }, { label: 'RUN' }],
        { title: q.q, anchor: 'center', rows: 5 },
      );
      if (i === q.correct) { await win(q.win); break; }
      if (i === -1 || i === q.answers.length + 1) { track('game', 'battle', { event: 'run', monster: b.key }); await g.say(['Got away safely! (The bug is still out there.)']); break; }
      if (i === q.answers.length) {
        if (Math.random() < joke.works) { await win(joke.win); } else { await lose(joke.lose); }
        break;
      }
      tries++;
      if (tries >= 2) { await lose(q.lose); break; }
      await g.say([`${name}: "Nope. One more try."`], { name });
    }
    this.endBattle();
  };

  private endBattle() {
    this.busy = true;
    this.fadeTo(1, () => {
      this.state = 'world'; this.battle = null;
      this.audio.playMusic(this.phase === 'night' ? 'overworldNight' : 'overworld', 600);
      this.fadeTo(0, () => { this.busy = false; });
    }, 2.5);
  }

  private updateBattle(dt: number) {
    if (this.battle) { this.battle.t += dt; if (this.battle.shake > 0) this.battle.shake -= dt; }
  }

  // ------------------------------------------------------------ helpers

  private fadeTo(target: number, cb?: () => void, speed = 1.5) {
    this.fade.target = target; this.fade.cb = cb ?? null; this.fade.speed = speed;
    if (this.fade.alpha === target) { const c = this.fade.cb; this.fade.cb = null; c?.(); }
  }
  private showToast(text: string, t = 2) { this.toastMsg = { text, t }; }
  private snapCamera() {
    this.cam.x = this.player.px - this.vw / 2; this.cam.y = this.player.py - this.vh / 2 - 8;
    this.clampCamera();
  }
  private clampCamera() {
    const W = this.world.w * TILE, H = this.world.h * TILE;
    this.cam.x = W <= this.vw ? (W - this.vw) / 2 : clamp(this.cam.x, 0, W - this.vw);
    this.cam.y = H <= this.vh ? (H - this.vh) / 2 : clamp(this.cam.y, 0, H - this.vh);
  }
  private save() { try { localStorage.setItem('save', JSON.stringify({ map: this.mapId, x: this.player.x, y: this.player.y, dir: this.player.dir })); } catch {} }
  toggleMute() { const m = this.audio.toggleMute(); window.dispatchEvent(new CustomEvent('game:mute', { detail: m })); return m; }
  get muted() { return this.audio?.muted ?? false; }

  // ------------------------------------------------------------ render

  private renderBoot() {
    const g = this.g;
    g.fillStyle = '#1b1a2e'; g.fillRect(0, 0, this.vw, this.vh);
    const w = Math.min(160, this.vw - 40), x = ((this.vw - w) / 2) | 0, y = (this.vh / 2) | 0;
    g.fillStyle = '#3a3760'; g.fillRect(x, y, w, 6);
    g.fillStyle = '#ffd25a'; g.fillRect(x, y, (w * this.loadProgress) | 0, 6);
    this.present();
  }

  private render() {
    if (this.state === 'boot') return this.renderBoot();
    const g = this.g;
    const cam = { x: Math.round(this.cam.x), y: Math.round(this.cam.y) };

    if (this.state === 'battle') this.renderBattle(g);
    else this.renderWorld(g, cam);

    // UI
    if (this.toastMsg) {
      const tw = this.text.width(this.toastMsg.text) + 22;
      const x = ((this.vw - tw) / 2) | 0, y = 6 + SAFE.top;
      drawNineSlice(g, this.images.get(this.uiArt.choiceBox.region.sheet)!, this.uiArt.choiceBox, x, y, tw, 20);
      this.text.draw(g, this.toastMsg.text, x + 11, y + 6, { color: '#3b3226' });
    }
    if (this.state === 'title') this.renderTitleOverlay(g);
    this.menu.draw(g, this.vw, this.vh, this.time, this.dialogue);
    this.dialogue.draw(g, this.vw, this.vh, this.time);
    if (this.board.open) {
      const box = this.uiArt.dialogBoxSimple ?? this.uiArt.dialogBox;
      this.board.draw(g, this.vw, this.vh, this.text, (x, y, w, h) => drawNineSlice(g, this.images.get(box.region.sheet)!, box, x, y, w, h));
    }
    if (this.terminal?.open) this.terminal.draw(g, this.vw, this.vh, this.text);

    if (this.flash > 0 && Math.floor(this.flash * 12) % 2 === 0) { g.fillStyle = '#fff'; g.fillRect(0, 0, this.vw, this.vh); }
    if (this.fade.alpha > 0) { g.fillStyle = `rgba(6,6,14,${this.fade.alpha})`; g.fillRect(0, 0, this.vw, this.vh); }
    this.present();
  }

  private present() {
    const s = this.screen;
    s.imageSmoothingEnabled = false;
    s.setTransform(this.scale * this.dpr, 0, 0, this.scale * this.dpr, 0, 0);
    s.drawImage(this.scene, 0, 0);
  }

  private renderWorld(g: Ctx, cam: { x: number; y: number }) {
    const { vw, vh } = this;
    g.fillStyle = '#1b1a2e'; g.fillRect(0, 0, vw, vh);
    g.drawImage(this.world.ground, cam.x, cam.y, vw, vh, 0, 0, vw, vh);

    // animated water sparkles
    for (const s of this.world.sparkles) {
      const x = s.x - cam.x, y = s.y - cam.y;
      if (x < -16 || y < -16 || x > vw || y > vh) continue;
      const a = s.anim; const f = Math.floor((this.time + s.t) * a.fps) % a.frames;
      g.drawImage(this.images.get(a.sheet)!, a.x + f * a.w, a.y, a.w, a.h, x, y, a.w, a.h);
    }
    this.particles.drawShadows(g, cam, vw, vh);

    // depth-sorted sprites
    const drawables: { y: number; draw: () => void }[] = [];
    for (const p of this.world.props) {
      const r = p.prop.region;
      if (p.px + r.w < cam.x || p.py + r.h < cam.y || p.px > cam.x + vw || p.py > cam.y + vh) continue;
      drawables.push({ y: p.sortY, draw: () => {
        g.save(); g.translate(-cam.x, -cam.y); this.world.drawProp(g, p, this.time);
        if (p.id === 'doodle') g.drawImage(this.board.thumbnail(40, 18), p.px + 4, p.py + 3); // live doodle on the wall
        g.restore();
      } });
    }
    const shadow = { img: this.images.get(this.manifest.shadow.sheet)!, ...this.manifest.shadow };
    const actors = this.state === 'title' ? this.npcs : [this.player, ...this.npcs];
    for (const a of actors) {
      if (a.px < cam.x - 32 || a.py < cam.y - 32 || a.px > cam.x + vw + 32 || a.py > cam.y + vh + 32) continue;
      drawables.push({ y: a.sortY, draw: () => {
        a.draw(g, this.images.get(a.sheet.sheet)!, cam.x, cam.y, shadow);
        if (a.emote) {
          const e = this.manifest.emotes[a.emote.anim];
          if (e) { const f = Math.floor(this.time * e.fps) % e.frames; g.drawImage(this.images.get(e.sheet)!, e.x + f * e.w, e.y, e.w, e.h, (a.px - e.w / 2 - cam.x) | 0, (a.py - a.sheet.feet.y - e.h - 2 - cam.y) | 0, e.w, e.h); }
        }
      } });
    }
    for (const f of this.flutters) {
      const fr = f.anim.walk.down; const frame = fr[Math.floor(f.t * 8) % fr.length];
      const bob = Math.sin(f.t * 5) * 2;
      drawables.push({ y: f.y + 8, draw: () => g.drawImage(this.images.get(f.anim.sheet)!, frame.x, frame.y, f.anim.frameW, f.anim.frameH, (f.x - cam.x) | 0, (f.y - 10 - bob - cam.y) | 0, f.anim.frameW, f.anim.frameH) });
    }
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.draw();

    this.particles.draw(g, cam, vw, vh, this.time);
    const ambient = this.indoor
      ? (this.phase === 'night' || this.phase === 'dusk' ? { tint: '#d9c9b4', lights: true, haze: null, hazeAlpha: 0, fireflies: false, label: 'INSIDE' } : AMBIENT.day)
      : AMBIENT[this.phase];
    this.lighting.apply(g, ambient, this.world.lights, cam, this.time);
  }

  private renderTitleOverlay(g: Ctx) {
    const { vw, vh } = this;
    g.fillStyle = 'rgba(10,8,20,0.28)'; g.fillRect(0, 0, vw, vh);
    const band = g.createLinearGradient(0, vh * 0.18, 0, vh * 0.56);
    band.addColorStop(0, 'rgba(10,8,20,0)'); band.addColorStop(0.3, 'rgba(10,8,20,0.55)'); band.addColorStop(0.7, 'rgba(10,8,20,0.55)'); band.addColorStop(1, 'rgba(10,8,20,0)');
    g.fillStyle = band; g.fillRect(0, vh * 0.18, vw, vh * 0.38);
    const name = this.data.site.shortName.toUpperCase();
    const ttf = this.manifest.ttf;
    const cy = (vh * 0.34) | 0;
    if (ttf) {
      const size = ttf.pixelSize * (vw >= 400 ? 3 : 2);
      g.font = `${size}px "${ttf.family}"`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillText(name, (vw / 2) | 0, cy + 3);
      g.fillStyle = '#ffd25a'; g.fillText(name, (vw / 2) | 0, cy);
      g.textAlign = 'left';
    } else {
      const s = 3, w = this.text.width(name) * s;
      this.text.draw(g, name, ((vw - w) / 2) | 0, cy - 12, { color: '#ffd25a', shadow: 'rgba(0,0,0,0.5)', scale: s });
    }
    const subLines = this.text.wrap(this.data.site.headline.toUpperCase(), vw - 24);
    subLines.forEach((line, i) => this.text.draw(g, line, ((vw - this.text.width(line)) / 2) | 0, cy + 22 + i * this.text.lineHeight, { color: '#fff7ea', shadow: 'rgba(0,0,0,0.5)' }));
    if (Math.floor(this.time * 1.6) % 2 === 0) {
      const t = matchMedia('(pointer: coarse)').matches ? 'TAP A TO START' : 'PRESS ENTER';
      this.text.draw(g, t, ((vw - this.text.width(t)) / 2) | 0, (vh * 0.72) | 0, { color: '#fff7ea', shadow: 'rgba(0,0,0,0.5)' });
    }
  }

  private renderBattle(g: Ctx) {
    const { vw, vh } = this;
    const b = this.battle!;
    // backdrop: sky gradient + ground
    const sky = g.createLinearGradient(0, 0, 0, vh);
    sky.addColorStop(0, this.phase === 'night' ? '#20244a' : '#bfe7ff'); sky.addColorStop(1, this.phase === 'night' ? '#3a3f70' : '#eaf7d8');
    g.fillStyle = sky; g.fillRect(0, 0, vw, vh);
    g.fillStyle = this.phase === 'night' ? '#2f5a3a' : '#8ed160'; g.fillRect(0, vh * 0.62, vw, vh);
    const platform = (x: number, y: number, rx: number) => { g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(x, y, rx, rx * 0.32, 0, 0, Math.PI * 2); g.fill(); };
    const ex = vw * 0.72, ey = vh * 0.42, px = vw * 0.26, py = vh * 0.78;
    platform(ex, ey + 2, 40); platform(px, py + 2, 44);
    // enemy
    if (b.hp > 0 || b.shake > 0) {
      const f = b.monster.walk.down[Math.floor(this.time * 4) % b.monster.walk.down.length];
      const s = 3, sx = b.shake > 0 ? Math.sin(this.time * 60) * 3 : 0;
      const hover = Math.sin(this.time * 2) * 2;
      g.drawImage(this.images.get(b.monster.sheet)!, f.x, f.y, b.monster.frameW, b.monster.frameH, (ex - b.monster.feet.x * s + sx) | 0, (ey - b.monster.feet.y * s + hover) | 0, b.monster.frameW * s, b.monster.frameH * s);
    }
    // player back
    const pf = this.player.sheet.walk.up[0];
    g.drawImage(this.images.get(this.player.sheet.sheet)!, pf.x, pf.y, this.player.sheet.frameW, this.player.sheet.frameH, (px - this.player.sheet.feet.x * 3) | 0, (py - this.player.sheet.feet.y * 3) | 0, this.player.sheet.frameW * 3, this.player.sheet.frameH * 3);
    // enemy info box
    const name = MONSTER_NAMES[b.key] ?? b.key.toUpperCase();
    const lv = 'Lv7';
    const bw = Math.max(110, this.text.width(name) + this.text.width(lv) + 36);
    const by = 8 + SAFE.top;
    drawNineSlice(g, this.images.get(this.uiArt.choiceBox.region.sheet)!, this.uiArt.choiceBox, 10, by, bw, 30);
    this.text.draw(g, name, 18, by + 6, { color: '#3b3226' });
    this.text.draw(g, lv, 10 + bw - 10 - this.text.width(lv), by + 6, { color: '#3b3226' });
    this.text.draw(g, 'HP', 18, by + 17, { color: '#c8451f' });
    g.fillStyle = '#3b3226'; g.fillRect(34, by + 18, bw - 44, 5);
    g.fillStyle = b.hp > 0 ? '#58c060' : '#e04c3a'; g.fillRect(35, by + 19, (bw - 46) * b.hp, 3);
    this.particles.draw(g, { x: 0, y: 0 }, vw, vh, this.time);
  }
}
