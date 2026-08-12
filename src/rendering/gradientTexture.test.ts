import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { getToonGradientTexture } from './gradientTexture';

describe('getToonGradientTexture', () => {
  it('全ガーメント/ボディが同じセルシェーディング帯を共有できるよう、常に同じインスタンスを返す(キャッシュされたシングルトン)', () => {
    expect(getToonGradientTexture()).toBe(getToonGradientTexture());
  });

  it('4段階(0, 85, 170, 255)のグラデーションデータを持つ', () => {
    const texture = getToonGradientTexture();
    const data = texture.image.data as Uint8Array;
    expect(Array.from(data)).toEqual([0, 85, 170, 255]);
  });

  it('セルシェーディングのはっきりした境界を保つため、フィルタリングされない設定になっている', () => {
    const texture = getToonGradientTexture();
    expect(texture.minFilter).toBe(THREE.NearestFilter);
    expect(texture.magFilter).toBe(THREE.NearestFilter);
    expect(texture.generateMipmaps).toBe(false);
  });
});
