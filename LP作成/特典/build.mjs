// 「AIでできることチェックリスト」4種をPDFに書き出す（LPから直接渡す）。
//   node build.mjs          … 4種すべて
//   node build.mjs salon    … 1種だけ（owner / salon / restaurant / office）
// 中身は src/content.mjs、見た目は src/gift.css。校舎長の時間はLP（site/src/content/common.mjs）と同じ数字を使う。
// PDFは、パソコンに入っているMicrosoft Edgeを画面なしで動かして作る（../site/tools/headless.mjs。Python等は使わない）。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import * as C from './src/content.mjs';
import { variants } from '../site/src/content/variants.mjs';
import { icon } from '../site/src/icons.mjs';
import { openBrowser } from '../site/tools/headless.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const img = join(here, '../site/src/assets/img');
const config = JSON.parse(await readFile(join(here, '../site/src/config.json'), 'utf8'));
const css = await readFile(join(here, 'src/gift.css'), 'utf8');
const logo = 'data:image/png;base64,' + (await readFile(join(img, 'logo.png'))).toString('base64');
const skyline = 'data:image/svg+xml;base64,' + (await readFile(join(img, 'umeda-skyline.svg'))).toString('base64');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = (s) => String(s).replace(/<br[^>]*>/g, '');

// ---------- 組み立て ----------
function tag(item) {
  if (item.rep) {
    const r = C.repTimes[item.rep];
    if (!r) throw new Error(`校舎長の時間がない：${item.rep}`);
    const nm = r.name === item.title ? '' : `｜${esc(r.name)}`;
    return `<div class="tag rep"><span class="tag-k">校舎長の実例${nm}</span><span class="tag-v">${r.before}<i>→</i>${r.after}</span></div>`;
  }
  if (item.run) {
    const n = C.repRunning[item.run];
    if (!n) throw new Error(`校舎長の運用中の業務がない：${item.run}`);
    return `<div class="tag run"><span class="tag-k">校舎長もAIで運用中</span>${n === item.title ? '' : `<span class="tag-n">${esc(n)}</span>`}</div>`;
  }
  return '<div></div>';
}

// 11/15 本人：行ごとの校舎長の実例は見づらいので外す（シャープに）
const row = (item) => `<li class="row simple"><span class="box"></span><div><p class="t">${esc(item.title)}</p><p class="d">${esc(item.text)}</p></div><div class="mine"><span class="blank"></span>時間</div></li>`;

function group(g) {
  return `<section class="group">
  <div class="group-head"><h2>${esc(g.title)}</h2><div class="cols" style="grid-template-columns:20mm"><span>あなたの時間</span></div></div>
  <ul class="rows">${g.items.map(row).join('')}</ul>
</section>`;
}

