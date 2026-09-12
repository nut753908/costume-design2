import { defineGroupNode } from './groupNodeFactory';

/** topRadiusScale(numberMultiply)+topGen(topGenerator)+topMaterial(toonMaterial)+
 * topOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。Torso Radius/Length/
 * Neckline/Neckline Depth/Color は他のガーメントと共有されない単独パラメータのため、外側の
 * numberInput/colorInput/enumInput ノードではなくグループ内部の同型ノードとして保持する。
 * Body Build のみ全ガーメント共有のため外部ソケットのまま。
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
        sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }],
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
    { id: 'torsoRadiusIn', type: 'numberInput', data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.5, min: 0.2, max: 0.9, step: 0.01, label: 'Length' } },
    { id: 'necklineIn', type: 'enumInput', data: { value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' } },
    { id: 'necklineDepthIn', type: 'numberInput', data: { value: 0.12, min: 0, max: 0.3, step: 0.01, label: 'Neckline Depth' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#5b8fa8', label: 'Top Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'topGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#5b8fa8' } },
  ],
  internalEdges: [
    { source: 'torsoRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'torsoRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'necklineIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineType' },
    { source: 'necklineDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineDepth' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
    { source: 'scale', sourceHandle: 'value', target: 'groupOutput', targetHandle: 'attachRadiusScaled' },
    { source: 'material', sourceHandle: 'material', target: 'groupOutput', targetHandle: 'material' },
  ],
});
