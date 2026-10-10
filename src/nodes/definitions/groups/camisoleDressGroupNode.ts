import { defineGroupNode } from '../groupNodeFactory';
import { colorSocket, garmentOutput } from '../garmentOutput';

const output = garmentOutput({ y: 0.32, geometry: 'merge' });

/** キャミソールワンピース: 細い肩ひも・胸元がまっすぐな身頃・プリーツの入ったフレアスカート・腰の脇のリボン。
 *
 * - 身頃とスカート: 裾(原点)から胸元までの1本の `loftGenerator`。幅・前後の厚み・前後のずらしの3本の輪郭
 *   (`profileCurve17`/`signedProfileCurve17`、`radius` 1 なので値がそのまま長さ)は、身頃では体の断面より少し外、
 *   スカートでは裾へ向かって広がる値。胴体は後ろへ傾いているので、身頃の輪は上ほど後ろへずらす。
 *   縦のプリーツは `pleatProfile`(半径に対する山の高さの比)で付ける。
 * - 肩ひも: 肩を一周する細いトーラスを楕円に伸ばして後ろへ傾けたもの。下半分は身頃と体の中に隠れる
 *   (楕円は、肩の表面のすぐ外を通る点列に当てはめた値)。
 * - リボン: 別の色(`bowColor`)の2つ目の `sceneOutput`。輪2つ(`mirrorPair`)・結び目・垂れ2本を球の変形で作り、
 *   身頃の表面の向きに合わせて回して腰の脇に置く。身頃と同じ取り付け位置(`placementY`)だけ持ち上げる。 */
