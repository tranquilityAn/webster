import { useMemo, useRef, useCallback } from 'react';
import { getComputedCanvasState } from '../../../utils/canvasUtils';

interface UseEditorCanvasStateProps {
  snapshot: any;
  commits: any[];
  headNumber: number;
  sendCommit: (changes: any[]) => void;
  selectedId: string | null;
}

export function useEditorCanvasState({ snapshot, commits, headNumber, sendCommit, selectedId }: UseEditorCanvasStateProps) {
  const localPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  // 1. Compute physical state from snapshot + commits up to headNumber
  const visibleCommits = useMemo(() => {
    return commits.filter((c) => c.number <= headNumber);
  }, [commits, headNumber]);

  const computedState = useMemo(() => getComputedCanvasState(snapshot, visibleCommits), [snapshot, visibleCommits]);

  // 2. Compute display state (with optimistic local updates for smooth dragging)
  const displayState = useMemo(() => {
    if (!computedState || localPositions.current.size === 0) return computedState;
    
    const patchLayer = (layer: any): any => ({
      ...layer,
      children: layer.children?.map((child: any) => {
        const override = child.attrs?.id ? localPositions.current.get(child.attrs.id) : undefined;
        return override ? { ...child, attrs: { ...child.attrs, ...override } } : child;
      }),
    });

    return {
      ...computedState,
      children: computedState.children?.map((child: any) =>
        child.className === 'Layer' ? patchLayer(child) : child
      ),
    };
  }, [computedState]);

  // 3. Derived views
  const rootLayers = useMemo(() => 
    computedState?.children?.filter((c: any) => c.className === 'Layer') || [], 
    [computedState]
  );

  const selectedNode = useMemo(() => {
    if (!selectedId || !computedState) return null;
    for (const layer of rootLayers) {
      const found = layer.children?.find((c: any) => c.attrs?.id === selectedId);
      if (found) return found;
    }
    return null;
  }, [selectedId, rootLayers, computedState]);

  // 4. Change handler
  const handleNodeChange = useCallback((nodeId: string, attrs: any) => {
    // Optimistic local update for performance
    if (attrs.x !== undefined || attrs.y !== undefined) {
      localPositions.current.set(nodeId, { x: attrs.x ?? 0, y: attrs.y ?? 0 });
    }
    
    sendCommit([{ op: 'update', id: nodeId, props: attrs }]);

    // Clean up local override after some time to let WebSocket state settle
    setTimeout(() => {
      localPositions.current.delete(nodeId);
    }, 500);
  }, [sendCommit]);

  return {
    computedState,
    displayState,
    rootLayers,
    selectedNode,
    handleNodeChange,
  };
}
