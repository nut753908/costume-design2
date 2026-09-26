import { describe, expect, it, vi } from 'vitest';
import { getNodeType } from '../../registry';
import * as ringGridGeometry from '../../../geometry/ringGrid';
// topGroup の埋め込みサブグラフが参照する numberInput/
// garmentPlacement/easedLatheCurve/ringGridGenerator/sleevePair を含め、全ノードタイプを登録する。
import '../../definitions';

// topGroup は Top 本体と袖を1つのガーメントとして持つ。胴体半径(体の torsoRadius × 1.12)が
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

  it('torsoRadius × 1.12 が Top の胴体半径になり、袖の横位置は shoulderSpacing で決まる', () => {
    const spy = vi.spyOn(ringGridGeometry, 'buildRingGridGeometry');
    try {
      getNodeType('topGroup').evaluate({ torsoRadius: { type: 'number', value: 0.3 } }, {});
      expect(chestRowRadius(spy)).toBeCloseTo(0.3 * 1.12, 10);
    } finally {
      spy.mockRestore();
    }
    // 袖は ±shoulderSpacing(腕の中心)に置かれ、胴体半径では横に動かない。
    expect(sleevesOnly({ torsoRadius: { type: 'number', value: 0.3 } }).max.x).toBeCloseTo(sleevesOnly().max.x, 5);
    const wide = sleevesOnly({ shoulderSpacing: { type: 'number', value: 0.25 } });
    expect(wide.max.x - sleevesOnly().max.x).toBeCloseTo(0.25 - 0.15, 5);
  });

  it('未接続なら torsoRadius/neckRadius は groupInput ソケット自身のデフォルト(0.14/0.045)になり、最上段は首まわりの開口', () => {
    const spy = vi.spyOn(ringGridGeometry, 'buildRingGridGeometry');
    try {
      getNodeType('topGroup').evaluate({}, {});
      expect(chestRowRadius(spy)).toBeCloseTo(0.14 * 1.12, 10);
      const rows = spy.mock.calls[0][0] as { radius: number }[];
      expect(rows[0].radius).toBeCloseTo(0.045 * 1.8, 10);
    } finally {
      spy.mockRestore();
    }
  });

  it('袖の太さは armRadius に追従し、袖の付け根は torsoRadius × 0.7 だけ下がる(腕の上端の関節を覆い、肩の線から出ない高さ)', () => {
    const base = sleevesOnly();
    expect(sleevesOnly({ torsoRadius: { type: 'number', value: 0.3 } }).min.y).toBeCloseTo(base.min.y - (0.3 - 0.14) * 0.7, 5);
    expect(sleevesOnly({ armRadius: { type: 'number', value: 0.15 } }).min.y).toBeLessThan(base.min.y);
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
