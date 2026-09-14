# src/geometry/ のガイダンス

全体のアーキテクチャ概要(手続き的生成・外部アセット不使用という制約を含む)は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## カスタムガーメントジオメトリ

ガーメントは全15種類(skirt/top/sleeve/pants/shoes/gloves/hat/belt/scarf/jacket/socks/dress/bag/necktie/glasses)あり、いずれも `build*Geometry(params) -> THREE.BufferGeometry` という純粋関数として実装されています。共有ヘルパー:

- `latheProfile.ts` — `buildEasedLatheProfile()`。アンカー側から反対側の端まで、半径を smoothstep でイージングしながら結ぶプロファイル点列を生成する。大半のガーメント(skirt/pants/shoes/gloves/hat/belt/jacket/socks など)はこれを `THREE.LatheGeometry` に渡すだけの単純な回転体。
- `mirrorPair.ts` — `buildMirroredPairGeometry()`。左右対称なパーツ(脚・靴・手袋・靴下)を build() でそれぞれ独立に構築し、±offset だけ X方向に平行移動して1つの BufferGeometry にまとめる。
- `neckline.ts` — `necklineWeight()`。角度ごとのネックライン落ち込み量(round/v/square)を計算する、`ringGrid.ts` が使うフォールオフ関数。
- `ringGrid.ts` — `buildRingGridGeometry()`。角度×高さのリングからなる手組みの `BufferGeometry` を、行ごとの半径/Y座標のリストから組み立て、最上段のリングの頂点のみを角度ごとに(`neckline.ts` のフォールオフ関数で重み付けして)引き下げてネックラインを彫り込む。`top.ts`/`dress.ts` が共有する。
- `alignedBox.ts` — `buildAlignedBox()`。2点間を結ぶよう回転+平行移動した `THREE.BoxGeometry` を作る(bag.ts のストラップ、glasses.ts のブリッジ/テンプルが使用)。回転+平行移動のみの剛体変換なので、標準プリミティブが元々持つ正しい巻き順がそのまま保たれる。

放射対称な Lathe では表現できない形状は、それぞれ別の技術で構築しています:

- `top.ts`/`dress.ts` — Lathe/Extrude では**ない**。ネックラインの落ち込みは放射対称ではないため。どちらも `ringGrid.ts` の `buildRingGridGeometry()` に「行ごとの半径/Y座標」のリストを渡すだけで、リング構築・インデックス組み立て・法線計算はそちらに任せている。`top.ts` は全行が torsoRadius で一定の半径リストを渡すだけ、`dress.ts` は `latheProfile.ts` のイージング済み半径プロファイルから半径リストを作ることで、肩(torsoRadius)から裾(hemRadius)まで半径が変化する1続きの形状にしている。
- `sleeve.ts` — 肩の各角度ごとにローカルな(外向き、接線、従法線)フレーム内で構築された、テーパー状の短い2本のチューブで、トルソーの壁面に食い込ませて重ねたままにしています(`body.ts` が腕に対して使っているのと同じ、意図的な交差を許容するアプローチで、ブーリアン演算や穴あけは行いません)。top と同じ `shoulder` アンカーに取り付けられ、`initialGraph.ts` ではトップレベルの共有ノード(`topRadiusScale`/`topMaterial`)から topGroup/sleeveGroup の両方へ同じ半径・同じ `toonMaterial` をファンアウトする配線になっている(1つの Color/Material ノードから2つの Garment Output へのファンアウト、`nodes/CLAUDE.md` の「グループノード」節参照)。これにより top の色を変えると sleeve も一緒に再着色される。
- `necktie.ts` — sleeve.ts と同じ「行=長さ方向、列=断面の周」という手組みチューブの考え方を、円形断面ではなく矩形の4隅に置き換えたもの。
- `bag.ts`/`glasses.ts` — `body.ts` と同じく THREE.js 標準プリミティブ(BoxGeometry/TorusGeometry)を使い、頂点を手組みせず `alignedBox.ts` で整列・配置するだけで組み立てる。
- `body.ts` — マネキンの寸法計算を担う純粋関数(`computeBodyDimensions`/`computeBodyLayout`/`computeBodyAnchors`)をエクスポートしており、静的定数ではありません — 寸法は `BodyScaleParams` (`heightScale`/`buildScale`/`shoulderScale`) から算出されるため、ボディメッシュとガーメントが取り付く `waist`/`shoulder`/`feet`/`wrist`/`head` アンカーのいずれも、ボディのリサイズに合わせて一緒に動きます。`computeBodyDimensions()`/`computeBodyLayout()` は `nodes/definitions/bodyDimensions.ts`/`bodyLayout.ts` がそのままノードグラフへ配線し(`garmentPlacement` が内部でアンカー計算に使うのと同じ関数)、`computeBodyAnchors()` は `garmentPlacement.ts` がガーメントのアンカー座標計算に使う — ボディメッシュ自身の組み立てとガーメントのアンカー計算は同じ寸法関数を共有しているため、両者がずれることは無い。
- `bodyParts.ts` — マネキン用のカプセル(胴体)/球(頭)/円柱(腕・脚、`mirrorPair.ts` で左右1組にまとめる)プリミティブを組み立てる `build*Geometry` 関数群。`nodes/definitions/bodyTorsoGenerator.ts`/`bodyHeadGenerator.ts`/`bodyLimbGenerator.ts` がノードグラフへ配線し、`bodyGroup`(`bodyGroupNode.ts`)が胴体/頭/腕/脚の4パーツとして描画する(旧 `scene/Body.tsx` が直接構築していたのと同じ形状、以前あった専用コンポーネントは削除済み)。

