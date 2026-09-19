import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** scale(numberMultiply)+profile(easedLatheProfile、肩の Torso Radius から裾の Hem Radius へ
 * イージング)+gen(ringGridGenerator、最上段にネックラインを彫り込む)+material(toonMaterial)+
 * offsetYIn(numberInput)+placement(garmentPlacement)+sceneOut(sceneOutput)を1枚に
 * まとめたグループノード。Torso Radius/Hem Radius/Length/Neckline/Neckline Depth/Color は他の
 * ガーメントと共有されない単独パラメータのため、外側の numberInput/colorInput/enumInput
 * ノードではなくグループ内部の同型ノードとして保持する。Body Build(半径スケーリング用)と
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される shoulderY)は
 * 外部ソケットのまま。 */
const output = garmentOutput({ color: { hex: '#3d7a72', label: 'Dress Color' }, offsetY: 0, geometry: 'gen' });

const scale = bodyBuildScale('torsoRadiusIn');

defineGroupNode({
  type: 'dressGroup',
  label: 'Dress',
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
    { id: 'torsoRadiusIn', type: 'numberInput', data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
    { id: 'hemRadiusIn', type: 'numberInput', data: { value: 0.55, min: 0.3, max: 1, step: 0.01, label: 'Hem Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.9, min: 0.4, max: 1.3, step: 0.01, label: 'Length' } },
    { id: 'necklineIn', type: 'enumInput', data: { value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' } },
    { id: 'necklineDepthIn', type: 'numberInput', data: { value: 0.12, min: 0, max: 0.3, step: 0.01, label: 'Neckline Depth' } },
    ...scale.nodes,
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'down', steps: 14 } },
    { id: 'gen', type: 'ringGridGenerator', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'hemRadiusIn', sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
    { source: 'profile', sourceHandle: 'points', target: 'gen', targetHandle: 'points' },
    { source: 'necklineIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineType' },
    { source: 'necklineDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineDepth' },
    ...output.edges,
  ],
});
