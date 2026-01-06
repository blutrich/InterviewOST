"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setNameSubmitted(!!data.participant_name);
      setParticipantName(data.participant_name || "");
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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle name submission
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;

    const currentInterview = interview;
    setError(null);
    setNameSubmitted(true);
    setSending(true); // Show loading indicator

    try {
      // Start the interview by sending initial message
      // The API will handle status update and participant name (bypasses RLS)
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

      // Fetch messages after the API call completes (backup for realtime)
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
      setNameSubmitted(false); // Allow retry
    } finally {
      setSending(false);
    }
  };

  // Handle sending message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !interview || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistically add user message
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: interview.id,
          token,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Fetch messages after API call (backup for realtime)
      const { data: newMessages } = await supabase
        .from("messages")
        .select("*")
        .eq("interview_id", interview.id)
        .order("created_at", { ascending: true });

      if (newMessages) {
        setMessages(newMessages);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove the optimistic message and show error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setError("Failed to send message. Please try again.");
      setInput(userMessage); // Restore the input so user can retry
    } finally {
      setSending(false);
      inputRef.current?.focus();
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

  return (
    <div className="min-h-screen flex flex-col bg-landing-ivory grain">
      {/* Error Toast */}
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

      {/* Header */}
      <header className="sticky top-0 z-10 bg-landing-ivory/80 backdrop-blur-xl border-b border-landing-charcoal/5 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-landing-forest flex items-center justify-center">
              <span className="text-white font-serif text-sm font-medium">D</span>
            </div>
            <div>
              <p className="font-medium text-landing-charcoal text-sm">Research Interview</p>
              <p className="text-xs text-landing-stone">
                {participantName || "Anonymous"}
              </p>
            </div>
          </div>
          <span className="text-[11px] uppercase tracking-wider text-landing-stone">
            {messages.length} messages
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  message.role === "user"
                    ? "bg-landing-forest text-white"
                    : "bg-white border border-landing-charcoal/5 text-landing-charcoal"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-landing-charcoal/5 rounded-2xl px-5 py-3">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-landing-stone/40 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-landing-stone/40 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-landing-stone/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-landing-ivory/80 backdrop-blur-xl border-t border-landing-charcoal/5 px-4 py-4">
        <form
          onSubmit={handleSend}
          className="max-w-2xl mx-auto flex items-center gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your response..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="flex-1 h-12 px-5 bg-white border border-landing-charcoal/10 rounded-full text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="h-12 px-6 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Send
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
