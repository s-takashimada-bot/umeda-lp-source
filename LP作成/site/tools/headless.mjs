// パソコンに入っているMicrosoft Edge（なければChrome）を画面なしで起動し、
// DevToolsの通信（CDP）でページを開いて、PDFや画像に書き出すための小さな道具。
// 使っているところ：../og.mjs（SNSでシェアしたときの画像）、../../特典/build.mjs（特典のPDF）

import { access, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// prefer：先に探すブラウザ（'chrome' など）。Edgeは追跡防止の機能でMetaピクセルの通信を止めるので、計測タグの確認ではChromeを使う
async function findBrowser(prefer = '') {
  const list = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ];
  if (prefer) list.sort((a, b) => b.toLowerCase().includes(prefer) - a.toLowerCase().includes(prefer));
  for (const p of list) { try { await access(p); return p; } catch {} }
  throw new Error('Edge（またはChrome）が見つかりません');
}

export async function openBrowser({ prefer = '' } = {}) {
  const port = 9600 + Math.floor(Math.random() * 300);
  const profile = join(tmpdir(), `lp-headless-${port}`);
  const proc = spawn(await findBrowser(prefer), ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let page;
  for (let i = 0; i < 60 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
    if (!page) await sleep(200);
  }
  if (!page) { proc.kill(); throw new Error('Edgeに接続できません'); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const events = new Set(); const listeners = new Set();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } else if (m.method) { events.add(m.method); for (const f of listeners) f(m); }
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');

  return {
    send,
    // ブラウザからの知らせ（通信の開始など）を受け取る。check-tags.mjs が使う
    on(fn) { listeners.add(fn); },
    // ページを開き、読み込みとWebフォントを待つ。フォントが読めなければ注意を出す
    async load(url, fonts = ['700 12px "Noto Sans JP"', '700 12px "Zen Maru Gothic"']) {
      events.clear();
      await send('Page.navigate', { url });
      for (let i = 0; i < 100 && !events.has('Page.loadEventFired'); i++) await sleep(150);
      const r = await send('Runtime.evaluate', { expression: `document.fonts.ready.then(() => ${JSON.stringify(fonts)}.map((f) => document.fonts.check(f)))`, awaitPromise: true, returnByValue: true });
      const ok = r.result?.result?.value || [];
      if (ok.some((x) => !x)) console.warn(`  注意：Webフォントが読めていません（${fonts.filter((_, i) => !ok[i]).join('・')}）。ネット接続を確認してください`);
      await sleep(400);
    },
    async close() { ws.close(); proc.kill(); await sleep(300); await rm(profile, { recursive: true, force: true }).catch(() => {}); },
  };
}
