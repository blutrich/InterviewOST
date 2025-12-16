"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Facts {
  role?: string;
  tools?: string[];
  frequency?: string;
  context?: string;
  other?: Record<string, unknown>;
}

interface FactsPanelProps {
  facts: Facts;
}

export function FactsPanel({ facts }: FactsPanelProps) {
  if (!facts || Object.keys(facts).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Facts Extracted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No facts extracted.</p>
        </CardContent>
      </Card>
    );
  }

  const hasAnyFacts =
    facts.role ||
    (facts.tools && facts.tools.length > 0) ||
    facts.frequency ||
    facts.context ||
    (facts.other && Object.keys(facts.other).length > 0);

  if (!hasAnyFacts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Facts Extracted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No specific facts were extracted from this interview.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Facts Extracted
        </CardTitle>
        <p className="text-sm text-gray-500">
          Objective information stated during the interview (separated from analysis)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {facts.role && (
            <FactItem
              icon="👤"
              label="Role / Title"
              value={facts.role}
            />
          )}

          {facts.tools && facts.tools.length > 0 && (
            <FactItem
              icon="🛠️"
              label="Tools & Products"
              value={
                <div className="flex flex-wrap gap-1">
                  {facts.tools.map((tool, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                </div>
              }
            />
          )}

          {facts.frequency && (
            <FactItem
              icon="📅"
              label="Frequency"
              value={facts.frequency}
            />
          )}

          {facts.context && (
            <FactItem
              icon="📍"
              label="Context"
              value={facts.context}
            />
          )}

          {facts.other && Object.keys(facts.other).length > 0 && (
            <div className="md:col-span-2">
              <FactItem
                icon="📝"
                label="Other Facts"
                value={
                  <div className="space-y-1">
                    {Object.entries(facts.other).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                }
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface FactItemProps {
  icon: string;
  label: string;
  value: React.ReactNode;
}

function FactItem({ icon, label, value }: FactItemProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
        <span>{icon}</span>
        {label}
      </div>
      <div className="text-gray-900 dark:text-gray-100">
        {typeof value === "string" ? value : value}
      </div>
    </div>
  );
}
