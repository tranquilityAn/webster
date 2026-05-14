import React, { useEffect, useState } from 'react';
import * as ReactKonva from 'react-konva';

// ── KonvaImageNode ─────────────────────────────────────────────────────────
// react-konva Image requires an HTMLImageElement, not a URL string.
// This wrapper loads the image and passes the element once ready.

interface KonvaImageNodeProps {
  attrs: any;
  draggable?: boolean;
  onSelect?: (id: string) => void;
  onChange?: (id: string, newProps: any) => void;
  onDblClick?: (id: string) => void;
  onDragMove?: (id: string, node: any) => void;
  onDragEndCallback?: (id: string) => void;
}

const KonvaImageNode: React.FC<KonvaImageNodeProps> = ({
  attrs, draggable, onSelect, onChange, onDragMove, onDragEndCallback,
}) => {
  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!attrs?.src) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setHtmlImage(img);
    img.onerror = () => {
      // Fallback: if CORS fails (common with direct S3 urls), load without crossOrigin.
      // The canvas will be tainted but at least the image displays perfectly on screen.
      const fallbackImg = new window.Image();
      fallbackImg.onload = () => setHtmlImage(fallbackImg);
      fallbackImg.onerror = () => setHtmlImage(null);
      fallbackImg.src = attrs.src;
    };
    img.src = attrs.src;
  }, [attrs?.src]);

  const handleDragMove = (e: any) => {
    e.cancelBubble = true;
    if (onDragMove && attrs?.id) onDragMove(attrs.id, e.target);
  };

  const handleDragEnd = (e: any) => {
    e.cancelBubble = true;
    if (onDragEndCallback && attrs?.id) onDragEndCallback(attrs.id);
    if (onChange && attrs?.id) onChange(attrs.id, { x: e.target.x(), y: e.target.y() });
  };

  const handleSelect = (e: any) => {
    e.cancelBubble = true;
    if (onSelect && attrs?.id) onSelect(attrs.id);
  };

  const handleTransformEnd = (e: any) => {
    e.cancelBubble = true;
    if (!onChange || !attrs?.id) return;
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    const w = Math.max(5, node.width() * scaleX);
    const h = Math.max(5, node.height() * scaleY);
    node.width(w);
    node.height(h);
    node.getLayer()?.batchDraw();
    onChange(attrs.id, { x: node.x(), y: node.y(), width: w, height: h, scaleX: 1, scaleY: 1, rotation: node.rotation() });
  };

  if (!htmlImage) {
    // Placeholder rectangle while image loads
    return (
      <ReactKonva.Rect
        x={attrs?.x ?? 0}
        y={attrs?.y ?? 0}
        width={attrs?.width ?? 200}
        height={attrs?.height ?? 150}
        fill="#2a2a2a"
        stroke="#444"
        strokeWidth={1}
        dash={[6, 4]}
        opacity={0.7}
        draggable={draggable ?? false}
        onClick={handleSelect}
        onTap={handleSelect}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      />
    );
  }

  return (
    <ReactKonva.Image
      {...attrs}
      image={htmlImage}
      draggable={draggable ?? false}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleSelect}
      onTap={handleSelect}
      onTransformEnd={handleTransformEnd}
    />
  );
};

interface NodeData {
  className: string;
  attrs?: any;
  children?: NodeData[];
}

interface KonvaNodeProps {
  node: NodeData;
  // Only non-layer leaf shapes should receive drag/select props
  isLeaf?: boolean;
  draggable?: boolean;
  onSelect?: (id: string) => void;
  onChange?: (id: string, newProps: any) => void;
  onDblClick?: (id: string) => void;
  editingTextId?: string | null;
  activeTool?: string;
  onDragMove?: (id: string, node: any) => void;
  onDragEndCallback?: (id: string) => void;
}

/**
 * Recursive component that maps JSON node descriptions to React-Konva components.
 *
 * Key design decisions:
 * - draggable is ONLY applied to leaf shapes (not Layer nodes)
 * - attrs are spread AFTER our controlled props so our props win
 * - onDragEnd reports the final position to the parent
 * - onTransformEnd normalises Konva's scaleX/scaleY back into real width/height
 * - onClick/onTap stop propagation so Stage deselect doesn't fire
 */
