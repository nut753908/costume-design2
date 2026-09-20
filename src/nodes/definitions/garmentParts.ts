import type { GraphEdge, GraphNode } from '../types';
import { constNumberInput } from './constNumberInput';

/** 「体に触れる半径」を Body Build でスケールする定型: 生パラメータ(`rawId`、`value` 出力を持つ
 * ノードの id)× 外部ソケット `input.bodyBuild` を `scale`(`numberMultiply`)で掛ける。
 * 出力は `scale.value`。1つのグループで複数の半径をスケールする場合は、`scaleId` で
 * 別々の id を付ける。`input`(groupInput、`bodyBuild` ソケットを持つ)が別途
 * `internalNodes` に存在することを前提にする(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
export function bodyBuildScale(rawId: string, scaleId = 'scale'): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [{ id: scaleId, type: 'numberMultiply', data: {} }],
    edges: [
      { source: rawId, sourceHandle: 'value', target: scaleId, targetHandle: 'value' },
      { source: 'input', sourceHandle: 'bodyBuild', target: scaleId, targetHandle: 'factor' },
    ],
  };
}

/** 半径がイージングで変化する回転体の定型: `profile`(`easedLatheProfile`)→ `genId`
 * (`latheGenerator`)。`startRadius`/`endRadius`/`distance` は `value` 出力を持つノードの id で、
 * 分割数は `segmentsIn`(numberInput)を配線する(グループ内に別途存在することが前提)。
 * skirt/jacket/hat/gloves/pants/shoes/socks が使う。 */
export function latheBody(config: {
  genId: string;
  direction: 'up' | 'down';
  steps: number;
  startRadius: string;
  endRadius: string;
  distance: string;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [
      { id: 'profile', type: 'easedLatheProfile', data: { direction: config.direction, steps: config.steps } },
      { id: config.genId, type: 'latheGenerator', data: {} },
    ],
    edges: [
      { source: config.startRadius, sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
      { source: config.endRadius, sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
      { source: config.distance, sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
      { source: 'profile', sourceHandle: 'points', target: config.genId, targetHandle: 'points' },
      { source: 'segmentsIn', sourceHandle: 'value', target: config.genId, targetHandle: 'segments' },
    ],
  };
}

/** ネックラインの形(square/v/round)を「落ち込み量の曲線」(`points`、x=正面からの角度を 0〜1 に
 * 正規化した値、y=重み)として作るノード構成。`rampPoints`(y=x の斜め線)を土台に、形ごとに別々の
 * 加工チェーンを持つ: square は 0 倍して 1 を足した定数 1、v は -1 倍して 1 を足した `1 - t`、
 * round は自乗(`multiplyPointsY`)してから同様に `1 - t²`。出力は `squareShape`/`vShape`/
 * `roundShape` の `points` で、`ringGridGenerator` の `necklineWeights` へ繋ぐ形を選ぶ
 * (配線を付け替えると襟ぐりの形が切り替わる。選ばれなかった構成は評価されるだけで何にも使われない)。
 * top/dress が使う。 */
export function necklineShapes(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const points = (source: string, target: string, targetHandle: string): GraphEdge => ({
    source,
    sourceHandle: 'points',
    target,
    targetHandle,
  });
  const value = (source: string, target: string, targetHandle: string): GraphEdge => ({
    source,
    sourceHandle: 'value',
    target,
    targetHandle,
  });
  return {
    nodes: [
      { id: 'necklineRamp', type: 'rampPoints', data: { steps: 12 } },
      constNumberInput('necklineZero', 0),
      constNumberInput('necklineOne', 1),
      constNumberInput('necklineMinusOne', -1),
      { id: 'squareScale', type: 'scalePointsY', data: {} },
      { id: 'squareShape', type: 'translatePointsY', data: {} },
      { id: 'vScale', type: 'scalePointsY', data: {} },
      { id: 'vShape', type: 'translatePointsY', data: {} },
      { id: 'roundSquared', type: 'multiplyPointsY', data: {} },
      { id: 'roundScale', type: 'scalePointsY', data: {} },
      { id: 'roundShape', type: 'translatePointsY', data: {} },
    ],
    edges: [
      points('necklineRamp', 'squareScale', 'points'),
      value('necklineZero', 'squareScale', 'factor'),
      points('squareScale', 'squareShape', 'points'),
      value('necklineOne', 'squareShape', 'y'),
      points('necklineRamp', 'vScale', 'points'),
      value('necklineMinusOne', 'vScale', 'factor'),
      points('vScale', 'vShape', 'points'),
      value('necklineOne', 'vShape', 'y'),
      points('necklineRamp', 'roundSquared', 'pointsA'),
      points('necklineRamp', 'roundSquared', 'pointsB'),
      points('roundSquared', 'roundScale', 'points'),
      value('necklineMinusOne', 'roundScale', 'factor'),
      points('roundScale', 'roundShape', 'points'),
      value('necklineOne', 'roundShape', 'y'),
    ],
  };
}
