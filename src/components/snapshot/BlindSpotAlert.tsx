"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlindSpot {
  observation: string;
  suggestion: string;
  severity: "low" | "medium" | "high";
}

interface BlindSpotAlertProps {
  blindSpots: BlindSpot[];
}

export function BlindSpotAlert({ blindSpots }: BlindSpotAlertProps) {
  if (!blindSpots || blindSpots.length === 0) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            Blind Spots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>No significant blind spots detected. Great interview!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedBlindSpots = [...blindSpots].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const highCount = blindSpots.filter((b) => b.severity === "high").length;
  const borderClass =
    highCount > 0
      ? "border-red-200 dark:border-red-800"
      : "border-amber-200 dark:border-amber-800";

  return (
    <Card className={borderClass}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            Blind Spots
          </div>
          <div className="flex gap-1">
            {blindSpots.filter((b) => b.severity === "high").length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {blindSpots.filter((b) => b.severity === "high").length} High
              </Badge>
            )}
            {blindSpots.filter((b) => b.severity === "medium").length > 0 && (
              <Badge
                variant="secondary"
                className="text-xs bg-amber-100 text-amber-800"
              >
                {blindSpots.filter((b) => b.severity === "medium").length} Medium
              </Badge>
            )}
          </div>
        </CardTitle>
        <p className="text-sm text-gray-500">
          Opportunities that were missed during the interview
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedBlindSpots.map((blindSpot, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 ${getSeverityBgColor(blindSpot.severity)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{getSeverityIcon(blindSpot.severity)}</span>
                    <Badge
                      variant="outline"
                      className={getSeverityBadgeClass(blindSpot.severity)}
                    >
                      {blindSpot.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {blindSpot.observation}
                  </p>
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="shrink-0">💡</span>
                    <span>{blindSpot.suggestion}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {highCount > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Recommendation:</strong> Consider scheduling a follow-up
              interview to explore the high-severity blind spots.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getSeverityBgColor(severity: string): string {
  switch (severity) {
    case "high":
      return "bg-red-50 dark:bg-red-900/20";
    case "medium":
      return "bg-amber-50 dark:bg-amber-900/20";
    case "low":
      return "bg-gray-50 dark:bg-gray-800";
    default:
      return "bg-gray-50 dark:bg-gray-800";
  }
}

function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case "high":
      return "border-red-500 text-red-600";
    case "medium":
      return "border-amber-500 text-amber-600";
    case "low":
      return "border-gray-400 text-gray-500";
    default:
      return "border-gray-400 text-gray-500";
  }
}

function getSeverityIcon(severity: string): string {
  switch (severity) {
    case "high":
      return "🚨";
    case "medium":
      return "⚠️";
    case "low":
      return "💭";
    default:
      return "💭";
  }
}
