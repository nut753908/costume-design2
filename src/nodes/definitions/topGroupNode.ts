import { defineGroupNode } from './groupNodeFactory';

/** topRadiusScale(numberMultiply)+topGen(topGenerator)+topMaterial(toonMaterial)+
 * topOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。
 *
 * sleeve が Top の内部値(Body Build 適用後の胴体半径・マテリアル)を再引きしているため、
 * `attachRadiusScaled`/`material` を追加の出力ソケットとして公開している(単なる注入とは
 * 逆に、内部ノードの出力を外へ転送するだけなので groupNodeFactory の型注入の制約とは無関係)。 */
defineGroupNode({
  type: 'topGroup',
  label: 'Top',
  inputs: [
    { id: 'torsoRadius', label: 'Torso Radius', type: 'number', internalNodeId: 'torsoRadiusIn', internalDataKey: 'value' },
    { id: 'length', label: 'Length', type: 'number', internalNodeId: 'lengthIn', internalDataKey: 'value' },
    { id: 'neckline', label: 'Neckline', type: 'enum', internalNodeId: 'necklineIn', internalDataKey: 'value' },
    {
      id: 'necklineDepth',
      label: 'Neckline Depth',
      type: 'number',
      internalNodeId: 'necklineDepthIn',
      internalDataKey: 'value',
    },
    { id: 'color', label: 'Color', type: 'color', internalNodeId: 'colorIn', internalDataKey: 'hex' },
    { id: 'bodyBuild', label: 'Body Build', type: 'number', internalNodeId: 'bodyBuildIn', internalDataKey: 'value' },
  ],
  outputs: [
    // sleeveGen.attachRadius が再引きする、Body Build 適用後の胴体半径。
    { id: 'attachRadiusScaled', label: 'Attach Radius (Scaled)', type: 'number', internalNodeId: 'scale', internalSocketId: 'value' },
    // sleeveOutput.material が再引きする、Top のマテリアル。
    { id: 'material', label: 'Material', type: 'material', internalNodeId: 'material', internalSocketId: 'material' },
  ],
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'torsoRadiusIn', type: 'numberInput', data: { value: 0.29 } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.5 } },
    { id: 'necklineIn', type: 'enumInput', data: { value: 'round' } },
    { id: 'necklineDepthIn', type: 'numberInput', data: { value: 0.12 } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#5b8fa8' } },
    { id: 'bodyBuildIn', type: 'numberInput', data: { value: 1 } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'topGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#5b8fa8' } },
  ],
  internalEdges: [
    { source: 'torsoRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'bodyBuildIn', sourceHandle: 'value', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'torsoRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'necklineIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineType' },
    { source: 'necklineDepthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'necklineDepth' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
