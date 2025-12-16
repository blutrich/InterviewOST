"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    if (!participantName.trim() || !interview) return;

    const currentInterview = interview;

    await supabase
      .from("interviews")
      .update({
        participant_name: participantName,
        status: "active",
        started_at: new Date().toISOString(),
      })
      .eq("id", currentInterview.id);

    setNameSubmitted(true);
    setSending(true); // Show loading indicator

    // Start the interview by sending initial message
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interviewId: currentInterview.id,
        token,
        message: `[SYSTEM] Interview started with participant: ${participantName}`,
        isStart: true,
      }),
    });

    // Fetch messages after the API call completes (backup for realtime)
    const { data: newMessages } = await supabase
      .from("messages")
      .select("*")
      .eq("interview_id", currentInterview.id)
      .order("created_at", { ascending: true });

    if (newMessages) {
      setMessages(newMessages);
    }
    setSending(false);
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
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-red-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Interview Unavailable</h2>
            <p className="text-gray-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-green-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Interview Complete</h2>
            <p className="text-gray-500 mb-4">
              Thank you for taking the time to share your experiences, {participantName || "participant"}!
              Your insights are incredibly valuable and will help us improve.
            </p>
            <p className="text-sm text-gray-400">
              You can safely close this page now.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!nameSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Welcome to the Interview</CardTitle>
            <CardDescription>
              Thank you for participating in our research. Your insights will
              help us improve our product.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleNameSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Your Name (optional)
                </label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  You can use a nickname or pseudonym if you prefer.
                </p>
              </div>
              <Button type="submit" className="w-full">
                Start Interview
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-semibold">Research Interview</h1>
            <p className="text-sm text-gray-500">
              {participantName || "Anonymous"}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {messages.length} messages
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-2xl mx-auto py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-200 dark:bg-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-gray-800 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="sticky bottom-0 bg-white dark:bg-gray-950 border-t px-4 py-3">
        <form
          onSubmit={handleSend}
          className="max-w-2xl mx-auto flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            placeholder="Type your response..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
