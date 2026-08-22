# src/nodes/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## ノードグラフエンジン

React Flow (`src/editor/`) は UI の状態(ノードの位置、選択、ドラッグ)のみを保持します。実際の計算は、React Flow について何も知らない別の純粋関数レイヤーが担当します。

- `nodes/types.ts` — ソケットの型システム(`SocketType`: number/color/enum/geometry/material)と `NodeTypeDefinition`(`inputs`/`outputs` ソケットと `evaluate(inputs, data) -> outputs` 関数を宣言)。`GraphNode`/`GraphEdge` もここで定義されており、React Flow 自身の `Node`/`Edge` 型から切り離された最小限の形になっているため、evaluator は UI ライブラリなしでも利用・テスト可能です。
- `nodes/registry.ts` — `registerNodeType()` / `getNodeType()`。すべてのノードタイプ(入力、ジェネレーター、マテリアル、出力)はここに自身を登録します。`src/nodes/definitions/*.ts` が実際のノードタイプの実装であり、`definitions/index.ts` がそれらすべてを副作用インポートしてレジストリを埋めます。
- `nodes/evaluateGraph.ts` — evaluator 本体。ノードをトポロジカルソートし(Kahn のアルゴリズム、循環がある場合は `GraphCycleError` を投げる)、順番に各ノードの `evaluate()` を評価します。**未接続の入力ソケットは、そのノード自身のリテラルな `data[socketId]` の値にフォールバックします** — これは Geometry Nodes で未接続のソケットがウィジェットのデフォルト値を使うのと同じ挙動であり、単独の(未接続の)ノードでも動作するようにするための中心的な仕組みです。この未接続ソケットの解決ループは `nodes/resolveNodeSockets.ts` の `resolveNodeSockets(type, data)` を経由します(型の静的な `inputs` ではなく、ノードインスタンスの `data.exposedInputs` があればそちらを優先する — グループノードの動的ソケット用、下記「グループノード」節参照)。
- 出力カテゴリのノード(例: `garmentOutput`)には下流のソケットがなく、その `evaluate()` の戻り値は他のノードに消費されるのではなく、Scene から直接読み取られます。

## 新しいノードタイプの追加

手順は `add-node-type` スキルを参照してください。

## グループノード

`nodes/definitions/groupNodeFactory.ts` の `defineGroupNode()` は、複数の既存ノード(`numberMultiply`+generator+`toonMaterial`+`garmentOutput` など)を1つの埋め込みサブグラフとして内包し、外部には限られた入出力ソケットだけを見せる「グループノード」を定義する。`category: 'group'` 固定(`NodeCategory` に追加済み、パレット/コンテキストメニューでは「Groups」セクションに表示される)。`src/state/initialGraph.json` の15種のガーメントのうち sleeve を除く14種(`<name>GroupNode.ts`、例: `skirtGroupNode.ts`)がこのパターンで定義されている。

