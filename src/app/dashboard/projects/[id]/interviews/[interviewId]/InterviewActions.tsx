"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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

interface Props {
  interviewId: string;
  projectId: string;
}

export default function InterviewActions({ interviewId, projectId }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const markAsCompleted = async () => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          status: "completed",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update interview");
      }

      router.refresh();
    } catch (error) {
      console.error("Error updating interview:", error);
      alert("Failed to mark interview as completed. Please try again.");
    } finally {
      setIsUpdating(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-blue-800 dark:text-blue-200">
            Interview in Progress
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            When the participant has finished, mark this interview as completed
            to generate a snapshot.
          </p>
        </div>
        <Button
          onClick={() => setShowConfirm(true)}
          disabled={isUpdating}
        >
          Mark as Completed
        </Button>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Interview as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the interview session. The participant will no
              longer be able to send messages. You can then generate an
              Interview Snapshot to analyze the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={markAsCompleted} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Complete Interview"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
