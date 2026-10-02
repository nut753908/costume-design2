import { buildCylinderGeometry } from '../../../geometry/primitives';
import { defineGeneratorNode } from '../generatorNodeFactory';

/** 円柱(上下の半径を独立指定できるテーパー円柱)を生成する汎用プリミティブノード。
 * 特定のガーメント/パーツに紐付かない。radiusTop/radiusBottom をそのまま2つのソケットとして公開しているため、
 * 「根元より先端側をわずかに細くする」といったテーパー比率はこのノード自身は関知せず、
 * 呼び出し側のグラフ配線(`numberMultiply` 等)で表現する。 */
defineGeneratorNode({
  type: 'cylinderGenerator',
  label: 'Cylinder',
  build: (params) => buildCylinderGeometry(params),
  fields: [
    { id: 'radiusTop', label: 'Radius Top', default: 0.1 },
    { id: 'radiusBottom', label: 'Radius Bottom', default: 0.1 },
    { id: 'height', label: 'Height', default: 0.6 },
  ],
  extra: { radialSegments: 12 },
});
