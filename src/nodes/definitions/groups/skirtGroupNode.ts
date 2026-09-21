import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** skirtWaistScale(numberMultiply)+profile(easedLatheProfile)+gen(latheGenerator)+
 * skirtMaterial(toonMaterial)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の8ノード(+裾半径を求める `flaredRadius`)を1枚にまとめたグループノード。
 * Waist Radius/Length/Flare/Segments は他のガーメントと共有されない単独パラメータの
 * ため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される waistY)は外部ソケットのまま。
 *
 * 裾半径(`hemRadius = waistRadius * (1 + Math.max(0, flare))`)は `hemRadiusCalc`
 * (`flaredRadius`、`nodes/definitions/generic/flaredRadius.ts`、jacket と共有する可視の
 * 配線)が求め、コード側の式としては持たない。 */
const output = garmentOutput({ offsetY: 0.03, geometry: 'gen' });

const scale = bodyBuildScale(0.3);
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
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          anchorYSocket,
          colorSocket('#d9738c'),
        ],
      },
    },
    ...scale.nodes,
    { id: 'hemRadiusCalc', type: 'flaredRadius', data: { flare: 0.7 } },
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
