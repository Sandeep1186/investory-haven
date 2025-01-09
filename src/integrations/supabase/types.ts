export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          balance: number
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          balance?: number
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          balance?: number
          created_at?: string
        }
      }
      market_data: {
        Row: {
          id: string
          symbol: string
          name: string
          type: 'stock' | 'mutual_fund' | 'bond'
          price: number
          change: number
          risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | null
          minimum_investment: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          symbol: string
          name: string
          type: 'stock' | 'mutual_fund' | 'bond'
          price: number
          change?: number
          risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | null
          minimum_investment?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          name?: string
          type?: 'stock' | 'mutual_fund' | 'bond'
          price?: number
          change?: number
          risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | null
          minimum_investment?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          symbol: string
          type: 'stock' | 'mutual_fund' | 'bond'
          quantity: number
          purchase_price: number
          sold: boolean
          sold_at: string | null
          sold_price: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          type: 'stock' | 'mutual_fund' | 'bond'
          quantity: number
          purchase_price: number
          sold?: boolean
          sold_at?: string | null
          sold_price?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          type?: 'stock' | 'mutual_fund' | 'bond'
          quantity?: number
          purchase_price?: number
          sold?: boolean
          sold_at?: string | null
          sold_price?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          amount: number
          status: 'pending' | 'completed' | 'failed'
          payment_method: string | null
          transaction_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          status: 'pending' | 'completed' | 'failed'
          payment_method?: string | null
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          status?: 'pending' | 'completed' | 'failed'
          payment_method?: string | null
          transaction_id?: string | null
          created_at?: string
          updated_at?: string
        }
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