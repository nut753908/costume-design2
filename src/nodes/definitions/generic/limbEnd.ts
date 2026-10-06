import { defineGroupNode } from '../groupNodeFactory';

/** 腕の先端の手(脚では隠す小さな球)になる、つぶし・傾け・ずらしを加えた球を作る、`bodyGroupNode.ts` 用のグループノード。
 * 球の中心が原点(軸の先端)になる形を出力し、`limbPair` が `end` 入力で受け取って先端の高さへ置く。
 *
 * 半径は `radius × ratio`。`scaleX`/`scaleY`/`scaleZ` で幅・上下・前後につぶし/伸ばし、`pitch`(度)で前後へ、
 * `roll`(度)で左右へ傾け、中心を `shiftX`/`shiftY`/`shiftZ`(球の半径を単位にした量、X は +が外側)だけずらす。
 * 腕(手)と脚(足)で形が違うので、どれも呼び出し側の入力欄の値で持つ。 */
defineGroupNode({
  type: 'limbEnd',
  label: 'Limb End',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'radius', label: 'Radius', type: 'number', default: 0 },
          { id: 'ratio', label: 'Ratio', type: 'number', default: 1 },
          { id: 'scaleX', label: 'Scale X', type: 'number', default: 1 },
          { id: 'scaleY', label: 'Scale Y', type: 'number', default: 1 },
          { id: 'scaleZ', label: 'Scale Z', type: 'number', default: 1 },
          { id: 'pitch', label: 'Pitch (deg)', type: 'number', default: 0 },
          { id: 'roll', label: 'Roll (deg)', type: 'number', default: 0 },
          { id: 'shiftX', label: 'Shift X', type: 'number', default: 0 },
          { id: 'shiftY', label: 'Shift Y', type: 'number', default: 0 },
          { id: 'shiftZ', label: 'Shift Z', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'endRadius', type: 'numberMultiply', data: {} },
    { id: 'end', type: 'sphereGenerator', data: {} },
    { id: 'endScale', type: 'scale', data: {} },
    { id: 'endTilt', type: 'rotate', data: {} },
    { id: 'shiftXValue', type: 'numberMultiply', data: {} },
    { id: 'shiftYValue', type: 'numberMultiply', data: {} },
    { id: 'shiftZValue', type: 'numberMultiply', data: {} },
    { id: 'endTranslate', type: 'translate', data: {} },
    {
      id: 'output',
      type: 'groupOutput',
      data: { sockets: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }] },
    },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'radius', target: 'endRadius', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'ratio', target: 'endRadius', targetHandle: 'factor' },
    { source: 'endRadius', sourceHandle: 'value', target: 'end', targetHandle: 'radius' },
    { source: 'end', sourceHandle: 'geometry', target: 'endScale', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'scaleX', target: 'endScale', targetHandle: 'x' },
    { source: 'input', sourceHandle: 'scaleY', target: 'endScale', targetHandle: 'y' },
    { source: 'input', sourceHandle: 'scaleZ', target: 'endScale', targetHandle: 'z' },
    { source: 'endScale', sourceHandle: 'geometry', target: 'endTilt', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'pitch', target: 'endTilt', targetHandle: 'x' },
    { source: 'input', sourceHandle: 'roll', target: 'endTilt', targetHandle: 'z' },
    { source: 'endRadius', sourceHandle: 'value', target: 'shiftXValue', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'shiftX', target: 'shiftXValue', targetHandle: 'factor' },
    { source: 'endRadius', sourceHandle: 'value', target: 'shiftYValue', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'shiftY', target: 'shiftYValue', targetHandle: 'factor' },
    { source: 'endRadius', sourceHandle: 'value', target: 'shiftZValue', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'shiftZ', target: 'shiftZValue', targetHandle: 'factor' },
    { source: 'endTilt', sourceHandle: 'geometry', target: 'endTranslate', targetHandle: 'geometry' },
    { source: 'shiftXValue', sourceHandle: 'value', target: 'endTranslate', targetHandle: 'x' },
    { source: 'shiftYValue', sourceHandle: 'value', target: 'endTranslate', targetHandle: 'y' },
    { source: 'shiftZValue', sourceHandle: 'value', target: 'endTranslate', targetHandle: 'z' },
    { source: 'endTranslate', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
  ],
});
