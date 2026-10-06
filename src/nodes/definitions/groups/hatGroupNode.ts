import { defineGroupNode } from '../groupNodeFactory';
import { latheBody } from '../garmentParts';
import { colorSocket, garmentOutput } from '../garmentOutput';

/** 頭に被さるつばの半径(`brimRadiusCalc`)は固定値(0.37075)。
 * profile(easedLatheCurve)+hatGen(latheGenerator)+hatMaterial(toonMaterial)+
 * placement(translate)+sceneOut(sceneOutput) を1枚に
 * まとめる。Crown Radius/Height は他のガーメントと共有されない単独
 * パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 *
 * head は左右対称な単一パーツなので `mirrorPair` は挟まない。hat は shoes/socks と同じ
 * `direction: 'up'`(つばから上=クラウン側へ伸びる)。 */
const output = garmentOutput({ y: 1.67, geometry: 'gen' });

const lathe = latheBody({ genId: 'gen', direction: 'up', steps: 10, startRadius: 'brimRadiusCalc', endRadius: 0.02, distance: 0.35, segments: 20 });

defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          colorSocket('#4a3b6b'),
        ],
      },
    },
    { id: 'brimRadiusCalc', type: 'numberInput', data: { value: 0.37075 } },
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [
    ...lathe.edges,
    ...output.edges,
  ],
});
