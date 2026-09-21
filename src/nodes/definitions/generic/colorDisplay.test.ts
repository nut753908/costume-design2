import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

describe('colorDisplay', () => {
  it('入力された color をそのまま評価結果に載せる', () => {
    const color = new THREE.Color('#22cc55');
    const result = getNodeType('colorDisplay').evaluate({ color: { type: 'color', value: color } }, {});
    expect(result.color).toEqual({ type: 'color', value: color });
  });

  it('未接続なら何も載せない', () => {
    expect(getNodeType('colorDisplay').evaluate({}, {})).toEqual({});
  });

  it('出力ソケットは宣言しない(他のノードへは配線できない)', () => {
    expect(getNodeType('colorDisplay').outputs).toEqual([]);
  });
});
