"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Evidence {
  id: string;
  quote: string;
  context?: string;
  interview_id: string;
  snapshot_id: string;
  created_at: string;
}

interface EvidencePanelProps {
  opportunityTitle: string;
  evidence: Evidence[];
  onClose: () => void;
}

export function EvidencePanel({
  opportunityTitle,
  evidence,
  onClose,
}: EvidencePanelProps) {
  return (
    <Card className="w-80 max-h-[500px] flex flex-col shadow-lg">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Evidence</CardTitle>
            <p className="text-xs text-gray-500 mt-1">{opportunityTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">
          {evidence.length} quote{evidence.length !== 1 ? "s" : ""}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full max-h-[380px] px-4 pb-4">
          {evidence.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">
              No evidence linked yet.
            </p>
          ) : (
            <div className="space-y-3">
              {evidence.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                >
                  <blockquote className="text-sm italic text-gray-700 dark:text-gray-300 border-l-2 border-blue-400 pl-3">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  {item.context && (
                    <p className="text-xs text-gray-500 mt-2">
                      Context: {item.context}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
