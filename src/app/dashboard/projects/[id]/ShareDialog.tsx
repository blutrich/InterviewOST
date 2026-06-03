"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, X, Loader2 } from "lucide-react";

interface Member {
  user_id: string;
  email: string;
  role: string;
  is_owner: boolean;
}

interface Props {
  projectId: string;
  currentUserEmail: string;
}

export function ShareDialog({ projectId, currentUserEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = members.find((m) => m.is_owner)?.email === currentUserEmail;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/members?projectId=${projectId}`);
      const data = await res.json();
      if (res.ok) setMembers(data.members || []);
      else setError(data.error || "Failed to load members");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) load();
    else {
      setEmail("");
      setError(null);
    }
  };

  const addMember = async () => {
    const value = email.trim();
    if (!value) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add member");
        return;
      }
      setEmail("");
      await load();
    } catch {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  };

  const removeMember = async (userId: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/projects/members?projectId=${projectId}&userId=${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to remove member");
        return;
      }
      await load();
    } catch {
      setError("Network error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Users className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            People you add can view and edit this project and all its interviews, snapshots, and opportunities.
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addMember();
            }}
            className="flex items-center gap-2"
          >
            <Input
              type="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={adding}
            />
            <Button type="submit" disabled={adding || !email.trim()} className="gap-1.5">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add
            </Button>
          </form>
        )}

        {error && <p className="text-sm text-landing-terracotta">{error}</p>}

        <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-landing-stone">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between rounded-lg border border-landing-charcoal/5 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-landing-charcoal truncate">{m.email}</p>
                  <p className="text-[11px] uppercase tracking-wider text-landing-stone">
                    {m.is_owner ? "Owner" : m.role}
                    {m.email === currentUserEmail ? " · you" : ""}
                  </p>
                </div>
                {isOwner && !m.is_owner && (
                  <button
                    onClick={() => removeMember(m.user_id)}
                    aria-label={`Remove ${m.email}`}
                    className="p-1 rounded-md text-landing-stone hover:bg-landing-stone/10 hover:text-landing-terracotta transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {!isOwner && !loading && (
          <p className="text-[11px] text-landing-stone">Only the project owner can add or remove members.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
