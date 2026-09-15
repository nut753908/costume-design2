import { defineGroupNode } from './groupNodeFactory';

/** hat は bodyBuild によるスケーリング対象外(headRadius が `bodyDimensionsGroup` の中で
 * buildScale の影響を受けないため)なので Body Build 入力は無く、
 * hatGen(hatGenerator)+hatMaterial(toonMaterial)+anchorIn(enumInput)+offsetYIn(numberInput)+
 * placement(garmentPlacement)+sceneOut(sceneOutput) の6ノードを1枚にまとめる。Brim Radius/Crown Radius/Height/Color も
 * 他のガーメントと共有されない単独パラメータのため、外側の numberInput/colorInput ノードでは
 * なくグループ内部の同型ノードとして保持する — 共有される外部入力ソケットが1つも無いため、
 * `groupInput` ノード自体を省略している(`groupOutput` も同様に省略でき、こちらは
 * geometry/material の描画を担う `sceneOut`(`sceneOutput`)があるため出番が無い)。 */
defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'bodyHeight', label: 'Body Height', type: 'number', default: 1 },
          { id: 'bodyBuild', label: 'Body Build', type: 'number', default: 1 },
          { id: 'bodyShoulder', label: 'Body Shoulder', type: 'number', default: 1 },
        ],
      },
    },
    { id: 'brimRadiusIn', type: 'numberInput', data: { value: 0.2, min: 0.15, max: 0.3, step: 0.01, label: 'Brim Radius' } },
    { id: 'crownRadiusIn', type: 'numberInput', data: { value: 0.02, min: 0, max: 0.15, step: 0.005, label: 'Crown Radius' } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.35, min: 0.1, max: 0.6, step: 0.01, label: 'Height' } },
    { id: 'colorIn', type: 'colorInput', data: { hex: '#4a3b6b', label: 'Hat Color' } },
    { id: 'gen', type: 'hatGenerator', data: {} },
    { id: 'material', type: 'toonMaterial', data: {} },
    { id: 'anchorIn', type: 'enumInput', data: { value: 'head', options: ['waist', 'shoulder', 'feet', 'wrist', 'head'], label: 'Anchor' } },
    { id: 'offsetYIn', type: 'numberInput', data: { value: 0.1, min: -0.2, max: 0.2, step: 0.01, label: 'Offset Y' } },
    { id: 'placement', type: 'garmentPlacement', data: {} },
    { id: 'sceneOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    { source: 'brimRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'brimRadius' },
    { source: 'crownRadiusIn', sourceHandle: 'value', target: 'gen', targetHandle: 'crownRadius' },
    { source: 'heightIn', sourceHandle: 'value', target: 'gen', targetHandle: 'height' },
    { source: 'gen', sourceHandle: 'geometry', target: 'placement', targetHandle: 'geometry' },
    { source: 'colorIn', sourceHandle: 'color', target: 'material', targetHandle: 'color' },
    { source: 'material', sourceHandle: 'material', target: 'sceneOut', targetHandle: 'material' },
    { source: 'anchorIn', sourceHandle: 'value', target: 'placement', targetHandle: 'anchor' },
    { source: 'offsetYIn', sourceHandle: 'value', target: 'placement', targetHandle: 'offsetY' },
    { source: 'input', sourceHandle: 'bodyHeight', target: 'placement', targetHandle: 'bodyHeight' },
    { source: 'input', sourceHandle: 'bodyBuild', target: 'placement', targetHandle: 'bodyBuild' },
    { source: 'input', sourceHandle: 'bodyShoulder', target: 'placement', targetHandle: 'bodyShoulder' },
    { source: 'placement', sourceHandle: 'geometry', target: 'sceneOut', targetHandle: 'geometry' },
  ],
});
