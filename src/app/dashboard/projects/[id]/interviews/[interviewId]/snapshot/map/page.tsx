"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface OpportunitySuggestion {
  title: string;
  description: string;
  type: "opportunity" | "pain_point" | "unmet_need" | "workaround";
  evidence_quote: string;
  confidence: "high" | "medium" | "low";
}

interface ParentSuggestion {
  opportunity_title: string;
  suggested_parent_title: string | null;
  reasoning: string;
}

interface MappingResult {
  opportunities: OpportunitySuggestion[];
  parent_suggestions: ParentSuggestion[];
  potential_duplicates: Array<{
    new_opportunity: string;
    potential_duplicate: string;
    similarity_score: string;
    recommendation: string;
    reasoning: string;
  }>;
}

export default function MappingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const interviewId = params.interviewId as string;

  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [suggestions, setSuggestions] = useState<MappingResult | null>(null);
  const [snapshot, setSnapshot] = useState<{ id: string; status: string } | null>(null);
  const [approvedItems, setApprovedItems] = useState<Set<string>>(new Set());
  const [rejectedItems, setRejectedItems] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Fetch snapshot status
  useEffect(() => {
    async function fetchSnapshot() {
      const res = await fetch(
        `/api/synthesis?interviewId=${interviewId}`
      );
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data);
        if (data.status !== "approved") {
          toast.error("Snapshot must be approved before mapping");
          router.push(
            `/dashboard/projects/${projectId}/interviews/${interviewId}/snapshot`
          );
        }
      }
      setLoading(false);
    }
    fetchSnapshot();
  }, [interviewId, projectId, router]);

  // Extract opportunities using Mapper Agent
  const handleExtract = async () => {
    if (!snapshot) return;

    setExtracting(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshotId: snapshot.id,
          projectId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to extract opportunities");
      }

      const data = await res.json();
      setSuggestions(data.suggestions);
      toast.success(
        `Found ${data.suggestions.opportunities.length} opportunities`
      );
    } catch (error) {
      console.error("Extract error:", error);
      toast.error("Failed to extract opportunities");
    } finally {
      setExtracting(false);
    }
  };

  // Toggle approval
  const toggleApprove = (title: string) => {
    const newApproved = new Set(approvedItems);
    const newRejected = new Set(rejectedItems);

    if (approvedItems.has(title)) {
      newApproved.delete(title);
    } else {
      newApproved.add(title);
      newRejected.delete(title);
    }

    setApprovedItems(newApproved);
    setRejectedItems(newRejected);
  };

  // Toggle rejection
  const toggleReject = (title: string) => {
    const newApproved = new Set(approvedItems);
    const newRejected = new Set(rejectedItems);

    if (rejectedItems.has(title)) {
      newRejected.delete(title);
    } else {
      newRejected.add(title);
      newApproved.delete(title);
    }

    setApprovedItems(newApproved);
    setRejectedItems(newRejected);
  };

  // Approve all
  const approveAll = () => {
    if (!suggestions) return;
    const all = new Set(suggestions.opportunities.map((o) => o.title));
    setApprovedItems(all);
    setRejectedItems(new Set());
  };

  // Save approved opportunities to database
  const handleSave = async () => {
    if (!suggestions || approvedItems.size === 0) {
      toast.error("No opportunities selected");
      return;
    }

    setSaving(true);
    try {
      const toSave = suggestions.opportunities.filter((o) =>
        approvedItems.has(o.title)
      );

      // Calculate positions based on tree structure
      // First, identify root opportunities and children
      const rootOpps: typeof toSave = [];
      const childOpps: Map<string, typeof toSave> = new Map();

      // Get all titles of opportunities being saved
      const toSaveTitles = new Set(toSave.map((o) => o.title));

      for (const opp of toSave) {
        const parentSuggestion = suggestions.parent_suggestions.find(
          (p) => p.opportunity_title === opp.title
        );
        const parentTitle = parentSuggestion?.suggested_parent_title;

        // An opportunity is a "root" if:
        // 1. It has no parent suggestion (null)
        // 2. Its suggested parent is not in the list of opportunities being saved
        //    (e.g., parent refers to existing tree item or is invalid)
        if (!parentTitle || !toSaveTitles.has(parentTitle)) {
          rootOpps.push(opp);
        } else {
          const children = childOpps.get(parentTitle) || [];
          children.push(opp);
          childOpps.set(parentTitle, children);
        }
      }

      // Position constants
      const NODE_WIDTH = 280;
      const NODE_HEIGHT = 120;
      const HORIZONTAL_GAP = 80;
      const VERTICAL_GAP = 100;
      const START_Y = 150; // Below root outcome

      // Track saved opportunity IDs by title for parent linking
      const savedOpportunities: Map<string, string> = new Map();

      // Save root opportunities first (spread horizontally)
      const totalRootWidth = rootOpps.length * NODE_WIDTH + (rootOpps.length - 1) * HORIZONTAL_GAP;
      const startX = Math.max(100, (800 - totalRootWidth) / 2);

      for (let i = 0; i < rootOpps.length; i++) {
        const opp = rootOpps[i];
        const x = startX + i * (NODE_WIDTH + HORIZONTAL_GAP);
        const y = START_Y;

        const response = await fetch("/api/opportunities", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            title: opp.title,
            description: opp.description,
            type: opp.type === "pain_point" ? "opportunity" : opp.type,
            status: "approved",
            position: { x, y },
          }),
        });

        const result = await response.json();
        if (result.opportunity?.id) {
          savedOpportunities.set(opp.title, result.opportunity.id);

          // Link evidence quote to the opportunity
          if (opp.evidence_quote && snapshot) {
            await fetch("/api/opportunities", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                opportunityId: result.opportunity.id,
                snapshotId: snapshot.id,
                interviewId,
                quote: opp.evidence_quote,
                context: `Extracted from interview snapshot - ${opp.type}`,
              }),
            });
          }
        }
      }

      // Save child opportunities (below their parents)
      for (let i = 0; i < rootOpps.length; i++) {
        const parentOpp = rootOpps[i];
        const parentId = savedOpportunities.get(parentOpp.title);
        const children = childOpps.get(parentOpp.title) || [];
        const parentX = startX + i * (NODE_WIDTH + HORIZONTAL_GAP);

        for (let j = 0; j < children.length; j++) {
          const child = children[j];
          // Offset children slightly to the side
          const childOffset = (j - (children.length - 1) / 2) * (NODE_WIDTH / 2 + 20);
          const x = parentX + childOffset;
          const y = START_Y + NODE_HEIGHT + VERTICAL_GAP + j * 20; // Stagger slightly

          const childResponse = await fetch("/api/opportunities", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              parentId,
              title: child.title,
              description: child.description,
              type: child.type === "pain_point" ? "opportunity" : child.type,
              status: "approved",
              position: { x, y },
            }),
          });

          const childResult = await childResponse.json();

          // Link evidence quote to the child opportunity
          if (childResult.opportunity?.id && child.evidence_quote && snapshot) {
            await fetch("/api/opportunities", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                opportunityId: childResult.opportunity.id,
                snapshotId: snapshot.id,
                interviewId,
                quote: child.evidence_quote,
                context: `Extracted from interview snapshot - ${child.type}`,
              }),
            });
          }
        }
      }

      toast.success(`Saved ${toSave.length} opportunities to OST`);
      router.push(`/dashboard/projects/${projectId}/tree`);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save opportunities");
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pain_point":
        return "😤";
      case "unmet_need":
        return "💭";
      case "workaround":
        return "🔧";
      default:
        return "💡";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="hover:text-gray-700"
            >
              Project
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/projects/${projectId}/interviews/${interviewId}/snapshot`}
              className="hover:text-gray-700"
            >
              Snapshot
            </Link>
            <span>/</span>
            <span>Map to OST</span>
          </div>
          <h1 className="text-2xl font-bold">Extract Opportunities</h1>
          <p className="text-gray-500 mt-1">
            AI will analyze the snapshot and suggest opportunities for your tree
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/projects/${projectId}/interviews/${interviewId}/snapshot`}
            >
              Back to Snapshot
            </Link>
          </Button>
        </div>
      </div>

      {/* No suggestions yet */}
      {!suggestions && (
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-purple-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                />
              </svg>
            </div>
            <CardTitle>Ready to Extract</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              The Mapper Agent will analyze your approved snapshot and suggest
              opportunities to add to your Opportunity Solution Tree.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Button onClick={handleExtract} disabled={extracting} size="lg">
              {extracting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Extracting...
                </>
              ) : (
                "Extract Opportunities"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Suggestions list */}
      {suggestions && (
        <>
          {/* Actions bar */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {suggestions.opportunities.length} opportunities found
              </Badge>
              <span className="text-sm text-gray-500">
                {approvedItems.size} approved, {rejectedItems.size} rejected
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={approveAll}>
                Approve All
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || approvedItems.size === 0}
              >
                {saving ? "Saving..." : `Save to OST (${approvedItems.size})`}
              </Button>
            </div>
          </div>

          {/* Opportunity cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions.opportunities.map((opp, index) => {
              const isApproved = approvedItems.has(opp.title);
              const isRejected = rejectedItems.has(opp.title);
              const parentSuggestion = suggestions.parent_suggestions.find(
                (p) => p.opportunity_title === opp.title
              );

              return (
                <Card
                  key={index}
                  className={`transition-all ${
                    isApproved
                      ? "border-green-500 bg-green-50/50 dark:bg-green-900/10"
                      : isRejected
                      ? "border-red-300 bg-red-50/50 dark:bg-red-900/10 opacity-60"
                      : ""
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getTypeIcon(opp.type)}</span>
                        <div>
                          <CardTitle className="text-lg">{opp.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {opp.type.replace("_", " ")}
                            </Badge>
                            <Badge
                              className={`text-xs ${getConfidenceColor(
                                opp.confidence
                              )}`}
                            >
                              {opp.confidence} confidence
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {isApproved && (
                        <span className="text-green-600 text-xl">✓</span>
                      )}
                      {isRejected && (
                        <span className="text-red-500 text-xl">✗</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {opp.description}
                    </p>

                    {/* Evidence quote */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-xs text-gray-500 mb-1">Evidence</p>
                      <p className="text-sm italic">
                        &ldquo;{opp.evidence_quote}&rdquo;
                      </p>
                    </div>

                    {/* Parent suggestion */}
                    {parentSuggestion && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Suggested parent:</span>{" "}
                        {parentSuggestion.suggested_parent_title || "Root (directly under outcome)"}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant={isApproved ? "default" : "outline"}
                        className={
                          isApproved
                            ? "flex-1 bg-green-600 hover:bg-green-700"
                            : "flex-1"
                        }
                        onClick={() => toggleApprove(opp.title)}
                      >
                        {isApproved ? "Approved" : "Approve"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`flex-1 ${
                          isRejected
                            ? "border-red-500 bg-red-50 text-red-600"
                            : "border-red-300 text-red-600 hover:bg-red-50"
                        }`}
                        onClick={() => toggleReject(opp.title)}
                      >
                        {isRejected ? "Rejected" : "Reject"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Duplicate warnings */}
          {suggestions.potential_duplicates.length > 0 && (
            <Card className="border-amber-300 bg-amber-50 dark:bg-amber-900/10">
              <CardHeader>
                <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <span>⚠️</span> Potential Duplicates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suggestions.potential_duplicates.map((dup, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded p-3 text-sm"
                    >
                      <p>
                        <span className="font-medium">{dup.new_opportunity}</span>{" "}
                        may be similar to{" "}
                        <span className="font-medium">{dup.potential_duplicate}</span>
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {dup.reasoning}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
