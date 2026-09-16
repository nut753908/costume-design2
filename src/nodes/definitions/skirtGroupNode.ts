import { defineGroupNode } from './groupNodeFactory';

/** skirtWaistScale(numberMultiply)+profile(easedLatheProfile)+gen(latheGenerator)+
 * skirtMaterial(toonMaterial)+offsetYIn(numberInput)+placement(garmentPlacement)+
 * sceneOut(sceneOutput)の8ノード(+裾半径を導出する4ノード)を1枚にまとめたグループノード。
 * Waist Radius/Length/Flare/Segments/Color は他のガーメントと共有されない単独パラメータの
 * ため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する
 * (スライダー/カラーピッカーUIそのものは変わらない)。Body Build(半径スケーリング用)と
 * Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される waistY)は外部
 * ソケットのまま。
 *
 * プロファイル生成は pants/gloves/hat/socks と同じ理由で `easedLatheProfile`→
 * `latheGenerator` という汎用ノードの組み合わせへ展開している(`geometry/skirt.ts`/
 * `nodes/definitions/skirtGenerator.ts` は呼び出し元が無くなったため削除済み)。裾半径
 * (`hemRadius = waistRadius * (1 + Math.max(0, flare))`、旧コードの導出式)も
 * `flareClamped`(`numberMax`)→`onePlusFlare`(`numberAdd`)→`hemRadiusCalc`
 * (`numberMultiply`)という可視の配線へ展開しており、コード側の式としては持たない
 * (`zeroIn`/`oneIn` は `bodyLayoutGroupNode.ts` の `feetYIn` と同じ「常に一定の値を持つ
 * `numberInput`」のイディオム)。 */
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
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'waistRadiusIn', type: 'numberInput', data: { value: 0.3, min: 0.15, max: 0.5, step: 0.01, label: 'Waist Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.55, min: 0.2, max: 1, step: 0.01, label: 'Length' } },
    { id: 'flareIn', type: 'numberInput', data: { value: 0.7, min: 0, max: 2.5, step: 0.05, label: 'Flare' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 28, min: 8, max: 48, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#d9738c', label: 'Skirt Color' } },
    { id: 'zeroIn', type: 'numberInput', data: { value: 0, min: 0, max: 0, step: 0.01, label: 'Zero' } },
    { id: 'oneIn', type: 'numberInput', data: { value: 1, min: 1, max: 1, step: 0.01, label: 'One' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'flareClamped', type: 'numberMax', data: { label: 'Flare Clamped (≥0)' } },
    { id: 'onePlusFlare', type: 'numberAdd', data: { label: 'Hem Scale (1 + Flare)' } },
    { id: 'hemRadiusCalc', type: 'numberMultiply', data: { label: 'Hem Radius' } },
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'down', steps: 12 } },
    { id: 'gen', type: 'latheGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0.03, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'waistRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'flareIn', sourceHandle: 'value', target: 'flareClamped', targetHandle: 'a' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'flareClamped', targetHandle: 'b' },
    { source: 'flareClamped', sourceHandle: 'value', target: 'onePlusFlare', targetHandle: 'a' },
    { source: 'oneIn', sourceHandle: 'value', target: 'onePlusFlare', targetHandle: 'b' },
    { source: 'scale', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'value' },
    { source: 'onePlusFlare', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'factor' },
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
