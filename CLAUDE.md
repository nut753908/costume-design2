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

### ノードグラフエンジン (`src/nodes/`)

React Flow (`src/editor/`) は UI の状態(ノードの位置、選択、ドラッグ)のみを保持します。実際の計算は、React Flow について何も知らない別の純粋関数レイヤーが担当します。

- `nodes/types.ts` — ソケットの型システム(`SocketType`: number/color/enum/geometry/material)と `NodeTypeDefinition`(`inputs`/`outputs` ソケットと `evaluate(inputs, data) -> outputs` 関数を宣言)。`GraphNode`/`GraphEdge` もここで定義されており、React Flow 自身の `Node`/`Edge` 型から切り離された最小限の形になっているため、evaluator は UI ライブラリなしでも利用・テスト可能です。
- `nodes/registry.ts` — `registerNodeType()` / `getNodeType()`。すべてのノードタイプ(入力、ジェネレーター、マテリアル、出力)はここに自身を登録します。`src/nodes/definitions/*.ts` が実際のノードタイプの実装であり、`definitions/index.ts` がそれらすべてを副作用インポートしてレジストリを埋めます。
- `nodes/evaluateGraph.ts` — evaluator 本体。ノードをトポロジカルソートし(Kahn のアルゴリズム、循環がある場合は `GraphCycleError` を投げる)、順番に各ノードの `evaluate()` を評価します。**未接続の入力ソケットは、そのノード自身のリテラルな `data[socketId]` の値にフォールバックします** — これは Geometry Nodes で未接続のソケットがウィジェットのデフォルト値を使うのと同じ挙動であり、単独の(未接続の)ノードでも動作するようにするための中心的な仕組みです。
- 出力カテゴリのノード(例: `garmentOutput`)には下流のソケットがなく、その `evaluate()` の戻り値は他のノードに消費されるのではなく、Scene から直接読み取られます。

### リアクティビティ: ノードをドラッグしても evaluator が再実行されない理由

`state/selectors.ts` (`useNodesLite`/`useEdgesLite`) は React Flow の揮発性フィールド(position、selected、dragging)を取り除き — これが重要な点ですが — それらの揮発性フィールドのみが変化した場合には**同一の配列参照**を返します。これは ref にキャッシュした手動の等価性チェックによるものです(最初に試した zustand の `useShallow` ではありません。これは新しくマップされたオブジェクトに対して一階層のみの `Object.is` 比較を行うため、無限レンダーループを引き起こしました)。`state/useEvaluatedGraph.ts` はこれらの安定した参照を持つ配列を `useMemo(() => evaluateGraph(...))` に渡すため、ジオメトリ/マテリアルの再計算はノードの*データ*やエッジが実際に変化したときにのみ発生し、ドラッグ中やフレームごとには発生しません。これはシーンペイン右下に表示される `evaluations: N` カウンターで実際に確認できます。

### カスタムガーメントジオメトリ (`src/geometry/`)

ガーメントは全15種類(skirt/top/sleeve/pants/shoes/gloves/hat/belt/scarf/jacket/socks/dress/bag/necktie/glasses)あり、いずれも `build*Geometry(params) -> THREE.BufferGeometry` という純粋関数として実装されています。共有ヘルパー:

- `latheProfile.ts` — `buildEasedLatheProfile()`。アンカー側から反対側の端まで、半径を smoothstep でイージングしながら結ぶプロファイル点列を生成する。大半のガーメント(skirt/pants/shoes/gloves/hat/belt/jacket/socks など)はこれを `THREE.LatheGeometry` に渡すだけの単純な回転体。
- `mirrorPair.ts` — `buildMirroredPairGeometry()`。左右対称なパーツ(脚・靴・手袋・靴下)を build() でそれぞれ独立に構築し、±offset だけ X方向に平行移動して1つの BufferGeometry にまとめる。
- `neckline.ts` — `necklineWeight()`。角度ごとのネックライン落ち込み量(round/v/square)を計算する、top.ts と dress.ts で共有するフォールオフ関数。
- `alignedBox.ts` — `buildAlignedBox()`。2点間を結ぶよう回転+平行移動した `THREE.BoxGeometry` を作る(bag.ts のストラップ、glasses.ts のブリッジ/テンプルが使用)。回転+平行移動のみの剛体変換なので、標準プリミティブが元々持つ正しい巻き順がそのまま保たれる。

