import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** profile(easedLatheCurve、始点・終点とも同じ半径)+gen(ringGridGenerator、最上段に
 * ネックラインを彫り込む)+sleeveGen(sleevePair、`generic/sleevePair.ts`)+merge(mergeGeometry)を1つのガーメントとして
 * まとめたグループノード。袖は Top と同じ生地・同じ胴体半径で縫い付ける必要があるため、
 * Torso Radius(`topRadiusIn` × Body Build)と Color(外部ソケット `color`→`material`)は gen/sleeveGen で
 * 共有し、袖の付け根(`attachRadius`)にはスケール済みの Torso Radius をそのまま渡す。
 * 袖なしにしたい場合は `sleeveGen → merge` の配線を切る(`mergeGeometry` は1つだけでもそのまま通す)。
 * Sleeve Length を 0 にするとチューブが根元で潰れるだけで頂点が残るため、min は 0 にしない。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから
 * 配線される shoulderY)は外部ソケットのまま。 */
const output = garmentOutput({ offsetY: 0, geometry: 'merge' });

const scale = bodyBuildScale(0.29);

defineGroupNode({
  type: 'topGroup',
  label: 'Top',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          anchorYSocket,
          colorSocket('#5b8fa8'),
        ],
      },
    },
    ...scale.nodes,
    { id: 'neckline', type: 'necklineShapes', data: {} },
    { id: 'profile', type: 'easedLatheCurve', data: { distance: 0.5 } },
    { id: 'gen', type: 'ringGridGenerator', data: { steps: 10, necklineDepth: 0.12 } },
    { id: 'sleeveGen', type: 'sleevePair', data: { sleeveRadius: 0.085, sleeveLength: 0.22 } },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
    { source: 'profile', sourceHandle: 'down', target: 'gen', targetHandle: 'profile' },
    { source: 'neckline', sourceHandle: 'roundShape', target: 'gen', targetHandle: 'necklineWeights' },
    { source: 'scale', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'attachRadius' },
    { source: 'gen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'sleeveGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    ...output.edges,
  ],
});
