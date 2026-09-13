import { useCallback, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import './nodes/definitions';
import { NodeEditor } from './editor/NodeEditor';
import { Scene } from './scene/Scene';
import { useEvaluatedGraph } from './state/useEvaluatedGraph';
import { useRootEvaluatedGraph } from './state/useRootEvaluatedGraph';
import { useParentScopeEvaluatedGraph } from './state/useParentScopeEvaluatedGraph';

const MIN_PANEL_RATIO = 0.2;
const MAX_PANEL_RATIO = 0.8;
const DIVIDER_WIDTH = 6;

function App() {
  const { evaluationCount } = useEvaluatedGraph();
  useRootEvaluatedGraph();
  useParentScopeEvaluatedGraph();
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftRatio, setLeftRatio] = useState(0.45);

  const handleDividerMouseDown = useCallback((event: ReactMouseEvent) => {
    event.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const ratio = (moveEvent.clientX - rect.left) / rect.width;
      setLeftRatio(Math.min(MAX_PANEL_RATIO, Math.max(MIN_PANEL_RATIO, ratio)));
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
      <div style={{ flex: `${leftRatio} 0 0`, height: '100%', minWidth: 0 }}>
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
      <div style={{ flex: `${1 - leftRatio} 0 0`, height: '100%', position: 'relative', minWidth: 0 }}>
        <Scene />
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
          evaluations: {evaluationCount}
        </div>
      </div>
    </div>
  );
}

export default App;
