import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set up your Supabase project.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          category: string;
          color: string;
          target_frequency: string;
          selected_days: string | null;
          created_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          category: string;
          color: string;
          target_frequency?: string;
          selected_days?: string | null;
          created_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          category?: string;
          color?: string;
          target_frequency?: string;
          selected_days?: string | null;
          created_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      completions: {
        Row: {
          id: number;
          user_id: string;
          habit_id: string;
          completion_date: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          habit_id: string;
          completion_date: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          habit_id?: string;
          completion_date?: string;
          created_at?: string;
        };
      };
    };
    Tables: {
    }
    tasks: {
      Row: {
        id: string;
        user_id: string;
        name: string;
        description: string | null;
        category: string;
        color: string;
        due_date: string;
        due_time: string;
        priority: string;
        status: string;
        created_date: string;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        name: string;
        description?: string | null;
        category: string;
        color: string;
        due_date: string;
        due_time?: string;
        priority?: string;
        status?: string;
        created_date: string;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        name?: string;
        description?: string | null;
        category?: string;
        color?: string;
        due_date?: string;
        due_time?: string;
        priority?: string;
        status?: string;
        created_date?: string;
        created_at?: string;
        updated_at?: string;
      };
    };
  };
}