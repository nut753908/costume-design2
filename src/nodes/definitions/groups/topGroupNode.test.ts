import { describe, expect, it, vi } from 'vitest';
import { getNodeType } from '../../registry';
import * as ringGridGeometry from '../../../geometry/ringGrid';
// topGroup の埋め込みサブグラフが参照する numberInput/
// garmentPlacement/easedLatheCurve/ringGridGenerator/sleevePair を含め、全ノードタイプを登録する。
import { BODY_DIMENSIONS } from '../bodyDimensionDefaults';
import '../../definitions';

// topGroup は Top 本体と袖を1つのガーメントとして持つ。胴体半径(BODY_DIMENSIONS.torsoRadius × 1.12)が
// Top の胴体半径と袖の付け根半径の両方に渡る。
describe('topGroup', () => {
  /** 内部の gen → merge の配線を切り、袖だけを描画させたときのジオメトリ。 */
  const sleevesOnly = (inputs: Record<string, { type: 'number'; value: number }> = {}) => {
    const def = getNodeType('topGroup');
    const data = def.createDefaultData() as { nodes: unknown[]; edges: { source: string; target: string }[] };
    const edges = data.edges.filter((e) => !(e.source === 'gen' && e.target === 'merge'));
    const result = def.evaluate(inputs, { ...data, edges });
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    return geom!.boundingBox!;
  };

  it('Top の胴体半径は BODY_DIMENSIONS.torsoRadius × 1.12 の固定値で、袖の横位置は shoulderSpacing で決まる', () => {
    const spy = vi.spyOn(ringGridGeometry, 'buildRingGridGeometry');
    try {
      getNodeType('topGroup').evaluate({}, {});
      expect(chestRowRadius(spy)).toBeCloseTo(BODY_DIMENSIONS.torsoRadius * 1.12, 10);
    } finally {
      spy.mockRestore();
    }
    const wide = sleevesOnly({ shoulderSpacing: { type: 'number', value: 0.25 } });
    expect(wide.max.x - sleevesOnly().max.x).toBeCloseTo(0.25 - 0.15, 5);
  });

  it('最上段は、BODY_DIMENSIONS.neckRadius × 1.8 の首まわりの開口', () => {
    const spy = vi.spyOn(ringGridGeometry, 'buildRingGridGeometry');
    try {
      getNodeType('topGroup').evaluate({}, {});
      const rows = spy.mock.calls[0][0] as { radius: number }[];
      expect(rows[0].radius).toBeCloseTo(BODY_DIMENSIONS.neckRadius * 1.8, 10);
    } finally {
      spy.mockRestore();
    }
  });

  it('袖の付け根は BODY_DIMENSIONS.torsoRadius × 0.7 だけ下がる(腕の上端の関節を覆い、肩の線から出ない高さ)', () => {
    const def = getNodeType('topGroup');
    const data = def.createDefaultData() as { nodes: { id: string; data: Record<string, unknown> }[]; edges: { source: string; target: string }[] };
    const sleeveMinY = (drop: number) => {
      const nodes = data.nodes.map((n) => (n.id === 'sleeveDrop' ? { ...n, data: { ...n.data, value: drop } } : n));
      const edges = data.edges.filter((e) => !(e.source === 'gen' && e.target === 'merge'));
      const result = def.evaluate({}, { ...data, nodes, edges });
      const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
      geom!.computeBoundingBox();
      return geom!.boundingBox!.min.y;
    };
    expect(sleeveMinY(-BODY_DIMENSIONS.torsoRadius * 0.7)).toBeCloseTo(sleeveMinY(0) - BODY_DIMENSIONS.torsoRadius * 0.7, 5);
  });

  it('Top と袖は1つのジオメトリへ結合され、sceneOutputGeometry0/sceneOutputMaterial0 の1組だけが出力される(anchor/offsetY は含まれない — garmentPlacement が内部で消費し座標へ焼き込む)', () => {
    const result = getNodeType('topGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
    expect(result.sceneOutputGeometry1).toBeUndefined();
    expect(result.anchor).toBeUndefined();
    expect(result.offsetY).toBeUndefined();
  });

  it('結合後の頂点数は Top 単体より多い(袖ぶんが乗っている)', () => {
    const count = (r: ReturnType<ReturnType<typeof getNodeType>['evaluate']>) =>
      r.sceneOutputGeometry0?.type === 'geometry' ? r.sceneOutputGeometry0.value.getAttribute('position').count : 0;
    const withSleeves = count(getNodeType('topGroup').evaluate({}, {}));
    expect(withSleeves).toBeGreaterThan(0);
    const topOnly = buildTopOnlyVertexCount();
    expect(withSleeves).toBeGreaterThan(topOnly);
  });

  it('内部の sleeveGen からの配線を切ると、Top 本体だけが描画される', () => {
    const def = getNodeType('topGroup');
    const data = def.createDefaultData() as { nodes: unknown[]; edges: { source: string; target: string }[] };
    const withoutSleeves = { ...data, edges: data.edges.filter((e) => e.source !== 'sleeveGen') };
    const result = def.evaluate({}, withoutSleeves);
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    const count = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value.getAttribute('position').count : 0;
    expect(count).toBe(buildTopOnlyVertexCount());
  });
});

/** 直近の buildRingGridGeometry() 呼び出しの胸の段(肩の丸みと胴の継ぎ目、shoulderedProfile の
 * 曲線の中央)の半径。 */
function chestRowRadius(spy: { mock: { calls: unknown[][] } }): number {
  const rows = spy.mock.calls[0][0] as { radius: number }[];
  return rows[(rows.length - 1) / 2].radius;
}

/** angleSegments=24、heightSegments=16 のリンググリッドの頂点数。 */
function buildTopOnlyVertexCount(): number {
  return (24 + 1) * (16 + 1);
}
