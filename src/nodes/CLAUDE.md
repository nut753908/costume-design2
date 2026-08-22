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

- **(実装中)内部配線をインスタンスごとに独立して編集できるようにする機能を段階的に導入している**。`GroupNodeConfig`(`internalNodes`/`internalEdges`/`inputs`/`outputs`)自体は今まで通り型ごとの固定テンプレートだが、`createDefaultData()` はこのテンプレートを `structuredClone()` した`{nodes, edges, exposedInputs, exposedOutputs}` を返すようになり、ノードインスタンスの `data` に独立したコピーとして持たせられるようになった(`nodes/autoLayout.ts` の `computeAutoLayout()` で座標も自動算出する)。`evaluate()` は `data.nodes`/`data.exposedInputs` 等があればそちらを優先し、無ければ(`initialGraph.json` の既存インスタンスのように)`config.*` にフォールバックする。**現時点ではまだキャンバス上でこれを編集するUIは無い**(ダブルクリックで中に入る操作・ソケット公開UIは後続コミットで追加予定)。`terminalNodeId`(内部の`garmentOutput`型ノードのID)はインスタンスごとに変更できない構造的な決定のまま。
- `evaluate()` は、外部から渡された入力値を埋め込みサブグラフ(`data.nodes` またはテンプレートの `config.internalNodes`)内のプレースホルダーノード(`numberInput`/`colorInput`/`enumInput` を流用)の `data` へ上書きしてから `evaluateGraph()` を**再帰的に**呼ぶだけ。`nodes/evaluateGraph.ts` 自体はほぼ無改修(未接続ソケットの解決を `resolveNodeSockets()` 経由にした1点のみ変更)。
- **注入できるのは number/color/enum の3型のみ**(`data` のリテラル値として上書きできる範囲)。geometry/material 型を外部から**注入**する仕組みは無い。そのため、他ガーメントの内部値(material・スケール後の半径など)を再引きしたい場合(sleeve が topGroup の内部値を再引きする例)は、`config.outputs` で該当する内部ノードの出力を**追加公開**する(`terminalNodeId` 以外の内部ノードの出力を外部ソケットとして転送するのは自由 — 制限があるのは注入側だけ)。
- `garmentOutput.evaluate()` は `outputs: []` 宣言にもかかわらず `anchor`/`offsetY`/`material`/`geometry` を返し、`Garments.tsx` はこれらを宣言済みソケットとは無関係に直接読む。そのため `defineGroupNode()` の `evaluate()` は `config.terminalNodeId`(通常は内部の `garmentOutput` 型ノード)の評価結果を**全キーそのまま**転送する。ここを「`config.outputs` で明示指定したキーだけ返す」ように誤って実装すると、`anchor`/`offsetY` が失われてガーメントの取り付け位置がデフォルトにフォールバックする(実際に踏んだ落とし穴)。
- 新しいガーメント種をこのパターンで追加する手順は `add-garment-type` スキルを参照。
