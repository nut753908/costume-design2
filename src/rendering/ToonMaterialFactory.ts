import * as THREE from 'three';
import { getToonGradientTexture } from './gradientTexture';

/** `Lighting.tsx` のライトで、いちばん明るい段の面が持つ明るさ(= 受けた光 / マテリアルの色の輝度)。
 * `shadowColor` つきのマテリアルは、これを「色そのままの明るさ」とみなし、そこから暗くなるぶんだけ影の色へ寄せる。
 * ライトの強度や色を変えたら、ブラウザで明るい面の画素値を測って合わせ直すこと。 */
export const BRIGHTEST_BAND_LIGHTNESS = 0.68;

/** トゥーンマテリアル。`shadowColor` を渡すと、明るい面は `color` そのままの色、影の面は明るさに応じて
 * `shadowColor` へ寄る色になる(参照のイラストのように、影が暗くなるより暖かい色へ移る塗り)。
 * 渡さなければ標準の `MeshToonMaterial`(色に段ごとの灰色の係数を掛けて暗くする)。 */
export function createToonMaterial(
  color: THREE.ColorRepresentation,
  shadowColor?: THREE.ColorRepresentation,
): THREE.MeshToonMaterial {
  const material = new THREE.MeshToonMaterial({
    color,
    gradientMap: getToonGradientTexture(),
  });
  if (shadowColor !== undefined) {
    const shadow = new THREE.Color(shadowColor);
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uShadowColor = { value: shadow };
      shader.uniforms.uLitLevel = { value: BRIGHTEST_BAND_LIGHTNESS };
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uShadowColor;\nuniform float uLitLevel;')
        .replace(
          'vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;',
          `vec3 lightSum = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	float lightness = dot( lightSum, vec3( 0.2126, 0.7152, 0.0722 ) ) / max( dot( diffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ), 1e-4 );
	vec3 outgoingLight = mix( uShadowColor, diffuseColor.rgb, clamp( lightness / uLitLevel, 0.0, 1.0 ) ) + totalEmissiveRadiance;`,
        );
    };
    // シェーダーの形が標準と違うので、プログラムのキャッシュキーを分ける
    material.customProgramCacheKey = () => 'toonShadow';
  }
  return material;
}
