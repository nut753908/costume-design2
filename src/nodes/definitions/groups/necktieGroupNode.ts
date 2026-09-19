import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';
import { constNumberInput } from '../constNumberInput';

/** necktie の結び目・ブレードの大きさはスタイル寄りの独立した寸法だが、前面の深さ
 * (`frontDepthIn`)だけは、胴体の壁(Body Build でスケールされる)より前に出す必要があるため、
 * 他のガーメントの「体に触れる半径」と同じく Body Build を掛けてから使う(`scale`)。
 * 全体は完全にノードグラフへ展開されている: 結び目(`knotGen`、`boxGenerator`)は
 * `knotTranslate`(`translate`)で `(0, -knotHeight/2, frontDepth)` へ置き、ブレード(`bladeGen`、
 * `taperedTubeGenerator` の矩形断面)は結び目の下端 `(0, -knotHeight, frontDepth)` から
 * `bladeLength` だけ下の点まで、上端 `bladeTopWidth` から下端 `bladeBottomWidth` へ広がる。
 * 上端は結び目の陰、下端は先細りの点に近いため、ブレードにキャップは付けない。2つは
 * `merge`(`mergeGeometry`)で結合する。Y座標は `numberHalf`/`numberNegate`/`numberSubtract` の
 * 可視の四則演算チェーンで導出する(`zeroIn` は `constNumberInput()` で定義する「常に一定の値を
 * 持つ `numberInput`」)。全パラメータが他のガーメントと共有されない単独パラメータのため、
 * 外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Body Build と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * shoulderY)は外部ソケット。 */
const output = garmentOutput({ color: { hex: '#7a1f2b', label: 'Necktie Color' }, offsetY: 0, geometry: 'merge' });

const scale = bodyBuildScale('frontDepthIn');

defineGroupNode({
  type: 'necktieGroup',
  label: 'Necktie',
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
    { id: 'knotWidthIn', type: 'numberInput', data: { value: 0.05, min: 0.03, max: 0.08, step: 0.005, label: 'Knot Width' } },
    { id: 'knotHeightIn', type: 'numberInput', data: { value: 0.04, min: 0.02, max: 0.07, step: 0.005, label: 'Knot Height' } },
    { id: 'knotThicknessIn', type: 'numberInput', data: { value: 0.025, min: 0.01, max: 0.05, step: 0.005, label: 'Knot Thickness' } },
    { id: 'bladeTopWidthIn', type: 'numberInput', data: { value: 0.035, min: 0.015, max: 0.06, step: 0.005, label: 'Blade Top Width' } },
    { id: 'bladeBottomWidthIn', type: 'numberInput', data: { value: 0.06, min: 0.03, max: 0.12, step: 0.005, label: 'Blade Bottom Width' } },
    { id: 'bladeThicknessIn', type: 'numberInput', data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Blade Thickness' } },
    { id: 'bladeLengthIn', type: 'numberInput', data: { value: 0.4, min: 0.2, max: 0.7, step: 0.01, label: 'Blade Length' } },
    { id: 'frontDepthIn', type: 'numberInput', data: { value: 0.3, min: 0.2, max: 0.5, step: 0.01, label: 'Front Depth' } },
    ...scale.nodes,
    constNumberInput('zeroIn', 0, 'Zero'),
    { id: 'knotGen', type: 'boxGenerator', data: {} },
    { id: 'halfKnotHeight', type: 'numberHalf', data: { label: 'Knot Height × Half' } },
    { id: 'knotCenterY', type: 'numberNegate', data: { label: 'Knot Center Y' } },
    { id: 'knotTranslate', type: 'translate', data: {} },
    { id: 'bladeStartY', type: 'numberNegate', data: { label: 'Blade Start Y (= −Knot Height)' } },
    { id: 'bladeEndY', type: 'numberSubtract', data: { label: 'Blade End Y' } },
    { id: 'bladeGen', type: 'taperedTubeGenerator', data: { shape: 'rectangle' } },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    // 結び目 = boxGenerator を (0, -knotHeight/2, frontDepth) へ。
    { source: 'knotWidthIn', sourceHandle: 'value', target: 'knotGen', targetHandle: 'width' },
    { source: 'knotHeightIn', sourceHandle: 'value', target: 'knotGen', targetHandle: 'height' },
    { source: 'knotThicknessIn', sourceHandle: 'value', target: 'knotGen', targetHandle: 'depth' },
    { source: 'knotHeightIn', sourceHandle: 'value', target: 'halfKnotHeight', targetHandle: 'value' },
    { source: 'halfKnotHeight', sourceHandle: 'value', target: 'knotCenterY', targetHandle: 'value' },
    { source: 'knotGen', sourceHandle: 'geometry', target: 'knotTranslate', targetHandle: 'geometry' },
    { source: 'knotCenterY', sourceHandle: 'value', target: 'knotTranslate', targetHandle: 'y' },
    { source: 'scale', sourceHandle: 'value', target: 'knotTranslate', targetHandle: 'z' },

    // ブレード = taperedTubeGenerator(結び目の下端 → bladeLength だけ下、X=0・Z=frontDepth)。
    { source: 'knotHeightIn', sourceHandle: 'value', target: 'bladeStartY', targetHandle: 'value' },
    { source: 'bladeStartY', sourceHandle: 'value', target: 'bladeEndY', targetHandle: 'a' },
    { source: 'bladeLengthIn', sourceHandle: 'value', target: 'bladeEndY', targetHandle: 'b' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'startX' },
    { source: 'bladeStartY', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'startY' },
    { source: 'scale', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'startZ' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'endX' },
    { source: 'bladeEndY', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'endY' },
    { source: 'scale', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'endZ' },
    { source: 'bladeTopWidthIn', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'startWidth' },
    { source: 'bladeThicknessIn', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'startThickness' },
    { source: 'bladeBottomWidthIn', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'endWidth' },
    { source: 'bladeThicknessIn', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'endThickness' },

    { source: 'knotTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'bladeGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },

    ...output.edges,
  ],
});
