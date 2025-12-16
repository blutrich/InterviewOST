"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export interface OpportunityNodeData {
  [key: string]: unknown;
  id: string;
  title: string;
  description?: string;
  type: "outcome" | "opportunity" | "solution" | "unmet_need" | "workaround";
  status: "suggested" | "approved" | "rejected" | "merged";
  evidenceCount: number;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddChild?: (id: string, type: "opportunity" | "solution") => void;
  onTitleChange?: (id: string, newTitle: string) => void;
}

interface OpportunityNodeProps {
  data: OpportunityNodeData;
  selected?: boolean;
}

function OpportunityNodeComponent({ data, selected }: OpportunityNodeProps) {
  const nodeData = data;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(nodeData.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // FigJam-style - white background with colored border
  const getCardStyle = () => {
    switch (nodeData.type) {
      case "outcome":
        return "bg-white border-purple-500 border-l-4";
      case "opportunity":
      case "unmet_need":
        return "bg-white border-amber-500 border-l-4";
      case "workaround":
        return "bg-white border-blue-500 border-l-4";
      case "solution":
        return "bg-white border-green-500 border-l-4";
      default:
        return "bg-white border-gray-300 border-l-4";
    }
  };

  const getLabelColor = () => {
    switch (nodeData.type) {
      case "outcome":
        return "text-purple-600";
      case "opportunity":
      case "unmet_need":
        return "text-amber-600";
      case "workaround":
        return "text-blue-600";
      case "solution":
        return "text-green-600";
      default:
        return "text-gray-500";
    }
  };

  const getTypeLabel = () => {
    switch (nodeData.type) {
      case "outcome":
        return "OUTCOME";
      case "opportunity":
        return "OPPORTUNITY";
      case "unmet_need":
        return "UNMET NEED";
      case "workaround":
        return "WORKAROUND";
      case "solution":
        return "SOLUTION";
      default:
        return "";
    }
  };

  // Helper to check if this node can have children
  const canAddOpportunity = nodeData.type !== "solution";
  const canAddSolution = nodeData.type === "opportunity" || nodeData.type === "unmet_need" || nodeData.type === "workaround";

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.type !== "outcome") {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle !== nodeData.title) {
      nodeData.onTitleChange?.(nodeData.id, editTitle.trim());
    } else {
      setEditTitle(nodeData.title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditTitle(nodeData.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`
        group relative
        w-[220px] rounded-xl border-2 p-4 shadow-lg
        transition-all duration-200 cursor-pointer
        ${getCardStyle()}
        ${selected ? "ring-4 ring-offset-2 ring-blue-500 scale-105" : "hover:shadow-xl hover:scale-102"}
      `}
      onClick={() => nodeData.onSelect?.(nodeData.id)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-white !border-2 !border-gray-400 !w-3 !h-3"
      />

      {/* Type label */}
      <div className={`text-[10px] font-bold tracking-wider mb-2 ${getLabelColor()}`}>
        {getTypeLabel()}
      </div>

      {/* Title - editable */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full bg-white/90 text-gray-900 rounded px-2 py-1 text-sm font-medium outline-none"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <h3 className="font-semibold text-sm leading-tight text-gray-900">
          {nodeData.title}
        </h3>
      )}

      {/* Evidence count */}
      {nodeData.evidenceCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span>{nodeData.evidenceCount} mentions</span>
        </div>
      )}

      {/* Action buttons - positioned to the right side to not block connections */}
      <div className={`
        absolute -right-10 top-1/2 transform -translate-y-1/2
        flex flex-col items-center gap-1 bg-white rounded-lg shadow-md px-1 py-1 border
        transition-opacity duration-200
        ${selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
      `}>
        {/* Add Opportunity - amber/orange button */}
        {canAddOpportunity && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onAddChild?.(nodeData.id, "opportunity");
            }}
            className="w-5 h-5 flex items-center justify-center rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm"
            title="Add Opportunity"
          >
            +
          </button>
        )}
        {/* Add Solution - green button */}
        {canAddSolution && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onAddChild?.(nodeData.id, "solution");
            }}
            className="w-5 h-5 flex items-center justify-center rounded bg-green-500 hover:bg-green-600 text-white font-bold text-xs shadow-sm"
            title="Add Solution"
          >
            +
          </button>
        )}
        {/* Delete - red button */}
        {nodeData.type !== "outcome" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              nodeData.onDelete?.(nodeData.id);
            }}
            className="w-5 h-5 flex items-center justify-center rounded bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-sm"
            title="Delete"
          >
            ×
          </button>
        )}
      </div>

      {/* Source handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-3 !h-3"
      />
    </div>
  );
}

export const OpportunityNode = memo(OpportunityNodeComponent);
