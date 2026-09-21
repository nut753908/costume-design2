import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

/** 入力された color をカード上に表示するだけのノード(`editor/nodeComponents/ColorDisplayNode.tsx`)。
 * `numberDisplay` と同じく `outputs` は宣言せず、評価結果にだけ入力値をそのまま載せる。 */
registerNodeType({
  type: 'colorDisplay',
  label: 'Color Display',
  category: 'output',
  inputs: [{ id: 'color', label: 'Color', type: 'color' }],
  outputs: [],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => (inputs.color?.type === 'color' ? { color: inputs.color } : {}),
});
