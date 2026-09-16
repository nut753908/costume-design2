import { defineGroupNode } from './groupNodeFactory';

/** hat は bodyBuild によるスケーリング対象外(headRadius が `bodyDimensionsGroup` の中で
 * buildScale の影響を受けないため)なので Body Build 入力は無く、
 * profile(easedLatheProfile)+hatGen(latheGenerator)+hatMaterial(toonMaterial)+
 * offsetYIn(numberInput)+placement(garmentPlacement)+sceneOut(sceneOutput) の6ノードを1枚に
 * まとめる。Brim Radius/Crown Radius/Height/Color も他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから配線される
 * headCenterY)だけが唯一の外部ソケット。
 *
 * プロファイル生成は `pantsGroupNode.ts` 等と同じ理由で `easedLatheProfile`→
 * `latheGenerator` という汎用ノードの組み合わせへ展開している(`geometry/hat.ts`/
 * `nodes/definitions/hatGenerator.ts` は呼び出し元が無くなったため削除済み)。head は左右対称な
 * 単一パーツなので `mirrorPair` は挟まない(`buildHatGeometry()` のコメント参照)。hat は
 * shoes/socks と同じ `direction: 'up'`(つばから上=クラウン側へ伸びる)。`hatGen` の Segments は
 * gloves と同様 `segmentsIn` を持たず、以前の `hatGenerator` の既定値(20)をそのまま
 * `latheGenerator` インスタンスの `data.segments` に引き継いでいる(未接続のため編集はできない、
 * 既存の挙動を変えていないだけ)。 */
defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 }],
      },
    },
    { id: 'brimRadiusIn', type: 'numberInput', data: { value: 0.2, min: 0.15, max: 0.3, step: 0.01, label: 'Brim Radius' } },
    { id: 'crownRadiusIn', type: 'numberInput', data: { value: 0.02, min: 0, max: 0.15, step: 0.005, label: 'Crown Radius' } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.35, min: 0.1, max: 0.6, step: 0.01, label: 'Height' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#4a3b6b', label: 'Hat Color' } },
    { id: 'profile', type: 'easedLatheProfile', data: { direction: 'up', steps: 10 } },
    { id: 'gen', type: 'latheGenerator', data: { segments: 20 } },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0.1, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'brimRadiusIn', sourceHandle: 'value', target: 'profile', targetHandle: 'startRadius' },
    { source: 'crownRadiusIn', sourceHandle: 'value', target: 'profile', targetHandle: 'endRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'profile', targetHandle: 'distance' },
    { source: 'profile', sourceHandle: 'points', target: 'gen', targetHandle: 'points' },
    { source: 'gen', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'anchorY', target: 'placement', targetHandle: 'anchorY' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
