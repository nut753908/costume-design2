import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, latheBody } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** glovesWristScale(numberMultiply)+profile(easedLatheProfile)+gloveGen(latheGenerator)+
 * mirror(mirrorPair)+glovesMaterial(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)の8ノードを1枚にまとめたグループノード。
 * Wrist Radius/Hand Radius/Length/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。Body Build(半径スケーリング用)・Arm Spacing(bodyGroup の腕と同じ
 * `bodyDimensions.shoulderSpacing`)・Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される wristY)は外部ソケットのまま。
 *
 * 手袋1つぶんのジオメトリ(`profile`→`gloveGen`)と、それを ±armSpacing だけ X方向に離した
 * 左右対称ペアへまとめる処理(`mirror`)は分離している(`pantsGroupNode.ts`/
 * `limbPair.ts` の腕/脚と同じ形、`nodes/CLAUDE.md` 参照)。専用の `segmentsIn`
 * (`numberInput`)を置いているのは、未接続ソケットが型の既定値へフォールバックすると
 * その値がカード上のどこにも見えなくなるため。 */
const output = garmentOutput({ color: { hex: '#b0413e', label: 'Gloves Color' }, offsetY: 0, geometry: 'mirror' });

const scale = bodyBuildScale('wristRadiusIn');
const lathe = latheBody({ genId: 'gloveGen', direction: 'down', steps: 10, startRadius: 'scale', endRadius: 'handRadiusIn', distance: 'lengthIn' });

defineGroupNode({
  type: 'glovesGroup',
  label: 'Gloves',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'armSpacing', label: 'Arm Spacing', type: 'number', default: 0.34 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          anchorYSocket,
        ],
      },
    },
    { id: 'wristRadiusIn', type: 'numberInput', data: { value: 0.08, min: 0.05, max: 0.12, step: 0.005, label: 'Wrist Radius' } },
    { id: 'handRadiusIn', type: 'numberInput', data: { value: 0.09, min: 0.05, max: 0.16, step: 0.005, label: 'Hand Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Length' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 12, min: 8, max: 32, step: 1, label: 'Segments' } },
    ...scale.nodes,
    ...lathe.nodes,
    { id: 'mirror', type: 'mirrorPair', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...lathe.edges,
    { source: 'gloveGen', sourceHandle: 'geometry', target: 'mirror', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'armSpacing', target: 'mirror', targetHandle: 'offset' },
    ...output.edges,
  ],
});
