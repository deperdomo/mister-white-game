import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente para el servidor
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente para el navegador
export const createSupabaseBrowserClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Tipos de base de datos generados automáticamente
export type Database = {
  public: {
    Tables: {
      game_rooms: {
        Row: {
          id: string;
          room_code: string;
          created_at: string;
          status: string;
          current_round: number;
          max_players: number;
          current_word: string | null;
          undercover_word: string | null;
          host_id: string;
        };
        Insert: {
          id?: string;
          room_code: string;
          created_at?: string;
          status?: string;
          current_round?: number;
          max_players?: number;
          current_word?: string | null;
          undercover_word?: string | null;
          host_id: string;
        };
        Update: {
          id?: string;
          room_code?: string;
          created_at?: string;
          status?: string;
          current_round?: number;
          max_players?: number;
          current_word?: string | null;
          undercover_word?: string | null;
          host_id?: string;
        };
      };
      players: {
        Row: {
          id: string;
          room_id: string;
          name: string;
          role: string | null;
          is_host: boolean;
          is_alive: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          name: string;
          role?: string | null;
          is_host?: boolean;
          is_alive?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          name?: string;
          role?: string | null;
          is_host?: boolean;
          is_alive?: boolean;
          joined_at?: string;
        };
      };
      game_words: {
        Row: {
          id: string;
          category: string;
          word: string;
          undercover_word: string;
          difficulty: string;
        };
        Insert: {
          id?: string;
          category: string;
          word: string;
          undercover_word: string;
          difficulty?: string;
        };
        Update: {
          id?: string;
          category?: string;
          word?: string;
          undercover_word?: string;
          difficulty?: string;
        };
      };
      game_turns: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          round_number: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          player_id: string;
          round_number: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          player_id?: string;
          round_number?: number;
          description?: string | null;
          created_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          room_id: string;
          voter_id: string;
          target_id: string;
          round_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          voter_id: string;
          target_id: string;
          round_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          voter_id?: string;
          target_id?: string;
          round_number?: number;
          created_at?: string;
        };
      };
    };
  };
};
