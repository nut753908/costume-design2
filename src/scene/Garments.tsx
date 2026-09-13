import type * as THREE from 'three';
import { useGraphStore } from '../state/graphStore';
import { useRootGraphLite } from '../state/selectors';
import { ToonMesh } from '../rendering/ToonMesh';
import type { SocketValue } from '../nodes/types';

/** ガーメントの取り付け位置(anchor/offsetY)は `nodes/definitions/garmentPlacement.ts` が
 * 評価時にジオメトリの頂点座標へ焼き込み済み(Blender の Geometry Nodes で位置をジオメトリに
 * 焼き込む考え方と同じ、`src/nodes/CLAUDE.md` の「グループノード」節参照)。そのため
 * ここでは常に原点にメッシュを置くだけでよく、`useBodyScale()`/`computeBodyAnchors()` を
 * 呼ぶ必要は無い(以前はここでアンカー座標を計算していたが、責務がガーメント側の
 * ノードグラフへ移った)。 */
export function Garments() {
  // s.nodes ではなく s.rootEvaluatedResults(トップレベル視点で合成した完全なグラフの
  // 評価結果、state/useRootEvaluatedGraph.ts が書き込む)を見る。グループの中に入って
  // いる間も s.nodes は「今開いている階層」の内部ノードだけになるため、s.nodes を
  // 走査する実装だと他の全ガーメントが3Dビューから消えてしまう。
  const evaluated = useGraphStore((s) => s.rootEvaluatedResults);
  // どのノードが `sceneOutput`(ルートスコープの描画用終端ノード)かは rootEvaluatedResults
  // 自体には現れない(nodeId→評価結果の Map でしかなく型情報を持たない)ため、
  // useRootGraphLite() でトップレベル視点のノード一覧を別途引く。
  const { nodes } = useRootGraphLite();

  if (!evaluated) return null;

  const outputNodeIds = new Set(nodes.filter((n) => n.type === 'sceneOutput').map((n) => n.id));

  return (
    <>
      {Array.from(evaluated.entries()).flatMap(([nodeId, result]) => {
        // 描画対象になる経路は2つ、どちらも「明示的にsceneOutputへ配線されているか」という
        // 同じ仕様の2つの現れ方(nodes/definitions/sceneOutput.ts 参照):
        // (1) トップレベルに置いた sceneOutput ノード自身 — geometry/material をそのまま読む。
        // (2) グループの内部に sceneOutput を置いた場合 — groupNodeFactory.ts の evaluate() が
        //     `sceneOutputGeometry`/`sceneOutputMaterial` という予約キーへ転送済みなので、
        //     ノードの型を問わずそのキーの有無だけを見る。通常の `geometry`/`material`
        //     キー(groupOutput から転送される、他ガーメントと共有するための汎用ソケット)
        //     だけを見て自動描画する、という以前の暗黙の検出には戻さない。
        const mesh = outputNodeIds.has(nodeId)
          ? extractMesh(result.geometry, result.material)
          : extractMesh(result.sceneOutputGeometry, result.sceneOutputMaterial);

        return mesh ? [<ToonMesh key={nodeId} geometry={mesh.geometry} material={mesh.material} />] : [];
      })}
    </>
  );
}

function extractMesh(
  geometry: SocketValue | undefined,
  material: SocketValue | undefined,
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (!geometry || geometry.type !== 'geometry' || !material || material.type !== 'material') return null;
  return { geometry: geometry.value, material: material.value };
}
