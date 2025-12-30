"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { nanoid } from "nanoid";

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface Template {
  id: string;
  name: string;
  project_id: string;
  share_token: string;
  projects: Project;
}

export default function JoinInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const shareToken = params.shareToken as string;
  const supabase = createClient();

  const [template, setTemplate] = useState<Template | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch template by share_token
  useEffect(() => {
    async function fetchTemplate() {
      const { data, error } = await supabase
        .from("templates")
        .select("id, name, project_id, share_token, projects(id, name, description)")
        .eq("share_token", shareToken)
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setError("This interview link is invalid or has expired.");
        setLoading(false);
        return;
      }

      // Normalize projects to single object (Supabase returns array for .single())
      const normalizedData = {
        ...data,
        projects: Array.isArray(data.projects) ? data.projects[0] : data.projects,
      };
      setTemplate(normalizedData as Template);
      setLoading(false);
    }

    fetchTemplate();
  }, [shareToken, supabase]);

  // Handle joining - create new interview and redirect
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setJoining(true);
    setError(null);

    try {
      // Generate unique access token for this participant
      const accessToken = nanoid(12);

      // Create new interview
      const { data: interview, error: createError } = await supabase
        .from("interviews")
        .insert({
          project_id: template.project_id,
          template_id: template.id,
          access_token: accessToken,
          participant_name: participantName.trim() || null,
          status: "pending",
        })
        .select("id, access_token")
        .single();

      if (createError || !interview) {
        throw new Error("Failed to create interview session");
      }

      // Redirect to the interview page
      router.push(`/i/${interview.access_token}`);
    } catch (err) {
      console.error("Failed to join interview:", err);
      setError("Failed to start your interview. Please try again.");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-landing-forest border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-landing-stone">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-landing-terracotta/10 mx-auto mb-8 flex items-center justify-center">
            <svg className="w-10 h-10 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-landing-charcoal mb-4">
            Link Unavailable
          </h1>
          <p className="text-landing-stone">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-lg bg-landing-forest flex items-center justify-center">
            <span className="text-white font-serif text-xl font-medium">D</span>
          </div>
          <span className="text-landing-charcoal font-medium tracking-tight">Discovery Co-Pilot</span>
        </div>

        {/* Project Info */}
        <div className="space-y-2 mb-10">
          <p className="text-[11px] uppercase tracking-[0.15em] text-landing-forest font-medium">
            Research Interview
          </p>
          <h1 className="text-3xl font-light text-landing-charcoal">
            {template.projects?.name || "Interview"}
          </h1>
          {template.projects?.description && (
            <p className="text-landing-stone">
              {template.projects.description}
            </p>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl border border-landing-charcoal/5 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-landing-forest/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-landing-charcoal mb-1">What to expect</h3>
              <p className="text-sm text-landing-stone">
                You&apos;ll have a conversation with our AI interviewer about your experiences.
                This typically takes 10-15 minutes. Your responses help us build better products.
              </p>
            </div>
          </div>
        </div>

        {/* Join Form */}
        <form onSubmit={handleJoin} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium"
            >
              Your Name (Optional)
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name or nickname"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              maxLength={100}
              disabled={joining}
              className="w-full h-12 px-4 bg-white border border-landing-charcoal/10 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300 disabled:opacity-50"
            />
            <p className="text-xs text-landing-stone">
              You can use a nickname or pseudonym if you prefer.
            </p>
          </div>

          <button
            type="submit"
            disabled={joining}
            className="w-full h-12 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {joining ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start Interview
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Privacy Note */}
        <p className="text-center text-xs text-landing-stone/60 mt-8">
          Your responses are confidential and used only for research purposes.
        </p>
      </div>
    </div>
  );
}