- **内部配線はノードインスタンスごとに独立してキャンバス上で編集できる**。`GroupNodeConfig`(`internalNodes`/`internalEdges`/`inputs`/`outputs`)自体は型ごとの固定テンプレートだが、`createDefaultData()` はこのテンプレートを `structuredClone()` した`{nodes, edges, exposedInputs, exposedOutputs}` を返し(`nodes/autoLayout.ts` の `computeAutoLayout()` で座標も自動算出)、ノードインスタンスの `data` に独立したコピーとして持たせる。`evaluate()` は `data.nodes`/`data.exposedInputs` 等があればそちらを優先し、無ければ(`initialGraph.json` の既存インスタンスのように)`config.*` にフォールバックする。パレットから同じ型を複数回追加しても、あるいは既存の `copySelected`/`pasteClipboard`/`duplicateSelected`(いずれも `structuredClone` ベース)で複製しても、各インスタンスは互いに独立している。`terminalNodeId`(内部の`garmentOutput`型ノードのID)はインスタンスごとに変更できない構造的な決定のまま。
  - **編集UX**: `editor/nodeComponents/GenericNode.tsx` でグループノード(`category:'group'`)をダブルクリックすると `useGraphStore().enterGroup(id)` が呼ばれ、キャンバスがそのインスタンスの内部だけの表示に切り替わる(Blender/Houdini方式、React Flow標準の `parentId`/`extent` によるインライン常時表示ではない)。`editor/BreadcrumbPanel.tsx` が現在の階層パスを表示し、クリックで任意の階層(`exitToLevel`)またはトップレベルへ戻れる。中に入っている間の `onNodesChange`/`onConnect`/`addNode`/`updateNodeData`/Undo/Redo/コピペといった編集操作は、`state/graphStore.ts` の既存アクションを一切改修せずにそのまま使っている(`enterGroup`/`exitGroup` がストアの `nodes`/`edges` を丸ごと差し替えるだけなので、既存アクションからは「今どの階層を編集しているか」を区別できない)。多段ネスト(グループの中の別グループ)も自然に成立する。
  - **落とし穴**: グループの中に入っている間、`state/graphStore.ts` の `nodes`/`edges` は「今開いている階層」の内部ノードだけになる。そのため `Garments.tsx`(3D描画)・`useBodyScale.ts`/`useBodySkinColor.ts`(ボディスケール/肌色の直接読み取り)・`persist` の `partialize`(localStorage永続化)がこれらを直接見ていると、グループの中に入った瞬間に他の全ガーメントが3Dビューから消え、ボディスケールがデフォルトにリセットされ、リロードで他の設計が失われる(実際に設計時に見つかった欠陥)。これを避けるため、`state/composeRootGraph.ts` の `composeRootGraph()`(`scopeStack` と現在の `nodes`/`edges` からトップレベル視点の完全なグラフを合成する純関数)を介した専用の評価パイプライン(`state/selectors.ts` の `useRootGraphLite()` → `state/useRootEvaluatedGraph.ts` → ストアの `rootEvaluatedResults`)を新設し、上記3箇所はこちらだけを見る。ノードカード上のリアルタイム値表示に使う既存の `evaluatedResults`/`useEvaluatedGraph.ts` は「今開いている階層」の評価のまま無改修で残っている — 2つの評価パイプラインが並行して走っている点に注意(詳細は `src/state/CLAUDE.md`)。
  - **(実装中)外部ソケットの動的な公開/非公開UIはまだ無い**。内部の `nodes`/`edges` の繋ぎ替え・ノードの追加削除はキャンバス上でできるが、`data.exposedInputs`/`exposedOutputs`(グループの外に見えるソケット構成)自体をキャンバス上のUIから増減させる手段は後続コミットで追加予定。現時点でこれらを変更するには `updateNodeData()` を直接呼ぶか、`<name>GroupNode.ts` の `config.inputs`/`outputs`(型の既定値)を編集するしかない。
- `evaluate()` は、外部から渡された入力値を埋め込みサブグラフ(`data.nodes` またはテンプレートの `config.internalNodes`)内のプレースホルダーノード(`numberInput`/`colorInput`/`enumInput` を流用)の `data` へ上書きしてから `evaluateGraph()` を**再帰的に**呼ぶだけ。`nodes/evaluateGraph.ts` 自体はほぼ無改修(未接続ソケットの解決を `resolveNodeSockets()` 経由にした1点のみ変更)。
- **注入できるのは number/color/enum の3型のみ**(`data` のリテラル値として上書きできる範囲)。geometry/material 型を外部から**注入**する仕組みは無い。そのため、他ガーメントの内部値(material・スケール後の半径など)を再引きしたい場合(sleeve が topGroup の内部値を再引きする例)は、`config.outputs` で該当する内部ノードの出力を**追加公開**する(`terminalNodeId` 以外の内部ノードの出力を外部ソケットとして転送するのは自由 — 制限があるのは注入側だけ)。
- `garmentOutput.evaluate()` は `outputs: []` 宣言にもかかわらず `anchor`/`offsetY`/`material`/`geometry` を返し、`Garments.tsx` はこれらを宣言済みソケットとは無関係に直接読む。そのため `defineGroupNode()` の `evaluate()` は `config.terminalNodeId`(通常は内部の `garmentOutput` 型ノード)の評価結果を**全キーそのまま**転送する。ここを「`config.outputs` で明示指定したキーだけ返す」ように誤って実装すると、`anchor`/`offsetY` が失われてガーメントの取り付け位置がデフォルトにフォールバックする(実際に踏んだ落とし穴)。
- 新しいガーメント種をこのパターンで追加する手順は `add-garment-type` スキルを参照。
