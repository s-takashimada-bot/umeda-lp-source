// LPを書き出す。
//   node build.mjs            → 下書き（dist/。検索エンジンに載らない設定、未設定の項目を点線で表示）
//   node build.mjs --preview  → 確認用。検索エンジンに載らない設定のまま、未設定の項目は「準備中」にするか出さない
//                               （本部の承諾をもらう前に、ネット上で見てもらうため）。--url=https://… で置き場所のURLを渡す
//   node build.mjs --release  → 公開用。未設定の項目が1つでも残っていれば止まる
import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { variants, variantOrder } from './src/content/variants.mjs';
import { corporate } from './src/content/corporate.mjs';
import { makeTracker, studentPage, topPage, corporatePage, tokushohoPage, privacyPage } from './src/templates.mjs';
import { gifts, giftOrder } from '../特典/src/content.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const release = process.argv.includes('--release');
const preview = !release && process.argv.includes('--preview');
const publicUrl = (process.argv.find((a) => a.startsWith('--url=')) || '').slice(6);
const modeLabel = release ? '公開用' : preview ? '確認用' : '下書き';
const out = join(root, 'dist');
const config = JSON.parse(await readFile(join(root, 'src/config.json'), 'utf8'));
const tracker = makeTracker();

// 画像の指定があるのにファイルがない場合も止める
const ogRefs = config.ogImage ? ['top', ...variantOrder, 'corporate'].map((k) => config.ogImage.replace('{page}', k)) : [];
const imageRefs = [config.repImage, ...ogRefs, ...config.screens.map((s) => s.file), ...config.instructors.map((i) => i.image), ...(config.venue.photos || [])].filter(Boolean);
for (const f of imageRefs) if (!existsSync(join(root, 'src', f))) tracker.need(`画像ファイルが見つからない：src/${f}`);

const pages = [
  { path: '', render: (ctx) => topPage(ctx, variants, variantOrder) },
  ...variantOrder.map((k) => ({ path: `${k}/`, render: (ctx) => studentPage(ctx, variants[k]) })),
  { path: 'corporate/', render: (ctx) => corporatePage(ctx, corporate) },
  { path: 'tokushoho/', render: (ctx) => tokushohoPage(ctx) },
  { path: 'privacy/', render: (ctx) => privacyPage(ctx) },
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(root, 'src/assets'), join(out, 'assets'), { recursive: true });
// 11/17 サイトの一番上に置くファイル（Google Search Console の所有権の確認ファイルなど。消さない）
if (existsSync(join(root, 'src/root'))) await cp(join(root, 'src/root'), out, { recursive: true });

// LINE登録の特典（../特典/ で書き出したPDF）を /（giftDir）/checklist-◯◯.pdf に置く。
// LPからはリンクせず、LINEでだけURLを送る。フォルダ名はランダムな文字（推測されにくくするため。robots.txtにも書かない）
const giftFiles = [];
if (!config.giftDir) tracker.need('特典PDFの置き場所（giftDir）');
const giftDir = config.giftDir || 'gift';
await mkdir(join(out, giftDir), { recursive: true });
for (const k of giftOrder) {
  const src = join(root, '../特典', `${gifts[k].file}.pdf`);
  const name = `${giftDir}/checklist-${k}.pdf`;
  if (existsSync(src)) { await cp(src, join(out, name)); giftFiles.push({ edition: gifts[k].edition, name }); }
  else tracker.need(`特典のPDFがない：特典/${gifts[k].file}.pdf（特典フォルダで node build.mjs）`);
}

// 11/15 公式LINEセッションの依頼：個別無料相談会の予約ページ（../../SNS/公式Line/個別相談会_予約/page/）を /soudan/ に置く。
// config.soudan.enabled が true のときだけ（本人の了承が出るまで false）。公開用ではLPと同じ扱い（noindexを外し、計測タグを入れる）
if (config.soudan?.enabled) {
  const sdSrc = join(root, '../../SNS/公式Line/個別相談会_予約/page');
  if (existsSync(join(sdSrc, 'index.html'))) {
    await cp(sdSrc, join(out, 'soudan'), { recursive: true });
    const isRelease = process.argv.includes('--release');
    if (isRelease || process.argv.includes('--tags')) {
      const a = config.analytics || {};
      const ga = a.googleTag ? `<script async src="https://www.googletagmanager.com/gtm.js?id=${a.googleTag}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());</script>`
        : a.ga4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${a.ga4}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${a.ga4}');</script>` : '';
      const px = a.metaPixel ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${a.metaPixel}');fbq('track','PageView');</script>` : '';
      let h = await readFile(join(out, 'soudan/index.html'), 'utf8');
      if (isRelease) h = h.replace(/<meta name="robots" content="noindex">\s*/, '');
      h = h.replace('</head>', `${ga}${px}</head>`);
      await writeFile(join(out, 'soudan/index.html'), h);
    }
  } else tracker.need('相談会の予約ページがない：SNS/公式Line/個別相談会_予約/page/index.html');
}

const html_has_memo = [];
for (const p of pages) {
  const depth = p.path.split('/').filter(Boolean).length;
  const ctx = { config, draft: !release && !preview, preview, noindex: !release, withTags: process.argv.includes('--tags'), publicUrl, base: '../'.repeat(depth), path: p.path, tracker };
  const html = p.render(ctx);
  if (release && html.includes('【要確認')) tracker.need(`「【要確認】」が残っている：/${p.path}`);
  if (preview && html.includes('【要確認')) html_has_memo.push(`/${p.path}`);
  const dir = join(out, p.path);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html, 'utf8');
}

// 公開先（GitHub Pages）用
if (config.siteUrl) await writeFile(join(out, 'CNAME'), new URL(config.siteUrl).host + '\n', 'utf8');
await writeFile(join(out, '.nojekyll'), '', 'utf8');
await writeFile(join(out, 'robots.txt'), release ? `User-agent: *\nAllow: /\n${config.siteUrl ? `Sitemap: ${config.siteUrl.replace(/\/$/, '')}/sitemap.xml\n` : ''}` : 'User-agent: *\nDisallow: /\n', 'utf8');
if (config.siteUrl) {
  const base = config.siteUrl.replace(/\/$/, '');
  const urls = pages.map((p) => `  <url><loc>${base}/${p.path}</loc></url>`).join('\n');
  await writeFile(join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, 'utf8');
}

const missing = [...tracker.missing];
console.log(`${modeLabel}を書き出しました：${pages.length}ページ → dist/`);
if (preview && html_has_memo.length) console.warn(`  注意：確認用に【要確認】のメモが残っています：${html_has_memo.join('・')}`);
if (giftFiles.length) {
  const base = config.siteUrl ? config.siteUrl.replace(/\/$/, '') : '（ドメイン）';
  console.log('\n特典のPDF（LINEで送るURL）');
  for (const g of giftFiles) console.log(`  - ${g.edition}：${base}/${g.name}`);
}
if (missing.length) {
  console.log(`\n公開前に埋める項目（${missing.length}件）`);
  for (const m of missing) console.log(`  - ${m}`);
}
if (tracker.later.size) {
  console.log(`\nあとから足す項目（公開は止めない・${tracker.later.size}件）`);
  for (const m of tracker.later) console.log(`  - ${m}`);
}
if (release && missing.length) {
  console.error('\n未設定の項目があるため、公開用ビルドを止めました。src/config.json を埋めてから再実行してください。');
  await rm(out, { recursive: true, force: true });
  process.exit(1);
}
