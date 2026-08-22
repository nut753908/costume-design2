import type { Node, Edge } from '@xyflow/react';
import initialGraphData from './initialGraph.json';

// 実データは initialGraph.json(プリセットと同じ { nodes, edges } 形式)に持たせている
// — PresetPanel.tsx が「初期状態」を通常のプリセットと同じ読み込み経路で扱えるようにするため。
// JSON はコメントを持てないため、データ本体に埋め込まれていた設計意図はここにまとめておく:
//
// - bodyHeight/bodyBuild/bodyShoulder/bodySkinColor は state/useBodyScale.ts・
//   state/useBodySkinColor.ts が id で直接読み取る慣例的なシードノード。エッジで
//   何にも配線されていない(ルート CLAUDE.md の「ボディスケールはソケットグラフを
//   迂回して直接読み取られる」を参照)。
// - sleeve を除く14種のガーメントは、各ガーメントの「numberMultiply(体に触れる半径が
//   あれば)+ generator + toonMaterial + garmentOutput」という3〜4ノードのパイプラインを
//   1枚の <name>Group ノード(nodes/definitions/groupNodeFactory.ts の defineGroupNode() で
//   定義、nodes/definitions/<name>GroupNode.ts)に集約している。生パラメータ
//   (numberInput/enumInput)と Color(colorInput)は引き続きこのファイルの外側のノードとして
//   残り、bodyBuild はグループノードの Body Build 入力ソケットへ直接配線される(乗算自体は
//   グループ内部に隠蔽される)。詳細は src/nodes/CLAUDE.md の「グループノード」節を参照。
// - sleeve だけはグループ化していない。topGroup の内部に埋没した topRadiusScale/topMaterial
//   相当の値(Body Build 適用後の Top 胴体半径・Top のマテリアル)を再引きしており、
//   defineGroupNode() は geometry/material 型の値を外部から注入する仕組みを持たないため
//   (number/color/enum のみ注入可能)。その代わり topGroup は `attachRadiusScaled`/`material`
//   という追加の出力ソケットを公開し、sleeve のエッジはそちらから引いている。
// - shoesGroup/socksGroup は pantsLegSpacing(pants の生パラメータノード、素の numberInput)を
//   外部入力として再引きしている。脚の間隔を変えると靴/靴下の間隔も一緒に追従する。
//
// ノードの position はガーメントごとに手作業で「読みやすいエッジになる」列テンプレートに
// 沿って配置している(nodes/autoLayout.ts の computeAutoLayout() を機械的に適用すると、
// 全ガーメントの入力ノードが1つの巨大な層にまとまり、バリセンター順の並び替えだけでは
// エッジがノード上を大量に横切ってしまうため、これは使っていない)。グループ化された
// ガーメント1つ分の列は左から x=0(param + colorInput、元の並び順のまま縦に並べる) →
// x=260(グループノード、param の先頭行と同じ y)の2列のみ。bodyBuild → 各グループの
// Body Build 入力という縦断的な配線は、この2列の間の余白だけを通るようにしている。
// sleeve だけは3列(x=520 param、x=780 sleeveGenerator、x=1040 garmentOutput)を持ち、
// topGroup の右隣(同じ y 範囲)に配置してクロスエッジを短く保っている。関連するガーメント
// 同士(top+sleeve、pants+shoes+socks)は縦にも隣接させている。
// 新しいガーメント種を追加する際は add-garment-type スキル・上記の慣例に従うこと。
export const initialNodes: Node[] = initialGraphData.nodes as Node[];
export const initialEdges: Edge[] = initialGraphData.edges as Edge[];
