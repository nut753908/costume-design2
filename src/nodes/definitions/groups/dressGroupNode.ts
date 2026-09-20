import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, necklineShapes } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** scale(numberMultiply)+profile(easedLatheProfile、肩の Torso Radius から裾の Hem Radius へ
 * イージング)+gen(ringGridGenerator、最上段にネックラインを彫り込む)+material(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)を1枚に
 * まとめたグループノード。Torso Radius/Hem Radius/Length/Neckline/Neckline Depth/Color は他の
 * ガーメントと共有されない単独パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Body Build(半径スケーリング用)と
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される shoulderY)は
 * 外部ソケットのまま。 */
const output = garmentOutput({ color: '#3d7a72', offsetY: 0, geometry: 'gen' });

const neckline = necklineShapes();

const scale = bodyBuildScale(0.29);

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
    ...scale.nodes,
    ...neckline.nodes,
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'down', steps: 14, endRadius: 0.55, distance: 0.9 } },
    { id: 'gen', type: 'ringGridGenerator', data: { necklineDepth: 0.12 } },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...neckline.edges,
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'profile', sourceHandle: 'points', target: 'gen', targetHandle: 'points' },
    { source: 'roundShape', sourceHandle: 'points', target: 'gen', targetHandle: 'necklineWeights' },
    ...output.edges,
  ],
});
