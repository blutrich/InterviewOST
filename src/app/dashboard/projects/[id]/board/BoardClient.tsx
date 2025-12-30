"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { KanbanBoard, ColumnConfig, KanbanCardData, EditCardModal } from "@/components/kanban";
import { createClient } from "@/lib/supabase/client";
import { nanoid } from "nanoid";

interface BoardClientProps {
  projectId: string;
  interviewCards: KanbanCardData[];
  opportunityCards: KanbanCardData[];
}

type ViewMode = "interviews" | "opportunities" | "all";

const interviewColumns: ColumnConfig[] = [
  { id: "pending", title: "Pending", color: "pending" },
  { id: "active", title: "In Progress", color: "active" },
  { id: "completed", title: "Completed", color: "completed" },
];

const opportunityColumns: ColumnConfig[] = [
  { id: "suggested", title: "Suggested", color: "pending" },
  { id: "approved", title: "Approved", color: "completed" },
  { id: "rejected", title: "Rejected", color: "active" },
];

const allColumns: ColumnConfig[] = [
  { id: "pending", title: "Backlog", color: "pending" },
  { id: "active", title: "In Progress", color: "active" },
  { id: "review", title: "Review", color: "review" },
  { id: "completed", title: "Done", color: "completed" },
];

type CardType = "interview" | "opportunity";

