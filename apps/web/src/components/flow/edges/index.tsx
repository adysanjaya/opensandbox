'use client';

import { memo, useCallback } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath, useReactFlow } from '@xyflow/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Custom edge with delete button
export const DeletableEdge = memo((props: EdgeProps) => {
  const { 
    id, 
    sourceX, 
    sourceY, 
    targetX, 
    targetY, 
    sourcePosition, 
    targetPosition,
    selected
  } = props;

  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onDelete = useCallback((evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  }, [id, setEdges]);

  return (
    <>
      <BaseEdge 
        id={id}
        path={edgePath} 
        style={{
          stroke: selected ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))',
          strokeWidth: selected ? 3 : 2,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            zIndex: 1000,
          }}
          className="nodrag nopan"
        >
          {/* Delete Button - visible when edge is selected or on hover */}
          <button
            onClick={onDelete}
            className={`
              w-7 h-7 rounded-full bg-card border border-destructive/50
              flex items-center justify-center
              shadow-md hover:shadow-lg hover:bg-destructive/15 hover:border-destructive hover:scale-110
              transition-all duration-200 ease-out cursor-pointer
              ${selected ? 'opacity-100 scale-100' : 'opacity-0 scale-75 hover:opacity-100'}
            `}
            title="Hapus koneksi"
          >
            <XMarkIcon className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

DeletableEdge.displayName = 'DeletableEdge';

// Export edge types
export const edgeTypes = {
  default: DeletableEdge,
  deletable: DeletableEdge,
};
