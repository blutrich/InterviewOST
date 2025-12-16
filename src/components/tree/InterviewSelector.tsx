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
    <div className="bg-white dark:bg-gray-900 rounded-lg border shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-sm">Filter by Interview</span>
          {!allSelected && (
            <Badge variant="secondary" className="text-xs">
              {selectedIds.length} selected
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t">
          {/* Select All Option */}
          <div
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
              allSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
            onClick={handleSelectAll}
          >
            <Checkbox checked={allSelected} />
            <span className="text-sm font-medium">
              All Interviews ({completedInterviews.length})
            </span>
          </div>

          {/* Divider */}
          <div className="border-t mx-3" />

          {/* Interview List */}
          <ScrollArea className="max-h-[300px]">
            <div className="p-2 space-y-1">
              {completedInterviews.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  No completed interviews yet
                </p>
              ) : (
                completedInterviews.map((interview) => {
                  const isSelected = selectedIds.includes(interview.id);
                  return (
                    <div
                      key={interview.id}
                      className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                        isSelected && !allSelected
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => handleToggleInterview(interview.id)}
                    >
                      <Checkbox
                        checked={isSelected || allSelected}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {interview.participant_name || "Anonymous"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
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
                        {interview.evidence_count !== undefined &&
                          interview.evidence_count > 0 && (
                            <Badge
                              variant="secondary"
                              className="mt-1 text-[10px]"
                            >
                              {interview.evidence_count} evidence
                            </Badge>
                          )}
                      </div>
                      <Badge className={`text-[10px] ${getStatusColor(interview.snapshot_status || interview.status)}`}>
                        {interview.snapshot_status === "approved"
                          ? "Mapped"
                          : interview.snapshot_status || interview.status}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Footer hint */}
          {completedInterviews.length > 0 && (
            <div className="border-t p-2">
              <p className="text-[10px] text-gray-400 text-center">
                Select interviews to filter the tree
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
