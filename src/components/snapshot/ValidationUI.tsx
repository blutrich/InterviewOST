"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ValidationUIProps {
  snapshotId: string;
  status: "pending" | "approved" | "rejected";
  humanNotes?: string;
  validatedAt?: string;
  onStatusChange?: (
    newStatus: "approved" | "rejected",
    notes: string
  ) => Promise<void>;
}

export function ValidationUI({
  snapshotId,
  status,
  humanNotes,
  validatedAt,
  onStatusChange,
}: ValidationUIProps) {
  const [notes, setNotes] = useState(humanNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidation = async (newStatus: "approved" | "rejected") => {
    setIsSubmitting(true);

    try {
      if (onStatusChange) {
        await onStatusChange(newStatus, notes);
      } else {
        // Default API call
        const response = await fetch("/api/synthesis", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshotId,
            status: newStatus,
            human_notes: notes,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update snapshot");
        }
      }

      toast.success(
        newStatus === "approved"
          ? "Snapshot approved successfully"
          : "Snapshot marked for review"
      );

      // Refresh the page to show updated status
      window.location.reload();
    } catch {
      toast.error("Failed to update snapshot status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status !== "pending") {
    return (
      <Card
        className={
          status === "approved"
            ? "border-green-200 dark:border-green-800"
            : "border-red-200 dark:border-red-800"
        }
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {status === "approved" ? (
                <>
                  <span className="text-green-500">✓</span>
                  Validated
                </>
              ) : (
                <>
                  <span className="text-red-500">✗</span>
                  Needs Review
                </>
              )}
            </CardTitle>
            <Badge
              variant={status === "approved" ? "default" : "destructive"}
            >
              {status.toUpperCase()}
            </Badge>
          </div>
          {validatedAt && (
            <CardDescription>
              Validated on {new Date(validatedAt).toLocaleDateString()}
            </CardDescription>
          )}
        </CardHeader>
        {humanNotes && (
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-500 mb-1">
                Reviewer Notes
              </p>
              <p className="text-gray-700 dark:text-gray-300">{humanNotes}</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-amber-500">⏳</span>
          Pending Validation
        </CardTitle>
        <CardDescription>
          Review the AI-generated snapshot and approve or reject it.
          Human validation ensures accuracy.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label
            htmlFor="notes"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block"
          >
            Reviewer Notes (optional)
          </label>
          <Textarea
            id="notes"
            placeholder="Add any notes, corrections, or observations..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Approve Snapshot
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Approve this snapshot?</AlertDialogTitle>
                <AlertDialogDescription>
                  Approving confirms that the AI-generated analysis is accurate
                  and can be used for opportunity mapping.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleValidation("approved")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                disabled={isSubmitting}
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                Reject
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reject this snapshot?</AlertDialogTitle>
                <AlertDialogDescription>
                  Rejecting marks this snapshot as needing review. Please add
                  notes explaining what needs to be corrected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleValidation("rejected")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Reject
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Teresa Torres: &quot;Expert + AI&quot; - AI raises the floor, but humans
          validate all insights.
        </p>
      </CardContent>
    </Card>
  );
}
