"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard, KanbanCardData } from "./KanbanCard";

export interface ColumnConfig {
  id: string;
  title: string;
  color?: string;
}

type CardType = "interview" | "opportunity";

interface KanbanBoardProps {
  columns: ColumnConfig[];
  initialCards: KanbanCardData[];
  onCardMove?: (cardId: string, newStatus: string) => Promise<void>;
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

export function KanbanBoard({
  columns,
  initialCards,
  onCardMove,
  onCardClick,
  onAddCard,
  allowedCardTypes = ["interview", "opportunity"],
  showAddButton = true,
}: KanbanBoardProps) {
  const [cards, setCards] = useState<KanbanCardData[]>(initialCards);
  const [activeCard, setActiveCard] = useState<KanbanCardData | null>(null);
  const [mounted, setMounted] = useState(false);

  // Only render DndContext on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update cards when initialCards changes (e.g., switching tabs)
  useEffect(() => {
    setCards(initialCards);
  }, [initialCards]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getCardsByColumn = useCallback(
    (columnId: string) => {
      return cards.filter((card) => card.status === columnId);
    },
    [cards]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = cards.find((c) => c.id === active.id);
    if (card) {
      setActiveCard(card);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = cards.find((c) => c.id === activeId);
    const overCard = cards.find((c) => c.id === overId);

    if (!activeCard) return;

    // Dropping over a column
    if (columns.some((col) => col.id === overId)) {
      if (activeCard.status !== overId) {
        setCards((prev) =>
          prev.map((card) =>
            card.id === activeId ? { ...card, status: overId } : card
          )
        );
      }
      return;
    }

    // Dropping over another card
    if (overCard && activeCard.status !== overCard.status) {
      setCards((prev) =>
        prev.map((card) =>
          card.id === activeId ? { ...card, status: overCard.status } : card
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = cards.find((c) => c.id === activeId);
    if (!activeCard) return;

    // Determine the target column
    let targetColumn = overId;
    const overCard = cards.find((c) => c.id === overId);
    if (overCard) {
      targetColumn = overCard.status;
    }

    // Reorder within the same column
    if (activeCard.status === targetColumn && overCard) {
      const columnCards = getCardsByColumn(targetColumn);
      const oldIndex = columnCards.findIndex((c) => c.id === activeId);
      const newIndex = columnCards.findIndex((c) => c.id === overId);

      if (oldIndex !== newIndex) {
        const reorderedCards = arrayMove(columnCards, oldIndex, newIndex);
        setCards((prev) => {
          const otherCards = prev.filter((c) => c.status !== targetColumn);
          return [...otherCards, ...reorderedCards];
        });
      }
    }

    // If status changed, call the onCardMove callback
    if (onCardMove && activeCard.status !== targetColumn) {
      try {
        await onCardMove(activeId, targetColumn);
      } catch (error) {
        // Revert on error
        setCards((prev) =>
          prev.map((card) =>
            card.id === activeId
              ? { ...card, status: activeCard.status }
              : card
          )
        );
        console.error("Failed to move card:", error);
      }
    }
  };

  // Show loading skeleton until mounted (avoids hydration mismatch)
  if (!mounted) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))` }}>
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col rounded-2xl min-h-[500px] bg-landing-stone/5 animate-pulse">
            <div className="p-4 border-b border-landing-charcoal/5">
              <div className="h-4 bg-landing-stone/10 rounded w-24" />
            </div>
            <div className="flex-1 p-3 space-y-3">
              <div className="h-24 bg-landing-stone/10 rounded-xl" />
              <div className="h-24 bg-landing-stone/10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(280px, 1fr))` }}>
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            cards={getCardsByColumn(column.id)}
            onCardClick={onCardClick}
            onAddCard={onAddCard}
            allowedCardTypes={allowedCardTypes}
            showAddButton={showAddButton}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="rotate-3 scale-105">
            <KanbanCard card={activeCard} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
