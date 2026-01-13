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
          event_id: string
          id: string
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
          event_id: string
          id?: string
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
          event_id?: string
          id?: string
          status?: string | null
          total_amount?: number | null
          user_id?: string | null
          vendor_id?: string
        }
        Relationships: [
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
          favorites: string[] | null
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          favorites?: string[] | null
          full_name?: string | null
          gender?: string | null
          id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          favorites?: string[] | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
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
          business_name: string
          category: string
          company_logo: string | null
          created_at: string | null
          description_ar: string | null
          id: string
          instagram: string | null
          is_verified: boolean | null
          location_lat: number | null
          location_long: number | null
          status: string | null
          tax_id_document: string | null
          website: string | null
          whatsapp_number: string | null
        }
        Insert: {
          business_name: string
          category: string
          company_logo?: string | null
          created_at?: string | null
          description_ar?: string | null
          id: string
          instagram?: string | null
          is_verified?: boolean | null
          location_lat?: number | null
          location_long?: number | null
          status?: string | null
          tax_id_document?: string | null
          website?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          business_name?: string
          category?: string
          company_logo?: string | null
          created_at?: string | null
          description_ar?: string | null
          id?: string
          instagram?: string | null
          is_verified?: boolean | null
          location_lat?: number | null
          location_long?: number | null
          status?: string | null
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
          status: string
          title: string
          vendor_id: string
          vendor_logo: string
          vendor_name: string
        }[]
      }
      increment_ticket_sold: {
        Args: { quantity: number; ticket_id: string }
        Returns: undefined
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
