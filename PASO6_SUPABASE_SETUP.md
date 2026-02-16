# 🔐 PASO 6: Setup Guide - Supabase Database

Para que el sistema de autenticación funcione completamente, necesitas crear una tabla en Supabase.

---

## ⚡ Quick Setup (5 minutos)

### 1. Ir a Supabase Dashboard
1. Abre https://app.supabase.com
2. Selecciona tu proyecto "life-coach-ai"
3. Navega a **SQL Editor**

### 2. Ejecutar Script de Creación
Copia y pega el siguiente SQL en el editor y ejecuta:

```sql
-- Crear tabla user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comentar tabla
COMMENT ON TABLE user_profiles IS 'Perfiles de usuarios (datos públicos)';

-- Habilitar Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política: Usuarios pueden crear su propio perfil
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Crear índices para mejor performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);
```

✅ Presiona "Run" y espera a que se complete

---

## 🔍 Verificar Setup

Después de ejecutar el SQL:

### 1. Verificar tabla existe
En Supabase → **Tables** sidebar:
- [ ] Deberías ver `user_profiles` en la lista

### 2. Verificar estructura
Haz click en `user_profiles`:
- [ ] Columnas: `id`, `email`, `name`, `avatar_url`, `created_at`, `updated_at`
- [ ] `id` es UUID PKTipo Foreign Key a `auth.users`
- [ ] RLS está habilitado (mostrado en UI)

### 3. Verificar Políticas
En Supabase → `user_profiles` → **RLS Policies**:
- [ ] 3 políticas listadas (select, update, insert)
- [ ] Todas aplicadas correctamente

---

## 📱 Testear en App

Una vez el SQL está creado:

### 1. Startup App
```bash
npm run start
# o
expo start
```

### 2. Testing Signup
```
1. Pantalla inicial debe mostrar LoginScreen
2. Click "¿No tienes cuenta? Crear"
3. Completa signup:
   Nombre: Juan Pérez
   Email: juan@test.com
   Password: Test123456
   Confirma: Test123456
   ☑ Acepto términos
4. Click "Crear Cuenta"

✓ Debe completar sin errores
✓ Debe transicionar a AppNavigator
✓ Debe mostrar 7 tabs
✓ Debe mostrar datos en ProfileScreen
```

### 3. Testing Login
```
1. En ProfileScreen, click "Cerrar Sesión"
2. Confirma
3. Debe volver a LoginScreen
4. Ingresa:
   Email: juan@test.com
   Password: Test123456
5. Click "Iniciar Sesión"

✓ Debe auténticarse
✓ Debe volver a AppNavigator
✓ Datos del usuario deben estar visibles
```

### 4. Testing Session Persistence
```
1. Está logged in
2. Cierra completamente la app
3. Abre nuevamente la app

✓ DEBE mantener la sesión
✓ NO debe pedir login nuevamente
✓ Debe ir directamente a AppNavigator
```

---

## 🐛 Troubleshooting

### ❌ Error: "23503: insert or update on table 'user_profiles'"
**Causa:** FK reference falla  
**Solución:**
```sql
-- Verificar que auth.users existe
SELECT id FROM auth.users LIMIT 1;

-- Si no hay usuarios, crear usuario de test manualmente en Supabase Auth
-- Luego insertarlo en user_profiles
```

### ❌ Error: "permission denied" cuando signup
**Causa:** RLS policies no configuradas correctamente  
**Solución:**
1. Ve a Supabase → `user_profiles` → **RLS Policies**
2. Verifica que las 3 políticas existen
3. Asegúrate que todas dicen "USING (auth.uid() = id)"
4. Si no, elimina y crea nuevamente con el script de arriba

### ❌ Error: "relation 'user_profiles' does not exist"
**Causa:** Tabla no fue creada  
**Solución:**
1. Ve a SQL Editor
2. Verifica que el script corrió sin errores
3. En Supabase Dashboard → Tables, ¿ves `user_profiles`?
4. Si no, ejecuta el script nuevamente

### ❌ Signup funciona pero Login no
**Causa:** Usuario creado en Auth pero no en BD  
**Solución:**
```sql
-- Verificar que el usuario existe en user_profiles
SELECT id, email FROM user_profiles WHERE email = 'tu@email.com';

-- Si no existe, insertarlo manualmente
INSERT INTO user_profiles (id, email, name)
SELECT id, email, email FROM auth.users
WHERE email = 'tu@email.com'
AND id NOT IN (SELECT id FROM user_profiles);
```

### ❌ La app no actualiza después de crear tabla
**Causa:** Caché de JavaScript  
**Solución:**
```bash
# Limpiar caché y reiniciar
npx expo start --clear
# o en terminal expo: presiona 'c' para clear cache
```

---

## 📋 En-Memory Estructura de Datos

**Tabla `user_profiles`:**
```
┌─────────────────────────────────────┐
│ user_profiles                       │
├─────────────────────────────────────┤
│ id (UUID, PK, FK)          ←─────┐ │
│ email (TEXT)                  │ │
│ name (TEXT)                   │ refiere a
│ avatar_url (TEXT)            │ auth.users(id)
│ created_at (TIMESTAMP)       │ │
│ updated_at (TIMESTAMP)       │ │
│                              └──┐
│ RLS: Habilitado           
│ Índices: email, created_at    
└─────────────────────────────────────┘
```

---

## 🔑 Variables de Entorno

Verificar que tu `.env` contiene:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Si no los tienes:
1. Supabase Dashboard → Settings → API
2. Copia los valores
3. Pégalos en tu archivo `.env` (raíz del proyecto)
4. Reinicia: `expo start --clear`

---

## ✅ Checklist Final

- [ ] SQL script ejecutado sin errores
- [ ] Tabla `user_profiles` existe en Supabase
- [ ] 3 RLS policies creadas y activas
- [ ] Variables de entorno correctas en `.env`
- [ ] App compilada sin errores
- [ ] Signup funciona correctamente
- [ ] Login funciona correctamente
- [ ] Session persiste después de cerrar app
- [ ] Logout limpia sesión
- [ ] ProfileScreen muestra datos correctos

---

## 🎉 ¡Listo!

Una vez todo esto esté completo:
- ✅ Sistema de autenticación completamente funcional
- ✅ 7-tab navigation visible
- ✅ Datos persistentes en Supabase
- ✅ Sesión local persistente
- ✅ Listo para producción

**Para soporte:** Revisar documentación en `PASO6_AUTHENTICATION_COMPLETE.md`

---

**Última actualización:** 2026-02-15  
**Tiempo estimado:** 5-10 minutos
