import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, latheBody } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** jacketShoulderScale(numberMultiply)+profile(easedLatheProfile)+gen(latheGenerator)+
 * jacketMaterial(toonMaterial)+offsetYIn(numberInput)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の8ノード(+裾半径を求める `flaredRadius`)を1枚にまとめたグループノード。
 * Shoulder Radius/Length/Hem Flare/Segments/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの
 * `bodyLayout` 共有ノードから配線される shoulderY)は外部ソケットのまま。
 *
 * `skirtGroupNode.ts` と全く同じ理由・同じ形で、プロファイル生成を `easedLatheProfile`→
 * `latheGenerator` へ、裾半径(`hemRadius = shoulderRadius * (1 + Math.max(0, hemFlare))`)を
 * `hemRadiusCalc`(`flaredRadius`、`nodes/definitions/generic/flaredRadius.ts`)へ展開している。 */
const output = garmentOutput({ color: { hex: '#4a5c3e', label: 'Jacket Color' }, offsetY: 0, geometry: 'gen' });

const scale = bodyBuildScale('shoulderRadiusIn');
const lathe = latheBody({ genId: 'gen', direction: 'down', steps: 10, startRadius: 'scale', endRadius: 'hemRadiusCalc', distance: 'lengthIn' });

defineGroupNode({
  type: 'jacketGroup',
  label: 'Jacket',
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
    { id: 'shoulderRadiusIn', type: 'numberInput', data: { value: 0.34, min: 0.25, max: 0.5, step: 0.01, label: 'Shoulder Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.42, min: 0.2, max: 0.8, step: 0.01, label: 'Length' } },
    { id: 'hemFlareIn', type: 'numberInput', data: { value: 0.15, min: 0, max: 1.5, step: 0.05, label: 'Hem Flare' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 20, min: 8, max: 40, step: 1, label: 'Segments' } },
    ...scale.nodes,
    { id: 'hemRadiusCalc', type: 'flaredRadius', data: {} },
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'scale', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'radius' },
    { source: 'hemFlareIn', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'flare' },
    ...lathe.edges,
    ...output.edges,
  ],
});
