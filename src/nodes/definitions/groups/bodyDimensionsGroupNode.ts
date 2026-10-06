import { defineGroupNode } from '../groupNodeFactory';

/** `src/state/initialGraph.ts` 側のトップレベル共有ノード(id: `bodyDimensions`)として
 * ただ1組だけ存在し、`bodyGroup` と全14ガーメントへファンアウトされる、ボディの各部位の半径・長さ(11個)の
 * 基準値を持つグループ。計算は行わず、`groupOutput` の各ソケットの入力欄の値(`default`)がそのまま出力になる
 * (「→」ボタンで中に入ると、Group Output ノードの入力欄で11個の値を直接編集できる。`nodes/CLAUDE.md` の
 * 「グループノード」節参照)。 */
defineGroupNode({
  type: 'bodyDimensionsGroup',
  label: 'Body Dimensions',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'output',
      type: 'groupOutput',
      data: {
        sockets: [
          { id: 'legHeight', label: 'Leg Height', type: 'number', default: 0.5754 },
          { id: 'legRadius', label: 'Leg Radius', type: 'number', default: 0.0691 },
          { id: 'legSpacing', label: 'Leg Spacing', type: 'number', default: 0.1109 },
          { id: 'torsoLength', label: 'Torso Length', type: 'number', default: 0.3343 },
          { id: 'torsoRadius', label: 'Torso Radius', type: 'number', default: 0.1536 },
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0.2966 },
          { id: 'armLength', label: 'Arm Length', type: 'number', default: 0.4683 },
          { id: 'armRadius', label: 'Arm Radius', type: 'number', default: 0.0523 },
          { id: 'shoulderSpacing', label: 'Shoulder Spacing', type: 'number', default: 0.1443 },
          { id: 'neckLength', label: 'Neck Length', type: 'number', default: 0.0565 },
          { id: 'neckRadius', label: 'Neck Radius', type: 'number', default: 0.0525 },
        ],
      },
    },
  ],
  internalEdges: [],
});
