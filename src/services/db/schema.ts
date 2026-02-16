/**
 * Tipos de Supabase Database
 * Define los esquemas que existen en la BD relacional
 */

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          last_sync_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };

      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          local_id: string; // Para mapping local -> remote
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };

      sleep_records: {
        Row: {
          id: string;
          user_id: string;
          date: string; // YYYY-MM-DD
          start_time: string; // HH:MM
          end_time: string; // HH:MM
          sleep_minutes: number;
          created_at: string;
          updated_at: string;
          local_id: string;
        };
        Insert: Omit<Database['public']['Tables']['sleep_records']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sleep_records']['Insert']>;
      };

      distractions: {
        Row: {
          id: string;
          user_id: string;
          session_id: string; // Links to audit session
          category: 'redes-sociales' | 'personas' | 'entretenimiento' | 'tareas-administrativas' | 'otro';
          description: string;
          minutes_lost: number;
          date: string; // YYYY-MM-DD
          time_recorded: string; // HH:MM
          created_at: string;
          updated_at: string;
          local_id: string;
        };
        Insert: Omit<Database['public']['Tables']['distractions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['distractions']['Insert']>;
      };

      audit_sessions: {
        Row: {
          id: string;
          user_id: string;
          date: string; // YYYY-MM-DD
          total_minutes_lost: number;
          distraction_count: number;
          completed: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
          local_id: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_sessions']['Insert']>;
      };

      coach_conversations: {
        Row: {
          id: string;
          user_id: string;
          session_id: string; // Agrupar mensajes por sesión
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
          local_id: string;
        };
        Insert: Omit<Database['public']['Tables']['coach_conversations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['coach_conversations']['Insert']>;
      };

      sync_metadata: {
        Row: {
          id: string;
          user_id: string;
          table_name: string; // 'tasks', 'distractions', etc.
          record_id: string; // ID del registro en esa tabla
          last_synced_at: string; // Timestamp del último cambio local
          server_updated_at: string; // Timestamp en servidor (para LWW conflict resolution)
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sync_metadata']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sync_metadata']['Insert']>;
      };
    };
  };
};

/**
 * Tipos extraídos para usar en la app
 */
export type User = Database['public']['Tables']['users']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type SleepRecord = Database['public']['Tables']['sleep_records']['Row'];
export type Distraction = Database['public']['Tables']['distractions']['Row'];
export type AuditSession = Database['public']['Tables']['audit_sessions']['Row'];
export type CoachConversation = Database['public']['Tables']['coach_conversations']['Row'];
export type SyncMetadata = Database['public']['Tables']['sync_metadata']['Row'];
