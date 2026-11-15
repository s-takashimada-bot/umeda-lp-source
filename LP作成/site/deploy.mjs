// LPを書き出して、GitHub Pagesに送る。
//   node deploy.mjs            → 確認用（--preview）を送る。検索エンジンに載らない
//   node deploy.mjs --release  → 公開用を送る（本部の承諾が出て、未設定の項目がなくなってから）
// 送り先は config.json の publish（repo・dir・previewUrl）。dir はOneDriveの外にある公開用のgitの置き場所。

import { readFile, readdir, rm, cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(await readFile(join(root, 'src/config.json'), 'utf8'));
const release = process.argv.includes('--release');
const { repo, dir, previewUrl } = config.publish || {};
if (!repo || !dir) throw new Error('config.json の publish（repo・dir）がありません');

const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) throw new Error(`失敗：${cmd} ${args.join(' ')}`);
};
const out = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts }).stdout.trim();

// 1. 書き出す（公開用は、未設定が残っていると build.mjs が止まる）
const url = config.siteUrl || previewUrl || '';
run(process.execPath, [join(root, 'build.mjs'), release ? '--release' : '--preview', ...(url ? [`--url=${url}`] : [])], { cwd: root });

// 2. 公開用の置き場所を用意する（初回だけ：GitHubから取ってくる）
if (!existsSync(join(dir, '.git'))) {
  await mkdir(dirname(dir), { recursive: true });
  run('gh', ['repo', 'clone', repo, dir]);
  run('git', ['config', 'core.autocrlf', 'false'], { cwd: dir }); // 改行コードを書き換えない（Windowsの警告を出さない）
}

// 3. 置き場所の中身を dist/ と入れ替える（.git だけ残す）
for (const name of await readdir(dir)) if (name !== '.git') await rm(join(dir, name), { recursive: true, force: true });
await cp(join(root, 'dist'), dir, { recursive: true });

// 4. 変わったところがあれば送る
run('git', ['add', '-A'], { cwd: dir });
if (!out('git', ['status', '--porcelain'], { cwd: dir })) {
  console.log('変更はありません（送っていません）');
} else {
  const stamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  run('git', ['commit', '-q', '-m', `${release ? '公開用' : '確認用'}を更新（${stamp}）\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`], { cwd: dir });
  run('git', ['push', '-q', 'origin', 'HEAD:main'], { cwd: dir });
  console.log(`送りました → ${url || repo}（反映まで1〜2分）`);
}

// 11/16 本人：本部にコードを見てもらうため、元のコードも GitHub（umeda-lp-source・公開）に送る
const syncR = spawnSync(process.execPath, [join(root, 'tools/sync-source.mjs')], { stdio: 'inherit' });
if (syncR.status !== 0) console.warn('元のコードの送信に失敗しました（ページの公開は済んでいます）');
