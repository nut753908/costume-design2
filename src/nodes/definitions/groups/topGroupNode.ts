import { defineGroupNode } from '../groupNodeFactory';
import { bodyRadiusScale, bodyRadiusSockets, shoulderedBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** profile(shoulderedProfile、肩の丸みで首まわりまで閉じた筒、`garmentParts.ts` の `shoulderedBody()`)+
 * gen(ringGridGenerator、ネックラインを彫り込む)+sleeveGen(sleevePair、`generic/sleevePair.ts`)+merge(mergeGeometry)を1つのガーメントとして
 * まとめたグループノード。Color(外部ソケット `color`→`material`)は Top 本体と袖で共有する。
 * 袖は腕を覆うよう、横位置に体の肩幅(外部ソケット `shoulderSpacing`、腕の中心と同じ値)を使う。
 * 袖なしにしたい場合は `sleeveTranslate → merge` の配線を切る(`mergeGeometry` は1つだけでもそのまま通す)。
 * Sleeve Length を 0 にするとチューブが根元で潰れるだけで頂点が残るため、min は 0 にしない。
 * 袖の太さ(`sleeveScale`)は体の Arm Radius × 倍率。体の Torso Radius/Arm Radius/Neck Radius/Shoulder Spacing と Anchor Y(取り付け位置、
 * ルートの `bodyLayout` 共有ノードから配線される shoulderY)は外部ソケットのまま。 */
const output = garmentOutput({ offsetY: 0, geometry: 'merge' });

const scale = bodyRadiusScale('torsoRadius', 1.12);
const sleeveScale = bodyRadiusScale('armRadius', 1.25, 'sleeveScale');
const body = shoulderedBody({ length: 0.5, hemRadius: 'scale', neckOpeningRatio: 1.8 });

defineGroupNode({
  type: 'topGroup',
  label: 'Top',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          bodyRadiusSockets.torsoRadius,
          bodyRadiusSockets.armRadius,
          bodyRadiusSockets.neckRadius,
          { id: 'shoulderSpacing', label: 'Shoulder Spacing', type: 'number', default: 0.15 },
          anchorYSocket,
          colorSocket('#5b8fa8'),
        ],
      },
    },
    ...scale.nodes,
    ...sleeveScale.nodes,
    { id: 'neckline', type: 'necklineShapes', data: {} },
    ...body.nodes,
    { id: 'gen', type: 'ringGridGenerator', data: { steps: 16, necklineDepth: 0.02 } },
    { id: 'sleeveGen', type: 'sleevePair', data: { sleeveLength: 0.18 } },
    // 袖の付け根を、腕の上端の関節の球(腕の付け根は肩の頂点から torsoRadius × 0.8 下、
    // `bodyLayoutGroupNode.ts` の `armTorsoOverlap`)を覆い、袖の上端の球が服の肩の線から
    // 出ない高さまで下げる。
    { id: 'sleeveDrop', type: 'numberMultiply', data: { factor: -0.7 } },
    { id: 'sleeveTranslate', type: 'translate', data: {} },
    { id: 'merge', type: 'mergeGeometry', data: {} },
    ...output.nodes,
  ],
  internalEdges: [
    ...scale.edges,
    ...sleeveScale.edges,
    ...body.edges,
    { source: 'profile', sourceHandle: 'curve', target: 'gen', targetHandle: 'profile' },
    { source: 'neckline', sourceHandle: 'roundShape', target: 'gen', targetHandle: 'necklineWeights' },
    { source: 'input', sourceHandle: 'shoulderSpacing', target: 'sleeveGen', targetHandle: 'spacing' },
    { source: 'sleeveScale', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'sleeveRadius' },
    { source: 'gen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'input', sourceHandle: 'torsoRadius', target: 'sleeveDrop', targetHandle: 'value' },
    { source: 'sleeveGen', sourceHandle: 'geometry', target: 'sleeveTranslate', targetHandle: 'geometry' },
    { source: 'sleeveDrop', sourceHandle: 'value', target: 'sleeveTranslate', targetHandle: 'y' },
    { source: 'sleeveTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    ...output.edges,
  ],
});
