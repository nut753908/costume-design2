import { defineGroupNode } from '../groupNodeFactory';

/** ユーザーが中身を一から組む空のグループ。中身はインスタンスごとの独立コピーなので、
 * これを複数置けばそれぞれが別々の自作グループになる。外部ソケットは中の
 * Group Input/Output で追加する(Blender の新規ノードグループと同じく左右に置く)。 */
defineGroupNode({
  type: 'customGroup',
  label: 'Group',
  userDefined: true,
  internalNodes: [
    { id: 'input', type: 'groupInput', data: { sockets: [] }, position: { x: 0, y: 0 } },
    { id: 'output', type: 'groupOutput', data: { sockets: [] }, position: { x: 400, y: 0 } },
  ],
  internalEdges: [],
});
