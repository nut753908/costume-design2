import { defineGroupNode } from '../groupNodeFactory';
import { latheBody } from '../garmentParts';
import { anchorYSocket, garmentOutput } from '../garmentOutput';

/** hat は bodyBuild によるスケーリング対象外(headRadius が `bodyDimensionsGroup` の中で
 * buildScale の影響を受けないため)なので Body Build 入力は無い。頭に被さるつばの半径は、
 * 頭半径(`bodyDimensions.headRadius`、bodyGroup の頭と同じ値)に Brim Ratio を掛けて
 * 求める(`brimRadiusCalc`)ため、頭の大きさを変えるとつばも追従する。
 * profile(easedLatheProfile)+hatGen(latheGenerator)+hatMaterial(toonMaterial)+
 * offsetYIn(numberInput)+placement(garmentPlacement)+sceneOut(sceneOutput) を1枚に
 * まとめる。Brim Ratio/Crown Radius/Height/Color は他のガーメントと共有されない単独
 * パラメータのため、外側の numberInput/colorInput ノードではなくグループ内部の同型ノードと
 * して保持する。Head Radius と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから
 * 配線される headCenterY)は外部ソケット。
 *
 * head は左右対称な単一パーツなので `mirrorPair` は挟まない。hat は shoes/socks と同じ
 * `direction: 'up'`(つばから上=クラウン側へ伸びる)。 */
const output = garmentOutput({ color: '#4a3b6b', offsetY: 0.1, geometry: 'gen' });

const lathe = latheBody({ genId: 'gen', direction: 'up', steps: 10, startRadius: 'brimRadiusCalc', endRadius: 'crownRadiusIn', distance: 'heightIn' });

defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0.16 },
          anchorYSocket,
        ],
      },
    },
    { id: 'brimRatioIn', type: 'numberInput', data: { value: 1.25, min: 1, max: 2, step: 0.01 } },
    { id: 'brimRadiusCalc', type: 'numberMultiply', data: {} },
    { id: 'crownRadiusIn', type: 'numberInput', data: { value: 0.02, min: 0, max: 0.15, step: 0.005 } },
    { id: 'heightIn', type: 'numberInput', data: { value: 0.35, min: 0.1, max: 0.6, step: 0.01 } },
    { id: 'segmentsIn', type: 'numberInput', data: { value: 20, min: 8, max: 32, step: 1 } },
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'headRadius', target: 'brimRadiusCalc', targetHandle: 'value' },
    { source: 'brimRatioIn', sourceHandle: 'value', target: 'brimRadiusCalc', targetHandle: 'factor' },
    ...lathe.edges,
    ...output.edges,
  ],
});
