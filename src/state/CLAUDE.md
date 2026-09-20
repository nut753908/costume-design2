# src/state/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## リアクティビティ: ノードをドラッグしても evaluator が再実行されない理由

`state/selectors.ts` (`useNodesLite`/`useEdgesLite`) は React Flow の揮発性フィールド(position、selected、dragging)を取り除き — これが重要な点ですが — それらの揮発性フィールドのみが変化した場合には**同一の配列参照**を返します。これは ref にキャッシュした手動の等価性チェックによるものです(最初に試した zustand の `useShallow` ではありません。これは新しくマップされたオブジェクトに対して一階層のみの `Object.is` 比較を行うため、無限レンダーループを引き起こしました)。`state/useEvaluatedGraph.ts` はこれらの安定した参照を持つ配列を `useMemo(() => evaluateGraph(...))` に渡すため、ジオメトリ/マテリアルの再計算はノードの*データ*やエッジが実際に変化したときにのみ発生し、ドラッグ中やフレームごとには発生しません。これはシーンペイン右下に表示される `evaluations: N` カウンターで実際に確認できます。

この参照安定化ロジックの核である `sameNodes`/`sameEdges`/`toGraphNode`/`toGraphEdge` は純粋関数として `selectors.test.ts` で直接テストしているが、`useNodesLite`/`useEdgesLite` フック自体(useMemo/useRef + ストア購読の配線)も vitest + jsdom + `@testing-library/react` の `renderHook` で end-to-end に検証している(同ファイル内の「(フック)」describe ブロック)。ルートの CLAUDE.md 参照。

**落とし穴**: `Garments.tsx` は evaluator の結果を `useEvaluatedGraph()` の戻り値からではなく、`useGraphStore((s) => s.evaluatedResults)` でストアから直接読む。この値を埋め戻すのは `useEvaluatedGraph.ts` の `useEffect(() => setEvaluatedResults(evaluated), [evaluated])` だけであり、その `evaluated` は上記の参照安定化を経た `nodesLite`/`edgesLite` が実際に変化したときにしか再計算されない。かつて `graphStore.ts` の `loadGraph` は呼ばれるたびに `evaluatedResults: null` を無条件にセットしていたが、渡された `nodes`/`edges` が現在の state と**同一参照**の場合(例: `initialNodes`/`initialEdges` のような module-level singleton を保持する「初期状態」プリセットを2回連続で Load する)、ストアの `nodes`/`edges` が変化しないため `nodesLite`/`edgesLite` も再計算されず、`evaluatedResults` が null のまま固まってガーメントが消える、という分かりにくいバグになっていた(修正前に実際に発生していた)。`loadGraph` は現在この null リセットを行わず、`nodes`/`edges` が実際に変化した場合にのみ上記の通常のリアクティブな経路で `evaluatedResults` が再計算されるのに任せている。`evaluatedResults` を書き込む箇所を増やす場合、この「未変化なら再計算されない」制約を踏まえること。

## 保存データの復元と検証

グループノードは編集済みのインスタンスごとに内部のノード/エッジ(`data.nodes`/`data.edges`)を独立したコピーとして持つため、localStorage やプリセットに保存されたグラフには、保存時点のテンプレートの内部構造(後のバージョンで削除されたノードタイプを含みうる)がそのまま残る。`validateGraph()`(`state/validateGraph.ts`)は、この内部サブグラフも含めて再帰的に未登録のノードタイプと循環を検証し、Import JSON・プリセット読み込みに加えて、`graphStore.ts` の `persist` の `merge`(localStorage からの自動復元)でも使う。検証に失敗した保存データは復元せず初期状態で起動し、元のデータは `GRAPH_BACKUP_STORAGE_KEY`(`costume-design-graph-invalid-backup`)へ退避する(検証を通らないまま復元すると `evaluateGraph()` が例外を投げ、`ErrorBoundary` の全消去リセットしか手段が無くなるため)。

## onConnect: 1つの入力ソケットには常に最大1本

