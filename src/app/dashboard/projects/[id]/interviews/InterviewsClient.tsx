"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Check, X } from "lucide-react";

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
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [createMode, setCreateMode] = useState<"live" | "import">("live");
  const [transcript, setTranscript] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importedId, setImportedId] = useState<string | null>(null);

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

  const importTranscript = async () => {
    setIsImporting(true);
    try {
      const res = await fetch("/api/interviews/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          participantName: participantName || undefined,
          transcript,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to import transcript");
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
      setImportedId(newInterview.id);
      setParticipantName("");
      setTranscript("");
    } catch (error) {
      console.error("Error importing transcript:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to import transcript. Please try again."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
    setCreatedLink(null);
    setImportedId(null);
    setCreateMode("live");
    setTranscript("");
    setParticipantName("");
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

  const saveInterviewName = async (interviewId: string) => {
    const name = nameDraft.trim();
    if (!name) return;
    setSavingName(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewId, participantName: name }),
      });
      if (!res.ok) throw new Error("Failed to rename interview");
      const updated = await res.json();
      setInterviews(
        interviews.map((i) => (i.id === interviewId ? { ...i, ...updated } : i))
      );
      setEditingNameId(null);
    } catch (error) {
      console.error("Error renaming interview:", error);
      alert("Failed to rename interview. Please try again.");
    } finally {
      setSavingName(false);
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-landing-forest/10 text-landing-forest";
      case "active":
        return "bg-landing-terracotta/10 text-landing-terracotta";
      case "abandoned":
        return "bg-red-100 text-red-700";
      default:
        return "bg-landing-stone/10 text-landing-stone";
    }
  };

  const getSnapshotStyle = (status: string | null) => {
    switch (status) {
      case "approved":
        return "border-landing-forest text-landing-forest";
      case "pending":
        return "border-landing-terracotta text-landing-terracotta";
      default:
        return "border-landing-stone text-landing-stone";
    }
  };

  // Stats
  const stats = [
    { label: "Total", value: interviews.length, color: "text-landing-charcoal" },
    { label: "Completed", value: interviews.filter((i) => i.status === "completed").length, color: "text-landing-forest" },
    { label: "In Progress", value: interviews.filter((i) => i.status === "active").length, color: "text-landing-terracotta" },
    { label: "Pending", value: interviews.filter((i) => i.status === "pending").length, color: "text-landing-stone" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl border border-landing-charcoal/5 p-6">
            <p className="text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-2">
              {stat.label}
            </p>
            <p className={`text-3xl font-light ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Create Button and Warning */}
      <div className="flex items-center justify-between">
        <div>
          {!hasTemplates && (
            <p className="text-landing-terracotta text-sm">
              No templates yet.{" "}
              <Link
                href={`/dashboard/projects/${projectId}/templates`}
                className="underline hover:text-landing-terracotta/80 transition-colors"
              >
                Create a template
              </Link>{" "}
              first for better interview structure.
            </p>
          )}
          {hasTemplates && !activeTemplate && (
            <p className="text-landing-terracotta text-sm">
              No active template.{" "}
              <Link
                href={`/dashboard/projects/${projectId}/templates`}
                className="underline hover:text-landing-terracotta/80 transition-colors"
              >
                Set an active template
              </Link>{" "}
              for the best results.
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="h-10 px-6 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Interview
        </button>
      </div>

      {/* Interviews List */}
      {interviews.length === 0 ? (
        <div className="relative bg-white rounded-3xl border border-landing-charcoal/5 p-12 text-center overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full border border-landing-forest/10" />
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-landing-forest/5 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h3 className="text-xl font-light text-landing-charcoal mb-2">No interviews yet</h3>
            <p className="text-landing-stone mb-6">Create your first interview to start gathering insights.</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="h-10 px-6 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300"
            >
              Create Your First Interview
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-landing-charcoal/5 overflow-hidden">
          {interviews.map((interview, index) => (
            <div
              key={interview.id}
              className="flex items-center justify-between px-6 py-5 border-b border-landing-charcoal/5 last:border-0 hover:bg-landing-ivory/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-[11px] uppercase tracking-[0.2em] text-landing-stone/60 w-6">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    {editingNameId === interview.id ? (
                      <span className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={nameDraft}
                          onChange={(e) => setNameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveInterviewName(interview.id);
                            else if (e.key === "Escape") setEditingNameId(null);
                          }}
                          maxLength={100}
                          disabled={savingName}
                          className="font-medium text-landing-charcoal bg-transparent border-b border-landing-forest/40 focus:border-landing-forest outline-none min-w-[12rem]"
                        />
                        <button
                          onClick={() => saveInterviewName(interview.id)}
                          disabled={savingName}
                          aria-label="Save name"
                          className="p-1 rounded text-landing-forest hover:bg-landing-forest/10 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingNameId(null)}
                          disabled={savingName}
                          aria-label="Cancel"
                          className="p-1 rounded text-landing-stone hover:bg-landing-stone/10 disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ) : (
                      <span className="group/name flex items-center gap-1.5">
                        <p className="font-medium text-landing-charcoal">
                          {interview.participant_name || "Anonymous Participant"}
                        </p>
                        <button
                          onClick={() => {
                            setEditingNameId(interview.id);
                            setNameDraft(interview.participant_name || "");
                          }}
                          aria-label="Edit name"
                          className="p-1 rounded text-landing-stone opacity-0 group-hover/name:opacity-100 hover:bg-landing-stone/10 transition-all"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full ${getStatusStyle(interview.status)}`}>
                      {interview.status}
                    </span>
                    {interview.has_snapshot && (
                      <span className={`text-[10px] uppercase tracking-wider font-medium px-2.5 py-1 rounded-full border ${getSnapshotStyle(interview.snapshot_status)}`}>
                        {interview.snapshot_status === "approved" ? "Analyzed" : "Needs Review"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-landing-stone">
                    <span>
                      {new Date(interview.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    {interview.template_name && (
                      <span className="text-landing-forest">
                        {interview.template_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {interview.status === "pending" && (
                  <button
                    onClick={() => copyLink(interview.access_token)}
                    className="h-8 px-4 border border-landing-charcoal/10 text-landing-charcoal text-[11px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-white transition-all duration-300"
                  >
                    {copiedId === interview.access_token ? "Copied!" : "Copy Link"}
                  </button>
                )}
                {interview.status === "active" && (
                  <button
                    onClick={() => updateInterviewStatus(interview.id, "completed")}
                    className="h-8 px-4 border border-landing-forest/20 text-landing-forest text-[11px] uppercase tracking-wider font-medium rounded-full hover:border-landing-forest/40 hover:bg-landing-forest/5 transition-all duration-300"
                  >
                    Mark Complete
                  </button>
                )}
                {interview.status === "completed" && (
                  <Link
                    href={`/dashboard/projects/${projectId}/interviews/${interview.id}/snapshot`}
                    className="h-8 px-4 bg-landing-forest/10 text-landing-forest text-[11px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest/20 transition-all duration-300 flex items-center"
                  >
                    {interview.has_snapshot ? "View Snapshot" : "Analyze"}
                  </Link>
                )}
                <Link
                  href={`/dashboard/projects/${projectId}/interviews/${interview.id}`}
                  className="h-8 px-4 border border-landing-charcoal/10 text-landing-charcoal text-[11px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-white transition-all duration-300 flex items-center"
                >
                  View
                </Link>
                <button
                  onClick={() => setDeleteConfirm(interview.id)}
                  className="h-8 px-4 text-landing-terracotta text-[11px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-terracotta/5 transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Interview Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-landing-charcoal/50 backdrop-blur-sm" onClick={() => !createdLink && !importedId && closeCreateDialog()} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 m-4">
            <h2 className="text-2xl font-light text-landing-charcoal mb-2">
              {createdLink ? "Interview Created" : importedId ? "Transcript Imported" : "New Interview"}
            </h2>
            <p className="text-sm text-landing-stone mb-6">
              {createdLink
                ? "Share this link with your participant."
                : importedId
                  ? "Saved as a completed interview. Generate the snapshot to map it onto your tree."
                  : createMode === "import"
                    ? "Paste an existing transcript — no live interview needed."
                    : activeTemplate
                      ? `Using template: ${activeTemplate.name}`
                      : "No active template selected."}
            </p>

            {createdLink ? (
              <>
                <div className="space-y-2 mb-6">
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium">
                    Interview Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={createdLink}
                      readOnly
                      className="flex-1 h-12 px-4 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal font-mono text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdLink);
                        setCopiedId("new");
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="h-12 px-4 border border-landing-charcoal/10 text-landing-charcoal text-[11px] uppercase tracking-wider font-medium rounded-xl hover:border-landing-charcoal/30 hover:bg-landing-mist transition-all duration-300"
                    >
                      {copiedId === "new" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
                <button
                  onClick={closeCreateDialog}
                  className="w-full h-11 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300"
                >
                  Done
                </button>
              </>
            ) : importedId ? (
              <div className="flex gap-3">
                <button
                  onClick={closeCreateDialog}
                  className="flex-1 h-11 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-landing-mist transition-all duration-300"
                >
                  Done
                </button>
                <Link
                  href={`/dashboard/projects/${projectId}/interviews/${importedId}/snapshot`}
                  className="flex-1 h-11 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 flex items-center justify-center"
                >
                  Analyze
                </Link>
              </div>
            ) : (
              <>
                {/* Mode toggle */}
                <div className="flex gap-1 mb-5 p-1 bg-landing-ivory rounded-full border border-landing-charcoal/10">
                  {(["live", "import"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setCreateMode(m)}
                      className={`flex-1 h-9 text-[12px] uppercase tracking-wider font-medium rounded-full transition-all duration-300 ${
                        createMode === m
                          ? "bg-landing-forest text-white"
                          : "text-landing-stone hover:text-landing-charcoal"
                      }`}
                    >
                      {m === "live" ? "Live link" : "Import transcript"}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 mb-4">
                  <label className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium">
                    Participant Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter participant name..."
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="w-full h-12 px-4 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300"
                  />
                </div>

                {createMode === "import" ? (
                  <div className="space-y-2 mb-6">
                    <label className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium">
                      Transcript
                    </label>
                    <textarea
                      placeholder={"Paste the interview transcript here...\n\nName: ...\nInterviewer: ..."}
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal text-sm placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300 resize-y"
                    />
                    <p className="text-xs text-landing-stone">
                      Saved as a completed interview — then generate the snapshot. Speaker labels like &ldquo;Name:&rdquo; are detected automatically.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-landing-stone mb-6">
                    Participants can enter their name when they join.
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={closeCreateDialog}
                    className="flex-1 h-11 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-landing-mist transition-all duration-300"
                  >
                    Cancel
                  </button>
                  {createMode === "live" ? (
                    <button
                      onClick={createInterview}
                      disabled={isCreating}
                      className="flex-1 h-11 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 disabled:opacity-50"
                    >
                      {isCreating ? "Creating..." : "Create"}
                    </button>
                  ) : (
                    <button
                      onClick={importTranscript}
                      disabled={isImporting || transcript.trim().length < 20}
                      className="flex-1 h-11 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 disabled:opacity-50"
                    >
                      {isImporting ? "Importing..." : "Import"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-landing-charcoal/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 m-4">
            <div className="w-12 h-12 rounded-full bg-landing-terracotta/10 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-6 h-6 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-landing-charcoal text-center mb-2">
              Delete Interview?
            </h2>
            <p className="text-sm text-landing-stone text-center mb-6">
              This action cannot be undone. All messages and snapshots will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-11 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-landing-mist transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteInterview(deleteConfirm)}
                className="flex-1 h-11 bg-landing-terracotta text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-terracotta/90 transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
