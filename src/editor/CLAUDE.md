# src/editor/ のガイダンス

全体のアーキテクチャ概要は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## ノードグラフの操作(エディタUX)

- ノードの追加方法は3通りあります: (1) パレット(`NodePalette.tsx`)の項目をクリックするとカスケード状のオフセットで追加、(2) パレットの項目をキャンバスへドラッグ&ドロップすると、ドロップした座標に追加、(3) キャンバスを右クリックするとその場に `ContextMenu.tsx` が開き、選んだノードタイプがクリック位置に追加されます。いずれも最終的には `useGraphStore().addNode(type, position)` を呼び出しており、位置の変換には React Flow の `screenToFlowPosition` を使っています(そのため `NodeEditor.tsx` は `ReactFlowProvider` で自身をラップし、内側のコンポーネントで `useReactFlow()` を呼ぶ構成になっています)。カテゴリ別のノードタイプ一覧は `nodes/registry.ts` の `groupNodeTypesByCategory()` に共通化されており、パレットとコンテキストメニューの両方がこれを参照します。`NodePalette.tsx` 上部の検索ボックスでラベルの部分一致による絞り込みもできます。
- ノード削除は各ノードカードのタイトル行にある×ボタン(`NodeTitleBar`)、エッジ削除はエッジ中央に表示される×ボタン(`DeletableEdge`)から行えます。選択後の Backspace による削除(React Flow のデフォルト)も引き続き使えます。ノードを右クリックすると `NodeContextMenu.tsx` が開き、選択中のノード(複数選択中ならその選択全体、右クリックしたノードが未選択ならそのノード単体)に対して複製/コピー/削除を実行できます。
- キーボードショートカット: `Ctrl+D` で選択ノードを複製、`Ctrl+C`/`Ctrl+V` でコピー&ペースト(選択範囲の内部エッジのみ複製し、外部への接続は複製しない。連続ペーストはオフセットがカスケードする)、`Ctrl+Z`/`Ctrl+Shift+Z`(または `Ctrl+Y`)で Undo/Redo。テキスト入力中はこれらのショートカットをブラウザ/入力欄のネイティブな挙動に譲ります(`editor/keyboardGuards.ts` の `isEditableTextTarget`、`HistoryControls.tsx` と `NodeClipboard.tsx` で共有)。
- `GraphIO.tsx` の「Arrange」ボタンは `nodes/autoLayout.ts` の `computeAutoLayout()` を呼び、入力→中間→出力へのトポロジカルな層(最長経路)に沿ってノードを自動整列します。このアプリのグラフは入力ノードが1つの層に大量に集まる星型に近い形になりやすいため、1層あたり最大14行を超えたら次のサブ列に折り返し、極端に縦長にならないようにしています。React Flow 標準の `MiniMap` でキャンバス全体を俯瞰できます(右下、ペインが狭いため小さめのサイズに調整)。
