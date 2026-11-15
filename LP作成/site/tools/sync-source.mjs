// LPの「元のコード」を、GitHubの公開リポジトリ（s-takashimada-bot/umeda-lp-source）に送る。
//   node tools/sync-source.mjs            → コピーして、変更があればコミットしてプッシュ
//   node tools/sync-source.mjs --dry      → コピーだけ（コミット・プッシュしない）
// 11/16 本人：本部にコードを見てもらうため、元のコードもGitHubに置く（公開で進める）。
// 置き場所はOneDriveの外（同期とgitがぶつかるため）。企画メモ（.md の検討資料）や書き出し済みの dist/ は送らない。
import { cp, rm, mkdir, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..'); // 集客/LP作成/site
const shukyaku = join(site, '..', '..'); // 集客
const REPO = 's-takashimada-bot/umeda-lp-source';
const DIR = 'C:/Users/s-tak/umeda-lp-source';
const dry = process.argv.includes('--dry');

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: DIR, ...opts });
  if (r.status !== 0) throw new Error(`失敗：${cmd} ${args.join(' ')}`);
};
const out = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', cwd: DIR }).stdout.trim();

// 送るもの（集客フォルダからの相対パス）。build.mjs が ../特典 と ../../SNS/… を読むので、同じ並びのまま置く
const items = [
  { from: 'LP作成/site', skip: ['dist', 'node_modules', 'prof'] },
  { from: 'LP作成/特典', skip: ['確認待ち'], onlyExt: null, skipFiles: (f) => f.endsWith('.md') && f !== 'README.md' },
  { from: 'SNS/公式Line/個別相談会_予約/page', skip: [] },
];

if (!existsSync(join(DIR, '.git'))) {
  await mkdir(DIR, { recursive: true });
  run('git', ['init', '-b', 'main']);
  run('git', ['config', 'core.quotepath', 'false']);
}

// いったん中身を消してから入れ直す（消したファイルも反映するため。.git と README・.gitignore は残す）
for (const it of items) await rm(join(DIR, it.from), { recursive: true, force: true });
for (const it of items) {
  const src = join(shukyaku, it.from);
  await cp(src, join(DIR, it.from), {
    recursive: true,
    filter: (p) => {
      const rel = p.slice(src.length).replace(/\\/g, '/');
      const parts = rel.split('/').filter(Boolean);
      if (parts.some((x) => it.skip.includes(x))) return false;
      if (it.skipFiles && parts.length === 1 && it.skipFiles(parts[0])) return false;
      return true;
    },
  });
}

if (dry) { console.log(`コピーしました（--dry）：${DIR}`); process.exit(0); }

run('git', ['add', '-A']);
if (!out('git', ['status', '--porcelain'])) { console.log('変更なし'); process.exit(0); }
const now = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
run('git', ['commit', '-m', `元のコードを更新（${now}）`]);
if (!out('git', ['remote'])) run('git', ['remote', 'add', 'origin', `https://github.com/${REPO}.git`]);
run('git', ['push', '-u', 'origin', 'main']);
console.log(`送りました → https://github.com/${REPO}`);
