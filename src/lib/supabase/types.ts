export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          research_goals: string;
          target_audience: string | null;
          desired_outcome: string | null;
          model: string;
          settings: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          research_goals: string;
          target_audience?: string | null;
          desired_outcome?: string | null;
          model?: string;
          settings?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          research_goals?: string;
          target_audience?: string | null;
          desired_outcome?: string | null;
          model?: string;
          settings?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      templates: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          version: number;
          rubric: Json;
          status: string;
          is_active: boolean;
          created_at: string;
          approved_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          version?: number;
          rubric: Json;
          status?: string;
          is_active?: boolean;
          created_at?: string;
          approved_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          version?: number;
          rubric?: Json;
          status?: string;
          is_active?: boolean;
          created_at?: string;
          approved_at?: string | null;
        };
      };
      interviews: {
        Row: {
          id: string;
          template_id: string;
          project_id: string;
          access_token: string;
          participant_name: string | null;
          status: string;
          transcript: Json | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          project_id: string;
          access_token: string;
          participant_name?: string | null;
          status?: string;
          transcript?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          template_id?: string;
          project_id?: string;
          access_token?: string;
          participant_name?: string | null;
          status?: string;
          transcript?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          interview_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          interview_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
      };
      snapshots: {
        Row: {
          id: string;
          interview_id: string;
          experience_map: Json | null;
          quote_reel: Json | null;
          facts: Json | null;
          blind_spots: Json | null;
          status: string;
          human_notes: string | null;
          validated_at: string | null;
          validated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          interview_id: string;
          experience_map?: Json | null;
          quote_reel?: Json | null;
          facts?: Json | null;
          blind_spots?: Json | null;
          status?: string;
          human_notes?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          interview_id?: string;
          experience_map?: Json | null;
          quote_reel?: Json | null;
          facts?: Json | null;
          blind_spots?: Json | null;
          status?: string;
          human_notes?: string | null;
          validated_at?: string | null;
          validated_by?: string | null;
          created_at?: string;
        };
      };
      opportunities: {
        Row: {
          id: string;
          project_id: string;
          parent_id: string | null;
          title: string;
          description: string | null;
          type: string;
          evidence_count: number;
          status: string;
          position: Json;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          parent_id?: string | null;
          title: string;
          description?: string | null;
          type?: string;
          evidence_count?: number;
          status?: string;
          position?: Json;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          parent_id?: string | null;
          title?: string;
          description?: string | null;
          type?: string;
          evidence_count?: number;
          status?: string;
          position?: Json;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      evidence: {
        Row: {
          id: string;
          opportunity_id: string;
          snapshot_id: string;
          interview_id: string;
          quote: string;
          context: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          opportunity_id: string;
          snapshot_id: string;
          interview_id: string;
          quote: string;
          context?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          opportunity_id?: string;
          snapshot_id?: string;
          interview_id?: string;
          quote?: string;
          context?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Helper types for Teresa Torres framework
export interface ExperienceMapStep {
  step: number;
  action: string;
  feeling: string;
  timestamp?: string;
}

export interface QuoteReelItem {
  quote: string;
  context: string;
  emotion: string;
  message_id?: string;
}

export interface BlindSpot {
  observation: string;
  suggestion: string;
  severity: "low" | "medium" | "high";
}

export interface RubricQuestion {
  id: string;
  question: string;
  followUps: string[];
  probes: string[];
  estimatedMinutes: number;
}

export interface RubricTopic {
  name: string;
  questions: RubricQuestion[];
}

export interface Rubric {
  introduction: string;
  topics: RubricTopic[];
  closing: string;
}
