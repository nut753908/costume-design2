# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際の Claude Code (claude.ai/code) 向けガイダンスです。

## コマンド

- `npm run dev` — Vite の開発サーバーを起動
- `npm run build` — 型チェック (`tsc -b`) の後にプロダクションビルド
- `npm run test` — vitest のテストスイートを一度だけ実行 (`vitest run`)
- `npx vitest run src/geometry/skirt.test.ts` — 単一のテストファイルを実行
- `npm run lint` — oxlint
- `npx tsc -b` — 型チェックのみ、ビルド出力なし

このリポジトリにはブラウザ用のテストランナーはありません。UI/3D の変更を確認するには `run` スキル(開発サーバーに対する Playwright)を使ってください — このプロジェクト専用の run スキルはまだないため、汎用のブラウザ駆動パターンにフォールバックします。コンソールエラーとスクリーンショットが、変更が実際にレンダリングされたことを確認する手段です。

## アーキテクチャ

これはノードグラフ(Blender の Geometry Nodes 風)で 3D コスチュームをデザインする Web アプリで、フォトリアルな 3D ではなく、フラットなトゥーンシェーディングのイラスト調でレンダリングされます。スタック: React + react-three-fiber (Three.js) + React Flow (`@xyflow/react`)、状態管理に zustand、バックエンドなし — 完全にクライアントサイドで、グラフの状態は localStorage に永続化されます。

**すべてがコード上で手続き的に生成されます — 外部の 3D メッシュアセットは使用しません。** ボディと両方のガーメント(衣装)は、インポートしたモデルではなく、実行時にプリミティブ/カーブから構築されます。これは見落としではなく、意図的な制約です。

### ノードグラフエンジン (`src/nodes/`)

React Flow (`src/editor/`) は UI の状態(ノードの位置、選択、ドラッグ)のみを保持します。実際の計算は、React Flow について何も知らない別の純粋関数レイヤーが担当します。

- `nodes/types.ts` — ソケットの型システム(`SocketType`: number/color/enum/geometry/material)と `NodeTypeDefinition`(`inputs`/`outputs` ソケットと `evaluate(inputs, data) -> outputs` 関数を宣言)。`GraphNode`/`GraphEdge` もここで定義されており、React Flow 自身の `Node`/`Edge` 型から切り離された最小限の形になっているため、evaluator は UI ライブラリなしでも利用・テスト可能です。
- `nodes/registry.ts` — `registerNodeType()` / `getNodeType()`。すべてのノードタイプ(入力、ジェネレーター、マテリアル、出力)はここに自身を登録します。`src/nodes/definitions/*.ts` が実際のノードタイプの実装であり、`definitions/index.ts` がそれらすべてを副作用インポートしてレジストリを埋めます。
- `nodes/evaluateGraph.ts` — evaluator 本体。ノードをトポロジカルソートし(Kahn のアルゴリズム、循環がある場合は `GraphCycleError` を投げる)、順番に各ノードの `evaluate()` を評価します。**未接続の入力ソケットは、そのノード自身のリテラルな `data[socketId]` の値にフォールバックします** — これは Geometry Nodes で未接続のソケットがウィジェットのデフォルト値を使うのと同じ挙動であり、単独の(未接続の)ノードでも動作するようにするための中心的な仕組みです。
- 出力カテゴリのノード(例: `garmentOutput`)には下流のソケットがなく、その `evaluate()` の戻り値は他のノードに消費されるのではなく、Scene から直接読み取られます。

### リアクティビティ: ノードをドラッグしても evaluator が再実行されない理由

`state/selectors.ts` (`useNodesLite`/`useEdgesLite`) は React Flow の揮発性フィールド(position、selected、dragging)を取り除き — これが重要な点ですが — それらの揮発性フィールドのみが変化した場合には**同一の配列参照**を返します。これは ref にキャッシュした手動の等価性チェックによるもので(最初に試した zustand の `useShallow` ではありません。これは新しくマップされたオブジェクトに対して一階層のみの `Object.is` 比較を行うため、無限レンダーループを引き起こしました)。`state/useEvaluatedGraph.ts` はこれらの安定した参照を持つ配列を `useMemo(() => evaluateGraph(...))` に渡すため、ジオメトリ/マテリアルの再計算はノードの*データ*やエッジが実際に変化したときにのみ発生し、ドラッグ中やフレームごとには発生しません。これはシーンペイン右下に表示される `evaluations: N` カウンターで実際に確認できます。

### カスタムガーメントジオメトリ (`src/geometry/`)

