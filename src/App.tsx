import { getNodeEvalCacheStats } from './nodes/evaluateGraph';
import { useEffect, useState } from 'react';
import './nodes/definitions';
import { NodeEditor } from './editor/NodeEditor';
import { Scene } from './scene/Scene';
import { ViewIndicator } from './scene/ViewIndicator';
import { SceneOutputPanel } from './scene/SceneOutputPanel';
import { useEvaluatedGraph } from './state/useEvaluatedGraph';
import { useRootEvaluatedGraph } from './state/useRootEvaluatedGraph';

// シーン側はノードエディタをなるべく広く使うため、「重ならない必要最小限」の幅を
// ウィンドウ**高さ**から自動計算する(手動ドラッグでの調整は無し)。Scene.tsx のカメラは
// 垂直FOV固定(40°)・注視点原点中心のため、マネキンの描画上の見かけの半幅(キャンバス
// 水平中心からの距離、px)はウィンドウ高さにのみ比例し、シーン幅には依存しない。一方
// SceneOutputPanel は右端からの距離が常に一定(right:12、実測幅178px、デフォルトグラフの
// 全15行表示時)なので、ウィンドウが高いほどマネキンが大きく描画され、同じシーン幅でも
// 重なりやすくなる。
//
// 実測(`.claude/skills/run-costume-design2` のドライバでウィンドウ高さ 800〜1400px を
// スクリーンショットしPNGを解析、シーン幅760px固定で測定): マネキン右端(キャンバス左端
// 基準)= シーン幅/2 + 0.16 * ウィンドウ高さ(誤差無く線形)。SceneOutputPanel 左端 =
// シーン幅 - 12 - 178。両者の間にマージン M(px)を残すために必要な最小シーン幅は
//   シーン幅 >= 2 * (0.16 * ウィンドウ高さ + M + 12 + 178)
//            = 0.32 * ウィンドウ高さ + 2M + 380
// M=30px として計算した式が下記(SCENE_WIDTH_BASE = 2*30 + 380 = 440)。
const SCENE_WIDTH_HEIGHT_FACTOR = 0.32;
const SCENE_WIDTH_BASE = 440;
const MIN_SCENE_WIDTH = 240;
// 4K縦長モニタ等、極端に高いウィンドウでは式の値がこの上限を超え、余白が計算どおりには
// 保証されなくなる(その場合はシーン側が必要以上に広がるより、多少の重なりを許容する方を
// 優先する判断)。
const MAX_SCENE_WIDTH = 1000;
const DIVIDER_WIDTH = 6;

function computeSceneWidth(windowHeight: number): number {
  const width = SCENE_WIDTH_HEIGHT_FACTOR * windowHeight + SCENE_WIDTH_BASE;
  return Math.min(MAX_SCENE_WIDTH, Math.max(MIN_SCENE_WIDTH, width));
}

function App() {
  const { evaluationCount } = useEvaluatedGraph();
  const cacheStats = getNodeEvalCacheStats();
  useRootEvaluatedGraph();
  const [sceneWidth, setSceneWidth] = useState(() => computeSceneWidth(window.innerHeight));

  useEffect(() => {
    const handleResize = () => setSceneWidth(computeSceneWidth(window.innerHeight));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ flex: '1 1 auto', height: '100%', minWidth: 0 }}>
        <NodeEditor />
      </div>
      <div style={{ flex: `0 0 ${DIVIDER_WIDTH}px`, height: '100%', background: '#ccc' }} />
      {/* flex-shrink:0 だけでは不十分: 既定の min-width:auto は子要素(3Dビューの
          <canvas> が持つ固定px幅)のコンテンツ最小サイズを下回れないため、それを
          明示的に上書きしないと flex-basis を縮めても実際の描画幅が縮まない
          (flexbox の min-width:auto がハマりやすい落とし穴)。 */}
      <div style={{ flex: `0 0 ${sceneWidth}px`, height: '100%', position: 'relative', minWidth: 0 }}>
        <Scene />
        <ViewIndicator />
        <SceneOutputPanel />
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            fontFamily: 'ui-monospace, Consolas, monospace',
            fontSize: 11,
            opacity: 0.5,
          }}
        >
          evaluations: {evaluationCount} · node cache: {cacheStats.hits} hit / {cacheStats.misses} miss
        </div>
      </div>
    </div>
  );
}

export default App;
