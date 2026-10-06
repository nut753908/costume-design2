import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
// glovesGroup の埋め込みサブグラフが参照する numberInput/numberMultiply/easedLatheCurve/
// latheGenerator/mirrorPair/toonMaterial/translate/sceneOutput を含め、全ノードタイプを
// 登録する。
import '../../definitions';

/** 内部の numberInput(`id`)の入力欄の値だけを差し替えた data で評価する。 */
function evaluateWithInput(type: string, id: string, value: number) {
  const def = getNodeType(type);
  const data = def.createDefaultData() as { nodes: { id: string; data: Record<string, unknown> }[] };
  const nodes = data.nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, value } } : node));
  return def.evaluate({}, { ...data, nodes });
}

// gloves は手袋1つぶんのジオメトリ(`Down` 出力の easedLatheCurve、始点=Wrist Radius、
// 終点=Hand Radius、どちらも固定値)を mirrorPair で ±Arm Spacing だけ
// X方向に離した左右対称ペアへまとめる(glovesGroupNode.ts のコメント参照)。mirrorPair は
// 元のジオメトリ(半径 r で X=0中心)を ±offset へ平行移動するだけなので、結合後の
// bounding box の最大Xは offset + max(startRadius, endRadius) に一致する。
describe('glovesGroup', () => {
  const ARM_SPACING = 0.1443;
  const ARM_RADIUS = 0.0523;
  const DEFAULTS = { wristRadius: 1.4 * ARM_RADIUS, handRadius: 1.55 * ARM_RADIUS, length: 0.16, placementY: 0.66572 };
  const maxRadius = Math.max(DEFAULTS.wristRadius, DEFAULTS.handRadius);

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('glovesGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('既定では Hand Radius が Wrist Radius より大きく、そちらが左右対称ペアの最大Xを決める', () => {
    const result = getNodeType('glovesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(ARM_SPACING + maxRadius, 5);
  });

  it('armSpacing の値を変えると左右の間隔になる', () => {
    const result = evaluateWithInput('glovesGroup', 'armSpacing', 0.5);
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.max.x).toBeCloseTo(0.5 + maxRadius, 5);
  });

  it('Length ぶん下(-Y)に伸び、取り付け位置(y=0.66572、手首より少し上で手の上端を覆う)へ置かれる', () => {
    const result = getNodeType('glovesGroup').evaluate({}, {});
    const geom = result.sceneOutputGeometry0?.type === 'geometry' ? result.sceneOutputGeometry0.value : undefined;
    geom!.computeBoundingBox();
    expect(geom!.boundingBox!.min.y).toBeCloseTo(-DEFAULTS.length + DEFAULTS.placementY, 5);
    expect(geom!.boundingBox!.max.y).toBeCloseTo(DEFAULTS.placementY, 5);
  });
});
