export type RecommendationType = "solid" | "bold" | "moonshot" | "standalone";

export type RecommendationStatus = "pending" | "approved" | "rejected";

export interface Recommendation {
  id: string;
  project_id: string;
  opportunity_id: string;
  type: RecommendationType;
  title: string;
  explanation: string;
  rationale: string;
  supporting_examples: string[];
  expected_value: string;
  call_to_action: string;
  status: RecommendationStatus;
  human_notes: string | null;
  validated_at: string | null;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  evidence_count: number;
}

export const RECOMMENDATION_ORDER: RecommendationType[] = [
  "solid",
  "bold",
  "moonshot",
  "standalone",
];

// Classes are written out in full so Tailwind's scanner can see them at build
// time. Constructing class strings dynamically (e.g. with `.split()`) defeats
// Tailwind's tree-shaking and the colors won't render in production.
export const TYPE_META: Record<
  RecommendationType,
  {
    label: string;
    tagline: string;
    textClass: string;
    borderClass: string;
    bgClass: string;
  }
> = {
  solid: {
    label: "Solid Feature",
    tagline: "Practical · close to current direction · ship in weeks",
    textClass: "text-emerald-700",
    borderClass: "border-emerald-300",
    bgClass: "bg-emerald-50",
  },
  bold: {
    label: "Bold Strategic",
    tagline: "Ambitious · competitor-aware · 1–2 quarters",
    textClass: "text-amber-700",
    borderClass: "border-amber-300",
    bgClass: "bg-amber-50",
  },
  moonshot: {
    label: "Moonshot",
    tagline: "Breakthrough · trend-driven · new audience",
    textClass: "text-purple-700",
    borderClass: "border-purple-300",
    bgClass: "bg-purple-50",
  },
  standalone: {
    label: "Standalone Product",
    tagline: "Independent · spin-out potential · shared core only",
    textClass: "text-blue-700",
    borderClass: "border-blue-300",
    bgClass: "bg-blue-50",
  },
};
