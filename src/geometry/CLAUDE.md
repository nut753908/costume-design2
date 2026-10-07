# src/geometry/ のガイダンス

全体のアーキテクチャ概要(手続き的生成・外部アセット不使用という制約を含む)は[ルートの CLAUDE.md](../../CLAUDE.md)を参照してください。

## カスタムジオメトリ

ボディ(`bodyGroup`)と今後作るガーメントは、専用の `build*Geometry()` を持たず、既存の汎用ノードの組み合わせだけで完全にノードグラフ上に表現する。共有ヘルパー:

- `latheProfile.ts` — `EasedLatheCurve`(`THREE.Curve<Vector2>`)。アンカー側から反対側の端まで、半径を smoothstep でイージングしながら結ぶ `(半径, 高さ)` のプロファイルの曲線で、点列は受け取る側が `getPoints(steps)` で取り出す。この関数呼び出しはノードグラフ側の汎用ノード `easedLatheCurve`(`nodes/definitions/generic/easedLatheCurve.ts`)+`latheGenerator`(`nodes/definitions/generic/latheGenerator.ts`、生の `THREE.LatheGeometry` ラッパー)へ切り出されている。この2ノードの間を流れる値(`(半径, 高さ)` の曲線)には `nodes/types.ts` の `SocketType`/`SocketValue` に `'curve'` という専用の型がある(`nodes/CLAUDE.md` 参照)。プロファイルの分割数 `Profile Steps` は `latheGenerator`/`ringGridGenerator` 側のカード上の入力欄で、向きは `easedLatheCurve` の出力ソケット `Curve Up`/`Curve Down` のどちらを配線するかで選ぶ(数値の `direction` は持たない)。曲線を Y方向にだけ平行移動する `translateCurveY`、2つの曲線を前半・後半につなぐ `concatCurve`、`numberMax` などの二項演算ノードを組み合わせると、半径の導出式を可視の配線として展開できる。非一様スケール(例: `.scale(1, 1, toeLength)`)は `scale`(X/Y/Z を持つ汎用ノード、`translate` と対になる形、`nodes/definitions/generic/scale.ts`)の入力欄で行う。同じファイルの `EllipticLatheCurve` は、アンカー側で水平・反対端で垂直になる楕円の 1/4 の曲線(`ellipticLatheCurve` ノード)で、肩の丸みのように端を水平に閉じる形に使う(smoothstep だと端が短い垂直の筒になる)。
- 左右対称なパーツ(Body の腕/脚1組、耳)の「±offset だけ平行移動して結合する」処理は、`geometry/` 側の専用関数としては存在しない。ノードグラフ上の `translate`(`translate.ts`、X だけを配線)+`mirrorX`(`mirrorX.ts`、+側を X=0 について鏡像反転して -側にする)+`mergeGeometry`(`mergeGeometry.ts`、`mergeGeometries()` を切り出した汎用ノード)を内包するグループノード `mirrorPair`(`nodes/definitions/generic/mirrorPair.ts`)へ統一されている。
- `splineProfile.ts` — `SplineProfileCurve`。等間隔の高さに置いた制御半径を、半径の2乗に対する曲率連続の3次スプライン(両端は2次式で打ち切る)でつなぐ `(半径, 高さ)` のプロファイル曲線。半径 0 の端は球の極のように丸く閉じる(半径そのものを補間すると円錐のようにとがる)。単調性を保つ補間(PCHIP)は極値の点で傾きが 0 になり曲率も不連続なので、少ない制御点だと輪郭が箱のように角ばる。`profileCurve` ノードが使い、`torsoShape`(胴体の幅・前後の輪郭)が `loftGenerator` と組み合わせて使う。
- `splineProfile.ts` の `SignedSplineCurve` は、符号付きの制御値(輪の前後のずらし量など)を値そのものに対する3次スプラインでつなぐ `(値, 高さ)` の曲線。`signedProfileCurve` ノードが使う。
- `neckline.ts` — `necklineWeight(weights, angle)`。ノードグラフ側で作られた落ち込み量の曲線(正面からの角度を 0〜1 に正規化した値を x、重みを y とする曲線(`THREE.Curve<Vector2>`、`functionCurve.ts` の `FunctionCurve`)。`rampCurve` と `Scale/Translate/Multiply Curve Y` で作る)を、角度の位置で評価して返す、`ringGrid.ts` が使うフォールオフ関数。正面から±90° を超えると常に0。
- `ringGrid.ts` — `buildRingGridGeometry()`。角度×高さのリングからなる手組みの `BufferGeometry` を、行ごとの半径/Y座標のリストから組み立て、角度ごとに「最上段から `necklineDepth` × 重み(`necklineWeights`(落ち込み量の曲線)を `neckline.ts` のフォールオフ関数で角度ごとに引いたもの)だけ下がった線」より上にある行の頂点を、その線上の点(半径は上下の行から補間)へ寄せてネックラインを彫り込む。最上段だけを下げる方式だと、肩の丸みで行の間隔が狭い所では下の行を越えて面が折り返す。`nodes/definitions/generic/ringGridGenerator.ts` がノードグラフへ薄く配線し。
- `taperedTube.ts` — `buildTaperedTube()`。始点から終点まで、両端の断面(幅×厚み、楕円または矩形)を直線的に補間する、キャップ無しの2リングのチューブ。軸が Y と平行でなければ断面の幅方向(tangent)は水平、そうでなければ +X(`tubeFrame()`)。`nodes/definitions/generic/taperedTubeGenerator.ts`(断面の形ごとに `taperedEllipseTubeGenerator`/`taperedRectTubeGenerator` の2ノードを登録する)がノードグラフへ薄く配線する(`curve` 型を扱う `latheGenerator.ts` と同じ理由で `defineGeneratorNode()` ではなく直接 `registerNodeType()` で定義)。頂点属性は position/normal のみ(uv 無し、`mergeGeometry` が uv の有無の違いを吸収する)。
- `alignedBox.ts` — `buildAlignedBox()`。2点間を結ぶよう回転+平行移動した `THREE.BoxGeometry` を作る。回転+平行移動のみの剛体変換なので、標準プリミティブが元々持つ正しい巻き順がそのまま保たれる。`nodes/definitions/generic/alignedBoxGenerator.ts` がノードグラフへ薄く配線する(始点・終点をそれぞれ X/Y/Z の3ソケットに分解しているのは、座標を求める四則演算チェーンを可視の配線として展開できるようにするため。`curve` 型を扱う `latheGenerator.ts` と同じ理由で `defineGeneratorNode()` ではなく直接 `registerNodeType()` で定義している)。斜めの細長い箱(ストラップなど)に使える。

