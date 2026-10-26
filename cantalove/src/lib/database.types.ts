export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
// Hand-written to mirror supabase/schema.sql. Keep in sync when the schema changes.
export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string;
          created_at: string;
          status: string;
          tier: string | null;
          amount: number | null;
          mp_payment_id: string | null;
          mp_preference_id: string | null;
          contact_email: string | null;
          first_play_at: string | null;
          first_download_grant_at: string | null;
          brand: string;
          request_key: string | null;
          consent_at: string | null;
          payment_status: string;
          delivery_email_sent_at: string | null;
          delivery_email_first_attempt_at: string | null;
          delivery_claimed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          status?: string;
          tier?: string | null;
          amount?: number | null;
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          contact_email?: string | null;
          first_play_at?: string | null;
          first_download_grant_at?: string | null;
          brand?: string;
          request_key?: string | null;
          consent_at?: string | null;
          payment_status?: string;
          delivery_email_sent_at?: string | null;
          delivery_email_first_attempt_at?: string | null;
          delivery_claimed_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          status?: string;
          tier?: string | null;
          amount?: number | null;
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          contact_email?: string | null;
          first_play_at?: string | null;
          first_download_grant_at?: string | null;
          brand?: string;
          request_key?: string | null;
          consent_at?: string | null;
          payment_status?: string;
          delivery_email_sent_at?: string | null;
          delivery_email_first_attempt_at?: string | null;
          delivery_claimed_at?: string | null;
        };
        Relationships: [];
      };
      personalizations: {
        Row: {
          id: string;
          order_id: string;
          vibe: string;
          occasion: string;
          names: string;
          story: string;
          genre: string;
          voice: string;
          duration: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          vibe?: string;
          occasion: string;
          names: string;
          story: string;
          genre: string;
          voice: string;
          duration: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          occasion?: string;
          names?: string;
          story?: string;
          genre?: string;
          voice?: string;
          duration?: string;
        };
        Relationships: [];
      };
      songs: {
        Row: {
          id: string;
          order_id: string;
          lyrics: string | null;
          preview_url: string | null;
          full_url: string | null;
          apiframe_job_id: string | null;
          track_paths: string[];
          processing_until: string | null;
          submission_started_at: string | null;
          provider_credits: number | null;
          status: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          lyrics?: string | null;
          preview_url?: string | null;
          full_url?: string | null;
          apiframe_job_id?: string | null;
          track_paths?: string[];
          processing_until?: string | null;
          submission_started_at?: string | null;
          provider_credits?: number | null;
          status?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          lyrics?: string | null;
          preview_url?: string | null;
          full_url?: string | null;
          apiframe_job_id?: string | null;
          track_paths?: string[];
          processing_until?: string | null;
          submission_started_at?: string | null;
          provider_credits?: number | null;
          status?: string;
        };
        Relationships: [];
      };
      email_challenges: {
        Row: {
          email: string;
          code_hash: string;
          expires_at: string;
          attempts: number;
        };
        Insert: {
          email: string;
          code_hash: string;
          expires_at: string;
          attempts?: number;
        };
        Update: Partial<{
          email: string;
          code_hash: string;
          expires_at: string;
          attempts: number;
        }>;
        Relationships: [];
      };
      customer_sessions: {
        Row: { token_hash: string; email: string; expires_at: string };
        Insert: { token_hash: string; email: string; expires_at: string };
        Update: Partial<{
          token_hash: string;
          email: string;
          expires_at: string;
        }>;
        Relationships: [];
      };
      rate_limits: {
        Row: { key: string; hits: number; expires_at: string };
        Insert: { key: string; hits: number; expires_at: string };
        Update: Partial<{ key: string; hits: number; expires_at: string }>;
        Relationships: [];
      };
      generation_costs: {
        Row: {
          id: string;
          order_id: string;
          provider: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          credits: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          provider: string;
          model: string;
          input_tokens?: number;
          output_tokens?: number;
          credits?: number;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          order_id: string;
          provider: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          credits: number;
          created_at: string;
        }>;
        Relationships: [];
      };
      funnel_events: {
        Row: { id: string; event: string; brand: string; created_at: string };
        Insert: {
          id?: string;
          event: string;
          brand: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          event: string;
          brand: string;
          created_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      consume_rate_limit: {
        Args: { bucket_key: string; max_hits: number; window_seconds: number };
        Returns: boolean;
      };
      verify_email_code: {
        Args: { customer_email: string; submitted_hash: string };
        Returns: boolean;
      };
      reserve_free_order: {
        Args: { customer_email: string; request_key: string; brief: Json };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
