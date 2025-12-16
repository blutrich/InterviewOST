"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Rubric {
  introduction: string;
  topics: Array<{
    name: string;
    questions: Array<{
      id: string;
      question: string;
      followUps?: string[];
      probes?: string[];
      estimatedMinutes?: number;
    }>;
  }>;
  closing: string;
}

interface Template {
  id: string;
  name: string;
  version: number;
  rubric: Rubric;
  status: string;
  is_active: boolean;
  created_at: string;
  approved_at: string | null;
}

interface Props {
  projectId: string;
  initialTemplates: Template[];
  projectContext: {
    name: string;
    research_goals: string;
    target_audience: string | null;
    desired_outcome: string | null;
  };
}

export default function TemplatesClient({
  projectId,
  initialTemplates,
  projectContext,
}: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedRubric, setEditedRubric] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const generateTemplate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate template");
      }

      const newTemplate = await res.json();
      setTemplates([newTemplate, ...templates]);
      setSelectedTemplate(newTemplate);
    } catch (error) {
      console.error("Error generating template:", error);
      alert("Failed to generate template. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTemplate = async (
    templateId: string,
    updates: Partial<{ rubric: Rubric; status: string; is_active: boolean }>
  ) => {
    try {
      const res = await fetch("/api/templates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, ...updates }),
      });

      if (!res.ok) {
        throw new Error("Failed to update template");
      }

      const updatedTemplate = await res.json();
      setTemplates(
        templates.map((t) => (t.id === templateId ? updatedTemplate : t))
      );
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(updatedTemplate);
      }

      // If we activated a template, update others to inactive
      if (updates.is_active) {
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === templateId
              ? { ...t, is_active: true }
              : { ...t, is_active: false }
          )
        );
      }
    } catch (error) {
      console.error("Error updating template:", error);
      alert("Failed to update template. Please try again.");
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/templates?templateId=${templateId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete template");
      }

      setTemplates(templates.filter((t) => t.id !== templateId));
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template. Please try again.");
    }
    setDeleteConfirm(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedTemplate) return;

    try {
      const parsedRubric = JSON.parse(editedRubric);
      await updateTemplate(selectedTemplate.id, { rubric: parsedRubric });
      setIsEditing(false);
    } catch {
      alert("Invalid JSON. Please check your rubric format.");
    }
  };

  const getStatusBadge = (template: Template) => {
    if (template.is_active) {
      return <Badge className="bg-green-600">Active</Badge>;
    }
    if (template.status === "approved") {
      return <Badge variant="default">Approved</Badge>;
    }
    if (template.status === "pending_review") {
      return <Badge variant="secondary">Pending Review</Badge>;
    }
    return <Badge variant="outline">Draft</Badge>;
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Template List */}
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>
              {templates.length} template{templates.length !== 1 ? "s" : ""}{" "}
              created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={generateTemplate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate New Template"
              )}
            </Button>

            <Separator />

            {templates.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No templates yet. Generate your first one!
              </p>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? "border-primary"
                        : "hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{template.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(template.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {getStatusBadge(template)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Context */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Project Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-500">Research Goals</p>
              <p className="mt-1">{projectContext.research_goals}</p>
            </div>
            {projectContext.target_audience && (
              <div>
                <p className="font-medium text-gray-500">Target Audience</p>
                <p className="mt-1">{projectContext.target_audience}</p>
              </div>
            )}
            {projectContext.desired_outcome && (
              <div>
                <p className="font-medium text-gray-500">Desired Outcome</p>
                <p className="mt-1">{projectContext.desired_outcome}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Template Preview */}
      <div className="md:col-span-2">
        {selectedTemplate ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedTemplate.name}</CardTitle>
                  <CardDescription>
                    Created{" "}
                    {new Date(selectedTemplate.created_at).toLocaleDateString()}
                    {selectedTemplate.approved_at &&
                      ` | Approved ${new Date(selectedTemplate.approved_at).toLocaleDateString()}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedTemplate)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="preview">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="mt-4">
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-6">
                      {/* Introduction */}
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          Introduction
                        </h3>
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                          {selectedTemplate.rubric.introduction}
                        </p>
                      </div>

                      {/* Topics & Questions */}
                      {selectedTemplate.rubric.topics?.map((topic, idx) => (
                        <div key={idx}>
                          <h3 className="font-semibold text-lg mb-3">
                            {topic.name}
                          </h3>
                          <div className="space-y-4">
                            {topic.questions?.map((q, qIdx) => (
                              <div
                                key={q.id || qIdx}
                                className="border rounded-lg p-4"
                              >
                                <p className="font-medium text-blue-700">
                                  Q{qIdx + 1}: {q.question}
                                </p>
                                {q.estimatedMinutes && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    ~{q.estimatedMinutes} min
                                  </p>
                                )}
                                {q.followUps && q.followUps.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-600">
                                      Follow-ups:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                      {q.followUps.map((f, i) => (
                                        <li key={i}>{f}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {q.probes && q.probes.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-600">
                                      Probes:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 ml-2">
                                      {q.probes.map((p, i) => (
                                        <li key={i}>{p}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Closing */}
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Closing</h3>
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                          {selectedTemplate.rubric.closing}
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="json" className="mt-4">
                  <ScrollArea className="h-[500px]">
                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedTemplate.rubric, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedRubric(
                        JSON.stringify(selectedTemplate.rubric, null, 2)
                      );
                      setIsEditing(true);
                    }}
                  >
                    Edit Rubric
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => setDeleteConfirm(selectedTemplate.id)}
                  >
                    Delete
                  </Button>
                </div>
                <div className="flex gap-2">
                  {selectedTemplate.status === "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateTemplate(selectedTemplate.id, {
                          status: "approved",
                        })
                      }
                    >
                      Approve
                    </Button>
                  )}
                  {!selectedTemplate.is_active && (
                    <Button
                      size="sm"
                      onClick={() =>
                        updateTemplate(selectedTemplate.id, {
                          is_active: true,
                          status: "approved",
                        })
                      }
                    >
                      Set as Active
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center h-[600px]">
            <CardContent className="text-center">
              <p className="text-gray-500 mb-4">
                Select a template to preview or generate a new one
              </p>
              <Button onClick={generateTemplate} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Generate Template"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Rubric</DialogTitle>
            <DialogDescription>
              Edit the JSON rubric directly. Make sure to maintain valid JSON
              format.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={editedRubric}
            onChange={(e) => setEditedRubric(e.target.value)}
            className="font-mono text-sm h-[400px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              template and remove it from your project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteConfirm && deleteTemplate(deleteConfirm)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
