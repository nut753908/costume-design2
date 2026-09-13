import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { computeBodyAnchors, computeBodyDimensions, computeBodyLayout } from '../../geometry/body';

const ANCHOR_KEYS = ['waist', 'shoulder', 'feet', 'wrist', 'head'] as const;
type AnchorKey = (typeof ANCHOR_KEYS)[number];

function isAnchorKey(value: string): value is AnchorKey {
  return (ANCHOR_KEYS as readonly string[]).includes(value);
}

/** geometry を、ボディのアンカー(waist/shoulder/feet/wrist/head)+offsetY が指す実座標へ
 * 平行移動するノード。Blender の Geometry Nodes で「別オブジェクトの位置をサンプリングして
 * Translate Geometry に渡す」のと同じ考え方 — 取り付け位置をノードグラフの外側を流れる
 * メタデータとして運ぶのではなく、ジオメトリの頂点座標そのものに焼き込む。
 *
 * これにより `garmentMesh`(および `groupOutput`、最終的に `Garments.tsx`)は anchor/offsetY
 * を一切知る必要がなくなり、常に「原点に置けば正しい位置になる」geometry+material の2つだけを
 * 扱えばよくなる(`nodes/CLAUDE.md` の「グループノード」節参照)。
 *
 * bodyHeight/bodyBuild/bodyShoulder は、`state/useBodyScale.ts` が直接読むのと同じ3つの
 * シードノードの値を、通常のソケット配線で受け取ったもの(`geometry/body.ts` の純粋関数は
 * React フックではないため、evaluate() の中で直接呼び出せる)。 */
registerNodeType({
  type: 'garmentPlacement',
  label: 'Garment Placement',
  category: 'generator',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'anchor', label: 'Anchor', type: 'enum' },
    { id: 'offsetY', label: 'Offset Y', type: 'number' },
    { id: 'bodyHeight', label: 'Body Height', type: 'number' },
    { id: 'bodyBuild', label: 'Body Build', type: 'number' },
    { id: 'bodyShoulder', label: 'Body Shoulder', type: 'number' },
  ],
  outputs: [{ id: 'geometry', label: 'Geometry', type: 'geometry' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    if (!inputs.geometry || inputs.geometry.type !== 'geometry') return {};

    const anchorKey = inputs.anchor?.type === 'enum' && isAnchorKey(inputs.anchor.value) ? inputs.anchor.value : 'waist';
    const offsetY = inputs.offsetY?.type === 'number' ? inputs.offsetY.value : 0;
    const heightScale = inputs.bodyHeight?.type === 'number' ? inputs.bodyHeight.value : 1;
    const buildScale = inputs.bodyBuild?.type === 'number' ? inputs.bodyBuild.value : 1;
    const shoulderScale = inputs.bodyShoulder?.type === 'number' ? inputs.bodyShoulder.value : 1;

    const anchors = computeBodyAnchors(computeBodyLayout(computeBodyDimensions({ heightScale, buildScale, shoulderScale })));
    const anchor = anchors[anchorKey];

    const translated = inputs.geometry.value.clone().translate(anchor.x, anchor.y + offsetY, anchor.z);
    return { geometry: { type: 'geometry', value: translated } };
  },
});
