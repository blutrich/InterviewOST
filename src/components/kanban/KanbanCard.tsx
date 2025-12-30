"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

export interface KanbanCardData {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  type: "interview" | "opportunity" | "snapshot";
  metadata?: {
    date?: string;
    participant?: string;
    evidenceCount?: number;
  };
}

interface KanbanCardProps {
  card: KanbanCardData;
  onClick?: (card: KanbanCardData) => void;
}

const typeStyles = {
  interview: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    accent: "bg-landing-terracotta/10 text-landing-terracotta",
    border: "border-landing-terracotta/20",
  },
  opportunity: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25z" />
      </svg>
    ),
    accent: "bg-landing-forest/10 text-landing-forest",
    border: "border-landing-forest/20",
  },
  snapshot: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
    accent: "bg-landing-charcoal/10 text-landing-charcoal",
    border: "border-landing-charcoal/20",
  },
};

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeStyle = typeStyles[card.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(card)}
      className={cn(
        "bg-white rounded-xl border p-4 cursor-grab active:cursor-grabbing",
        "hover:shadow-lg hover:shadow-landing-charcoal/5 transition-all duration-200",
        "group",
        typeStyle.border,
        isDragging && "opacity-50 shadow-2xl rotate-2 scale-105"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", typeStyle.accent)}>
          {typeStyle.icon}
        </div>
        <span className="text-[9px] uppercase tracking-wider text-landing-stone/60 font-medium">
          {card.type}
        </span>
      </div>

      {/* Content */}
      <h4 className="font-medium text-landing-charcoal text-sm leading-snug mb-1 group-hover:text-landing-forest transition-colors">
        {card.title}
      </h4>
      {card.subtitle && (
        <p className="text-xs text-landing-stone line-clamp-2">{card.subtitle}</p>
      )}

      {/* Metadata */}
      {card.metadata && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-landing-charcoal/5">
          {card.metadata.participant && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-landing-forest/10 flex items-center justify-center">
                <span className="text-[9px] font-medium text-landing-forest">
                  {card.metadata.participant[0]?.toUpperCase()}
                </span>
              </div>
              <span className="text-[11px] text-landing-stone truncate max-w-[80px]">
                {card.metadata.participant}
              </span>
            </div>
          )}
          {card.metadata.date && (
            <span className="text-[10px] text-landing-stone/60">
              {card.metadata.date}
            </span>
          )}
          {card.metadata.evidenceCount !== undefined && (
            <span className="text-[10px] text-landing-stone/60 ml-auto">
              {card.metadata.evidenceCount} evidence
            </span>
          )}
        </div>
      )}
    </div>
  );
}
