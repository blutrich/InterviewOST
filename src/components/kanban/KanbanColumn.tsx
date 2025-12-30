"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard, KanbanCardData } from "./KanbanCard";
import { AddCardButton } from "./AddCardButton";
import { cn } from "@/lib/utils";

type CardType = "interview" | "opportunity";

interface KanbanColumnProps {
  id: string;
  title: string;
  cards: KanbanCardData[];
  color?: string;
  onCardClick?: (card: KanbanCardData) => void;
  onAddCard?: (data: {
    title: string;
    subtitle?: string;
    status: string;
    type: CardType;
  }) => Promise<void>;
  allowedCardTypes?: CardType[];
  showAddButton?: boolean;
}

const columnColors: Record<string, { bg: string; accent: string; count: string }> = {
  pending: {
    bg: "bg-landing-stone/5",
    accent: "bg-landing-stone",
    count: "bg-landing-stone/10 text-landing-stone",
  },
  active: {
    bg: "bg-landing-terracotta/5",
    accent: "bg-landing-terracotta",
    count: "bg-landing-terracotta/10 text-landing-terracotta",
  },
  completed: {
    bg: "bg-landing-forest/5",
    accent: "bg-landing-forest",
    count: "bg-landing-forest/10 text-landing-forest",
  },
  review: {
    bg: "bg-amber-50",
    accent: "bg-amber-500",
    count: "bg-amber-100 text-amber-700",
  },
  discover: {
    bg: "bg-landing-terracotta/5",
    accent: "bg-landing-terracotta",
    count: "bg-landing-terracotta/10 text-landing-terracotta",
  },
  define: {
    bg: "bg-landing-forest/5",
    accent: "bg-landing-forest",
    count: "bg-landing-forest/10 text-landing-forest",
  },
  deliver: {
    bg: "bg-landing-charcoal/5",
    accent: "bg-landing-charcoal",
    count: "bg-landing-charcoal/10 text-landing-charcoal",
  },
};

export function KanbanColumn({
  id,
  title,
  cards,
  color = "pending",
  onCardClick,
  onAddCard,
  allowedCardTypes = ["interview", "opportunity"],
  showAddButton = true,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const colorStyle = columnColors[color] || columnColors.pending;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl min-h-[500px] transition-all duration-200",
        colorStyle.bg,
        isOver && "ring-2 ring-landing-forest/30"
      )}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-landing-charcoal/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-2 h-2 rounded-full", colorStyle.accent)} />
            <h3 className="text-[12px] uppercase tracking-[0.15em] font-medium text-landing-charcoal">
              {title}
            </h3>
          </div>
          <span
            className={cn(
              "text-[11px] font-medium px-2 py-0.5 rounded-full",
              colorStyle.count
            )}
          >
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-3 overflow-y-auto"
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onClick={onCardClick} />
          ))}
        </SortableContext>

        {cards.length === 0 && !showAddButton && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-landing-charcoal/10 rounded-xl">
            <p className="text-[11px] uppercase tracking-wider text-landing-stone/50">
              Drop items here
            </p>
          </div>
        )}

        {/* Add Card Button */}
        {showAddButton && onAddCard && (
          <AddCardButton
            columnId={id}
            columnTitle={title}
            onAdd={onAddCard}
            allowedTypes={allowedCardTypes}
          />
        )}
      </div>
    </div>
  );
}
