import { defineGroupNode } from '../groupNodeFactory';
import { latheBody } from '../garmentParts';
import { anchorYSocket, colorSocket, garmentOutput } from '../garmentOutput';

/** hat は bodyBuild によるスケーリング対象外(headRadius が `bodyDimensionsGroup` の中で
 * buildScale の影響を受けないため)なので Body Build 入力は無い。頭に被さるつばの半径は、
 * 頭半径(`bodyDimensions.headRadius`、bodyGroup の頭と同じ値)に Brim Ratio を掛けて
 * 求める(`brimRadiusCalc`)ため、頭の大きさを変えるとつばも追従する。
 * profile(easedLatheCurve)+hatGen(latheGenerator)+hatMaterial(toonMaterial)+
 * placement(garmentPlacement)+sceneOut(sceneOutput) を1枚に
 * まとめる。Brim Ratio/Crown Radius/Height は他のガーメントと共有されない単独
 * パラメータのため、numberInput/colorInput ノードは置かず、各ノードの入力欄の値として持つ。
 * Head Radius と Anchor Y(取り付け位置、ルートの `bodyLayout` 共有ノードから
 * 配線される headCenterY)は外部ソケット。
 *
 * head は左右対称な単一パーツなので `mirrorPair` は挟まない。hat は shoes/socks と同じ
 * `direction: 'up'`(つばから上=クラウン側へ伸びる)。 */
const output = garmentOutput({ offsetY: 0.1, geometry: 'gen' });

const lathe = latheBody({ genId: 'gen', direction: 'up', steps: 10, startRadius: 'brimRadiusCalc', endRadius: 0.02, distance: 0.35, segments: 20 });

defineGroupNode({
  type: 'hatGroup',
  label: 'Hat',
  paletteSection: 'garment',
  internalNodes: [
    {
      id: 'input',
      type: 'groupInput',
      data: {
        sockets: [
          { id: 'headRadius', label: 'Head Radius', type: 'number', default: 0.28 },
          anchorYSocket,
          colorSocket('#4a3b6b'),
        ],
      },
    },
    { id: 'brimRadiusCalc', type: 'numberMultiply', data: { factor: 1.25 } },
    ...lathe.nodes,
    ...output.nodes,
  ],
  internalEdges: [
    { source: 'input', sourceHandle: 'headRadius', target: 'brimRadiusCalc', targetHandle: 'value' },
    ...lathe.edges,
    ...output.edges,
  ],
});
