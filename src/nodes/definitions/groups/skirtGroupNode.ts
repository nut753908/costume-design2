import { defineGroupNode } from '../groupNodeFactory';
import { bodyRadiusScale, bodyRadiusSockets, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** skirtWaistScale(numberMultiply)+profile(easedLatheCurve)+gen(latheGenerator)+
 * skirtMaterial(toonMaterial)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の8ノード(+裾半径を求める `flaredRadius`)を1枚にまとめたグループノード。
 * Waist Radius/Length/Flare/Segments は他のガーメントと共有されない単独パラメータの
 * ため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Torso Radius(体の胴体半径、`scale` が倍率を掛ける)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される waistY)は外部ソケットのまま。
 *
 * 裾半径(`hemRadius = waistRadius * (1 + Math.max(0, flare))`)は `hemRadiusCalc`
 * (`flaredRadius`、`nodes/definitions/generic/flaredRadius.ts`、jacket/dress と共有する可視の
 * 配線)が求め、コード側の式としては持たない。 */
const output = garmentOutput({ offsetY: 0.19, geometry: 'gen' });

const scale = bodyRadiusScale('torsoRadius', 1.15);
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
          bodyRadiusSockets.torsoRadius,
          anchorYSocket,
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
