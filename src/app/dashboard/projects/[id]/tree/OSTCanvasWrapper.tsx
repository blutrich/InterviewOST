"use client";

import { useState, useCallback, useEffect } from "react";
import { OSTCanvas, InterviewSelector } from "@/components/tree";
import type { Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Interview {
  id: string;
  participant_name: string | null;
  status: string;
  created_at: string;
  snapshot_status?: string;
  messages?: Message[];
}

interface OSTCanvasWrapperProps {
  projectId: string;
  rootOutcome?: string;
  opportunities: Opportunity[];
  interviews?: Interview[];
}

export function OSTCanvasWrapper({
  projectId,
  rootOutcome,
  opportunities: initialOpportunities,
  interviews = [],
}: OSTCanvasWrapperProps) {
  // Use local state to avoid full page refresh
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addType, setAddType] = useState<"opportunity" | "solution">("opportunity");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<string[]>([]);
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  // Get messages from selected interviews
  const selectedMessages = interviews
    .filter((i) => selectedInterviewIds.length === 0 || selectedInterviewIds.includes(i.id))
    .flatMap((i) => (i.messages || []).map((m) => ({
      ...m,
      participant_name: i.participant_name || "Anonymous",
      interview_id: i.id,
    })))
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleNodeUpdate = async (
    id: string,
    position: { x: number; y: number }
  ) => {
    // Save position to database
    try {
      await fetch("/api/opportunities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          projectId,
          position,
        }),
      });
    } catch (error) {
      console.error("Failed to save node position:", error);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/opportunities?id=${deleteTarget}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Update local state instead of full page refresh
        setOpportunities((prev) => prev.filter((o) => o.id !== deleteTarget));
        toast.success("Deleted successfully");
      } else {
        toast.error("Failed to delete");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleAddChild = (parentId: string, type: "opportunity" | "solution") => {
    setAddParentId(parentId);
    setAddType(type);
    setNewTitle("");
    setNewDescription("");
    setAddDialogOpen(true);
  };

  const handleTitleChange = async (id: string, newTitle: string) => {
    try {
      const res = await fetch("/api/opportunities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          projectId,
          title: newTitle,
        }),
      });
      if (res.ok) {
        // Update local state instead of full page refresh
        setOpportunities((prev) =>
          prev.map((o) => (o.id === id ? { ...o, title: newTitle } : o))
        );
      }
    } catch (error) {
      console.error("Failed to update title:", error);
      toast.error("Failed to update title");
    }
  };

  const handleEdgeDelete = async (edge: Edge) => {
    try {
      // The target node is the child - set its parent_id to null
      const childId = edge.target;
      const child = opportunities.find((o) => o.id === childId);

      if (!child) {
        toast.error("Could not find the connected item");
        return;
      }

      const res = await fetch("/api/opportunities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: childId,
          projectId,
          parentId: null, // Disconnect the edge
          title: child.title,
          description: child.description,
          type: child.type,
          status: child.status,
          position: child.position,
        }),
      });

      if (res.ok) {
        // Update local state instead of full page refresh
        setOpportunities((prev) =>
          prev.map((o) => (o.id === childId ? { ...o, parent_id: null } : o))
        );
        toast.success("Connection removed");
      } else {
        toast.error("Failed to remove connection");
      }
    } catch (error) {
      console.error("Edge delete error:", error);
      toast.error("Failed to remove connection");
    }
  };

  const confirmAdd = async () => {
    if (!newTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      // Find parent position to calculate child position
      // Note: "root" is a virtual node ID for the root outcome display
      const isRootParent = addParentId === "root";
      const parent = isRootParent ? null : opportunities.find((o) => o.id === addParentId);
      const parentPos = parent?.position || { x: 400, y: 150 };
      const childrenCount = opportunities.filter((o) =>
        isRootParent ? o.parent_id === null : o.parent_id === addParentId
      ).length;

      const newPosition = {
        x: parentPos.x + (childrenCount * 50) - 25,
        y: parentPos.y + 180,
      };

      // If parent is "root" (virtual node), set parentId to null in database
      const dbParentId = isRootParent ? null : addParentId;

      const res = await fetch("/api/opportunities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          parentId: dbParentId,
          title: newTitle,
          description: newDescription,
          type: addType,
          status: "approved",
          position: newPosition,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Created opportunity:", data.opportunity);
        // Update local state instead of full page refresh to preserve canvas position
        const newOpportunity: Opportunity = {
          id: data.opportunity.id,
          title: newTitle,
          description: newDescription,
          type: addType,
          status: "approved",
          parent_id: dbParentId, // Use null for root parent
          evidence_count: 0,
          position: newPosition,
          evidence: [],
        };
        console.log("Adding to local state:", newOpportunity);
        setOpportunities((prev) => {
          console.log("Previous opportunities:", prev.length);
          const newState = [...prev, newOpportunity];
          console.log("New opportunities:", newState.length);
          return newState;
        });
        toast.success(`${addType === "solution" ? "Solution" : "Opportunity"} created`);
        setAddDialogOpen(false);
      } else {
        toast.error("Failed to create");
      }
    } catch (error) {
      console.error("Add error:", error);
      toast.error("Failed to create");
    } finally {
      setSaving(false);
    }
  };

  const legendItems = [
    { type: "outcome", label: "Outcome", color: "border-purple-500", description: "Business goal - how the company creates value" },
    { type: "opportunity", label: "Opportunity", color: "border-amber-500", description: "Customer need, pain point, or desire" },
    { type: "solution", label: "Solution", color: "border-green-500", description: "Product, feature, or intervention" },
  ];

  return (
    <div className="relative w-full h-full">
      {/* Interview Selector Sidebar */}
      {interviews.length > 0 && (
        <div className="absolute top-4 left-4 z-10 w-64">
          <InterviewSelector
            interviews={interviews}
            selectedIds={selectedInterviewIds}
            onSelectionChange={setSelectedInterviewIds}
          />
        </div>
      )}

      {/* OST Legend */}
      <div className="absolute top-4 right-4 z-10">
        <TooltipProvider>
          <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-landing-charcoal/10 p-3 shadow-lg">
            <p className="text-[10px] uppercase tracking-wider text-landing-stone font-medium mb-2">
              OST Key
            </p>
            <div className="space-y-1.5">
              {legendItems.map((item) => (
                <Tooltip key={item.type}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <div className={`w-3 h-3 rounded-sm bg-white border-l-[3px] ${item.color}`} />
                      <span className="text-xs text-landing-charcoal">{item.label}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px] p-2 bg-landing-charcoal text-white border-0">
                    <p className="text-xs">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <p className="text-[9px] text-landing-stone/60 mt-2 pt-2 border-t border-landing-charcoal/5">
              Click a line to disconnect
            </p>
          </div>
        </TooltipProvider>
      </div>

      {/* OST Canvas */}
      <div className={`transition-all duration-300 ${transcriptOpen ? "h-[60%]" : "h-full"}`}>
        <OSTCanvas
          projectId={projectId}
          rootOutcome={rootOutcome}
          opportunities={opportunities}
          filterByInterviewIds={selectedInterviewIds}
          onNodeUpdate={handleNodeUpdate}
          onNodeDelete={handleDelete}
          onAddChild={handleAddChild}
          onTitleChange={handleTitleChange}
          onEdgeDelete={handleEdgeDelete}
        />
      </div>

      {/* Transcript Toggle Button - compact */}
      <button
        onClick={() => setTranscriptOpen(!transcriptOpen)}
        className={`absolute ${transcriptOpen ? "bottom-[40%]" : "bottom-4"} left-4 z-20 flex items-center gap-1.5 bg-landing-charcoal/90 backdrop-blur-sm text-white px-2.5 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-medium shadow-md hover:bg-landing-charcoal transition-all duration-300`}
        title={`${transcriptOpen ? "Hide" : "Show"} transcript`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span>{selectedMessages.length}</span>
        <svg className={`w-2.5 h-2.5 transition-transform ${transcriptOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>

      {/* Transcript Panel */}
      {transcriptOpen && (
        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-white border-t border-landing-charcoal/10 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-landing-charcoal/5 flex items-center justify-between bg-landing-ivory/50">
            <div className="flex items-center gap-3">
              <p className="text-[11px] uppercase tracking-wider text-landing-stone font-medium">
                Transcript
              </p>
              {/* Interview Quick Selector */}
              <select
                value={selectedInterviewIds.length === 0 ? "all" : selectedInterviewIds.length === 1 ? selectedInterviewIds[0] : "multiple"}
                onChange={(e) => {
                  if (e.target.value === "all") {
                    setSelectedInterviewIds([]);
                  } else if (e.target.value !== "multiple") {
                    setSelectedInterviewIds([e.target.value]);
                  }
                }}
                className="text-xs bg-white border border-landing-charcoal/10 rounded-lg px-2 py-1 text-landing-charcoal focus:outline-none focus:ring-1 focus:ring-landing-forest"
              >
                <option value="all">All Interviews ({interviews.filter(i => i.status === "completed").length})</option>
                {interviews.filter(i => i.status === "completed").map((interview) => (
                  <option key={interview.id} value={interview.id}>
                    {interview.participant_name || "Anonymous"} - {new Date(interview.created_at).toLocaleDateString()}
                  </option>
                ))}
                {selectedInterviewIds.length > 1 && (
                  <option value="multiple" disabled>Multiple selected ({selectedInterviewIds.length})</option>
                )}
              </select>
            </div>
            <span className="text-xs text-landing-stone">
              {selectedMessages.length} message{selectedMessages.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedMessages.length > 0 ? (
              selectedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
                    message.role === "assistant"
                      ? "bg-landing-ivory text-landing-charcoal"
                      : "bg-landing-forest text-white"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] uppercase tracking-wider font-medium ${
                        message.role === "assistant" ? "text-landing-stone" : "text-white/70"
                      }`}>
                        {message.role === "assistant" ? "Interviewer" : message.participant_name}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-landing-stone text-sm">
                {interviews.length > 0
                  ? "Select interviews to view their transcripts"
                  : "No interviews yet"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This will also remove all linked evidence.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {addType === "solution" ? "Solution" : "Opportunity"}
            </DialogTitle>
            <DialogDescription>
              {addType === "solution"
                ? "Add a solution that addresses the parent opportunity."
                : "Add a sub-opportunity or related need."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder={addType === "solution" ? "e.g., Add notification system" : "e.g., User needs faster loading"}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add more details..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAdd} disabled={saving}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
