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
// - 全15種のガーメントは、各ガーメントの「(生パラメータの numberInput/enumInput/
//   colorInput) + numberMultiply(体に触れる半径があれば) + generator + toonMaterial +
//   garmentOutput」という一連のパイプラインを1枚の <name>Group ノード(nodes/definitions/
//   groupNodeFactory.ts の defineGroupNode() で定義、nodes/definitions/<name>GroupNode.ts)に
//   集約している。生パラメータと Color は他のガーメントと共有されない単独パラメータのため、
//   このファイル(トップレベル)には存在せず、<name>GroupNode.ts の internalNodes に
//   groupInput ノードと並べて直接書かれている(グループの中に入って初めて編集できる)。
//   bodyBuild(全ガーメント共有)だけがこのファイル側の外部ノードとして残り、各グループの
//   Body Build 入力ソケットへ直接配線される(乗算自体はグループ内部に隠蔽される)。詳細は
//   src/nodes/CLAUDE.md の「グループノード」節を参照。
// - topGroup/sleeveGroup は Torso Radius(Body Build 適用後のスケール済みの値)と Material を
//   共有している — sleeve は Top と同じ生地・同じ太さで縫い付けられているように見せる必要が
//   あるため。この2つの値は topGroup/sleeveGroup どちらの内部にも置かず、このファイル側の
//   共有ノード(topRadius/topColor/topRadiusScale/topMaterial)として持ち、両方のグループへ
//   ファンアウトしている。かつては topGroup の内部にこの2つを計算するノードを持ち、
//   `groupOutput` 経由で sleeve だけに再公開していたが、「本来共有すべき値が一方のグループの
//   中に閉じ込められている」という設計上の問題があったため、bodyBuild/pantsLegSpacing と同じ
//   「共有ノードをトップレベルに置いて複数グループへ配線する」形に改めた。
// - shoesGroup/socksGroup は pantsLegSpacing(pants の生パラメータノード、素の numberInput)を
//   外部入力として再引きしている。脚の間隔を変えると靴/靴下の間隔も一緒に追従する。
//   pantsLegSpacing は pants/shoes/socks の3グループに共有されるため、他の生パラメータとは
//   違いグループの内部には取り込まず、このファイル側の外部ノードのまま残している。
//
// ノードの position はガーメントごとに手作業で「読みやすいエッジになる」列テンプレートに
// 沿って配置している(nodes/autoLayout.ts の computeAutoLayout() を機械的に適用すると、
// 全ガーメントの入力ノードが1つの巨大な層にまとまり、バリセンター順の並び替えだけでは
// エッジがノード上を大量に横切ってしまうため、これは使っていない)。x=0 列には
// bodyHeight/bodyBuild/bodyShoulder/bodySkinColor のシードノードと、複数グループに共有される
// pantsLegSpacing だけが並ぶ(ガーメント固有の生パラメータは各 <name>GroupNode.ts の内部へ
// 移したため、このファイルにはもう存在しない)。x=260 列に各グループノードが並び、y座標は
// 生パラメータがまだこのファイルの外側の列として存在していた旧レイアウトから引き継いでいる
// (グループ1つあたりの縦幅はそのままのため、現在は間隔がやや広めに空いている)。topGroup の
// 左側だけは x=0(topRadius/topColor)→ x=140(topRadiusScale/topMaterial)という2列を追加で持ち、
// x=260 の topGroup と x=580 の sleeveGroup の両方へファンアウトしている。
// 新しいガーメント種を追加する際は add-garment-type スキル・上記の慣例に従うこと。
export const initialNodes: Node[] = initialGraphData.nodes as Node[];
export const initialEdges: Edge[] = initialGraphData.edges as Edge[];
