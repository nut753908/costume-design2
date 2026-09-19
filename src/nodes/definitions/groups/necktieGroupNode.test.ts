import * as THREE from 'three';
import { describe, expect, it, vi } from 'vitest';
import { getNodeType } from '../../registry';
import * as necktieGeometry from '../../../geometry/necktie';
// necktieGroup の埋め込みサブグラフが参照する numberInput/colorInput/necktieGenerator/
// toonMaterial/garmentPlacement/sceneOutput を含め、全ノードタイプを登録する。
import '../../definitions';

// necktie の寸法はグループ内部の numberInput/colorInput に閉じ、前面の深さ(Front Depth)だけが
// Body Build でスケールされる(necktieGroupNode.ts のコメント参照)。geometry/necktie.ts の buildNecktieGeometry() をそのまま呼ぶ necktieGenerator
// への配線が正しいことを、その呼び出し引数を spy で検証する(topGroupNode.test.ts と同じ手法)。
describe('necktieGroup', () => {
  const DEFAULTS = {
    knotWidth: 0.05,
    knotHeight: 0.04,
    knotThickness: 0.025,
    bladeTopWidth: 0.035,
    bladeBottomWidth: 0.06,
    bladeThickness: 0.008,
    bladeLength: 0.4,
    frontDepth: 0.3,
  };

  it('未接続でも(groupInput ソケット自身のデフォルトにより)描画対象として出力される', () => {
    const result = getNodeType('necktieGroup').evaluate({}, {});
    expect(result.sceneOutputGeometry0?.type).toBe('geometry');
    expect(result.sceneOutputMaterial0?.type).toBe('material');
  });

  it('各 numberInput の既定値がそのまま buildNecktieGeometry() へ渡る', () => {
    const spy = vi.spyOn(necktieGeometry, 'buildNecktieGeometry');
    try {
      getNodeType('necktieGroup').evaluate({}, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining(DEFAULTS));
    } finally {
      spy.mockRestore();
    }
  });

  it('bodyBuild を掛けた Front Depth が buildNecktieGeometry() へ渡る(胴体の壁の拡大に追従する)', () => {
    const spy = vi.spyOn(necktieGeometry, 'buildNecktieGeometry');
    try {
      getNodeType('necktieGroup').evaluate({ bodyBuild: { type: 'number', value: 1.2 } }, {});
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ frontDepth: 0.3 * 1.2 }));
    } finally {
      spy.mockRestore();
    }
  });

  it('内部の colorIn(デフォルト #7a1f2b)が sceneOutputMaterial0 に使われる', () => {
    const result = getNodeType('necktieGroup').evaluate({}, {});
    const material = result.sceneOutputMaterial0;
    const color = material?.type === 'material' ? (material.value as THREE.MeshToonMaterial).color : undefined;
    expect(color?.getHexString()).toBe(new THREE.Color('#7a1f2b').getHexString());
  });

  it('anchorY が配線されると Offset Y(既定0)に加算されて平行移動される', () => {
    const withoutAnchor = getNodeType('necktieGroup').evaluate({}, {});
    const withAnchor = getNodeType('necktieGroup').evaluate({ anchorY: { type: 'number', value: 1 } }, {});
    const geomWithout = withoutAnchor.sceneOutputGeometry0?.type === 'geometry' ? withoutAnchor.sceneOutputGeometry0.value : undefined;
    const geomWith = withAnchor.sceneOutputGeometry0?.type === 'geometry' ? withAnchor.sceneOutputGeometry0.value : undefined;
    geomWithout!.computeBoundingBox();
    geomWith!.computeBoundingBox();
    expect(geomWith!.boundingBox!.min.y).toBeCloseTo(geomWithout!.boundingBox!.min.y + 1, 5);
  });
});
