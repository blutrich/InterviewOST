"use client";

import { useState } from "react";
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
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleValidation = async (newStatus: "approved" | "rejected") => {
    setIsSubmitting(true);

    try {
      if (onStatusChange) {
        await onStatusChange(newStatus, notes);
      } else {
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

      window.location.reload();
    } catch {
      toast.error("Failed to update snapshot status");
    } finally {
      setIsSubmitting(false);
      setShowApproveModal(false);
      setShowRejectModal(false);
    }
  };

  if (status !== "pending") {
    return (
      <div className={`bg-white rounded-2xl border overflow-hidden ${
        status === "approved" ? "border-landing-forest/20" : "border-landing-terracotta/20"
      }`}>
        <div className="px-8 py-6 border-b border-landing-charcoal/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status === "approved" ? (
                <div className="w-8 h-8 rounded-full bg-landing-forest/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-landing-terracotta/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div>
                <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
                  {status === "approved" ? "Validated" : "Needs Review"}
                </h2>
                {validatedAt && (
                  <p className="text-sm text-landing-stone">
                    Validated on {new Date(validatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-medium px-3 py-1.5 rounded-full ${
              status === "approved"
                ? "bg-landing-forest/10 text-landing-forest"
                : "bg-landing-terracotta/10 text-landing-terracotta"
            }`}>
              {status}
            </span>
          </div>
        </div>
        {humanNotes && (
          <div className="p-8">
            <div className="bg-landing-ivory rounded-xl p-4">
              <p className="text-[10px] uppercase tracking-wider font-medium text-landing-stone mb-2">
                Reviewer Notes
              </p>
              <p className="text-landing-charcoal">{humanNotes}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-landing-terracotta/20 overflow-hidden">
        <div className="px-8 py-6 border-b border-landing-charcoal/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-landing-terracotta/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium">
                Pending Validation
              </h2>
              <p className="text-sm text-landing-stone">
                Review the AI-generated snapshot and approve or reject it
              </p>
            </div>
          </div>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label
              htmlFor="notes"
              className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium mb-2"
            >
              Reviewer Notes (optional)
            </label>
            <textarea
              id="notes"
              placeholder="Add any notes, corrections, or observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowApproveModal(true)}
              disabled={isSubmitting}
              className="flex-1 h-12 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Approve Snapshot
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={isSubmitting}
              className="flex-1 h-12 border border-landing-terracotta/30 text-landing-terracotta text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-terracotta/5 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>

          <p className="text-xs text-landing-stone text-center">
            Teresa Torres: &quot;Expert + AI&quot; - AI raises the floor, but humans validate all insights.
          </p>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-landing-charcoal/50 backdrop-blur-sm"
            onClick={() => setShowApproveModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 m-4">
            <h3 className="text-xl font-light text-landing-charcoal mb-2">
              Approve this snapshot?
            </h3>
            <p className="text-landing-stone mb-6">
              Approving confirms that the AI-generated analysis is accurate
              and can be used for opportunity mapping.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="flex-1 h-10 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleValidation("approved")}
                disabled={isSubmitting}
                className="flex-1 h-10 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 disabled:opacity-50"
              >
                {isSubmitting ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-landing-charcoal/50 backdrop-blur-sm"
            onClick={() => setShowRejectModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 m-4">
            <h3 className="text-xl font-light text-landing-charcoal mb-2">
              Reject this snapshot?
            </h3>
            <p className="text-landing-stone mb-6">
              Rejecting marks this snapshot as needing review. Please add
              notes explaining what needs to be corrected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 h-10 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleValidation("rejected")}
                disabled={isSubmitting}
                className="flex-1 h-10 bg-landing-terracotta text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-terracotta/90 transition-all duration-300 disabled:opacity-50"
              >
                {isSubmitting ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
