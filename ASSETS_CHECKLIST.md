# 📦 Assets Requeridos para EAS Build

Asegúrate de tener estos archivos en la carpeta `/assets`:

## Iconos Requeridos

| Archivo | Dimensiones | Descripción |
|---------|-------------|-------------|
| `icon.png` | 1024x1024 px | Icono principal de la app |
| `adaptive-icon.png` | 1024x1024 px | Icono adaptativo Android (foreground) |
| `splash.png` | 1284x2778 px | Splash screen |
| `notification-icon.png` | 96x96 px | Icono de notificaciones (Android, monocromático) |
| `favicon.png` | 48x48 px | Favicon para web |

## Especificaciones

### icon.png
- Formato: PNG
- Sin transparencia para iOS
- Esquinas redondeadas las agrega el sistema

### adaptive-icon.png
- Formato: PNG con transparencia
- El fondo se define en `app.config.ts` (backgroundColor)
- Solo el foreground, centrado

### notification-icon.png
- **IMPORTANTE:** Solo blanco y transparente
- Android usa silhouette del icono
- No usar colores, solo forma

### splash.png
- Formato: PNG
- Imagen centrada sobre el backgroundColor
- ResizeMode: 'contain' o 'cover'

## Generar Assets Automáticamente

```bash
# Si tienes un icono base de 1024x1024
npx expo-optimize

# O usar herramientas online:
# - https://appicon.co
# - https://makeappicon.com
```

## Validar Assets

```bash
# Verificar que todos los assets existen
ls -la assets/

# Debería mostrar:
# icon.png
# adaptive-icon.png  
# splash.png
# notification-icon.png
# favicon.png
```

## Crear Assets Placeholder (Temporal)

Si no tienes los assets aún, puedes crear placeholders:

```bash
# En PowerShell, desde la raíz del proyecto:
# Los iconos deben ser creados con un editor de imágenes
# Recomendaciones:
# - Figma (gratis): figma.com
# - Canva (gratis): canva.com
# - Adobe XD (gratis): adobe.com/products/xd
```

## Checklist Pre-Build

- [ ] `assets/icon.png` (1024x1024)
- [ ] `assets/adaptive-icon.png` (1024x1024)
- [ ] `assets/splash.png` (1284x2778 o similar)
- [ ] `assets/notification-icon.png` (96x96, monocromático)
- [ ] `assets/favicon.png` (48x48)

## Recursos Útiles

- [Expo Icons Guide](https://docs.expo.dev/develop/user-interface/app-icons/)
- [Expo Splash Screen Guide](https://docs.expo.dev/develop/user-interface/splash-screen/)
- [Android Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
