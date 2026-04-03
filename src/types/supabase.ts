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
      businesses: {
        Row: {
          id: string
          name: string
          legal_name: string | null
          nit: string | null
          verification_digit: number | null
          address: string | null
          city: string | null
          department: string | null
          phone: string | null
          email: string | null
          regimen: 'simplificado' | 'comun' | null
          resolution_number: string | null
          prefix: string | null
          logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          legal_name?: string | null
          nit?: string | null
          verification_digit?: number | null
          address?: string | null
          city?: string | null
          department?: string | null
          phone?: string | null
          email?: string | null
          regimen?: 'simplificado' | 'comun' | null
          resolution_number?: string | null
          prefix?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          legal_name?: string | null
          nit?: string | null
          verification_digit?: number | null
          address?: string | null
          city?: string | null
          department?: string | null
          phone?: string | null
          email?: string | null
          regimen?: 'simplificado' | 'comun' | null
          resolution_number?: string | null
          prefix?: string | null
          logo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          business_id: string | null
          full_name: string | null
          role: 'owner' | 'admin' | 'cashier' | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          business_id?: string | null
          full_name?: string | null
          role?: 'owner' | 'admin' | 'cashier' | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          full_name?: string | null
          role?: 'owner' | 'admin' | 'cashier' | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          sku: string | null
          barcode: string | null
          category: string | null
          price: number
          cost: number
          stock: number
          min_stock: number
          unit: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          sku?: string | null
          barcode?: string | null
          category?: string | null
          price?: number
          cost?: number
          stock?: number
          min_stock?: number
          unit?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          description?: string | null
          sku?: string | null
          barcode?: string | null
          category?: string | null
          price?: number
          cost?: number
          stock?: number
          min_stock?: number
          unit?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          business_id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          document_type: string | null
          document_number: string | null
          loyalty_points: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          document_type?: string | null
          document_number?: string | null
          loyalty_points?: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          document_type?: string | null
          document_number?: string | null
          loyalty_points?: number
          created_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          business_id: string
          customer_id: string | null
          staff_id: string | null
          total: number
          subtotal: number
          tax: number
          discount: number | null
          payment_method: 'cash' | 'card' | 'transfer' | 'mixed' | null
          status: 'completed' | 'cancelled' | 'refunded' | null
          is_reversed: boolean
          reversal_reason: string | null
          reversed_at: string | null
          date: string
        }
        Insert: {
          id?: string
          business_id: string
          customer_id?: string | null
          staff_id?: string | null
          total: number
          subtotal: number
          tax: number
          discount?: number | null
          payment_method?: 'cash' | 'card' | 'transfer' | 'mixed' | null
          status?: 'completed' | 'cancelled' | 'refunded' | null
          is_reversed?: boolean
          reversal_reason?: string | null
          reversed_at?: string | null
          date?: string
        }
        Update: {
          id?: string
          business_id?: string
          customer_id?: string | null
          staff_id?: string | null
          total?: number
          subtotal?: number
          tax?: number
          discount?: number | null
          payment_method?: 'cash' | 'card' | 'transfer' | 'mixed' | null
          status?: 'completed' | 'cancelled' | 'refunded' | null
          is_reversed?: boolean
          reversal_reason?: string | null
          reversed_at?: string | null
          date?: string
        }
      }
      expenses: {
        Row: {
          id: string
          business_id: string
          description: string
          amount: number
          category: string
          notes: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          description: string
          amount: number
          category: string
          notes?: string | null
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          description?: string
          amount?: number
          category?: string
          notes?: string | null
          date?: string
          created_at?: string
        }
      }
    }
  }
}
