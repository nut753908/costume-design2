import { buildTorusGeometry } from '../../../geometry/primitives';
import { defineGeneratorNode } from '../generatorNodeFactory';

/** 円環(トーラス)を生成する汎用プリミティブノード。特定のガーメント/パーツに紐付かない。
 * radialSegments(管の断面の分割数)/tubularSegments(中心円周の分割数)は見た目に影響するが
 * ソケット化するほどの独立した意味を持たないスタイル寄りの値のため `extra` に固定する
 * (他のプリミティブノードの capSegments 等と同じ扱い)。 */
defineGeneratorNode({
  type: 'torusGenerator',
  label: 'Torus',
  build: (params) => buildTorusGeometry(params),
  fields: [
    { id: 'radius', label: 'Radius', default: 0.1 },
    { id: 'tube', label: 'Tube', default: 0.02 },
  ],
  extra: { radialSegments: 8, tubularSegments: 16 },
});
