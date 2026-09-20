import * as THREE from 'three';
import type { SocketType, SocketValue } from '../types';

/** `groupInput`/`groupOutput` ノードが動的に持つソケット1つ分。`resolveNodeSockets.ts` は
 * `type: 'groupInput'` のノードの `data.sockets` をそのまま外部の出力ソケット一覧として、
 * `type: 'groupOutput'` のノードの `data.sockets` を入力ソケット一覧として扱う
 * (`nodes/CLAUDE.md` の「グループノード」節参照)。同じ形をグループノード本体
 * (`category: 'group'`)が外部に見せるソケット一覧の元にもなる。 */
export interface GroupIOSocket {
  id: string;
  label: string;
  type: SocketType;
  /** `groupInput` 側でのみ意味を持つ、未接続時のリテラルなデフォルト値。
   * number は number、color は hex 文字列、enum はオプション文字列として保持する
   * (numberInput/colorInput の `data.value`/`hex` と同じ表現)。
   * geometry/material にはリテラルなデフォルトが存在しないため常に undefined。 */
  default?: number | string;
  /** enum タイプの `groupInput` ソケットのみが持つ選択肢一覧。 */
  options?: string[];
}

/** `groupInput.evaluate()` が、外部から値が注入されていないソケットに使う
 * リテラルなデフォルト値を SocketValue へ変換する。geometry/material/points はリテラルな
 * デフォルトを表現できないため常に undefined を返す(=未接続なら単に出力されない)。 */
export function literalGroupInputValue(socket: GroupIOSocket): SocketValue | undefined {
  switch (socket.type) {
    case 'number':
      return { type: 'number', value: typeof socket.default === 'number' ? socket.default : 0 };
    case 'color':
      return { type: 'color', value: new THREE.Color(typeof socket.default === 'string' ? socket.default : '#cccccc') };
    case 'enum':
      return { type: 'enum', value: typeof socket.default === 'string' ? socket.default : (socket.options?.[0] ?? '') };
    case 'geometry':
    case 'material':
    case 'points':
      return undefined;
  }
}
