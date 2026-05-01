export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          agreed_price: number
          client_name: string | null
          created_at: string
          id: string
          lead_id: string | null
          platform: Database["public"]["Enums"]["platform"]
          scope: string | null
          status: Database["public"]["Enums"]["deal_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          agreed_price?: number
          client_name?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          platform?: Database["public"]["Enums"]["platform"]
          scope?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          agreed_price?: number
          client_name?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          platform?: Database["public"]["Enums"]["platform"]
          scope?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          admin_notes: string | null
          admin_status: Database["public"]["Enums"]["feedback_status"]
          created_at: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          message: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          admin_status?: Database["public"]["Enums"]["feedback_status"]
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          message: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          admin_status?: Database["public"]["Enums"]["feedback_status"]
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          message?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          client_name: string
          created_at: string
          estimated_value: number | null
          id: string
          notes: string | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          notes?: string | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          client_name: string | null
          created_at: string
          id: string
          lead_id: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          notes: string | null
          project_id: string | null
          starts_at: string
          title: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          project_id?: string | null
          starts_at: string
          title: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          project_id?: string | null
          starts_at?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_uses_count: number
          created_at: string
          deleted_at: string | null
          display_name: string | null
          experience_level: string | null
          expertise: string | null
          id: string
          interests: string[] | null
          last_active_at: string | null
          leads_count: number
          meetings_count: number
          onboarded: boolean
          profession: string | null
          projects_count: number
          theme: string
          updated_at: string
        }
        Insert: {
          ai_uses_count?: number
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          experience_level?: string | null
          expertise?: string | null
          id: string
          interests?: string[] | null
          last_active_at?: string | null
          leads_count?: number
          meetings_count?: number
          onboarded?: boolean
          profession?: string | null
          projects_count?: number
          theme?: string
          updated_at?: string
        }
        Update: {
          ai_uses_count?: number
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          experience_level?: string | null
          expertise?: string | null
          id?: string
          interests?: string[] | null
          last_active_at?: string | null
          leads_count?: number
          meetings_count?: number
          onboarded?: boolean
          profession?: string | null
          projects_count?: number
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          client_name: string | null
          completed_at: string | null
          created_at: string
          deadline: string | null
          deal_id: string | null
          description: string | null
          id: string
          lead_id: string | null
          platform: Database["public"]["Enums"]["platform"]
          price: number
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          platform?: Database["public"]["Enums"]["platform"]
          price?: number
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          lead_id?: string | null
          platform?: Database["public"]["Enums"]["platform"]
          price?: number
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          done: boolean
          id: string
          position: number
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          page: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          page?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      deal_status: "open" | "won" | "lost"
      feedback_status: "new" | "reviewed" | "planned" | "completed"
      feedback_type: "bug" | "feature" | "general"
      lead_source: "fiverr" | "upwork" | "direct" | "referral" | "other"
      lead_status: "new" | "negotiating" | "won" | "lost"
      meeting_type: "lead" | "project" | "general"
      platform: "fiverr" | "upwork" | "direct" | "other"
      project_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "active"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      deal_status: ["open", "won", "lost"],
      feedback_status: ["new", "reviewed", "planned", "completed"],
      feedback_type: ["bug", "feature", "general"],
      lead_source: ["fiverr", "upwork", "direct", "referral", "other"],
      lead_status: ["new", "negotiating", "won", "lost"],
      meeting_type: ["lead", "project", "general"],
      platform: ["fiverr", "upwork", "direct", "other"],
      project_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "active",
      ],
    },
  },
} as const
