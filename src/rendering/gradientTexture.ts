import * as THREE from 'three';

let cached: THREE.DataTexture | null = null;

/** すべてのガーメント/ボディが同じセルシェーディングの帯を共有するための、共通の4段階トゥーングラデーションマップ。 */
export function getToonGradientTexture(): THREE.DataTexture {
  if (cached) return cached;

  const bandCount = 4;
  const data = new Uint8Array(bandCount);
  for (let i = 0; i < bandCount; i++) {
    data[i] = Math.round((i / (bandCount - 1)) * 255);
  }

  const texture = new THREE.DataTexture(data, bandCount, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  cached = texture;
  return texture;
}
