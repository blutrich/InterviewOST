"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MessageSquare, User, Bot, ChevronRight, ChevronLeft } from "lucide-react";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Evidence {
  id: string;
  quote: string;
  context?: string;
  interview_id: string;
  snapshot_id: string;
  created_at: string;
}

interface InterviewSidePanelProps {
  opportunityTitle: string;
  evidence: Evidence[];
  isOpen: boolean;
  onClose: () => void;
}

export function InterviewSidePanel({
  opportunityTitle,
  evidence,
  isOpen,
  onClose,
}: InterviewSidePanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [interviewDetails, setInterviewDetails] = useState<{
    participant_name?: string;
    created_at?: string;
    status?: string;
  } | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  // Get unique interview IDs from evidence
  const uniqueInterviewIds = [...new Set(evidence.map((e) => e.interview_id))];

  // Fetch messages when interview is selected
  useEffect(() => {
    if (!selectedInterviewId) {
      setMessages([]);
      setInterviewDetails(null);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/interviews/${selectedInterviewId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setInterviewDetails({
            participant_name: data.participant_name,
            created_at: data.created_at,
            status: data.status,
          });
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedInterviewId]);

  // Auto-select first interview if only one
  useEffect(() => {
    if (isOpen && uniqueInterviewIds.length === 1 && !selectedInterviewId) {
      setSelectedInterviewId(uniqueInterviewIds[0]);
    }
  }, [isOpen, uniqueInterviewIds, selectedInterviewId]);

  // Find evidence quotes for current interview to highlight
  const currentInterviewEvidence = evidence.filter(
    (e) => e.interview_id === selectedInterviewId
  );

  // Check if a message contains any evidence quote
  const getHighlightedQuotes = (messageContent: string) => {
    return currentInterviewEvidence.filter((e) =>
      messageContent.toLowerCase().includes(e.quote.toLowerCase().substring(0, 50))
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed top-0 right-0 h-full bg-white dark:bg-gray-900 shadow-2xl
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        w-full md:w-[500px] lg:w-[600px]
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 dark:bg-gray-800">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg truncate">Evidence & Interview</h2>
          <p className="text-sm text-gray-500 truncate">{opportunityTitle}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Tab Toggle */}
      <div className="flex border-b">
        <button
          onClick={() => setShowTranscript(false)}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            !showTranscript
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Evidence ({evidence.length})
          </div>
        </button>
        <button
          onClick={() => setShowTranscript(true)}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            showTranscript
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <User className="h-4 w-4" />
            Full Transcript
          </div>
        </button>
      </div>

      {/* Interview Selector (if multiple) */}
      {uniqueInterviewIds.length > 1 && (
        <div className="p-3 border-b bg-gray-50/50">
          <label className="text-xs text-gray-500 block mb-2">Select Interview</label>
          <div className="flex gap-2 flex-wrap">
            {uniqueInterviewIds.map((id, idx) => (
              <button
                key={id}
                onClick={() => setSelectedInterviewId(id)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  selectedInterviewId === id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Interview {idx + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {!showTranscript ? (
          /* Evidence View */
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {evidence.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No evidence linked yet.
                </p>
              ) : (
                evidence.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-400"
                  >
                    <blockquote className="text-sm italic text-gray-700 dark:text-gray-300">
                      &ldquo;{item.quote}&rdquo;
                    </blockquote>
                    {item.context && (
                      <p className="text-xs text-gray-500 mt-2">
                        Context: {item.context}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => {
                          setSelectedInterviewId(item.interview_id);
                          setShowTranscript(true);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        View in transcript
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          /* Transcript View */
          <div className="h-full flex flex-col">
            {/* Interview Header */}
            {interviewDetails && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {interviewDetails.participant_name || "Anonymous Participant"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {interviewDetails.created_at &&
                        new Date(interviewDetails.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {interviewDetails.status}
                  </Badge>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">
                      {selectedInterviewId
                        ? "No messages in this interview"
                        : "Select an interview to view transcript"}
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const highlightedQuotes = getHighlightedQuotes(message.content);
                    const hasEvidence = highlightedQuotes.length > 0;

                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "assistant" ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-3 ${
                            message.role === "assistant"
                              ? "bg-gray-100 dark:bg-gray-800"
                              : hasEvidence
                              ? "bg-blue-600 text-white ring-2 ring-yellow-400 ring-offset-2"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.role === "assistant" ? (
                              <Bot className="h-3 w-3 text-gray-500" />
                            ) : (
                              <User className="h-3 w-3 text-blue-100" />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                message.role === "assistant"
                                  ? "text-gray-500"
                                  : "text-blue-100"
                              }`}
                            >
                              {message.role === "assistant"
                                ? "Interviewer"
                                : "Participant"}
                            </span>
                            <span
                              className={`text-xs ${
                                message.role === "assistant"
                                  ? "text-gray-400"
                                  : "text-blue-200"
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {hasEvidence && (
                              <Badge className="ml-auto bg-yellow-500 text-yellow-900 text-[10px] px-1.5 py-0">
                                Evidence
                              </Badge>
                            )}
                          </div>
                          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            {/* Back to Evidence Link */}
            <div className="p-3 border-t bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => setShowTranscript(false)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to evidence quotes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