- `skirt.ts` — プロファイルカーブ(ウエストからヘムまで、半径を smoothstep でイージング)から構築した `THREE.LatheGeometry`。
- `top.ts` — Lathe/Extrude では**ない**。ネックラインの落ち込みは放射対称ではないため。角度×高さのリングからなる手組みの `BufferGeometry` で、最上段のリングの頂点のみを角度ごとに(ネックラインタイプ: round/v/square ごとのフォールオフ関数で重み付けして)引き下げてネックラインを彫り込みます。
- `sleeve.ts` — top.ts に統合されていない**別の**ノード/ジオメトリ (`sleeveGenerator`)。肩の各角度ごとにローカルな(外向き、接線、従法線)フレーム内で構築された、テーパー状の短い2本のチューブで、トルソーの壁面に食い込ませて重ねたままにしています(`body.ts` が腕に対して使っているのと同じ、意図的な交差を許容するアプローチで、ブーリアン演算や穴あけは行いません)。top と同じ `shoulder` アンカーに取り付けられ、通常は top の `toonMaterial` ノードを共有するように配線されます(1つの Color/Material ノードから2つの Garment Output へのファンアウト)。これにより top の色を変えると sleeve も一緒に再着色されます。
- `body.ts` — マネキン用のカプセル/球/円柱プリミティブ。純粋関数(`computeBodyDimensions`/`computeBodyLayout`/`computeBodyAnchors`)をエクスポートしており、静的定数ではありません — 寸法は `BodyScaleParams` (`heightScale`/`buildScale`) から算出されるため、ボディメッシュとガーメントが取り付く `waist`/`shoulder` アンカーの両方が、ボディのリサイズに合わせて一緒に動きます。

**すでに一度踏んだ落とし穴(新しい回転体/手組みジオメトリを追加すると再びハマります):** 三角形の巻き順(winding order)は重要で、逆になりやすいです。しかも視覚的な症状は分かりやすい「裏返って見える」ではなく、ガーメントが**真っ黒なシルエット**としてレンダリングされる(端に本来の色がわずかに見えることもある)というものです。これは、実際の `FrontSide` メッシュが(誤って)カリングされると、アウトラインメッシュの `BackSide` 専用の面だけが唯一の可視面になってしまうために起きます。新しい手続き型メッシュが真っ黒にレンダリングされたら、まずマテリアルやライティングではなく三角形の巻き順を確認してください。

### レンダリング (`src/rendering/`)

- `gradientTexture.ts` — すべての `MeshToonMaterial` の `gradientMap` として使われる、共有の4段階 `DataTexture`(キャッシュされたシングルトン)。これによりすべてのガーメント/ボディが同一のセルシェーディングの帯を共有します。
- `Outline.tsx` — イラスト調のアウトライン: インバーテッドハル(法線反転殻)手法(ジオメトリを複製し、`BackSide` の暗い `MeshBasicMaterial` を約2%拡大して適用)。ポストプロセッシングのパイプラインは使用していません。`ToonMesh.tsx` はメッシュとそのアウトラインを1つのユニットとしてペアにします。
- レンダラーは色をフラットでポスターのような見た目に保つため、`THREE.NoToneMapping` を使用し、環境マップは使用していません。

### シーン組み立て (`src/scene/`)

`Scene.tsx` は `Body`(静的)と `Garments`(動的)をレンダリングします。`Garments.tsx` はグラフ内の**すべてのノード**を走査し、評価結果に(特定のノードタイプに限らず)`geometry` + `material` キーがあるかを確認し、あれば `garmentOutput` の evaluate 出力で指定されたアンカー(`anchor`/`offsetY`)に `ToonMesh` をマウントします。つまり、将来的に評価結果として `{geometry, material, anchor, offsetY}` を返すノードタイプが追加されれば、Scene 側の登録なしに自動的にレンダリングされます。複数の出力ノードが同じアンカーを共有することもでき(top と sleeve はどちらも `shoulder`)、その場合は単に重なり合う別々のメッシュとしてレンダリングされます。

### 新しいノードタイプの追加

すべての `NodeTypeDefinition` (`nodes/definitions/*.ts`) は、`evaluate()` に加えて `createDefaultData()` が必要です — これは `NodePalette.tsx` / `graphStore.addNode()` が新規追加インスタンスの初期値を作る際に使われます。モジュールは `nodes/definitions/index.ts` に登録(副作用インポート)し、そのタイプを `editor/NodeEditor.tsx` の `nodeTypes` マップに追加してください(`NumberInputNode`/`ColorInputNode`/`EnumInputNode` のような専用 UI が必要な場合を除き、`GenericNodeView` を再利用します)。

### ボディスケールはソケットグラフを介さず帯域外で読み取られる

`state/useBodyScale.ts` は、慣例的な ID を持つ2つのシードノード(`bodyHeight`、`bodyBuild` — 新しいノードタイプではなく、普通の `numberInput` ノード)を、`evaluateGraph` を完全に迂回して zustand ストアから **id で直接**読み取ります。これは「すべてはソケットを介して流れる」というパターンに対する意図的な例外です。ボディスケールはガーメントの `{geometry, material}` 出力ではなく、`Body.tsx` と `Garments.tsx`(アンカー位置のため)の両方が合意する必要のあるシーン全体のパラメータであり、「シーン全体に影響する」構造的な値を表すソケットタイプは存在しないためです。これら2つのノードが削除された場合は `DEFAULT_BODY_SCALE` (1, 1) にフォールバックします。ガーメント自身の半径/長さのスライダーはボディの build に自動同期**されません** — ボディをリサイズすると、既存のガーメントはユーザーが調整するまでゆるい/きつい見た目になることがあります。

### 既知の MVP の制約(意図的なもので、バグではありません)

- ドラッグ&ドロップによるノード配置はなく(パレットをクリックするとカスケード状のオフセットで追加されます)、エッジ/ノードのコンテキストメニューもありません — 削除は React Flow のデフォルトである、選択後の Backspace のみです。
