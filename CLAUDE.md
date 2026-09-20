# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際の Claude Code (claude.ai/code) 向けガイダンスです。

## 言語

このリポジトリでの作業はすべて日本語で行います。ユーザーへの応答、コミットメッセージ、コード中のコメント、ドキュメント(このファイルを含む)は日本語で記述してください。コードの識別子(変数名・関数名・型名など)は英語のままで構いません。

## コマンド

主要なコマンドは `package.json` の `scripts` を参照してください(`dev`/`build`/`lint`/`test`/`test:coverage`)。単一のテストファイルを実行するには `npx vitest run <path>`、型チェックのみ行うには `npx tsc -b` を使います。

このリポジトリには WebGL/3D 描画を実際にレンダリングして確認できるブラウザ用テストランナーはありません。UI/3D の変更を確認するには `run-costume-design2` スキル(`.claude/skills/run-costume-design2/`、ヘッドレスChromiumで実際に操作しスクリーンショットを撮る)を使ってください。コンソールエラーとスクリーンショットが、変更が実際にレンダリングされたことを確認する手段です。

WebGL に触れない React フック(zustand ストアの購読 + useMemo/useRef など)は、上記と別の話として vitest + jsdom + `@testing-library/react` の `renderHook`/`act` で単体テストできます(`state/useBodyScale.test.ts`、`state/selectors.test.ts` 参照)。既定のテスト環境は DOM の無い `'node'` なので、対象ファイルの先頭に `// @vitest-environment jsdom` プラグマを付けて切り替えます。

### pre-commit フック

`.githooks/pre-commit`(リポジトリにコミット済み)が `npm run build && npm test && npm run lint` をコミット前に実行し、失敗時はコミットを中断します。有効化には(`.git/hooks/` はコミットされないため)ローカルで1回 `git config core.hooksPath .githooks` を実行する必要があります。リモートが無い個人開発のリポジトリのため CI の代わりとして機能します。

さらに、ステージされた変更ファイルに対応する(直近の祖先ディレクトリの)`CLAUDE.md` がステージに含まれていない場合、コミットを止めずに一覧を表示するだけのリマインダーも実行されます。これは機械的な判定(「そのディレクトリの CLAUDE.md が今回のコミットに含まれているか」)しかできないため、実際に内容の更新が必要かどうかは人間(または Claude Code)が都度判断してください。

### ドキュメントとの同期

実装内容が、このファイルや各ディレクトリの `CLAUDE.md` に書かれている設計意図・アーキテクチャ上の前提・既知の落とし穴を変える場合は、**その変更と同じコミットで該当する `CLAUDE.md` も更新してください**。「後で直す」は基本的に発生しないため、実装コミットの一部として扱うこと。該当するかどうか迷う場合の目安:

- 新しいノードタイプ・ソケットタイプ・評価ルールを追加/変更した → [`src/nodes/CLAUDE.md`](src/nodes/CLAUDE.md)
- ガーメントのジオメトリ生成ロジックや半径/長さのスケーリング規則を変更した → [`src/geometry/CLAUDE.md`](src/geometry/CLAUDE.md)、および本ファイルの「Body(3Dモデル本体)も他14種のガーメントと同じ `<name>Group` ノードで組み立てられる」節
- トゥーンシェーディング/アウトラインの仕組みを変更した → [`src/rendering/CLAUDE.md`](src/rendering/CLAUDE.md)
- シーン組み立て(ボディ/ガーメントの配置・アンカー)を変更した → [`src/scene/CLAUDE.md`](src/scene/CLAUDE.md)
- zustand ストアの構造、Undo/Redo の仕組みを変更した → [`src/state/CLAUDE.md`](src/state/CLAUDE.md)
- ノードグラフエディタの操作/UX を変更した → [`src/editor/CLAUDE.md`](src/editor/CLAUDE.md)
- 上記のいずれにも該当しないプロジェクト全体の慣例・制約を変えた → 本ファイル

上記の pre-commit リマインダーは、この判断を手助けするための機械的な補助であり、代わりにはなりません。

**このファイル・各ディレクトリの `CLAUDE.md`、そしてソースコード/テストコードのコメントは、いずれも「今の設計・実装が何で、なぜそうなっているか」だけを書きます。** どういう変遷を経て今の形になったかという移行の経緯(「以前は〜だったが、〜という理由で今は〜」「旧実装は〜」「かつては〜」)は、必要なら git log/commit メッセージを参照してください — CLAUDE.md にもコードコメントにも書き残す対象ではありません。リファクタリングでノードの実装を展開・統合するたびにこの手の経緯を書き足すと、CLAUDE.md・コード双方が際限なく肥大化します(実際に発生し、2回のコメント整理コミットで削減しました)。コード側のコメントは特に、非自明な WHY(なぜこの値・この構造を選んだか、コードを読むだけでは分からない理由)・既知の落とし穴・非自明な不変条件だけを 1〜3 行程度で書き、それ以外は書かないこと — CLAUDE.md 側の該当節を指し示すだけで十分な場合はそちらに譲ります。

