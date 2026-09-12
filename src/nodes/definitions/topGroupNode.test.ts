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
    // torsoRadius は他ガーメントと共有されない単独パラメータのため、外部から注入できる
    // 公開ソケットではなくなった(内部ノード torsoRadiusIn のデフォルト 0.29 が使われる)。
    // 外部から接続できるのは全ガーメント共有の bodyBuild のみ。
    const result = getNodeType('topGroup').evaluate({ bodyBuild: { type: 'number', value: 1.2 } }, {});
    expect(result.attachRadiusScaled).toEqual({ type: 'number', value: 0.29 * 1.2 });
  });

  it('material 出力に topGroup 内部の Color(colorIn のデフォルト)が反映される(Sleeve の再引き先)', () => {
    // color も外部から注入できる公開ソケットではなくなったため、内部ノード colorIn の
    // デフォルト値(#5b8fa8)がそのまま toonMaterial へ渡ることを確認する。
    const result = getNodeType('topGroup').evaluate({}, {});
    expect(result.material?.type).toBe('material');
    // toonMaterial の内部実装(createToonMaterial)が色を反映しているかは
    // toonMaterial.test.ts の責務。ここでは topGroup が colorIn の値を正しく
    // 埋め込みサブグラフの toonMaterial ノードへ渡していることだけを確認する。
    const material = result.material?.type === 'material' ? (result.material.value as THREE.MeshToonMaterial) : undefined;
    expect(material?.color.getHexString()).toBe('5b8fa8');
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
