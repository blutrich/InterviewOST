"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface Interview {
  id: string;
  participant_name: string | null;
  status: string;
  created_at: string;
  snapshot_status?: string;
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
  opportunities,
  interviews = [],
}: OSTCanvasWrapperProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addType, setAddType] = useState<"opportunity" | "solution">("opportunity");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedInterviewIds, setSelectedInterviewIds] = useState<string[]>([]);

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
        toast.success("Deleted successfully");
        router.refresh();
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
      await fetch("/api/opportunities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          projectId,
          title: newTitle,
        }),
      });
      router.refresh();
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
        toast.success("Connection removed");
        router.refresh();
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
      const parent = opportunities.find((o) => o.id === addParentId);
      const parentPos = parent?.position || { x: 400, y: 150 };
      const childrenCount = opportunities.filter((o) => o.parent_id === addParentId).length;

      const res = await fetch("/api/opportunities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          parentId: addParentId,
          title: newTitle,
          description: newDescription,
          type: addType,
          status: "approved",
          position: {
            x: parentPos.x + (childrenCount * 50) - 25,
            y: parentPos.y + 180,
          },
        }),
      });

      if (res.ok) {
        toast.success(`${addType === "solution" ? "Solution" : "Opportunity"} created`);
        router.refresh();
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

      {/* OST Canvas */}
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
