# MIRAI CAMP® 大阪梅田校 LP（元のコード）

大阪梅田校のLP（ランディングページ）の元のコードです。

- **確認用のページ**：https://miraicamp-osaka-umeda.jp （本公開までは検索エンジンに載らない設定です）
- **書き出し済みのページ（公開用）**：https://github.com/s-takashimada-bot/umeda-lp （GitHub Pages で表示）

## ページ

| URL | 中身 |
|---|---|
| `/` | トップ（対象を選ぶ入口・日程と場所） |
| `/owner/` | 経営者・個人事業主の方 |
| `/salon/` | サロンオーナーの方 |
| `/restaurant/` | 飲食店オーナーの方 |
| `/office/` | 会社員・副業の方 |
| `/corporate/` | 法人の方（社員研修・法人プラン） |
| `/soudan/` | 個別相談会（オンライン30分・無料）の予約 |
| `/tokushoho/` | 特定商取引法に基づく表記 |
| `/privacy/` | プライバシーポリシー |

## フォルダ

| 場所 | 中身 |
|---|---|
| `LP作成/site/` | LP本体。文章は `src/content/`、設定は `src/config.json`、組み立ては `src/templates.mjs`、画像・動画は `src/assets/` |
| `LP作成/特典/` | LINE登録の特典「AIで自動化・効率化できることリスト」（4種のPDF）と、その組み立て |
| `SNS/公式Line/個別相談会_予約/page/` | 個別相談会の予約ページ（`/soudan/` に置かれる） |

## 動かし方（Node.js 18以上）

```bash
cd LP作成/site
node build.mjs --preview   # dist/ に書き出し（確認用：検索エンジンに載らない設定）
node serve.mjs             # http://localhost:4173/ で表示
```

外部のライブラリは使っていません（`npm install` は不要です）。
