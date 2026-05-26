// Database types generated from Supabase schema
// Run: supabase gen types typescript --local > src/lib/types/database.ts
// 
// For production, use: supabase gen types typescript --project-ref <ref> > src/lib/types/database.ts
//
// To regenerate when Supabase CLI is available:
//   supabase gen types typescript --local > src/lib/types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  auth: {
    tables: {
      users: {
        Row: {
          id: string
          email: string
          encrypted_password: string | null
          email_confirmed_at: string | null
          created_at: string
          updated_at: string
          raw_app_metadata: Json
          raw_user_metadata: Json
        }
        Insert: {
          id: string
          email: string
          encrypted_password?: string | null
          email_confirmed_at?: string | null
          created_at?: string
          updated_at?: string
          raw_app_metadata?: Json
          raw_user_metadata?: Json
        }
        Update: {
          email?: string
          encrypted_password?: string | null
          email_confirmed_at?: string | null
          created_at?: string
          updated_at?: string
          raw_app_metadata?: Json
          raw_user_metadata?: Json
        }
      }
    }
  }
  public: {
    tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          role: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          role?: string
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          created_at: string
          expires_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          expires_at: string
          metadata?: Json | null
        }
        Update: {
          user_id?: string
          created_at?: string
          expires_at?: string
          metadata?: Json | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          details?: Json | null
        }
      }
    }
  }
}

// Type aliases for convenience
export type UserProfile = Database['public']['tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['tables']['user_profiles']['Update']

export type UserSession = Database['public']['tables']['user_sessions']['Row']
export type UserSessionInsert = Database['public']['tables']['user_sessions']['Insert']
export type UserSessionUpdate = Database['public']['tables']['user_sessions']['Update']

export type AuditLog = Database['public']['tables']['audit_logs']['Row']
export type AuditLogInsert = Database['public']['tables']['audit_logs']['Insert']
export type AuditLogUpdate = Database['public']['tables']['audit_logs']['Update']

export type AuthUser = Database['auth']['tables']['users']['Row']
