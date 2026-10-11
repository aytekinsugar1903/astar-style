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
      affiliate_clicks: {
        Row: {
          created_at: string
          id: string
          offer_id: string | null
          product_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id?: string | null
          product_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string | null
          product_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "product_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_events: {
        Row: {
          created_at: string
          estimated_cost_usd: number
          id: string
          latency_ms: number | null
          model: string | null
          operation: string
          provider: string
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          estimated_cost_usd?: number
          id?: string
          latency_ms?: number | null
          model?: string | null
          operation: string
          provider: string
          success: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          estimated_cost_usd?: number
          id?: string
          latency_ms?: number | null
          model?: string | null
          operation?: string
          provider?: string
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          anonymous_id: string | null
          created_at: string
          event_name: string
          id: number
          properties: Json
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          event_name: string
          id?: never
          properties?: Json
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          event_name?: string
          id?: never
          properties?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          completed_at: string | null
          error_code: string | null
          id: string
          job_name: string
          metrics: Json
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_code?: string | null
          id?: string
          job_name: string
          metrics?: Json
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          error_code?: string | null
          id?: string
          job_name?: string
          metrics?: Json
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          id: string
          policy_version: string
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted: boolean
          id?: string
          policy_version: string
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: string
          policy_version?: string
          user_id?: string
        }
        Relationships: []
      }
      dressing_sessions: {
        Row: {
          canvas_state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          canvas_state?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          canvas_state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      outfit_items: {
        Row: {
          outfit_id: string
          wardrobe_item_id: string
        }
        Insert: {
          outfit_id: string
          wardrobe_item_id: string
        }
        Update: {
          outfit_id?: string
          wardrobe_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_items_wardrobe_item_id_fkey"
            columns: ["wardrobe_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          context: Json
          created_at: string
          explanation: string | null
          id: string
          is_favorite: boolean
          occasion: string | null
          title: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          is_favorite?: boolean
          occasion?: string | null
          title: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          explanation?: string | null
          id?: string
          is_favorite?: boolean
          occasion?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      product_offers: {
        Row: {
          affiliate_url: string | null
          commission_rate: number | null
          currency: string
          id: string
          in_stock: boolean | null
          merchant: string
          price: number
          product_id: string
          updated_at: string
        }
        Insert: {
          affiliate_url?: string | null
          commission_rate?: number | null
          currency: string
          id?: string
          in_stock?: boolean | null
          merchant: string
          price: number
          product_id: string
          updated_at?: string
        }
        Update: {
          affiliate_url?: string | null
          commission_rate?: number | null
          currency?: string
          id?: string
          in_stock?: boolean | null
          merchant?: string
          price?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          brand: string | null
          category: string
          colors: string[]
          external_id: string
          id: string
          image_url: string | null
          metadata: Json
          name: string
          product_url: string
          source: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand?: string | null
          category: string
          colors?: string[]
          external_id: string
          id?: string
          image_url?: string | null
          metadata?: Json
          name: string
          product_url: string
          source: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand?: string | null
          category?: string
          colors?: string[]
          external_id?: string
          id?: string
          image_url?: string | null
          metadata?: Json
          name?: string
          product_url?: string
          source?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          locale: string
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          locale?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      stylist_requests: {
        Row: { id: string; user_id: string; request_text: string; outfit_item_ids: string[]; status: string; stylist_reply: string | null; created_at: string; replied_at: string | null }
        Insert: { id?: string; user_id: string; request_text: string; outfit_item_ids?: string[]; status?: string; stylist_reply?: string | null; created_at?: string; replied_at?: string | null }
        Update: { id?: string; user_id?: string; request_text?: string; outfit_item_ids?: string[]; status?: string; stylist_reply?: string | null; created_at?: string; replied_at?: string | null }
        Relationships: []
      }
      style_profiles: {
        Row: {
          ai_summary: string | null
          avatar_config: Json
          avoided_colors: string[]
          body_preferences: Json
          preferred_colors: string[]
          sizes: Json
          style_tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          avatar_config?: Json
          avoided_colors?: string[]
          body_preferences?: Json
          preferred_colors?: string[]
          sizes?: Json
          style_tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          avatar_config?: Json
          avoided_colors?: string[]
          body_preferences?: Json
          preferred_colors?: string[]
          sizes?: Json
          style_tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          current_period_end: string | null
          plan: string
          provider: string
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          plan?: string
          provider?: string
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      try_on_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          estimated_cost_usd: number
          garment_image_path: string
          id: string
          person_image_path: string
          provider: string
          result_image_path: string | null
          status: Database["public"]["Enums"]["job_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          estimated_cost_usd?: number
          garment_image_path: string
          id?: string
          person_image_path: string
          provider: string
          result_image_path?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          estimated_cost_usd?: number
          garment_image_path?: string
          id?: string
          person_image_path?: string
          provider?: string
          result_image_path?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          user_id?: string
        }
        Relationships: []
      }
      user_photos: {
        Row: {
          created_at: string
          id: string
          image_path: string
          is_primary: boolean
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_path: string
          is_primary?: boolean
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_path?: string
          is_primary?: boolean
          kind?: string
          user_id?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          ai_confidence: number | null
          brand: string | null
          capture_quality: Json
          category: Database["public"]["Enums"]["wardrobe_category"]
          colors: string[]
          created_at: string
          cutout_image_path: string | null
          fabric: string | null
          id: string
          image_path: string
          last_worn_at: string | null
          matched_metadata: Json
          metadata_confirmed: boolean
          name: string | null
          processing_status: string
          purchase_currency: string
          purchase_price: number | null
          raw_image_path: string
          seasons: string[]
          style_tags: string[]
          user_id: string
          wear_count: number
        }
        Insert: {
          ai_confidence?: number | null
          brand?: string | null
          capture_quality?: Json
          category?: Database["public"]["Enums"]["wardrobe_category"]
          colors?: string[]
          created_at?: string
          cutout_image_path?: string | null
          fabric?: string | null
          id?: string
          image_path: string
          last_worn_at?: string | null
          matched_metadata?: Json
          metadata_confirmed?: boolean
          name?: string | null
          processing_status?: string
          purchase_currency?: string
          purchase_price?: number | null
          raw_image_path: string
          seasons?: string[]
          style_tags?: string[]
          user_id: string
          wear_count?: number
        }
        Update: {
          ai_confidence?: number | null
          brand?: string | null
          capture_quality?: Json
          category?: Database["public"]["Enums"]["wardrobe_category"]
          colors?: string[]
          created_at?: string
          cutout_image_path?: string | null
          fabric?: string | null
          id?: string
          image_path?: string
          last_worn_at?: string | null
          matched_metadata?: Json
          metadata_confirmed?: boolean
          name?: string | null
          processing_status?: string
          purchase_currency?: string
          purchase_price?: number | null
          raw_image_path?: string
          seasons?: string[]
          style_tags?: string[]
          user_id?: string
          wear_count?: number
        }
        Relationships: []
      }
      wear_event_items: {
        Row: {
          wardrobe_item_id: string
          wear_event_id: string
        }
        Insert: {
          wardrobe_item_id: string
          wear_event_id: string
        }
        Update: {
          wardrobe_item_id?: string
          wear_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wear_event_items_wardrobe_item_id_fkey"
            columns: ["wardrobe_item_id"]
            isOneToOne: false
            referencedRelation: "wardrobe_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wear_event_items_wear_event_id_fkey"
            columns: ["wear_event_id"]
            isOneToOne: false
            referencedRelation: "wear_events"
            referencedColumns: ["id"]
          },
        ]
      }
      wear_events: {
        Row: {
          created_at: string
          event_name: string | null
          id: string
          outfit_id: string
          user_id: string
          worn_on: string
        }
        Insert: {
          created_at?: string
          event_name?: string | null
          id?: string
          outfit_id: string
          user_id: string
          worn_on?: string
        }
        Update: {
          created_at?: string
          event_name?: string | null
          id?: string
          outfit_id?: string
          user_id?: string
          worn_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "wear_events_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_analytics_snapshot: { Args: never; Returns: Json }
      mark_outfit_worn: {
        Args: { p_event_name?: string; p_outfit_id: string }
        Returns: string
      }
      reserve_ai_usage: {
        Args: {
          p_daily_cost_limit_usd?: number
          p_estimated_cost_usd?: number
          p_max_requests?: number
          p_model?: string
          p_operation: string
          p_provider: string
          p_user_id: string
          p_window_seconds?: number
        }
        Returns: Json
      }
    }
    Enums: {
      job_status: "queued" | "processing" | "succeeded" | "failed" | "cancelled"
      wardrobe_category:
        | "dress"
        | "trousers"
        | "skirt"
        | "shirt"
        | "tshirt"
        | "jacket"
        | "shoes"
        | "bag"
        | "accessory"
        | "other"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      job_status: ["queued", "processing", "succeeded", "failed", "cancelled"],
      wardrobe_category: [
        "dress",
        "trousers",
        "skirt",
        "shirt",
        "tshirt",
        "jacket",
        "shoes",
        "bag",
        "accessory",
        "other",
      ],
    },
  },
} as const

