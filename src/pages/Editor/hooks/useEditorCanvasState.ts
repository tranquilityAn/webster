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
    const finalAttrs = { ...attrs };

    // If rotation is being updated, let's rotate around the center of the bounding box
    if (attrs.rotation !== undefined) {
      const findNode = (layers: any[]): any => {
        for (const layer of layers) {
          const found = layer.children?.find((c: any) => c.attrs?.id === nodeId);
          if (found) return found;
        }
        return null;
      };

      const existingNode = computedState?.children 
        ? findNode(computedState.children.filter((c: any) => c.className === 'Layer'))
        : null;

      if (existingNode && existingNode.className !== 'Circle' && existingNode.className !== 'RegularPolygon' && existingNode.className !== 'Star') {
        const x = existingNode.attrs?.x ?? 0;
        const y = existingNode.attrs?.y ?? 0;
        const w = existingNode.attrs?.width ?? 0;
        const h = existingNode.attrs?.height ?? 0;
        const oldRotDeg = existingNode.attrs?.rotation ?? 0;
        const newRotDeg = attrs.rotation;

        if (w > 0 && h > 0 && oldRotDeg !== newRotDeg) {
          const oldRad = (oldRotDeg * Math.PI) / 180;
          const newRad = (newRotDeg * Math.PI) / 180;

          // 1. Calculate current center (cx, cy) in parent coordinate space
          const cx = x + (w / 2) * Math.cos(oldRad) - (h / 2) * Math.sin(oldRad);
          const cy = y + (w / 2) * Math.sin(oldRad) + (h / 2) * Math.cos(oldRad);

          // 2. Calculate new (x, y) so that the center remains exactly at (cx, cy)
          const newX = cx - (w / 2) * Math.cos(newRad) + (h / 2) * Math.sin(newRad);
          const newY = cy - (w / 2) * Math.sin(newRad) - (h / 2) * Math.cos(newRad);

          finalAttrs.x = Math.round(newX * 100) / 100;
          finalAttrs.y = Math.round(newY * 100) / 100;
        }
      }
    }

    // Optimistic local update for performance
    if (finalAttrs.x !== undefined || finalAttrs.y !== undefined) {
      localPositions.current.set(nodeId, { x: finalAttrs.x ?? 0, y: finalAttrs.y ?? 0 });
    }
    
    sendCommit([{ op: 'update', id: nodeId, props: finalAttrs }]);

    // Clean up local override after some time to let WebSocket state settle
    setTimeout(() => {
      localPositions.current.delete(nodeId);
    }, 500);
  }, [sendCommit, computedState]);

  return {
    computedState,
    displayState,
    rootLayers,
    selectedNode,
    handleNodeChange,
  };
}