export const KonvaNode: React.FC<KonvaNodeProps> = ({ 
  node, draggable, onSelect, onChange, onDblClick, 
  editingTextId, activeTool, onDragMove, onDragEndCallback 
}) => {
  const { className, attrs, children } = node;

  // Map className to React-Konva component
  const Component = (ReactKonva as any)[className];

  if (!Component) {
    console.warn(`Unknown Konva component: ${className}`);
    return null;
  }

  // Layers should NEVER be draggable themselves — only their children
  const isLayer = className === 'Layer';

  // Image nodes require special handling: src string → HTMLImageElement
  if (className === 'Image') {
    return (
      <KonvaImageNode
        attrs={attrs}
        draggable={draggable}
        onSelect={onSelect}
        onChange={onChange}
        onDblClick={onDblClick}
        onDragMove={onDragMove}
        onDragEndCallback={onDragEndCallback}
      />
    );
  }

  const handleDragMove = (e: any) => {
    e.cancelBubble = true;
    if (onDragMove && attrs?.id) {
      onDragMove(attrs.id, e.target);
    }
  };

  const handleDragEnd = (e: any) => {
    // Stop event propagation within Konva tree
    e.cancelBubble = true;
    
    if (onDragEndCallback && attrs?.id) {
      onDragEndCallback(attrs.id);
    }

    if (onChange && attrs?.id) {
      onChange(attrs.id, {
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  const handleSelect = (e: any) => {
    // Only cancel bubble if we are not using the text tool, OR if we clicked an existing Text node
    if (activeTool !== 'text' || className === 'Text') {
      e.cancelBubble = true;
    }
    if (onSelect && attrs?.id) {
      onSelect(attrs.id);
    }
  };

  const handleDblClick = (e: any) => {
    e.cancelBubble = true;
    if (onDblClick && attrs?.id) {
      onDblClick(attrs.id);
    }
  };

  /**
    * After a Transformer resize, Konva mutates scaleX / scaleY on the node
    * but keeps width/height at the original value.
    *
    * The canonical approach is to:
    *   1. Read the raw node dimensions and current scale.
    *   2. Compute the real pixel size = dimension × scale.
    *   3. Reset scale to 1 on the node so Konva doesn't double-apply it.
    *   4. Persist { x, y, width, height, scaleX: 1, scaleY: 1 } to the server.
    *
    * This works for Rect, Circle (uses radiusX/radiusY indirectly via width),
    * Text, Image and most other shapes.
    */
  const handleTransformEnd = (e: any) => {
    e.cancelBubble = true;
    if (!onChange || !attrs?.id) return;

    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Normalise: bake the scale back into real dimensions
    let newProps: Record<string, any> = {
      x: node.x(),
      y: node.y(),
      scaleX: 1,
      scaleY: 1,
      rotation: node.rotation(),
    };

    if (className === 'Circle') {
      // Circle uses `radius`; width() returns diameter
      newProps.radius = Math.max(5, (node.radius() * scaleX + node.radius() * scaleY) / 2);
    } else if (className === 'Line' || className === 'Arrow') {
      // For Line/Arrow, we must bake the scale into the points array
      const points = node.points();
      newProps.points = points.map((val: number, i: number) =>
        i % 2 === 0 ? val * scaleX : val * scaleY
      );
    } else {
      newProps.width  = Math.max(5, node.width()  * scaleX);
      newProps.height = Math.max(5, node.height() * scaleY);
    }

    // Reset scale on the live Konva node immediately so it doesn't flicker
    // while the commit round-trips to the server
    node.scaleX(1);
    node.scaleY(1);

    if (className === 'Circle') {
      node.radius(newProps.radius);
    } else if (className === 'Line' || className === 'Arrow') {
      node.points(newProps.points);
    } else {
      node.width(newProps.width);
      node.height(newProps.height);
    }
    node.getLayer()?.batchDraw();

    onChange(attrs.id, newProps);
  };

  if (isLayer) {
    // Layer: render children but don't attach drag/select to the Layer itself
    return (
      <Component {...attrs}>
        {children?.map((child, index) => (
          <KonvaNode
            key={child.attrs?.id || `${className}-child-${index}`}
            node={child}
            draggable={draggable}
            onSelect={onSelect}
            onChange={onChange}
            onDblClick={onDblClick}
            editingTextId={editingTextId}
            activeTool={activeTool}
            onDragMove={onDragMove}
            onDragEndCallback={onDragEndCallback}
          />
        ))}
      </Component>
    );
  }

  // Leaf shape (Rect, Circle, Text, etc.) — spread attrs first, then
  // override with our controlled event props so they always win.
  const isEditingThis = attrs?.id && attrs.id === editingTextId;

  return (
    <Component
      {...attrs}
      visible={!isEditingThis}
      draggable={draggable ?? false}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onClick={handleSelect}
      onTap={handleSelect}
      onDblClick={handleDblClick}
      onTransformEnd={handleTransformEnd}
    >
      {children?.map((child, index) => (
        <KonvaNode
          key={child.attrs?.id || `${className}-child-${index}`}
          node={child}
          draggable={draggable}
          onSelect={onSelect}
          onChange={onChange}
          onDblClick={onDblClick}
          editingTextId={editingTextId}
          activeTool={activeTool}
          onDragMove={onDragMove}
          onDragEndCallback={onDragEndCallback}
        />
      ))}
    </Component>
  );
};
