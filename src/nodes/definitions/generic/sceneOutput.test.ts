import { describe, expect, it } from 'vitest';
import { getNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import './sceneOutput';

describe('sceneOutput', () => {
  it('接続された geometry/material をそのまま素通しする', () => {
    const geometry: SocketValue = { type: 'geometry', value: {} as never };
    const material: SocketValue = { type: 'material', value: {} as never };
    const result = getNodeType('sceneOutput').evaluate({ geometry, material }, {});
    expect(result).toEqual({ geometry, material });
  });

  it('未接続のソケットはリテラルなデフォルトを持たないため、出力にも現れない', () => {
    const result = getNodeType('sceneOutput').evaluate({}, {});
    expect(result).toEqual({});
  });

  it('createDefaultData は空オブジェクトを返す', () => {
    expect(getNodeType('sceneOutput').createDefaultData()).toEqual({});
  });
});
