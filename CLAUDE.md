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
- ガーメントのジオメトリ生成ロジックや半径/長さのスケーリング規則を変更した → [`src/geometry/CLAUDE.md`](src/geometry/CLAUDE.md)、および本ファイルの「ボディスケールはソケットグラフを迂回して直接読み取られる」節
- トゥーンシェーディング/アウトラインの仕組みを変更した → [`src/rendering/CLAUDE.md`](src/rendering/CLAUDE.md)
- シーン組み立て(ボディ/ガーメントの配置・アンカー)を変更した → [`src/scene/CLAUDE.md`](src/scene/CLAUDE.md)
- zustand ストアの構造、Undo/Redo の仕組みを変更した → [`src/state/CLAUDE.md`](src/state/CLAUDE.md)
- ノードグラフエディタの操作/UX を変更した → [`src/editor/CLAUDE.md`](src/editor/CLAUDE.md)
- 上記のいずれにも該当しないプロジェクト全体の慣例・制約を変えた → 本ファイル

上記の pre-commit リマインダーは、この判断を手助けするための機械的な補助であり、代わりにはなりません。

## アーキテクチャ

これはノードグラフ(Blender の Geometry Nodes 風)で 3D コスチュームをデザインする Web アプリで、フォトリアルな 3D ではなく、フラットなトゥーンシェーディングのイラスト調でレンダリングされます。スタック: React + react-three-fiber (Three.js) + React Flow (`@xyflow/react`)、状態管理に zustand、バックエンドなし — 完全にクライアントサイドで、グラフの状態は localStorage に永続化されます。

**すべてがコード上で手続き的に生成されます — 外部の 3D メッシュアセットは使用しません。** ボディと両方のガーメント(衣装)は、インポートしたモデルではなく、実行時にプリミティブ/カーブから構築されます。これは見落としではなく、意図的な制約です。

各モジュールのより詳細な設計意図・落とし穴は、該当ディレクトリで作業する際に自動的に読み込まれる `CLAUDE.md` にまとめています: [`src/nodes/CLAUDE.md`](src/nodes/CLAUDE.md)(ノードグラフエンジン)、[`src/geometry/CLAUDE.md`](src/geometry/CLAUDE.md)(カスタムガーメントジオメトリ)、[`src/rendering/CLAUDE.md`](src/rendering/CLAUDE.md)(トゥーンシェーディング/アウトライン)、[`src/scene/CLAUDE.md`](src/scene/CLAUDE.md)(シーン組み立て)、[`src/state/CLAUDE.md`](src/state/CLAUDE.md)(リアクティビティ・Undo/Redo)、[`src/editor/CLAUDE.md`](src/editor/CLAUDE.md)(ノードグラフの操作/エディタUX)。

### ボディスケールはソケットグラフを迂回して直接読み取られる

`state/useBodyScale.ts` は、慣例的な ID を持つ3つのシードノード(`bodyHeight`/`bodyBuild`/`bodyShoulder` — 新しいノードタイプではなく、普通の `numberInput` ノード)を、`evaluateGraph` を完全に迂回して zustand ストアから **id で直接**読み取ります。これは「すべてはソケットを介して流れる」というパターンに対する意図的な例外です。ボディスケールはガーメントの `{geometry, material}` 出力ではなく、`Body.tsx` と `Garments.tsx`(アンカー位置のため)の両方が合意する必要のあるシーン全体のパラメータであり、「シーン全体に影響する」構造的な値を表すソケットタイプは存在しないためです。これら3つのノードが削除された場合は `DEFAULT_BODY_SCALE` (1, 1, 1) にフォールバックします。

同じパターンで `state/useBodySkinColor.ts` が慣例的な ID `bodySkinColor`(普通の `colorInput` ノード)を id で直接読み取り、`Body.tsx` の肌の色として使います。肌色もガーメントの `material` 出力ではなく `Body.tsx` 単体が使うシーン全体のパラメータであるため、同じ迂回が必要になりました。このノードが削除された場合は `DEFAULT_BODY_SKIN_COLOR` (`'#f2c9a0'`) にフォールバックします。`initialGraph.test.ts` はこれら4つのシードノードすべての存在を検証しています。

ガーメント自身の半径スライダーは、ソケットグラフを迂回する `useBodyScale.ts` とは違い、**通常のソケット配線**を使って `bodyBuild` に追従させています。各ガーメントの「体に触れる半径」(skirt/pants/belt の waist 半径、top/jacket/scarf の shoulder 側半径、gloves の wrist 半径、shoes の sole 半径、socks の ankle 半径)は、`numberMultiply` を挟んで `bodyBuild.value` を掛けてから生成ノードに渡す、という乗算そのものは変わっていません。ガーメント全15種は生成ノード・出力ノードとともに1枚の `<name>Group` ノード(`defineGroupNode()` で定義、詳細は [`src/nodes/CLAUDE.md`](src/nodes/CLAUDE.md) の「グループノード」節を参照)にまとめられている。この「体に触れる半径」自体(スケール前の生の値、例: skirt の waistRadius)は他のガーメントと共有されない単独パラメータのため、グループの外部ソケットとしては公開されず、グループ内部の `numberInput` ノード(例: `waistRadiusIn`)としてそのグループの中に入って初めて編集できます。一方 `bodyBuild` は全ガーメント共有のため、グラフ上ではトップレベルの `bodyBuild` がそのグループノードの `Body Build` 入力ソケットへ直接配線されます(例: `bodyBuild → skirtGroup.bodyBuild`)。ボディをリサイズすると自動で追従する点は変わりません。裾の広がりやバックルの膨らみなど「体に触れる半径」から式で導出される二次的な半径(skirt の hemRadius、belt の bulgeRadius など)は、その導出元がスケールされることで自動的に一緒にスケールされます。一方、hand/cuff/calf/brim/crown 半径のような独立したスタイル寄りの半径や、`hat`(`headRadius` はそもそも `computeBodyDimensions` で `buildScale` の影響を受けない)は意図的にスケール対象外です。長さ系のスライダー(skirt の length、sleeve の sleeveLength など)は引き続きユーザー調整に委ね、いずれもグループ内部の `numberInput` ノードとして保持しています。

初期状態のプリセット(`src/state/initialGraph.ts`)では、`bodyBuild`(全14グループへ配線 — hat/bag/necktie/glasses は対象外)、`pantsLegSpacing`(pants/shoes/socks の3グループへ配線、脚回りのガーメント間で共有される脚の間隔)、そして `topGroup`/`sleeveGroup` の両方が必要とする Torso Radius(Body Build 適用後)/Material(`topRadiusScale`/`topMaterial` という2つの共有ノードから両グループへファンアウト — sleeve は Top と同じ生地・同じ太さで縫い付けられているように見せる必要があるため)が、複数グループにまたがって配線される「共有ノード」としてトップレベルに残っています。それ以外の各ガーメント固有のパラメータ(半径・長さ・色など)は、対応する `<name>GroupNode.ts` のテンプレート内に `numberInput`/`colorInput`/`enumInput` ノードとして直接組み込まれており、そのガーメントのグループの中に入って初めて編集できます — 詳細は [`src/nodes/CLAUDE.md`](src/nodes/CLAUDE.md) の「グループノード」節を参照。
