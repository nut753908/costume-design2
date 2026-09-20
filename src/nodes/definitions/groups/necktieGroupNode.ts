import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** necktie の結び目・ブレードの大きさはスタイル寄りの独立した寸法だが、前面の深さ
 * (`frontDepthIn`)だけは、胴体の壁(Body Build でスケールされる)より前に出す必要があるため、
 * 他のガーメントの「体に触れる半径」と同じく Body Build を掛けてから使う(`scale`)。
 * 全体は完全にノードグラフへ展開されている: 結び目(`knotGen`、`boxGenerator`)は
 * `knotTranslate`(`translate`)で `(0, -knotHeight/2, frontDepth)` へ置き、ブレード(`bladeGen`、
 * `taperedRectTubeGenerator`)は結び目の下端 `(0, -knotHeight, frontDepth)` から
 * `bladeLength` だけ下の点まで、上端 `bladeTopWidth` から下端 `bladeBottomWidth` へ広がる。
 * 上端は結び目の陰、下端は先細りの点に近いため、ブレードにキャップは付けない。2つは
 * `merge`(`mergeGeometry`)で結合する。Y座標は `numberHalf`/`numberNegate`/`numberSubtract` の
 * 可視の四則演算チェーンで導出する。複数のノードが同じ値を使うパラメータ(`knotHeightIn`/`bladeThicknessIn`)だけ
 * `numberInput` を置いて配線し、他は numberInput/colorInput ノードを置かず、各ノードの入力欄の値として持つ。
 * Body Build と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * shoulderY)は外部ソケット。 */
const output = garmentOutput({ color: '#7a1f2b', offsetY: 0, geometry: 'merge' });

const scale = bodyBuildScale(0.3);

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
    { id: 'knotHeightIn', type: 'numberInput', data: { value: 0.04} },
    { id: 'bladeThicknessIn', type: 'numberInput', data: { value: 0.008} },
    ...scale.nodes,
    { id: 'knotGen', type: 'boxGenerator', data: { width: 0.05, depth: 0.025 } },
    { id: 'halfKnotHeight', type: 'numberHalf', data: {} },
    { id: 'knotCenterY', type: 'numberNegate', data: {} },
    { id: 'knotTranslate', type: 'translate', data: {} },
    { id: 'bladeStartY', type: 'numberNegate', data: {} },
    { id: 'bladeEndY', type: 'numberSubtract', data: { b: 0.4 } },
    { id: 'bladeGen', type: 'taperedRectTubeGenerator', data: { startWidth: 0.035, endWidth: 0.06 } },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    // 結び目 = boxGenerator を (0, -knotHeight/2, frontDepth) へ。
    { source: 'knotHeightIn', sourceHandle: 'value', target: 'knotGen', targetHandle: 'height' },
    { source: 'knotHeightIn', sourceHandle: 'value', target: 'halfKnotHeight', targetHandle: 'value' },
    { source: 'halfKnotHeight', sourceHandle: 'value', target: 'knotCenterY', targetHandle: 'value' },
    { source: 'knotGen', sourceHandle: 'geometry', target: 'knotTranslate', targetHandle: 'geometry' },
    { source: 'knotCenterY', sourceHandle: 'value', target: 'knotTranslate', targetHandle: 'y' },
    { source: 'scale', sourceHandle: 'value', target: 'knotTranslate', targetHandle: 'z' },

    // ブレード = taperedRectTubeGenerator(結び目の下端 → bladeLength だけ下、X=0・Z=frontDepth)。
    { source: 'knotHeightIn', sourceHandle: 'value', target: 'bladeStartY', targetHandle: 'value' },
    { source: 'bladeStartY', sourceHandle: 'value', target: 'bladeEndY', targetHandle: 'a' },
    { source: 'bladeStartY', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'startY' },
    { source: 'scale', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'startZ' },
    { source: 'bladeEndY', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'endY' },
    { source: 'scale', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'endZ' },
    { source: 'bladeThicknessIn', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'startThickness' },
    { source: 'bladeThicknessIn', sourceHandle: 'value', target: 'bladeGen', targetHandle: 'endThickness' },

    { source: 'knotTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'bladeGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },

    ...output.edges,
  ],
});
