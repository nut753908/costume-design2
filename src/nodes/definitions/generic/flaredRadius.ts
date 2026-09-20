import { defineGroupNode } from '../groupNodeFactory';

/** 基準の半径(`radius`)にフレア(`flare`)を掛けて、裾の半径を求めるグループノード。
 * `裾半径 = radius × (1 + max(0, flare))`。負のフレアは 0 として扱う(`flareClamped`、
 * `numberMax`)。`skirtGroupNode.ts`(Waist Radius → 裾)と `jacketGroupNode.ts`(Shoulder
 * Radius → 裾)が、同じ計算を可視の配線として共有する。出力ソケット `value` は
 * `garmentParts.ts` の `latheBody()` がそのまま半径として受け取れる形。
 * 定数 0/1 は `flareClamped`/`onePlusFlare` の `B` 入力欄の値。 */
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
    { id: 'flareClamped', type: 'numberMax', data: {} },
    { id: 'onePlusFlare', type: 'numberAdd', data: { b: 1 } },
    { id: 'hemRadiusCalc', type: 'numberMultiply', data: {} },
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
    { source: 'flareClamped', sourceHandle: 'value', target: 'onePlusFlare', targetHandle: 'a' },
    { source: 'input', sourceHandle: 'radius', target: 'hemRadiusCalc', targetHandle: 'value' },
    { source: 'onePlusFlare', sourceHandle: 'value', target: 'hemRadiusCalc', targetHandle: 'factor' },
    { source: 'hemRadiusCalc', sourceHandle: 'value', target: 'output', targetHandle: 'value' },
  ],
});
