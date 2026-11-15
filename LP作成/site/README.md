# MIRAI CAMP® 大阪梅田校 LP（サイト一式）

対象別のLP4本＋法人向け＋トップ（入口）＋特商法・プライバシーの計8ページを、共通のひな型から書き出す。
要件は `../要件定義_梅田校LP.md`、作業時間の数字は `../代表の事例_作業時間の測り直し_2026-11-08.md`。

## ページ

| URL | 中身 |
|---|---|
| `/` | トップ（対象を選ぶ入口・日程と場所） |
| `/owner/` | 経営者・個人事業主の方 |
| `/salon/` | サロンオーナーの方 |
| `/restaurant/` | 飲食店オーナーの方 |
| `/office/` | 会社員の方 |
| `/corporate/` | 法人の方（社員研修）。問い合わせフォームつき |
| `/tokushoho/` | 特定商取引法に基づく表記 |
| `/privacy/` | プライバシーポリシー |

## フォルダ

| 場所 | 中身 |
|---|---|
| `src/config.json` | **設定はここだけ**：LINEのURL（LPごと）、申込ページのURL、ドメイン、計測ID、開校日・コース、住所、料金、講師、画像、特商法の項目 |
| `src/content/common.mjs` | 4本で共通の文章（代表の話・実例の数字・2日間・独学・FAQなど） |
| `src/content/variants.mjs` | 対象別に差し替える文章（最初の画面の言葉・お悩み・作れるもの・計算ツールの初期値・FAQの順番） |
| `src/content/corporate.mjs` | 法人向けLPの文章 |
| `src/templates.mjs` | ページの組み立て |
| `src/assets/` | CSS・JavaScript・画像（梅田の街並み・仮の代表イラストなど） |
| `build.mjs` | 書き出し。`dist/` にできる |
| `serve.mjs` | 確認用のサーバー（http://localhost:4173/） |
| `deploy.mjs` | 書き出して、GitHub Pagesに送る（確認用／公開用） |
| `og.mjs` | SNS・LINEでURLを送ったときに出る画像（OGP画像）を、ページごとに作る → `src/assets/img/og/` |
| `tools/check-tags.mjs` | 計測タグ（Googleアナリティクス・Metaピクセル）が動いているかを確かめる。手元は `node build.mjs --preview --tags` のあと、公開後は本番のURLを渡す |
| `tools/headless.mjs` | Edgeを画面なしで動かす道具（`og.mjs` と特典のPDFで使う） |

## よく使う操作

```bash
node build.mjs
```
下書きを書き出す。検索エンジンには載らない設定で、未設定の項目は点線の枠と「未設定：◯◯」で表示される。最後に「公開前に埋める項目」の一覧が出る。

```bash
node serve.mjs
```
http://localhost:4173/ で確認する。

```bash
node build.mjs --preview --url=https://（置き場所のURL）
```
確認用を書き出す。検索エンジンには載らない設定のまま、未設定の項目は点線ではなく「準備中」にするか出さない（公式LINEのボタンは「準備中」、お申込みボタンは出さない、画面写真・講師・教室写真は、そろったものだけ出す）。本部の承諾をもらう前に、ネット上で見てもらうため。`--url` は、SNSでシェアしたときの画像の住所に使う。

```bash
node build.mjs --release
```
公開用を書き出す。**未設定の項目や「【要確認】」が1つでも残っていると止まる**（雛形のまま公開しないため）。

## 直し方

- **開校日・コース**：`config.json` の `schedule`。開校日（`openEnd`）を過ぎると、最初の画面の表示は自動で「毎月開催中｜土日コース・平日コース」に切り替わる
- **LINEのURL**：`config.json` の `line`。LPごとに計測用の友だち追加URLを入れる（`top`・`owner`・`salon`・`office`・`restaurant`・`corporate`）
- **代表のイラスト**：画像を `src/assets/img/` に置き、`config.json` の `repImage` に `assets/img/ファイル名` を書く。空なら仮の絵が出る
- **代表が作った画面**：同じく `screens[].file`。公開用では、ファイルがある画面だけ表示される
- **講師**：`instructors[]`。`consent: true` と `bio`（一言経歴）がそろった講師だけ公開用に表示される
- **教室の写真**：`venue.photos` に画像のパスを並べる
- **OGP画像**：見出しや関西弁のひとことを変えたら `node og.mjs` で作り直す（文字は各LPの最初の画面と同じ。開校日と数字は入れていない）
- **LINE登録特典のPDF**：`../特典/` で書き出したPDFが、`dist/（giftDir）/checklist-◯◯.pdf` にコピーされる。LPからはリンクせず、LINEでだけURLを送る。`giftDir`（今は `gift-outhlply`）は、送り始めたら変えない
- **作業時間の数字**：`common.mjs` の `caseTasks`・`caseOther`・`caseTotal`
- **受講生の声（動画）**：`config.json` の `showVoices`。本部の許可が出るまでは `false`（出さない）

## 公開（GitHub Pages ＋ 独自ドメイン）

詳しい手順は `../公開手順_GitHubPagesと独自ドメイン.md`。

**いま**：確認用を https://s-takashimada-bot.github.io/umeda-lp/ に公開している（GitHub `s-takashimada-bot/umeda-lp`）。直したら次の1行で送れる。

```bash
node deploy.mjs
```
書き出し（確認用）→ OneDriveの外の `C:\Users\s-tak\umeda-lp-public` の中身を入れ替え → GitHubに送る。公開用は `node deploy.mjs --release`（未設定が残っていると止まる）。送り先は `config.json` の `publish`。

独自ドメインを付けるとき：

1. 独自ドメインを取得し、`config.json` の `siteUrl` に `https://ドメイン` を書く
2. `node build.mjs --release` が通るまで設定を埋める
3. `dist/` の中身をGitHubのリポジトリ（OneDriveの外に置く）に入れて、GitHub Pagesで公開する（`CNAME` は自動で作られる）
4. ドメインのDNSをGitHub Pagesに向ける

公開の前に、本部の事前承諾が要る（加盟契約 第11条2・3項・第39条）。
