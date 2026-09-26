---
name: run-costume-design2
description: costume-design2(ノードグラフで3Dコスチュームをデザインするブラウザアプリ)を起動し、ヘッドレスChromiumで実際に操作してスクリーンショットを撮る。UI/3Dの変更を確認したい、コンソールエラーが無いか確認したい、数値入力欄/カラーピッカー操作やシーン描画を検証したいときに使う。「アプリを起動して」「動作確認して」「スクリーンショット撮って」のような依頼で使用する。
---

# costume-design2 を実行・操作する

このアプリはブラウザで動く純クライアントサイドの Vite + React アプリ(バックエンド無し)。
実行には `.claude/skills/run-costume-design2/driver.mjs` を使う — dev サーバーの起動から
ヘッドレスChromiumでの操作・スクリーンショット撮影まで一括で行う。

以下のパスはすべてプロジェクトルート(`costume-design2/`)からの相対パス。

## 前提条件

- Node.js / npm(プロジェクト本体のビルドに必要、`npm run build` 等で既に使用)
- Chromium 実行ファイルが `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome` に存在すること。
  無い場合は取得する(ドライバ用の依存を先にインストールしてから):
  ```bash
  cd .claude/skills/run-costume-design2 && npm install
  npx playwright-core install chromium
  ```
  (`npx playwright-core install chromium` がサブコマンドとして存在することは確認済み。実際の
  ダウンロードは今回未検証 — このコンテナには既にキャッシュ済みだったため。)

## セットアップ(初回のみ)

ドライバは `playwright-core` に依存するが、これはこのスキル専用であり、プロジェクト本体の
`package.json` には追加しない。

```bash
cd .claude/skills/run-costume-design2
npm install
```

## 実行(エージェント向けの本経路)

```bash
node .claude/skills/run-costume-design2/driver.mjs
```

やること:
1. `localhost:5173` が応答していなければ `npm run dev` をプロジェクトルートで自動起動し、
   準備完了までポーリングで待つ(既に起動済みなら何もしない)。
2. ヘッドレスChromiumで開き、`.react-flow__node[data-id="skirtGroup"]` と `canvas` の描画を待つ。
3. 初期状態のスクリーンショットを撮る。
4. `OrbitControls` でカメラをドラッグ操作し、再描画されることを確認するスクリーンショットを撮る
   (`frameloop="demand"` でもカメラ操作時に再描画されるかの検証を兼ねる)。
5. `skirtGroup` のタイトル行右上の「→」(グループの中に入る)ボタンを押して中に入り(ガーメント固有の生パラメータは
   `<name>GroupNode.ts` の `internalNodes` に埋め込まれているため、中に入らないと操作できない
   — `src/nodes/CLAUDE.md` の「グループノード」節参照)、`scale`(numberMultiplyノード)の Value 入力欄
   (未接続の数値入力ソケットの欄)に高頻度のinputイベントを連続発火させ(連続入力の再現)、ジオメトリが
   追従して変化した後のスクリーンショットを撮る。
6. トップレベルへ戻り、`skirtGroup` カードの未接続の Color 入力欄の色を変更して、
   ガーメントの色が変わった後のスクリーンショットを撮る(`Group Input` 上では色のデフォルト値は編集できない)。
7. コンソールエラー/ページエラーを収集し、1件でもあれば非ゼロ終了。
8. このスクリプト自身が起動した dev サーバーのみ停止する(元から起動していたものは触らない)。

スクリーンショットは `.claude/skills/run-costume-design2/screenshots/` に出力される
(`01_initial.png` 〜 `04_after_color_change.png`)。**撮影して終わりではなく、実際に画像を見て
判断すること** — キャラクターとガーメントが表示されているか、数値入力欄の操作後にガーメント形状が
変化しているか、色変更後に色が変わっているかを目視確認する。

終了コード0かつ「OK: コンソールエラーなし」であれば成功。それ以外(NG行が出力される、または
非ゼロ終了)は失敗として扱う。

## ノードカードの高さの確認

カードの見た目(`src/editor/nodeEditor.css` や `src/editor/nodeComponents/*.tsx`)を変えたら、
Arrange 用の高さ見積もり(`src/nodes/autoLayout.ts` の `estimateNodeHeight()`)が実機とずれていないかを確認する:

```bash
node .claude/skills/run-costume-design2/check-card-heights.mjs
```

レジストリに登録された全ノードタイプ(と、`groupInput` のソケット数・配線の有無など状態で高さが変わるケース)を
1つずつ置いて `offsetHeight` を測り、見積もりとの差が ±2px を超えたものを一覧して非ゼロで終了する。
`npm test`/pre-commit には含めない(Chromium と dev サーバーが必要で、環境に依存するため)。
`driver.mjs` と同じく、dev サーバーとブラウザの起動は `lib.mjs` を共有している。

## 実行(人間向け)

```bash
npm run dev
```
ブラウザで `http://localhost:5173` を開く。ヘッドレス環境では画面を見られないため無意味 —
エージェントは上記ドライバ経由の経路を使うこと。

