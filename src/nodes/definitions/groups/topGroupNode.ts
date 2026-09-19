import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** profile(easedLatheProfile、始点・終点とも同じ半径)+gen(ringGridGenerator、最上段に
 * ネックラインを彫り込む)+sleeveGen(sleeveGenerator)+merge(mergeGeometry)を1つのガーメントとして
 * まとめたグループノード。袖は Top と同じ生地・同じ胴体半径で縫い付ける必要があるため、
 * Torso Radius(`topRadiusIn` × Body Build)と Color(`colorIn`→`material`)は gen/sleeveGen で
 * 共有し、袖の付け根(`attachRadius`)にはスケール済みの Torso Radius をそのまま渡す。
 * 袖なしにしたい場合は `sleeveGen → merge` の配線を切る(`mergeGeometry` は1つだけでもそのまま通す)。
 * Sleeve Length を 0 にするとチューブが根元で潰れるだけで頂点が残るため、min は 0 にしない。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから
 * 配線される shoulderY)は外部ソケットのまま。 */
const output = garmentOutput({ color: { hex: '#5b8fa8', label: 'Top Color' }, offsetY: 0, geometry: 'merge' });

const scale = bodyBuildScale('topRadiusIn');

defineGroupNode({
  type: 'topGroup',
  label: 'Top',
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
    { id: 'topRadiusIn', type: 'numberInput', data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.5, min: 0.2, max: 0.9, step: 0.01, label: 'Length' } },
    { id: 'necklineIn', type: 'enumInput', data: { value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' } },
    { id: 'necklineDepthIn', type: 'numberInput', data: { value: 0.12, min: 0, max: 0.3, step: 0.01, label: 'Neckline Depth' } },
    { id: 'sleeveRadiusIn', type: 'numberInput', data: { value: 0.085, min: 0.05, max: 0.14, step: 0.005, label: 'Sleeve Radius' } },
    { id: 'sleeveLengthIn', type: 'numberInput', data: { value: 0.22, min: 0.01, max: 0.4, step: 0.01, label: 'Sleeve Length' } },
    ...scale.nodes,
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'down', steps: 10 } },
    { id: 'gen', type: 'ringGridGenerator', data: {} },
    { id: 'sleeveGen', type: 'sleeveGenerator', data: {} },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
    { source: 'profile', sourceHandle: 'points', target: 'gen', targetHandle: 'points' },
    { source: 'necklineIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineType' },
    { source: 'necklineDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineDepth' },
    { source: 'scale', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'attachRadius' },
    { source: 'sleeveRadiusIn', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'sleeveRadius' },
    { source: 'sleeveLengthIn', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'sleeveLength' },
    { source: 'gen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'sleeveGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    ...output.edges,
  ],
});
