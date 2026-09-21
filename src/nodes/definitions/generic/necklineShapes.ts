import { defineGroupNode } from '../groupNodeFactory';

/** ネックラインの形(square/v/round)を「落ち込み量の曲線」(`curve`、x=正面からの角度を 0〜1 に
 * 正規化した値、y=重み)として作るグループノード。`rampCurve`(y=x の斜め線)を土台に、形ごとに
 * 別々の加工チェーンを持つ: square は 0 倍して 1 を足した定数 1、v は -1 倍して 1 を足した
 * `1 - t`、round は自乗(`multiplyCurveY`)してから同様に `1 - t²`。倍率(0/-1)と足す値(1)は
 * 各ノードの入力欄の値。出力は `squareShape`/`vShape`/`roundShape` の `points` で、
 * `ringGridGenerator` の `necklineWeights` へ繋ぐ形を選ぶ(配線を付け替えると襟ぐりの形が
 * 切り替わる。選ばれなかった形は評価されるだけで何にも使われない)。top/dress が使う。 */
defineGroupNode({
  type: 'necklineShapes',
  label: 'Neckline Shapes',
  internalNodes: [
    { id: 'necklineRamp', type: 'rampCurve', data: {} },
    { id: 'squareScale', type: 'scaleCurveY', data: { factor: 0 } },
    { id: 'squareShape', type: 'translateCurveY', data: { y: 1 } },
    { id: 'vScale', type: 'scaleCurveY', data: { factor: -1 } },
    { id: 'vShape', type: 'translateCurveY', data: { y: 1 } },
    { id: 'roundSquared', type: 'multiplyCurveY', data: {} },
    { id: 'roundScale', type: 'scaleCurveY', data: { factor: -1 } },
    { id: 'roundShape', type: 'translateCurveY', data: { y: 1 } },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'squareShape', label: 'Square Shape', type: 'curve' },
          { id: 'vShape', label: 'V Shape', type: 'curve' },
          { id: 'roundShape', label: 'Round Shape', type: 'curve' },
        ],
      },
    },
  ],
  internalEdges: [
    { source: 'necklineRamp', sourceHandle: 'curve', target: 'squareScale', targetHandle: 'curve' },
    { source: 'squareScale', sourceHandle: 'curve', target: 'squareShape', targetHandle: 'curve' },
    { source: 'necklineRamp', sourceHandle: 'curve', target: 'vScale', targetHandle: 'curve' },
    { source: 'vScale', sourceHandle: 'curve', target: 'vShape', targetHandle: 'curve' },
    { source: 'necklineRamp', sourceHandle: 'curve', target: 'roundSquared', targetHandle: 'curveA' },
    { source: 'necklineRamp', sourceHandle: 'curve', target: 'roundSquared', targetHandle: 'curveB' },
    { source: 'roundSquared', sourceHandle: 'curve', target: 'roundScale', targetHandle: 'curve' },
    { source: 'roundScale', sourceHandle: 'curve', target: 'roundShape', targetHandle: 'curve' },
    { source: 'squareShape', sourceHandle: 'curve', target: 'output', targetHandle: 'squareShape' },
    { source: 'vShape', sourceHandle: 'curve', target: 'output', targetHandle: 'vShape' },
    { source: 'roundShape', sourceHandle: 'curve', target: 'output', targetHandle: 'roundShape' },
  ],
});
