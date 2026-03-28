export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      apartments: {
        Row: {
          address: string;
          base_price: number;
          created_at: string;
          id: string;
          notes: string | null;
          status: Database["public"]["Enums"]["apartment_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          address: string;
          base_price: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["apartment_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          base_price?: number;
          created_at?: string;
          id?: string;
          notes?: string | null;
          status?: Database["public"]["Enums"]["apartment_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          apartment_id: string;
          booking_status: Database["public"]["Enums"]["booking_status"];
          check_in: string;
          check_out: string;
          created_at: string;
          guest_name: string;
          guest_phone: string | null;
          id: string;
          notes: string | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          prepaid_amount: number;
          total_amount: number;
          updated_at: string;
        };
        Insert: {
          apartment_id: string;
          booking_status?: Database["public"]["Enums"]["booking_status"];
          check_in: string;
          check_out: string;
          created_at?: string;
          guest_name: string;
          guest_phone?: string | null;
          id?: string;
          notes?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          prepaid_amount?: number;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          apartment_id?: string;
          booking_status?: Database["public"]["Enums"]["booking_status"];
          check_in?: string;
          check_out?: string;
          created_at?: string;
          guest_name?: string;
          guest_phone?: string | null;
          id?: string;
          notes?: string | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          prepaid_amount?: number;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_apartment_id_fkey";
            columns: ["apartment_id"];
            referencedRelation: "apartments";
            referencedColumns: ["id"];
          }
        ];
      };
      expenses: {
        Row: {
          amount: number;
          apartment_id: string;
          category: Database["public"]["Enums"]["expense_category"];
          created_at: string;
          expense_date: string;
          id: string;
          note: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          apartment_id: string;
          category: Database["public"]["Enums"]["expense_category"];
          created_at?: string;
          expense_date: string;
          id?: string;
          note?: string | null;
          updated_at?: string;
        };
        Update: {
          amount?: number;
          apartment_id?: string;
          category?: Database["public"]["Enums"]["expense_category"];
          created_at?: string;
          expense_date?: string;
          id?: string;
          note?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_apartment_id_fkey";
            columns: ["apartment_id"];
            referencedRelation: "apartments";
            referencedColumns: ["id"];
          }
        ];
      };
      settings: {
        Row: {
          business_name: string;
          created_at: string;
          currency: string;
          id: number;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          business_name: string;
          created_at?: string;
          currency?: string;
          id?: number;
          timezone: string;
          updated_at?: string;
        };
        Update: {
          business_name?: string;
          created_at?: string;
          currency?: string;
          id?: number;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: Database["public"]["Enums"]["app_role"] | null;
      };
    };
    Enums: {
      apartment_status: "active" | "inactive";
      app_role: "owner" | "member";
      booking_status:
        | "new"
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled";
      expense_category:
        | "cleaning"
        | "repair"
        | "supplies"
        | "utilities"
        | "commission"
        | "marketing"
        | "other";
      payment_status: "unpaid" | "partial" | "paid";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
