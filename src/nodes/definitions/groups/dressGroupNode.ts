import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, necklineShapes } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** scale(numberMultiply)+profile(easedLatheProfile、肩の Torso Radius から裾の Hem Radius へ
 * イージング)+gen(ringGridGenerator、最上段にネックラインを彫り込む)+material(toonMaterial)+
 * offsetYIn(numberInput)+placement(garmentPlacement)+sceneOut(sceneOutput)を1枚に
 * まとめたグループノード。Torso Radius/Hem Radius/Length/Neckline/Neckline Depth/Color は他の
 * ガーメントと共有されない単独パラメータのため、外側の numberInput/colorInput
 * ノードではなくグループ内部の同型ノードとして保持する。Body Build(半径スケーリング用)と
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される shoulderY)は
 * 外部ソケットのまま。 */
const output = garmentOutput({ color: '#3d7a72', offsetY: 0, geometry: 'gen' });

const neckline = necklineShapes();

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
    { id: 'torsoRadiusIn', type: 'numberInput', data: { value: 0.29} },
    { id: 'hemRadiusIn', type: 'numberInput', data: { value: 0.55} },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.9} },
    { id: 'necklineDepthIn', type: 'numberInput', data: { value: 0.12} },
    ...scale.nodes,
    ...neckline.nodes,
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'down', steps: 14 } },
    { id: 'gen', type: 'ringGridGenerator', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...neckline.edges,
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'hemRadiusIn', sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
    { source: 'profile', sourceHandle: 'points', target: 'gen', targetHandle: 'points' },
    { source: 'roundShape', sourceHandle: 'points', target: 'gen', targetHandle: 'necklineWeights' },
    { source: 'necklineDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineDepth' },
    ...output.edges,
  ],
});
