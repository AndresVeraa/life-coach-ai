/**
 * Dark Luxury Wellness Theme
 * Constantes de diseño para el módulo Universidad
 */

export const UNIVERSIDAD_THEME = {
  // Colores base
  colors: {
    // Fondos - Tonos índigo/azul oscuro elegantes
    background: '#1A1B2E',      // Índigo oscuro elegante (más claro y azulado)
    surface: '#222338',          // Superficie elevada
    surfaceElevated: '#2A2B44', // Más elevado
    surfaceCard: '#32334D',     // Para tarjetas
    
    // Acentos
    primary: '#7C6FCD',      // Violeta
    primaryLight: '#9D93E0',
    primaryDark: '#5B4FA8',
    secondary: '#4ECDC4',    // Teal
    secondaryLight: '#7EEAE3',
    secondaryDark: '#3BA99F',
    
    // Texto
    textPrimary: '#F0F0FF',
    textSecondary: '#8B8BA8',   // Más brillante para legibilidad
    textMuted: '#5A5A7C',
    
    // Efectos glassmorphism
    glassBg: 'rgba(124, 111, 205, 0.08)',
    glassBorder: 'rgba(124, 111, 205, 0.15)',
    glassHighlight: 'rgba(255, 255, 255, 0.12)',
    
    // Estados
    success: '#4ADE80',
    successBg: 'rgba(74, 222, 128, 0.15)',
    warning: '#FBBF24',
    warningBg: 'rgba(251, 191, 36, 0.15)',
    error: '#F87171',
    errorBg: 'rgba(248, 113, 113, 0.15)',
    
    // Grid
    gridLine: 'rgba(124, 111, 205, 0.12)',
    gridAlt: '#1E1F35',
  },
  
  // Espaciado
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Bordes
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pill: 100,
  },
  
  // Tipografía
  typography: {
    // Tamaños
    hero: 32,
    h1: 24,
    h2: 20,
    h3: 18,
    body: 15,
    bodySmall: 13,
    caption: 11,
    micro: 9,
    
    // Pesos
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
  
  // Sombras
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#7C6FCD',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    glow: {
      shadowColor: '#7C6FCD',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

// Colores para materias
export const SUBJECT_COLORS = [
  '#7C6FCD', // Violeta
  '#4ECDC4', // Teal
  '#F472B6', // Rosa
  '#60A5FA', // Azul
  '#34D399', // Verde
  '#FBBF24', // Amarillo
  '#F87171', // Rojo
  '#A78BFA', // Lavanda
  '#2DD4BF', // Cyan
  '#FB923C', // Naranja
];

// Tipos de materia con colores
export const SUBJECT_TYPE_THEME: Record<string, { bg: string; text: string; icon: string }> = {
  tecnica: { bg: '#3B82F620', text: '#60A5FA', icon: '⚙️' },
  matematica: { bg: '#8B5CF620', text: '#A78BFA', icon: '📐' },
  teorica: { bg: '#10B98120', text: '#34D399', icon: '📚' },
  humanistica: { bg: '#F59E0B20', text: '#FBBF24', icon: '🎭' },
  laboratorio: { bg: '#EC489920', text: '#F472B6', icon: '🧪' },
};
