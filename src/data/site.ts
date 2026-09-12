// Everything editable about the site lives here.
// Posts live in src/content/posts/*.md

const env: Record<string, string | undefined> = (import.meta as any).env ?? {};

export const site = {
  name: 'Uddeepta Raaj Kashyap',
  shortName: 'Uddeepta',
  title: 'Uddeepta Raaj Kashyap',
  description: 'Building simple software, and writing about it now and then.',
  // Shown large on the home page. Wrap one word in *asterisks* to set it in italic accent.
  headline: 'Building simple software, and *writing* about it now and then.',
  email: 'uddeeptaraajkashyap@gmail.com',
  location: 'Bengaluru, India',
  timeZone: 'Asia/Kolkata',
  // GitHub username: the Workshop lists your latest public repos live (leave '' to disable)
  github: 'okieLoki',
  url: 'https://example.com',
  // Supabase powers the shared doodle wall and the visitor log behind /admin.
  // Put PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env (see .env.example);
  // the SQL to run once is at the top of src/game/board.ts and src/lib/track.ts.
  supabase: { url: env.PUBLIC_SUPABASE_URL ?? '', anonKey: env.PUBLIC_SUPABASE_ANON_KEY ?? '' },
};

export const intro = [
  `I build things on the internet — currently at <a href="https://writesonic.com">Writesonic</a>, where I work on tools that help people write and be found.`,
  `I like software that does one thing well, plain text, and the space between design and engineering. This site is where I keep notes on all of that.`,
];

export const now = [
  'Shipping product at Writesonic.',
  'Writing more, and keeping this site plain.',
  'Reading <em>The Elements of Typographic Style</em>, slowly.',
];

export const work = [
  { role: 'Software Engineer', org: 'Writesonic', href: 'https://writesonic.com', start: '2024', end: 'now' },
  { role: 'Frontend Engineer', org: 'Previous Co', href: '#', start: '2022', end: '2024' },
  { role: 'Intern', org: 'First Co', href: '#', start: '2021', end: '2022' },
];

export const projects = [
  {
    name: 'This site',
    description: 'A plain, text-first portfolio built with Astro. No trackers, no JS beyond a clock.',
    href: '#',
    meta: '2026',
  },
  {
    name: 'Quiet',
    description: 'A single-purpose writing app. One file, one font, no settings.',
    href: '#',
    meta: '2025',
  },
  {
    name: 'ls-cli',
    description: 'Small command-line utilities I keep reaching for.',
    href: '#',
    meta: '2024',
  },
];

export const elsewhere = [
  { label: 'Email', value: 'uddeeptaraajkashyap@gmail.com', href: 'mailto:uddeeptaraajkashyap@gmail.com' },
  { label: 'GitHub', value: 'github.com/okieLoki', href: 'https://github.com/okieLoki' },
  { label: 'X', value: '@UddeeptaK', href: 'https://x.com/uddeeptaK' },
  { label: 'LinkedIn', value: 'in/uddeeptark', href: 'https://linkedin.com/in/uddeeptark' },
];
