import { defineGroupNode } from '../groupNodeFactory';
import { fixedBodyRadius, shoulderedBody } from '../garmentParts';
import { colorSocket, garmentOutput } from '../garmentOutput';

/** scale(numberInput、胸の半径)+hemRadiusCalc(flaredRadius、裾半径 = 胸の半径 × (1 + hemFlare))+
 * profile(shoulderedProfile、肩の丸みで首まわりまで閉じたプロファイル、`garmentParts.ts` の
 * `shoulderedBody()`)+gen(latheGenerator)+末端(`garmentOutput()`)を1枚にまとめたグループノード。
 * 半径(ボディの基準寸法 × 倍率の固定値、`fixedBodyRadius()`)/Length/Hem Flare/Segments は他のガーメントと共有されない単独パラメータのため、
 * numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。 */
const output = garmentOutput({ y: 1.2169, geometry: 'gen' });

const scale = fixedBodyRadius('torsoRadius', 1.15);
// 首まわりの開口は Top(1.8)より広くして、肩の丸みで Top の外側に重ねる。
const body = shoulderedBody({ length: 0.46, hemRadius: 'hemRadiusCalc', neckOpeningRatio: 2.0 });

defineGroupNode({
  type: 'jacketGroup',
  label: 'Jacket',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          colorSocket('#4a5c3e'),
        ],
      },
    },
    ...scale.nodes,
    { id: 'hemRadiusCalc', type: 'flaredRadius', data: { flare: 0.15 } },
    ...body.nodes,
    { id: 'gen', type: 'latheGenerator', data: { steps: 16, segments: 20 } },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'radius' },
    ...body.edges,
    { source: 'profile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    ...output.edges,
  ],
});
