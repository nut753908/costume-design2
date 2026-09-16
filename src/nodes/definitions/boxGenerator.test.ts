import { describe, expect, it } from 'vitest';
import * as primitives from '../../geometry/primitives';
import { getNodeType } from '../registry';
import './boxGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('boxGenerator', () => {
  it('data の各フィールドを取り違えずに buildBoxGeometry へ渡す', () => {
    expectGeneratorForwardsData(primitives, 'buildBoxGeometry', 'boxGenerator', {
      width: 0.15,
      height: 0.25,
      depth: 0.08,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('boxGenerator').createDefaultData()).toEqual({ width: 0.1, height: 0.1, depth: 0.1 });
  });
});
