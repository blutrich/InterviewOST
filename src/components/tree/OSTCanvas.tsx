"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { OpportunityNode, OpportunityNodeData } from "./OpportunityNode";
import { InterviewSidePanel } from "./InterviewSidePanel";
import { Button } from "@/components/ui/button";

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  type: "outcome" | "opportunity" | "solution" | "unmet_need" | "workaround";
  status: "suggested" | "approved" | "rejected" | "merged";
  parent_id: string | null;
  evidence_count: number;
  position: { x: number; y: number };
  evidence?: Array<{
    id: string;
    quote: string;
    context?: string;
    interview_id: string;
    snapshot_id: string;
    created_at: string;
  }>;
}

interface OSTCanvasProps {
  projectId: string;
  rootOutcome?: string;
  opportunities: Opportunity[];
  filterByInterviewIds?: string[]; // Empty array = show all
  onNodeUpdate?: (id: string, position: { x: number; y: number }) => void;
  onNodeSelect?: (opportunity: Opportunity | null) => void;
  onNodeDelete?: (id: string) => void;
  onAddChild?: (parentId: string, type: "opportunity" | "solution") => void;
  onTitleChange?: (id: string, newTitle: string) => void;
  onEdgeDelete?: (edge: Edge) => void;
}

export function OSTCanvas({
  projectId,
  rootOutcome,
  opportunities,
  filterByInterviewIds = [],
  onNodeUpdate,
  onNodeSelect,
  onNodeDelete,
  onAddChild,
  onTitleChange,
  onEdgeDelete,
}: OSTCanvasProps) {
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);

  // Filter opportunities based on selected interviews
  const filteredOpportunities = useMemo(() => {
    // If no filter (empty array), show all opportunities
    if (filterByInterviewIds.length === 0) {
      return opportunities;
    }

    // Get opportunity IDs that have evidence from selected interviews
    const opportunityIdsWithEvidence = new Set<string>();
    opportunities.forEach((opp) => {
      if (opp.evidence?.some((e) => filterByInterviewIds.includes(e.interview_id))) {
        opportunityIdsWithEvidence.add(opp.id);
      }
    });

    // Also include parent chain to root for filtered opportunities
    const getParentChain = (oppId: string): string[] => {
      const opp = opportunities.find((o) => o.id === oppId);
      if (!opp || !opp.parent_id) return [];
      return [opp.parent_id, ...getParentChain(opp.parent_id)];
    };

    // Collect all opportunity IDs to show (with evidence + their parents)
    const idsToShow = new Set<string>();
    opportunityIdsWithEvidence.forEach((id) => {
      idsToShow.add(id);
      getParentChain(id).forEach((parentId) => idsToShow.add(parentId));
    });

    // Always include root (outcome type with no parent)
    opportunities
      .filter((o) => o.type === "outcome" && !o.parent_id)
      .forEach((o) => idsToShow.add(o.id));

    return opportunities.filter((opp) => idsToShow.has(opp.id));
  }, [opportunities, filterByInterviewIds]);

  const handleNodeSelect = useCallback((id: string) => {
    const opp = filteredOpportunities.find((o) => o.id === id);
    setSelectedOpportunity(opp || null);
    onNodeSelect?.(opp || null);
  }, [filteredOpportunities, onNodeSelect]);

  // Define node types with useMemo to prevent recreation
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      opportunity: OpportunityNode as unknown as NodeTypes[string],
    }),
    []
  );


  // Convert opportunities to React Flow nodes
  const buildNodes = useCallback((): Node[] => {
    const nodes: Node[] = filteredOpportunities.map((opp, index) => ({
      id: opp.id,
      type: "opportunity",
      position: opp.position || { x: 250, y: index * 150 },
      data: {
        id: opp.id,
        title: opp.title,
        description: opp.description,
        type: opp.type,
        status: opp.status,
        evidenceCount: opp.evidence_count || 0,
        onSelect: handleNodeSelect,
        onDelete: onNodeDelete,
        onAddChild: onAddChild,
        onTitleChange: onTitleChange,
      } as OpportunityNodeData,
    }));

    // Add root node if rootOutcome exists and there's no outcome node
    if (rootOutcome && !filteredOpportunities.some((o) => o.type === "outcome")) {
      nodes.unshift({
        id: "root",
        type: "opportunity",
        position: { x: 400, y: 0 },
        data: {
          id: "root",
          title: rootOutcome,
          type: "outcome",
          status: "approved",
          evidenceCount: 0,
          onSelect: handleNodeSelect,
          onDelete: onNodeDelete,
          onAddChild: onAddChild,
          onTitleChange: onTitleChange,
        } as OpportunityNodeData,
      });
    }

    return nodes;
  }, [filteredOpportunities, rootOutcome, handleNodeSelect, onNodeDelete, onAddChild, onTitleChange]);

  // Convert parent relationships to edges
  const buildEdges = useCallback((): Edge[] => {
    // Get IDs of nodes we're showing
    const visibleIds = new Set(filteredOpportunities.map((o) => o.id));

    return filteredOpportunities
      .filter((opp) => opp.parent_id && visibleIds.has(opp.parent_id))
      .map((opp) => ({
        id: `e-${opp.parent_id}-${opp.id}`,
        source: opp.parent_id!,
        target: opp.id,
        type: "smoothstep",
        animated: opp.status === "suggested",
        style: {
          stroke: opp.status === "suggested" ? "#f59e0b" : "#6b7280",
          strokeWidth: 2,
        },
      }));
  }, [filteredOpportunities]);

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  // Update nodes when opportunities or filter changes
  useEffect(() => {
    setNodes(buildNodes());
    setEdges(buildEdges());
  }, [filteredOpportunities, rootOutcome, buildNodes, buildEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeUpdate?.(node.id, node.position);
    },
    [onNodeUpdate]
  );

  // Track selected edge for deletion confirmation
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Handle edge click - show confirmation
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedEdge(edge);
    },
    []
  );

  const confirmEdgeDelete = useCallback(() => {
    if (selectedEdge) {
      onEdgeDelete?.(selectedEdge);
      setSelectedEdge(null);
    }
  }, [selectedEdge, onEdgeDelete]);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        edgesReconnectable={false}
        defaultEdgeOptions={{
          style: { cursor: "pointer" },
        }}
        className="[&_.react-flow__edge:hover_.react-flow__edge-path]:stroke-red-400 [&_.react-flow__edge:hover_.react-flow__edge-path]:stroke-[3px]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls position="bottom-right" className="!bottom-14 !right-4" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as OpportunityNodeData;
            switch (data?.type) {
              case "outcome":
                return "#a855f7"; // purple
              case "opportunity":
              case "unmet_need":
                return "#f59e0b"; // amber
              case "workaround":
                return "#3b82f6"; // blue
              case "solution":
                return "#22c55e"; // green
              default:
                return "#6b7280";
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>


      {/* Edge delete confirmation popup */}
      {selectedEdge && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-lg border-2 border-red-200 flex items-center gap-3">
          <span className="text-sm">Remove this connection?</span>
          <button
            onClick={confirmEdgeDelete}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded font-medium"
          >
            Remove
          </button>
          <button
            onClick={() => setSelectedEdge(null)}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Selected node actions */}
      {selectedOpportunity && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md w-72">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-medium text-sm">{selectedOpportunity.title}</h3>
              <p className="text-xs text-gray-500 capitalize">
                {selectedOpportunity.type}
              </p>
            </div>
            <button
              onClick={() => setSelectedOpportunity(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {selectedOpportunity.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              {selectedOpportunity.description}
            </p>
          )}

          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => setShowEvidence(true)}
            >
              View Evidence ({selectedOpportunity.evidence_count || 0})
            </Button>
            {selectedOpportunity.status === "suggested" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs border-red-300 text-red-600"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interview Side Panel */}
      <InterviewSidePanel
        opportunityTitle={selectedOpportunity?.title || ""}
        evidence={selectedOpportunity?.evidence || []}
        isOpen={showEvidence}
        onClose={() => setShowEvidence(false)}
      />
    </div>
  );
}
