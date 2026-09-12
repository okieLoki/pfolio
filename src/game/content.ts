// What the town says. Every interaction is an async script against GameApi,
// so dialogue → choice → navigation reads top to bottom.

import type { Region } from './assets/types';
import type { MenuItem } from './core/dialogue';

export interface GameData {
  site: { name: string; shortName: string; location: string; timeZone: string; email: string; headline: string; github?: string; supabase?: { url: string; anonKey: string } };
  intro: string[];
  now: string[];
  work: { role: string; org: string; href: string; start: string; end: string }[];
  projects: { name: string; description: string; href: string; meta: string }[];
  elsewhere: { label: string; value: string; href: string }[];
  posts: { id: string; title: string; date: string; excerpt: string }[];
}

export interface Speaker { name: string; face?: Region }

export interface GameApi {
  data: GameData;
  say(paragraphs: string[], speaker?: Speaker | null): Promise<void>;
  choose(items: MenuItem[], opts?: { title?: string; anchor?: 'topRight' | 'bottomRight' | 'center' | 'topLeft'; rows?: number; index?: number }): Promise<number>;
  goTo(href: string): void;
  toast(text: string): void;
  sfx(key: string): void;
  cyclePhase(): void;
  /** fade to black, advance the time of day, fade back */
  sleep(): void;
  toggleMute(): boolean;
  isMuted(): boolean;
  bugsFixed(): number;
  phaseLabel(): string;
  /** open the shared doodle wall */
  doodle(): Promise<void>;
  /** sit at the office computer (a little shell); resolves when the user exits */
  terminal(): Promise<void>;
  /** live weather, if it loaded */
  weather(): { weather: string; tempC: number; description: string } | null;
  /** latest GitHub repos, if they loaded */
  repos(): { name: string; description: string; url: string; stars: number; language: string; pushed: string }[];
}

