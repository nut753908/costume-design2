import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
// topGroup の埋め込みサブグラフが参照する numberInput/colorInput/numberMultiply/
// toonMaterial/garmentOutput/topGenerator を含め、全ノードタイプを登録する。
import '../definitions';

// topGroup は sleeve から topRadiusScale/topMaterial 相当の内部値を再引きされるため、
// terminalNodeId(garmentOutput相当)の geometry/material/anchor/offsetY だけでなく、
// attachRadiusScaled/material という追加の出力ソケットも正しく転送する必要がある。
describe('topGroup', () => {
  it('Body Build を反映した Attach Radius(Scaled) を出力する', () => {
    const result = getNodeType('topGroup').evaluate(
      {
        torsoRadius: { type: 'number', value: 0.3 },
        bodyBuild: { type: 'number', value: 1.2 },
      },
      {},
    );
    expect(result.attachRadiusScaled).toEqual({ type: 'number', value: 0.3 * 1.2 });
  });

  it('Color の変更が material 出力に反映される(Sleeve の再引き先)', () => {
    const result = getNodeType('topGroup').evaluate(
      { color: { type: 'color', value: new THREE.Color('#112233') } },
      {},
    );
    expect(result.material?.type).toBe('material');
    // toonMaterial の内部実装(createToonMaterial)が色を反映しているかは
    // toonMaterial.test.ts の責務。ここでは topGroup が colorIn の値を正しく
    // 埋め込みサブグラフの toonMaterial ノードへ注入していることだけを確認する。
    const material = result.material?.type === 'material' ? (result.material.value as THREE.MeshToonMaterial) : undefined;
    expect(material?.color.getHexString()).toBe('112233');
  });

  it('未接続なら埋め込みサブグラフ自身のデフォルト値が使われる', () => {
    const result = getNodeType('topGroup').evaluate({}, {});
    // torsoRadiusIn のデフォルト(0.29) * bodyBuildIn のデフォルト(1)
    expect(result.attachRadiusScaled).toEqual({ type: 'number', value: 0.29 });
  });

  it('geometry/anchor/offsetY のような terminalNodeId 由来のキーも転送される', () => {
    const result = getNodeType('topGroup').evaluate({}, {});
    expect(result.geometry?.type).toBe('geometry');
    expect(result.anchor).toEqual({ type: 'enum', value: 'shoulder' });
    expect(result.offsetY).toEqual({ type: 'number', value: 0 });
  });
});
