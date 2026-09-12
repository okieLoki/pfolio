// Runs supabase/setup.sql against the project in .env, via the Supabase Management API.
// Needs in .env:  PUBLIC_SUPABASE_URL, SUPABASE_ACCESS_TOKEN (dashboard → Account → Access Tokens),
//                 ADMIN_PASSWORD (the /admin password; generated for you if missing)
// usage: node scripts/supabase-setup.mjs [--check]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const envPath = new URL('../.env', import.meta.url);
const raw = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const env = Object.fromEntries(raw.split('\n').filter((l) => /^[A-Z_]+=/.test(l)).map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; }));

const url = env.PUBLIC_SUPABASE_URL ?? '';
const ref = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
const token = env.SUPABASE_ACCESS_TOKEN;
if (!ref) { console.error('PUBLIC_SUPABASE_URL missing or not a *.supabase.co URL'); process.exit(1); }
if (!token) { console.error('SUPABASE_ACCESS_TOKEN missing in .env — create one at https://supabase.com/dashboard/account/tokens'); process.exit(1); }

let password = env.ADMIN_PASSWORD;
if (!password) {
  password = randomBytes(9).toString('base64url');
  writeFileSync(envPath, raw.replace(/\n?$/, '\n') + `ADMIN_PASSWORD=${password}\n`);
  console.log('generated an /admin password and saved it to .env as ADMIN_PASSWORD');
}

const query = async (sql) => {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: sql }),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${text}`);
  return text ? JSON.parse(text) : null;
};

if (process.argv.includes('--check')) {
  console.log(await query(`select table_name from information_schema.tables where table_schema='public' order by 1`));
  process.exit(0);
}

const sql = readFileSync(new URL('../supabase/setup.sql', import.meta.url), 'utf8').replace("set_admin_password('change-me')", `set_admin_password('${password.replace(/'/g, "''")}')`);
await query(sql);
const tables = await query(`select table_name from information_schema.tables where table_schema='public' order by 1`);
console.log('ok — tables:', tables.map((t) => t.table_name).join(', '));
console.log(`/admin password is in .env (ADMIN_PASSWORD)`);
