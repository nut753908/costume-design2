import { defineGroupNode } from '../groupNodeFactory';
import { constNumberInput } from '../constNumberInput';

/** 基準の半径(`radius`)にフレア(`flare`)を掛けて、裾の半径を求めるグループノード。
 * `裾半径 = radius × (1 + max(0, flare))`。負のフレアは 0 として扱う(`flareClamped`、
 * `numberMax`)。`skirtGroupNode.ts`(Waist Radius → 裾)と `jacketGroupNode.ts`(Shoulder
 * Radius → 裾)が、同じ計算を可視の配線として共有する。出力ソケット `value` は
 * `garmentParts.ts` の `latheBody()` がそのまま半径として受け取れる形。
 * (`zeroIn`/`oneIn` は `constNumberInput()` で定義する「常に一定の値を持つ `numberInput`」) */
defineGroupNode({
  type: 'flaredRadius',
  label: 'Flared Radius',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'flare', label: 'Flare', type: 'number', default: 0 },
        ],
      },
    },
    constNumberInput('zeroIn', 0, 'Zero'),
    constNumberInput('oneIn', 1, 'One'),
    { id: 'flareClamped', type: 'numberMax', data: { label: 'Flare Clamped (≥0)' } },
    { id: 'onePlusFlare', type: 'numberAdd', data: { label: 'Hem Scale (1 + Flare)' } },
    { id: 'hemRadiusCalc', type: 'numberMultiply', data: { label: 'Hem Radius' } },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [{ id: 'value', label: 'Hem Radius', type: 'number' }],
      },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'flare', target: 'flareClamped', targetHandle: 'a' },
    { source: 'zeroIn', sourceHandle: 'value', target: 'flareClamped', targetHandle: 'b' },
    { source: 'flareClamped', sourceHandle: 'value', target: 'onePlusFlare', targetHandle: 'a' },
    { source: 'oneIn', sourceHandle: 'value', target: 'onePlusFlare', targetHandle: 'b' },
    { source: 'input', sourceHandle: 'radius', target: 'hemRadiusCalc', targetHandle: 'value' },
    { source: 'onePlusFlare', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'factor' },
    { source: 'hemRadiusCalc', sourceHandle: 'value', target: 'output', targetHandle: 'value' },
  ],
});
