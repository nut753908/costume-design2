import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';
import { asEnum, asNumber } from '../socketHelpers';

const ANCHOR_KEYS = ['waist', 'shoulder', 'feet', 'wrist', 'head'] as const;
type AnchorKey = (typeof ANCHOR_KEYS)[number];

function isAnchorKey(value: string): value is AnchorKey {
  return (ANCHOR_KEYS as readonly string[]).includes(value);
}

/** `anchor`(enum: waist/shoulder/feet/wrist/head)の選択に応じて、同名の5つの number 入力
 * (`garmentPlacement.ts` の内部で `bodyLayoutGroup` が計算した waistY/shoulderY/feetY/
 * wristY/headCenterY を渡す)のうちどれか1つをそのまま出力する汎用の「switch」ノード。
 *
 * `garmentPlacement` が持っていた「anchor という enum の値で、計算済みの5つのY座標から
 * 1つを選ぶ」という分岐だけを担う専用ノードとして切り出した — 選択肢の集合(waist/shoulder/
 * feet/wrist/head)自体は各 `<name>GroupNode.ts` の `anchorIn`(`enumInput`)が既に
 * `data.options` としてハードコードしているものと同じで、このノード固有の新しい語彙では
 * ない(`nodes/CLAUDE.md` の「グループノード」節参照)。 */
registerNodeType({
  type: 'anchorSelect',
  label: 'Anchor Select',
  category: 'generator',
  inputs: [
    { id: 'anchor', label: 'Anchor', type: 'enum' },
    { id: 'waist', label: 'Waist', type: 'number' },
    { id: 'shoulder', label: 'Shoulder', type: 'number' },
    { id: 'feet', label: 'Feet', type: 'number' },
    { id: 'wrist', label: 'Wrist', type: 'number' },
    { id: 'head', label: 'Head', type: 'number' },
  ],
  outputs: [{ id: 'value', label: 'Value', type: 'number' }],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => {
    const anchor = asEnum(inputs.anchor, 'waist');
    const key: AnchorKey = isAnchorKey(anchor) ? anchor : 'waist';
    return { value: { type: 'number', value: asNumber(inputs[key], 0) } };
  },
});
