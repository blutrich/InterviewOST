"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-gray-500 mt-1">
          Define your research goals and target audience
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Tell us about your discovery research project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Checkout Flow Research"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the project..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="research_goals">Research Goals *</Label>
              <Textarea
                id="research_goals"
                placeholder="What do you want to learn? e.g., Understand why users abandon the checkout process"
                value={formData.research_goals}
                onChange={(e) =>
                  setFormData({ ...formData, research_goals: e.target.value })
                }
                rows={3}
                required
              />
              <p className="text-xs text-gray-500">
                This will guide the AI in generating story-based interview
                questions.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Input
                id="target_audience"
                placeholder="e.g., E-commerce customers aged 25-45"
                value={formData.target_audience}
                onChange={(e) =>
                  setFormData({ ...formData, target_audience: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desired_outcome">Desired Outcome (OST Root)</Label>
              <Input
                id="desired_outcome"
                placeholder="e.g., Increase checkout conversion rate"
                value={formData.desired_outcome}
                onChange={(e) =>
                  setFormData({ ...formData, desired_outcome: e.target.value })
                }
              />
              <p className="text-xs text-gray-500">
                This becomes the root of your Opportunity Solution Tree.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select
                value={formData.model}
                onValueChange={(value) =>
                  setFormData({ ...formData, model: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                The AI model used for generating rubrics and conducting
                interviews.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  );
}