## アーキテクチャ

これはノードグラフ(Blender の Geometry Nodes 風)で 3D コスチュームをデザインする Web アプリで、フォトリアルな 3D ではなく、フラットなトゥーンシェーディングのイラスト調でレンダリングされます。スタック: React + react-three-fiber (Three.js) + React Flow (`@xyflow/react`)、状態管理に zustand、バックエンドなし — 完全にクライアントサイドで、グラフの状態は localStorage に永続化されます。

**すべてがコード上で手続き的に生成されます — 外部の 3D メッシュアセットは使用しません。** ボディと両方のガーメント(衣装)は、インポートしたモデルではなく、実行時にプリミティブ/カーブから構築されます。これは見落としではなく、意図的な制約です。

各モジュールのより詳細な設計意図・落とし穴は、該当ディレクトリで作業する際に自動的に読み込まれる `CLAUDE.md` にまとめています: [`src/nodes/CLAUDE.md`](src/nodes/CLAUDE.md)(ノードグラフエンジン)、[`src/geometry/CLAUDE.md`](src/geometry/CLAUDE.md)(カスタムガーメントジオメトリ)、[`src/rendering/CLAUDE.md`](src/rendering/CLAUDE.md)(トゥーンシェーディング/アウトライン)、[`src/scene/CLAUDE.md`](src/scene/CLAUDE.md)(シーン組み立て)、[`src/state/CLAUDE.md`](src/state/CLAUDE.md)(リアクティビティ・Undo/Redo)、[`src/editor/CLAUDE.md`](src/editor/CLAUDE.md)(ノードグラフの操作/エディタUX)。

### Body(3Dモデル本体)も他14種のガーメントと同じ `<name>Group` ノードで組み立てられる

Body は専用のノードタイプ・専用の描画コンポーネントを持たず、他14種のガーメントと全く同じ「`<name>Group`」パターン(`bodyGroup`)で表現されています。寸法・配置の計算(`bodyDimensions`/`bodyLayout`)はトップレベル共有ノードとして1組だけ存在し、`bodyGroup` と全14ガーメントへファンアウトされます。取り付け位置はこの `bodyLayout` が計算した5つのアンカー候補のうち1つを `anchorY` で受け取り、`garmentPlacement` が焼き込みます。内部構造の詳細は [`src/nodes/CLAUDE.md`](src/nodes/CLAUDE.md) の「グループノード」節、ジオメトリ関数は [`src/geometry/CLAUDE.md`](src/geometry/CLAUDE.md) を参照してください。

ガーメント自身の半径パラメータは、**通常のソケット配線**を使って `bodyBuild` に追従させています。各ガーメントの「体に触れる半径」(skirt/pants/belt の waist 半径(pants は裾半径も)、top/jacket/scarf の shoulder 側半径、gloves の wrist/hand 半径、shoes の sole/cuff 半径、socks の ankle/calf 半径)は、`numberMultiply` を挟んで `bodyBuild.value` を掛けてから生成ノードに渡します。ガーメント全14種は生成ノード・出力ノードとともに1枚の `<name>Group` ノード(`defineGroupNode()` で定義、詳細は [`src/nodes/CLAUDE.md`](src/nodes/CLAUDE.md) の「グループノード」節を参照)にまとめられています。この「体に触れる半径」自体(スケール前の生の値、例: skirt の waistRadius)は他のガーメントと共有されない単独パラメータのため、グループの外部ソケットとしては公開されず、グループ内部の `numberInput` ノード(例: `waistRadiusIn`)としてそのグループの中に入って初めて編集できます。一方 `bodyBuild` は全ガーメント共有のため、グラフ上ではトップレベルの `bodyBuild` がそのグループノードの `Body Build` 入力ソケットへ直接配線されます(例: `bodyBuild → skirtGroup.bodyBuild`)。ボディをリサイズすると自動で追従します。裾の広がりやバックルの膨らみなど「体に触れる半径」から式で導出される二次的な半径(skirt の hemRadius、belt の bulgeRadius など)は、その導出元がスケールされることで自動的に一緒にスケールされます。一方、crown 半径のような独立したスタイル寄りの半径や、`hat`(`headRadius` はそもそも `bodyDimensionsGroup` の中で `buildScale` の影響を受けず、つばの半径はその頭半径に倍率を掛けて求める)は意図的にスケール対象外です。長さ系のパラメータ(skirt の length、top の sleeveLength など)は引き続きユーザー調整に委ね、いずれもグループ内部の `numberInput` ノードとして保持しています。

初期状態のプリセット(`src/state/initialGraph.ts`)がトップレベルに残す共有ノードの一覧は [`src/state/CLAUDE.md`](src/state/CLAUDE.md) を参照してください。
