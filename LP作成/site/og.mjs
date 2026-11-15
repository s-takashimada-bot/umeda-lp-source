// SNSやLINEでLPのURLを送ったときに出る画像（OGP画像・1200×630）を、ページごとに作る。
//   node og.mjs   → src/assets/img/og/og-（top / owner / salon / restaurant / office / corporate）.jpg
// 文字は各LPの最初の画面と同じ（対象・関西弁のひとこと・見出し）。開校日は入れない（SNSに古い画像が残り続けるため）。
// 数字（代表の実例の時間）も入れない（注記を添えられないため）。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { variants, variantOrder } from './src/content/variants.mjs';
import { corporate } from './src/content/corporate.mjs';
import { openBrowser } from './tools/headless.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const img = join(root, 'src/assets/img');
const outDir = join(img, 'og');
const config = JSON.parse(await readFile(join(root, 'src/config.json'), 'utf8'));
const logo = 'data:image/png;base64,' + (await readFile(join(img, 'logo.png'))).toString('base64');
const skyline = 'data:image/svg+xml;base64,' + (await readFile(join(img, 'umeda-skyline.svg'))).toString('base64');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const keepBr = (s) => esc(String(s).replace(/<br[^>]*>/g, '\n')).replace(/\n/g, '<br>');

// トップの文字は templates.mjs の topPage と同じ
const pages = [
  { key: 'top', kicker: 'AI初心者のための、2日間の対面講座', catch: '毎月の面倒な仕事、AIで仕組みにしよか。', h1: '2日間で、自分の仕事を<br>AIで仕組み化する一歩を。' },
  ...variantOrder.map((k) => ({ key: k, kicker: variants[k].kicker, catch: variants[k].catch, h1: variants[k].h1 })),
  { key: 'corporate', kicker: corporate.kicker, catch: corporate.catch, h1: corporate.h1 },
];
const badges = { default: ['プログラミング未経験から', '講師と対面の2日間', '大阪・梅田（中崎町）'], corporate: ['社員研修として受講', '講師と対面の2日間', '大阪・梅田（中崎町）'] };

const html = (p) => `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Zen+Maru+Gothic:wght@700&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1200px;height:630px;overflow:hidden}
body{font-family:"Noto Sans JP",sans-serif;color:#fff;letter-spacing:.02em}
.og{position:relative;width:1200px;height:630px;padding:52px 72px 0;overflow:hidden;
  background:radial-gradient(circle at 92% 8%,rgba(255,138,0,.38),rgba(255,138,0,0) 34%),linear-gradient(160deg,#103a85 0%,#0b2d6b 45%,#071538 100%)}
.top{display:flex;align-items:center;gap:18px}
.logo{width:68px;height:68px;border-radius:50%;background:#fff}
.brand{font-weight:700;font-size:26px;letter-spacing:.06em;color:#ffd9a6}
.kicker{margin-left:auto;background:#ff8a00;color:#fff;font-weight:900;font-size:24px;padding:6px 22px;border-radius:999px;letter-spacing:.05em}
.catch{position:relative;display:inline-block;margin-top:40px;background:#fff;color:#0b2d6b;font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:30px;padding:10px 26px;border-radius:18px}
.catch::after{content:"";position:absolute;left:36px;bottom:-14px;border:9px solid transparent;border-top:14px solid #fff;border-bottom:0}
h1{margin-top:22px;font-family:"Zen Maru Gothic",sans-serif;font-weight:700;font-size:58px;line-height:1.32;letter-spacing:.03em;word-break:auto-phrase}
.badges{display:flex;gap:12px;margin-top:24px}
.badges span{font-size:22px;font-weight:700;padding:5px 18px;border-radius:999px;border:2px solid rgba(255,255,255,.55);background:rgba(255,255,255,.08)}
.sky{position:absolute;left:0;right:0;bottom:-1px;height:96px;background:url("${skyline}") center bottom/cover no-repeat}
</style></head><body>
<div class="og">
  <div class="top"><img class="logo" src="${logo}" alt=""><p class="brand">${esc(config.siteName)}</p><p class="kicker">${esc(p.kicker)}</p></div>
  <p class="catch">${esc(p.catch)}</p>
  <h1>${keepBr(p.h1)}</h1>
  <p class="badges">${(badges[p.key] || badges.default).map((b) => `<span>${esc(b)}</span>`).join('')}</p>
  <div class="sky"></div>
</div></body></html>`;

await mkdir(outDir, { recursive: true });
const work = join(tmpdir(), 'lp-og-html');
await mkdir(work, { recursive: true });
const b = await openBrowser();
try {
  await b.send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  for (const p of pages) {
    const file = join(work, `${p.key}.html`);
    await writeFile(file, html(p));
    await b.load(pathToFileURL(file).href);
    // はみ出しの確認（見出しや帯が下の街並みにかからないか）
    const r = await b.send('Runtime.evaluate', { expression: `(() => { const s = document.querySelector('.badges').getBoundingClientRect(); const k = document.querySelector('.kicker').getBoundingClientRect(); const b = document.querySelector('.brand').getBoundingClientRect(); return { badgesBottom: Math.round(s.bottom), kickerOverlap: k.left < b.right + 12 }; })()`, returnByValue: true });
    const v = r.result.result.value;
    if (v.badgesBottom > 560) console.warn(`  注意：${p.key} の文字が下の街並みにかかっています（${v.badgesBottom}px）`);
    if (v.kickerOverlap) console.warn(`  注意：${p.key} の対象の帯が校名にぶつかっています`);
    const shot = await b.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
    const out = join(outDir, `og-${p.key}.jpg`);
    await writeFile(out, Buffer.from(shot.result.data, 'base64'));
    console.log(`✓ src/assets/img/og/og-${p.key}.jpg`);
  }
} finally {
  await b.close();
}
