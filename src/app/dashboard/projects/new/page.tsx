"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { availableModels } from "@/lib/openrouter";

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiDescription, setAiDescription] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    research_goals: "",
    target_audience: "",
    desired_outcome: "",
    model: "anthropic/claude-3.5-sonnet",
  });

  const handleGenerate = async () => {
    if (!aiDescription.trim()) {
      setError("Please describe what you want to research");
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const response = await fetch("/api/projects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate project");
        return;
      }

      // Fill in the form with generated data
      setFormData((prev) => ({
        ...prev,
        name: data.project.name,
        research_goals: data.project.research_goals,
        target_audience: data.project.target_audience,
        desired_outcome: data.project.desired_outcome,
      }));
    } catch {
      setError("Failed to generate project. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be logged in to create a project");
        return;
      }

      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          research_goals: formData.research_goals,
          target_audience: formData.target_audience,
          desired_outcome: formData.desired_outcome,
          model: formData.model,
          status: "draft",
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      router.push(`/dashboard/projects/${data.id}`);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-landing-stone mb-4">
          <Link href="/dashboard" className="hover:text-landing-charcoal transition-colors">
            Projects
          </Link>
          <span className="text-landing-stone/40">/</span>
          <span className="text-landing-charcoal">New Project</span>
        </div>

        <h1 className="text-4xl font-light text-landing-charcoal tracking-tight">
          Create New Project
        </h1>
        <p className="text-landing-stone mt-2">
          Define your research goals and target audience
        </p>
      </div>

      {/* AI Generation Section */}
      <div className="bg-gradient-to-br from-landing-forest/5 to-landing-sage/10 rounded-2xl border border-landing-forest/20 p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-landing-forest/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-landing-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-landing-charcoal">
              AI Project Assistant
            </h2>
            <p className="text-sm text-landing-stone mt-1">
              Describe what you want to research in plain language and let AI fill in the details
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            placeholder="Example: I want to understand why users abandon their shopping cart before completing checkout..."
            value={aiDescription}
            onChange={(e) => setAiDescription(e.target.value)}
            rows={3}
            disabled={generating}
            className="w-full px-4 py-3 bg-white border border-landing-forest/20 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300 resize-none disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !aiDescription.trim()}
            className="h-11 px-6 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generate with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-landing-charcoal/10" />
        <span className="text-[11px] uppercase tracking-[0.15em] text-landing-stone">
          or fill in manually
        </span>
        <div className="flex-1 h-px bg-landing-charcoal/10" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-landing-charcoal/5 p-8">
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-1">
              Project Details
            </p>
            <p className="text-sm text-landing-stone">
              Review and customize your research project
            </p>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-landing-terracotta/10 border border-landing-terracotta/20 rounded-xl">
                <p className="text-sm text-landing-terracotta">{error}</p>
              </div>
            )}

            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium">
                Project Name *
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g., Checkout Flow Research"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full h-12 px-4 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium">
                Description
              </label>
              <textarea
                id="description"
                placeholder="Brief description of the project..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300 resize-none"
              />
            </div>

            {/* Research Goals */}
            <div className="space-y-2">
              <label htmlFor="research_goals" className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium">
                Research Goals *
              </label>
              <textarea
                id="research_goals"
                placeholder="What do you want to learn? e.g., Understand why users abandon the checkout process"
                value={formData.research_goals}
                onChange={(e) => setFormData({ ...formData, research_goals: e.target.value })}
                rows={3}
                required
                className="w-full px-4 py-3 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300 resize-none"
              />
              <p className="text-xs text-landing-stone">
                This will guide the AI in generating story-based interview questions.
              </p>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <label htmlFor="target_audience" className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium">
                Target Audience
              </label>
              <input
                id="target_audience"
                type="text"
                placeholder="e.g., E-commerce customers aged 25-45"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                className="w-full h-12 px-4 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300"
              />
            </div>

            {/* Desired Outcome */}
            <div className="space-y-2">
              <label htmlFor="desired_outcome" className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium">
                Desired Outcome (OST Root)
              </label>
              <input
                id="desired_outcome"
                type="text"
                placeholder="e.g., Increase checkout conversion rate"
                value={formData.desired_outcome}
                onChange={(e) => setFormData({ ...formData, desired_outcome: e.target.value })}
                className="w-full h-12 px-4 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal placeholder:text-landing-stone/50 focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300"
              />
              <p className="text-xs text-landing-stone">
                This becomes the root of your Opportunity Solution Tree.
              </p>
            </div>

            {/* AI Model */}
            <div className="space-y-2">
              <label htmlFor="model" className="block text-[11px] uppercase tracking-[0.15em] text-landing-charcoal font-medium">
                AI Model
              </label>
              <div className="relative">
                <select
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full h-12 px-4 bg-landing-ivory border border-landing-charcoal/10 rounded-xl text-landing-charcoal focus:outline-none focus:border-landing-forest focus:ring-2 focus:ring-landing-forest/10 transition-all duration-300 appearance-none cursor-pointer"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-landing-stone pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <p className="text-xs text-landing-stone">
                The AI model used for generating rubrics and conducting interviews.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="h-11 px-6 border border-landing-charcoal/10 text-landing-charcoal text-[12px] uppercase tracking-wider font-medium rounded-full hover:border-landing-charcoal/30 hover:bg-white transition-all duration-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-11 px-8 bg-landing-forest text-white text-[12px] uppercase tracking-wider font-medium rounded-full hover:bg-landing-forest-light transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
