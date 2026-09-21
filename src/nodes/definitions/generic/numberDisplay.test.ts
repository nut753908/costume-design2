import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import '../../definitions';

describe('numberDisplay', () => {
  it('入力された number をそのまま評価結果に載せる', () => {
    const result = getNodeType('numberDisplay').evaluate({ value: { type: 'number', value: 1.25 } }, {});
    expect(result.value).toEqual({ type: 'number', value: 1.25 });
  });

  it('未接続なら何も載せない', () => {
    expect(getNodeType('numberDisplay').evaluate({}, {})).toEqual({});
  });

  it('出力ソケットは宣言しない(他のノードへは配線できない)', () => {
    expect(getNodeType('numberDisplay').outputs).toEqual([]);
  });
});
