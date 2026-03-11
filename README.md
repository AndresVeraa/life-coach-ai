# 🧠 Life Coach AI

Tu asistente personal de productividad y bienestar impulsado por IA.

## 📱 Descripción

Life Coach AI es una aplicación móvil que te ayuda a:
- 📋 Gestionar tareas y hábitos diarios
- 😴 Rastrear tu sueño y salud
- 🤖 Recibir coaching personalizado con IA
- ⏰ Auditar tu tiempo y distracciones
- 📊 Analizar patrones de productividad

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`
- Cuenta de Expo: [expo.dev](https://expo.dev)

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/life-coach-ai.git
cd life-coach-ai

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Iniciar en desarrollo
npm start
```

---

## 🏗️ Builds con EAS

### Primera Configuración (Una sola vez)

#### 1. Iniciar sesión en Expo

```bash
# Iniciar sesión
eas login

# Verificar sesión
eas whoami
```

#### 2. Inicializar proyecto en EAS

```bash
eas init
```

Esto creará tu proyecto en Expo y generará un `projectId`. 
**Importante:** Actualiza estos valores en `app.config.ts`:

```typescript
extra: {
  eas: {
    projectId: 'TU_PROJECT_ID_GENERADO',
  },
},
updates: {
  url: 'https://u.expo.dev/TU_PROJECT_ID_GENERADO',
},
owner: 'tu-expo-username',
```

#### 3. Configurar credenciales

```bash
# Android: EAS genera automáticamente el keystore
eas credentials --platform android

# iOS: Necesitas una cuenta de Apple Developer ($99/año)
eas credentials --platform ios
```

---

### 🤖 Build para Android

#### Preview Build (APK para testing interno)

```bash
# Generar APK
npm run build:android:preview

# O directamente:
eas build --platform android --profile preview
```

**Resultado:** Un archivo `.apk` descargable desde el dashboard de EAS.

#### Instalar APK en dispositivo Android

1. **Desde el dashboard de EAS:**
   - Ve a [expo.dev](https://expo.dev) → tu proyecto → Builds
   - Encuentra el build preview completado
   - Click en "Download" para descargar el APK
   - Transfiere el APK a tu dispositivo Android
   - Abre el archivo APK e instala (habilita "Fuentes desconocidas" si es necesario)

2. **Con código QR:**
   - Al completar el build, EAS muestra un QR
   - Escanea con tu dispositivo Android
   - Descarga e instala directamente

3. **Con CLI:**
   ```bash
   # Instalar en dispositivo conectado por USB
   eas build:run --platform android
   ```

#### Production Build (AAB para Play Store)

```bash
npm run build:android:prod
```

**Resultado:** Un archivo `.aab` (Android App Bundle) para subir a Google Play Console.

---

### 🍎 Build para iOS

#### Preview Build (para dispositivos registrados)

```bash
npm run build:ios:preview
```

**Nota:** Para builds iOS internos, necesitas registrar los UDIDs de los dispositivos:

```bash
# Registrar dispositivos
eas device:create
```

#### Instalar en dispositivo iOS (Ad Hoc)

1. **Registrar dispositivo:**
   ```bash
   eas device:create
   ```
   Esto te da una URL para que los testers registren sus dispositivos.

2. **Reconstruir con dispositivos registrados:**
   ```bash
   eas build --platform ios --profile preview
   ```

3. **Instalar:**
   - Escanea el QR del build completado con tu iPhone
   - O descarga el `.ipa` y usa Apple Configurator 2

#### Production Build (para App Store / TestFlight)

```bash
npm run build:ios:prod
```

---

### 🧪 Distribución con TestFlight (iOS)

TestFlight es la forma oficial de Apple para distribuir builds de prueba.

#### Paso 1: Configurar App Store Connect

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Click "+" → "Nueva app"
3. Completa:
   - **Plataforma:** iOS
   - **Nombre:** Life Coach AI
   - **Idioma principal:** Español
   - **Bundle ID:** `com.tuempresa.lifecoachai`
   - **SKU:** `lifecoachai-001`

#### Paso 2: Configurar eas.json para submit

Actualiza `eas.json` con tus credenciales de Apple:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "tu-email@icloud.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD1234EF"
      }
    }
  }
}
```

**¿Dónde encontrar estos valores?**
- `appleId`: Tu email de Apple Developer
- `ascAppId`: App Store Connect → Tu App → Información general → Apple ID
- `appleTeamId`: [developer.apple.com](https://developer.apple.com) → Membership → Team ID

#### Paso 3: Build y Submit

```bash
# Opción A: Build y submit separados
npm run build:ios:prod
npm run submit:ios