function render(g) {
  const v = variants[g.key];
  const caseRows = v.caseOrder.map((k) => C.caseTasks[k]);
  const venue = config.venue;
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8">
<title>AIで自動化・効率化できることリスト（${esc(g.edition)}）｜${esc(config.siteName)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.1.1/400.css" rel="stylesheet"><link href="https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.1.1/700.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700&display=block" rel="stylesheet">
<style>${css}
.skyline { background-image: url("${skyline}"); }</style>
</head><body class="${g.dense ? 'dense' : ''}">

<header class="hero">
  <div class="hero-top"><img class="logo" src="${logo}" alt="MIRAI CAMP"><p class="eyebrow">${esc(config.siteName)}<b>無料プレゼント</b></p></div>
  <h1>AIで自動化・効率化<br>できることリスト</h1>
  <div class="hero-mid"><p class="edition">${esc(g.edition)}</p><p class="lead">${esc(g.lead)}</p></div>
  <div class="skyline"></div>
</header>

<ol class="howto">
  ${C.howTo.map((h, i) => `<li><span class="n">${i + 1}</span><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></li>`).join('\n  ')}
</ol>
<p class="hint">時間はすべて1か月あたりです。スマホで見ている方は、当てはまる数を数えるだけでも大丈夫です（印刷して書き込むこともできます）。</p>

${g.groups.map(group).join('\n')}

<section class="group extra">
  <div class="group-head"><h2>リストにない作業も、書き出してみましょう</h2><div class="cols" style="grid-template-columns:20mm"><span>あなたの時間</span></div></div>
  <ul class="rows">${[0, 1].map(() => '<li class="row"><span class="box"></span><div class="write"></div><div class="mine"><span class="blank"></span>時間</div></li>').join('')}</ul>
</section>

<section class="block">
  <h2 class="sec">${icon('idea')}${esc(C.signs.title)}</h2>
  <p class="sec-lead">${esc(C.signs.lead)}</p>
  <ul class="signs">${C.signs.items.map((s) => `<li>${icon(s.icon)}<h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ul>
</section>

<section class="block">
  <h2 class="sec">${icon('calc')}数えてみましょう</h2>
  <div class="fill-grid">
    <div class="fill"><span class="fl">✓をつけた作業</span><span class="fv"><span class="blank"></span>個</span></div>
    <div class="fill"><span class="fl">◎ いちばん減らしたい作業</span><span class="fv"><span class="blank wide"></span></span></div>
    <div class="fill"><span class="fl">✓をつけた作業の時間の合計</span><span class="fv"><span class="blank"></span>時間／月</span></div>
    <div class="fill"><span class="fl">お金にすると（時給換算）</span><span class="fv"><span class="blank"></span>時間 × <span class="blank"></span>円 ＝ 毎月<span class="blank w24"></span>円分</span></div>
    <div class="fill"><span class="fl">時間ができたら、やりたいこと</span><span class="fv"><span class="blank wide"></span></span></div>
  </div>
  <p class="note">仮に半分の時間にできたら、毎月その半分の金額分の時間が浮く計算です（目安）。</p>
</section>

<section class="block case">
  <h2 class="sec">${icon('chart')}校舎長の実例</h2>
  <div class="total"><span class="tl">4店舗の事務・月あたり</span><span class="tv">手作業<b>${C.caseTotal.before}</b></span><span class="ar">→</span><span class="tv">AI利用後<b>${C.caseTotal.after}</b></span><span class="rate">${C.caseTotal.rate}減</span></div>
  <div class="talk"><span class="who">校舎長</span><p class="bubble">${esc(C.story.talks[0])}</p></div>
  <p class="note">※${esc(C.caseNote)}AI利用後の時間は、確認・承認の時間を含みます。${g.sameNote ? esc(g.sameNote) : ''}</p>
</section>

<section class="next">
  <h2>${icon('line')}${esc(C.next.title)}</h2>
  <p>${esc(C.next.text)}</p>
  <ol class="steps">${C.next.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
  ${C.next.notes.map((n) => `<p class="small">${esc(n)}</p>`).join('')}
</section>

<section class="course">
  <div>
    <h2>${esc(C.course.title)}</h2>
    <p class="ct">${esc(C.course.text)}</p>
    <ul>${C.course.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
  </div>
  <div class="venue">
    <p class="vh">${icon('pin')}教室</p>
    <p>${esc(venue.address)}</p>
    <p>${venue.access.map(esc).join('<br>')}</p>
  </div>
</section>

<ul class="foot">
  <li>※このチェックリストの作業例は、AIで仕組みにできる作業の例です。作れるものや減らせる時間は、作業の内容やお使いのシステムによって異なります。</li>
  <li>※2日間の講座では、この中から1つか2つの機能に絞って、自分の仕事のアプリを作ります。</li>
  <li>© 2026 ${esc(config.company)}　${esc(config.siteName)}</li>
</ul>

</body></html>`;
}

// ---------- PDFに書き出す（Edgeを画面なしで起動して、CDPで印刷） ----------
const footer = (edition) => `<div style="width:100%;font-size:7px;color:#5a6476;padding:0 12mm;display:flex;justify-content:space-between;font-family:'Yu Gothic','Meiryo',sans-serif;">
<span>${esc(config.siteName)}｜AIで自動化・効率化できることリスト（${esc(edition)}）</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

const keys = process.argv.slice(2).length ? process.argv.slice(2) : C.giftOrder;
const work = join(tmpdir(), 'gift-html');
await mkdir(work, { recursive: true });
const b = await openBrowser();
try {
  for (const key of keys) {
    const g = C.gifts[key];
    if (!g) throw new Error(`知らない版：${key}（owner / salon / restaurant / office）`);
    const html = render(g);
    if (html.includes('【要確認')) throw new Error(`${g.edition}に【要確認】が残っています`);
    const htmlPath = join(work, `${key}.html`);
    await writeFile(htmlPath, html);
    await b.load(pathToFileURL(htmlPath).href);
    const res = await b.send('Page.printToPDF', {
      printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer(g.edition),
    });
    if (!res.result) throw new Error(`PDFにできませんでした：${JSON.stringify(res.error)}`);
    const out = join(here, `${g.file}.pdf`);
    try {
      await writeFile(out, Buffer.from(res.result.data, 'base64'));
    } catch (e) {
      throw new Error(`${g.file}.pdf を保存できません。PDFを開いていたら閉じてから、もう一度実行してください（${e.code}）`);
    }
    const pages = (Buffer.from(res.result.data, 'base64').toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    console.log(`✓ ${g.file}.pdf（${pages}ページ）`);
  }
} finally {
  await b.close();
}
