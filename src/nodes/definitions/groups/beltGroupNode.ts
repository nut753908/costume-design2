import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';
import { constNumberInput } from '../constNumberInput';

/** beltRadiusScale(numberMultiply)+material(toonMaterial)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)に加え、山なりのバックル部分の
 * プロファイル生成を可視のノードグラフへ展開した十数ノードを1枚にまとめたグループノード。
 * Radius/Thickness/Bulge/Segments/Color は他のガーメントと共有されない単独パラメータのため、
 * 外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される waistY)は外部ソケットのまま(`nodes/CLAUDE.md` の「グループノード」節参照)。
 *
 * waist アンカー(上端、radius)から下端(radius)まで、中間で bulge 倍に膨らむ帯状の回転体を、
 * 上半分・下半分それぞれの `easedLatheProfile` の結果を連結して作る:
 *   - `bulgeRadiusCalc`(`numberMultiply`、`radius(スケール後) × bulge`)
 *   - `halfCalc`(`numberHalf`、`thickness × 0.5`)
 *   - `lowerProfile`(`easedLatheProfile`、`bulgeRadius → radius` を `half` の距離でイージング)
 *   - `negatedHalf`(`numberNegate`、`-half`)
 *   - `lowerShifted`(`translatePointsY`、`lowerProfile` を `negatedHalf` ぶんY方向にシフト)
 *   - `lowerSliced`(`slicePoints`、`dropEnd=1` で末尾の1点(`upperProfile` の始点と重複する
 *     接続点)を間引く)
 *   - `upperProfile`(`easedLatheProfile`、`radius → bulgeRadius` を `half` の距離で
 *     イージング)
 *   - `combined`(`concatPoints`、`lowerSliced` + `upperProfile` を連結)
 *   - `gen`(`latheGenerator`、`combined` の points を Lathe 化)
 * `oneIn` は `constNumberInput()` で定義する「常に一定の値を持つ `numberInput`」。
 *
 * `groups/beltGenerator.ts`(`buildBeltGeometry()` をそのまま呼ぶノード)は
 * `scarfGroupNode.ts` が首元の輪を `bulge=1.05` 固定でネストして使う(`geometry/CLAUDE.md` 参照)。 */
const output = garmentOutput({ color: { hex: '#3a2e26', label: 'Belt Color' }, offsetY: 0, geometry: 'gen' });

const scale = bodyBuildScale('radiusIn');

defineGroupNode({
  type: 'beltGroup',
  label: 'Belt',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          anchorYSocket,
        ],
      },
    },
    { id: 'radiusIn', type: 'numberInput', data: { value: 0.32, min: 0.2, max: 0.45, step: 0.01, label: 'Radius' } },
    { id: 'thicknessIn', type: 'numberInput', data: { value: 0.05, min: 0.02, max: 0.12, step: 0.005, label: 'Thickness' } },
    { id: 'bulgeIn', type: 'numberInput', data: { value: 1.15, min: 1, max: 1.5, step: 0.01, label: 'Bulge' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 24, min: 8, max: 48, step: 1, label: 'Segments' } },
    constNumberInput('oneIn', 1, 'One'),
    ...scale.nodes,
    { id: 'bulgeRadiusCalc', type: 'numberMultiply', data: { label: 'Bulge Radius' } },
    { id: 'halfCalc', type: 'numberHalf', data: { label: 'Thickness × Half' } },
    { id: 'negatedHalf', type: 'numberNegate', data: { label: 'Negated Half' } },
    { id: 'lowerProfile', type: 'easedLatheProfile', data: { direction: 'down', steps: 6 } },
    { id: 'lowerShifted', type: 'translatePointsY', data: {} },
    { id: 'lowerSliced', type: 'slicePoints', data: {} },
    { id: 'upperProfile', type: 'easedLatheProfile', data: { direction: 'down', steps: 6 } },
    { id: 'combined', type: 'concatPoints', data: {} },
    { id: 'gen', type: 'latheGenerator', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,

    { source: 'scale', sourceHandle: 'value', target: 'bulgeRadiusCalc', targetHandle: 'value' },
    { source: 'bulgeIn', sourceHandle: 'value', target: 'bulgeRadiusCalc', targetHandle: 'factor' },
    { source: 'thicknessIn', sourceHandle: 'value', target: 'halfCalc', targetHandle: 'value' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'negatedHalf', targetHandle: 'value' },

    { source: 'bulgeRadiusCalc', sourceHandle: 'value', target: 'lowerProfile', targetHandle: 'startRadius' },
    { source: 'scale', sourceHandle: 'value', target: 'lowerProfile', targetHandle: 'endRadius' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'lowerProfile', targetHandle: 'distance' },
    { source: 'lowerProfile', sourceHandle: 'points', target: 'lowerShifted', targetHandle: 'points' },
    { source: 'negatedHalf', sourceHandle: 'value', target: 'lowerShifted', targetHandle: 'y' },
    { source: 'lowerShifted', sourceHandle: 'points', target: 'lowerSliced', targetHandle: 'points' },
    { source: 'oneIn', sourceHandle: 'value', target: 'lowerSliced', targetHandle: 'dropEnd' },

    { source: 'scale', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'startRadius' },
    { source: 'bulgeRadiusCalc', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'endRadius' },
    { source: 'halfCalc', sourceHandle: 'value', target: 'upperProfile', targetHandle: 'distance' },

    { source: 'lowerSliced', sourceHandle: 'points', target: 'combined', targetHandle: 'pointsA' },
    { source: 'upperProfile', sourceHandle: 'points', target: 'combined', targetHandle: 'pointsB' },
    { source: 'combined', sourceHandle: 'points', target: 'gen', targetHandle: 'points' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },

    ...output.edges,
  ],
});
