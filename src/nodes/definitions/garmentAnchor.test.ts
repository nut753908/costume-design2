import { describe, expect, it } from 'vitest';
import { getNodeType } from '../registry';
import './garmentAnchor';

describe('garmentAnchor', () => {
  it('anchor と offsetY を data からそのまま出力する', () => {
    const result = getNodeType('garmentAnchor').evaluate({}, { anchor: 'shoulder', offsetY: 0.12 });
    expect(result.anchor).toEqual({ type: 'enum', value: 'shoulder' });
    expect(result.offsetY).toEqual({ type: 'number', value: 0.12 });
  });

  it('offsetY が未指定なら0になる', () => {
    const result = getNodeType('garmentAnchor').evaluate({}, { anchor: 'waist' });
    expect(result.offsetY).toEqual({ type: 'number', value: 0 });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('garmentAnchor').createDefaultData()).toEqual({ anchor: 'waist', offsetY: 0 });
  });
});
