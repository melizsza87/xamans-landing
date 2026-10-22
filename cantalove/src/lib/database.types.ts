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
        };
        Relationships: [];
      };
      personalizations: {
        Row: {
          id: string;
          order_id: string;
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
          alternate_url: string | null;
          alternate_file: string | null;
          apiframe_job_id: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          lyrics?: string | null;
          preview_url?: string | null;
          full_url?: string | null;
          alternate_url?: string | null;
          alternate_file?: string | null;
          apiframe_job_id?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          lyrics?: string | null;
          preview_url?: string | null;
          full_url?: string | null;
          alternate_url?: string | null;
          alternate_file?: string | null;
          apiframe_job_id?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      anonymous_shares: {
        Row: { order_id: string; token_hash: string; created_at: string };
        Insert: { order_id: string; token_hash: string; created_at?: string };
        Update: { order_id?: string; token_hash?: string; created_at?: string };
        Relationships: [];
      };
      free_generations: {
        Row: { email_hash: string; order_id: string; created_at: string };
        Insert: { email_hash: string; order_id: string; created_at?: string };
        Update: { email_hash?: string; order_id?: string; created_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
