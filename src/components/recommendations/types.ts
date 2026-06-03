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
  // Owner assignment (migration 008)
  owner_email: string | null;
  owner_assigned_at: string | null;
  owner_assigned_by: string | null;
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

// Soft, single-accent design — one dot color + one muted text color per tier.
// Everything else (card body, borders, sections) stays neutral so the UI
// reads as enterprise/calm rather than rainbow-coded.
//
// All classes are written out in full so Tailwind's scanner picks them up.
export const TYPE_META: Record<
  RecommendationType,
  {
    label: string;
    tagline: string;
    /** Accent color used for the tier label text only. */
    accentTextClass: string;
    /** Tiny dot used as the only color cue in the collapsed card header. */
    accentDotClass: string;
  }
> = {
  solid: {
    label: "Solid Feature",
    tagline: "Practical · ships in weeks",
    accentTextClass: "text-emerald-700",
    accentDotClass: "bg-emerald-500",
  },
  bold: {
    label: "Bold Strategic",
    tagline: "Ambitious · 1–2 quarters",
    accentTextClass: "text-amber-700",
    accentDotClass: "bg-amber-500",
  },
  moonshot: {
    label: "Moonshot",
    tagline: "Breakthrough · trend-driven",
    accentTextClass: "text-purple-700",
    accentDotClass: "bg-purple-500",
  },
  standalone: {
    label: "Standalone Product",
    tagline: "Independent · spin-out potential",
    accentTextClass: "text-sky-700",
    accentDotClass: "bg-sky-500",
  },
};
