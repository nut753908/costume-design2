import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import type { EvaluatedGraph } from '../nodes/evaluateGraph';
import { getNodeType } from '../nodes/registry';
import { computeAutoLayout } from '../nodes/autoLayout';

/** localStorage の永続化キー。persist の name とErrorBoundaryのリセット処理(main.tsx)の
 * 両方から参照するため、値のドリフトを避けて1箇所にまとめる。 */
export const GRAPH_STORAGE_KEY = 'costume-design-graph';

export const initialNodes: Node[] = [
  // state/useBodyScale.ts で id により直接読み取られる — ボディスケールはガーメントの
  // geometry/material 出力ではなくシーン全体のパラメータであるため、エッジで何にも配線されていない。
  { id: 'bodyHeight', type: 'numberInput', position: { x: 1160, y: 20 }, data: { value: 1, min: 0.8, max: 1.25, step: 0.01, label: 'Body Height' } },
  { id: 'bodyBuild', type: 'numberInput', position: { x: 1160, y: 130 }, data: { value: 1, min: 0.8, max: 1.3, step: 0.01, label: 'Body Build' } },
  { id: 'bodyShoulder', type: 'numberInput', position: { x: 1160, y: 240 }, data: { value: 1, min: 0.7, max: 1.4, step: 0.01, label: 'Body Shoulder' } },

  { id: 'skirtWaist', type: 'numberInput', position: { x: 40, y: 20 }, data: { value: 0.3, min: 0.15, max: 0.5, step: 0.01, label: 'Waist Radius' } },
  { id: 'skirtLength', type: 'numberInput', position: { x: 40, y: 130 }, data: { value: 0.55, min: 0.2, max: 1.0, step: 0.01, label: 'Length' } },
  { id: 'skirtFlare', type: 'numberInput', position: { x: 40, y: 240 }, data: { value: 0.7, min: 0, max: 2.5, step: 0.05, label: 'Flare' } },
  { id: 'skirtSegments', type: 'numberInput', position: { x: 40, y: 350 }, data: { value: 28, min: 8, max: 48, step: 1, label: 'Segments' } },
  // ウエスト半径に Body Build を乗算し、ボディをリサイズしても既存のガーメントが
  // ゆるい/きつい見た目にならないようにする(CLAUDE.md の既知のMVP制約を解消)。
  { id: 'skirtWaistScale', type: 'numberMultiply', position: { x: 190, y: 20 }, data: {} },
  { id: 'skirtGen', type: 'skirtGenerator', position: { x: 340, y: 180 }, data: {} },
  { id: 'skirtColor', type: 'colorInput', position: { x: 900, y: 20 }, data: { hex: '#d9738c', label: 'Skirt Color' } },
  { id: 'skirtMaterial', type: 'toonMaterial', position: { x: 900, y: 120 }, data: {} },
  { id: 'skirtOutput', type: 'garmentOutput', position: { x: 620, y: 180 }, data: { anchor: 'waist', offsetY: 0.03, fallbackColor: '#d9738c' } },

  { id: 'topRadius', type: 'numberInput', position: { x: 40, y: 500 }, data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
  { id: 'topLength', type: 'numberInput', position: { x: 40, y: 610 }, data: { value: 0.5, min: 0.2, max: 0.9, step: 0.01, label: 'Length' } },
  { id: 'topNeckline', type: 'enumInput', position: { x: 40, y: 720 }, data: { value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' } },
  { id: 'topNecklineDepth', type: 'numberInput', position: { x: 40, y: 830 }, data: { value: 0.12, min: 0, max: 0.3, step: 0.01, label: 'Neckline Depth' } },
  { id: 'topRadiusScale', type: 'numberMultiply', position: { x: 190, y: 500 }, data: {} },
  { id: 'topGen', type: 'topGenerator', position: { x: 340, y: 650 }, data: {} },
  { id: 'topColor', type: 'colorInput', position: { x: 900, y: 500 }, data: { hex: '#5b8fa8', label: 'Top Color' } },
  { id: 'topMaterial', type: 'toonMaterial', position: { x: 900, y: 600 }, data: {} },
  { id: 'topOutput', type: 'garmentOutput', position: { x: 620, y: 650 }, data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#5b8fa8' } },

  { id: 'sleeveLength', type: 'numberInput', position: { x: 40, y: 940 }, data: { value: 0.22, min: 0, max: 0.4, step: 0.01, label: 'Sleeve Length' } },
  { id: 'sleeveRadius', type: 'numberInput', position: { x: 40, y: 1050 }, data: { value: 0.085, min: 0.05, max: 0.14, step: 0.005, label: 'Sleeve Radius' } },
  { id: 'sleeveGen', type: 'sleeveGenerator', position: { x: 340, y: 990 }, data: {} },
  { id: 'sleeveOutput', type: 'garmentOutput', position: { x: 620, y: 990 }, data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#5b8fa8' } },

  { id: 'pantsWaist', type: 'numberInput', position: { x: 40, y: 1160 }, data: { value: 0.16, min: 0.1, max: 0.25, step: 0.005, label: 'Waist Radius' } },
  { id: 'pantsHem', type: 'numberInput', position: { x: 40, y: 1270 }, data: { value: 0.1, min: 0.05, max: 0.2, step: 0.005, label: 'Hem Radius' } },
  { id: 'pantsInseam', type: 'numberInput', position: { x: 40, y: 1380 }, data: { value: 0.75, min: 0.3, max: 1.0, step: 0.01, label: 'Inseam' } },
  { id: 'pantsLegSpacing', type: 'numberInput', position: { x: 40, y: 1490 }, data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Leg Spacing' } },
  { id: 'pantsSegments', type: 'numberInput', position: { x: 40, y: 1600 }, data: { value: 16, min: 8, max: 32, step: 1, label: 'Segments' } },
  { id: 'pantsWaistScale', type: 'numberMultiply', position: { x: 190, y: 1160 }, data: {} },
  { id: 'pantsGen', type: 'pantsGenerator', position: { x: 340, y: 1380 }, data: {} },
  { id: 'pantsColor', type: 'colorInput', position: { x: 900, y: 710 }, data: { hex: '#9c7b4f', label: 'Pants Color' } },
  { id: 'pantsMaterial', type: 'toonMaterial', position: { x: 900, y: 810 }, data: {} },
  { id: 'pantsOutput', type: 'garmentOutput', position: { x: 620, y: 1380 }, data: { anchor: 'waist', offsetY: 0, fallbackColor: '#9c7b4f' } },

  { id: 'shoesSole', type: 'numberInput', position: { x: 40, y: 1710 }, data: { value: 0.13, min: 0.1, max: 0.2, step: 0.005, label: 'Sole Radius' } },
  { id: 'shoesCuff', type: 'numberInput', position: { x: 40, y: 1820 }, data: { value: 0.1, min: 0.08, max: 0.16, step: 0.005, label: 'Cuff Radius' } },
  { id: 'shoesHeight', type: 'numberInput', position: { x: 40, y: 1930 }, data: { value: 0.12, min: 0.05, max: 0.25, step: 0.005, label: 'Height' } },
  { id: 'shoesToeLength', type: 'numberInput', position: { x: 40, y: 2040 }, data: { value: 1.5, min: 1, max: 2.5, step: 0.05, label: 'Toe Length' } },
  { id: 'shoesSoleScale', type: 'numberMultiply', position: { x: 190, y: 1710 }, data: {} },
  { id: 'shoesGen', type: 'shoesGenerator', position: { x: 340, y: 1930 }, data: {} },
  { id: 'shoesColor', type: 'colorInput', position: { x: 900, y: 910 }, data: { hex: '#3d3630', label: 'Shoes Color' } },
  { id: 'shoesMaterial', type: 'toonMaterial', position: { x: 900, y: 1010 }, data: {} },
  { id: 'shoesOutput', type: 'garmentOutput', position: { x: 620, y: 1930 }, data: { anchor: 'feet', offsetY: 0, fallbackColor: '#3d3630' } },

  { id: 'glovesWrist', type: 'numberInput', position: { x: 40, y: 2150 }, data: { value: 0.08, min: 0.05, max: 0.12, step: 0.005, label: 'Wrist Radius' } },
  { id: 'glovesHand', type: 'numberInput', position: { x: 40, y: 2260 }, data: { value: 0.09, min: 0.05, max: 0.16, step: 0.005, label: 'Hand Radius' } },
  { id: 'glovesLength', type: 'numberInput', position: { x: 40, y: 2370 }, data: { value: 0.14, min: 0.05, max: 0.25, step: 0.005, label: 'Length' } },
  { id: 'glovesArmSpacing', type: 'numberInput', position: { x: 40, y: 2480 }, data: { value: 0.34, min: 0.2, max: 0.5, step: 0.01, label: 'Arm Spacing' } },
  { id: 'glovesWristScale', type: 'numberMultiply', position: { x: 190, y: 2150 }, data: {} },
  { id: 'glovesGen', type: 'glovesGenerator', position: { x: 340, y: 2370 }, data: {} },
  { id: 'glovesColor', type: 'colorInput', position: { x: 900, y: 1110 }, data: { hex: '#b0413e', label: 'Gloves Color' } },
  { id: 'glovesMaterial', type: 'toonMaterial', position: { x: 900, y: 1210 }, data: {} },
  { id: 'glovesOutput', type: 'garmentOutput', position: { x: 620, y: 2370 }, data: { anchor: 'wrist', offsetY: 0, fallbackColor: '#b0413e' } },

  { id: 'hatBrim', type: 'numberInput', position: { x: 40, y: 2600 }, data: { value: 0.2, min: 0.15, max: 0.3, step: 0.01, label: 'Brim Radius' } },
  { id: 'hatCrownRadius', type: 'numberInput', position: { x: 40, y: 2710 }, data: { value: 0.02, min: 0, max: 0.15, step: 0.005, label: 'Crown Radius' } },
  { id: 'hatHeight', type: 'numberInput', position: { x: 40, y: 2820 }, data: { value: 0.35, min: 0.1, max: 0.6, step: 0.01, label: 'Height' } },
  { id: 'hatGen', type: 'hatGenerator', position: { x: 340, y: 2710 }, data: {} },
  { id: 'hatColor', type: 'colorInput', position: { x: 900, y: 1310 }, data: { hex: '#4a3b6b', label: 'Hat Color' } },
  { id: 'hatMaterial', type: 'toonMaterial', position: { x: 900, y: 1410 }, data: {} },
  { id: 'hatOutput', type: 'garmentOutput', position: { x: 620, y: 2710 }, data: { anchor: 'head', offsetY: 0.1, fallbackColor: '#4a3b6b' } },

  { id: 'beltRadius', type: 'numberInput', position: { x: 40, y: 2930 }, data: { value: 0.32, min: 0.2, max: 0.45, step: 0.01, label: 'Radius' } },
  { id: 'beltThickness', type: 'numberInput', position: { x: 40, y: 3040 }, data: { value: 0.05, min: 0.02, max: 0.12, step: 0.005, label: 'Thickness' } },
  { id: 'beltBulge', type: 'numberInput', position: { x: 40, y: 3150 }, data: { value: 1.15, min: 1.0, max: 1.5, step: 0.01, label: 'Bulge' } },
  { id: 'beltSegments', type: 'numberInput', position: { x: 40, y: 3260 }, data: { value: 24, min: 8, max: 48, step: 1, label: 'Segments' } },
  { id: 'beltRadiusScale', type: 'numberMultiply', position: { x: 190, y: 2930 }, data: {} },
  { id: 'beltGen', type: 'beltGenerator', position: { x: 340, y: 3040 }, data: {} },
  { id: 'beltColor', type: 'colorInput', position: { x: 900, y: 1510 }, data: { hex: '#3a2e26', label: 'Belt Color' } },
  { id: 'beltMaterial', type: 'toonMaterial', position: { x: 900, y: 1610 }, data: {} },
  { id: 'beltOutput', type: 'garmentOutput', position: { x: 620, y: 3040 }, data: { anchor: 'waist', offsetY: 0, fallbackColor: '#3a2e26' } },

  { id: 'scarfNeckRadius', type: 'numberInput', position: { x: 40, y: 3380 }, data: { value: 0.19, min: 0.14, max: 0.3, step: 0.005, label: 'Neck Radius' } },
  { id: 'scarfBandThickness', type: 'numberInput', position: { x: 40, y: 3490 }, data: { value: 0.05, min: 0.02, max: 0.1, step: 0.005, label: 'Band Thickness' } },
  { id: 'scarfTailWidth', type: 'numberInput', position: { x: 40, y: 3600 }, data: { value: 0.09, min: 0.04, max: 0.16, step: 0.005, label: 'Tail Width' } },
  { id: 'scarfTailLength', type: 'numberInput', position: { x: 40, y: 3710 }, data: { value: 0.35, min: 0.1, max: 0.7, step: 0.01, label: 'Tail Length' } },
  { id: 'scarfSegments', type: 'numberInput', position: { x: 40, y: 3820 }, data: { value: 20, min: 8, max: 40, step: 1, label: 'Segments' } },
  { id: 'scarfNeckScale', type: 'numberMultiply', position: { x: 190, y: 3380 }, data: {} },
  { id: 'scarfGen', type: 'scarfGenerator', position: { x: 340, y: 3600 }, data: {} },
  { id: 'scarfColor', type: 'colorInput', position: { x: 900, y: 1710 }, data: { hex: '#8a2e3a', label: 'Scarf Color' } },
  { id: 'scarfMaterial', type: 'toonMaterial', position: { x: 900, y: 1810 }, data: {} },
  { id: 'scarfOutput', type: 'garmentOutput', position: { x: 620, y: 3600 }, data: { anchor: 'shoulder', offsetY: 0.08, fallbackColor: '#8a2e3a' } },

  { id: 'jacketShoulderRadius', type: 'numberInput', position: { x: 40, y: 3930 }, data: { value: 0.34, min: 0.25, max: 0.5, step: 0.01, label: 'Shoulder Radius' } },
  { id: 'jacketLength', type: 'numberInput', position: { x: 40, y: 4040 }, data: { value: 0.42, min: 0.2, max: 0.8, step: 0.01, label: 'Length' } },
  { id: 'jacketHemFlare', type: 'numberInput', position: { x: 40, y: 4150 }, data: { value: 0.15, min: 0, max: 1.5, step: 0.05, label: 'Hem Flare' } },
  { id: 'jacketSegments', type: 'numberInput', position: { x: 40, y: 4260 }, data: { value: 20, min: 8, max: 40, step: 1, label: 'Segments' } },
  { id: 'jacketShoulderScale', type: 'numberMultiply', position: { x: 190, y: 3930 }, data: {} },
  { id: 'jacketGen', type: 'jacketGenerator', position: { x: 340, y: 4040 }, data: {} },
  { id: 'jacketColor', type: 'colorInput', position: { x: 900, y: 1910 }, data: { hex: '#4a5c3e', label: 'Jacket Color' } },
  { id: 'jacketMaterial', type: 'toonMaterial', position: { x: 900, y: 2010 }, data: {} },
  { id: 'jacketOutput', type: 'garmentOutput', position: { x: 620, y: 4040 }, data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#4a5c3e' } },

  { id: 'socksAnkleRadius', type: 'numberInput', position: { x: 40, y: 4380 }, data: { value: 0.09, min: 0.05, max: 0.15, step: 0.005, label: 'Ankle Radius' } },
  { id: 'socksCalfRadius', type: 'numberInput', position: { x: 40, y: 4490 }, data: { value: 0.105, min: 0.05, max: 0.2, step: 0.005, label: 'Calf Radius' } },
  { id: 'socksHeight', type: 'numberInput', position: { x: 40, y: 4600 }, data: { value: 0.22, min: 0.08, max: 0.5, step: 0.01, label: 'Height' } },
  { id: 'socksSegments', type: 'numberInput', position: { x: 40, y: 4710 }, data: { value: 16, min: 8, max: 32, step: 1, label: 'Segments' } },
  { id: 'socksAnkleScale', type: 'numberMultiply', position: { x: 190, y: 4380 }, data: {} },
  { id: 'socksGen', type: 'socksGenerator', position: { x: 340, y: 4490 }, data: {} },
  { id: 'socksColor', type: 'colorInput', position: { x: 900, y: 2110 }, data: { hex: '#d4a83a', label: 'Socks Color' } },
  { id: 'socksMaterial', type: 'toonMaterial', position: { x: 900, y: 2210 }, data: {} },
  { id: 'socksOutput', type: 'garmentOutput', position: { x: 620, y: 4490 }, data: { anchor: 'feet', offsetY: 0, fallbackColor: '#d4a83a' } },

  { id: 'dressTorsoRadius', type: 'numberInput', position: { x: 40, y: 4820 }, data: { value: 0.29, min: 0.2, max: 0.4, step: 0.01, label: 'Torso Radius' } },
  { id: 'dressHemRadius', type: 'numberInput', position: { x: 40, y: 4930 }, data: { value: 0.55, min: 0.3, max: 1.0, step: 0.01, label: 'Hem Radius' } },
  { id: 'dressLength', type: 'numberInput', position: { x: 40, y: 5040 }, data: { value: 0.9, min: 0.4, max: 1.3, step: 0.01, label: 'Length' } },
  { id: 'dressNeckline', type: 'enumInput', position: { x: 40, y: 5150 }, data: { value: 'round', options: ['round', 'v', 'square'], label: 'Neckline' } },
  { id: 'dressNecklineDepth', type: 'numberInput', position: { x: 40, y: 5260 }, data: { value: 0.12, min: 0, max: 0.3, step: 0.01, label: 'Neckline Depth' } },
  { id: 'dressTorsoRadiusScale', type: 'numberMultiply', position: { x: 190, y: 4820 }, data: {} },
  { id: 'dressGen', type: 'dressGenerator', position: { x: 340, y: 5040 }, data: {} },
  { id: 'dressColor', type: 'colorInput', position: { x: 900, y: 2310 }, data: { hex: '#3d7a72', label: 'Dress Color' } },
  { id: 'dressMaterial', type: 'toonMaterial', position: { x: 900, y: 2410 }, data: {} },
  { id: 'dressOutput', type: 'garmentOutput', position: { x: 620, y: 5040 }, data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#3d7a72' } },

  { id: 'bagStrapWidth', type: 'numberInput', position: { x: 40, y: 5390 }, data: { value: 0.04, min: 0.02, max: 0.08, step: 0.005, label: 'Strap Width' } },
  { id: 'bagStrapThickness', type: 'numberInput', position: { x: 40, y: 5500 }, data: { value: 0.015, min: 0.005, max: 0.03, step: 0.005, label: 'Strap Thickness' } },
  { id: 'bagShoulderOffset', type: 'numberInput', position: { x: 40, y: 5610 }, data: { value: 0.08, min: 0, max: 0.2, step: 0.01, label: 'Shoulder Offset' } },
  { id: 'bagHipOffset', type: 'numberInput', position: { x: 40, y: 5720 }, data: { value: 0.26, min: 0, max: 0.4, step: 0.01, label: 'Hip Offset' } },
  { id: 'bagDrop', type: 'numberInput', position: { x: 40, y: 5830 }, data: { value: 0.55, min: 0.2, max: 0.9, step: 0.01, label: 'Drop' } },
  { id: 'bagWidth', type: 'numberInput', position: { x: 40, y: 5940 }, data: { value: 0.16, min: 0.05, max: 0.3, step: 0.01, label: 'Bag Width' } },
  { id: 'bagHeight', type: 'numberInput', position: { x: 40, y: 6050 }, data: { value: 0.14, min: 0.05, max: 0.3, step: 0.01, label: 'Bag Height' } },
  { id: 'bagDepth', type: 'numberInput', position: { x: 40, y: 6160 }, data: { value: 0.08, min: 0.02, max: 0.2, step: 0.01, label: 'Bag Depth' } },
  { id: 'bagGen', type: 'bagGenerator', position: { x: 340, y: 5830 }, data: {} },
  { id: 'bagColor', type: 'colorInput', position: { x: 900, y: 2510 }, data: { hex: '#8a4a2e', label: 'Bag Color' } },
  { id: 'bagMaterial', type: 'toonMaterial', position: { x: 900, y: 2610 }, data: {} },
  { id: 'bagOutput', type: 'garmentOutput', position: { x: 620, y: 5830 }, data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#8a4a2e' } },

  { id: 'necktieKnotWidth', type: 'numberInput', position: { x: 40, y: 6270 }, data: { value: 0.05, min: 0.03, max: 0.08, step: 0.005, label: 'Knot Width' } },
  { id: 'necktieKnotHeight', type: 'numberInput', position: { x: 40, y: 6380 }, data: { value: 0.04, min: 0.02, max: 0.07, step: 0.005, label: 'Knot Height' } },
  { id: 'necktieKnotThickness', type: 'numberInput', position: { x: 40, y: 6490 }, data: { value: 0.025, min: 0.01, max: 0.05, step: 0.005, label: 'Knot Thickness' } },
  { id: 'necktieBladeTopWidth', type: 'numberInput', position: { x: 40, y: 6600 }, data: { value: 0.035, min: 0.015, max: 0.06, step: 0.005, label: 'Blade Top Width' } },
  { id: 'necktieBladeBottomWidth', type: 'numberInput', position: { x: 40, y: 6710 }, data: { value: 0.06, min: 0.03, max: 0.12, step: 0.005, label: 'Blade Bottom Width' } },
  { id: 'necktieBladeThickness', type: 'numberInput', position: { x: 40, y: 6820 }, data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Blade Thickness' } },
  { id: 'necktieBladeLength', type: 'numberInput', position: { x: 40, y: 6930 }, data: { value: 0.4, min: 0.2, max: 0.7, step: 0.01, label: 'Blade Length' } },
  { id: 'necktieGen', type: 'necktieGenerator', position: { x: 340, y: 6600 }, data: {} },
  { id: 'necktieColor', type: 'colorInput', position: { x: 900, y: 2710 }, data: { hex: '#7a1f2b', label: 'Necktie Color' } },
  { id: 'necktieMaterial', type: 'toonMaterial', position: { x: 900, y: 2810 }, data: {} },
  { id: 'necktieOutput', type: 'garmentOutput', position: { x: 620, y: 6600 }, data: { anchor: 'shoulder', offsetY: 0, fallbackColor: '#7a1f2b' } },

  { id: 'glassesLensRadius', type: 'numberInput', position: { x: 40, y: 7050 }, data: { value: 0.045, min: 0.02, max: 0.07, step: 0.005, label: 'Lens Radius' } },
  { id: 'glassesFrameThickness', type: 'numberInput', position: { x: 40, y: 7160 }, data: { value: 0.008, min: 0.003, max: 0.02, step: 0.001, label: 'Frame Thickness' } },
  { id: 'glassesLensSpacing', type: 'numberInput', position: { x: 40, y: 7270 }, data: { value: 0.055, min: 0.03, max: 0.09, step: 0.005, label: 'Lens Spacing' } },
  { id: 'glassesBridgeThickness', type: 'numberInput', position: { x: 40, y: 7380 }, data: { value: 0.01, min: 0.005, max: 0.02, step: 0.001, label: 'Bridge Thickness' } },
  { id: 'glassesTempleLength', type: 'numberInput', position: { x: 40, y: 7490 }, data: { value: 0.12, min: 0.05, max: 0.2, step: 0.01, label: 'Temple Length' } },
  { id: 'glassesTempleThickness', type: 'numberInput', position: { x: 40, y: 7600 }, data: { value: 0.006, min: 0.003, max: 0.015, step: 0.001, label: 'Temple Thickness' } },
  { id: 'glassesGen', type: 'glassesGenerator', position: { x: 340, y: 7380 }, data: {} },
  { id: 'glassesColor', type: 'colorInput', position: { x: 900, y: 2910 }, data: { hex: '#2a2a2a', label: 'Glasses Color' } },
  { id: 'glassesMaterial', type: 'toonMaterial', position: { x: 900, y: 3010 }, data: {} },
  { id: 'glassesOutput', type: 'garmentOutput', position: { x: 620, y: 7380 }, data: { anchor: 'head', offsetY: -0.02, fallbackColor: '#2a2a2a' } },
];

export const initialEdges: Edge[] = [
  { id: 'e-waist', source: 'skirtWaist', sourceHandle: 'value', target: 'skirtWaistScale', targetHandle: 'value' },
  { id: 'e-waist-build', source: 'bodyBuild', sourceHandle: 'value', target: 'skirtWaistScale', targetHandle: 'factor' },
  { id: 'e-waist-scaled', source: 'skirtWaistScale', sourceHandle: 'value', target: 'skirtGen', targetHandle: 'waistRadius' },
  { id: 'e-length', source: 'skirtLength', sourceHandle: 'value', target: 'skirtGen', targetHandle: 'length' },
  { id: 'e-flare', source: 'skirtFlare', sourceHandle: 'value', target: 'skirtGen', targetHandle: 'flare' },
  { id: 'e-segments', source: 'skirtSegments', sourceHandle: 'value', target: 'skirtGen', targetHandle: 'segments' },
  { id: 'e-geometry', source: 'skirtGen', sourceHandle: 'geometry', target: 'skirtOutput', targetHandle: 'geometry' },
  { id: 'e-skirt-color', source: 'skirtColor', sourceHandle: 'color', target: 'skirtMaterial', targetHandle: 'color' },
  { id: 'e-skirt-material', source: 'skirtMaterial', sourceHandle: 'material', target: 'skirtOutput', targetHandle: 'material' },

  { id: 'e-top-radius', source: 'topRadius', sourceHandle: 'value', target: 'topRadiusScale', targetHandle: 'value' },
  { id: 'e-top-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'topRadiusScale', targetHandle: 'factor' },
  { id: 'e-top-radius-scaled', source: 'topRadiusScale', sourceHandle: 'value', target: 'topGen', targetHandle: 'torsoRadius' },
  { id: 'e-top-length', source: 'topLength', sourceHandle: 'value', target: 'topGen', targetHandle: 'length' },
  { id: 'e-top-neckline', source: 'topNeckline', sourceHandle: 'value', target: 'topGen', targetHandle: 'necklineType' },
  { id: 'e-top-neckline-depth', source: 'topNecklineDepth', sourceHandle: 'value', target: 'topGen', targetHandle: 'necklineDepth' },
  { id: 'e-top-geometry', source: 'topGen', sourceHandle: 'geometry', target: 'topOutput', targetHandle: 'geometry' },
  { id: 'e-top-color', source: 'topColor', sourceHandle: 'color', target: 'topMaterial', targetHandle: 'color' },
  { id: 'e-top-material', source: 'topMaterial', sourceHandle: 'material', target: 'topOutput', targetHandle: 'material' },

  // Sleeve は Top の胴体半径(Body Build 適用後の値)とマテリアルを再利用する — 1つの
  // Color/Material ノードが2つの Garment Output に供給しているため、Top を再着色すると
  // Sleeve も一緒に再着色される。半径も topRadiusScale の出力を共有しているため、
  // ボディをリサイズしても Top と Sleeve の付け根の太さがずれない。
  { id: 'e-sleeve-attach-radius', source: 'topRadiusScale', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'attachRadius' },
  { id: 'e-sleeve-length', source: 'sleeveLength', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'sleeveLength' },
  { id: 'e-sleeve-radius', source: 'sleeveRadius', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'sleeveRadius' },
  { id: 'e-sleeve-geometry', source: 'sleeveGen', sourceHandle: 'geometry', target: 'sleeveOutput', targetHandle: 'geometry' },
  { id: 'e-sleeve-material', source: 'topMaterial', sourceHandle: 'material', target: 'sleeveOutput', targetHandle: 'material' },

  { id: 'e-pants-waist', source: 'pantsWaist', sourceHandle: 'value', target: 'pantsWaistScale', targetHandle: 'value' },
  { id: 'e-pants-waist-build', source: 'bodyBuild', sourceHandle: 'value', target: 'pantsWaistScale', targetHandle: 'factor' },
  { id: 'e-pants-waist-scaled', source: 'pantsWaistScale', sourceHandle: 'value', target: 'pantsGen', targetHandle: 'waistRadius' },
  { id: 'e-pants-hem', source: 'pantsHem', sourceHandle: 'value', target: 'pantsGen', targetHandle: 'hemRadius' },
  { id: 'e-pants-inseam', source: 'pantsInseam', sourceHandle: 'value', target: 'pantsGen', targetHandle: 'inseam' },
  { id: 'e-pants-leg-spacing', source: 'pantsLegSpacing', sourceHandle: 'value', target: 'pantsGen', targetHandle: 'legSpacing' },
  { id: 'e-pants-segments', source: 'pantsSegments', sourceHandle: 'value', target: 'pantsGen', targetHandle: 'segments' },
  { id: 'e-pants-geometry', source: 'pantsGen', sourceHandle: 'geometry', target: 'pantsOutput', targetHandle: 'geometry' },
  { id: 'e-pants-color', source: 'pantsColor', sourceHandle: 'color', target: 'pantsMaterial', targetHandle: 'color' },
  { id: 'e-pants-material', source: 'pantsMaterial', sourceHandle: 'material', target: 'pantsOutput', targetHandle: 'material' },

  // Shoes は Pants の Leg Spacing を再利用する — 脚の間隔を変えると靴の間隔も一緒に追従する。
  { id: 'e-shoes-leg-spacing', source: 'pantsLegSpacing', sourceHandle: 'value', target: 'shoesGen', targetHandle: 'legSpacing' },
  { id: 'e-shoes-sole', source: 'shoesSole', sourceHandle: 'value', target: 'shoesSoleScale', targetHandle: 'value' },
  { id: 'e-shoes-sole-build', source: 'bodyBuild', sourceHandle: 'value', target: 'shoesSoleScale', targetHandle: 'factor' },
  { id: 'e-shoes-sole-scaled', source: 'shoesSoleScale', sourceHandle: 'value', target: 'shoesGen', targetHandle: 'soleRadius' },
  { id: 'e-shoes-cuff', source: 'shoesCuff', sourceHandle: 'value', target: 'shoesGen', targetHandle: 'cuffRadius' },
  { id: 'e-shoes-height', source: 'shoesHeight', sourceHandle: 'value', target: 'shoesGen', targetHandle: 'height' },
  { id: 'e-shoes-toe-length', source: 'shoesToeLength', sourceHandle: 'value', target: 'shoesGen', targetHandle: 'toeLength' },
  { id: 'e-shoes-geometry', source: 'shoesGen', sourceHandle: 'geometry', target: 'shoesOutput', targetHandle: 'geometry' },
  { id: 'e-shoes-color', source: 'shoesColor', sourceHandle: 'color', target: 'shoesMaterial', targetHandle: 'color' },
  { id: 'e-shoes-material', source: 'shoesMaterial', sourceHandle: 'material', target: 'shoesOutput', targetHandle: 'material' },

  { id: 'e-gloves-wrist', source: 'glovesWrist', sourceHandle: 'value', target: 'glovesWristScale', targetHandle: 'value' },
  { id: 'e-gloves-wrist-build', source: 'bodyBuild', sourceHandle: 'value', target: 'glovesWristScale', targetHandle: 'factor' },
  { id: 'e-gloves-wrist-scaled', source: 'glovesWristScale', sourceHandle: 'value', target: 'glovesGen', targetHandle: 'wristRadius' },
  { id: 'e-gloves-hand', source: 'glovesHand', sourceHandle: 'value', target: 'glovesGen', targetHandle: 'handRadius' },
  { id: 'e-gloves-length', source: 'glovesLength', sourceHandle: 'value', target: 'glovesGen', targetHandle: 'length' },
  { id: 'e-gloves-arm-spacing', source: 'glovesArmSpacing', sourceHandle: 'value', target: 'glovesGen', targetHandle: 'armSpacing' },
  { id: 'e-gloves-geometry', source: 'glovesGen', sourceHandle: 'geometry', target: 'glovesOutput', targetHandle: 'geometry' },
  { id: 'e-gloves-color', source: 'glovesColor', sourceHandle: 'color', target: 'glovesMaterial', targetHandle: 'color' },
  { id: 'e-gloves-material', source: 'glovesMaterial', sourceHandle: 'material', target: 'glovesOutput', targetHandle: 'material' },

  { id: 'e-hat-brim', source: 'hatBrim', sourceHandle: 'value', target: 'hatGen', targetHandle: 'brimRadius' },
  { id: 'e-hat-crown', source: 'hatCrownRadius', sourceHandle: 'value', target: 'hatGen', targetHandle: 'crownRadius' },
  { id: 'e-hat-height', source: 'hatHeight', sourceHandle: 'value', target: 'hatGen', targetHandle: 'height' },
  { id: 'e-hat-geometry', source: 'hatGen', sourceHandle: 'geometry', target: 'hatOutput', targetHandle: 'geometry' },
  { id: 'e-hat-color', source: 'hatColor', sourceHandle: 'color', target: 'hatMaterial', targetHandle: 'color' },
  { id: 'e-hat-material', source: 'hatMaterial', sourceHandle: 'material', target: 'hatOutput', targetHandle: 'material' },

  { id: 'e-belt-radius', source: 'beltRadius', sourceHandle: 'value', target: 'beltRadiusScale', targetHandle: 'value' },
  { id: 'e-belt-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'beltRadiusScale', targetHandle: 'factor' },
  { id: 'e-belt-radius-scaled', source: 'beltRadiusScale', sourceHandle: 'value', target: 'beltGen', targetHandle: 'radius' },
  { id: 'e-belt-thickness', source: 'beltThickness', sourceHandle: 'value', target: 'beltGen', targetHandle: 'thickness' },
  { id: 'e-belt-bulge', source: 'beltBulge', sourceHandle: 'value', target: 'beltGen', targetHandle: 'bulge' },
  { id: 'e-belt-segments', source: 'beltSegments', sourceHandle: 'value', target: 'beltGen', targetHandle: 'segments' },
  { id: 'e-belt-geometry', source: 'beltGen', sourceHandle: 'geometry', target: 'beltOutput', targetHandle: 'geometry' },
  { id: 'e-belt-color', source: 'beltColor', sourceHandle: 'color', target: 'beltMaterial', targetHandle: 'color' },
  { id: 'e-belt-material', source: 'beltMaterial', sourceHandle: 'material', target: 'beltOutput', targetHandle: 'material' },

  { id: 'e-scarf-neck-radius', source: 'scarfNeckRadius', sourceHandle: 'value', target: 'scarfNeckScale', targetHandle: 'value' },
  { id: 'e-scarf-neck-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'scarfNeckScale', targetHandle: 'factor' },
  { id: 'e-scarf-neck-radius-scaled', source: 'scarfNeckScale', sourceHandle: 'value', target: 'scarfGen', targetHandle: 'neckRadius' },
  { id: 'e-scarf-band-thickness', source: 'scarfBandThickness', sourceHandle: 'value', target: 'scarfGen', targetHandle: 'bandThickness' },
  { id: 'e-scarf-tail-width', source: 'scarfTailWidth', sourceHandle: 'value', target: 'scarfGen', targetHandle: 'tailWidth' },
  { id: 'e-scarf-tail-length', source: 'scarfTailLength', sourceHandle: 'value', target: 'scarfGen', targetHandle: 'tailLength' },
  { id: 'e-scarf-segments', source: 'scarfSegments', sourceHandle: 'value', target: 'scarfGen', targetHandle: 'segments' },
  { id: 'e-scarf-geometry', source: 'scarfGen', sourceHandle: 'geometry', target: 'scarfOutput', targetHandle: 'geometry' },
  { id: 'e-scarf-color', source: 'scarfColor', sourceHandle: 'color', target: 'scarfMaterial', targetHandle: 'color' },
  { id: 'e-scarf-material', source: 'scarfMaterial', sourceHandle: 'material', target: 'scarfOutput', targetHandle: 'material' },

  { id: 'e-jacket-shoulder-radius', source: 'jacketShoulderRadius', sourceHandle: 'value', target: 'jacketShoulderScale', targetHandle: 'value' },
  { id: 'e-jacket-shoulder-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'jacketShoulderScale', targetHandle: 'factor' },
  { id: 'e-jacket-shoulder-radius-scaled', source: 'jacketShoulderScale', sourceHandle: 'value', target: 'jacketGen', targetHandle: 'shoulderRadius' },
  { id: 'e-jacket-length', source: 'jacketLength', sourceHandle: 'value', target: 'jacketGen', targetHandle: 'length' },
  { id: 'e-jacket-hem-flare', source: 'jacketHemFlare', sourceHandle: 'value', target: 'jacketGen', targetHandle: 'hemFlare' },
  { id: 'e-jacket-segments', source: 'jacketSegments', sourceHandle: 'value', target: 'jacketGen', targetHandle: 'segments' },
  { id: 'e-jacket-geometry', source: 'jacketGen', sourceHandle: 'geometry', target: 'jacketOutput', targetHandle: 'geometry' },
  { id: 'e-jacket-color', source: 'jacketColor', sourceHandle: 'color', target: 'jacketMaterial', targetHandle: 'color' },
  { id: 'e-jacket-material', source: 'jacketMaterial', sourceHandle: 'material', target: 'jacketOutput', targetHandle: 'material' },

  // Socks は Pants の Leg Spacing を再利用する — shoes と同じく、脚の間隔を変えると靴下の間隔も追従する。
  { id: 'e-socks-leg-spacing', source: 'pantsLegSpacing', sourceHandle: 'value', target: 'socksGen', targetHandle: 'legSpacing' },
  { id: 'e-socks-ankle-radius', source: 'socksAnkleRadius', sourceHandle: 'value', target: 'socksAnkleScale', targetHandle: 'value' },
  { id: 'e-socks-ankle-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'socksAnkleScale', targetHandle: 'factor' },
  { id: 'e-socks-ankle-radius-scaled', source: 'socksAnkleScale', sourceHandle: 'value', target: 'socksGen', targetHandle: 'ankleRadius' },
  { id: 'e-socks-calf-radius', source: 'socksCalfRadius', sourceHandle: 'value', target: 'socksGen', targetHandle: 'calfRadius' },
  { id: 'e-socks-height', source: 'socksHeight', sourceHandle: 'value', target: 'socksGen', targetHandle: 'height' },
  { id: 'e-socks-segments', source: 'socksSegments', sourceHandle: 'value', target: 'socksGen', targetHandle: 'segments' },
  { id: 'e-socks-geometry', source: 'socksGen', sourceHandle: 'geometry', target: 'socksOutput', targetHandle: 'geometry' },
  { id: 'e-socks-color', source: 'socksColor', sourceHandle: 'color', target: 'socksMaterial', targetHandle: 'color' },
  { id: 'e-socks-material', source: 'socksMaterial', sourceHandle: 'material', target: 'socksOutput', targetHandle: 'material' },

  { id: 'e-dress-torso-radius', source: 'dressTorsoRadius', sourceHandle: 'value', target: 'dressTorsoRadiusScale', targetHandle: 'value' },
  { id: 'e-dress-torso-radius-build', source: 'bodyBuild', sourceHandle: 'value', target: 'dressTorsoRadiusScale', targetHandle: 'factor' },
  { id: 'e-dress-torso-radius-scaled', source: 'dressTorsoRadiusScale', sourceHandle: 'value', target: 'dressGen', targetHandle: 'torsoRadius' },
  { id: 'e-dress-hem-radius', source: 'dressHemRadius', sourceHandle: 'value', target: 'dressGen', targetHandle: 'hemRadius' },
  { id: 'e-dress-length', source: 'dressLength', sourceHandle: 'value', target: 'dressGen', targetHandle: 'length' },
  { id: 'e-dress-neckline', source: 'dressNeckline', sourceHandle: 'value', target: 'dressGen', targetHandle: 'necklineType' },
  { id: 'e-dress-neckline-depth', source: 'dressNecklineDepth', sourceHandle: 'value', target: 'dressGen', targetHandle: 'necklineDepth' },
  { id: 'e-dress-geometry', source: 'dressGen', sourceHandle: 'geometry', target: 'dressOutput', targetHandle: 'geometry' },
  { id: 'e-dress-color', source: 'dressColor', sourceHandle: 'color', target: 'dressMaterial', targetHandle: 'color' },
  { id: 'e-dress-material', source: 'dressMaterial', sourceHandle: 'material', target: 'dressOutput', targetHandle: 'material' },

  { id: 'e-bag-strap-width', source: 'bagStrapWidth', sourceHandle: 'value', target: 'bagGen', targetHandle: 'strapWidth' },
  { id: 'e-bag-strap-thickness', source: 'bagStrapThickness', sourceHandle: 'value', target: 'bagGen', targetHandle: 'strapThickness' },
  { id: 'e-bag-shoulder-offset', source: 'bagShoulderOffset', sourceHandle: 'value', target: 'bagGen', targetHandle: 'shoulderOffset' },
  { id: 'e-bag-hip-offset', source: 'bagHipOffset', sourceHandle: 'value', target: 'bagGen', targetHandle: 'hipOffset' },
  { id: 'e-bag-drop', source: 'bagDrop', sourceHandle: 'value', target: 'bagGen', targetHandle: 'drop' },
  { id: 'e-bag-width', source: 'bagWidth', sourceHandle: 'value', target: 'bagGen', targetHandle: 'bagWidth' },
  { id: 'e-bag-height', source: 'bagHeight', sourceHandle: 'value', target: 'bagGen', targetHandle: 'bagHeight' },
  { id: 'e-bag-depth', source: 'bagDepth', sourceHandle: 'value', target: 'bagGen', targetHandle: 'bagDepth' },
  { id: 'e-bag-geometry', source: 'bagGen', sourceHandle: 'geometry', target: 'bagOutput', targetHandle: 'geometry' },
  { id: 'e-bag-color', source: 'bagColor', sourceHandle: 'color', target: 'bagMaterial', targetHandle: 'color' },
  { id: 'e-bag-material', source: 'bagMaterial', sourceHandle: 'material', target: 'bagOutput', targetHandle: 'material' },

  { id: 'e-necktie-knot-width', source: 'necktieKnotWidth', sourceHandle: 'value', target: 'necktieGen', targetHandle: 'knotWidth' },
  { id: 'e-necktie-knot-height', source: 'necktieKnotHeight', sourceHandle: 'value', target: 'necktieGen', targetHandle: 'knotHeight' },
  { id: 'e-necktie-knot-thickness', source: 'necktieKnotThickness', sourceHandle: 'value', target: 'necktieGen', targetHandle: 'knotThickness' },
  { id: 'e-necktie-blade-top-width', source: 'necktieBladeTopWidth', sourceHandle: 'value', target: 'necktieGen', targetHandle: 'bladeTopWidth' },
  { id: 'e-necktie-blade-bottom-width', source: 'necktieBladeBottomWidth', sourceHandle: 'value', target: 'necktieGen', targetHandle: 'bladeBottomWidth' },
  { id: 'e-necktie-blade-thickness', source: 'necktieBladeThickness', sourceHandle: 'value', target: 'necktieGen', targetHandle: 'bladeThickness' },
  { id: 'e-necktie-blade-length', source: 'necktieBladeLength', sourceHandle: 'value', target: 'necktieGen', targetHandle: 'bladeLength' },
  { id: 'e-necktie-geometry', source: 'necktieGen', sourceHandle: 'geometry', target: 'necktieOutput', targetHandle: 'geometry' },
  { id: 'e-necktie-color', source: 'necktieColor', sourceHandle: 'color', target: 'necktieMaterial', targetHandle: 'color' },
  { id: 'e-necktie-material', source: 'necktieMaterial', sourceHandle: 'material', target: 'necktieOutput', targetHandle: 'material' },

  { id: 'e-glasses-lens-radius', source: 'glassesLensRadius', sourceHandle: 'value', target: 'glassesGen', targetHandle: 'lensRadius' },
  { id: 'e-glasses-frame-thickness', source: 'glassesFrameThickness', sourceHandle: 'value', target: 'glassesGen', targetHandle: 'frameThickness' },
  { id: 'e-glasses-lens-spacing', source: 'glassesLensSpacing', sourceHandle: 'value', target: 'glassesGen', targetHandle: 'lensSpacing' },
  { id: 'e-glasses-bridge-thickness', source: 'glassesBridgeThickness', sourceHandle: 'value', target: 'glassesGen', targetHandle: 'bridgeThickness' },
  { id: 'e-glasses-temple-length', source: 'glassesTempleLength', sourceHandle: 'value', target: 'glassesGen', targetHandle: 'templeLength' },
  { id: 'e-glasses-temple-thickness', source: 'glassesTempleThickness', sourceHandle: 'value', target: 'glassesGen', targetHandle: 'templeThickness' },
  { id: 'e-glasses-geometry', source: 'glassesGen', sourceHandle: 'geometry', target: 'glassesOutput', targetHandle: 'geometry' },
  { id: 'e-glasses-color', source: 'glassesColor', sourceHandle: 'color', target: 'glassesMaterial', targetHandle: 'color' },
  { id: 'e-glasses-material', source: 'glassesMaterial', sourceHandle: 'material', target: 'glassesOutput', targetHandle: 'material' },
];

interface HistorySnapshot {
  nodes: Node[];
  edges: Edge[];
}

const HISTORY_LIMIT = 100;
/** スライダー/カラーピッカーのドラッグ中に連続発火する updateNodeData 呼び出しを
 * 1回のUndo単位にまとめるための猶予時間。この時間内に同じキーで再度呼ばれた場合は
 * 新しい履歴エントリを積まず、直前のジェスチャーの続きとみなす。 */
const COALESCE_MS = 500;

interface Clipboard {
  nodes: Node[];
  edges: Edge[];
}

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  evaluatedResults: EvaluatedGraph | null;
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  /** 直近の履歴プッシュを識別するキーとタイムスタンプ(コアレッシング用の内部状態)。 */
  _historyKey: string | null;
  _historyAt: number;
  /** ノードのドラッグ中かどうか(ドラッグ開始時にのみ履歴を1件積むため)。 */
  _dragging: boolean;
  /** コピーしたノード/エッジ(選択範囲の内部エッジのみ)。 */
  clipboard: Clipboard | null;
  /** 同じクリップボードから連続でペーストした回数。ペースト位置をカスケード
   * オフセットするために使い、コピーのたびに 0 にリセットされる。 */
  _pasteCount: number;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  setEvaluatedResults: (results: EvaluatedGraph) => void;
  addNode: (type: string, position: { x: number; y: number }) => void;
  loadGraph: (nodes: Node[], edges: Edge[]) => void;
  undo: () => void;
  redo: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;
  autoLayout: () => void;
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => {
      /** 現在の nodes/edges を過去スタックに積み、redo スタックをクリアする。
       * key を指定すると、同じ key で `coalesceMs` 以内に再度呼ばれた場合は
       * 新しいエントリを積まず直前の呼び出しの続きとして扱う(1ジェスチャー=1エントリ)。 */
      const pushHistory = (key?: string, coalesceMs = 0) => {
        const state = get();
        const now = Date.now();
        if (key && state._historyKey === key && now - state._historyAt < coalesceMs) {
          set({ _historyAt: now });
          return;
        }
        set({
          past: [...state.past, { nodes: state.nodes, edges: state.edges }].slice(-HISTORY_LIMIT),
          future: [],
          _historyKey: key ?? null,
          _historyAt: now,
        });
      };

      return {
        nodes: initialNodes,
        edges: initialEdges,
        evaluatedResults: null,
        past: [],
        future: [],
        _historyKey: null,
        _historyAt: 0,
        _dragging: false,
        clipboard: null,
        _pasteCount: 0,
        onNodesChange: (changes) => {
          if (changes.some((c) => c.type === 'remove')) {
            pushHistory();
          } else if (changes.some((c) => c.type === 'position' && c.dragging) && !get()._dragging) {
            pushHistory();
            set({ _dragging: true });
          }
          if (changes.some((c) => c.type === 'position' && c.dragging === false)) {
            set({ _dragging: false });
          }
          set({ nodes: applyNodeChanges(changes, get().nodes) });
        },
        onEdgesChange: (changes) => {
          if (changes.some((c) => c.type === 'remove')) pushHistory();
          set({ edges: applyEdgeChanges(changes, get().edges) });
        },
        onConnect: (connection) => {
          pushHistory();
          // 1つの入力ソケットに複数の接続が同時に生きていると、evaluateGraph() は
          // 配列中で最初に見つかったエッジしか採用しない(他の接続は静かに無視され、
          // 後でそのエッジが消えた瞬間に見た目の値が突然変わる)。それを避けるため、
          // 新しい接続を追加する前に、同じ target/targetHandle への既存の接続を
          // 置き換える(繋ぎ直す一般的なノードエディタの挙動)。
          const edges = get().edges.filter(
            (e) => !(e.target === connection.target && (e.targetHandle ?? null) === (connection.targetHandle ?? null)),
          );
          set({ edges: addEdge(connection, edges) });
        },
        updateNodeData: (id, data) => {
          pushHistory(`data:${id}`, COALESCE_MS);
          set({
            nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)),
          });
        },
        setEvaluatedResults: (results) => set({ evaluatedResults: results }),
        addNode: (type, position) => {
          pushHistory();
          const def = getNodeType(type);
          const id = `${type}-${Math.random().toString(36).slice(2, 9)}`;
          const newNode: Node = { id, type, position, data: def.createDefaultData() };
          set({ nodes: [...get().nodes, newNode] });
        },
        loadGraph: (nodes, edges) =>
          set({ nodes, edges, evaluatedResults: null, past: [], future: [], _historyKey: null }),
        undo: () => {
          const { past, nodes, edges, future } = get();
          if (past.length === 0) return;
          const previous = past[past.length - 1];
          set({
            nodes: previous.nodes,
            edges: previous.edges,
            past: past.slice(0, -1),
            future: [{ nodes, edges }, ...future],
            _historyKey: null,
            _dragging: false,
          });
        },
        redo: () => {
          const { future, nodes, edges, past } = get();
          if (future.length === 0) return;
          const next = future[0];
          set({
            nodes: next.nodes,
            edges: next.edges,
            future: future.slice(1),
            past: [...past, { nodes, edges }],
            _historyKey: null,
            _dragging: false,
          });
        },
        copySelected: () => {
          const state = get();
          const selectedNodes = state.nodes.filter((n) => n.selected);
          if (selectedNodes.length === 0) return;
          const selectedIds = new Set(selectedNodes.map((n) => n.id));
          const internalEdges = state.edges.filter(
            (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
          );
          set({
            clipboard: { nodes: structuredClone(selectedNodes), edges: structuredClone(internalEdges) },
            _pasteCount: 0,
          });
        },
        pasteClipboard: () => {
          const state = get();
          const clip = state.clipboard;
          if (!clip || clip.nodes.length === 0) return;

          pushHistory();

          const offset = (state._pasteCount + 1) * 32;
          const idMap = new Map<string, string>();
          const newNodes: Node[] = clip.nodes.map((n) => {
            const newId = `${n.type ?? 'node'}-${Math.random().toString(36).slice(2, 9)}`;
            idMap.set(n.id, newId);
            return {
              ...structuredClone(n),
              id: newId,
              selected: true,
              position: { x: n.position.x + offset, y: n.position.y + offset },
            };
          });
          const newEdges: Edge[] = clip.edges.map((e) => ({
            ...structuredClone(e),
            id: `e-${Math.random().toString(36).slice(2, 9)}`,
            source: idMap.get(e.source)!,
            target: idMap.get(e.target)!,
          }));

          set({
            nodes: [...state.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)), ...newNodes],
            edges: [...state.edges, ...newEdges],
            _pasteCount: state._pasteCount + 1,
          });
        },
        duplicateSelected: () => {
          get().copySelected();
          get().pasteClipboard();
        },
        autoLayout: () => {
          const state = get();
          if (state.nodes.length === 0) return;
          pushHistory();
          const graphNodes = state.nodes.map((n) => ({ id: n.id, type: n.type ?? '', data: n.data }));
          const graphEdges = state.edges.map((e) => ({
            source: e.source,
            sourceHandle: e.sourceHandle,
            target: e.target,
            targetHandle: e.targetHandle,
          }));
          const positions = computeAutoLayout(graphNodes, graphEdges);
          set({
            nodes: state.nodes.map((n) => {
              const position = positions.get(n.id);
              return position ? { ...n, position } : n;
            }),
          });
        },
      };
    },
    {
      name: GRAPH_STORAGE_KEY,
      partialize: (state) => ({ nodes: state.nodes, edges: state.edges }),
    },
  ),
);
