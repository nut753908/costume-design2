import { registerNodeType } from '../registry';
import type { SocketValue } from '../types';

/** シーンへ実際に描画するための、ルートスコープの終端ノード。`groupOutput`(グループの
 * 埋め込みサブグラフの出口)と対称に、こちらはトップレベルの出口を表す — geometry+material
 * を受け取ってそのまま素通しするだけで、`Garments.tsx` はこのノードの評価結果(の geometry+
 * material)だけを走査して `ToonMesh` をマウントする。
 *
 * 各ガーメントの `<name>Group` ノード自体の評価結果にも geometry+material は既に含まれて
 * いるが(グループ内部の `groupOutput` からそのまま転送されるため)、`Garments.tsx` は
 * このノードタイプへ実際に配線されているものだけを描画対象にする。**このノードへ繋がずに
 * 放置したガーメントグループは描画されない** —「型が geometry+material を持っていれば
 * 自動描画される」という暗黙の検出ではなく、「明示的にこのノードへ配線されているか」が
 * 描画対象かどうかの仕様そのものになる(`nodes/CLAUDE.md`/`scene/CLAUDE.md` 参照)。 */
registerNodeType({
  type: 'sceneOutput',
  label: 'Scene Output',
  category: 'output',
  inputs: [
    { id: 'geometry', label: 'Geometry', type: 'geometry' },
    { id: 'material', label: 'Material', type: 'material' },
  ],
  outputs: [],
  createDefaultData: () => ({}),
  evaluate: (inputs): Record<string, SocketValue> => inputs,
});
