import { defineGroupNode } from './groupNodeFactory';

/** topRadiusScale(numberMultiply)+topGen(topGenerator)+topMaterial(toonMaterial)+
 * topOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 *
 * sleeve が Top の内部値(Body Build 適用後の胴体半径・マテリアル)を再引きしているため、
 * `groupOutput` ノードへ `scale`/`material` から直接ワイヤーを繋ぎ、
 * `attachRadiusScaled`/`material` を追加の出力ソケットとして公開している(単なる注入とは
 * 逆に、内部ノードの出力を外へ転送するだけなので groupNodeFactory の型注入の制約とは無関係)。 */
defineGroupNode({
  type: 'topGroup',
  label: 'Top',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0.29 },
          { id: 'length', label: 'Length', type: 'number', default: 0.5 },
          { id: 'neckline', label: 'Neckline', type: 'enum', default: 'round', options: ['round', 'v', 'square'] },
          { id: 'necklineDepth', label: 'Neckline Depth', type: 'number', default: 0.12 },
          { id: 'color', label: 'Color', type: 'color', default: '#5b8fa8' },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
        ],
      },
    },
    {
      id: 'groupOutput',
      type: 'groupOutput',
      data: {
        sockets: [
          // sleeveGen.attachRadius が再引きする、Body Build 適用後の胴体半径。
          { id: 'attachRadiusScaled', label: 'Attach Radius (Scaled)', type: 'number' },
          // sleeveOutput.material が再引きする、Top のマテリアル。
          { id: 'material', label: 'Material', type: 'material' },
        ],
      },
    },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'topGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#5b8fa8' } },
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'torsoRadius', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'torsoRadius' },
    { source: 'input', sourceHandle: 'length', target: 'gen', targetHandle: 'length' },
    { source: 'input', sourceHandle: 'neckline', target: 'gen', targetHandle: 'necklineType' },
    { source: 'input', sourceHandle: 'necklineDepth', target: 'gen', targetHandle: 'necklineDepth' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'input', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
    { source: 'scale', sourceHandle: 'value', target: 'groupOutput', targetHandle: 'attachRadiusScaled' },
    { source: 'material', sourceHandle: 'material', target: 'groupOutput', targetHandle: 'material' },
  ],
});