export type Script = (g: GameApi) => Promise<void>;

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function buildContent(data: GameData) {
  const { shortName, location } = data.site;
  const org = data.work[0]?.org ?? 'work';

  const about: Script = async (g) => {
    await g.say([`${data.site.headline}`, ...data.intro]);
    const i = await g.choose([{ label: 'Read the full card' }, { label: 'Maybe later' }], { anchor: 'bottomRight' });
    if (i === 0) g.goTo('/about');
  };

  const work: Script = async (g) => {
    await g.say(data.work.map((w) => `${w.role} at ${w.org}, ${w.start} to ${w.end}.`));
  };

  const now: Script = async (g) => {
    await g.say(['NOTICE BOARD - what I am up to these days:', ...data.now]);
  };

  const writing: Script = async (g) => {
    const items: MenuItem[] = [...data.posts.map((p) => ({ label: p.title, description: `${p.date} - ${p.excerpt}` })), { label: 'Back' }];
    const i = await g.choose(items, { title: 'LIBRARY', anchor: 'topLeft', rows: 6 });
    if (i >= 0 && i < data.posts.length) g.goTo(`/posts/${data.posts[i].id}`);
  };

  const projects: Script = async (g) => {
    const repos = g.repos();
    const items: MenuItem[] = [
      ...data.projects.map((p) => ({ label: p.name, description: `${p.meta} - ${p.description}` })),
      ...repos.map((r) => ({ label: `${r.name}${r.stars ? ` *${r.stars}` : ''}`, description: `GitHub - ${r.language || 'code'}, last push ${r.pushed}. ${r.description || 'No description yet.'}` })),
      { label: 'Back' },
    ];
    const i = await g.choose(items, { title: repos.length ? 'WORKSHOP (live from GitHub)' : 'WORKSHOP', anchor: 'topLeft', rows: 7 });
    if (i < 0 || i >= items.length - 1) return;
    if (i < data.projects.length) {
      const href = data.projects[i].href;
      if (!href || href === '#') await g.say(['This one is still on the workbench. Come back later!']);
      else g.goTo(href);
      return;
    }
    g.goTo(repos[i - data.projects.length].url);
  };

  const links: Script = async (g) => {
    const items: MenuItem[] = [...data.elsewhere.map((l) => ({ label: l.label, description: l.value })), { label: 'Back' }];
    const i = await g.choose(items, { title: 'MAILBOX', anchor: 'topLeft', rows: 6 });
    if (i >= 0 && i < data.elsewhere.length) g.goTo(data.elsewhere[i].href);
  };

  const help: Script = async (g) => {
    await g.say([
      'Walk with the ARROW keys or WASD. Hold X to run.',
      'Z or SPACE talks to people and reads signs. Walk into a door to go inside.',
      'TAB opens this menu. SHIFT changes the time of day. Gamepads work too.',
    ]);
  };

  const doors: Record<string, Script> = {
    home: async (g) => { g.sfx('doorOpen'); await g.say([`${shortName}'s house. Shoes off, please.`]); await about(g); },
    office: async (g) => { g.sfx('doorOpen'); await g.say([`The ${org.toUpperCase()} office. Keyboards clacking, tea going cold.`]); await work(g); },
    library: async (g) => { g.sfx('doorOpen'); await g.say(['The LIBRARY. It smells like paper and rain.', 'Pick something to read.']); await writing(g); },
    workshop: async (g) => { g.sfx('doorOpen'); await g.say(['The WORKSHOP. Sawdust and semicolons everywhere.']); await projects(g); },
    shrine: async (g) => { g.sfx('doorOpen'); const w = g.weather(); await g.say(['A quiet shrine. You feel calm.', `It is ${g.phaseLabel().toLowerCase()} in ${location.split(',')[0]} right now${w ? `, ${w.tempC}°C, ${w.description}` : ''}.`]); },
  };

  const signs: Record<string, Script> = {
    'sign-home': async (g) => g.say([`${shortName.toUpperCase()}'S HOUSE`, 'The door is unlocked.']),
    'sign-office': async (g) => g.say([`${org.toUpperCase()}`, 'Where the day job happens.']),
    'sign-library': async (g) => g.say(['LIBRARY', 'Notes on building simple software. Come in and read.']),
    'sign-workshop': async (g) => g.say(['WORKSHOP', 'Side projects, half-finished and otherwise.']),
    'sign-welcome': async (g) => g.say([`Welcome to ${shortName.toUpperCase()} TOWN!`, 'Population: 1 developer, some villagers, a suspicious number of cats.']),
    'sign-pond': async (g) => g.say(["It's a pond.", 'Nice.']),
    'sign-forest': async (g) => g.say(['CAUTION: tall grass ahead.', 'Wild BUGS live here. Bring a debugger.']),
    'sign-shrine': async (g) => g.say(['SHRINE OF THE UNBROKEN BUILD', 'Offerings: green checkmarks only.']),
    'board': now,
    'mailbox': async (g) => { await g.say(["There's mail in the box.", 'Ways to reach me:']); await links(g); },
    'well': async (g) => g.say(['You peer into the well.', 'Somewhere down there, a TODO echoes back.']),
    'doodle': async (g) => { await g.say(['THE DOODLE WALL', 'Everyone who visits can leave a mark. Be nice.']); await g.doodle(); },
    'statue': async (g) => g.say(['A statue of the Patron of Clean Diffs.', 'You bow. Your linter feels lighter.']),
  };

  interface NpcContent { name: string; script: Script }
  const npcs: Record<string, NpcContent> = {
    elder: { name: 'Elder', script: async (g) => g.say([pick([
      `${shortName} writes about simple software. Most of it is in the LIBRARY, up the road.`,
      'In my day we shipped with FTP and a prayer.',
      'Press TAB any time to open the menu, young one.',
    ])]) },
    kid: { name: 'Kid', script: async (g) => g.say([pick([
      'Race you to the pond! ...Okay you win, you have a run button.',
      'I found a BUG in the tall grass! It was this big!',
      'Hold X to run. Everyone knows that.',
    ])]) },
    monk: { name: 'Monk', script: async (g) => g.say([pick([
      'The LIBRARY has every note. Reading is a kind of walking.',
      'Simplicity is not the absence of features. It is the presence of intent.',
      'Press SHIFT and watch the light change. I like dusk best.',
    ])]) },
    worker: { name: 'Worker', script: async (g) => g.say([pick([
      `Busy day at ${org}. Deadlines wait for no one.`,
      'The WORKSHOP is where the fun stuff gets built.',
      'You can walk on the wooden pier, you know.',
    ])]) },
    woman: { name: 'Villager', script: async (g) => g.say([pick([
      (() => { const w = g.weather(); return w ? `It's ${w.tempC}°C with ${w.description} in ${location.split(',')[0]} right now. Real weather, real town.` : `Nice weather in ${location.split(',')[0]} today, isn't it?`; })(),
      'The mailbox by the house has all the ways to reach him.',
      "Every tile in this town is from a CC0 pack by Pixel-boy. Lovely, isn't it?",
    ])]) },
    hunter: { name: 'Hunter', script: async (g) => g.say([pick([
      'The grass past this sign is thick with wild BUGS.',
      "Don't worry, FIX is super effective against most of them.",
    ])]) },
    fisher: { name: 'Fisher', script: async (g) => g.say([pick([
      "Haven't caught anything but a merge conflict all day.",
      'The fish here only bite on Fridays. After 5pm. Right before deploy.',
    ])]) },
    guard: { name: 'Guard', script: async (g) => g.say([pick([
      'Halt! ...Just kidding. Go on in.',
      'No production incidents shall pass.',
    ])]) },
  };

  const animalLines: Record<string, string[]> = {
    cat: ['Meow.', 'Mrrp?', '...'], dog: ['Woof! Woof!', '*wags tail*'], chicken: ['Bawk.', 'Cluck cluck.'],
    cow: ['Moo.', '*chews thoughtfully*'], pig: ['Oink.'], frog: ['Ribbit.'], default: ['...'],
  };

  const startMenu = async (g: GameApi, startAt = 0): Promise<void> => {
    const items: MenuItem[] = [
      { label: 'About' }, { label: 'Work' }, { label: 'Projects' }, { label: 'Writing' }, { label: 'Links' }, { label: 'Doodle wall' },
      { label: `Time: ${g.phaseLabel()}` }, { label: g.isMuted() ? 'Sound: OFF' : 'Sound: ON' }, { label: 'Help' }, { label: `Bugs fixed: ${g.bugsFixed()}`, disabled: true }, { label: 'Close' },
    ];
    const i = await g.choose(items, { anchor: 'topRight', rows: 11, index: startAt });
    switch (i) {
      case 0: return about(g);
      case 1: return work(g);
      case 2: return projects(g);
      case 3: return writing(g);
      case 4: return links(g);
      case 5: return g.doodle();
      case 6: g.cyclePhase(); return startMenu(g, 6);
      case 7: g.toggleMute(); return startMenu(g, 7);
      case 8: return help(g);
    }
  };

  // indoor furniture: ids like shelf:3, desk:1, home:bed
  const resolve = (id: string): Script | null => {
    const [kind, arg] = id.split(':');
    if (kind === 'shelf') {
      const p = data.posts[+arg];
      if (!p) return async (g) => g.say([pick(['Dusty shelves. Mostly reference manuals.', 'A shelf of notebooks with nothing in them yet.', 'Someone filed these by colour. Bold choice.'])]);
      return async (g) => {
        await g.say([`"${p.title}"`, `${p.date}. ${p.excerpt}`]);
        const i = await g.choose([{ label: 'Read it' }, { label: 'Put it back' }], { anchor: 'bottomRight' });
        if (i === 0) g.goTo(`/posts/${p.id}`);
      };
    }
    if (kind === 'desk') {
      const w = data.work[+arg];
      if (!w) return async (g) => g.say([pick(['An empty desk. Waiting for the next chapter.', 'A desk with a single sticky note: "ship it".'])]);
      return async (g) => {
        await g.say([`${w.role.toUpperCase()} at ${w.org.toUpperCase()}`, `${w.start} to ${w.end}. The keyboard still has fingerprints on it.`]);
        if (w.href && w.href !== '#') { const i = await g.choose([{ label: `Visit ${w.org}` }, { label: 'Back' }], { anchor: 'bottomRight' }); if (i === 0) g.goTo(w.href); }
      };
    }
    switch (id) {
      case 'home:bed': return async (g) => { const i = await g.choose([{ label: 'Take a nap' }, { label: 'Not sleepy' }], { anchor: 'bottomRight' }); if (i === 0) { g.sleep(); await g.say(['You napped. The light outside has changed.']); } };
      case 'home:books': return async (g) => { await g.say(['Books, mostly about building things.', ...data.now]); };
      case 'home:desk': return async (g) => { await g.say(['The desk. Forty-seven tabs are open on the computer.']); await links(g); };
      case 'home:dresser': return async (g) => g.say(['Seven identical t-shirts. Decision fatigue: solved.']);
      case 'home:table': return about;
      case 'office:board': return async (g) => g.say(['SPRINT BOARD', 'TODO: 14   DOING: 3   DONE: 1', 'The "DONE" card is "make sprint board".']);
      case 'office:kettle': return async (g) => g.say(['The kettle is always on.', 'Tea count today: yes.']);
      case 'office:pc': return async (g) => { g.sfx('confirm'); await g.terminal(); };
      case 'library:table': return async (g) => g.say(['A reading table with a warm lamp.', `${data.posts.length} notes live on these shelves. Walk up to one and press A.`]);
    }
    return null;
  };

  const indoorNpcs: Record<string, NpcContent> = {
    librarian: { name: 'Librarian', script: async (g) => g.say([pick([
      'Shh. Each shelf holds one note. Face a shelf and press A to read.',
      'The newest writing is on the top row, left to right.',
      'We do not lend out the good ideas. You have to read them here.',
    ])]) },
    coworker1: { name: 'Coworker', script: async (g) => g.say([pick(['Have you tried turning the deploy off and on again?', 'Each desk here is a chapter of the work history. Press A on one.', "It's not a bug, it's an undocumented feature."])]) },
    coworker2: { name: 'Coworker', script: async (g) => g.say([pick(['Standup was 45 minutes today. Sitting down.', `${org} runs on tea and optimism.`, 'I pushed to main. On a Friday. Pray for me.'])]) },
    boss: { name: 'The Inspector', script: async (g) => g.say([pick(['Ah, the code reviewer. Approve with comments.', 'I inspect pull requests. I have seen things.', 'LGTM. Ship it.'])]) },
  };
  Object.assign(npcs, indoorNpcs);

  return { doors, signs, npcs, animalLines, startMenu, help, about, work, projects, writing, links, now, resolve };
}