defineGroupNode({
  type: 'camisoleDressGroup',
  label: 'Camisole Dress',
  paletteSection: 'garment',
  internalNodes: [
    { id: 'input', type: 'groupInput', data: { sockets: [colorSocket('#f8f8f8')] } },

    // --- 身頃+スカート(裾が原点、胸元まで 0.72) ---
    { id: 'dressLength', type: 'numberInput', data: { value: 0.72 } },
    {
      id: 'xProfile',
      type: 'profileCurve17',
      data: { r0: 0.338, r1: 0.324, r2: 0.31, r3: 0.295, r4: 0.28, r5: 0.264, r6: 0.248, r7: 0.232, r8: 0.216, r9: 0.2, r10: 0.183, r11: 0.166, r12: 0.15, r13: 0.134, r14: 0.128, r15: 0.141, r16: 0.141 },
    },
    {
      id: 'depthProfile',
      type: 'profileCurve17',
      data: { r0: 0.258, r1: 0.246, r2: 0.234, r3: 0.222, r4: 0.21, r5: 0.196, r6: 0.183, r7: 0.17, r8: 0.156, r9: 0.143, r10: 0.13, r11: 0.118, r12: 0.108, r13: 0.103, r14: 0.104, r15: 0.106, r16: 0.104 },
    },
    {
      id: 'offsetProfile',
      type: 'signedProfileCurve17',
      data: { r0: 0, r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0, r7: 0, r8: -0.004, r9: -0.007, r10: -0.01, r11: -0.013, r12: -0.02, r13: -0.031, r14: -0.046, r15: -0.063, r16: -0.084 },
    },
    {
      id: 'pleatProfile',
      type: 'signedProfileCurve17',
      data: { r0: 0.13, r1: 0.127, r2: 0.123, r3: 0.118, r4: 0.112, r5: 0.106, r6: 0.1, r7: 0.093, r8: 0.086, r9: 0.079, r10: 0.072, r11: 0.065, r12: 0.058, r13: 0.05, r14: 0.05, r15: 0.05, r16: 0.05 },
    },
    { id: 'dressGen', type: 'loftGenerator', data: { steps: 48, segments: 128, pleatCount: 16 } },

    // --- 肩ひも(左右) ---
    { id: 'strapRing', type: 'torusGenerator', data: { radius: 0.1, tube: 0.005 } },
    { id: 'strapTurn', type: 'rotate', data: { y: 90 } },
    { id: 'strapStretch', type: 'scale', data: { y: 1.372, z: 0.786 } },
    { id: 'strapTilt', type: 'rotate', data: { x: -28.3 } },
    { id: 'strapTranslate', type: 'translate', data: { y: 0.7662, z: -0.1054 } },
    { id: 'strapPair', type: 'mirrorPair', data: { offset: 0.085 } },

    { id: 'merge', type: 'mergeGeometry', data: {} },
    // 白の影は肌色寄りの既定の倍率だと黄ばんで見えるので、少し青みのある灰色にする。
    ...output.nodes.map((n) => (n.id === 'shade' ? { ...n, data: { r: 0.86, g: 0.87, b: 0.92 } } : n)),
    { id: 'placementY', type: 'numberInput', data: { value: 0.32 } },

    // --- リボン(腰の脇、別の色) ---
    { id: 'bowLoopGen', type: 'sphereGenerator', data: { radius: 0.039 } },
    { id: 'bowLoopScale', type: 'scale', data: { y: 0.65, z: 0.4 } },
    { id: 'bowLoopTilt', type: 'rotate', data: { z: 12 } },
    { id: 'bowLoops', type: 'mirrorPair', data: { offset: 0.038 } },
    { id: 'bowKnotGen', type: 'sphereGenerator', data: { radius: 0.018 } },
    { id: 'bowKnotScale', type: 'scale', data: { z: 0.7 } },
    { id: 'bowTailGen', type: 'sphereGenerator', data: { radius: 0.028 } },
    { id: 'bowTailScale', type: 'scale', data: { x: 0.4, z: 0.3 } },
    { id: 'bowTailTilt', type: 'rotate', data: { z: 20 } },
    { id: 'bowTailDrop', type: 'translate', data: { y: -0.031 } },
    { id: 'bowTails', type: 'mirrorPair', data: { offset: 0.015 } },
    { id: 'bowMerge', type: 'mergeGeometry', data: {} },
    { id: 'bowTurn', type: 'rotate', data: { y: 27 } },
    { id: 'bowTranslate', type: 'translate', data: { x: 0.06, y: 0.6, z: 0.08 } },
    { id: 'bowPlacement', type: 'translate', data: {} },
    { id: 'bowColor', type: 'colorInput', data: { hex: '#f59aa8' } },
    { id: 'bowShade', type: 'shadeColor', data: {} },
    { id: 'bowMaterial', type: 'toonShadowMaterial', data: {} },
    { id: 'bowOut', type: 'sceneOutput', data: {} },
  ],
  internalEdges: [
    // 身頃+スカート
    { source: 'dressLength', sourceHandle: 'value', target: 'xProfile', targetHandle: 'length' },
    { source: 'dressLength', sourceHandle: 'value', target: 'depthProfile', targetHandle: 'length' },
    { source: 'dressLength', sourceHandle: 'value', target: 'offsetProfile', targetHandle: 'length' },
    { source: 'dressLength', sourceHandle: 'value', target: 'pleatProfile', targetHandle: 'length' },
    { source: 'xProfile', sourceHandle: 'curve', target: 'dressGen', targetHandle: 'profile' },
    { source: 'depthProfile', sourceHandle: 'curve', target: 'dressGen', targetHandle: 'depthProfile' },
    { source: 'offsetProfile', sourceHandle: 'curve', target: 'dressGen', targetHandle: 'offsetZProfile' },
    { source: 'pleatProfile', sourceHandle: 'curve', target: 'dressGen', targetHandle: 'pleatProfile' },

    // 肩ひも
    { source: 'strapRing', sourceHandle: 'geometry', target: 'strapTurn', targetHandle: 'geometry' },
    { source: 'strapTurn', sourceHandle: 'geometry', target: 'strapStretch', targetHandle: 'geometry' },
    { source: 'strapStretch', sourceHandle: 'geometry', target: 'strapTilt', targetHandle: 'geometry' },
    { source: 'strapTilt', sourceHandle: 'geometry', target: 'strapTranslate', targetHandle: 'geometry' },
    { source: 'strapTranslate', sourceHandle: 'geometry', target: 'strapPair', targetHandle: 'geometry' },

    { source: 'dressGen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'strapPair', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    ...output.edges,
    { source: 'placementY', sourceHandle: 'value', target: 'placement', targetHandle: 'y' },

    // リボン
    { source: 'bowLoopGen', sourceHandle: 'geometry', target: 'bowLoopScale', targetHandle: 'geometry' },
    { source: 'bowLoopScale', sourceHandle: 'geometry', target: 'bowLoopTilt', targetHandle: 'geometry' },
    { source: 'bowLoopTilt', sourceHandle: 'geometry', target: 'bowLoops', targetHandle: 'geometry' },
    { source: 'bowKnotGen', sourceHandle: 'geometry', target: 'bowKnotScale', targetHandle: 'geometry' },
    { source: 'bowTailGen', sourceHandle: 'geometry', target: 'bowTailScale', targetHandle: 'geometry' },
    { source: 'bowTailScale', sourceHandle: 'geometry', target: 'bowTailTilt', targetHandle: 'geometry' },
    { source: 'bowTailTilt', sourceHandle: 'geometry', target: 'bowTailDrop', targetHandle: 'geometry' },
    { source: 'bowTailDrop', sourceHandle: 'geometry', target: 'bowTails', targetHandle: 'geometry' },
    { source: 'bowTails', sourceHandle: 'geometry', target: 'bowMerge', targetHandle: 'geometries' },
    { source: 'bowLoops', sourceHandle: 'geometry', target: 'bowMerge', targetHandle: 'geometries' },
    { source: 'bowKnotScale', sourceHandle: 'geometry', target: 'bowMerge', targetHandle: 'geometries' },
    { source: 'bowMerge', sourceHandle: 'geometry', target: 'bowTurn', targetHandle: 'geometry' },
    { source: 'bowTurn', sourceHandle: 'geometry', target: 'bowTranslate', targetHandle: 'geometry' },
    { source: 'bowTranslate', sourceHandle: 'geometry', target: 'bowPlacement', targetHandle: 'geometry' },
    { source: 'placementY', sourceHandle: 'value', target: 'bowPlacement', targetHandle: 'y' },
    { source: 'bowPlacement', sourceHandle: 'geometry', target: 'bowOut', targetHandle: 'geometry' },
    { source: 'bowColor', sourceHandle: 'color', target: 'bowShade', targetHandle: 'color' },
    { source: 'bowColor', sourceHandle: 'color', target: 'bowMaterial', targetHandle: 'color' },
    { source: 'bowShade', sourceHandle: 'color', target: 'bowMaterial', targetHandle: 'shadowColor' },
    { source: 'bowMaterial', sourceHandle: 'material', target: 'bowOut', targetHandle: 'material' },
  ],
});
