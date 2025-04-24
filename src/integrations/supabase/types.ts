export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      market_data: {
        Row: {
          change_percent: number | null
          current_price: number
          high_24h: number | null
          low_24h: number | null
          market_cap: number | null
          name: string
          symbol: string
          updated_at: string | null
          volume: number | null
        }
        Insert: {
          change_percent?: number | null
          current_price: number
          high_24h?: number | null
          low_24h?: number | null
          market_cap?: number | null
          name: string
          symbol: string
          updated_at?: string | null
          volume?: number | null
        }
        Update: {
          change_percent?: number | null
          current_price?: number
          high_24h?: number | null
          low_24h?: number | null
          market_cap?: number | null
          name?: string
          symbol?: string
          updated_at?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      portfolio_holdings: {
        Row: {
          average_cost: number
          created_at: string | null
          id: string
          portfolio_id: string
          quantity: number
          symbol: string
          updated_at: string | null
        }
        Insert: {
          average_cost: number
          created_at?: string | null
          id?: string
          portfolio_id: string
          quantity: number
          symbol: string
          updated_at?: string | null
        }
        Update: {
          average_cost?: number
          created_at?: string | null
          id?: string
          portfolio_id?: string
          quantity?: number
          symbol?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          cash_balance: number | null
          created_at: string | null
          id: string
          name: string
          total_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cash_balance?: number | null
          created_at?: string | null
          id?: string
          name: string
          total_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cash_balance?: number | null
          created_at?: string | null
          id?: string
          name?: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string | null
          id: string
          portfolio_id: string
          price: number
          quantity: number
          status: string
          symbol: string
          total_amount: number
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          portfolio_id: string
          price: number
          quantity: number
          status?: string
          symbol: string
          total_amount: number
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          portfolio_id?: string
          price?: number
          quantity?: number
          status?: string
          symbol?: string
          total_amount?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          created_at: string | null
          id: string
          price_alert_high: number | null
          price_alert_low: number | null
          symbol: string
          updated_at: string | null
          watchlist_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          price_alert_high?: number | null
          price_alert_low?: number | null
          symbol: string
          updated_at?: string | null
          watchlist_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          price_alert_high?: number | null
          price_alert_low?: number | null
          symbol?: string
          updated_at?: string | null
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_items_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
