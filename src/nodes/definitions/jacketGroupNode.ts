import { defineGroupNode } from './groupNodeFactory';

/** jacketShoulderScale(numberMultiply)+profile(easedLatheProfile)+gen(latheGenerator)+
 * jacketMaterial(toonMaterial)+offsetYIn(numberInput)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の8ノード(+裾半径を導出する4ノード)を1枚にまとめたグループノード。
 * Shoulder Radius/Length/Hem Flare/Segments/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。Body Build(半径スケーリング用)と Anchor Y(取り付け位置、ルートの
 * `bodyLayout` 共有ノードから配線される shoulderY)は外部ソケットのまま。
 *
 * `skirtGroupNode.ts` と全く同じ理由・同じ形で、プロファイル生成を `easedLatheProfile`→
 * `latheGenerator` へ、裾半径(`hemRadius = shoulderRadius * (1 + Math.max(0, hemFlare))`)を
 * `hemFlareClamped`(`numberMax`)→`onePlusHemFlare`(`numberAdd`)→`hemRadiusCalc`
 * (`numberMultiply`)という可視の配線へ展開している(`geometry/jacket.ts`/
 * `nodes/definitions/jacketGenerator.ts` は呼び出し元が無くなったため削除済み)。 */
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
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'shoulderRadiusIn', type: 'numberInput', data: { value: 0.34, min: 0.25, max: 0.5, step: 0.01, label: 'Shoulder Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.42, min: 0.2, max: 0.8, step: 0.01, label: 'Length' } },
    { id: 'hemFlareIn', type: 'numberInput', data: { value: 0.15, min: 0, max: 1.5, step: 0.05, label: 'Hem Flare' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 20, min: 8, max: 40, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#4a5c3e', label: 'Jacket Color' } },
    { id: 'zeroIn', type: 'numberInput', data: { value: 0, min: 0, max: 0, step: 0.01, label: 'Zero' } },
    { id: 'oneIn', type: 'numberInput', data: { value: 1, min: 1, max: 1, step: 0.01, label: 'One' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'hemFlareClamped', type: 'numberMax', data: { label: 'Hem Flare Clamped (≥0)' } },
    { id: 'onePlusHemFlare', type: 'numberAdd', data: { label: 'Hem Scale (1 + Hem Flare)' } },
    { id: 'hemRadiusCalc', type: 'numberMultiply', data: { label: 'Hem Radius' } },
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'down', steps: 10 } },
    { id: 'gen', type: 'latheGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'shoulderRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'hemFlareIn', sourceHandle: 'value', target: 'hemFlareClamped', targetHandle: 'a' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'hemFlareClamped', targetHandle: 'b' },
    { source: 'hemFlareClamped', sourceHandle: 'value', target: 'onePlusHemFlare', targetHandle: 'a' },
    { source: 'oneIn', sourceHandle: 'value', target: 'onePlusHemFlare', targetHandle: 'b' },
    { source: 'scale', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'value' },
    { source: 'onePlusHemFlare', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'hemRadiusCalc', sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
    { source: 'profile', sourceHandle: 'points', target: 'gen', targetHandle: 'points' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