放射対称な Lathe では表現できない形状は、それぞれ別の技術で構築しています:

- `top.ts`/`dress.ts` — Lathe/Extrude では**ない**。ネックラインの落ち込みは放射対称ではないため。角度×高さのリングからなる手組みの `BufferGeometry` で、最上段のリングの頂点のみを角度ごとに(`neckline.ts` のフォールオフ関数で重み付けして)引き下げてネックラインを彫り込みます。`dress.ts` はこれに `latheProfile.ts` のイージング済み半径プロファイルを組み合わせ、肩(torsoRadius)から裾(hemRadius)まで半径が変化する1続きの形状にしています。
- `sleeve.ts` — 肩の各角度ごとにローカルな(外向き、接線、従法線)フレーム内で構築された、テーパー状の短い2本のチューブで、トルソーの壁面に食い込ませて重ねたままにしています(`body.ts` が腕に対して使っているのと同じ、意図的な交差を許容するアプローチで、ブーリアン演算や穴あけは行いません)。top と同じ `shoulder` アンカーに取り付けられ、通常は top の `toonMaterial` ノードを共有するように配線されます(1つの Color/Material ノードから2つの Garment Output へのファンアウト)。これにより top の色を変えると sleeve も一緒に再着色されます。
- `necktie.ts` — sleeve.ts と同じ「行=長さ方向、列=断面の周」という手組みチューブの考え方を、円形断面ではなく矩形の4隅に置き換えたもの。
- `bag.ts`/`glasses.ts` — `body.ts` と同じく THREE.js 標準プリミティブ(BoxGeometry/TorusGeometry)を使い、頂点を手組みせず `alignedBox.ts` で整列・配置するだけで組み立てる。
- `body.ts` — マネキン用のカプセル/球/円柱プリミティブ。純粋関数(`computeBodyDimensions`/`computeBodyLayout`/`computeBodyAnchors`)をエクスポートしており、静的定数ではありません — 寸法は `BodyScaleParams` (`heightScale`/`buildScale`/`shoulderScale`) から算出されるため、ボディメッシュとガーメントが取り付く `waist`/`shoulder`/`feet`/`wrist`/`head` アンカーのいずれも、ボディのリサイズに合わせて一緒に動きます。

**すでに一度踏んだ落とし穴(新しいジオメトリを追加すると再びハマります):**

- 三角形の巻き順(winding order)は重要で、逆になりやすいです。しかも視覚的な症状は分かりやすい「裏返って見える」ではなく、ガーメントが**真っ黒なシルエット**としてレンダリングされる(端に本来の色がわずかに見えることもある)というものです。これは、実際の `FrontSide` メッシュが(誤って)カリングされると、アウトラインメッシュの `BackSide` 専用の面だけが唯一の可視面になってしまうために起きます。新しい手続き型メッシュが真っ黒にレンダリングされたら、まずマテリアルやライティングではなく三角形の巻き順を確認してください。`windingTestHelpers.ts` の `expectOutwardWinding()` で自動検証できますが、対象が単純な放射対称形状でない場合は既定の axisPoint(Y軸基準)では誤検知します — 箱(BoxGeometry)には自身の中心点、トーラス(TorusGeometry)には中心線円上の最近点というように、形状に応じた正しい基準点を渡す必要があります(`bag.test.ts`/`glasses.test.ts` 参照)。
- `mergeGeometries()`(`three/examples/jsm/utils/BufferGeometryUtils.js`)は、結合するすべてのジオメトリが**同じ頂点属性**(名前・itemSize)を持っていることを要求します。標準プリミティブ(position/normal/uv を持つ)と手組みの `BufferGeometry`(position のみ)を混ぜて結合しようとすると、警告を出して `null` を返し、その後の呼び出しが `Cannot read properties of null` で落ちます(`necktie.ts` で遭遇 — 手組み側にダミーの `uv` 属性を追加して解消)。
- アンカーは体の中心線(x=0, z=0)上の1点のみです。体の前面より前に出すべきアクセサリ(ネクタイ、バッグ、メガネなど)は、z=0 付近に置くとガーメントの壁の内側/裏側に埋もれて見えなくなります(`bag.ts`/`necktie.ts`/`glasses.ts` の `*_DEPTH`/`*_FRONT_DEPTH` 系の定数を参照)。さらに、デフォルトグラフのように複数のガーメントが同じアンカーを同時に共有していると、後から広がる大きなガーメント(dress/jacket など)が薄いアクセサリ(necktie/bag など)を覆い隠すことがあります — これはバグではなく、複数の出力ノードが同じアンカーを共有する際の一般的な特性です(下記「シーン組み立て」参照)。

