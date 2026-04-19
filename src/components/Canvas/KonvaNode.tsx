import React from 'react';
import * as ReactKonva from 'react-konva';

interface NodeData {
  className: string;
  attrs?: any;
  children?: NodeData[];
}

interface KonvaNodeProps {
  node: NodeData;
}

/**
 * Recursive component that maps JSON node descriptions to React-Konva components.
 */
export const KonvaNode: React.FC<KonvaNodeProps> = ({ node }) => {
  const { className, attrs, children } = node;

  // Map className to React-Konva component
  // Using any because dynamic lookup in ReactKonva 
  const Component = (ReactKonva as any)[className];

  if (!Component) {
    console.warn(`Unknown Konva component: ${className}`);
    return null;
  }

  return (
    <Component {...attrs}>
      {children?.map((child, index) => (
        <KonvaNode key={child.attrs?.id || `${className}-child-${index}`} node={child} />
      ))}
    </Component>
  );
};
