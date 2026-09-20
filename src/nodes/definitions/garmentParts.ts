import type { GraphEdge, GraphNode } from '../types';

/** 「体に触れる半径」を Body Build でスケールする定型: 生の値(`rawValue`)× 外部ソケット
 * `input.bodyBuild` を `scale`(`numberMultiply`)で掛ける。生の値は `scale` の `Value` 入力欄に
 * 直接持たせる(他のノードと共有しない単独パラメータのため)。出力は `scale.value`。1つのグループで
 * 複数の半径をスケールする場合は、`scaleId` で別々の id を付ける。`input`(groupInput、`bodyBuild`
 * ソケットを持つ)が別途 `internalNodes` に存在することを前提にする(`nodes/CLAUDE.md` の
 * 「グループノード」節参照)。 */
export function bodyBuildScale(rawValue: number, scaleId = 'scale'): { nodes: GraphNode[]; edges: GraphEdge[] } {
  return {
    nodes: [{ id: scaleId, type: 'numberMultiply', data: { value: rawValue } }],
    edges: [{ source: 'input', sourceHandle: 'bodyBuild', target: scaleId, targetHandle: 'factor' }],
  };
}

/** 半径がイージングで変化する回転体の定型: `profile`(`easedLatheProfile`)→ `genId`
 * (`latheGenerator`)。`startRadius`/`endRadius`/`distance` は、他のノードの `value` 出力を配線する
 * 場合はそのノードの id、単独の値ならリテラルの数値(`profile` の入力欄の値になる)を渡す。
 * 分割数 `segments` は `genId` の入力欄の値。skirt/jacket/hat/gloves/pants/shoes/socks が使う。 */
export function latheBody(config: {
  genId: string;
  direction: 'up' | 'down';
  steps: number;
  startRadius: string | number;
  endRadius: string | number;
  distance: string | number;
  segments: number;
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const profileData: Record<string, unknown> = { direction: config.direction, steps: config.steps };
  const edges: GraphEdge[] = [
    { source: 'profile', sourceHandle: 'points', target: config.genId, targetHandle: 'points' },
  ];
  for (const key of ['startRadius', 'endRadius', 'distance'] as const) {
    const value = config[key];
    if (typeof value === 'number') profileData[key] = value;
    else edges.push({ source: value, sourceHandle: 'value', target: 'profile', targetHandle: key });
  }
  return {
    nodes: [
      { id: 'profile', type: 'easedLatheProfile', data: profileData },
      { id: config.genId, type: 'latheGenerator', data: { segments: config.segments } },
    ],
    edges,
  };
}

/** ネックラインの形(square/v/round)を「落ち込み量の曲線」(`points`、x=正面からの角度を 0〜1 に
 * 正規化した値、y=重み)として作るノード構成。`rampPoints`(y=x の斜め線)を土台に、形ごとに別々の
 * 加工チェーンを持つ: square は 0 倍して 1 を足した定数 1、v は -1 倍して 1 を足した `1 - t`、
 * round は自乗(`multiplyPointsY`)してから同様に `1 - t²`。倍率(0/-1)と足す値(1)は各ノードの
 * 入力欄の値。出力は `squareShape`/`vShape`/`roundShape` の `points` で、`ringGridGenerator` の
 * `necklineWeights` へ繋ぐ形を選ぶ(配線を付け替えると襟ぐりの形が切り替わる。選ばれなかった
 * 構成は評価されるだけで何にも使われない)。top/dress が使う。 */
export function necklineShapes(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const points = (source: string, target: string, targetHandle: string): GraphEdge => ({
    source,
    sourceHandle: 'points',
    target,
    targetHandle,
  });
  return {
    nodes: [
      { id: 'necklineRamp', type: 'rampPoints', data: { steps: 12 } },
      { id: 'squareScale', type: 'scalePointsY', data: { factor: 0 } },
      { id: 'squareShape', type: 'translatePointsY', data: { y: 1 } },
      { id: 'vScale', type: 'scalePointsY', data: { factor: -1 } },
      { id: 'vShape', type: 'translatePointsY', data: { y: 1 } },
      { id: 'roundSquared', type: 'multiplyPointsY', data: {} },
      { id: 'roundScale', type: 'scalePointsY', data: { factor: -1 } },
      { id: 'roundShape', type: 'translatePointsY', data: { y: 1 } },
    ],
    edges: [
      points('necklineRamp', 'squareScale', 'points'),
      points('squareScale', 'squareShape', 'points'),
      points('necklineRamp', 'vScale', 'points'),
      points('vScale', 'vShape', 'points'),
      points('necklineRamp', 'roundSquared', 'pointsA'),
      points('necklineRamp', 'roundSquared', 'pointsB'),
      points('roundSquared', 'roundScale', 'points'),
      points('roundScale', 'roundShape', 'points'),
    ],
  };
}