`state/graphStore.ts` の `onConnect` は、新しいエッジを追加する前に同じ `target`/`targetHandle` への既存のエッジを取り除く。`isValidConnection`(`editor/NodeEditor.tsx`)は型の一致と循環の有無しかチェックしないため、これを onConnect 側でやらないと、既に接続済みの入力ソケットへ別のノードから繋いでも(`@xyflow/react` の `addEdge()` は source/target/両handle が完全一致する場合しか重複除去しないため)両方のエッジが共存してしまう。`nodes/evaluateGraph.ts` の `incomingEdges.find(...)` は配列中で最初に見つかったエッジ(=古い方)しか採用しないため、後から繋いだ方は静かに無視され、古い方のエッジを消した瞬間に見た目の値が突然切り替わるという分かりにくいバグになる(修正前に実際に発生していた)。新しいノードタイプ/接続経路を追加する際、エッジを直接 `set({ edges: ... })` する箇所を増やすなら、この置き換えロジックも一緒に通すこと。

**例外**: `SocketDef.multiple` な入力ソケット(現在は `mergeGeometry` の `geometries`)は置き換えず、接続を追加する。`evaluateGraph()` はそのソケットについて、繋がったすべてのエッジの値を配列の並び順(=接続した順)で集める。グループのテンプレート内のエッジ id(`groupNodeFactory.ts`)は、この場合に衝突しないよう接続元も含めて作る。

## Undo/Redo

`state/graphStore.ts` は `past`/`future` の2つのスナップショットスタック(`{nodes, edges}`)を持ち、Ctrl+Z / Ctrl+Shift+Z(または Ctrl+Y)と `HistoryControls.tsx` のボタンで操作できます。すべての変更操作(`onNodesChange` の remove、`onEdgesChange` の remove、`onConnect`、`addNode`、`updateNodeData`)は、実際に `set()` する前に内部ヘルパー `pushHistory(key?, coalesceMs?)` を呼びます。

スライダー/カラーピッカーのドラッグは `updateNodeData` を1ジェスチャーあたり何十回も連続発火させるため、`key`(`data:${id}` など)と `coalesceMs` を指定すると、直前のプッシュから `coalesceMs` 以内・同じ `key` での呼び出しはスタックに新規エントリを積まず「同じジェスチャーの続き」として吸収されます(タイムスタンプだけ更新)。ノードのドラッグ移動は `dragging` フラグの立ち上がりエッジ(`_dragging` 内部状態)で1ドラッグ=1エントリに区切っており、こちらは時間ベースのコアレッシングを使っていません。`past`/`future` は localStorage に永続化されず(`partialize` は下記「グループの中に入る」節で説明する合成後の `{nodes, edges}` のみ)、`loadGraph`(JSON インポート/プリセット読み込み)・`enterGroup`/`exitGroup`(グループの中に入る/出る)は履歴をクリアします。**そのため、リロード後や、グループの中に入る/出る操作を跨いでは、Undo で以前の状態に戻すことはできません。**

## グループの中に入る(スコープ切り替え)とトップレベル評価パイプライン

`nodes/definitions/groupNodeFactory.ts` のグループノードのタイトル行の「→」(グループの中に入る)ボタンを押すと `enterGroup(nodeId)` が呼ばれ、`scopeStack`(`state/composeRootGraph.ts` の `ScopeFrame[]`)に現在の `nodes`/`edges` を退避してpushした上で、ストアの `nodes`/`edges` をそのグループインスタンスの内部データ(`data.nodes`/`data.edges`)へ**丸ごと差し替えます**。`exitGroup()` は逆に、編集後の現在の `nodes`/`edges` を退避先の親ノードの `data` へ書き戻してから1つ上の階層を復元します。**この差し替え方式のおかげで、`onNodesChange`/`onConnect`/`addNode`/`updateNodeData`/Undo/Redo/コピペといった既存アクションは一切改修不要**でした(それらは「今ストアが指している `nodes`/`edges` を素直に読み書きする」だけで、今どの階層にいるかを一切意識しないため)。グループの外部入出力ソケット構成は、埋め込みサブグラフ内の `groupInput`/`groupOutput` ノード(`category:'group-io'`)自身の `data.sockets` が定義するため、それらを編集するのも通常の `updateNodeData()` で足りる(そのノードは「今開いている階層」の `nodes` の中に普通に存在するため)。唯一 `updateNodeData()` では届かないのは、そのグループノード自身(親)の `data` — 中に入っている間は現在の `nodes`(内部グラフ)ではなく直近の `scopeStack` フレームに退避されているが、`removeGroupIOSocket(nodeId, socketId)` はソケット削除に伴う内部/外部エッジの後始末のためだけにこのフレームへ触れる専用アクション(詳細は `src/nodes/CLAUDE.md` の「グループノード」節)。

