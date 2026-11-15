// 計測タグ（Googleアナリティクス・Metaピクセル）がページに入り、動いているかを確かめる。
//   node tools/check-tags.mjs                       → 手元（http://localhost:4173/owner/）を調べる
//   node tools/check-tags.mjs https://miraicamp-osaka-umeda.jp/owner/   → 公開後の本番を調べる
// 画面なしのChromeでページを開き、LINEボタンを1回押して（LINEへは移動しない）、結果を一覧にする。
// 手元で調べるときは、先に node build.mjs --preview --tags で書き出し、node serve.mjs を動かしておく。
//
// 分かること
//   Googleアナリティクス：実際に送られた通信（測定IDとイベント名）
//   Metaピクセル：ピクセルが読み込まれ、イベントを受け付けたか（番号と件数）
//     ※Metaのタグは、自動操作のブラウザからは送信しない（機械的なアクセスを除く仕組み）。
//       Metaに届いたかは、ふだんのブラウザで開いたうえで、イベントマネージャの「テストイベント」で確かめる
//       （テストイベントは公開されたURLだけを受け付け、localhostは使えない）。

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openBrowser, sleep } from './headless.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { analytics } = JSON.parse(await readFile(join(root, 'src/config.json'), 'utf8'));
const url = process.argv[2] || 'http://localhost:4173/owner/';

const b = await openBrowser({ prefer: 'chrome' }); // Edgeは追跡防止でMetaのタグを止めるため、Chromeで調べる
const sent = [];
b.on((m) => { if (m.method === 'Network.requestWillBeSent') sent.push(m.params.request); });
await b.send('Network.enable');
await b.load(url);
await sleep(3000);
const evalJs = async (expression) => (await b.send('Runtime.evaluate', { expression, returnByValue: true })).result?.result?.value;
const clicked = await evalJs(`(() => { const el = document.querySelector('a.btn-line[data-track]'); if (!el) return false; el.addEventListener('click', (e) => e.preventDefault(), { once: true }); el.click(); return true; })()`);
await sleep(8000); // Googleアナリティクスはイベントを数秒ためてから送るので、長めに待つ
const pixels = await evalJs(`(() => { try { return window.fbq.getState().pixels.map((p) => ({ id: p.id, count: p.eventCount })); } catch (e) { return null; } })()`);
await b.close();

// Googleアナリティクス：1回の通信に複数のイベントがまとまることがある（本文に1行ずつ入る）
const ga = [];
for (const r of sent) {
  if (!/google-analytics\.com\/.*collect|analytics\.google\.com\/.*collect/.test(r.url)) continue;
  const u = new URL(r.url);
  const tid = u.searchParams.get('tid') || '';
  const names = [u.searchParams.get('en'), ...(r.postData || '').split(/\r?\n/).map((line) => new URLSearchParams(line).get('en'))].filter(Boolean);
  for (const en of names) ga.push({ id: tid, event: en });
}

console.log(`調べたページ：${url}`);
console.log(`LINEボタン：${clicked ? '押した' : '見つからない（押せるLINEボタンがない）'}`);

console.log(`\nGoogleアナリティクス（設定の測定ID：${analytics.ga4 || '未設定'}）`);
if (!ga.length) console.log('  ✗ 何も送られていません');
for (const x of ga) console.log(`  ${x.id === analytics.ga4 ? '✓' : '✗ 番号が違う'} ${x.id}  ${x.event}`);
for (const ev of ['page_view', 'line_click']) if (!ga.some((x) => x.id === analytics.ga4 && x.event === ev)) console.log(`  ✗ ${ev} が送られていません`);

console.log(`\nMetaピクセル（設定の番号：${analytics.metaPixel || '未設定'}）`);
if (!pixels) console.log('  ✗ ピクセルが読み込まれていません');
else for (const p of pixels) console.log(`  ${p.id === analytics.metaPixel ? '✓' : '✗ 番号が違う'} ${p.id}  受け付けたイベント ${p.count}件${p.count >= 2 ? '（ページ表示とLINEボタン）' : '（ページ表示とLINEボタンで2件以上になるはず）'}`);
console.log('  ※Metaに届いたかは、イベントマネージャの「テストイベント」で確かめる（このファイルの先頭の説明）');
