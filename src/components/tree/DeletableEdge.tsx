"use client";

import { memo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

interface DeletableEdgeData {
  onDelete?: (edgeId: string, targetId: string) => void;
  animated?: boolean;
}

function DeletableEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const edgeData = data as DeletableEdgeData | undefined;
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Extract target ID from edge ID (format: e-{parent}-{target})
  const targetId = id.split("-").pop() || "";

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: "pointer" }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: isHovered ? "#ef4444" : edgeData?.animated ? "#f59e0b" : "#6b7280",
          strokeWidth: isHovered ? 3 : 2,
          transition: "stroke 0.15s, stroke-width 0.15s",
        }}
      />
      {/* Delete button - shows on hover */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              edgeData?.onDelete?.(id, targetId);
            }}
            className={`
              w-5 h-5 rounded-full bg-red-500 hover:bg-red-600
              text-white text-xs font-bold
              flex items-center justify-center
              shadow-md border-2 border-white
              transition-all duration-150
              cursor-pointer
              ${isHovered || selected ? "opacity-100 scale-100" : "opacity-0 scale-75"}
            `}
            title="Remove connection"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const DeletableEdge = memo(DeletableEdgeComponent);
