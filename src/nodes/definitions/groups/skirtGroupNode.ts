import { defineGroupNode } from '../groupNodeFactory';
import { fixedBodyRadius, latheBody } from '../garmentParts';
import { colorSocket, garmentOutput } from '../garmentOutput';

/** skirtWaistScale(numberInput、ボディの基準寸法 × 倍率の固定値)+profile(easedLatheCurve)+gen(latheGenerator)+
 * skirtMaterial(toonMaterial)+placement(translate)+
 * sceneOut(sceneOutput)の8ノード(+裾半径を求める `flaredRadius`)を1枚にまとめたグループノード。
 * Waist Radius/Length/Flare/Segments は他のガーメントと共有されない単独パラメータの
 * ため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 *
 * 裾半径(`hemRadius = waistRadius * (1 + Math.max(0, flare))`)は `hemRadiusCalc`
 * (`flaredRadius`、`nodes/definitions/generic/flaredRadius.ts`、jacket/dress と共有する可視の
 * 配線)が求め、コード側の式としては持たない。 */
const output = garmentOutput({ y: 0.7654, geometry: 'gen' });

const scale = fixedBodyRadius('torsoRadius', 1.15);
const lathe = latheBody({ genId: 'gen', direction: 'down', steps: 12, startRadius: 'scale', endRadius: 'hemRadiusCalc', distance: 0.55, segments: 28 });

defineGroupNode({
  type: 'skirtGroup',
  label: 'Skirt',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          colorSocket('#d9738c'),
        ],
      },
    },
    ...scale.nodes,
    { id: 'hemRadiusCalc', type: 'flaredRadius', data: { flare: 0.6 } },
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'radius' },
    ...lathe.edges,
    ...output.edges,
  ],
});
