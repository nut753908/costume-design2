import * as THREE from 'three';
import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';
import { asNumber } from '../../socketHelpers';

const DEFAULTS = { r: 0.96, g: 0.874, b: 0.798 };

/** 色の R・G・B にそれぞれ倍率を掛けた色を出す。`toonShadowMaterial` の影の色を、元の色から作るために使う
 * (既定の倍率は、参照のイラストの肌の、明るい面と濃い影の比: `#fae6da` → `#f0c9ae`)。 */
registerNodeType({
  type: 'shadeColor',
  label: 'Shade Color',
  category: 'material',
  inputs: [
    { id: 'color', label: 'Color', type: 'color', default: '#cccccc' },
    { id: 'r', label: 'R', type: 'number', default: DEFAULTS.r },
    { id: 'g', label: 'G', type: 'number', default: DEFAULTS.g },
    { id: 'b', label: 'B', type: 'number', default: DEFAULTS.b },
  ],
  outputs: [{ id: 'color', label: 'Color', type: 'color' }],
  createDefaultData: () => ({ color: '#cccccc', ...DEFAULTS }),
  evaluate: (inputs, data): Record<string, SocketValue> => {
    const base = inputs.color?.type === 'color' ? inputs.color.value : new THREE.Color((data.color as string) ?? '#cccccc');
    const factor = (id: 'r' | 'g' | 'b') => asNumber(inputs[id], (data[id] as number | undefined) ?? DEFAULTS[id]);
    // THREE.Color は線形色空間で持つので、見た目の色(sRGB)で倍率を掛ける
    const srgb = base.getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
    const out = new THREE.Color().setRGB(srgb.r * factor('r'), srgb.g * factor('g'), srgb.b * factor('b'), THREE.SRGBColorSpace);
    return { color: { type: 'color', value: out } };
  },
});