### レンダリング (`src/rendering/`)

- `gradientTexture.ts` — すべての `MeshToonMaterial` の `gradientMap` として使われる、共有の4段階 `DataTexture`(キャッシュされたシングルトン)。これによりすべてのガーメント/ボディが同一のセルシェーディングの帯を共有します。
- `Outline.tsx` — イラスト調のアウトライン: インバーテッドハル(法線を反転させた拡大複製)手法(ジオメトリを複製し、`BackSide` の暗い `MeshBasicMaterial` を約2%拡大して適用)。ポストプロセッシングのパイプラインは使用していません。`ToonMesh.tsx` はメッシュとそのアウトラインを1つのユニットとしてペアにします。
- レンダラーは色をフラットでポスターのような見た目に保つため、`THREE.NoToneMapping` を使用し、環境マップは使用していません。

### シーン組み立て (`src/scene/`)

`Scene.tsx` は `Body`(静的)と `Garments`(動的)をレンダリングします。`Garments.tsx` はグラフ内の**すべてのノード**を走査し、評価結果に(特定のノードタイプに限らず)`geometry` + `material` キーがあるかを確認し、あれば `garmentOutput` の evaluate 出力で指定されたアンカー(`anchor`/`offsetY`)に `ToonMesh` をマウントします。つまり、将来的に評価結果として `{geometry, material, anchor, offsetY}` を返すノードタイプが追加されれば、Scene 側の登録なしに自動的にレンダリングされます。複数の出力ノードが同じアンカーを共有することもでき(top と sleeve はどちらも `shoulder`)、その場合は単に重なり合う別々のメッシュとしてレンダリングされます。

### 新しいノードタイプの追加

手順は `add-node-type` スキルを参照してください。

### ボディスケールはソケットグラフを迂回して直接読み取られる

`state/useBodyScale.ts` は、慣例的な ID を持つ3つのシードノード(`bodyHeight`/`bodyBuild`/`bodyShoulder` — 新しいノードタイプではなく、普通の `numberInput` ノード)を、`evaluateGraph` を完全に迂回して zustand ストアから **id で直接**読み取ります。これは「すべてはソケットを介して流れる」というパターンに対する意図的な例外です。ボディスケールはガーメントの `{geometry, material}` 出力ではなく、`Body.tsx` と `Garments.tsx`(アンカー位置のため)の両方が合意する必要のあるシーン全体のパラメータであり、「シーン全体に影響する」構造的な値を表すソケットタイプは存在しないためです。これら3つのノードが削除された場合は `DEFAULT_BODY_SCALE` (1, 1, 1) にフォールバックします。

ガーメント自身の半径スライダーは、ソケットグラフを迂回する `useBodyScale.ts` とは違い、**通常のソケット配線**を使って `bodyBuild` に追従させています。各ガーメントの「体に触れる半径」(skirt/pants/belt の waist 半径、top/jacket/scarf の shoulder 側半径、gloves の wrist 半径、shoes の sole 半径、socks の ankle 半径)は、既存の汎用 `numberMultiply` ノードを間に挟んで `bodyBuild.value` を掛けてから生成ノードに渡しており(例: `skirtWaist → skirtWaistScale(×bodyBuild) → skirtGen.waistRadius`)、ボディをリサイズすると自動で追従します。裾の広がりやバックルの膨らみなど「体に触れる半径」から式で導出される二次的な半径(skirt の hemRadius、belt の bulgeRadius など)は、その導出元がスケールされることで自動的に一緒にスケールされます。一方、hand/cuff/calf/brim/crown 半径のような独立したスタイル寄りの半径や、`hat`(`headRadius` はそもそも `computeBodyDimensions` で `buildScale` の影響を受けない)は意図的にスケール対象外です。長さ系のスライダー(skirt の length、sleeve の length など)は引き続きユーザー調整に委ねています。

