"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CardType = "interview" | "opportunity";

interface AddCardButtonProps {
  columnId: string;
  columnTitle: string;
  onAdd: (data: {
    title: string;
    subtitle?: string;
    status: string;
    type: CardType;
  }) => Promise<void>;
  allowedTypes?: CardType[];
}

export function AddCardButton({
  columnId,
  columnTitle,
  onAdd,
  allowedTypes = ["interview", "opportunity"],
}: AddCardButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [type, setType] = useState<CardType>(allowedTypes[0]);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return;

    setIsAdding(true);
    try {
      await onAdd({
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        status: columnId,
        type,
      });
      setTitle("");
      setSubtitle("");
      setType(allowedTypes[0]);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add card:", error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-2 text-[11px] uppercase tracking-wider text-landing-stone hover:text-landing-charcoal hover:bg-white/50 rounded-lg transition-all duration-200 border-2 border-dashed border-landing-charcoal/10 hover:border-landing-charcoal/20"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add Card
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add to {columnTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {allowedTypes.length > 1 && (
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-2">
                  {allowedTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`flex-1 py-2 px-3 rounded-lg text-[11px] uppercase tracking-wider font-medium transition-all ${
                        type === t
                          ? t === "interview"
                            ? "bg-landing-terracotta text-white"
                            : "bg-landing-forest text-white"
                          : "bg-landing-charcoal/5 text-landing-stone hover:bg-landing-charcoal/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="add-title">
                {type === "interview" ? "Participant Name" : "Opportunity Title"}
              </Label>
              <Input
                id="add-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "interview"
                    ? "Enter participant name..."
                    : "Enter opportunity title..."
                }
                maxLength={200}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-subtitle">
                Description <span className="text-landing-stone">(optional)</span>
              </Label>
              <Textarea
                id="add-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Add a description..."
                rows={2}
                maxLength={500}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={isAdding || !title.trim()}
              className={
                type === "interview"
                  ? "bg-landing-terracotta hover:bg-landing-terracotta/90"
                  : "bg-landing-forest hover:bg-landing-forest-light"
              }
            >
              {isAdding ? "Adding..." : `Add ${type}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
