// Gerado com: npx supabase gen types typescript --linked --schema public
// Atualize este arquivo após qualquer migration que altere o schema público.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      appointments: {
        Row: { created_at: string; customer_id: string; ends_at: string; id: string; intended_payment_method: Database["public"]["Enums"]["intended_payment_method"]; service_duration_minutes_snapshot: number; service_id: string; service_name_snapshot: string; service_price_cents_snapshot: number; starts_at: string; status: Database["public"]["Enums"]["appointment_status"]; status_changed_at: string; updated_at: string };
        Insert: { created_at?: string; customer_id: string; ends_at: string; id?: string; intended_payment_method: Database["public"]["Enums"]["intended_payment_method"]; service_duration_minutes_snapshot: number; service_id: string; service_name_snapshot: string; service_price_cents_snapshot: number; starts_at: string; status?: Database["public"]["Enums"]["appointment_status"]; status_changed_at?: string; updated_at?: string };
        Update: { created_at?: string; customer_id?: string; ends_at?: string; id?: string; intended_payment_method?: Database["public"]["Enums"]["intended_payment_method"]; service_duration_minutes_snapshot?: number; service_id?: string; service_name_snapshot?: string; service_price_cents_snapshot?: number; starts_at?: string; status?: Database["public"]["Enums"]["appointment_status"]; status_changed_at?: string; updated_at?: string };
        Relationships: [];
      };
      business_hours: {
        Row: { created_at: string; ends_at: string; id: string; starts_at: string; updated_at: string; weekday: number };
        Insert: { created_at?: string; ends_at: string; id?: string; starts_at: string; updated_at?: string; weekday: number };
        Update: { created_at?: string; ends_at?: string; id?: string; starts_at?: string; updated_at?: string; weekday?: number };
        Relationships: [];
      };
      customers: {
        Row: { created_at: string; id: string; name: string; phone: string; updated_at: string };
        Insert: { created_at?: string; id?: string; name: string; phone: string; updated_at?: string };
        Update: { created_at?: string; id?: string; name?: string; phone?: string; updated_at?: string };
        Relationships: [];
      };
      product_interests: {
        Row: { appointment_id: string; created_at: string; id: string; product_id: string };
        Insert: { appointment_id: string; created_at?: string; id?: string; product_id: string };
        Update: { appointment_id?: string; created_at?: string; id?: string; product_id?: string };
        Relationships: [];
      };
      products: {
        Row: { active: boolean; created_at: string; description: string | null; id: string; image_path: string | null; name: string; price_cents: number; updated_at: string };
        Insert: { active?: boolean; created_at?: string; description?: string | null; id?: string; image_path?: string | null; name: string; price_cents: number; updated_at?: string };
        Update: { active?: boolean; created_at?: string; description?: string | null; id?: string; image_path?: string | null; name?: string; price_cents?: number; updated_at?: string };
        Relationships: [];
      };
      promotions: {
        Row: { active: boolean; created_at: string; description: string | null; ends_at: string; id: string; image_path: string | null; starts_at: string; title: string; updated_at: string };
        Insert: { active?: boolean; created_at?: string; description?: string | null; ends_at: string; id?: string; image_path?: string | null; starts_at: string; title: string; updated_at?: string };
        Update: { active?: boolean; created_at?: string; description?: string | null; ends_at?: string; id?: string; image_path?: string | null; starts_at?: string; title?: string; updated_at?: string };
        Relationships: [];
      };
      schedule_blocks: {
        Row: { created_at: string; ends_at: string; id: string; reason: string | null; starts_at: string; updated_at: string };
        Insert: { created_at?: string; ends_at: string; id?: string; reason?: string | null; starts_at: string; updated_at?: string };
        Update: { created_at?: string; ends_at?: string; id?: string; reason?: string | null; starts_at?: string; updated_at?: string };
        Relationships: [];
      };
      services: {
        Row: { active: boolean; created_at: string; description: string | null; duration_minutes: number; id: string; name: string; price_cents: number; updated_at: string };
        Insert: { active?: boolean; created_at?: string; description?: string | null; duration_minutes: number; id?: string; name: string; price_cents: number; updated_at?: string };
        Update: { active?: boolean; created_at?: string; description?: string | null; duration_minutes?: number; id?: string; name?: string; price_cents?: number; updated_at?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { appointment_status: "AGENDADO" | "CONCLUIDO" | "CANCELADO" | "NAO_COMPARECEU"; intended_payment_method: "PIX" | "DINHEIRO" | "CARTAO" };
    CompositeTypes: Record<string, never>;
  };
};
