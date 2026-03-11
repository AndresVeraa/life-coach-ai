-- ============================================
-- Row Level Security Migration
-- Life Coach AI - Supabase Database
-- ============================================
-- Este archivo configura RLS para TODAS las tablas del schema
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- ============================================
-- 1. TABLA: user_profiles
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_own"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert_own"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_own"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_delete_own"
  ON user_profiles FOR DELETE
  USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- 2. TABLA: tasks
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_own"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete_own"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed ON tasks(user_id, completed);

-- ============================================
-- 3. TABLA: sleep_records
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sleep_records' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sleep_records ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sleep_records_select_own"
  ON sleep_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sleep_records_insert_own"
  ON sleep_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sleep_records_update_own"
  ON sleep_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sleep_records_delete_own"
  ON sleep_records FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sleep_records_user_id ON sleep_records(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_records_user_date ON sleep_records(user_id, date);

-- ============================================
-- 4. TABLA: distractions
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'distractions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE distractions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE distractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "distractions_select_own"
  ON distractions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "distractions_insert_own"
  ON distractions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "distractions_update_own"
  ON distractions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "distractions_delete_own"
  ON distractions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_distractions_user_id ON distractions(user_id);

-- ============================================
-- 5. TABLA: audit_sessions
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE audit_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE audit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_sessions_select_own"
  ON audit_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "audit_sessions_insert_own"
  ON audit_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audit_sessions_update_own"
  ON audit_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "audit_sessions_delete_own"
  ON audit_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_audit_sessions_user_id ON audit_sessions(user_id);

-- ============================================
-- 6. TABLA: coach_conversations
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coach_conversations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE coach_conversations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_conversations_select_own"
  ON coach_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "coach_conversations_insert_own"
  ON coach_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_conversations_update_own"
  ON coach_conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "coach_conversations_delete_own"
  ON coach_conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_coach_conversations_user_id ON coach_conversations(user_id);

-- ============================================
-- 7. TABLA: sync_metadata
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sync_metadata' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sync_metadata ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sync_metadata_select_own"
  ON sync_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sync_metadata_insert_own"
  ON sync_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sync_metadata_update_own"
  ON sync_metadata FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sync_metadata_delete_own"
  ON sync_metadata FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sync_metadata_user_id ON sync_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_user_table ON sync_metadata(user_id, table_name);

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================
