# src/editor/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## ノードグラフの操作(エディタUX)

- **カードの高さの見積もりを実機と一致させる**: Arrange(`nodes/autoLayout.ts` の `estimateNodeHeight()`)はカードの高さを見積もって配置するので、ずれるとノード同士が重なる。カードの見た目(`nodeEditor.css`、`nodeComponents/*.tsx`)を変えたら `node .claude/skills/run-costume-design2/check-card-heights.mjs` で全ノードタイプの実機の高さと見積もりを比べ、ずれたら `autoLayout.ts` の定数を直す。専用のカード UI を持つノードを増やすときは `nodes/customCardTypes.ts` の `CUSTOM_CARD_TYPES` に追加する。未接続ソケットの入力欄(`SocketField.tsx`)は行の高さに収まるので、欄の有無でカードの高さは変わらない。
- **複数接続できる入力ソケット**(`SocketDef.multiple`)のカプセルの寸法は `nodes/multiInputSocket.ts` にまとめ、カード(`InputHandle.tsx`・`GenericNode.tsx`)と Arrange の見積もりで共有する。刺さる位置のずれは `SocketEdge.tsx` が付ける(React Flow は既定で全エッジをハンドルの中心に刺す)ので、`edgeTypes` の `default` ごと `SocketEdge` に差し替えている。
- **接続済みの入力ソケットからエッジを掴む操作**は React Flow に無いので、`InputHandle.tsx` が `@xyflow/system` の `XYHandle.onPointerDown` を直接呼んで実現している。`@xyflow/system` は `@xyflow/react` が依存するのと同じバージョンに固定する(ずれると2重に読み込まれる)。`isConnectableStart={false}` のハンドルは React Flow の CSS で `pointer-events: none` になるため、`.rf-socket--pickup` で戻している。
- **`<ReactFlow>` には `key={scopePath}`(階層の経路)を付け、階層が変わるたびに再マウントする**。内部グラフどうしで同じノード id(`'input'` など)が使われるため、再マウントしないと React Flow のハンドル位置のキャッシュが古いままになり、エッジが描画されなくなる。深さではなく経路なのは、Undo/Redo で同じ深さのまま別のグループへ移りうるため。
- **`@xyflow/react` の `Panel` は同じ `position` のものを自動で並べない**(同じ座標に重なる)。パンくず・パレット・Undo/Redo・Export などは自身では `Panel` を持たず、`NodeEditor.tsx` の共有ラッパー `<Panel className="panel-stack ...">` の中に縦に積む。
- `fitView()` には常に `paletteShared.ts` の `fitViewPadding()` を渡す(左だけ固定 px。割合だけだと、列0に置かれる `groupInput` などが画面に固定されたパレットの下に隠れる)。
- **選択状態の枠は `nodeEditor.css` の `.react-flow__node.selected .rf-node` が付ける**(React Flow 既定の選択スタイルは組み込みのノードタイプにしか効かない)。新しい専用カードもルート要素に `rf-node` クラスを付けること。カード上のソケット・入力欄・ボタンの操作でノードが選択されないよう、全カードを `nodeComponents/withControlClickGuard.tsx` で包んでいる。
- テキスト入力中はショートカット(複製・コピペ・Undo/Redo)をブラウザ/入力欄のネイティブな挙動に譲る(`keyboardGuards.ts` の `isEditableTextTarget`)。
