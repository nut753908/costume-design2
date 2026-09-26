import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getNodeType } from '../../registry';
import '../../definitions';

const num = (value: number) => ({ type: 'number' as const, value });

function evaluateGeometry(inputs: Record<string, number>): THREE.BufferGeometry {
  const result = getNodeType('torsoShape').evaluate(
    Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, num(v)])),
    {},
  );
  return result.geometry?.type === 'geometry' ? result.geometry.value : new THREE.BufferGeometry();
}

/** 高さ y 付近(±tolerance)の頂点の、Y軸からの最大距離。 */
function radiusAt(geometry: THREE.BufferGeometry, y: number, tolerance = 0.01): number {
  const position = geometry.getAttribute('position');
  let max = 0;
  for (let i = 0; i < position.count; i++) {
    if (Math.abs(position.getY(i) - y) < tolerance) max = Math.max(max, Math.hypot(position.getX(i), position.getZ(i)));
  }
  return max;
}

describe('torsoShape', () => {
  const base = { radius: 0.14, length: 0.28, waistRatio: 0.8, shoulderSquash: 0.6 };

  it('原点(股)から length + 2 × radius の高さまで伸び、横幅は radius に収まる', () => {
    const geometry = evaluateGeometry(base);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    expect(box.min.y).toBeCloseTo(0, 5);
    expect(box.max.y).toBeCloseTo(0.28 + 2 * 0.14, 5);
    expect(box.max.x).toBeCloseTo(0.14, 3);
  });

  it('くびれ(腰と胸の間)は radius × waistRatio まで細くなる', () => {
    const geometry = evaluateGeometry(base);
    // くびれの高さ = radius + span / 2、span = length + radius × (1 - shoulderSquash)
    expect(radiusAt(geometry, 0.14 + (0.28 + 0.14 * 0.4) / 2)).toBeCloseTo(0.14 * 0.8, 3);
  });

  it('肩は radius の球を shoulderSquash 倍につぶした丸み(胸の上端から radius × shoulderSquash だけ上で閉じる)', () => {
    const geometry = evaluateGeometry(base);
    const chestTopY = 0.14 + 0.28 + 0.14 * 0.4;
    expect(radiusAt(geometry, chestTopY, 0.005)).toBeCloseTo(0.14, 2);
    // 肩の球の中ほど(つぶした後の高さの半分)では、半径は sqrt(1 - 0.5²) × radius
    expect(radiusAt(geometry, chestTopY + 0.14 * 0.6 * 0.5, 0.005)).toBeCloseTo(0.14 * Math.sqrt(0.75), 2);
  });
});
