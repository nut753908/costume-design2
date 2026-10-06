import { defineGroupNode } from '../groupNodeFactory';
import { radiusInput, shoulderedBody } from '../garmentParts';
import { colorSocket, garmentOutput } from '../garmentOutput';

/** scale(numberInput、胸の半径)+hemRadiusCalc(flaredRadius、裾半径 = 肩の半径 × (1 + flare))+
 * profile(shoulderedProfile、肩の丸みで首まわりまで閉じ、胸から裾の Hem Radius へ広がる、`garmentParts.ts` の
 * `shoulderedBody()`)+gen(ringGridGenerator、ネックラインを彫り込む)+material(toonMaterial)+
 * placement(translate)+sceneOut(sceneOutput)を1枚に
 * まとめたグループノード。裾半径は肩の半径から導出する。
 * 半径(固定値)/Flare/Length/Neckline/Neckline Depth は他の
 * ガーメントと共有されない単独パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。 */
const output = garmentOutput({ y: 1.2169, geometry: 'gen' });

const scale = radiusInput(0.172032);
const body = shoulderedBody({ length: 0.9, hemRadius: 'hemRadiusCalc', neckOpening: 0.0945 });

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
          colorSocket('#3d7a72'),
        ],
      },
    },
    ...scale.nodes,
    { id: 'neckline', type: 'necklineShapes', data: {} },
    { id: 'hemRadiusCalc', type: 'flaredRadius', data: { flare: 0.3 } },
    ...body.nodes,
    { id: 'gen', type: 'ringGridGenerator', data: { steps: 20, necklineDepth: 0.02 } },
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
