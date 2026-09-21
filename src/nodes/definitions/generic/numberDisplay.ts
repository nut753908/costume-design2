import { registerNodeType } from '../../registry';
import type { SocketValue } from '../../types';

/** 入力された number の値をカード上に表示するだけのノード(`editor/nodeComponents/NumberDisplayNode.tsx`)。
 * カードは自身の評価結果の `value` を読んで表示するため、`outputs` は宣言せず(他のノードへは
 * 配線できない)、評価結果にだけ入力値をそのまま載せる。 */
registerNodeType({
  type: 'numberDisplay',
  label: 'Number Display',
  category: 'output',
  inputs: [{ id: 'value', label: 'Value', type: 'number' }],
  outputs: [],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => (inputs.value?.type === 'number' ? { value: inputs.value } : {}),
});
