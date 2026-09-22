import { getNodeEvalCacheStats } from './nodes/evaluateGraph';
import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import './nodes/definitions';
import { NodeEditor } from './editor/NodeEditor';
import { Scene } from './scene/Scene';
import { ViewIndicator } from './scene/ViewIndicator';
import { SceneOutputPanel } from './scene/SceneOutputPanel';
import { useEvaluatedGraph } from './state/useEvaluatedGraph';
import { useRootEvaluatedGraph } from './state/useRootEvaluatedGraph';

// シーン側はノードエディタをなるべく広く使うため、ウィンドウ幅に比例する割合ではなく
// 固定 px 幅にする(ウィンドウを広げてもシーン側は必要最小限のまま、余りは全てノード
// エディタへ回る)。ドラッグでの微調整用に下限/上限だけ設ける。
const MIN_SCENE_WIDTH = 240;
const MAX_SCENE_WIDTH = 900;
const DEFAULT_SCENE_WIDTH = 420;
const DIVIDER_WIDTH = 6;

function App() {
  const { evaluationCount } = useEvaluatedGraph();
  const cacheStats = getNodeEvalCacheStats();
  useRootEvaluatedGraph();
  const containerRef = useRef<HTMLDivElement>(null);
  const [sceneWidth, setSceneWidth] = useState(DEFAULT_SCENE_WIDTH);

  const handleDividerMouseDown = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const width = rect.right - moveEvent.clientX;
      setSceneWidth(Math.min(MAX_SCENE_WIDTH, Math.max(MIN_SCENE_WIDTH, width)));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ flex: '1 1 auto', height: '100%', minWidth: 0 }}>
        <NodeEditor />
      </div>
      <div
        onMouseDown={handleDividerMouseDown}
        style={{
          flex: `0 0 ${DIVIDER_WIDTH}px`,
          height: '100%',
          cursor: 'col-resize',
          background: '#ccc',
        }}
      />
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
