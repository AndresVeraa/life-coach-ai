import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase credentials missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
  );
}

/**
 * Cliente de Supabase inicializado
 * Proporciona acceso a:
 * - Autenticación
 * - Base de datos relacional
 * - Realtime subscriptions
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper: Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
};

/**
 * Helper: Get current user ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
};

/**
 * Recuperar metadatos de sincronización
 * Usados para conflict resolution (last-write-wins)
 */
export const getSyncMetadata = async (table: string, recordId: string) => {
  try {
    const { data } = await supabase
      .from('sync_metadata')
      .select('*')
      .eq('table_name', table)
      .eq('record_id', recordId)
      .single();

    return data;
  } catch (error) {
    return null;
  }
};

/**
 * Actualizar metadatos de sincronización
 */
export const updateSyncMetadata = async (
  table: string,
  recordId: string,
  updatedAt: number
) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase.from('sync_metadata').upsert(
      {
        user_id: userId,
        table_name: table,
        record_id: recordId,
        last_synced_at: new Date(updatedAt).toISOString(),
        server_updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,table_name,record_id',
      }
    );

    if (error) throw error;
  } catch (error) {
    console.error(`Failed to update sync metadata for ${table}:${recordId}:`, error);
  }
};
