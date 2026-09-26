import { defineGroupNode } from '../groupNodeFactory';
import { bodyRadiusScale, bodyRadiusSockets, shoulderedBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** scale(numberMultiply)+hemRadiusCalc(flaredRadius、裾半径 = 肩の半径 × (1 + flare))+
 * profile(shoulderedProfile、肩の丸みで首まわりまで閉じ、胸から裾の Hem Radius へ広がる、`garmentParts.ts` の
 * `shoulderedBody()`)+gen(ringGridGenerator、ネックラインを彫り込む)+material(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput)を1枚に
 * まとめたグループノード。裾半径も肩の半径から導出するので、体型を変えると裾も一緒に追従する。
 * Torso Radius の倍率/Flare/Length/Neckline/Neckline Depth は他の
 * ガーメントと共有されない単独パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * 体の Torso Radius(`scale` が倍率を掛ける)/Neck Radius(首まわりの開口)と
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される shoulderY)は
 * 外部ソケットのまま。 */
const output = garmentOutput({ offsetY: 0, geometry: 'gen' });

const scale = bodyRadiusScale('torsoRadius', 1.12);
const body = shoulderedBody({ length: 0.9, hemRadius: 'hemRadiusCalc', neckOpeningRatio: 1.8 });

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
          bodyRadiusSockets.neckRadius,
          anchorYSocket,
          colorSocket('#3d7a72'),
        ],
      },
    },
    ...scale.nodes,
    { id: 'neckline', type: 'necklineShapes', data: {} },
    { id: 'hemRadiusCalc', type: 'flaredRadius', data: { flare: 0.3 } },
    ...body.nodes,
    { id: 'gen', type: 'ringGridGenerator', data: { steps: 20, necklineDepth: 0.05 } },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'radius' },
    ...body.edges,
    { source: 'profile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'neckline', sourceHandle: 'roundShape', target: 'gen', targetHandle: 'necklineWeights' },
    ...output.edges,
  ],
});
