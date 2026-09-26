import { defineGroupNode } from '../groupNodeFactory';
import { bodyRadiusScale, bodyRadiusSockets } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** scale(numberMultiply)+profile(easedLatheCurve、肩の Torso Radius から裾の Hem Radius へ
 * イージング)+gen(ringGridGenerator、最上段にネックラインを彫り込む)+material(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)を1枚に
 * まとめたグループノード。Torso Radius/Hem Radius/Length/Neckline/Neckline Depth は他の
 * ガーメントと共有されない単独パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Torso Radius(体の胴体半径、`scale` が倍率を掛ける)と
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される shoulderY)は
 * 外部ソケットのまま。 */
const output = garmentOutput({ offsetY: 0, geometry: 'gen' });

const scale = bodyRadiusScale('torsoRadius', 1.12);

defineGroupNode({
  type: 'dressGroup',
  label: 'Dress',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          bodyRadiusSockets.torsoRadius,
          anchorYSocket,
          colorSocket('#3d7a72'),
        ],
      },
    },
    ...scale.nodes,
    { id: 'neckline', type: 'necklineShapes', data: {} },
    { id: 'profile', type: 'easedLatheCurve', data: { endRadius: 0.55, distance: 0.9 } },
    { id: 'gen', type: 'ringGridGenerator', data: { steps: 14, necklineDepth: 0.12 } },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'profile', sourceHandle: 'down', target: 'gen', targetHandle: 'profile' },
    { source: 'neckline', sourceHandle: 'roundShape', target: 'gen', targetHandle: 'necklineWeights' },
    ...output.edges,
  ],
});
