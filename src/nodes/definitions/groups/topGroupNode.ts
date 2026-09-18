import { defineGroupNode } from '../groupNodeFactory';
import { garmentOutput } from '../garmentOutput';

/** topGen(topGenerator)+offsetYIn(numberInput)+placement(garmentPlacement)+
 * sceneOut(sceneOutput) を1枚にまとめたグループノード。Length/Neckline/Neckline Depth は
 * 他のガーメントと共有されない単独パラメータのため、外側の numberInput/enumInput ノードでは
 * なくグループ内部の同型ノードとして保持する。
 *
 * Torso Radius(Body Build 適用後のスケール済みの値)と Material は sleeve の描画にも
 * そのまま必要な値のため、`src/state/initialGraph.ts` 側の共有ノード(`topRadiusScale`/
 * `topMaterial`)から topGroup/sleeveGroup の両方へ普通の外部ソケットとしてファンアウトされる
 * (`nodes/CLAUDE.md` の「値が複数グループで共有される場合」参照)。Anchor Y(取り付け位置)も
 * 同じくルートの `bodyLayout` 共有ノードの shoulderY を sleeveGroup と同時に受け取る。 */
const output = garmentOutput({ offsetY: 0, geometry: 'gen' });

defineGroupNode({
  type: 'topGroup',
  label: 'Top',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0.29 },
          { id: 'material', label: 'Material', type: 'material' },
          { id: 'anchorY', label: 'Anchor Y', type: 'number', default: 0 },
        ],
      },
    },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.5, min: 0.2, max: 0.9, step: 0.01, label: 'Length' } },
    { id: 'necklineIn', type: 'enumInput', data: { value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' } },
    { id: 'necklineDepthIn', type: 'numberInput', data: { value: 0.12, min: 0, max: 0.3, step: 0.01, label: 'Neckline Depth' } },
    { id: 'gen', type: 'topGenerator', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'torsoRadius', target: 'gen', targetHandle: 'torsoRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'necklineIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineType' },
    { source: 'necklineDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineDepth' },
    ...output.edges,
  ],
});
