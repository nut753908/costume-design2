import { describe, expect, it } from 'vitest';
import * as topGeometry from '../../geometry/top';
import { getNodeType } from '../registry';
import './topGenerator';
import { expectGeneratorForwardsData } from './testHelpers';

describe('topGenerator', () => {
  it('data の各フィールドを取り違えずに buildTopGeometry へ渡す(angle/heightSegmentsは固定値)', () => {
    expectGeneratorForwardsData(topGeometry, 'buildTopGeometry', 'topGenerator', {
      torsoRadius: 0.31,
      length: 0.53,
      necklineType: 'v',
      necklineDepth: 0.15,
      angleSegments: 24,
      heightSegments: 10,
    });
  });

  it('createDefaultData は既定値一式を返す', () => {
    expect(getNodeType('topGenerator').createDefaultData()).toEqual({
      torsoRadius: 0.29,
      length: 0.5,
      necklineType: 'round',
      necklineDepth: 0.12,
    });
  });
});
