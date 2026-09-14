import * as THREE from 'three';
import { buildMirroredPairGeometry } from './mirrorPair';

/** 手首/足首側を根元よりわずかに細くする、Body(3Dモデル本体)由来の固定テーパー比率
 * (旧 scene/Body.tsx にあった `D.armRadius * 0.85` と同じ値)。ソケット化するほどの
 * 独立した意味を持たないスタイル寄りの定数のため、他ガーメントの `extra`(角度分割数など)
 * と同じ扱いでここに固定値として持つ。 */
const LIMB_TAPER_RATIO = 0.85;

/** 胴体(カプセル)。THREE.js 標準プリミティブをそのまま返すだけなので、
 * 巻き順は最初から正しい(geometry/CLAUDE.md の bag.ts/glasses.ts と同じ理由)。 */
export function buildTorsoGeometry({ radius, length }: { radius: number; length: number }): THREE.BufferGeometry {
  return new THREE.CapsuleGeometry(radius, length, 4, 16);
}

/** 頭部(球)。 */
export function buildHeadGeometry({ radius }: { radius: number }): THREE.BufferGeometry {
  return new THREE.SphereGeometry(radius, 20, 16);
}

/** 腕/脚のような左右対称な四肢1組。`mirrorPair.ts` の `buildMirroredPairGeometry()` を
 * gloves/shoes/socks と同じ考え方で流用し、±spacing だけ X方向に離れた2本の円柱
 * (先端側を `LIMB_TAPER_RATIO` だけ細くしたテーパー円柱)を1つのジオメトリへまとめる。 */
export function buildLimbPairGeometry({
  radius,
  length,
  spacing,
}: {
  radius: number;
  length: number;
  spacing: number;
}): THREE.BufferGeometry {
  return buildMirroredPairGeometry(
    () => new THREE.CylinderGeometry(radius, radius * LIMB_TAPER_RATIO, length, 12),
    spacing,
  );
}
