// ページを組み立てる部品。content/*.mjs の文章と config.json の設定から HTML を作る。
import * as C from './content/common.mjs';
import { icon } from './icons.mjs';

// ---------- 小さな部品 ----------

// CSS・JSを直したとき、スマホなどに古いものが残らないよう、書き出すたびに番号を変える
const ASSET_V = Date.now().toString(36);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 公開前に埋める必要がある項目。ビルド時に一覧にし、--release では止める
export function makeTracker() {
  const missing = new Set(); // need：公開の条件。残っていると公開用の書き出しが止まる
  const later = new Set(); // later：あとから足すもの。一覧には出すが、公開は止めない
  return { missing, later, need: (label) => missing.add(label), addLater: (label) => later.add(label) };
}

function lineHref(ctx, key) {
  const url = ctx.config.line[key] || ctx.config.line.top;
  if (!url) ctx.tracker.need(`LINEの友だち追加URL（${key}）`);
  return url || '#line';
}

// 11/14 本人：LINEの大きいボタンには「簡単30秒」を必ず付ける（共通部品。下の固定ボタンとヘッダーの小さいボタンには付けない）
// 11/18 本人：本部が梅田校LINEを作り直し、友だち追加ですぐ「AI開発全体マップ」が届く → ボタンの言葉は特典に（B-2）、ボタンの近くに一言（A-1）
const LINE_LABEL = 'LINEでAI開発全体マップを受け取る';
const LINE_GIFT_NOTE = `<p class="cta-note line-gift-note">LINEに登録すると、すぐに「AI開発全体マップ」が届きます。無料セミナーの日程もお知らせします。</p>`;

function lineButton(ctx, key, { size = 'lg', label, track = 'line_click', where = '', quick = size === 'lg' && where !== 'sticky' } = {}) {
  const href = lineHref(ctx, key);
  const missing = href === '#line';
  const text = label || LINE_LABEL;
  // 確認用：LINEのURLがまだないときは、押せないボタンで「準備中」と出す
  if (missing && ctx.preview) return `<span class="btn btn-line btn-${size} is-disabled" aria-disabled="true">${icon('line')}<span>${size === 'sm' ? 'LINE準備中' : '公式LINEは準備中です'}</span></span>`;
  const btn = `<a class="btn btn-line btn-${size}" href="${esc(href)}" ${missing ? 'data-missing="LINEのURL"' : 'target="_blank" rel="noopener"'} data-track="${track}" data-where="${where}">${icon('line')}<span>${text}</span></a>`;
  return quick ? `<span class="quick-wrap"><span class="quick30">簡単30秒</span>${btn}</span>` : btn;
}

function applyLink(ctx, { cls = 'btn btn-ghost', where = '' } = {}) {
  const url = ctx.config.applyUrl;
  if (!url) ctx.tracker.need('申込ページのURL（本部管理）');
  if (!url && ctx.preview) return ''; // 確認用：申込ページのURLがまだないときは出さない
  return `<a class="${cls}" href="${esc(url || '#apply')}" ${url ? 'target="_blank" rel="noopener"' : 'data-missing="申込ページのURL"'} data-track="apply_click" data-where="${where}">お申込みはこちら（申込ページ）</a>`;
}

// LINE登録特典だったチェックリスト（PDF）を、LPから直接渡す（11/11 本人：本部LINEは加盟店が設定できないため）
function giftButton(ctx, key, { cls = 'btn btn-orange btn-lg', where = '', short = false } = {}) {
  if (!ctx.config.giftDir || !['owner', 'salon', 'restaurant', 'office'].includes(key)) return '';
  const href = `${ctx.base}${ctx.config.giftDir}/checklist-${key}.pdf`;
  // 11/11 本人：版ごとに分けているので、ボタンにも版の名前を出す
  const ed = { owner: '経営者・個人事業主版', salon: 'サロン版', restaurant: '飲食店版', office: '会社員・副業版' }[key];
  // トップの「版を選ぶ」ボタン：見出しで何のリストか分かるので、版の名前だけ大きく
  if (short) return `<a class="${cls}" href="${href}" target="_blank" rel="noopener" data-track="gift_open" data-where="${where}">${icon('check')}<span>${ed}<small class="btn-sub">無料・登録不要（PDF）</small></span></a>`;
  // 11/12 本人：何のチェックリストか、ボタンだけで分かるように
  return `<a class="${cls}" href="${href}" target="_blank" rel="noopener" data-track="gift_open" data-where="${where}">${icon('check')}<span>AIで自動化できる業務チェックリスト<small class="btn-sub">${ed}・無料・登録不要（PDF）</small></span></a>`;
}

// 最初の画面の動画（11/12 本人：アイキャッチに動画）。いまは全ページ共通の1本。対象別に作り直したら heroVideo を {top:…, salon:…} にする
function heroVideo(ctx) {
  const v = ctx.config.heroVideo;
  if (!v) return '';
  const poster = ctx.config.heroVideoPoster ? ` poster="${ctx.base}${ctx.config.heroVideoPoster}"` : '';
  return `<div class="hero-video"><video src="${ctx.base}${v}"${poster} autoplay muted loop playsinline preload="auto" aria-label="MIRAI CAMP 大阪梅田校の紹介動画（音声なし）"></video></div>`;
}

function talk(ctx, text, { side = 'left', small = false } = {}) {
  const img = ctx.config.repImage ? `${ctx.base}${ctx.config.repImage}` : `${ctx.base}assets/img/rep-placeholder.svg`;
  return `<div class="talk talk-${side}${small ? ' talk-sm' : ''}">
  <img class="talk-avatar" src="${img}" alt="大阪梅田校の校舎長（イラスト）" width="72" height="72" loading="lazy">
  <p class="bubble">${text}</p>
</div>`;
}

function sectionHead(title, { eyebrow = '', lead = '' } = {}) {
  return `<div class="sec-head">
  ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
  <h2>${title}</h2>
  ${lead ? `<p class="lead">${lead}</p>` : ''}
</div>`;
}

// ---------- レイアウト ----------

