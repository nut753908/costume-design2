import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, latheBody } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** skirtWaistScale(numberMultiply)+profile(easedLatheProfile)+gen(latheGenerator)+
 * skirtMaterial(toonMaterial)+offsetYIn(numberInput)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の8ノード(+裾半径を求める `flaredRadius`)を1枚にまとめたグループノード。
 * Waist Radius/Length/Flare/Segments/Color は他のガーメントと共有されない単独パラメータの
 * ため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される waistY)は外部ソケットのまま。
 *
 * 裾半径(`hemRadius = waistRadius * (1 + Math.max(0, flare))`)は `hemRadiusCalc`
 * (`flaredRadius`、`nodes/definitions/generic/flaredRadius.ts`、jacket と共有する可視の
 * 配線)が求め、コード側の式としては持たない。 */
const output = garmentOutput({ color: '#d9738c', offsetY: 0.03, geometry: 'gen' });

const scale = bodyBuildScale('waistRadiusIn');
const lathe = latheBody({ genId: 'gen', direction: 'down', steps: 12, startRadius: 'scale', endRadius: 'hemRadiusCalc', distance: 'lengthIn' });

defineGroupNode({
  type: 'skirtGroup',
  label: 'Skirt',
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
    { id: 'waistRadiusIn', type: 'numberInput', data: { value: 0.3, min: 0.15, max: 0.5, step: 0.01 } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.55, min: 0.2, max: 1, step: 0.01 } },
    { id: 'flareIn', type: 'numberInput', data: { value: 0.7, min: 0, max: 2.5, step: 0.05 } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 28, min: 8, max: 48, step: 1 } },
    ...scale.nodes,
    { id: 'hemRadiusCalc', type: 'flaredRadius', data: {} },
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'radius' },
    { source: 'flareIn', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'flare' },
    ...lathe.edges,
    ...output.edges,
  ],
});
