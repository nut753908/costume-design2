import { describe, expect, it } from 'vitest';
import { MULTI_SOCKET_SLOT, MULTI_SOCKET_WIDTH, multiSocketHeight, multiSocketInsertIndex, multiSocketRowExtra, multiSocketSlotOffset } from './multiInputSocket';

describe('multiInputSocket', () => {
  it('カプセルは2本分を最小に、それ以降は1本ごとに MULTI_SOCKET_SLOT ずつ伸びる', () => {
    expect(multiSocketHeight(0)).toBe(MULTI_SOCKET_SLOT + MULTI_SOCKET_WIDTH);
    expect(multiSocketHeight(2)).toBe(MULTI_SOCKET_SLOT + MULTI_SOCKET_WIDTH);
    expect(multiSocketHeight(4)).toBe(3 * MULTI_SOCKET_SLOT + MULTI_SOCKET_WIDTH);
  });

  it('行が高くなる分は、カプセルが2本分を超えて伸びた分と一致する', () => {
    for (const count of [0, 1, 2, 3, 7]) {
      expect(multiSocketRowExtra(count)).toBe(multiSocketHeight(count) - multiSocketHeight(2));
    }
  });

  it('刺さる位置はソケット中心を挟んで上下対称に、MULTI_SOCKET_SLOT 間隔で並ぶ', () => {
    expect(multiSocketSlotOffset(0, 1)).toBe(0);
    expect([0, 1, 2].map((i) => multiSocketSlotOffset(i, 3))).toEqual([-MULTI_SOCKET_SLOT, 0, MULTI_SOCKET_SLOT]);
    // 端の刺さる位置は、カプセルの端から半幅(=丸みの中心)の所に来る。
    expect(multiSocketSlotOffset(3, 4)).toBe(multiSocketHeight(4) / 2 - MULTI_SOCKET_WIDTH / 2);
  });

  it('落とした位置より上に刺さっているエッジの本数が、新しいエッジの並び順になる', () => {
    const slots = [0, 1, 2].map((i) => multiSocketSlotOffset(i, 3));
    expect(multiSocketInsertIndex(slots[0] - 1, 3)).toBe(0);
    expect(multiSocketInsertIndex((slots[0] + slots[1]) / 2, 3)).toBe(1);
    expect(multiSocketInsertIndex((slots[1] + slots[2]) / 2, 3)).toBe(2);
    expect(multiSocketInsertIndex(slots[2] + 1, 3)).toBe(3);
    // カプセルの外で離しても端に入る。
    expect(multiSocketInsertIndex(-100, 3)).toBe(0);
    expect(multiSocketInsertIndex(100, 3)).toBe(3);
    expect(multiSocketInsertIndex(0, 0)).toBe(0);
  });
});
