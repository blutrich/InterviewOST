"use client";

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface OpportunityNodeData {
  [key: string]: unknown;
  id: string;
  title: string;
  description?: string;
  type: "outcome" | "theme" | "opportunity" | "solution" | "unmet_need" | "workaround";
  status: "suggested" | "approved" | "rejected" | "merged";
  evidenceCount: number;
  /** For theme nodes: distinct interviews supporting the theme (numerator). */
  frequencyN?: number;
  /** For theme nodes: total interviews analyzed (denominator). */
  frequencyM?: number;
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
      case "theme":
        return "bg-white border-rose-500 border-l-4";
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
      case "theme":
        return "text-rose-600";
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
      case "theme":
        return "THEME";
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

  const getTypeTooltip = () => {
    switch (nodeData.type) {
      case "outcome":
        return {
          title: "Outcome",
          description: "The business goal or how the company creates value. This is the root of your tree.",
          example: "e.g., Increase user retention by 20%"
        };
      case "theme":
        return {
          title: "Theme",
          description: "A pattern found across multiple interviews. The top layer of the tree: a finding that groups related opportunities, backed by evidence and a frequency.",
          example: "e.g., Teams stuck on disconnected personal accounts"
        };
      case "opportunity":
        return {
          title: "Opportunity",
          description: "A customer need, pain point, or desire that drives the outcome. Opportunities are discovered through interviews.",
          example: "e.g., Users struggle to find relevant content"
        };
      case "unmet_need":
        return {
          title: "Unmet Need",
          description: "A specific customer need that isn't being addressed by current solutions.",
          example: "e.g., Need to compare options side-by-side"
        };
      case "workaround":
        return {
          title: "Workaround",
          description: "A behavior customers use to compensate for a missing feature or capability.",
          example: "e.g., Exporting to spreadsheets for analysis"
        };
      case "solution":
        return {
          title: "Solution",
          description: "A product, feature, or intervention that addresses an opportunity. Multiple solutions can address one opportunity.",
          example: "e.g., Add recommendation algorithm"
        };
      default:
        return { title: "", description: "", example: "" };
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

      {/* Type label with tooltip */}
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`text-[10px] font-bold tracking-wider mb-2 ${getLabelColor()} cursor-help inline-flex items-center gap-1`}>
              {getTypeLabel()}
              <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[250px] p-3 bg-landing-charcoal text-white border-0">
            <div className="space-y-1.5">
              <p className="font-semibold text-sm">{getTypeTooltip().title}</p>
              <p className="text-xs text-white/80 leading-relaxed">{getTypeTooltip().description}</p>
              <p className="text-xs text-white/60 italic">{getTypeTooltip().example}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

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

      {/* Theme frequency: "N of M interviews" — the cross-interview signal */}
      {nodeData.type === "theme" && (nodeData.frequencyM ?? 0) > 0 ? (
        <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <span>{nodeData.frequencyN ?? 0} of {nodeData.frequencyM} interviews</span>
        </div>
      ) : nodeData.evidenceCount > 0 ? (
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
      ) : null}

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
