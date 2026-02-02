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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      booking_items: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          booking_id: string
          created_at: string | null
          id: string
          price_at_booking: number | null
          status: string | null
          ticket_id: string | null
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          booking_id: string
          created_at?: string | null
          id?: string
          price_at_booking?: number | null
          status?: string | null
          ticket_id?: string | null
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          booking_id?: string
          created_at?: string | null
          id?: string
          price_at_booking?: number | null
          status?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          discount_amount: number | null
          discount_code_id: string | null
          event_id: string
          id: string
          payment_method: string | null
          payment_note: string | null
          payment_proof_url: string | null
          status: string | null
          total_amount: number | null
          user_id: string | null
          vendor_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          event_id: string
          id?: string
          payment_method?: string | null
          payment_note?: string | null
          payment_proof_url?: string | null
          status?: string | null
          total_amount?: number | null
          user_id?: string | null
          vendor_id: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_code_id?: string | null
          event_id?: string
          id?: string
          payment_method?: string | null
          payment_note?: string | null
          payment_proof_url?: string | null
          status?: string | null
          total_amount?: number | null
          user_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_discounts: {
        Row: {
          created_at: string | null
          discount_type: string
          discount_value: number
          event_id: string
          id: string
          min_quantity: number
        }
        Insert: {
          created_at?: string | null
          discount_type: string
          discount_value: number
          event_id: string
          id?: string
          min_quantity: number
        }
        Update: {
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string
          id?: string
          min_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "bulk_discounts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name_ar: string | null
          name_en: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name_ar?: string | null
          name_en: string
          slug: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name_ar?: string | null
          name_en?: string
          slug?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          event_id: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          used_count: number | null
          vendor_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          event_id?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          used_count?: number | null
          vendor_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          event_id?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          used_count?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_codes_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          event_id: string
          id: string
          is_flagged: boolean | null
          rating: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          is_flagged?: boolean | null
          rating: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          is_flagged?: boolean | null
          rating?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          category_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date: string
          description: string | null
          district: string | null
          end_date: string | null
          event_type: string | null
          id: string
          image_url: string | null
          is_recurring: boolean | null
          location_lat: number | null
          location_long: number | null
          location_name: string | null
          recurrence_days: string[] | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          slug: string | null
          status: string | null
          title: string
          vendor_id: string
        }
        Insert: {
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          district?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_recurring?: boolean | null
          location_lat?: number | null
          location_long?: number | null
          location_name?: string | null
          recurrence_days?: string[] | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          slug?: string | null
          status?: string | null
          title: string
          vendor_id: string
        }
        Update: {
          capacity?: number | null
          category_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          district?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          image_url?: string | null
          is_recurring?: boolean | null
          location_lat?: number | null
          location_long?: number | null
          location_name?: string | null
          recurrence_days?: string[] | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          slug?: string | null
          status?: string | null
          title?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_events: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          district: string | null
          email: string | null
          favorites: string[] | null
          full_name: string | null
          gender: string | null
          id: string
          is_founder_pricing: boolean | null
          phone: string | null
          platform_signup_date: string | null
          role: string | null
          subscription_expires_at: string | null
          subscription_starts_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          favorites?: string[] | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_founder_pricing?: boolean | null
          phone?: string | null
          platform_signup_date?: string | null
          role?: string | null
          subscription_expires_at?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          email?: string | null
          favorites?: string[] | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_founder_pricing?: boolean | null
          phone?: string | null
          platform_signup_date?: string | null
          role?: string | null
          subscription_expires_at?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
        }
        Relationships: []
      }
      review_flags: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_flags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "event_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpful: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "event_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          name: string
          price: number | null
          quantity: number
          sold: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          name: string
          price?: number | null
          quantity?: number
          sold?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          price?: number | null
          quantity?: number
          sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_gallery: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          vendor_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          vendor_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_gallery_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          bank_account_name: string | null
          bank_iban: string | null
          bank_name: string | null
          business_name: string
          category: string
          company_logo: string | null
          cover_image: string | null
          created_at: string | null
          description_ar: string | null
          id: string
          instagram: string | null
          is_founder_pricing: boolean | null
          is_verified: boolean | null
          location_lat: number | null
          location_long: number | null
          slug: string | null
          status: string | null
          subscription_expires_at: string | null
          subscription_starts_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          tax_id_document: string | null
          website: string | null
          whatsapp_number: string | null
        }
        Insert: {
          bank_account_name?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          business_name: string
          category: string
          company_logo?: string | null
          cover_image?: string | null
          created_at?: string | null
          description_ar?: string | null
          id: string
          instagram?: string | null
          is_founder_pricing?: boolean | null
          is_verified?: boolean | null
          location_lat?: number | null
          location_long?: number | null
          slug?: string | null
          status?: string | null
          subscription_expires_at?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tax_id_document?: string | null
          website?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          bank_account_name?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          business_name?: string
          category?: string
          company_logo?: string | null
          cover_image?: string | null
          created_at?: string | null
          description_ar?: string | null
          id?: string
          instagram?: string | null
          is_founder_pricing?: boolean | null
          is_verified?: boolean | null
          location_lat?: number | null
          location_long?: number | null
          slug?: string | null
          status?: string | null
          subscription_expires_at?: string | null
          subscription_starts_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          tax_id_document?: string | null
          website?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_review_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      get_event_rating_summary: {
        Args: { p_event_id: string }
        Returns: {
          average_rating: number
          rating_1_count: number
          rating_2_count: number
          rating_3_count: number
          rating_4_count: number
          rating_5_count: number
          review_count: number
        }[]
      }
      get_events_pro: {
        Args: {
          p_category?: string
          p_date_end?: string
          p_date_start?: string
          p_lat?: number
          p_limit?: number
          p_long?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_radius_km?: number
          p_search?: string
        }
        Returns: {
          capacity: number
          category_icon: string
          category_id: string
          category_name_ar: string
          category_name_en: string
          category_slug: string
          city: string
          country: string
          date: string
          description: string
          dist_km: number
          district: string
          event_type: string
          id: string
          image_url: string
          location_lat: number
          location_long: number
          location_name: string
          price: number
          slug: string
          status: string
          title: string
          vendor_id: string
          vendor_logo: string
          vendor_name: string
        }[]
      }
      get_review_helpful_count: {
        Args: { p_review_id: string }
        Returns: {
          helpful_count: number
          not_helpful_count: number
        }[]
      }
      increment_ticket_sold: {
        Args: { quantity: number; ticket_id: string }
        Returns: undefined
      }
      place_booking: {
        Args: {
          p_discount_amount: number
          p_discount_code_id?: string
          p_event_id: string
          p_quantity: number
          p_ticket_id: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