**落とし穴**: この差し替え方式は、グループの中に入っている間 `state.nodes`/`state.edges` が「今開いている階層」の内部ノードだけになることを意味します。これを知らずに `s.nodes`/`s.edges` を直接読む新しいコードを書くと、`Garments.tsx`(3D描画)・`persist` の `partialize` がそうだったように、グループの中に入った瞬間に他の全ガーメントが3Dビューから消える・リロードで他の設計が失われる、といった壊れ方をします(実際に設計時に見つかった欠陥)。**トップレベル視点で「完全なグラフ」が必要な箇所は、必ず `composeRootGraph(scopeStack, nodes, edges)` を経由すること**:

- `state/selectors.ts` の `useRootGraphLite()` — `useNodesLite`/`useEdgesLite` と同じ参照安定化パターンで、合成後のグラフを返す。
- `state/useRootEvaluatedGraph.ts` — 上記を `evaluateGraph()` に渡し、結果をストアの `rootEvaluatedResults`(`evaluatedResults` とは別フィールド)に書き込む。`App.tsx` で `useEvaluatedGraph()` と並行して常時マウントする。
- `Garments.tsx` は `rootEvaluatedResults` を直接 `entries()` で走査する(`s.nodes` を経由しない)。Body(3Dモデル本体、`bodyGroup`)もこの走査対象に含まれる普通のエントリの1つで、id を特別扱いする読み取りは無い(ルート CLAUDE.md の「Body も他14種のガーメントと同じ `<name>Group` ノードで組み立てられる」節参照)。
- `graphStore.ts` の `partialize` は `composeRootGraph(state.scopeStack, state.nodes, state.edges)`。`scopeStack` 自体(ナビゲーション位置)は永続化しないため、リロードすると常にトップレベル表示に戻る。

一方、既存の `evaluatedResults`/`useEvaluatedGraph.ts`(`GroupInputNode` のソケット行の現在値表示などを駆動)は無改修のまま残っており、**「今開いている階層」を評価し続けます**。つまりこのアプリには2つの評価パイプラインが並行して走っています — 新しいコードが評価結果を必要とする場合、「今見えているものの値が欲しいのか」(`evaluatedResults`)か「シーン全体・ボディスケールのように常にトップレベル視点が必要なのか」(`rootEvaluatedResults`)を区別すること。

### 3つ目の評価パイプライン: 親スコープ視点(`parentScopeEvaluatedResults`)

`groupInput` ノードの各ソケットは、外部から値が配線されていてもいなくても、`evaluatedResults`(＝「今開いている階層」の評価)の上では常に未接続時のデフォルト値にしかならない — グループの中に入る操作自体が `nodes/definitions/groupNodeFactory.ts` の `evaluate()` が担う外部入力の注入(`data.injected` への一時パッチ)を素通りし、内部の `nodes`/`edges` を直接 `evaluateGraph()` に渡すだけだから。「今、外部から実際に何が配線されているか」を `GroupInputNode.tsx` のカード上に表示するために、`state/useParentScopeEvaluatedGraph.ts` が3つ目の小さなパイプラインとして常時マウントされている: `scopeStack` の最後のフレーム(＝今入っているグループより1階層上の nodes/edges のスナップショット)を評価し、結果を `parentScopeEvaluatedResults` に書き込む(トップレベルにいる間は `null`)。`nodes/evaluateGraph.ts` の `resolveIncomingValue(edges, results, targetId, targetHandle)` で、そのフレームの `edges` からグループノード自身(`frame.parentId`)の該当ソケットへの接続を1本引き、接続元の評価値を取り出す。

