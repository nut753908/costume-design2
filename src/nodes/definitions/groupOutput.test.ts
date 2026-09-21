import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import '../definitions';

describe('groupOutput', () => {
  const sockets = [
    { id: 'n', label: 'N', type: 'number', default: 2.5 },
    { id: 'c', label: 'C', type: 'color', default: '#112233' },
    { id: 'plain', label: 'Plain', type: 'number' },
    { id: 'g', label: 'G', type: 'geometry' },
  ];

  it('何も配線されていない number/color のソケットは、そのソケットのデフォルト値を出力する', () => {
    const result = getNodeType('groupOutput').evaluate({}, { sockets });
    expect(result.n).toEqual({ type: 'number', value: 2.5 });
    expect(result.c?.type === 'color' && result.c.value.getHexString()).toBe(new THREE.Color('#112233').getHexString());
  });

  it('デフォルト値を持たない number ソケットは 0 を出力し、geometry は何も出力しない', () => {
    const result = getNodeType('groupOutput').evaluate({}, { sockets });
    expect(result.plain).toEqual({ type: 'number', value: 0 });
    expect(result.g).toBeUndefined();
  });

  it('配線された値はデフォルト値より優先される', () => {
    const result = getNodeType('groupOutput').evaluate({ n: { type: 'number', value: 9 } }, { sockets });
    expect(result.n).toEqual({ type: 'number', value: 9 });
  });
});
