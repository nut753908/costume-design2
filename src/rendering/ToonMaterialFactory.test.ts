import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createToonMaterial } from './ToonMaterialFactory';
import { getToonGradientTexture } from './gradientTexture';

describe('createToonMaterial', () => {
  it('指定した色の MeshToonMaterial を作る', () => {
    const material = createToonMaterial('#ff0000');
    expect(material.color.getHexString()).toBe('ff0000');
  });

  it('全ガーメントが同じセルシェーディングの帯を共有するよう、共有の gradientMap を使う', () => {
    const material = createToonMaterial('#00ff00');
    expect(material.gradientMap).toBe(getToonGradientTexture());
  });

  it('生成のたびに独立したマテリアルインスタンスを返す(色が違えば影響し合わない)', () => {
    const red = createToonMaterial('#ff0000');
    const blue = createToonMaterial('#0000ff');
    expect(red).not.toBe(blue);
    expect(red.color.getHexString()).not.toBe(blue.color.getHexString());
  });

  it('THREE.Color インスタンスを渡してもそのまま反映される', () => {
    const material = createToonMaterial(new THREE.Color('#123456'));
    expect(material.color.getHexString()).toBe('123456');
  });

  it('shadowColor を渡すと、標準のシェーダーを影の色へ寄せるものに差し替える(渡さなければ標準のまま)', () => {
    const plain = createToonMaterial('#fae6da');
    const shaded = createToonMaterial('#fae6da', '#f0c9ae');
    expect(plain.customProgramCacheKey()).not.toBe(shaded.customProgramCacheKey());
    const shader = { uniforms: {} as Record<string, { value: unknown }>, fragmentShader: THREE.ShaderLib.toon.fragmentShader };
    shaded.onBeforeCompile(shader as never, undefined as never);
    expect(shader.uniforms.uShadowColor.value).toBeInstanceOf(THREE.Color);
    expect(shader.fragmentShader).toContain('mix( uShadowColor, diffuseColor.rgb');
    expect(shader.fragmentShader).not.toContain('vec3 outgoingLight = reflectedLight.directDiffuse');
  });
});