放射対称な Lathe では表現できない形状は、それぞれ別の技術で構築しています:

- マネキンのボディの寸法と位置は `geometry/` 配下の純粋関数としては存在しません。寸法(各部位の半径・長さ・間隔)は `bodyGroupNode.ts` の外部ソケットの既定値のリテラル、胴体・頭・腕・脚のY座標はその寸法から内部の `bodyLayout`(`nodes/definitions/generic/bodyLayout.ts`)が求めます。ガーメントの取り付け位置は、各ガーメントの `placement`(`translate`)の `y` の固定値にします(ボディの寸法とは連動しない)。

**すでに一度踏んだ落とし穴(新しいジオメトリを追加すると再びハマります):**

- 三角形の巻き順(winding order)は重要で、逆になりやすいです。逆になると手前側の面が `FrontSide` のカリングで消え、奥側の面の内側だけが見える(形が欠けて見える/陰影がおかしい)状態になります。新しい手続き型メッシュがそう見えたら、まずマテリアルやライティングではなく三角形の巻き順を確認してください。`windingTestHelpers.ts` の `expectOutwardWinding()` で自動検証できますが、対象が単純な放射対称形状でない場合は既定の axisPoint(Y軸基準)では誤検知します — 箱(BoxGeometry)には自身の中心点、トーラス(TorusGeometry)には中心線円上の最近点というように、形状に応じた正しい基準点を渡す必要があります(`alignedBox.test.ts` 参照)。
- `mergeGeometries()`(`three/examples/jsm/utils/BufferGeometryUtils.js`)は、結合するすべてのジオメトリが**同じ頂点属性**(名前・itemSize)を持っていることを要求します。標準プリミティブ(position/normal/uv を持つ)と手組みの `BufferGeometry`(position のみ)を混ぜて結合しようとすると、警告を出して `null` を返し、その後の呼び出しが `Cannot read properties of null` で落ちます(`mergeGeometry` ノードは uv の有無だけが違う場合、入力を clone して uv を外してから結合し直すため、`boxGenerator` と `taperedRectTubeGenerator` のような組み合わせを普通に繋げる)。 `mergeGeometry` ノードは結合後に法線を計算し直さず入力の法線を使う(`loftGenerator` が継ぎ目・極で平均した法線を保つため。計算し直すと頭の正面の継ぎ目に陰影の縦の段差が出る)。
- ガーメントの取り付け位置は体の中心線(x=0, z=0)上の1点のみです。体の前面より前に出すべきアクセサリ(ネクタイ、バッグ、メガネなど)は、z=0 付近に置くとガーメントの壁の内側/裏側に埋もれて見えなくなるので、胴体半径などに応じた固定の深さを前へ与えます。さらに、複数のガーメントを同時に着せると、後から広がる大きなガーメントが薄いアクセサリを覆い隠すことがあります — これはバグではなく、重なる別々のメッシュとしてレンダリングされる一般的な特性です(`src/scene/CLAUDE.md` の「シーン組み立て」参照)。
