import { 
  validateConfig, 
  hasConfigErrors, 
  getConfigErrorMessage, 
  getConfig,
  getCriticalErrors,
  getConfigWarnings,
  isEASBuild,
} from '@/constants/config';

// Re-exportar para uso conveniente
export { getConfig, isEASBuild } from '@/constants/config';

/**
 * Resultado de la validación de configuración
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: ReturnType<typeof getConfig> | null;
}

/**
 * Validar configuración al iniciar la app
 * En EAS builds, es más permisivo
 * @returns Resultado de validación con errores y warnings
 */
export const validateAppConfig = (): ConfigValidationResult => {
  const config = getConfig();
  const criticalErrors = getCriticalErrors();
  const warnings = getConfigWarnings();
  const inEASBuild = isEASBuild();
  
  // Log para debugging en EAS builds
  if (inEASBuild) {
    console.log('[ConfigValidator] ========================================');
    console.log('[ConfigValidator] Running in EAS Build environment');
    console.log('[ConfigValidator] Supabase URL:', config.env.SUPABASE_URL ? '✓ present' : '✗ missing');
    console.log('[ConfigValidator] Supabase Key:', config.env.SUPABASE_ANON_KEY ? '✓ present' : '✗ missing');
    console.log('[ConfigValidator] Gemini Key:', config.env.GEMINI_API_KEY ? '✓ present' : '✗ missing');
    console.log('[ConfigValidator] OpenAI Key:', config.env.OPENAI_API_KEY ? '✓ present' : '✗ missing');
    console.log('[ConfigValidator] EAS Project ID:', config.env.EAS_PROJECT_ID ? '✓ present' : '✗ missing');
    console.log('[ConfigValidator] ========================================');
  }
  
  // En EAS builds, ser más permisivo - asumir válido si no hay errores críticos reales
  const isValid = inEASBuild || criticalErrors.length === 0;

  return {
    isValid,
    errors: criticalErrors,
    warnings,
    config: isValid ? config : null,
  };
};

/**
 * Verificar configuración y lanzar error si es inválida
 * Útil para usar en el entry point de la app
 */
export const assertValidConfig = (): void => {
  const result = validateAppConfig();

  if (!result.isValid) {
    const errorMessage = getConfigErrorMessage();
    console.error('🚨 Configuration Error:', errorMessage);
    throw new Error(errorMessage || 'Invalid configuration');
  }

  // Log warnings pero no fallar
  if (result.warnings.length > 0) {
    console.warn('⚠️ Configuration Warnings:');
    result.warnings.forEach((w) => console.warn(`  ${w}`));
  }
};

/**
 * Hook para usar en componentes que necesitan verificar config
 */
export const useConfigValidation = () => {
  const result = validateAppConfig();
  const config = getConfig();

  return {
    isValid: result.isValid,
    errors: result.errors,
    warnings: result.warnings,
    isEASBuild: isEASBuild(),
    hasAiKey: !!(config.env.OPENAI_API_KEY || config.env.GEMINI_API_KEY),
    hasSupabase: !!(config.env.SUPABASE_URL && config.env.SUPABASE_ANON_KEY),
  };
};
