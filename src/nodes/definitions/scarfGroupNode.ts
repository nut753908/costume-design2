import { defineGroupNode } from './groupNodeFactory';

/** scarfNeckScale(numberMultiply)+scarfGen(scarfGenerator)+scarfMaterial(toonMaterial)+
 * scarfOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。Neck Radius/Band
 * Thickness/Tail Width/Tail Length/Segments/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。Body Build のみガーメント間で共有されるため外部ソケットのまま。 */
defineGroupNode({
  type: 'scarfGroup',
  label: 'Scarf',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }],
      },
    },
    { id: 'neckRadiusIn', type: 'numberInput', data: { value: 0.19, min: 0.14, max: 0.3, step: 0.005, label: 'Neck Radius' } },
    { id: 'bandThicknessIn', type: 'numberInput', data: { value: 0.05, min: 0.02, max: 0.1, step: 0.005, label: 'Band Thickness' } },
    { id: 'tailWidthIn', type: 'numberInput', data: { value: 0.09, min: 0.04, max: 0.16, step: 0.005, label: 'Tail Width' } },
    { id: 'tailLengthIn', type: 'numberInput', data: { value: 0.35, min: 0.1, max: 0.7, step: 0.01, label: 'Tail Length' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 20, min: 8, max: 40, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#8a2e3a', label: 'Scarf Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'scarfGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0.08, fallbackColor: '#8a2e3a' } },
  ],
  internalEdges: [
    { source: 'neckRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'neckRadius' },
    { source: 'bandThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bandThickness' },
    { source: 'tailWidthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'tailWidth' },
    { source: 'tailLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'tailLength' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