export const MONSTER_NAMES: Record<string, string> = {
  slime: 'NULL SLIME', slime2: 'RACE SLIME', larva: 'OFF-BY-ONE', mushroom: 'HEISENBUG', mole: 'MEMORY LEAK',
  snake: 'SEGFAULT', spiderRed: 'REGEX SPIDER', blueBat: 'FLAKY TEST', mouse: 'TYPO', eye: 'LINTER', bamboo: 'STACK OVERFLOW',
  butterfly: 'FEATURE CREEP', owl: 'CODE REVIEW', kappaGreen: 'MERGE CONFLICT', racoon: 'DEPENDABOT', flam: 'HOTFIX',
};


/** Wild bugs challenge you with a question. Answer right and it faints. */
export interface Trivia { q: string; answers: string[]; correct: number; win: string; lose: string }
export const TRIVIA: Trivia[] = [
  { q: 'HTTP 418 means...', answers: ["I'm a teapot", 'Too many requests', 'Gone fishing'], correct: 0, win: 'The BUG steams gently and faints.', lose: 'The BUG pours itself a cup and escapes.' },
  { q: 'In JavaScript, typeof null is...', answers: ['"null"', '"object"', '"undefined"'], correct: 1, win: 'The BUG cannot argue with 1995.', lose: 'The BUG whispers "legacy" and slithers away.' },
  { q: 'Which one is NOT a Git command?', answers: ['git rebase', 'git blame', 'git regret'], correct: 2, win: 'You regret nothing. The BUG faints.', lose: 'The BUG force-pushes and escapes.' },
  { q: 'The answer to life, the universe and everything?', answers: ['41', '42', '404'], correct: 1, win: 'The BUG brought a towel. Too late.', lose: 'The BUG panics. So do you.' },
  { q: 'What does CSS stand for?', answers: ['Cascading Style Sheets', 'Computer Styled Screens', 'Chaotic Sizing System'], correct: 0, win: 'The BUG is centred vertically at last.', lose: 'The BUG overflows: hidden.' },
  { q: 'Big-O of binary search?', answers: ['O(n)', 'O(log n)', 'O(no)'], correct: 1, win: 'Halved, halved, halved. The BUG is gone.', lose: 'The BUG searches linearly for the exit.' },
  { q: 'Which planet do most SQL injections come from?', answers: ["Bobby Tables' school", 'Mars', 'Stack Overflow'], correct: 0, win: 'Little Bobby Tables sends regards. BUG dropped.', lose: 'The BUG says: DROP TABLE hopes;' },
  { q: 'The first computer bug was literally...', answers: ['A moth', 'A beetle', 'A typo'], correct: 0, win: 'The BUG is taped into a logbook. Fainted.', lose: 'The BUG flutters off toward a relay.' },
  { q: 'Tabs or spaces?', answers: ['Tabs', 'Spaces', 'Whatever the linter says'], correct: 2, win: 'Peace in our time. The BUG faints.', lose: 'The BUG starts a flame war and escapes in the noise.' },
  { q: '0.1 + 0.2 === 0.3 ?', answers: ['true', 'false', 'depends on the moon'], correct: 1, win: 'Floating point strikes again. BUG fainted.', lose: 'The BUG rounds you down and escapes.' },
  { q: 'What does "LGTM" mean?', answers: ['Looks Good To Me', 'Let Go, Trust Machines', 'Lint Got Too Mad'], correct: 0, win: 'Approved. The BUG is merged into oblivion.', lose: 'The BUG requests changes and escapes.' },
  { q: 'Which is a real Linux command?', answers: ['yes', 'maybe', 'please'], correct: 0, win: 'yes yes yes yes yes. The BUG faints.', lose: 'The BUG says no and escapes.' },
  { q: 'A "heisenbug" is a bug that...', answers: ['Only appears in Germany', 'Disappears when you observe it', 'Is very certain about its position'], correct: 1, win: 'You looked away. It vanished. Victory?', lose: 'You look directly at it. It smirks. It escapes.' },
  { q: 'The best place to hide a body?', answers: ['Page 2 of Google', 'A comment block', 'node_modules'], correct: 2, win: 'The BUG is lost in node_modules forever.', lose: 'The BUG npm installs itself again.' },
];

export const JOKE_MOVES = [
  { label: 'Turn it off and on again', works: 0.5, win: 'It... actually worked. The BUG faints in disbelief.', lose: 'Still broken. The BUG laughs and escapes.' },
  { label: 'Blame the intern', works: 0.0, win: '', lose: "The intern wasn't even here. The BUG escapes in shame. Yours." },
  { label: 'Add more console.log', works: 0.3, win: 'A wall of logs buries the BUG. Fainted!', lose: 'The BUG is somewhere in 4,000 lines of output. Escaped.' },
];
