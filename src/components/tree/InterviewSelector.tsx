"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";

interface Interview {
  id: string;
  participant_name: string | null;
  status: string;
  created_at: string;
  message_count?: number;
  evidence_count?: number;
  snapshot_status?: string;
}

interface InterviewSelectorProps {
  interviews: Interview[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function InterviewSelector({
  interviews,
  selectedIds,
  onSelectionChange,
}: InterviewSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedInterviews = interviews.filter((i) => i.status === "completed");
  const allSelected = selectedIds.length === 0; // Empty means "show all"

  const handleSelectAll = () => {
    onSelectionChange([]); // Empty array = show all
  };

  const handleToggleInterview = (id: string) => {
    if (allSelected) {
      // First selection - show only this interview
      onSelectionChange([id]);
    } else if (selectedIds.includes(id)) {
      // Deselect this interview
      const newIds = selectedIds.filter((i) => i !== id);
      onSelectionChange(newIds.length === 0 ? [] : newIds); // Empty = show all
    } else {
      // Add this interview to selection
      onSelectionChange([...selectedIds, id]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "active":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-landing-charcoal/10 shadow-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-landing-ivory/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-landing-stone" />
          <span className="text-[11px] uppercase tracking-wider font-medium text-landing-charcoal">Filter Interviews</span>
          {!allSelected && (
            <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-landing-forest/10 text-landing-forest">
              {selectedIds.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-landing-stone" />
        ) : (
          <ChevronDown className="h-4 w-4 text-landing-stone" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-landing-charcoal/5">
          {/* Select All Option */}
          <div
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-landing-ivory/50 transition-colors ${
              allSelected ? "bg-landing-forest/5" : ""
            }`}
            onClick={handleSelectAll}
          >
            <Checkbox checked={allSelected} className="border-landing-charcoal/20" />
            <span className="text-xs text-landing-charcoal">
              All Interviews ({completedInterviews.length})
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-landing-charcoal/5 mx-3" />

          {/* Interview List */}
          <ScrollArea className="max-h-[250px]">
            <div className="p-2 space-y-1">
              {completedInterviews.length === 0 ? (
                <p className="text-xs text-landing-stone text-center py-4">
                  No completed interviews yet
                </p>
              ) : (
                completedInterviews.map((interview) => {
                  const isSelected = selectedIds.includes(interview.id);
                  return (
                    <div
                      key={interview.id}
                      className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected && !allSelected
                          ? "bg-landing-forest/5"
                          : "hover:bg-landing-ivory/50"
                      }`}
                      onClick={() => handleToggleInterview(interview.id)}
                    >
                      <Checkbox
                        checked={isSelected || allSelected}
                        className="mt-0.5 border-landing-charcoal/20"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-landing-stone flex-shrink-0" />
                          <span className="text-xs font-medium text-landing-charcoal truncate">
                            {interview.participant_name || "Anonymous"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-landing-stone">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(interview.created_at).toLocaleDateString()}
                          </span>
                          {interview.message_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {interview.message_count}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                        interview.snapshot_status === "approved"
                          ? "bg-landing-forest/10 text-landing-forest"
                          : "bg-landing-terracotta/10 text-landing-terracotta"
                      }`}>
                        {interview.snapshot_status === "approved" ? "Mapped" : interview.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer hint */}
          {completedInterviews.length > 0 && (
            <div className="border-t border-landing-charcoal/5 p-2">
              <p className="text-[9px] text-landing-stone/60 text-center">
                Filter tree & transcript by interview
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
