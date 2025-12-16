"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Interview {
  id: string;
  access_token: string;
  participant_name: string | null;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  has_snapshot: boolean;
  snapshot_status: string | null;
  template_name: string | null;
}

interface Props {
  projectId: string;
  initialInterviews: Interview[];
  activeTemplate: { id: string; name: string } | null;
  hasTemplates: boolean;
}

export default function InterviewsClient({
  projectId,
  initialInterviews,
  activeTemplate,
  hasTemplates,
}: Props) {
  const params = useParams();
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const createInterview = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          participantName: participantName || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create interview");
      }

      const newInterview = await res.json();
      setInterviews([
        {
          ...newInterview,
          has_snapshot: false,
          snapshot_status: null,
          template_name: activeTemplate?.name,
        },
        ...interviews,
      ]);
      setCreatedLink(newInterview.interview_link);
      setParticipantName("");
    } catch (error) {
      console.error("Error creating interview:", error);
      alert("Failed to create interview. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const updateInterviewStatus = async (interviewId: string, status: string) => {
    try {
      const res = await fetch("/api/interviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, status }),
      });

      if (!res.ok) {
        throw new Error("Failed to update interview");
      }

      const updatedInterview = await res.json();
      setInterviews(
        interviews.map((i) =>
          i.id === interviewId ? { ...i, ...updatedInterview } : i
        )
      );
    } catch (error) {
      console.error("Error updating interview:", error);
      alert("Failed to update interview. Please try again.");
    }
  };

  const deleteInterview = async (interviewId: string) => {
    try {
      const res = await fetch(`/api/interviews?interviewId=${interviewId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete interview");
      }

      setInterviews(interviews.filter((i) => i.id !== interviewId));
    } catch (error) {
      console.error("Error deleting interview:", error);
      alert("Failed to delete interview. Please try again.");
    }
    setDeleteConfirm(null);
  };

  const copyLink = async (token: string) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const link = `${baseUrl}/i/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(token);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (interview: Interview) => {
    switch (interview.status) {
      case "completed":
        return <Badge className="bg-green-600">Completed</Badge>;
      case "active":
        return <Badge className="bg-blue-600">Active</Badge>;
      case "abandoned":
        return <Badge variant="destructive">Abandoned</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getSnapshotBadge = (interview: Interview) => {
    if (!interview.has_snapshot) return null;

    switch (interview.snapshot_status) {
      case "approved":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Analyzed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Needs Review
          </Badge>
        );
      default:
        return null;
    }
  };

  // Stats
  const stats = {
    total: interviews.length,
    completed: interviews.filter((i) => i.status === "completed").length,
    active: interviews.filter((i) => i.status === "active").length,
    pending: interviews.filter((i) => i.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-gray-500">Total Interviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {stats.completed}
            </div>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-sm text-gray-500">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-500">
              {stats.pending}
            </div>
            <p className="text-sm text-gray-500">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Button and Warning */}
      <div className="flex items-center justify-between">
        <div>
          {!hasTemplates && (
            <p className="text-amber-600 text-sm">
              No templates yet.{" "}
              <Link
                href={`/dashboard/projects/${projectId}/templates`}
                className="underline"
              >
                Create a template
              </Link>{" "}
              first for better interview structure.
            </p>
          )}
          {hasTemplates && !activeTemplate && (
            <p className="text-amber-600 text-sm">
              No active template.{" "}
              <Link
                href={`/dashboard/projects/${projectId}/templates`}
                className="underline"
              >
                Set an active template
              </Link>{" "}
              for the best results.
            </p>
          )}
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          Create Interview
        </Button>
      </div>

      {/* Interviews List */}
      {interviews.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500 mb-4">No interviews yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Your First Interview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">
                        {interview.participant_name || "Anonymous Participant"}
                      </p>
                      {getStatusBadge(interview)}
                      {getSnapshotBadge(interview)}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>
                        Created{" "}
                        {new Date(interview.created_at).toLocaleDateString()}
                      </span>
                      {interview.started_at && (
                        <span>
                          Started{" "}
                          {new Date(interview.started_at).toLocaleTimeString()}
                        </span>
                      )}
                      {interview.completed_at && (
                        <span>
                          Completed{" "}
                          {new Date(interview.completed_at).toLocaleTimeString()}
                        </span>
                      )}
                      {interview.template_name && (
                        <span className="text-blue-600">
                          {interview.template_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {interview.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(interview.access_token)}
                      >
                        {copiedId === interview.access_token
                          ? "Copied!"
                          : "Copy Link"}
                      </Button>
                    )}
                    {interview.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateInterviewStatus(interview.id, "completed")
                        }
                      >
                        Mark Complete
                      </Button>
                    )}
                    {interview.status === "completed" && (
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/dashboard/projects/${projectId}/interviews/${interview.id}/snapshot`}
                        >
                          {interview.has_snapshot ? "View Snapshot" : "Analyze"}
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        href={`/dashboard/projects/${projectId}/interviews/${interview.id}`}
                      >
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteConfirm(interview.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Interview Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Interview</DialogTitle>
            <DialogDescription>
              Generate a unique link for a participant to join the interview.
              {activeTemplate
                ? ` Using template: ${activeTemplate.name}`
                : " No active template selected."}
            </DialogDescription>
          </DialogHeader>

          {!createdLink ? (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="participantName">
                    Participant Name (Optional)
                  </Label>
                  <Input
                    id="participantName"
                    placeholder="Enter participant name..."
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    You can leave this blank - participants can enter their name
                    when they join.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createInterview} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Interview"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Interview Link</Label>
                  <div className="flex gap-2">
                    <Input value={createdLink} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(createdLink);
                        setCopiedId("new");
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                    >
                      {copiedId === "new" ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Share this link with your participant. They can use it to
                    join the interview.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowCreateDialog(false);
                    setCreatedLink(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              interview, all messages, and any associated snapshots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirm && deleteInterview(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
