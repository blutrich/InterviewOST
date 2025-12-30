"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanCardData } from "./KanbanCard";

interface EditCardModalProps {
  card: KanbanCardData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: KanbanCardData) => Promise<void>;
  onDelete?: (cardId: string) => Promise<void>;
  columns: { id: string; title: string }[];
}

export function EditCardModal({
  card,
  isOpen,
  onClose,
  onSave,
  onDelete,
  columns,
}: EditCardModalProps) {
  const [title, setTitle] = useState(card?.title || "");
  const [subtitle, setSubtitle] = useState(card?.subtitle || "");
  const [status, setStatus] = useState(card?.status || columns[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update form when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setSubtitle(card.subtitle || "");
      setStatus(card.status);
    }
  }, [card]);

  const handleSave = async () => {
    if (!card || !title.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        ...card,
        title: title.trim(),
        subtitle: subtitle.trim(),
        status,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save card:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!card || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(card.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error("Failed to delete card:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!card) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span
              className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-full ${
                card.type === "interview"
                  ? "bg-landing-terracotta/10 text-landing-terracotta"
                  : "bg-landing-forest/10 text-landing-forest"
              }`}
            >
              {card.type}
            </span>
            Edit {card.type === "interview" ? "Interview" : "Opportunity"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                card.type === "interview"
                  ? "Participant name"
                  : "Opportunity title"
              }
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Description</Label>
            <Textarea
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {card.metadata && (
            <div className="pt-4 border-t border-landing-charcoal/10">
              <p className="text-[11px] uppercase tracking-wider text-landing-stone mb-2">
                Metadata
              </p>
              <div className="text-sm text-landing-stone space-y-1">
                {card.metadata.date && <p>Created: {card.metadata.date}</p>}
                {card.metadata.evidenceCount !== undefined && (
                  <p>Evidence: {card.metadata.evidenceCount} items</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || isSaving}
                size="sm"
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="bg-landing-forest hover:bg-landing-forest-light"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {card.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{card.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
