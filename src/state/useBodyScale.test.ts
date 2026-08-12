import { describe, expect, it } from 'vitest';
import type { Node } from '@xyflow/react';
import { readSeedNumber } from './useBodyScale';

function makeNode(id: string, value: unknown): Node {
  return { id, type: 'numberInput', position: { x: 0, y: 0 }, data: { value } };
}

describe('readSeedNumber', () => {
  it('id が一致するノードの value を返す', () => {
    const nodes = [makeNode('bodyHeight', 1.1)];
    expect(readSeedNumber(nodes, 'bodyHeight', 1)).toBe(1.1);
  });

  it('ノードが存在しない場合(ユーザーが削除した場合)はフォールバック値を返す', () => {
    expect(readSeedNumber([], 'bodyHeight', 1)).toBe(1);
  });

  it('value が数値でない場合はフォールバック値を返す', () => {
    const nodes = [makeNode('bodyHeight', 'not-a-number')];
    expect(readSeedNumber(nodes, 'bodyHeight', 1)).toBe(1);
  });

  it('id が異なる同名データのノードには反応しない', () => {
    const nodes = [makeNode('someOtherNode', 1.5)];
    expect(readSeedNumber(nodes, 'bodyHeight', 1)).toBe(1);
  });
});
