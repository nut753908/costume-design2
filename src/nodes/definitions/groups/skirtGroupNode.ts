import { defineGroupNode } from '../groupNodeFactory';
import { bodyBuildScale, latheBody } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';
import { constNumberInput } from '../constNumberInput';

/** skirtWaistScale(numberMultiply)+profile(easedLatheProfile)+gen(latheGenerator)+
 * skirtMaterial(toonMaterial)+offsetYIn(numberInput)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の8ノード(+裾半径を導出する4ノード)を1枚にまとめたグループノード。
 * Waist Radius/Length/Flare/Segments/Color は他のガーメントと共有されない単独パラメータの
 * ため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。
 * Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノード
 * から配線される waistY)は外部ソケットのまま。
 *
 * 裾半径(`hemRadius = waistRadius * (1 + Math.max(0, flare))`)は `flareClamped`
 * (`numberMax`)→`onePlusFlare`(`numberAdd`)→`hemRadiusCalc`(`numberMultiply`)という
 * 可視の配線へ展開しており、コード側の式としては持たない(`zeroIn`/`oneIn` は
 * `constNumberInput()` で定義する「常に一定の値を持つ `numberInput`」)。 */
const output = garmentOutput({ color: { hex: '#d9738c', label: 'Skirt Color' }, offsetY: 0.03, geometry: 'gen' });

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
    { id: 'waistRadiusIn', type: 'numberInput', data: { value: 0.3, min: 0.15, max: 0.5, step: 0.01, label: 'Waist Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.55, min: 0.2, max: 1, step: 0.01, label: 'Length' } },
    { id: 'flareIn', type: 'numberInput', data: { value: 0.7, min: 0, max: 2.5, step: 0.05, label: 'Flare' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 28, min: 8, max: 48, step: 1, label: 'Segments' } },
    constNumberInput('zeroIn', 0, 'Zero'),
    constNumberInput('oneIn', 1, 'One'),
    ...scale.nodes,
    { id: 'flareClamped', type: 'numberMax', data: { label: 'Flare Clamped (≥0)' } },
    { id: 'onePlusFlare', type: 'numberAdd', data: { label: 'Hem Scale (1 + Flare)' } },
    { id: 'hemRadiusCalc', type: 'numberMultiply', data: { label: 'Hem Radius' } },
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    { source: 'flareIn', sourceHandle: 'value', target: 'flareClamped', targetHandle: 'a' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'flareClamped', targetHandle: 'b' },
    { source: 'flareClamped', sourceHandle: 'value', target: 'onePlusFlare', targetHandle: 'a' },
    { source: 'oneIn', sourceHandle: 'value', target: 'onePlusFlare', targetHandle: 'b' },
    { source: 'scale', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'value' },
    { source: 'onePlusFlare', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'factor' },
    ...lathe.edges,
    ...output.edges,
  ],
});