export function layout(ctx, { title, desc, body, pageKey, lineKey = 'top', noSticky = false }) {
  const { config, draft, base } = ctx;
  const noindex = ctx.noindex ?? draft; // 下書き・確認用は検索エンジンに載せない。計測タグも読み込まない
  const canonical = config.siteUrl ? `${config.siteUrl.replace(/\/$/, '')}/${ctx.path}` : '';
  if (!config.siteUrl) ctx.tracker.need('独自ドメインのURL（siteUrl）');
  // ページごとの画像（og-{page}.jpg）。特商法・プライバシーはトップの画像を使う
  const ogKey = ['top', 'owner', 'salon', 'restaurant', 'office', 'corporate'].includes(pageKey) ? pageKey : 'top';
  const og = config.ogImage ? `${(ctx.publicUrl || config.siteUrl || '').replace(/\/$/, '')}/${config.ogImage.replace('{page}', ogKey)}` : '';
  if (!config.ogImage) ctx.tracker.need('SNSでシェアしたときの画像（ogImage）');

  // 計測タグは公開用でだけ読み込む（--tags は手元での動作確認用）
  const tags = !noindex || ctx.withTags;
  // Googleタグ：googleTag（GTM-…）があれば、アナリティクスの管理画面が出すコードのとおりに読み込む（測定IDはこのタグの送り先として設定済み）。なければ測定ID（G-…）で直接読み込む
  const gt = config.analytics.googleTag;
  const ga = !tags ? '' : gt ? `<script async src="https://www.googletagmanager.com/gtm.js?id=${esc(gt)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());</script>` : config.analytics.ga4 ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(config.analytics.ga4)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${esc(config.analytics.ga4)}');</script>` : '';
  const px = tags && config.analytics.metaPixel ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${esc(config.analytics.metaPixel)}');fbq('track','PageView');</script>` : '';
  if (!config.analytics.ga4) ctx.tracker.need('Googleアナリティクスの測定ID（ga4）');
  if (!config.analytics.metaPixel) ctx.tracker.need('Metaピクセルの番号（metaPixel）');

  // 11/14 本人：上部メニューは優先度の高い順（左から）。そのページにある項目だけ出す
  const navLinks = [['curriculum', '学べること'], ['voices', '受講生の声'], ['makeables', '作れるもの'], ['price', '料金'], ['schedule', '日程・場所'], ['team', '校舎情報'], ['flow', '申し込みの流れ'], ['faq', 'よくある質問']]
    .filter(([id]) => body.includes(`id="${id}"`));
  const siteData = {
    page: pageKey,
    schedule: { openStart: config.schedule.openStart, openEnd: config.schedule.openEnd, afterOpenLabel: config.schedule.afterOpenLabel },
  };

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:site_name" content="${esc(config.siteName)}">
<meta property="og:locale" content="ja_JP">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
${og ? `<meta property="og:image" content="${esc(og)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#0b2d6b">
<link rel="icon" href="${base}assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Zen+Maru+Gothic:wght@700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}assets/css/style.css?v=${ASSET_V}">
${ga}
${px}
</head>
<body class="page-${pageKey}${draft ? ' is-draft' : ''}">
${draft ? '<div class="draft-banner">下書き｜点線の枠＝公開前に埋める項目</div>' : ''}
<a class="skip" href="#main">本文へ</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="${base}">
      <img src="${base}assets/img/logo.png" alt="" width="40" height="40">
      <span class="brand-text"><span class="brand-name">MIRAI CAMP<sup>®</sup></span><span class="brand-school">大阪梅田校</span></span>
    </a>
    ${navLinks.length ? `<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="header-nav" data-nav-toggle><span></span><span></span><span></span><span class="sr-only">メニュー</span></button>` : ''}
    <nav class="header-nav" id="header-nav" aria-label="ページ内" data-nav>
      ${navLinks.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('')}
    </nav>
    <div class="header-cta">${pageKey === 'corporate' ? `<a class="btn btn-orange btn-sm" href="#contact">お問い合わせ</a>` : lineButton(ctx, lineKey, { size: 'sm', label: 'LINEで相談', where: 'header' })}</div>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="container">
    <div class="footer-brand">
      <p class="footer-name">MIRAI CAMP<sup>®</sup> 大阪梅田校</p>
      <p>${esc(config.venue.address)}</p>
      <p>運営：${esc(config.company)}</p>
    </div>
    <nav class="footer-links" aria-label="サイト内">
      <a href="${base}owner/">経営者・個人事業主の方</a>
      <a href="${base}salon/">サロンオーナーの方</a>
      <a href="${base}restaurant/">飲食店オーナーの方</a>
      <a href="${base}office/">会社員の方</a>
      <a href="${base}corporate/">法人の方（社員研修）</a>
      <a href="${base}tokushoho/">特定商取引法に基づく表記</a>
      <a href="${base}privacy/">プライバシーポリシー</a>
    </nav>
    <p class="copy">© 2026 ${esc(config.company)}</p>
  </div>
</footer>
${noSticky || (ctx.preview && (pageKey === 'corporate' ? !config.corporateFormEmbedUrl : !(config.line[lineKey] || config.line.top))) ? '' : `<div class="sticky-cta" data-sticky>${pageKey === 'corporate' ? `<a class="btn btn-orange btn-lg" href="#contact">お問い合わせフォームへ</a>` : lineButton(ctx, lineKey, { size: 'lg', where: 'sticky' })}</div>`}
<script>window.__SITE=${JSON.stringify(siteData)};</script>
<script src="${base}assets/js/main.js?v=${ASSET_V}" defer></script>
</body>
</html>`;
}

// ---------- 受講生向けLP（4本共通のひな型） ----------

function hero(ctx, v) {
  const t = C.caseTotal;
  return `<section class="hero" id="top">
  <div class="container hero-grid${ctx.config.heroVideo ? ' has-video' : ''}">
    ${heroVideo(ctx)}
    <div class="hero-text">
      <p class="kicker">${v.kicker}</p>
      <p class="catch"><span>${v.catch}</span></p>
      <h1>${v.h1}</h1>
      <p class="sub">${v.sub}</p>
      <ul class="badges">
        <li>${icon('check')}AI未経験〜中級者</li>
        <li>${icon('people')}講師と対面</li>
        <li>${icon('calendar')}2日間で1本つくる</li>
      </ul>
      <p class="open-pill"><span class="pulse" aria-hidden="true"></span><span data-open-label>${ctx.config.schedule.openLabel}</span><span class="pill-sep">｜</span>大阪・梅田（中崎町）</p>
      <div class="cta-row">
        ${giftButton(ctx, v.key, { where: 'hero' })}
        ${lineButton(ctx, v.key, { where: 'hero' })}
        <a class="text-link" href="#price">料金・日程を見る ${icon('arrow')}</a>
      </div>
      <p class="cta-note">「${v.gift}」（PDF・3ページ）は、登録なしでその場で開けます。LINE登録だけでは、お申込みにはなりません。</p>
    </div>
    <div class="hero-visual">
      <div class="result-card">
        <p class="rc-label">校舎長の4店舗の業務（月あたり）</p>
        <div class="rc-row">
          <div class="rc-before"><span>手作業なら</span><strong>${t.before}</strong></div>
          <div class="rc-arrow" aria-hidden="true">${icon('arrowBig')}</div>
          <div class="rc-after"><span>AIを使って</span><strong>${t.after}</strong></div>
        </div>
        <p class="rc-note">${C.caseNote}</p>
      </div>
      ${talk(ctx, 'AIのおかげで、会社員をしながら4店舗を回せています。', { side: 'left' })}
    </div>
  </div>
  <div class="skyline" aria-hidden="true"><img src="${ctx.base}assets/img/umeda-skyline.svg" alt="" width="1440" height="200"></div>
</section>`;
}

function pains(ctx, v) {
  return `<section class="sec sec-pains" id="pains">
  <div class="container narrow">
    ${sectionHead(v.pains.title)}
    ${v.pains.people ? `<ul class="pain-people">${v.pains.people.map((p) => `<li><span class="pp-face">${p.img ? `<img src="${ctx.base}${p.img}" alt="" width="96" height="96" loading="lazy">` : ''}</span><div class="pp-body"><p class="pp-line">${p.line}</p><p class="pp-who">${p.who}</p></div></li>`).join('')}</ul>` : ''}
    <ul class="pain-list"${v.pains.people ? ' hidden' : ''}>
      ${v.pains.items.map((p) => `<li>${icon('check')}<span>${p}</span></li>`).join('\n      ')}
    </ul>
    <p class="pain-answer">${v.pains.answer}</p>
  </div>
</section>`;
}

function story(ctx, v) {
  // 本部の形では実例の後に置くので、数字を重ねない文にする（前の形は実例より前なので、前の文のまま）
  const s = v.layout === 'hq' ? C.story : { ...C.story, ...C.story.before };
  return `<section class="sec sec-story" id="story">
  <div class="container narrow">
    ${sectionHead(s.title, { eyebrow: '校舎長のこと' })}
    ${s.lead.map((p) => `<p class="body">${p}</p>`).join('\n    ')}
    ${v.sameNote ? `<p class="body note-box">${v.sameNote}</p>` : ''}
    <div class="talks">
      ${talk(ctx, C.story.talks[0], { side: 'left' })}
      ${talk(ctx, C.story.talks[1], { side: 'left' })}
    </div>
    ${C.story.selfStudy ? `<div class="self-study"><p class="ss-title">${C.story.selfStudy.title}</p><ul>${C.story.selfStudy.items.map((i) => `<li>${i}</li>`).join('')}</ul></div>` : ''}
    ${C.story.took ? `<div class="took"><p class="took-title">${icon('sparkle')}<span>${C.story.took.title}</span></p><p class="took-text">${C.story.took.text}</p><p class="took-note">${C.story.took.note}</p></div>` : ''}
    <div class="talks">
      ${C.story.talks.slice(2).map((s) => talk(ctx, s, { side: 'left' })).join('\n      ')}
    </div>
  </div>
</section>`;
}

function caseStudy(ctx, v) {
  const rows = v.caseOrder.map((k) => C.caseTasks[k]);
  const screens = ctx.config.screens || [];
  const ready = screens.filter((s) => s.file);
  if (ready.length < screens.length) ctx.tracker.need(`校舎長が作った画面のスクリーンショット（${screens.length - ready.length}枚）`);
  const screenHtml = ctx.draft
    ? screens.map((s) => s.file
      ? `<figure class="screen"><img src="${ctx.base}${s.file}" alt="${esc(s.caption)}" loading="lazy"><figcaption>${s.caption}</figcaption></figure>`
      : `<figure class="screen screen-ph" data-missing="画面のスクリーンショット"><div class="ph-box">ここに実際の画面<br>（数字・人名はぼかす）</div><figcaption>${s.caption}</figcaption></figure>`).join('')
    : ready.map((s) => `<figure class="screen"><a class="screen-thumb" href="${ctx.base}${s.file}" target="_blank" rel="noopener" data-track="screen_open" data-where="case"><img src="${ctx.base}${s.file}" alt="${esc(s.caption)}" loading="lazy"><span class="screen-zoom">タップで拡大</span></a><figcaption>${s.caption}</figcaption></figure>`).join('');
  return `<section class="sec sec-case" id="case">
  <div class="container">
    ${sectionHead('4店舗の業務が、<br class="sp-only">月30時間超から約5時間に', { eyebrow: '校舎長の実例', lead: '手作業でやれば毎月かかる時間と、AIで自動化した今の時間です（4店舗・月あたり）。' })}
    <div class="total-band">
      <div><span class="tb-label">手作業なら</span><span class="tb-num">${C.caseTotal.before}</span></div>
      <div class="tb-arrow" aria-hidden="true">${icon('arrowBig')}</div>
      <div><span class="tb-label">AIを使って</span><span class="tb-num tb-after">${C.caseTotal.after}</span></div>
      <div class="tb-rate">${C.caseTotal.rate}<small>減</small></div>
    </div>
    <div class="table-wrap">
      <table class="case-table">
        <thead><tr><th scope="col">作業</th><th scope="col">手作業</th><th scope="col">AI利用後</th></tr></thead>
        <tbody>
          ${rows.map((r) => `<tr><th scope="row">${r.name}</th><td>${r.before}</td><td class="after">${r.after}</td></tr>`).join('\n          ')}
          <tr class="other"><th scope="row">${C.caseOther.name}<small>${C.caseOther.detail}</small></th><td>${C.caseOther.before}</td><td class="after">${C.caseOther.after}</td></tr>
        </tbody>
      </table>
    </div>
    ${v.caseExtra ? `<div class="case-extra"><p class="ce-title">${icon('sparkle')}<span>${v.caseExtra.title}</span></p><ul>${v.caseExtra.items.map((t) => `<li>${t}</li>`).join('')}</ul><p class="ce-note">${v.caseExtra.note}</p></div>` : `<p class="name-only">${icon('sparkle')}<span>ほかにも、${C.caseNameOnly.join('・')}…もAIで回しています。</span></p>`}
    <p class="fine">${C.caseNote}</p>
    ${screenHtml ? `<div class="screens"><p class="screens-title">例：校舎長がAIで作って使っている画面</p><div class="screen-grid">${screenHtml}</div></div>` : ''}
    <p class="after-case">浮いた時間は、数字を見て次の手を考えることや、売上を伸ばす新しい施策づくりに回せます。その施策づくりも、AIと一緒に進められます。</p>
  </div>
</section>`;
}

function makeables(ctx, v) {
  return `<section class="sec sec-make" id="makeables">
  <div class="container">
    ${sectionHead(v.makeables.title, { lead: v.makeables.note })}
    <ul class="make-grid">
      ${v.makeables.items.map((m) => `<li class="make-card"><span class="make-icon">${icon(m.icon)}</span><h3>${m.title}</h3><p>${m.text}</p>${m.effect ? `<p class="make-effect">${m.effect}</p>` : ""}</li>`).join('\n      ')}
    </ul>
    ${v.beyond ? `<div class="beyond"><h3>${v.beyond.title}</h3><p>${v.beyond.text}</p></div>` : ''}
  </div>
</section>`;
}

function twoDays(ctx) {
  const d = C.twoDays;
  return `<section class="sec sec-days" id="two-days">
  <div class="container">
    ${sectionHead(d.title, { eyebrow: '2日間でやること', lead: d.lead })}
    <ol class="flow5">${d.flow.map((f, i) => `<li><span>${i + 1}</span>${f}</li>`).join('')}</ol>
    <div class="days">
      ${d.days.map((day) => `<article class="day">
        <header><span class="day-label">${day.label}</span><span class="day-time">${day.time}</span></header>
        <h3>${day.title}</h3>
        <ol>${day.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      </article>`).join('\n      ')}
    </div>
    <h3 class="sub-h">2日後に、手元に残るもの</h3>
    <ul class="remains">
      ${d.remains.map((r) => `<li><h4>${r.title}</h4><p>${r.text}</p></li>`).join('\n      ')}
    </ul>
  </div>
</section>`;
}

function selfStudy(ctx) {
  const s = C.selfStudy;
  return `<section class="sec sec-self" id="self-study">
  <div class="container narrow">
    ${sectionHead(s.title)}
    ${talk(ctx, s.talk, { small: true })}
    <p class="body">${s.excel}</p>
    <ol class="points">
      ${s.points.map((p, i) => `<li><span class="pt-num">${i + 1}</span><div><h3>${p.title}</h3><p>${p.text}</p></div></li>`).join('\n      ')}
    </ol>
  </div>
</section>`;
}

function voices(ctx, v) {
  return `<section class="sec sec-voices" id="voices">
  <div class="container">
    ${sectionHead(C.voices.title)}
    <div class="video-grid">
      ${v.voices.map((k) => {
        const vid = C.voices.videos[k];
        return `<figure class="video"><button class="yt" type="button" data-yt="${vid.id}" aria-label="動画を再生：${esc(vid.title)}"><img src="https://i.ytimg.com/vi/${vid.id}/maxresdefault.jpg" onerror="this.onerror=null;this.src=this.src.replace('maxresdefault','hqdefault')" alt="" loading="lazy" width="1280" height="720"><span class="yt-play" aria-hidden="true">${icon('play')}</span></button><figcaption>${vid.title}</figcaption></figure>`;
      }).join('\n      ')}
    </div>
    <p class="fine center">${C.voices.note}</p>
  </div>
</section>`;
}

function instructors(ctx) {
  // showInstructors が false のあいだは、講師の個別の掲載（名前・経歴のカード）を出さず、見出しと説明だけにする（公開の条件にもしない）
  const list = ctx.config.showInstructors === false ? [] : (ctx.config.instructors || []);
  const ok = list.filter((i) => i.consent && i.bio);
  if (ok.length < list.length) ctx.tracker.need(`講師の掲載同意と一言経歴（${list.length - ok.length}名）`);
  const show = ctx.draft ? list : ok;
  const cards = show.map((i) => {
    const ready = i.consent && i.bio;
    const img = i.image ? `${ctx.base}${i.image}` : `${ctx.base}assets/img/instructor-placeholder.svg`;
    return `<li class="inst${ready ? '' : ' inst-ph'}"${ready ? '' : ' data-missing="講師の同意・経歴"'}><img src="${img}" alt="${esc(i.name)}講師（イラスト）" width="96" height="96" loading="lazy"><h3>${esc(i.name)}<small>講師</small></h3><p class="inst-badge">本部の講師認定を取得</p><p>${ready ? esc(i.bio) : '（一言経歴を記入・掲載の同意を確認）'}</p></li>`;
  }).join('');
  return `<section class="sec sec-inst" id="instructors">
  <div class="container">
    ${sectionHead(C.instructorsSection.title, { lead: C.instructorsSection.lead })}
    ${cards ? `<ul class="inst-grid">${cards}</ul>` : ''}
  </div>
</section>`;
}

function price(ctx, v) {
  const p = ctx.config.price;
  if (!p.claudeProConfirmed) ctx.tracker.need('Claude Proの契約が受講に必須か（本部に確認）');
  return `<section class="sec sec-price" id="price">
  <div class="container">
    ${sectionHead('料金', { eyebrow: '料金と費用対効果' })}
    <div class="price-grid">
      <div class="price-main">
        <p class="pm-label">MIRAI CAMP 2日間講座</p>
        <p class="pm-num">150,000<span>円（税込）</span></p>
        <ul class="pm-list">
          <li><span>受講に必要なもの</span><strong>Claude Pro ${p.claudePro}</strong><small>AIツールの利用料です。講座の中で使います。</small></li>
          <li><span>受講後の月額サポート（任意）</span><strong>${p.support}</strong><small>加入しなくても講座は受けられます。</small></li>
        </ul>
        ${(() => { const a = applyLink(ctx, { cls: 'btn btn-orange btn-md', where: 'price' }); return a ? `<div class="pm-cta">${a}<p class="fine">日程を選んでお申込み・お支払いへ進みます。</p></div>` : '<div class="pm-cta"><p class="fine">お申込みページは準備中です。</p></div>'; })()}
      </div>
      <div class="calc" data-calc data-price="${p.courseYen}">
        <h3>${icon('calc')}あなたの場合で、計算してみる</h3>
        <label class="calc-field"><span>毎月くり返している業務の時間</span><span class="calc-input"><input type="number" inputmode="numeric" min="1" max="300" step="1" value="${v.calc.hours}" data-calc-hours aria-describedby="calc-hint-${v.key}">時間</span></label>
        <p class="calc-hint" id="calc-hint-${v.key}">${v.calc.hint}</p>
        <label class="calc-field"><span>あなたの1時間の価値（時給換算）</span><span class="calc-input"><input type="number" inputmode="numeric" min="100" max="100000" step="100" value="${v.calc.rate}" data-calc-rate>円</span></label>
        <div class="calc-out" aria-live="polite">
          <p>AIを使わないままだと、この業務に<br>年間 <strong data-out="yearly">-</strong> 円分の時間を使い続けます。</p>
          <p class="calc-key">校舎長と同じように${C.caseTotal.rate.replace('約', '')}減らせたら、<br>年間 <strong data-out="saved">-</strong> 円分の時間が浮きます。</p>
        </div>
        <p class="fine">入力した数字にもとづく仮の計算です。${C.caseTotal.rate.replace('約', '')}は校舎長の実例（4店舗の業務・月あたり、${C.caseTotal.before}→${C.caseTotal.after}）で、効果を約束するものではありません。受講料以外の費用（Claude Pro・月額サポートなど）は含みません。</p>
      </div>
    </div>
  </div>
</section>`;
}

function schedule(ctx, v) {
  const s = ctx.config.schedule;
  const ve = ctx.config.venue;
  const photos = ve.photos || [];
  if (!photos.length) ctx.tracker.addLater('教室の写真（11/21入居後。11/11 本人：先に公開して、写真はあとから入れる）');
  const map = `https://www.google.com/maps?q=${encodeURIComponent(ve.mapQuery)}&output=embed`;
  return `<section class="sec sec-schedule" id="schedule">
  <div class="container">
    ${sectionHead('日程と場所')}
    <div class="sched-grid">
      <div class="sched-card">
        <ul class="courses">
          ${s.courses.map((c) => `<li><span class="course-name">${c.name}</span><span>${c.detail}</span></li>`).join('\n          ')}
        </ul>
        ${v.scheduleNote ? `<p class="sched-note">${icon('calendar')}<span>${v.scheduleNote}</span></p>` : ''}
        <p class="cap">${icon('people')}${s.capacity}</p>
        <p class="body">${s.dateNote}</p>
        ${s.applyDeadline ? `<p class="body">${s.applyDeadline}</p>` : ''}
        ${ctx.config.applyUrl ? `<a class="btn btn-ghost btn-md" href="${esc(ctx.config.applyUrl)}" target="_blank" rel="noopener" data-track="apply_click" data-where="schedule">開催日程を見る（申込ページ）</a>` : lineButton(ctx, v.key, { size: 'md', label: 'LINEで日程を聞く', where: 'schedule' })}
        <h3 class="sub-h">持ち物</h3>
        <ul class="bring">
          <li>ノートパソコン（事前に動作確認をお願いします）</li>
          <li>ログインできる状態のGoogleアカウント</li>
          <li>Claude Pro（ご自身でご契約）</li>
        </ul>
        <p class="fine">スマートフォンだけでのご参加はできません。</p>
      </div>
      <div class="venue-card" id="venue">
        <h3>${icon('pin')}大阪梅田校の教室</h3>
        <p class="addr">${ve.address}</p>
        <ul class="access">${ve.access.map((a) => `<li>${a}</li>`).join('')}</ul>
        <div class="map"><iframe title="大阪梅田校の地図" src="${map}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
        <a class="text-link map-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ve.mapQuery)}" target="_blank" rel="noopener" data-track="map_open">Googleマップで開く ${icon('arrow')}</a>
        ${photos.length ? `<div class="venue-photos">${photos.map((p) => `<img src="${ctx.base}${p}" alt="教室の様子" loading="lazy">`).join('')}</div>` : (ctx.draft ? '<div class="ph-box" data-missing="教室の写真">教室の写真（11/21入居後に追加）</div>' : '')}
      </div>
    </div>
  </div>
</section>`;
}

function fit(ctx) {
  const f = C.fit;
  return `<section class="sec sec-fit" id="fit">
  <div class="container">
    ${sectionHead(f.title, { lead: f.lead })}
    <div class="fit-grid">
      <div class="fit-col fit-good"><h3>${icon('check')}向いている方</h3><ul>${f.good.map((g) => `<li>${g}</li>`).join('')}</ul></div>
      <div class="fit-col fit-not"><h3>${icon('pause')}今は向いていない方</h3><ul>${f.notNow.map((g) => `<li>${g}</li>`).join('')}</ul></div>
    </div>
  </div>
</section>`;
}

function supportSec(ctx) {
  const s = C.support;
  return `<section class="sec sec-support" id="support">
  <div class="container narrow">
    ${sectionHead(s.title, { eyebrow: '受講後のサポート', lead: s.lead })}
    <div class="support-card">
      <p class="sc-head">月額サポート<strong>${ctx.config.price.support}</strong><span class="tag">任意</span></p>
      <ul>${s.items.map((i) => `<li>${icon('check')}${i}</li>`).join('')}</ul>
      <p class="fine">${s.note}</p>
    </div>
  </div>
</section>`;
}

function corporateBox(ctx) {
  const b = C.corporateBox;
  return `<section class="sec sec-corpbox">
  <div class="container narrow">
    <a class="corp-box" href="${ctx.base}corporate/">
      <span class="corp-icon">${icon('building')}</span>
      <span class="corp-text"><strong>${b.title}</strong><span>${b.text}</span><small>${b.note}</small></span>
      <span class="corp-arrow">${icon('arrow')}</span>
    </a>
  </div>
</section>`;
}

function flowSec(ctx, v) {
  const f = C.flow;
  return `<section class="sec sec-flow" id="flow">
  <div class="container">
    ${sectionHead(f.title)}
    <ol class="steps">
      ${f.steps.map((s, i) => `<li><span class="st-num">STEP ${i + 1}</span><h3>${s.title}</h3><p>${s.text}</p></li>`).join('\n      ')}
    </ol>
    <ul class="flow-notes">${f.notes.map((n) => `<li>${n}</li>`).join('')}</ul>
  </div>
</section>`;
}

function faq(ctx, items) {
  return `<section class="sec sec-faq" id="faq">
  <div class="container narrow">
    ${sectionHead('よくある質問')}
    <div class="faq-list">
      ${items.map((f) => `<details><summary>${f.q}</summary><div class="faq-a">${f.a}</div></details>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

function finalCta(ctx, v) {
  return `<section class="final-cta" id="cta">
  <div class="container narrow center">
    <p class="catch catch-light"><span>まずは、当てはまる数を数えてみてな。</span></p>
    <h2>あなたの仕事で、AIで自動化できるのはどこか。</h2>
    <p class="body">まずは「${v.gift}」で、当てはまる仕事を数えてみてください（登録不要）。無料セミナーのご案内とご相談は、LINEからどうぞ。</p>
    <div class="cta-stack">
      ${giftButton(ctx, v.key, { where: 'final' })}
      ${lineButton(ctx, v.key, { where: 'final' })}
      ${applyLink(ctx, { cls: 'text-link light', where: 'final' })}
    </div>
    <p class="cta-note light">LINE登録だけでは、お申込みにはなりません。</p>
  </div>
  <div class="skyline skyline-bottom" aria-hidden="true"><img src="${ctx.base}assets/img/umeda-skyline-dark.svg" alt="" width="1440" height="200"></div>
</section>`;
}

// ---------- 本部LPの形（11/12 本人。まずサロン版。variant の layout: 'hq' で使う） ----------

// 最初の画面：はじめは動画だけを見せ、スクロールすると動画が背景になって、見出しが上に重なる（本人「まず動画単体で見せて、スライドすると背景になるように」）
// 動画の字幕は、スクロールで暗くかぶせることで見出しと重ならない
function hqHero(ctx, v) {
  const t = C.caseTotal;
  const c = ctx.config;
  // 11/14 本人：ページごとの動画（v.hero があればそちらを使う。サロン版から）
  const hv = v.hero || {};
  const wv = hv.video || c.heroVideo, tv = hv.videoTall || c.heroVideoTall;
  const wide = wv ? `${ctx.base}${wv}` : '';
  const tall = tv ? `${ctx.base}${tv}` : wide;
  return `<section class="hq-hero" id="top" data-hq-hero>
  <div class="hq-stage" aria-hidden="true">
    <video data-wide="${wide}" data-tall="${tall}" poster="${ctx.base}${hv.poster || c.heroVideoPoster || ''}" data-poster-tall="${ctx.base}${hv.posterTall || c.heroVideoTallPoster || ''}" autoplay muted loop playsinline preload="auto"></video>
    <div class="hq-shade" data-hq-shade></div>
    <p class="hq-scroll" data-hq-hint><span>スクロール</span>${icon('arrow')}</p>
  </div>
  <div class="hero hq-hero-body">
    <div class="container hero-grid">
      <div class="hero-text">
        <p class="kicker">${v.kicker ? `${v.kicker}｜` : ''}AI初心者〜中級者のための、2日間の対面スクール（大阪・梅田）</p>
        <p class="catch"><span>${v.catch}</span></p>
        <h1>${v.h1}</h1>
        <p class="sub">${v.sub}</p>
        <ul class="badges">
          ${(v.badges || [['check', '初心者〜中級者歓迎'], ['people', '対面で質問できる'], ['calendar', '2日間で実践'], ['check', '講師1人に受講生5名まで']]).map(([ic, t]) => `<li>${icon(ic)}${t}</li>`).join('\n          ')}
        </ul>
        ${v.formCta
          ? `<div class="cta-row">${formButton('hero')}</div>
        <p class="cta-note">ご相談・お見積りは無料です。5日以内に担当者からメールでご連絡します。</p>`
          : `<div class="cta-row">
          ${lineButton(ctx, v.key, { where: 'hero', label: LINE_LABEL })}
          ${giftButton(ctx, v.key, { where: 'hero' })}
          ${v.heroLink || ''}
        </div>
        ${LINE_GIFT_NOTE}
        <p class="cta-note">LINE登録だけでは、お申込みにはなりません。</p>`}
      </div>
      <div class="hero-visual">
        <div class="result-card">
          <p class="rc-label">校舎長の4店舗の業務（月あたり）</p>
          <div class="rc-row">
            <div class="rc-before"><span>手作業なら</span><strong>${t.before}</strong></div>
            <div class="rc-arrow" aria-hidden="true">${icon('arrowBig')}</div>
            <div class="rc-after"><span>AIを使って</span><strong>${t.after}</strong></div>
          </div>
          <p class="rc-note">${C.caseNote}</p>
        </div>
        ${talk(ctx, 'AIのおかげで、会社員をしながら4店舗を回せています。', { side: 'left' })}
      </div>
    </div>
  </div>
</section>`;
}

// 法人ページの申込口：問い合わせフォーム（ページ下の #contact）へ
function formButton(where) {
  return `<a class="btn btn-orange btn-lg" href="#contact" data-track="corp_form_jump" data-where="${where}">${icon('mail')}<span>お問い合わせ（無料）</span></a>`;
}

function lineCta(ctx, v, lead, where) {
  if (v.formCta) return `<div class="hq-cta">
    <p class="hq-cta-lead">${lead}</p>
    ${formButton(where)}
    <p class="cta-note">ご相談・お見積りは無料です。5日以内に担当者からメールでご連絡します。</p>
  </div>`;
  return `<div class="hq-cta">
    <p class="hq-cta-lead">${lead}</p>
    ${lineButton(ctx, v.key, { where, label: LINE_LABEL })}
    ${LINE_GIFT_NOTE}
    <p class="cta-note">LINEから簡単に申込めます。まずは話を聞くだけでもOK。LINE登録だけでは、お申込みにはなりません。</p>
  </div>`;
}

function hqReassure(ctx, v) {
  const r = v.reassure || C.hq.reassure;
  return `<section class="sec hq-reassure" id="message">
  <div class="container narrow center">
    ${sectionHead(r.title, { eyebrow: r.eyebrow })}
    ${r.lines.map((l) => `<p class="body">${l}</p>`).join('\n    ')}
    <p class="hq-strong">${r.strong}</p>
    ${lineCta(ctx, v, r.ctaLead, 'message')}
  </div>
</section>`;
}

function hqReasons(ctx) {
  const r = C.hq.reasons;
  return `<section class="sec hq-reasons" id="reasons">
  <div class="container">
    ${sectionHead(r.title, { eyebrow: r.eyebrow })}
    <ol class="reason-list">${r.items.map((it, i) => `<li><span class="reason-no">${i + 1}</span><h3>${it.title}</h3><p>${it.text}</p></li>`).join('')}</ol>
  </div>
</section>`;
}

function hqComparison(c = C.hq.comparison, { id = 'compare', neutral = false } = {}) {
  return `<section class="sec hq-compare" id="${id}">
  <div class="container narrow">
    ${sectionHead(c.title, { eyebrow: c.eyebrow, lead: c.lead })}
    <div class="table-wrap"><table class="cmp-table${neutral ? ' cmp-neutral' : ''}">
      <thead><tr><th scope="col">項目</th><th scope="col">${c.cols[0]}</th><th scope="col" class="ours">${c.cols[1]}</th></tr></thead>
      <tbody>${c.rows.map((r) => `<tr><th scope="row">${r[0]}</th><td>${r[1]}</td><td class="ours">${icon('check')}${r[2]}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="fine">${c.note}</p>
  </div>
</section>`;
}

function hqCurriculum() {
  const c = C.hq.curriculum;
  return `<section class="sec hq-curr" id="curriculum">
  <div class="container">
    ${c.motto ? `<p class="curr-motto">${c.motto}</p>` : ''}
    ${sectionHead(c.title, { eyebrow: c.eyebrow, lead: c.lead })}
    <ol class="hq-steps">${c.steps.map((s, i) => `<li><span class="hq-step-no">STEP ${String(i + 1).padStart(2, '0')}</span><span class="hq-tag">${s.tag}</span><h3>${s.title}</h3><p>${s.text}</p></li>`).join('')}</ol>
    <h3 class="sub-h center">${c.skillsTitle}</h3>
    <p class="lead center">${c.skillsLead}</p>
    <ul class="hq-skills">${c.skills.map((s) => `<li><span class="hq-skill-tag">${s.tag}</span><h4>${s.title}</h4><p>${s.text}</p></li>`).join('')}</ul>
  </div>
</section>`;
}

function hqTimetable() {
  const t = C.hq.timetable;
  return `<section class="sec hq-time" id="two-days">
  <div class="container">
    ${sectionHead(t.title, { eyebrow: t.eyebrow, lead: t.lead })}
    <div class="hq-days">${t.days.map((d) => `<article class="hq-day"><header><span class="day-label">${d.label}</span><h3>${d.title}</h3></header><ol>${d.rows.map((r) => `<li><time>${r[0]}</time><div><h4>${r[1]}</h4><p>${r[2]}</p></div></li>`).join('')}</ol></article>`).join('')}</div>
    <p class="fine center">${t.note}</p>
  </div>
</section>`;
}

function hqBeforeAfter(ctx, v) {
  const b = v.beforeAfter;
  if (!b) return '';
  const h = C.hq.baTitle;
  return `<section class="sec hq-ba" id="change">
  <div class="container">
    ${sectionHead(h.title, { eyebrow: h.eyebrow })}
    <div class="ba-grid">
      <div class="ba-card ba-before"><span class="ba-label">${b.before.label}</span><p class="ba-quote">${b.before.quote}</p><p>${b.before.text}</p></div>
      <div class="ba-arrow" aria-hidden="true">${icon('arrowBig')}<span>AIの基礎から、自分のアプリづくりまで</span></div>
      <div class="ba-card ba-after"><span class="ba-label">${b.after.label}</span><p class="ba-quote">${b.after.quote}</p><p>${b.after.text}</p></div>
    </div>
    <p class="fine center">${b.note}</p>
  </div>
</section>`;
}

function hqVoices(ctx, v) {
  const s = C.hq.voices;
  return `<section class="sec sec-voices" id="voices">
  <div class="container">
    ${sectionHead(s.title, { eyebrow: s.eyebrow, lead: v.voicesLead || s.lead })}
    <div class="video-grid">
      ${(v.voiceVideos || s.videos).map((vid) => `<figure class="video"><button class="yt" type="button" data-yt="${vid.id}" aria-label="動画を再生：${esc(vid.title)}"><img src="https://i.ytimg.com/vi/${vid.id}/maxresdefault.jpg" onerror="this.onerror=null;this.src=this.src.replace('maxresdefault','hqdefault')" alt="" loading="lazy" width="1280" height="720"><span class="yt-play" aria-hidden="true">${icon('play')}</span></button><figcaption>${vid.title}</figcaption></figure>`).join('\n      ')}
    </div>
    <p class="fine center">${s.note}</p>
    ${lineCta(ctx, v, v.voicesCtaLead || s.ctaLead, 'voices')}
  </div>
</section>`;
}

function hqFounder(ctx) {
  const f = C.hq.founder;
  return `<section class="sec hq-founder" id="founder">
  <div class="container narrow">
    ${sectionHead(f.title, { eyebrow: f.eyebrow, lead: f.lead })}
    <figure class="video video-tall"><button class="yt" type="button" data-yt="${f.youtubeId}" aria-label="入江さんのメッセージ動画を再生"><img src="${ctx.base}${f.poster}" alt="" loading="lazy" width="480" height="853"><span class="yt-play" aria-hidden="true">${icon('play')}</span></button><figcaption>約1分</figcaption></figure>
  </div>
</section>`;
}

function hqTeam(ctx) {
  const t = C.hq.team;
  return `<section class="sec hq-team" id="team">
  <div class="container">
    ${sectionHead(t.title, { eyebrow: t.eyebrow, lead: t.lead })}
    <ul class="team-grid">
      ${t.hq.map((m) => `<li class="team-card"><img src="${ctx.base}${m.img}" alt="${esc(m.name)}" width="240" height="240" loading="lazy"><p class="team-role">${m.role}</p><h3>${m.name}</h3><p class="team-org">${m.org}</p>${m.tags ? `<ul class="team-tags">${m.tags.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}<p>${m.text}</p></li>`).join('\n      ')}
      <li class="team-card team-local"><img src="${ctx.base}${ctx.config.repImage || 'assets/img/rep-placeholder.svg'}" alt="大阪梅田校の校舎長（イラスト）" width="240" height="240" loading="lazy"><p class="team-role">${t.local.role}</p><h3>${t.local.title}</h3>${t.local.tags ? `<ul class="team-tags">${t.local.tags.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}<p>${t.local.text}</p></li>
    </ul>
  </div>
</section>`;
}

function hqConditions(ctx, v) {
  const p = ctx.config.price;
  const s = ctx.config.schedule;
  const h = C.hq.conditions;
  // 11/12 本人「料金の表はもっと見やすく。本部のほうが見やすかった」→ 本部と同じ、項目｜受講条件の2列・中央ぞろえ・1行を短く。細かい条件は表の下の注記へ
  const rows = v.condRows || [
    ['受講料金', `<strong class="cond-price">${p.course}</strong><small>一括払い・クレジットカード</small>`],
    ['開催形式', '大阪梅田校の教室で対面・連続する2日間'],
    ['時間', '各日 10:00〜17:00'],
    ['開催日', '土日コース（土曜・日曜）<br>平日コース（月曜・火曜）<small>どちらも毎月開催</small>'],
    ['人数', '講師1人につき受講生5名までの少人数制'],
    ['持ち物', 'ご自身のノートパソコン'],
    ['ツールの費用', `Claude Pro（月20ドル程度）のご契約が必要<small>月20ドルは日本円で約3,000円（為替で変わります）。そのほかのツールは無料で使えます</small>`],
    ['講師のサポート', '講師が対面でそばにつき、その場で質問できます'],
    ['受講後のサポート', `任意の月額サポート（${p.support}）<small>加入しなくても講座は受けられます</small>`],
    ['申込期限', '開催前日の13:00まで'],
  ];
  const a = v.formCta ? '' : applyLink(ctx, { cls: 'btn btn-orange btn-md', where: 'price' });
  return `<section class="sec sec-price hq-cond" id="price">
  <div class="container">
    ${sectionHead(h.title, { eyebrow: h.eyebrow, lead: v.condLead || h.lead })}
    <div class="cond-wrap"><table class="cond-table">
      <thead><tr><th scope="col">項目</th><th scope="col" class="ours">${v.condHead || '大阪梅田校の受講条件'}</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><th scope="row">${r[0]}</th><td class="ours">${r[1]}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="fine cond-note">${v.condRows ? '※助成金は、社員の方の受講で要件を満たした場合に限ります（経営者・役員ご本人は対象外）。支給の判断は労働局が行います。' : '※スマートフォンだけでのご参加はできません。各回3名以上のお申込みで開催します。開催日は申込ページでご確認いただけます。'}</p>
    ${a ? `<div class="pm-cta center">${a}<p class="fine">日程を選んでお申込み・お支払いへ進みます。</p></div>` : ''}
    <div class="calc" data-calc data-price="${p.courseYen}">
      <h3>${icon('calc')}あなたの場合で、計算してみる</h3>
      <label class="calc-field"><span>毎月くり返している業務の時間</span><span class="calc-input"><input type="number" inputmode="numeric" min="1" max="300" step="1" value="${v.calc.hours}" data-calc-hours aria-describedby="calc-hint-${v.key}">時間</span></label>
      <p class="calc-hint" id="calc-hint-${v.key}">${v.calc.hint}</p>
      <label class="calc-field"><span>あなたの1時間の価値（時給換算）</span><span class="calc-input"><input type="number" inputmode="numeric" min="100" max="100000" step="100" value="${v.calc.rate}" data-calc-rate>円</span></label>
      <div class="calc-out" aria-live="polite">
        <p>AIを使わないままだと、この業務に<br>年間 <strong data-out="yearly">-</strong> 円分の時間を使い続けます。</p>
        <p class="calc-key">校舎長と同じように${C.caseTotal.rate.replace('約', '')}減らせたら、<br>年間 <strong data-out="saved">-</strong> 円分の時間が浮きます。</p>
      </div>
      <p class="fine">入力した数字にもとづく仮の計算です。${C.caseTotal.rate.replace('約', '')}は校舎長の実例（4店舗の業務・月あたり、${C.caseTotal.before}→${C.caseTotal.after}）で、効果を約束するものではありません。</p>
    </div>
  </div>
</section>`;
}

function hqUseCases(ctx, v) {
  const u = v.useCases;
  if (!u) return '';
  return `<section class="sec hq-use" id="use-cases">
  <div class="container narrow">
    ${sectionHead(u.title, { eyebrow: 'こんなときに役立ちます' })}
    <ul class="use-list">${u.items.map((i) => `<li>${icon('check')}<div><strong>${i.when}</strong><small>${i.case}</small></div></li>`).join('')}</ul>
    <p class="fine">${u.note}</p>
  </div>
</section>`;
}

function hqBriefing(ctx, v) {
  const b = C.hq.briefing;
  return `<section class="sec hq-brief" id="seminar">
  <div class="container narrow">
    ${sectionHead(b.title, { eyebrow: b.eyebrow, lead: b.lead })}
    <h3 class="sub-h">セミナーでわかること</h3>
    <ol class="brief-list">${b.items.map((x, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${x}</li>`).join('')}</ol>
    ${lineCta(ctx, v, '日時はLINEのメニューから選べます', 'seminar')}
  </div>
</section>`;
}

// LINE登録でもらえる「AI開発全体マップ」のカード（本部の素材。画面の画像は使わない＝11/18 本人 C-1）
function lineGiftCard(ctx, key) {
  return `<div class="gift-card gift-card-line">
      <p class="gift-tag">② LINE登録で、すぐ届く</p>
      <h2>AI開発全体マップ</h2>
      <p class="body">AIでアプリをつくる流れが、1枚でわかる地図です。2日間で学ぶ94の考え方を11の分類に分けて、つながりを1枚にまとめました。詰まったときに「今どこにいて、次に何を学べばいいか」を確かめられます。</p>
      ${lineButton(ctx, key, { where: 'gift', label: LINE_LABEL, quick: false })}
      <p class="fine">公式LINEに友だち追加すると、すぐに届きます（Webページで開きます）。無料セミナーの日程もお知らせします。</p>
    </div>`;
}

function hqGift(ctx, v) {
  if (!v.giftTitle) return '';
  const g = C.hq.gift;
  return `<section class="sec hq-gift" id="gift">
  <div class="container">
    ${sectionHead('無料プレゼントは2つ', { eyebrow: g.eyebrow })}
    <div class="gift-pair">
    <div class="gift-card">
      <p class="gift-tag">① このページで、すぐ（登録不要）</p>
      <h2>${v.giftTitle}</h2>
      <p class="body">${v.giftLead}</p>
      ${giftButton(ctx, v.key, { where: 'gift' })}
      <p class="fine">${g.lead2}</p>
    </div>
    ${v.formCta ? '' : lineGiftCard(ctx, v.key)}
    </div>
  </div>
</section>`;
}

function hqFirstStep(ctx, v) {
  const f = C.hq.firstStep;
  return `<section class="sec sec-flow" id="flow">
  <div class="container">
    ${sectionHead(f.title, { eyebrow: f.eyebrow })}
    <ol class="steps steps4">
      ${f.steps.map((s, i) => `<li><span class="st-num">手順 ${String(i + 1).padStart(2, '0')}</span><h3>${s.title}</h3><p>${s.text}</p></li>`).join('\n      ')}
    </ol>
    <p class="fine center">${f.note}</p>
  </div>
</section>`;
}

// 最後の呼びかけ（11/12 本人：本部LPの最後の表現・説明がよい → 本部の文のまま。「説明会」は梅田校の呼び方「無料セミナー」に）
function hqFinal(ctx, v) {
  const f = v.final || C.hq.final;
  if (v.formCta) return `<section class="sec hq-final" id="cta">
  <div class="container narrow center">
    ${sectionHead(f.title, { eyebrow: f.eyebrow })}
    ${f.lines.map((l) => `<p class="body">${l}</p>`).join('\n    ')}
    <ul class="hq-pills">${f.pills.map((p) => `<li>${p}</li>`).join('')}</ul>
    ${formButton('final')}
    <p class="cta-note">ご相談・お見積りは無料です。人数や時期が決まっていなくても大丈夫です。</p>
  </div>
</section>`;
  return `<section class="sec hq-final" id="cta">
  <div class="container narrow center">
    ${sectionHead(f.title, { eyebrow: f.eyebrow })}
    ${f.lines.map((l) => `<p class="body">${l}</p>`).join('\n    ')}
    <ul class="hq-pills">${f.pills.map((p) => `<li>${p}</li>`).join('')}</ul>
    ${lineButton(ctx, v.key, { where: 'final', label: LINE_LABEL })}
    ${LINE_GIFT_NOTE}
    <p class="cta-note">LINEから簡単に申込めます。まずは話を聞くだけでもOK。<br>LINE登録だけでは、お申込みにはなりません。</p>
    ${applyLink(ctx, { cls: 'text-link', where: 'final' })}
    ${ctx.config.soudan?.enabled ? `<div class="soudan-link"><p>個別に相談したい方へ｜オンライン30分・無料の個別相談会　<a href="${ctx.base}soudan/" data-track="soudan_click" data-where="final">相談会を予約する ›</a></p><p class="fine">講座のご案内は、聞きたい方にだけお伝えします。相談だけでも大丈夫です。</p></div>` : ''}
  </div>
</section>`;
}

function hqStudentPage(ctx, v) {
  const faqItems = v.faq.map((k) => C.faqPool[k]);
  const body = [
    hqHero(ctx, v),
    pains(ctx, v),
    // 11/14 本人：お悩み→大丈夫→3つの理由→校舎長のこと→校舎長の実例
    hqReassure(ctx, v),
    hqReasons(ctx),
    story(ctx, v),
    caseStudy(ctx, v),
    makeables(ctx, v),
    hqComparison(),
    hqCurriculum(),
    hqTimetable(),
    hqBeforeAfter(ctx, v),
    hqVoices(ctx, v),
    hqFounder(ctx),
    hqTeam(ctx),
    hqConditions(ctx, v),
    hqUseCases(ctx, v),
    schedule(ctx, v),
    corporateBox(ctx),
    faq(ctx, faqItems),
    hqBriefing(ctx, v),
    hqGift(ctx, v),
    hqFirstStep(ctx, v),
    hqFinal(ctx, v),
  ].join('\n');
  return layout(ctx, { title: v.metaTitle, desc: v.metaDesc, body, pageKey: v.key, lineKey: v.key });
}

export function studentPage(ctx, v) {
  if (v.layout === 'hq') return hqStudentPage(ctx, v);
  const faqItems = v.faq.map((k) => C.faqPool[k]);
  const body = [
    hero(ctx, v),
    pains(ctx, v),
    story(ctx, v),
    caseStudy(ctx, v),
    makeables(ctx, v),
    twoDays(ctx),
    selfStudy(ctx),
    ctx.config.showVoices === false ? '' : voices(ctx, v), // 受講生の声の動画（宿題：本部の許可が出たら config の showVoices を true に）
    instructors(ctx),
    price(ctx, v),
    schedule(ctx, v),
    fit(ctx),
    supportSec(ctx),
    corporateBox(ctx),
    flowSec(ctx, v),
    faq(ctx, faqItems),
    finalCta(ctx, v),
  ].join('\n');
  return layout(ctx, { title: v.metaTitle, desc: v.metaDesc, body, pageKey: v.key, lineKey: v.key });
}

// ---------- トップ（対象を選ぶ入口） ----------

// 対象を選ぶカード（トップ）
function chooseSec(ctx, variants, order) {
  return `<section class="sec sec-choose" id="choose">
  <div class="container">
    ${sectionHead('あなたに近いのは、どれですか？', { lead: '仕事に合わせて、作れるものの例や役立つ場面をまとめています。' })}
    <ul class="choose-grid">
      ${order.map((k) => {
        const v = variants[k];
        return `<li><a class="choose-card" href="${ctx.base}${k}/"><span class="cc-label">${v.label}</span><span class="cc-catch">${v.catch}</span><span class="cc-go">くわしく見る ${icon('arrow')}</span></a></li>`;
      }).join('\n      ')}
      <li><a class="choose-card cc-corp" href="${ctx.base}corporate/"><span class="cc-label">法人の方（社員研修）</span><span class="cc-catch">社員が自分で、業務をAIで自動化できる会社へ。</span><span class="cc-go">くわしく見る ${icon('arrow')}</span></a></li>
    </ul>
  </div>
</section>`;
}

// トップの無料プレゼント：4つの版から選ぶ
function hqGiftAll(ctx, variants, order) {
  const g = C.hq.gift;
  const btns = order.map((k) => giftButton(ctx, k, { cls: 'btn btn-orange btn-md', where: 'gift', short: true })).filter(Boolean);
  if (!btns.length) return '';
  return `<section class="sec hq-gift" id="gift">
  <div class="container">
    ${sectionHead('無料プレゼントは2つ', { eyebrow: g.eyebrow })}
    <div class="gift-pair">
    <div class="gift-card">
      <p class="gift-tag">① このページで、すぐ（登録不要）</p>
      <h2>AIで自動化・効率化できることリスト</h2>
      <p class="body">毎月くり返している業務に印をつけるだけで、2日間で作るテーマが見つかります。お仕事に近い版を選んでください。</p>
      <div class="gift-buttons">${btns.join('')}</div>
      <p class="fine">${g.lead2}</p>
    </div>
    ${lineGiftCard(ctx, 'top')}
    </div>
  </div>
</section>`;
}

// 11/12 本人：トップも本部LPの形に（対象を選ぶカードは、お悩みのすぐ後）
function hqTopPage(ctx, variants, order) {
  const v = {
    key: 'top',
    layout: 'hq',
    catch: '毎月の面倒な仕事、AIで自動化しよか。',
    h1: 'AI、気になっているだけで<br>終わっていませんか？',
    sub: 'たった2日間で、AIがわからない自分から、<br class="pc-only">AIで新しい可能性をつくる自分へ。',
    heroLink: `<a class="text-link" href="#choose">あなたに近いページを選ぶ ${icon('arrow')}</a>`,
    pains: {
      title: 'こんなお悩み、ありませんか？',
      people: C.hq.painPeople,
      items: [],
      answer: 'ひとつでも当てはまれば、MIRAI CAMPはそこから一緒に始めます。',
    },
    caseOrder: ['shift', 'pl', 'payroll', 'attendance', 'order'],
    calc: { hours: 15, rate: 2500, hint: '集計・締め・シフト・発注・報告書など、毎月くり返している作業の合計' },
    faq: ['pc', 'idea', 'what', 'time', 'selfstudy', 'company', 'bring', 'support', 'unfinished', 'size', 'deadline', 'pay'],
  };
  const body = [
    hqHero(ctx, v),
    pains(ctx, v),
    chooseSec(ctx, variants, order),
    hqReassure(ctx, v),
    hqReasons(ctx),
    story(ctx, v),
    caseStudy(ctx, v),
    hqComparison(),
    hqCurriculum(),
    hqTimetable(),
    hqVoices(ctx, v),
    hqFounder(ctx),
    hqTeam(ctx),
    hqConditions(ctx, v),
    schedule(ctx, { key: 'top' }),
    corporateBox(ctx),
    faq(ctx, v.faq.map((k) => C.faqPool[k])),
    hqBriefing(ctx, v),
    hqGiftAll(ctx, variants, order),
    hqFirstStep(ctx, v),
    hqFinal(ctx, v),
  ].join('\n');
  return layout(ctx, {
    title: '大阪・梅田のAI講座｜2日間で、自分の仕事をAIで自動化｜MIRAI CAMP® 大阪梅田校',
    desc: 'AIの基礎からアプリづくりまで、講師と対面で学ぶ2日間の講座。プログラミング未経験でも大丈夫です。大阪・梅田（中崎町）の教室で開催。',
    body,
    pageKey: 'top',
    lineKey: 'top',
  });
}

export function topPage(ctx, variants, order) {
  if (ctx.config.topLayout !== 'old') return hqTopPage(ctx, variants, order);
  const t = C.caseTotal;
  const body = `<section class="hero hero-top" id="top">
  <div class="container hero-grid${ctx.config.heroVideo ? ' has-video' : ''}">
    ${heroVideo(ctx)}
    <div class="hero-text">
      <p class="kicker">AI未経験〜中級者のための、2日間の少人数対面講座</p>
      <p class="catch"><span>毎月の面倒な仕事、AIで自動化しよか。</span></p>
      <h1>2日間で、自分の仕事を<br>AIで自動化する一歩を。</h1>
      <p class="sub">プログラミング未経験でも大丈夫。AIの基礎からアプリづくりまで、講師と対面で学ぶ講座です。大阪・梅田（中崎町）の教室で開催します。</p>
      <p class="open-pill"><span class="pulse" aria-hidden="true"></span><span data-open-label>${ctx.config.schedule.openLabel}</span><span class="pill-sep">｜</span>大阪・梅田（中崎町）</p>
    </div>
    <div class="hero-visual">
      <div class="result-card">
        <p class="rc-label">校舎長の4店舗の業務（月あたり）</p>
        <div class="rc-row">
          <div class="rc-before"><span>手作業なら</span><strong>${t.before}</strong></div>
          <div class="rc-arrow" aria-hidden="true">${icon('arrowBig')}</div>
          <div class="rc-after"><span>AIを使って</span><strong>${t.after}</strong></div>
        </div>
        <p class="rc-note">${C.caseNote}</p>
      </div>
    </div>
  </div>
  <div class="skyline" aria-hidden="true"><img src="${ctx.base}assets/img/umeda-skyline.svg" alt="" width="1440" height="200"></div>
</section>
<section class="sec sec-choose" id="choose">
  <div class="container">
    ${sectionHead('あなたに近いのは、どれですか？', { lead: '仕事に合わせて、作れるものの例や校舎長の実例をまとめています。' })}
    <ul class="choose-grid">
      ${order.map((k) => {
        const v = variants[k];
        return `<li><a class="choose-card" href="${ctx.base}${k}/"><span class="cc-label">${v.label}</span><span class="cc-catch">${v.catch}</span><span class="cc-go">くわしく見る ${icon('arrow')}</span></a></li>`;
      }).join('\n      ')}
      <li><a class="choose-card cc-corp" href="${ctx.base}corporate/"><span class="cc-label">法人の方（社員研修）</span><span class="cc-catch">社員が自分で、業務をAIで自動化できる会社へ。</span><span class="cc-go">くわしく見る ${icon('arrow')}</span></a></li>
    </ul>
    <div class="center top-line">${lineButton(ctx, 'top', { size: 'md', label: 'まずはLINEで相談する', where: 'top' })}</div>
  </div>
</section>
${schedule(ctx, { key: 'top' })}`;
  return layout(ctx, {
    title: '大阪・梅田のAI講座｜2日間で、自分の仕事をAIで自動化｜MIRAI CAMP® 大阪梅田校',
    desc: 'AIの基礎からアプリづくりまで、講師と対面で学ぶ2日間の講座。プログラミング未経験でも大丈夫です。大阪・梅田（中崎町）の教室で開催。',
    body,
    pageKey: 'top',
    lineKey: 'top',
  });
}

// ---------- 法人向けLP ----------

// 11/12 本人：法人ページも本部LPの流れで、法人向けにアレンジ（窓口はLINEではなく問い合わせフォーム）
function hqCorporatePage(ctx, c) {
  const formUrl = ctx.config.corporateFormEmbedUrl;
  if (!formUrl) ctx.tracker.need('法人の問い合わせフォーム（GoogleフォームのURL）');
  const body = [
    hqHero(ctx, c),
    pains(ctx, c),
    story(ctx, c),
    caseStudy(ctx, c),
    hqReassure(ctx, c),
    makeables(ctx, c),
    `<section class="sec sec-make hq-points" id="points">
  <div class="container">
    ${sectionHead(c.points.title, { eyebrow: '社員研修としての特長' })}
    <ul class="make-grid make-grid-3">${c.points.items.map((p, i) => `<li class="make-card"><span class="make-icon num">${i + 1}</span><h3>${p.title}</h3><p>${p.text}</p></li>`).join('')}</ul>
  </div>
</section>`,
    c.planDiff ? hqComparison(c.planDiff, { id: 'plan', neutral: true }) : '',
    hqComparison(c.comparison),
    hqCurriculum(),
    hqTimetable(),
    hqBeforeAfter(ctx, c),
    hqVoices(ctx, c),
    hqFounder(ctx),
    hqTeam(ctx),
    `<section class="sec sec-subsidy" id="subsidy">
  <div class="container narrow">
    ${sectionHead(c.subsidy.title, { eyebrow: '助成金', lead: c.subsidy.lead })}
    ${c.subsidy.table ? `<h3 class="sub-h center">${c.subsidy.tableHead}</h3>
    <table class="kv-table subsidy-table"><tbody>${c.subsidy.table.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>${c.subsidy.tableNote ? `<p class="fine subsidy-note">${c.subsidy.tableNote}</p>` : ''}` : ''}
    <ul class="subsidy-list">${c.subsidy.items.map((s) => `<li>${s}</li>`).join('')}</ul>
  </div>
</section>`,
    hqConditions(ctx, c),
    hqUseCases(ctx, c),
    faq(ctx, c.faq),
    `<section class="sec sec-flow" id="flow">
  <div class="container">
    ${sectionHead(c.steps.title, { eyebrow: 'お問い合わせのあとの流れ' })}
    <ol class="steps steps-${c.steps.items.length}">${c.steps.items.map((s, i) => `<li><span class="st-num">手順 ${String(i + 1).padStart(2, '0')}</span><h3>${s.title}</h3><p>${s.text}</p></li>`).join('')}</ol>
  </div>
</section>`,
    hqFinal(ctx, c),
    `<section class="sec sec-contact" id="contact">
  <div class="container narrow">
    ${sectionHead(c.formTitle, { lead: c.formLead })}
    ${formUrl
      ? `<div class="form-embed"><iframe src="${esc(formUrl)}" title="法人のお問い合わせフォーム" loading="lazy"></iframe></div>`
      : ctx.preview
        ? '<p class="fine center">お問い合わせフォームは準備中です。</p>'
        : '<div class="ph-box ph-form" data-missing="問い合わせフォーム">ここに問い合わせフォーム（Googleフォーム）を埋め込みます</div>'}
  </div>
</section>`,
  ].join('\n');
  return layout(ctx, { title: c.metaTitle, desc: c.metaDesc, body, pageKey: 'corporate', lineKey: 'corporate' });
}

export function corporatePage(ctx, c) {
  if (c.layout === 'hq') return hqCorporatePage(ctx, c);
  const formUrl = ctx.config.corporateFormEmbedUrl;
  if (!formUrl) ctx.tracker.need('法人の問い合わせフォーム（GoogleフォームのURL）');
  const t = C.caseTotal;
  const body = `<section class="hero hero-corp" id="top">
  <div class="container hero-grid${ctx.config.heroVideo ? ' has-video' : ''}">
    ${heroVideo(ctx)}
    <div class="hero-text">
      <p class="kicker">${c.kicker}</p>
      <p class="catch"><span>${c.catch}</span></p>
      <h1>${c.h1}</h1>
      <p class="sub">${c.sub}</p>
      <ul class="badges">
        <li>${icon('people')}対面・少人数</li>
        <li>${icon('calendar')}2日間</li>
        <li>${icon('yen')}助成金のご相談可</li>
      </ul>
      <div class="cta-row"><a class="btn btn-orange btn-lg" href="#contact" data-track="corp_form_jump" data-where="hero">${icon('mail')}<span>お問い合わせ（無料）</span></a></div>
    </div>
    <div class="hero-visual">
      <div class="result-card">
        <p class="rc-label">校舎長の4店舗の業務（月あたり）</p>
        <div class="rc-row">
          <div class="rc-before"><span>手作業なら</span><strong>${t.before}</strong></div>
          <div class="rc-arrow" aria-hidden="true">${icon('arrowBig')}</div>
          <div class="rc-after"><span>AIを使って</span><strong>${t.after}</strong></div>
        </div>
        <p class="rc-note">${C.caseNote}</p>
      </div>
    </div>
  </div>
  <div class="skyline" aria-hidden="true"><img src="${ctx.base}assets/img/umeda-skyline.svg" alt="" width="1440" height="200"></div>
</section>
<section class="sec sec-pains">
  <div class="container narrow">
    ${sectionHead(c.issues.title)}
    <ul class="pain-list">${c.issues.items.map((p) => `<li>${icon('check')}<span>${p}</span></li>`).join('')}</ul>
  </div>
</section>
<section class="sec sec-make">
  <div class="container">
    ${sectionHead(c.points.title)}
    <ul class="make-grid make-grid-3">${c.points.items.map((p, i) => `<li class="make-card"><span class="make-icon num">${i + 1}</span><h3>${p.title}</h3><p>${p.text}</p></li>`).join('')}</ul>
  </div>
</section>
${twoDays(ctx)}
<section class="sec sec-subsidy" id="subsidy">
  <div class="container narrow">
    ${sectionHead(c.subsidy.title, { lead: c.subsidy.lead })}
    <ul class="subsidy-list">${c.subsidy.items.map((s) => `<li>${s}</li>`).join('')}</ul>
  </div>
</section>
<section class="sec sec-style">
  <div class="container narrow">
    ${sectionHead(c.style.title)}
    <table class="kv-table"><tbody>${c.style.rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody></table>
  </div>
</section>
<section class="sec sec-flow">
  <div class="container">
    ${sectionHead(c.steps.title)}
    <ol class="steps steps-5">${c.steps.items.map((s, i) => `<li><span class="st-num">STEP ${i + 1}</span><h3>${s.title}</h3><p>${s.text}</p></li>`).join('')}</ol>
  </div>
</section>
${faq(ctx, c.faq)}
<section class="sec sec-contact" id="contact">
  <div class="container narrow">
    ${sectionHead(c.formTitle, { lead: c.formLead })}
    ${formUrl
      ? `<div class="form-embed"><iframe src="${esc(formUrl)}" title="法人のお問い合わせフォーム" loading="lazy"></iframe></div>`
      : ctx.preview
        ? '<p class="fine center">お問い合わせフォームは準備中です。</p>'
        : '<div class="ph-box ph-form" data-missing="問い合わせフォーム">ここに問い合わせフォーム（Googleフォーム）を埋め込みます</div>'}
  </div>
</section>`;
  return layout(ctx, { title: c.metaTitle, desc: c.metaDesc, body, pageKey: 'corporate', lineKey: 'corporate' });
}

// ---------- 特商法・プライバシー ----------

export function tokushohoPage(ctx) {
  const t = ctx.config.tokushoho;
  const p = ctx.config.price;
  const mail = (a) => `<a href="mailto:${esc(a)}">${esc(a)}</a>`;
  // 講座の契約の相手は加盟店（株式会社GHD）。11/11 本人「契約は株式会社GHD」。申込と決済の受付だけ、本部の申込ページを使う
  const rows = [
    ['販売事業者', t.seller],
    ['運営統括責任者', t.representative],
    ['所在地', t.address],
    ['電話番号', t.phone],
    ['メールアドレス（苦情・相談の窓口）', mail(t.email)],
    ['販売するサービス', t.service],
    ['販売価格', `MIRAI CAMP 2日間講座：${p.course.replace('（税込）', '（税込・一括払い）')}`],
    ['商品代金以外の必要料金', t.extraCosts],
    ['お支払い方法', t.payment],
    ['お支払い時期', t.paymentTiming],
    ['サービスの提供時期', t.delivery],
    ['申込期間・人数', t.period],
    ['クーリング・オフ', t.coolingOff.replace('{email}', mail(t.email))],
    ['中途解約・返金', t.refund],
    ['受講後の月額サポート', `任意。${p.support}。オンライン講座が見放題になるなどの内容が含まれます。加入しなくても2日間の講座は受けられます。`],
    ['特記事項', `<ul class="legal-notes">${t.notes.map((n) => `<li>${n}</li>`).join('')}</ul>`],
  ];
  for (const [k, v] of rows) if (String(v).includes('【要確認')) ctx.tracker.need(`特商法表記：${k}`);
  // 確認用：まだ決まっていない項目は「準備中」と出す（【要確認：…】のメモは見せない）
  if (ctx.preview) for (const r of rows) r[1] = String(r[1]).replace(/【要確認[^】]*】/g, '準備中');
  const body = `<section class="sec legal">
  <div class="container narrow">
    <h1>特定商取引法に基づく表記</h1>
    <table class="kv-table"><tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td${String(v).includes('【要確認') ? ' data-missing="特商法の項目"' : ''}>${v}</td></tr>`).join('')}</tbody></table>
    <p class="fine">お申込みとお支払いは、MIRAI CAMP本部の申込ページ（決済の仕組み）で受け付けます。</p>
  </div>
</section>`;
  return layout(ctx, { title: '特定商取引法に基づく表記｜MIRAI CAMP® 大阪梅田校', desc: 'MIRAI CAMP® 大阪梅田校の特定商取引法に基づく表記です。', body, pageKey: 'legal', noSticky: true });
}

export function privacyPage(ctx) {
  const c = ctx.config;
  const body = `<section class="sec legal">
  <div class="container narrow">
    <h1>プライバシーポリシー</h1>
    <p class="body">${esc(c.company)}（MIRAI CAMP® 大阪梅田校。以下「当校」）は、お客様の個人情報を次のとおり取り扱います。</p>
    <h2>1. 取得する情報</h2>
    <p class="body">お名前、連絡先（メールアドレス・電話番号・LINEの表示名など）、会社名、ご相談の内容、お申込みに必要な情報を、LINE公式アカウント・問い合わせフォーム・申込ページを通じて取得します。</p>
    <h2>2. 利用の目的</h2>
    <ul class="plain">
      <li>無料セミナー・講座のご案内と、お問い合わせへの回答</li>
      <li>講座の実施と、受講後のご連絡</li>
      <li>サービスの改善と、広告の効果の測定</li>
    </ul>
    <h2>3. 第三者への提供</h2>
    <p class="body">法令に基づく場合を除き、ご本人の同意なく第三者に提供しません。ただし、講座の申込・決済・受講者の管理はMIRAI CAMP本部のシステムで行うため、その範囲でMIRAI CAMP本部と情報を共有します。</p>
    <h2>4. アクセス解析と広告の計測</h2>
    <p class="body">当サイトでは、利用状況の把握と広告の効果の測定のため、Googleアナリティクスと、Meta社（Facebook・Instagram）の計測タグを使用することがあります。これらはCookieなどを使って、個人を特定しない形で情報を集めます。ブラウザの設定でCookieを無効にすることもできます。</p>
    <h2>5. 開示・訂正・削除のご請求</h2>
    <p class="body">ご本人からの開示・訂正・利用停止・削除のご請求には、ご本人であることを確認したうえで対応します。お問い合わせはLINE公式アカウント、または特定商取引法に基づく表記に記載の連絡先からどうぞ。</p>
    <h2>6. 改定</h2>
    <p class="body">このポリシーは、必要に応じて改定することがあります。</p>
    <p class="body">制定：2026年11月</p>
  </div>
</section>`;
  return layout(ctx, { title: 'プライバシーポリシー｜MIRAI CAMP® 大阪梅田校', desc: 'MIRAI CAMP® 大阪梅田校のプライバシーポリシーです。', body, pageKey: 'legal', noSticky: true });
}
