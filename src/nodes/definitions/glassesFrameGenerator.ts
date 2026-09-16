import { buildGlassesFrameGeometry } from '../../geometry/glasses';
import { defineGeneratorNode } from './generatorNodeFactory';

/** ブリッジ+左右テンプルだけを生成するノード。左右のレンズ(トーラス)は
 * `glassesGroupNode.ts` 側で `torusGenerator`→`translateX`/`translateZ` というノードグラフに
 * 委ねる(`bagStrapGenerator` と同じ「単体パーツの生成とノードグラフ側の配置を分離する」形、
 * `geometry/glasses.ts` 参照)。 */
defineGeneratorNode({
  type: 'glassesFrameGenerator',
  label: 'Glasses Frame',
  build: (params) => buildGlassesFrameGeometry(params),
  fields: [
    { id: 'lensRadius', label: 'Lens Radius', default: 0.045 },
    { id: 'bridgeThickness', label: 'Bridge Thickness', default: 0.01 },
    { id: 'lensSpacing', label: 'Lens Spacing', default: 0.055 },
    { id: 'templeLength', label: 'Temple Length', default: 0.12 },
    { id: 'templeThickness', label: 'Temple Thickness', default: 0.006 },
  ],
});