export function BoardClient({
  projectId,
  interviewCards,
  opportunityCards,
}: BoardClientProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("interviews");
  const [selectedCard, setSelectedCard] = useState<KanbanCardData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const supabase = createClient();

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Escape - close modals
      if (e.key === "Escape") {
        if (showKeyboardHelp) {
          setShowKeyboardHelp(false);
        } else if (isEditModalOpen) {
          setIsEditModalOpen(false);
          setSelectedCard(null);
        }
        return;
      }

      // ? - toggle keyboard help
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setShowKeyboardHelp((prev) => !prev);
        return;
      }

      // 1, 2, 3 - switch view modes
      if (e.key === "1") {
        setViewMode("interviews");
        return;
      }
      if (e.key === "2") {
        setViewMode("opportunities");
        return;
      }
      if (e.key === "3") {
        setViewMode("all");
        return;
      }

      // r - refresh
      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        router.refresh();
        return;
      }
    },
    [isEditModalOpen, showKeyboardHelp, router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleCardMove = async (cardId: string, newStatus: string) => {
    // Determine if it's an interview or opportunity
    const isInterview = interviewCards.some((c) => c.id === cardId);

    if (isInterview) {
      const { error } = await supabase
        .from("interviews")
        .update({ status: newStatus })
        .eq("id", cardId);

      if (error) {
        console.error("Failed to update interview status:", error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("opportunities")
        .update({ status: newStatus })
        .eq("id", cardId);

      if (error) {
        console.error("Failed to update opportunity status:", error);
        throw error;
      }
    }

    router.refresh();
  };

  const handleCardClick = (card: KanbanCardData) => {
    setSelectedCard(card);
    setIsEditModalOpen(true);
  };

  const handleNavigateToCard = (card: KanbanCardData) => {
    if (card.type === "interview") {
      router.push(`/dashboard/projects/${projectId}/interviews/${card.id}`);
    } else if (card.type === "opportunity") {
      router.push(`/dashboard/projects/${projectId}/tree?highlight=${card.id}`);
    }
  };

  const handleAddCard = async (data: {
    title: string;
    subtitle?: string;
    status: string;
    type: CardType;
  }) => {
    if (data.type === "interview") {
      const accessToken = nanoid(12);
      const { error } = await supabase.from("interviews").insert({
        project_id: projectId,
        participant_name: data.title,
        status: data.status,
        access_token: accessToken,
      });

      if (error) {
        console.error("Failed to create interview:", error);
        throw error;
      }
    } else {
      const { error } = await supabase.from("opportunities").insert({
        project_id: projectId,
        title: data.title,
        description: data.subtitle || null,
        status: data.status,
      });

      if (error) {
        console.error("Failed to create opportunity:", error);
        throw error;
      }
    }

    router.refresh();
  };

  const handleSaveCard = async (card: KanbanCardData) => {
    if (card.type === "interview") {
      const { error } = await supabase
        .from("interviews")
        .update({
          participant_name: card.title,
          status: card.status,
        })
        .eq("id", card.id);

      if (error) {
        console.error("Failed to update interview:", error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("opportunities")
        .update({
          title: card.title,
          description: card.subtitle || null,
          status: card.status,
        })
        .eq("id", card.id);

      if (error) {
        console.error("Failed to update opportunity:", error);
        throw error;
      }
    }

    router.refresh();
  };

  const handleDeleteCard = async (cardId: string) => {
    const isInterview = interviewCards.some((c) => c.id === cardId);

    if (isInterview) {
      const { error } = await supabase
        .from("interviews")
        .delete()
        .eq("id", cardId);

      if (error) {
        console.error("Failed to delete interview:", error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("opportunities")
        .delete()
        .eq("id", cardId);

      if (error) {
        console.error("Failed to delete opportunity:", error);
        throw error;
      }
    }

    router.refresh();
  };

  const getEditColumns = () => {
    switch (viewMode) {
      case "interviews":
        return interviewColumns.map((c) => ({ id: c.id, title: c.title }));
      case "opportunities":
        return opportunityColumns.map((c) => ({ id: c.id, title: c.title }));
      case "all":
        return allColumns.map((c) => ({ id: c.id, title: c.title }));
      default:
        return interviewColumns.map((c) => ({ id: c.id, title: c.title }));
    }
  };

  const getAllowedCardTypes = (): CardType[] => {
    switch (viewMode) {
      case "interviews":
        return ["interview"];
      case "opportunities":
        return ["opportunity"];
      case "all":
        return ["interview", "opportunity"];
      default:
        return ["interview", "opportunity"];
    }
  };

  const getColumnsAndCards = () => {
    switch (viewMode) {
      case "interviews":
        return { columns: interviewColumns, cards: interviewCards };
      case "opportunities":
        return { columns: opportunityColumns, cards: opportunityCards };
      case "all":
        // Merge both, mapping opportunity statuses to combined columns
        const mappedOpportunities = opportunityCards.map((card) => ({
          ...card,
          status:
            card.status === "approved"
              ? "completed"
              : card.status === "rejected"
              ? "review"
              : card.status === "suggested"
              ? "pending"
              : "pending",
        }));
        return {
          columns: allColumns,
          cards: [...interviewCards, ...mappedOpportunities],
        };
      default:
        return { columns: interviewColumns, cards: interviewCards };
    }
  };

  const { columns, cards } = getColumnsAndCards();

  const viewModes: { id: ViewMode; label: string; count: number }[] = [
    { id: "interviews", label: "Interviews", count: interviewCards.length },
    { id: "opportunities", label: "Opportunities", count: opportunityCards.length },
    { id: "all", label: "All Items", count: interviewCards.length + opportunityCards.length },
  ];

  return (
    <div className="space-y-6">
      {/* View Mode Tabs */}
      <div className="flex items-center gap-2 p-1 bg-landing-charcoal/5 rounded-full w-fit">
        {viewModes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`
              flex items-center gap-2 h-9 px-4 rounded-full text-[11px] uppercase tracking-wider font-medium transition-all duration-200
              ${
                viewMode === mode.id
                  ? "bg-white text-landing-charcoal shadow-sm"
                  : "text-landing-stone hover:text-landing-charcoal"
              }
            `}
          >
            {mode.label}
            <span
              className={`
                text-[10px] px-1.5 py-0.5 rounded-full
                ${
                  viewMode === mode.id
                    ? "bg-landing-forest/10 text-landing-forest"
                    : "bg-landing-stone/10 text-landing-stone"
                }
              `}
            >
              {mode.count}
            </span>
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6">
        {columns.map((column) => {
          const count = cards.filter((c) => c.status === column.id).length;
          return (
            <div key={column.id} className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  column.color === "pending"
                    ? "bg-landing-stone"
                    : column.color === "active"
                    ? "bg-landing-terracotta"
                    : column.color === "completed"
                    ? "bg-landing-forest"
                    : column.color === "review"
                    ? "bg-amber-500"
                    : column.color === "discover"
                    ? "bg-landing-terracotta"
                    : column.color === "define"
                    ? "bg-landing-forest"
                    : column.color === "deliver"
                    ? "bg-landing-charcoal"
                    : "bg-landing-stone"
                }`}
              />
              <span className="text-[11px] text-landing-stone">
                {count} {column.title.toLowerCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      {cards.length > 0 ? (
        <div className="overflow-x-auto pb-4">
          <KanbanBoard
            columns={columns}
            initialCards={cards}
            onCardMove={handleCardMove}
            onCardClick={handleCardClick}
            onAddCard={handleAddCard}
            allowedCardTypes={getAllowedCardTypes()}
            showAddButton={true}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-landing-charcoal/5">
          <div className="w-16 h-16 rounded-2xl bg-landing-forest/10 flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-landing-forest"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-landing-charcoal mb-2">
            No items yet
          </h3>
          <p className="text-landing-stone text-center max-w-sm">
            Start by creating interviews or opportunities to see them on your board.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-landing-charcoal/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-landing-terracotta/10 flex items-center justify-center">
            <svg className="w-3 h-3 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375" />
            </svg>
          </div>
          <span className="text-[11px] text-landing-stone">Interview</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-landing-forest/10 flex items-center justify-center">
            <svg className="w-3 h-3 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
          </div>
          <span className="text-[11px] text-landing-stone">Opportunity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-landing-charcoal/10 flex items-center justify-center">
            <svg className="w-3 h-3 text-landing-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15" />
            </svg>
          </div>
          <span className="text-[11px] text-landing-stone">Snapshot</span>
        </div>
      </div>

      {/* Edit Card Modal */}
      <EditCardModal
        card={selectedCard}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCard(null);
        }}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
        columns={getEditColumns()}
      />

      {/* Keyboard Shortcuts Help */}
      {showKeyboardHelp && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowKeyboardHelp(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-landing-charcoal">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-1 hover:bg-landing-charcoal/5 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-landing-stone" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-landing-stone">Interviews view</span>
                <kbd className="px-2 py-1 bg-landing-charcoal/5 rounded text-xs font-mono text-landing-charcoal">1</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-landing-stone">Opportunities view</span>
                <kbd className="px-2 py-1 bg-landing-charcoal/5 rounded text-xs font-mono text-landing-charcoal">2</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-landing-stone">All items view</span>
                <kbd className="px-2 py-1 bg-landing-charcoal/5 rounded text-xs font-mono text-landing-charcoal">3</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-landing-stone">Refresh board</span>
                <kbd className="px-2 py-1 bg-landing-charcoal/5 rounded text-xs font-mono text-landing-charcoal">r</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-landing-stone">Close modal</span>
                <kbd className="px-2 py-1 bg-landing-charcoal/5 rounded text-xs font-mono text-landing-charcoal">esc</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-landing-stone">Show this help</span>
                <kbd className="px-2 py-1 bg-landing-charcoal/5 rounded text-xs font-mono text-landing-charcoal">?</kbd>
              </div>
            </div>
            <p className="text-xs text-landing-stone/60 mt-4 pt-4 border-t border-landing-charcoal/5">
              Drag cards with mouse or use Tab + Space
            </p>
          </div>
        </div>
      )}

      {/* Keyboard Shortcut Hint */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setShowKeyboardHelp(true)}
          className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-landing-charcoal/10 rounded-full shadow-sm hover:shadow-md transition-all text-xs text-landing-stone hover:text-landing-charcoal"
        >
          <kbd className="px-1.5 py-0.5 bg-landing-charcoal/5 rounded text-[10px] font-mono">?</kbd>
          <span>Shortcuts</span>
        </button>
      </div>
    </div>
  );
}
