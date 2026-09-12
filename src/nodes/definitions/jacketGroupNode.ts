import { defineGroupNode } from './groupNodeFactory';

/** jacketShoulderScale(numberMultiply)+jacketGen(jacketGenerator)+jacketMaterial(toonMaterial)+
 * jacketOutput(garmentOutput) の4ノードを1枚にまとめたグループノード。Shoulder Radius/
 * Length/Hem Flare/Segments/Color は他のガーメントと共有されない単独パラメータのため、外側の
 * numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する。Body Build の
 * みガーメント間で共有されるため外部ソケットのまま。 */
defineGroupNode({
  type: 'jacketGroup',
  label: 'Jacket',
  terminalNodeId: 'output',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [{ id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 }],
      },
    },
    { id: 'shoulderRadiusIn', type: 'numberInput', data: { value: 0.34, min: 0.25, max: 0.5, step: 0.01, label: 'Shoulder Radius' } },
    { id: 'lengthIn', type: 'numberInput', data: { value: 0.42, min: 0.2, max: 0.8, step: 0.01, label: 'Length' } },
    { id: 'hemFlareIn', type: 'numberInput', data: { value: 0.15, min: 0, max: 1.5, step: 0.05, label: 'Hem Flare' } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 20, min: 8, max: 40, step: 1, label: 'Segments' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#4a5c3e', label: 'Jacket Color' } },
    { id: 'scale', type: 'numberMultiply', data: {} },
    { id: 'gen', type: 'jacketGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#4a5c3e' } },
  ],
  internalEdges: [
    { source: 'shoulderRadiusIn', sourceHandle: 'value', target: 'scale', targetHandle: 'value' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'scale', targetHandle: 'factor' },
    { source: 'scale', sourceHandle: 'value', target: 'gen', targetHandle: 'shoulderRadius' },
    { source: 'lengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'length' },
    { source: 'hemFlareIn', sourceHandle: 'value', target: 'gen', targetHandle: 'hemFlare' },
    { source: 'segmentsIn', sourceHandle: 'value', target: 'gen', targetHandle: 'segments' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
