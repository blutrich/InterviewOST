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
import { EvidencePanel } from "./EvidencePanel";
import { Button } from "@/components/ui/button";

interface Opportunity {
  id: string;
  title: string;
  description?: string;
  type: "outcome" | "opportunity" | "solution";
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

  const handleNodeSelect = useCallback((id: string) => {
    const opp = opportunities.find((o) => o.id === id);
    setSelectedOpportunity(opp || null);
    onNodeSelect?.(opp || null);
  }, [opportunities, onNodeSelect]);

  // Define node types with useMemo to prevent recreation
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      opportunity: OpportunityNode as unknown as NodeTypes[string],
    }),
    []
  );


  // Convert opportunities to React Flow nodes
  const buildNodes = useCallback((): Node[] => {
    const nodes: Node[] = opportunities.map((opp, index) => ({
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
    if (rootOutcome && !opportunities.some((o) => o.type === "outcome")) {
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
  }, [opportunities, rootOutcome, handleNodeSelect, onNodeDelete, onAddChild, onTitleChange]);

  // Convert parent relationships to edges
  const buildEdges = useCallback((): Edge[] => {
    return opportunities
      .filter((opp) => opp.parent_id)
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
  }, [opportunities]);

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  // Update nodes when opportunities change
  useEffect(() => {
    setNodes(buildNodes());
    setEdges(buildEdges());
  }, [opportunities, rootOutcome, buildNodes, buildEdges, setNodes, setEdges]);

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
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as OpportunityNodeData;
            switch (data?.type) {
              case "outcome":
                return "#a855f7"; // purple
              case "opportunity":
                return "#f59e0b"; // amber
              case "solution":
                return "#22c55e"; // green
              default:
                return "#6b7280";
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md">
        <p className="text-xs font-medium text-gray-500 mb-2">Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span>Outcome (Root)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span>Opportunity</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Solution</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 border-t pt-2">
          Click a line to disconnect
        </p>
      </div>

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

      {/* Evidence panel */}
      {showEvidence && selectedOpportunity && (
        <div className="absolute top-4 left-4">
          <EvidencePanel
            opportunityTitle={selectedOpportunity.title}
            evidence={selectedOpportunity.evidence || []}
            onClose={() => setShowEvidence(false)}
          />
        </div>
      )}
    </div>
  );
}
