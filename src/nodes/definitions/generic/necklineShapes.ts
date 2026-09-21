import { defineGroupNode } from '../groupNodeFactory';

/** ネックラインの形(square/v/round)を「落ち込み量の曲線」(`points`、x=正面からの角度を 0〜1 に
 * 正規化した値、y=重み)として作るグループノード。`rampPoints`(y=x の斜め線)を土台に、形ごとに
 * 別々の加工チェーンを持つ: square は 0 倍して 1 を足した定数 1、v は -1 倍して 1 を足した
 * `1 - t`、round は自乗(`multiplyPointsY`)してから同様に `1 - t²`。倍率(0/-1)と足す値(1)は
 * 各ノードの入力欄の値。出力は `squareShape`/`vShape`/`roundShape` の `points` で、
 * `ringGridGenerator` の `necklineWeights` へ繋ぐ形を選ぶ(配線を付け替えると襟ぐりの形が
 * 切り替わる。選ばれなかった形は評価されるだけで何にも使われない)。top/dress が使う。 */
defineGroupNode({
  type: 'necklineShapes',
  label: 'Neckline Shapes',
  internalNodes: [
    { id: 'necklineRamp', type: 'rampPoints', data: { steps: 12 } },
    { id: 'squareScale', type: 'scalePointsY', data: { factor: 0 } },
    { id: 'squareShape', type: 'translatePointsY', data: { y: 1 } },
    { id: 'vScale', type: 'scalePointsY', data: { factor: -1 } },
    { id: 'vShape', type: 'translatePointsY', data: { y: 1 } },
    { id: 'roundSquared', type: 'multiplyPointsY', data: {} },
    { id: 'roundScale', type: 'scalePointsY', data: { factor: -1 } },
    { id: 'roundShape', type: 'translatePointsY', data: { y: 1 } },
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'squareShape', label: 'Square Shape', type: 'points' },
          { id: 'vShape', label: 'V Shape', type: 'points' },
          { id: 'roundShape', label: 'Round Shape', type: 'points' },
        ],
      },
    },
  ],
  internalEdges: [
    { source: 'necklineRamp', sourceHandle: 'points', target: 'squareScale', targetHandle: 'points' },
    { source: 'squareScale', sourceHandle: 'points', target: 'squareShape', targetHandle: 'points' },
    { source: 'necklineRamp', sourceHandle: 'points', target: 'vScale', targetHandle: 'points' },
    { source: 'vScale', sourceHandle: 'points', target: 'vShape', targetHandle: 'points' },
    { source: 'necklineRamp', sourceHandle: 'points', target: 'roundSquared', targetHandle: 'pointsA' },
    { source: 'necklineRamp', sourceHandle: 'points', target: 'roundSquared', targetHandle: 'pointsB' },
    { source: 'roundSquared', sourceHandle: 'points', target: 'roundScale', targetHandle: 'points' },
    { source: 'roundScale', sourceHandle: 'points', target: 'roundShape', targetHandle: 'points' },
    { source: 'squareShape', sourceHandle: 'points', target: 'output', targetHandle: 'squareShape' },
    { source: 'vShape', sourceHandle: 'points', target: 'output', targetHandle: 'vShape' },
    { source: 'roundShape', sourceHandle: 'points', target: 'output', targetHandle: 'roundShape' },
  ],
});