**すでに一度踏んだ落とし穴(新しいジオメトリを追加すると再びハマります):**

- 三角形の巻き順(winding order)は重要で、逆になりやすいです。しかも視覚的な症状は分かりやすい「裏返って見える」ではなく、ガーメントが**真っ黒なシルエット**としてレンダリングされる(端に本来の色がわずかに見えることもある)というものです。これは、実際の `FrontSide` メッシュが(誤って)カリングされると、アウトラインメッシュの `BackSide` 専用の面だけが唯一の可視面になってしまうために起きます。新しい手続き型メッシュが真っ黒にレンダリングされたら、まずマテリアルやライティングではなく三角形の巻き順を確認してください。`windingTestHelpers.ts` の `expectOutwardWinding()` で自動検証できますが、対象が単純な放射対称形状でない場合は既定の axisPoint(Y軸基準)では誤検知します — 箱(BoxGeometry)には自身の中心点、トーラス(TorusGeometry)には中心線円上の最近点というように、形状に応じた正しい基準点を渡す必要があります(`bag.test.ts`/`glasses.test.ts` 参照)。
- `mergeGeometries()`(`three/examples/jsm/utils/BufferGeometryUtils.js`)は、結合するすべてのジオメトリが**同じ頂点属性**(名前・itemSize)を持っていることを要求します。標準プリミティブ(position/normal/uv を持つ)と手組みの `BufferGeometry`(position のみ)を混ぜて結合しようとすると、警告を出して `null` を返し、その後の呼び出しが `Cannot read properties of null` で落ちます(`necktie.ts` で遭遇 — 手組み側にダミーの `uv` 属性を追加して解消)。
- アンカーは体の中心線(x=0, z=0)上の1点のみです。体の前面より前に出すべきアクセサリ(ネクタイ、バッグ、メガネなど)は、z=0 付近に置くとガーメントの壁の内側/裏側に埋もれて見えなくなります(`bag.ts`/`necktie.ts`/`glasses.ts` の `*_DEPTH`/`*_FRONT_DEPTH` 系の定数を参照)。さらに、デフォルトグラフのように複数のガーメントが同じアンカーを同時に共有していると、後から広がる大きなガーメント(dress/jacket など)が薄いアクセサリ(necktie/bag など)を覆い隠すことがあります — これはバグではなく、複数の出力ノードが同じアンカーを共有する際の一般的な特性です(`src/scene/CLAUDE.md` の「シーン組み立て」参照)。
