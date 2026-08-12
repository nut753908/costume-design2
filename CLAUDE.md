# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際の Claude Code (claude.ai/code) 向けガイダンスです。

## 言語

このリポジトリでの作業はすべて日本語で行います。ユーザーへの応答、コミットメッセージ、コード中のコメント、ドキュメント(このファイルを含む)は日本語で記述してください。コードの識別子(変数名・関数名・型名など)は英語のままで構いません。

## コマンド

- `npm run dev` — Vite の開発サーバーを起動
- `npm run build` — 型チェック (`tsc -b`) の後にプロダクションビルド
- `npm run test` — vitest のテストスイートを一度だけ実行 (`vitest run`)
- `npx vitest run src/geometry/skirt.test.ts` — 単一のテストファイルを実行
- `npm run lint` — oxlint
- `npx tsc -b` — 型チェックのみ、ビルド出力なし

このリポジトリにはブラウザ用のテストランナーはありません。UI/3D の変更を確認するには `run` スキル(開発サーバーに対する Playwright)を使ってください — このプロジェクト専用の run スキルはまだないため、汎用のブラウザ駆動パターンにフォールバックします。コンソールエラーとスクリーンショットが、変更が実際にレンダリングされたことを確認する手段です。

### pre-commit フック

`.githooks/pre-commit`(リポジトリにコミット済み)が `npm run build && npm test && npm run lint` をコミット前に実行し、失敗時はコミットを中断します。有効化には(`.git/hooks/` はコミットされないため)ローカルで1回 `git config core.hooksPath .githooks` を実行する必要があります。リモートが無い個人開発のリポジトリのため CI の代わりとして機能します。

## アーキテクチャ

これはノードグラフ(Blender の Geometry Nodes 風)で 3D コスチュームをデザインする Web アプリで、フォトリアルな 3D ではなく、フラットなトゥーンシェーディングのイラスト調でレンダリングされます。スタック: React + react-three-fiber (Three.js) + React Flow (`@xyflow/react`)、状態管理に zustand、バックエンドなし — 完全にクライアントサイドで、グラフの状態は localStorage に永続化されます。

**すべてがコード上で手続き的に生成されます — 外部の 3D メッシュアセットは使用しません。** ボディと両方のガーメント(衣装)は、インポートしたモデルではなく、実行時にプリミティブ/カーブから構築されます。これは見落としではなく、意図的な制約です。

各モジュールのより詳細な設計意図・落とし穴は、該当ディレクトリで作業する際に自動的に読み込まれる `CLAUDE.md` にまとめています: [`src/nodes/CLAUDE.md`](src/nodes/CLAUDE.md)(ノードグラフエンジン)、[`src/geometry/CLAUDE.md`](src/geometry/CLAUDE.md)(カスタムガーメントジオメトリ)、[`src/rendering/CLAUDE.md`](src/rendering/CLAUDE.md)(トゥーンシェーディング/アウトライン)、[`src/scene/CLAUDE.md`](src/scene/CLAUDE.md)(シーン組み立て)、[`src/state/CLAUDE.md`](src/state/CLAUDE.md)(リアクティビティ・Undo/Redo)、[`src/editor/CLAUDE.md`](src/editor/CLAUDE.md)(ノードグラフの操作/エディタUX)。

### ボディスケールはソケットグラフを迂回して直接読み取られる

`state/useBodyScale.ts` は、慣例的な ID を持つ3つのシードノード(`bodyHeight`/`bodyBuild`/`bodyShoulder` — 新しいノードタイプではなく、普通の `numberInput` ノード)を、`evaluateGraph` を完全に迂回して zustand ストアから **id で直接**読み取ります。これは「すべてはソケットを介して流れる」というパターンに対する意図的な例外です。ボディスケールはガーメントの `{geometry, material}` 出力ではなく、`Body.tsx` と `Garments.tsx`(アンカー位置のため)の両方が合意する必要のあるシーン全体のパラメータであり、「シーン全体に影響する」構造的な値を表すソケットタイプは存在しないためです。これら3つのノードが削除された場合は `DEFAULT_BODY_SCALE` (1, 1, 1) にフォールバックします。

ガーメント自身の半径スライダーは、ソケットグラフを迂回する `useBodyScale.ts` とは違い、**通常のソケット配線**を使って `bodyBuild` に追従させています。各ガーメントの「体に触れる半径」(skirt/pants/belt の waist 半径、top/jacket/scarf の shoulder 側半径、gloves の wrist 半径、shoes の sole 半径、socks の ankle 半径)は、既存の汎用 `numberMultiply` ノードを間に挟んで `bodyBuild.value` を掛けてから生成ノードに渡しており(例: `skirtWaist → skirtWaistScale(×bodyBuild) → skirtGen.waistRadius`)、ボディをリサイズすると自動で追従します。裾の広がりやバックルの膨らみなど「体に触れる半径」から式で導出される二次的な半径(skirt の hemRadius、belt の bulgeRadius など)は、その導出元がスケールされることで自動的に一緒にスケールされます。一方、hand/cuff/calf/brim/crown 半径のような独立したスタイル寄りの半径や、`hat`(`headRadius` はそもそも `computeBodyDimensions` で `buildScale` の影響を受けない)は意図的にスケール対象外です。長さ系のスライダー(skirt の length、sleeve の length など)は引き続きユーザー調整に委ねています。
