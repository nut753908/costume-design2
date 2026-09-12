import { defineGroupNode } from './groupNodeFactory';

/** glasses は bodyBuild によるスケーリング対象外の独立したスタイル寄りの寸法のみを持つため、
 * glassesGen(glassesGenerator)+glassesMaterial(toonMaterial)+glassesOutput(garmentOutput)
 * の3ノードを1枚にまとめる。全パラメータが他のガーメントと共有されない単独パラメータのため、
 * 外側の numberInput/colorInput ノードではなくグループ内部の同型ノードとして保持する —
 * 共有される外部ソケットが1つも無いため、`groupInput` ノード自体を省略している
 * (`defineGroupNode()` は groupInput/groupOutput のどちらも省略可)。 */
defineGroupNode({
  type: 'glassesGroup',
  label: 'Glasses',
  terminalNodeId: 'output',
  internalNodes: [
    { id: 'lensRadiusIn', type: 'numberInput', data: { value: 0.045, min: 0.02, max: 0.07, step: 0.005, label: 'Lens Radius' } },
    { id: 'frameThicknessIn', type: 'numberInput', data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Frame Thickness' } },
    { id: 'lensSpacingIn', type: 'numberInput', data: { value: 0.055, min: 0.03, max: 0.09, step: 0.005, label: 'Lens Spacing' } },
    { id: 'bridgeThicknessIn', type: 'numberInput', data: { value: 0.01, min: 0.005, max: 0.02, step: 0.001, label: 'Bridge Thickness' } },
    { id: 'templeLengthIn', type: 'numberInput', data: { value: 0.12, min: 0.05, max: 0.2, step: 0.01, label: 'Temple Length' } },
    { id: 'templeThicknessIn', type: 'numberInput', data: { value: 0.006, min: 0.003, max: 0.015, step: 0.001, label: 'Temple Thickness' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#2a2a2a', label: 'Glasses Color' } },
    { id: 'gen', type: 'glassesGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'output', type: 'garmentOutput', data: { anchor: 'head', offsetY: -0.02, fallbackColor: '#2a2a2a' } },
  ],
  internalEdges: [
    { source: 'lensRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'lensRadius' },
    { source: 'frameThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'frameThickness' },
    { source: 'lensSpacingIn', sourceHandle: 'value', target: 'gen', targetHandle: 'lensSpacing' },
    { source: 'bridgeThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'bridgeThickness' },
    { source: 'templeLengthIn', sourceHandle: 'value', target: 'gen', targetHandle: 'templeLength' },
    { source: 'templeThicknessIn', sourceHandle: 'value', target: 'gen', targetHandle: 'templeThickness' },
    { source: 'gen', sourceHandle: 'geometry', target: 'output', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'output', targetHandle: 'material' },
  ],
});
