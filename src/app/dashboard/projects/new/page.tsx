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
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    research_goals: "",
    target_audience: "",
    desired_outcome: "",
    model: "anthropic/claude-3.5-sonnet",
  });

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

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl border border-landing-charcoal/5 p-8">
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-landing-terracotta font-medium mb-1">
              Project Details
            </p>
            <p className="text-sm text-landing-stone">
              Tell us about your discovery research project
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
