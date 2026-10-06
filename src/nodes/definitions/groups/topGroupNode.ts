import { defineGroupNode } from '../groupNodeFactory';
import { radiusInput, shoulderedBody } from '../garmentParts';
import { colorSocket, garmentOutput } from '../garmentOutput';

/** profile(shoulderedProfile、肩の丸みで首まわりまで閉じた筒、`garmentParts.ts` の `shoulderedBody()`)+
 * gen(ringGridGenerator、ネックラインを彫り込む)+sleeveGen(sleevePair、`generic/sleevePair.ts`)+merge(mergeGeometry)を1つのガーメントとして
 * まとめたグループノード。Color(外部ソケット `color`→`material`)は Top 本体と袖で共有する。
 * 袖は腕を覆うよう、横位置に体の肩幅(外部ソケット `shoulderSpacing`、腕の中心と同じ値)を使う。
 * 袖なしにしたい場合は `sleeveTranslate → merge` の配線を切る(`mergeGeometry` は1つだけでもそのまま通す)。
 * Sleeve Length を 0 にするとチューブが根元で潰れるだけで頂点が残るため、min は 0 にしない。
 * 袖の太さ(`sleeveScale`)・袖の付け根の下がり(`sleeveDrop`)・胴体と首の半径は、固定値。 */
const output = garmentOutput({ y: 1.2169, geometry: 'merge' });

const scale = radiusInput(0.172032);
const sleeveScale = radiusInput(0.065375, 'sleeveScale');
const body = shoulderedBody({ length: 0.5, hemRadius: 'scale', neckOpening: 0.0945 });

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
          colorSocket('#5b8fa8'),
        ],
      },
    },
    { id: 'shoulderSpacing', type: 'numberInput', data: { value: 0.1443 } },
    ...scale.nodes,
    ...sleeveScale.nodes,
    { id: 'neckline', type: 'necklineShapes', data: {} },
    ...body.nodes,
    { id: 'gen', type: 'ringGridGenerator', data: { steps: 16, necklineDepth: 0.02 } },
    { id: 'sleeveGen', type: 'sleevePair', data: { sleeveLength: 0.18 } },
    // 袖の付け根を、腕の上端の関節の球(腕の付け根は肩の頂点から torsoRadius × 0.8 下)を覆い、袖の上端の球が服の肩の線から
    // 出ない高さまで下げる。
    { id: 'sleeveDrop', type: 'numberInput', data: { value: -0.10752 } },
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
    { source: 'shoulderSpacing', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'spacing' },
    { source: 'sleeveScale', sourceHandle: 'value', target: 'sleeveGen', targetHandle: 'sleeveRadius' },
    { source: 'gen', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    { source: 'sleeveGen', sourceHandle: 'geometry', target: 'sleeveTranslate', targetHandle: 'geometry' },
    { source: 'sleeveDrop', sourceHandle: 'value', target: 'sleeveTranslate', targetHandle: 'y' },
    { source: 'sleeveTranslate', sourceHandle: 'geometry', target: 'merge', targetHandle: 'geometries' },
    ...output.edges,
  ],
});