# Opción B: Build y submit juntos
eas build --platform ios --profile production --auto-submit
```

#### Paso 4: Invitar Testers en TestFlight

1. Ve a App Store Connect → TestFlight
2. Espera que el build pase la revisión automática (~30 min)
3. Click "Testers Internos" o "Testers Externos"
4. Agrega emails de testers
5. Los testers reciben invitación para descargar TestFlight app

---

### 📦 Subir a Google Play Store

#### Paso 1: Configurar Google Play Console

1. Ve a [Google Play Console](https://play.google.com/console)
2. Crea una nueva app
3. Completa la información de la app

#### Paso 2: Crear Service Account

1. En Google Cloud Console, crea un Service Account
2. Descarga el JSON de credenciales
3. Guárdalo como `google-service-account.json` en la raíz del proyecto
4. En Play Console, vincula el Service Account

#### Paso 3: Submit

```bash
# Generar AAB y subir
npm run build:android:prod
npm run submit:android
```

---

## 📋 Resumen de Comandos

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia servidor de desarrollo |
| `npm run build:android:preview` | APK para testing interno |
| `npm run build:ios:preview` | IPA para dispositivos registrados |
| `npm run build:android:prod` | AAB para Google Play |
| `npm run build:ios:prod` | IPA para App Store |
| `npm run submit:android` | Sube a Google Play |
| `npm run submit:ios` | Sube a App Store/TestFlight |
| `npm run update:preview` | OTA update para preview |
| `npm run update:production` | OTA update para producción |

---

## 🔧 Troubleshooting

### Error: "Missing credentials"

```bash
# Regenerar credenciales
eas credentials --platform [android|ios]
```

### Error: "Device not registered" (iOS)

```bash
# Registrar dispositivo
eas device:create

# Reconstruir
npm run build:ios:preview
```

### Error: "Build failed"

1. Verifica logs en [expo.dev](https://expo.dev) → Builds
2. Asegúrate de que `app.config.ts` tiene todos los campos requeridos
3. Verifica que las versiones de dependencias son compatibles

### Error: "EAS project ID not found"

```bash
# Re-inicializar proyecto
eas init --id TU_PROJECT_ID
```

---

## 📄 Variables de Entorno

Crea un archivo `.env` en la raíz:

```bash
# Supabase (REQUERIDO)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# AI APIs (al menos uno requerido)
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_GEMINI_API_KEY=AIza...

# Debug
EXPO_PUBLIC_DEBUG_MODE=false
```

**Nota:** Para EAS builds, configura estas variables en:
- [expo.dev](https://expo.dev) → Tu proyecto → Secrets

---

## 📱 Requisitos del Sistema

### Android
- Android 6.0 (API 23) o superior
- ~50MB de espacio
- Conexión a internet para sincronización

### iOS
- iOS 13.0 o superior
- ~50MB de espacio
- Conexión a internet para sincronización

---

## 👥 Equipo

- **Desarrollo:** Tu Nombre
- **Diseño:** Tu Nombre
- **IA/ML:** OpenAI GPT / Google Gemini

---

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

---

## 🆘 Soporte

¿Problemas? Abre un [issue](https://github.com/tu-usuario/life-coach-ai/issues) o contacta a soporte@tuempresa.com.
