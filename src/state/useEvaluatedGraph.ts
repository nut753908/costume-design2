import { useEffect, useMemo, useRef } from 'react';
import { useGraphStore } from './graphStore';
import { useEdgesLite, useNodesLite } from './selectors';
import { evaluateGraph, type EvaluatedGraph } from '../nodes/evaluateGraph';

export function useEvaluatedGraph(): { evaluated: EvaluatedGraph; evaluationCount: number } {
  const nodesLite = useNodesLite();
  const edgesLite = useEdgesLite();
  const setEvaluatedResults = useGraphStore((s) => s.setEvaluatedResults);
  const evaluationCountRef = useRef(0);

  const evaluated = useMemo(() => {
    evaluationCountRef.current += 1;
    return evaluateGraph(nodesLite, edgesLite);
  }, [nodesLite, edgesLite]);

  useEffect(() => {
    setEvaluatedResults(evaluated);
  }, [evaluated, setEvaluatedResults]);

  return { evaluated, evaluationCount: evaluationCountRef.current };
}