## 個別のUI要素を操作したい場合

`driver.mjs` の各ステップは Playwright の `page` オブジェクトに対する通常の操作。他のノードを
操作したい場合は、ノードの `data-id`(React Flow がノードのDOMラッパー `.react-flow__node` に
付与する属性、値はグラフ内のノードID)でセレクタを組み立てる:

```js
page.locator('.react-flow__node[data-id="<ノードID>"] input[type="number"]')  // numberInput、または未接続の数値入力ソケットの欄
page.locator('.react-flow__node[data-id="<ノードID>"] input[type="color"]')  // colorInput、または未接続の色入力ソケットの欄
```

ノードIDの一覧は `src/state/graphStore.ts` の `initialNodes` を参照(トップレベルには
`bodyBuild`・`bodyDimensions`/`bodyLayout`・各 `<name>Group` しか無い点に注意。各ガーメント固有の生パラメータ
(色を除く)は対応するグループの中のノード(`scale` など)の入力欄として
埋め込まれている(色はグループカード自身の Color 欄)ため、上のステップ5と同様に
まず中に入ってから探す。ラベルではなく `id` フィールドを使うこと)。

number/color input は React の controlled input なので、値を直接 `el.value = ...` するだけでは
onChangeが発火しない。ネイティブの value setter 経由で値をセットしてから `input` イベントを
`dispatchEvent` する必要がある(`driver.mjs` 内の該当箇所を参照)。

## Gotchas

- **アドホックな高解像度スクショの乱発はトークンを大量消費する。** 1手直しごとに独自の
  Playwrightスクリプトで撮影→`Read`を繰り返すと、画像1枚が解像度に比例して数千トークンを
  消費し、それが会話履歴に載ったまま以降の全ターンでコンテキストコストとして残り続ける
  (実測: あるセッションでこのパターンを45回繰り返し、解像度も1600×1000から3600×2200まで
  増大した結果、そのセッションのトランスクリプトが42MBに膨れ上がりProプランの使用制限を
  圧迫した)。**可能な限り本スキルの `driver.mjs`(1600×1000・4枚構成)をそのまま使う。**
  個別要素のクローズアップ確認がどうしても必要な場合も、ビューポートは
  800×500程度など小さく保ち、同じスクリーンショットを読み直さない(直前のターンで既に
  見た画像の内容は会話履歴から参照できる)。検証が終わったスクリーンショットは
  scratchpadに溜め込み続けず、不要なら以降のReadで開き直さない。
- **`chromium-cli` はこの環境に存在しない。** `/run` スキルが第一に案内するツールだが `which
  chromium-cli` が失敗する。代わりに `playwright-core` を直接使っている。将来 `chromium-cli` が
  使えるようになったら乗り換えを検討してよいが、その場合もこの `driver.mjs` の操作シーケンス
  (待機セレクタ・間引き検証手順)はそのまま参考にできる。
- **`fill()` は使わない。** Playwright の `locator.fill()` は number/color input には正式対応
  しておらず、意図通りに動かないことがある。ネイティブ value setter + `dispatchEvent(new
  Event('input', { bubbles: true }))` の組み合わせが確実。
- **プロジェクト本体に依存を追加していない。** `playwright-core` はこのスキルディレクトリの
  `package.json`/`node_modules` にのみ存在する(ルートの `.gitignore` の `node_modules` パターン
  が非アンカーのため、ここも自動的に無視される)。プロジェクト本体の `npm run build`/`npm test`
  には一切影響しない。
- **`evaluations` カウンタ(画面右下)は間引きの効き目を確認する手がかりになる。** 例えば
  数値入力欄に6回連続でinputイベントを送っても、間引きロジックが効いていれば `evaluations` は
  1〜2回分しか増えない(6回分ではない)。大きく増えていたら間引きが壊れている疑い。

## Troubleshooting

| 症状 | 原因 / 対処 |
|---|---|
| `Chromium 実行ファイルが見つかりません` | `~/.cache/ms-playwright` にキャッシュが無い。`cd .claude/skills/run-costume-design2 && npm install && npx playwright-core install chromium` |
| `dev server が30秒以内に応答しませんでした` | ポート5173が塞がっている可能性。`lsof -ti:5173 -sTCP:LISTEN \| xargs -r kill` してから再実行 |
| `.react-flow__node[data-id="skirtGroup"]`/`scale`/`input` が見つからずタイムアウト | デフォルトグラフの構成が変わった(ノードIDが変更/削除された、または対象ノードがグループの中に埋め込まれた)。`src/state/graphStore.ts` の `initialNodes` や該当する `<name>GroupNode.ts` で現在のノードIDを確認し、`driver.mjs` 内のセレクタを更新する |
| `check-card-heights.mjs` が全ノードで「未描画」になる | 長時間動かした dev server は HMR で `graphStore.ts` が2つのモジュールインスタンスに分かれ、検査が操作するストアとアプリが描画に使うストアが別物になる。dev server を再起動してから実行する |
