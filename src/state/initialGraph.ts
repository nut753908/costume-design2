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
// - 各ガーメントの「体に触れる半径」(skirtWaist/topRadius/pantsWaist/shoesSole/
//   glovesWrist/beltRadius/scarfNeckRadius/jacketShoulderRadius/socksAnkleRadius/
//   dressTorsoRadius)は、対応する numberMultiply ノード(例: skirtWaistScale)を
//   経由して bodyBuild を掛けてから生成ノードに渡している。ボディをリサイズしても
//   ガーメントがゆるい/きつい見た目にならないようにするため。
// - sleeveGen は topRadiusScale(Body Build 適用後の Top 胴体半径)と topMaterial を
//   再引きしている。Top を再着色/リサイズすると Sleeve も一緒に追従する。
// - shoesGen/socksGen は pantsLegSpacing を再引きしている。脚の間隔を変えると靴/靴下の
//   間隔も一緒に追従する。
//
// 新しいガーメント種を追加する際は add-garment-type スキル・上記の慣例に従うこと。
export const initialNodes: Node[] = initialGraphData.nodes as Node[];
export const initialEdges: Edge[] = initialGraphData.edges as Edge[];
