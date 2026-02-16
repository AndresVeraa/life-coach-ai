# Supabase Setup - Tablas a Crear

## Instrucciones

1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar project "life-coach-ai"
3. Ir a SQL Editor
4. Crear nueva query
5. Copiar + pegar cada SQL script abajo
6. Execute

---

## SQL Scripts

### 1. Tabla Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
```

### 2. Tabla Tasks

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  local_id TEXT -- Para mapping local -> remote
);

-- Índices
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_local_id ON tasks(local_id);
```

### 3. Tabla Sleep Records

```sql
CREATE TABLE sleep_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  sleep_minutes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  local_id TEXT
);

-- Índices
CREATE INDEX idx_sleep_records_user_date ON sleep_records(user_id, date);
CREATE INDEX idx_sleep_records_local_id ON sleep_records(local_id);
```

### 4. Tabla Distractions

```sql
CREATE TABLE distractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES audit_sessions(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('redes-sociales', 'personas', 'entretenimiento', 'tareas-administrativas', 'otro')),
  description TEXT NOT NULL,
  minutes_lost INTEGER NOT NULL CHECK (minutes_lost > 0 AND minutes_lost <= 480),
  date DATE NOT NULL,
  time_recorded TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  local_id TEXT
);

-- Índices
CREATE INDEX idx_distractions_user_date ON distractions(user_id, date);
CREATE INDEX idx_distractions_category ON distractions(category);
CREATE INDEX idx_distractions_local_id ON distractions(local_id);
CREATE INDEX idx_distractions_session_id ON distractions(session_id);
```

### 5. Tabla Audit Sessions

```sql
CREATE TABLE audit_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_minutes_lost INTEGER DEFAULT 0,
  distraction_count INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  local_id TEXT
);

-- Índices
CREATE INDEX idx_audit_sessions_user_date ON audit_sessions(user_id, date);
CREATE INDEX idx_audit_sessions_local_id ON audit_sessions(local_id);

-- Crear tabla de distractions DESPUÉS de esta (ver arriba)
```

### 6. Tabla Coach Conversations

```sql
CREATE TABLE coach_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  local_id TEXT
);

-- Índices
CREATE INDEX idx_coach_conversations_user ON coach_conversations(user_id);
CREATE INDEX idx_coach_conversations_session ON coach_conversations(session_id);
CREATE INDEX idx_coach_conversations_local_id ON coach_conversations(local_id);
```

### 7. Tabla Sync Metadata

```sql
CREATE TABLE sync_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  last_synced_at TIMESTAMP NOT NULL, -- Timestamp del último cambio local
  server_updated_at TIMESTAMP DEFAULT NOW(), -- Timestamp en servidor
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, table_name, record_id)
);

-- Índices
CREATE INDEX idx_sync_metadata_user_table ON sync_metadata(user_id, table_name);
CREATE INDEX idx_sync_metadata_updated ON sync_metadata(server_updated_at);
```

---

## Row Level Security (RLS)

⚠️ **IMPORTANTE:** Configurar políticas para seguridad

En Supabase Dashboard → Authentication → Policies

### Para cada tabla (ejemplo con `tasks`):

```sql
-- Permitir que usuarios solo vean sus propios datos
CREATE POLICY "Users can read own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);
```

**Aplicar mismo patrón a:**
- sleep_records
- distractions
- audit_sessions
- coach_conversations
- sync_metadata

---

## Variables de Entorno

Actualizar `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Obtener valores de:
- Supabase Dashboard → Settings → API

---

## Verificación

Después de crear todas las tablas, verificar en Supabase:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema='public';
```

Debe mostrar:
- users ✅
- tasks ✅
- sleep_records ✅
- distractions ✅
- audit_sessions ✅
- coach_conversations ✅
- sync_metadata ✅

---

## Próximos Pasos

1. Crear todas las tablas exactamente como arriba
2. Configurar RLS policies para cada tabla
3. Actualizar .env con Supabase credentials
4. Ejecutar: `npm install @supabase/supabase-js` (ya está)
5. Continuar con M1.2 (Sync Queue)

---

**Nota:** Los `local_id` fields sirven para mapear cambios locales con IDs remotos después de sincronización.
