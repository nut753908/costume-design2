import { defineGroupNode } from '../groupNodeFactory';

/** 頭の左右の耳を作る、`bodyGroupNode.ts` 用のグループノード。頭(各高さが1つの楕円の輪)は、耳のような
 * 局所的な出っ張りを作れないので、頭の側面に付ける小さな楕円体を左右対称に置く。
 *
 * 位置と大きさは、すべて外部の頭の半径 `radius` に対する比(入力欄の値)で持つので、頭の大きさに相似で追従する:
 * 球の半径 = `radius × earRadius`、`earScale` の X/Y/Z で楕円体につぶし、頭の中心から X へ `radius × earX`
 * (左右に ±)、Y へ `radius × earY`、Z へ `radius × earZ` ずらして置く。`centerY`/`centerZ` は頭の中心の高さと前後位置。 */
defineGroupNode({
  type: 'earPair',
  label: 'Ear Pair',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Head Radius', type: 'number', default: 0 },
          { id: 'centerY', label: 'Head Center Y', type: 'number', default: 0 },
          { id: 'centerZ', label: 'Head Center Z', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'earRadius', type: 'numberMultiply', data: { factor: 0.17 } },
    { id: 'ear', type: 'sphereGenerator', data: {} },
    { id: 'earScale', type: 'scale', data: { x: 0.456, y: 1, z: 0.54 } },
    { id: 'offsetX', type: 'numberMultiply', data: { factor: 0.777 } },
    { id: 'offsetY', type: 'numberMultiply', data: { factor: -0.506 } },
    { id: 'offsetZ', type: 'numberMultiply', data: { factor: -0.147 } },
    { id: 'earY', type: 'numberAdd', data: {} },
    { id: 'earZ', type: 'numberAdd', data: {} },
    { id: 'earTranslate', type: 'translate', data: {} },
    { id: 'pair', type: 'mirrorPair', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: { sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }] },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'earRadius', targetHandle: 'value' },
    { source: 'earRadius', sourceHandle: 'value', target: 'ear', targetHandle: 'radius' },
    { source: 'ear', sourceHandle: 'geometry', target: 'earScale', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'radius', target: 'offsetX', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'radius', target: 'offsetY', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'radius', target: 'offsetZ', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'centerY', target: 'earY', targetHandle: 'a' },
    { source: 'offsetY', sourceHandle: 'value', target: 'earY', targetHandle: 'b' },
    { source: 'input', sourceHandle: 'centerZ', target: 'earZ', targetHandle: 'a' },
    { source: 'offsetZ', sourceHandle: 'value', target: 'earZ', targetHandle: 'b' },
    { source: 'earScale', sourceHandle: 'geometry', target: 'earTranslate', targetHandle: 'geometry' },
    { source: 'earY', sourceHandle: 'value', target: 'earTranslate', targetHandle: 'y' },
    { source: 'earZ', sourceHandle: 'value', target: 'earTranslate', targetHandle: 'z' },
    { source: 'earTranslate', sourceHandle: 'geometry', target: 'pair', targetHandle: 'geometry' },
    { source: 'offsetX', sourceHandle: 'value', target: 'pair', targetHandle: 'offset' },
    { source: 'pair', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
