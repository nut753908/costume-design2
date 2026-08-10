import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

export interface NumberDisplayData extends Record<string, unknown> {
  label?: string;
}

/** 数値を画面上で確認できるようにする終端ノード — サブグラフ内の中間値を
 * プレビューするのに便利で、M2 パイプラインの動作確認用ノードも兼ねる。 */
registerNodeType<NumberDisplayData>({
  type: 'numberDisplay',
  label: 'Number Display',
  category: 'output',
  inputs: [{ id: 'value', label: 'Value', type: 'number' }],
  outputs: [],
  createDefaultData: () => ({ label: 'Display' }),
  evaluate: (inputs): Record<string, SocketValue> => ({
    value: inputs.value ?? { type: 'number', value: 0 },
  }),
});