### Undo/Redo

`state/graphStore.ts` は `past`/`future` の2つのスナップショットスタック(`{nodes, edges}`)を持ち、Ctrl+Z / Ctrl+Shift+Z(または Ctrl+Y)と `HistoryControls.tsx` のボタンで操作できます。すべての変更操作(`onNodesChange` の remove、`onEdgesChange` の remove、`onConnect`、`addNode`、`updateNodeData`)は、実際に `set()` する前に内部ヘルパー `pushHistory(key?, coalesceMs?)` を呼びます。

スライダー/カラーピッカーのドラッグは `updateNodeData` を1ジェスチャーあたり何十回も連続発火させるため、`key`(`data:${id}` など)と `coalesceMs` を指定すると、直前のプッシュから `coalesceMs` 以内・同じ `key` での呼び出しはスタックに新規エントリを積まず「同じジェスチャーの続き」として吸収されます(タイムスタンプだけ更新)。ノードのドラッグ移動は `dragging` フラグの立ち上がりエッジ(`_dragging` 内部状態)で1ドラッグ=1エントリに区切っており、こちらは時間ベースのコアレッシングを使っていません。`past`/`future` は localStorage に永続化されず(`partialize` は `nodes`/`edges` のみ)、`loadGraph`(JSON インポート/プリセット読み込み)は履歴をクリアします。

### ノードグラフの操作(エディタUX)

- ノードの追加方法は3通りあります: (1) パレット(`NodePalette.tsx`)の項目をクリックするとカスケード状のオフセットで追加、(2) パレットの項目をキャンバスへドラッグ&ドロップすると、ドロップした座標に追加、(3) キャンバスを右クリックするとその場に `ContextMenu.tsx` が開き、選んだノードタイプがクリック位置に追加されます。いずれも最終的には `useGraphStore().addNode(type, position)` を呼び出しており、位置の変換には React Flow の `screenToFlowPosition` を使っています(そのため `NodeEditor.tsx` は `ReactFlowProvider` で自身をラップし、内側のコンポーネントで `useReactFlow()` を呼ぶ構成になっています)。カテゴリ別のノードタイプ一覧は `nodes/registry.ts` の `groupNodeTypesByCategory()` に共通化されており、パレットとコンテキストメニューの両方がこれを参照します。`NodePalette.tsx` 上部の検索ボックスでラベルの部分一致による絞り込みもできます。
- ノード削除は各ノードカードのタイトル行にある×ボタン(`NodeTitleBar`)、エッジ削除はエッジ中央に表示される×ボタン(`DeletableEdge`)から行えます。選択後の Backspace による削除(React Flow のデフォルト)も引き続き使えます。ノードを右クリックすると `NodeContextMenu.tsx` が開き、選択中のノード(複数選択中ならその選択全体、右クリックしたノードが未選択ならそのノード単体)に対して複製/コピー/削除を実行できます。
- キーボードショートカット: `Ctrl+D` で選択ノードを複製、`Ctrl+C`/`Ctrl+V` でコピー&ペースト(選択範囲の内部エッジのみ複製し、外部への接続は複製しない。連続ペーストはオフセットがカスケードする)、`Ctrl+Z`/`Ctrl+Shift+Z`(または `Ctrl+Y`)で Undo/Redo。テキスト入力中はこれらのショートカットをブラウザ/入力欄のネイティブな挙動に譲ります(`editor/keyboardGuards.ts` の `isEditableTextTarget`、`HistoryControls.tsx` と `NodeClipboard.tsx` で共有)。
- `GraphIO.tsx` の「Arrange」ボタンは `nodes/autoLayout.ts` の `computeAutoLayout()` を呼び、入力→中間→出力へのトポロジカルな層(最長経路)に沿ってノードを自動整列します。このアプリのグラフは入力ノードが1つの層に大量に集まる星型に近い形になりやすいため、1層あたり最大14行を超えたら次のサブ列に折り返し、極端に縦長にならないようにしています。React Flow 標準の `MiniMap` でキャンバス全体を俯瞰できます(右下、ペインが狭いため小さめのサイズに調整)。