グループの中に別のグループがネストしている(多段ネスト、`composeRootGraph.test.ts` の「多段ネスト」節が示す通りネスト自体は既に成立している)場合、直上の親スコープを単純に評価するだけでは不十分 — 親スコープ自身がさらに外側のグループの中にあり、親スコープの `groupInput` が未接続時のデフォルトのまま評価されてしまうと、そこから伝播する値が不正確になる。そのため `useParentScopeEvaluatedGraph.ts` 内の `evaluateScopeChain()` は `scopeStack` をトップレベル(0番目、常に外部からの未解決入力を持たない)から直上の親スコープまで**順に**評価し、各階層で見つかった `groupInput` ノードには「1つ前の階層の評価結果から見た実際の配線値」を `data.injected` として都度パッチしてから評価する(`groupNodeFactory.ts` の `evaluate()` が行う注入パッチと同じ考え方を `scopeStack` のスナップショット列に対して再現したもの)。`groupInput` という型名は `nodes/definitions/groupInput.ts` に依存せず文字列リテラルと `data.sockets` の構造的な形だけで見ている(`graphStore.ts` の `GroupNodeDataShape` と同じ方針)。

## 初期状態への復帰: initialGraph.ts と「初期状態(デフォルト)」プリセット

`state/initialGraph.ts` は `initialNodes`/`initialEdges`(プリセットや GraphIO の Export/Import と同じ `{ nodes, edges }` 形状)を直接 TypeScript のオブジェクトリテラルとして持ちます。設計意図(シードノードの慣例、bodyBuild 乗算、socks の再引きなど)は各ノードのそばにインラインコメントとして書かれているため、ノードを編集する際は近くのコメントが古くならないよう合わせて見直してください。

`bodyBuild`(`bodyDimensions` への配線に加え、半径スケーリングに使う12グループ — skirt/pants/belt/gloves/scarf/jacket/socks/shoes/dress/top/necktie/bag — へも直接配線される)は、複数グループにまたがって配線される「共有ノード」としてトップレベルに残っています(pants/shoes/socks の脚の間隔は bodyGroup の脚と同じ `bodyDimensions.legSpacing` を、gloves の腕の間隔は bodyGroup の腕と同じ `bodyDimensions.shoulderSpacing` を、hat のつばと glasses の前面の深さは bodyGroup の頭と同じ `bodyDimensions.headRadius`(hat は倍率を掛け、glasses は定数を引いたもの)を受け取ります)(パターンの詳細は [`src/nodes/CLAUDE.md`](../nodes/CLAUDE.md) の「値が複数グループで共有される場合」節)。それ以外の各ガーメント固有のパラメータ(半径・長さ・色など)は、対応する `<name>GroupNode.ts` のテンプレート内にノードの入力欄の値として(複数のノードが共有する値だけ `numberInput`/`colorInput` ノードとして)直接組み込まれており、そのガーメントのグループの中に入って初めて編集できます。

`initialNodes` の `position` はノード定義には持たせず、モジュール読み込み時に `computeAutoLayout()`(Arrange ボタンと同じ関数)で算出する(ノードタイプの登録内容に依存するため `initialGraph.ts` 自身が `nodes/definitions` を読み込む)ので、構成を変えても座標を手で更新する必要は無い。

プリセット(`state/presetStore.ts`)は `scope` を持ち、`PresetPanel.tsx` は今開いている階層に合うものだけを一覧に出す。トップレベルでは `scope` なし(グラフ全体)、グループの中に入っている間は今開いているグループの型名(`scopeStack` の最後のフレームの親ノードの `type`、例: `skirtGroup`)で、同じ型のグループの内部グラフだけを保存・読み込みできる(同名は同じ `scope` 内でだけ上書き)。グループの中では「初期状態(デフォルト)」がそのグループ型のテンプレート(`createDefaultData()`)になり、内部編集を捨ててテンプレートへ戻す用途を兼ねる。ストアの `nodes`/`edges` が「今開いている階層」の内部グラフに差し替わる仕組み(上記)のため、保存・読み込みのロジック自体は階層によらず同じ。

`editor/PresetPanel.tsx` はこの `initialNodes`/`initialEdges` を、`usePresetStore` に保存されたユーザープリセットとは別に「初期状態(デフォルト)」という擬似プリセット(固定ID `__initial__`、常にドロップダウン先頭に表示、削除不可)としてロード可能にしています。上記の「リロード後は Undo で戻せない」問題への対処として、ユーザーはこのプリセットを選んで Load することでいつでも初期グラフに戻せます。

