"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import VirtualInterviewer from "@/components/avatar/VirtualInterviewer";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  created_at: string;
}

interface Interview {
  id: string;
  project_id: string;
  template_id: string;
  status: string;
  participant_name: string | null;
}

export default function PublicInterviewPage() {
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();

  const [interview, setInterview] = useState<Interview | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Fetch interview by token
  useEffect(() => {
    async function fetchInterview() {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("access_token", token)
        .single();

      if (error || !data) {
        setError("Interview not found or has expired");
        setLoading(false);
        return;
      }

      if (data.status === "completed") {
        setIsCompleted(true);
        setInterview(data);
        setParticipantName(data.participant_name || "");
        // Load messages for completed interview
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("interview_id", data.id)
          .order("created_at", { ascending: true });
        if (msgs) setMessages(msgs);
        setLoading(false);
        return;
      }

      setInterview(data);
      setParticipantName(data.participant_name || "");

      // If participant name is already set (e.g. from /join page) AND
      // interview is still pending, we need to auto-start it
      if (data.participant_name && data.status === "pending") {
        setNameSubmitted(true);
        setLoading(false);
        // Auto-trigger the interview start (generates the opening line).
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              interviewId: data.id,
              token,
              message: `[SYSTEM] Interview started with participant: ${data.participant_name}`,
              isStart: true,
              participantName: data.participant_name,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to start interview chat");
          }

          const { data: newMessages } = await supabase
            .from("messages")
            .select("*")
            .eq("interview_id", data.id)
            .order("created_at", { ascending: true });

          if (newMessages) {
            setMessages(newMessages);
          }
        } catch (err) {
          console.error("Failed to auto-start interview:", err);
          setError("Failed to start the conversation. Please try again.");
          setNameSubmitted(false);
        }
        return;
      }

      // If name is set and interview is already active, just show the chat
      if (data.participant_name && data.status === "active") {
        setNameSubmitted(true);
      }

      setLoading(false);
    }

    fetchInterview();
  }, [token, supabase]);

  // Subscribe to new messages
  useEffect(() => {
    if (!interview) return;

    const currentInterview = interview;

    // Fetch existing messages
    async function fetchMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("interview_id", currentInterview.id)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data);
      }
    }

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${currentInterview.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `interview_id=eq.${currentInterview.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Avoid duplicates: check if message already exists (including temp messages with same content)
          setMessages((prev) => {
            const exists = prev.some(
              (m) => m.id === newMessage.id ||
                     (m.id.startsWith('temp-') && m.content === newMessage.content && m.role === newMessage.role)
            );
            if (exists) {
              // Replace temp message with real one
              return prev.map((m) =>
                m.id.startsWith('temp-') && m.content === newMessage.content && m.role === newMessage.role
                  ? newMessage
                  : m
              );
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [interview, supabase]);

  // Handle name submission
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;

    const currentInterview = interview;
    setError(null);
    setNameSubmitted(true);

    try {
      // Start the interview by sending the initial message.
      // /api/chat activates the interview server-side (bypasses RLS) AND
      // generates the agent's opening line, which we surface to the avatar.
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: currentInterview.id,
          token,
          message: `[SYSTEM] Interview started with participant: ${participantName || "Anonymous"}`,
          isStart: true,
          participantName: participantName || "Anonymous",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start interview chat");
      }

      const { data: newMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("interview_id", currentInterview.id)
        .order("created_at", { ascending: true });

      if (newMessages) {
        setMessages(newMessages);
      }
    } catch (err) {
      console.error("Failed to start interview:", err);
      setError("Failed to start the conversation. Please try again.");
      setNameSubmitted(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-landing-forest border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-landing-stone">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-landing-terracotta/10 mx-auto mb-8 flex items-center justify-center">
            <svg className="w-10 h-10 text-landing-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-landing-charcoal mb-4">
            Interview Unavailable
          </h1>
          <p className="text-landing-stone">{error}</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-landing-ivory grain p-8">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-landing-forest/10 mx-auto mb-8 flex items-center justify-center">
            <svg className="w-10 h-10 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-light text-landing-charcoal mb-4">
            Interview Complete
          </h1>
          <p className="text-landing-stone mb-8">
            Thank you for taking the time to share your experiences, {participantName || "participant"}!
            Your insights are incredibly valuable and will help us improve.
          </p>
          <p className="text-sm text-landing-stone/60">
            You can safely close this page now.
          </p>
        </div>
      </div>
    );
  }

  if (!nameSubmitted) {
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

          <div className="space-y-2 mb-10">
            <h1 className="text-3xl font-light text-landing-charcoal">
              Welcome to the interview
            </h1>
            <p className="text-landing-stone">
              Thank you for participating in our research. Your insights will help us improve our product.
            </p>
          </div>

          <form onSubmit={handleNameSubmit} className="space-y-6">
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
                placeholder="Enter your name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full h-12 px-4 bg-white border border-landing-charcoal/10 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300"
              />
              <p className="text-xs text-landing-stone">
                You can use a nickname or pseudonym if you prefer.
              </p>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300"
            >
              Start Interview
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Avatar interview. The Interviewer agent generated its opening line
  // server-side during the name-submission step (handleNameSubmit -> POST
  // /api/chat with isStart:true). We surface that opening to the avatar so
  // it can speak it without firing a second isStart call.
  const opening =
    messages.find((m) => m.role === "assistant")?.content ?? "";

  return (
    <div className="min-h-screen bg-landing-ivory grain">
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-md">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <VirtualInterviewer
        interviewId={interview!.id}
        token={token}
        participantName={participantName || null}
        openingMessage={opening}
        personaName="Interviewer"
        onComplete={() => setIsCompleted(true)}
      />
    </div>
  );
}
