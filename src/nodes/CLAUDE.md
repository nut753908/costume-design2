# src/nodes/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## ノードグラフエンジン

React Flow(`src/editor/`)は UI の状態(位置・選択・ドラッグ)だけを持ち、計算は React Flow を知らない純粋関数のレイヤー(`types.ts` の `GraphNode`/`GraphEdge`、`evaluateGraph.ts`)が担います。evaluator は UI ライブラリなしでテストできます。

- **未接続の入力ソケットは、ノード自身の `data[socketId]`、無ければ `SocketDef.default` の値を使う**(Geometry Nodes のウィジェットの既定値と同じ)。新しいノードタイプの `number`/`color` 入力には `default` を付けること(`defineGeneratorNode()` は `fields` から自動で付ける)。`geometry`/`material`/`curve` はリテラルを持てない。ソケット一覧は型の静的な `inputs` ではなく `resolveNodeSockets()` で解決する(グループの動的ソケットのため)。
- **ノード単位のメモ化キャッシュ**(`evaluateGraph.ts`)は、`node.data` の参照と解決済み `inputs` が前回と同じなら `evaluate()` を呼ばない。グループの内部まで同じ実装なので、無関係なグループは内部の評価ごとスキップされる。正しく働くための前提:
  - `evaluate(inputs, data)` は `inputs`/`data` だけに依存する純粋関数であること。
  - 受け取った `geometry`/`material`/`curve` を直接ミューテートしないこと(変換するなら `.clone()` してから)。キャッシュが返す前回の結果が書き換わり、無関係な箇所に伝播する。
  - `data` はイミュータブルに更新すること(ネストしたオブジェクトの直接ミューテートは検知できない)。
  - テストで同じ inputs の `evaluate()` を複数回呼ぶと、2回目以降は spy が発火しないことがある。`src/testSetup.ts` が `beforeEach` でキャッシュを空にしている。
- **描画されるかどうかは、`sceneOutput` へ明示的に配線したかで決まる**。geometry+material を持つ値を型で自動検出することはせず、`groupOutput` 経由の出力は描画されない。`sceneOutput` は必ず `<name>Group` の中に置く(下記)。
- `curve` 型の `(半径, 高さ)` のプロファイルは、どの生成ノードも `t` が増えるほど下から上へ進む。分割数(`Profile Steps`)は曲線ではなく受け取る側の設定。

## 新しいノードタイプの追加

手順は `add-node-type` スキルを参照してください。

`defineGroupNode()` のテンプレートで存在しないノード id/ソケット id を指すエッジを書いても、`evaluateGraph` は静かに無視する。`nodes/definitions/groupNodeWiring.test.ts` が全グループ型の内部配線を検証するので、グループを追加/配線し直したらこのテストで確認する。

## グループノード

`defineGroupNode()`(`nodes/definitions/groupNodeFactory.ts`)は、既存ノードを埋め込みサブグラフとして内包し、外部には限られたソケットだけを見せるノードを定義します。Body(`bodyGroup`)・ガーメント・自作グループ(`customGroup`)がこの形です。新しいガーメント種の追加手順は `add-garment-type` スキルを参照。

- **値の置き場所**: 1つのノードだけが使う値(比率や定数など)は `numberInput` を置かず、そのノードの入力欄の値(`data[socketId]`)としてテンプレートに書く。複数のノードが同じ値を使うときだけ `numberInput`/`colorInput` を1つ置いて配線する。定数を `groupOutput` へ渡すときも、そのソケットの入力欄の値に持たせる。
- **複数のグループで共有する値**は、どれかのグループの中に置いて `groupOutput` で覗かせるのではなく、`state/initialGraph.ts` のトップレベルの共有ノードへ引き上げ、各グループの外部ソケットへファンアウトする。
- **外部インターフェースは中の `groupInput`/`groupOutput` の `data.sockets` が定義する**(Blender と同じ)。中でソケットを増減・配線すれば、グループ本体のハンドルも増減する。
  - どちらも省略でき、省略すると外部ソケットは0個になる(型の静的な `inputs`/`outputs` へは戻さない)。
  - 同じ階層に複数置くと `data.sockets` を共有する(`state/groupIOSockets.ts`)。外部の値はすべての `groupInput` に注入され、`groupOutput` はソケットごとに、それを配線している最初のノードの値を出す。
  - `groupInput` のソケットの既定値は `Group Input` ノード上では編集できない。値はグループカードの未接続入力の欄で変える。
- **インスタンスは内部グラフを独立コピーとして持つ**(`data.nodes`/`data.edges`、無ければテンプレートへフォールバック)。そのため、テンプレートの構造を変えても編集済みのインスタンスは追従しない。構造の指紋(`nodes/groupTemplate.ts`)で古いインスタンスを検知し、「テンプレートへ更新」で同じ id・同じ型のノードの値だけを引き継いで読み込み直す。
- **グループの中に入っている間、ストアの `nodes`/`edges` はその階層の内部だけになる**。トップレベルのグラフが必要なコードの扱いは `src/state/CLAUDE.md` の「グループの中に入る」節を参照。
- **`sceneOutput` は1つのグループに何個置いてもよい**。`groupNodeFactory.ts` の `findResolvedSceneOutputs()` が内部の `sceneOutput` と、ネストしたグループが転送してきた分を `internalNodes` の順に集め、予約キー `sceneOutputGeometry<N>`/`sceneOutputMaterial<N>` でグループの出力に載せる。多段ネストでも各階層が同じ処理をするだけで外側まで転送される。予約キーは配線用のソケットではなく、`Garments.tsx` だけが読む。
- **取り付け位置は geometry の頂点に焼き込む**。ガーメントは `garmentOutput()`(`nodes/definitions/garmentOutput.ts`)が作る `placement`(`translate`、入力欄 `y`)で平行移動してから `sceneOutput` へ渡すので、描画側は位置を知らなくてよい。
