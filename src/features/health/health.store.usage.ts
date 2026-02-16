/**
 * HEALTH STORE USAGE GUIDE
 * 
 * El Health Store gestiona todo lo relacionado con sueño y métricas de salud.
 * Utiliza Zustand + AsyncStorage para persistencia offline.
 */

import { useHealthStore } from './health.store';

/**
 * EJEMPLO 1: Agregar un registro de sueño
 */
export const ExampleAddSleep = () => {
  const { addSleepRecord } = useHealthStore();

  const handleAddSleep = () => {
    addSleepRecord({
      date: '2026-02-15',
      timeIn: '23:30',
      timeOut: '07:15',
      quality: 4,
      notes: 'Dormí bien, solo me desperté una vez',
    });
  };

  return null;
};

/**
 * EJEMPLO 2: Obtener estadísticas
 */
export const ExampleGetStats = () => {
  const { metrics, last7Days } = useHealthStore();

  // metrics contiene:
  // - averageSleep (número de horas promedio)
  // - consecutiveDays (días seguidos registrados)
  // - bestDay, worstDay (1-5 de calidad)
  // - goalMet (boolean: cumplió meta de 8 horas?)
  // - lastRecordDate (última fecha registrada)
  // - totalRecordsMonth (registros en el mes actual)

  // last7Days contiene array de:
  // - date (YYYY-MM-DD)
  // - hours (horas de sueño ese día)
  // - quality (1-5, 0 si sin registro)

  console.log('Promedio de sueño:', metrics.averageSleep);
  console.log('Últimos 7 días:', last7Days);

  return null;
};

/**
 * EJEMPLO 3: Actualizar un registro
 */
export const ExampleUpdateRecord = () => {
  const { updateSleepRecord } = useHealthStore();

  const handleUpdateRecord = (recordId: string) => {
    updateSleepRecord(recordId, {
      quality: 5,
      notes: 'Actualicé: fue un sueño excelente',
    });
  };

  return null;
};

/**
 * EJEMPLO 4: Eliminar un registro
 */
export const ExampleDeleteRecord = () => {
  const { deleteSleepRecord } = useHealthStore();

  const handleDelete = (recordId: string) => {
    deleteSleepRecord(recordId);
  };

  return null;
};

/**
 * EJEMPLO 5: Obtener registros en un rango de fechas
 */
export const ExampleGetRange = () => {
  const { getSleepRecordsByRange } = useHealthStore();

  const records = getSleepRecordsByRange('2026-02-01', '2026-02-15');
  console.log('Registros de febrero 1-15:', records);

  return null;
};

/**
 * MÉTODOS DISPONIBLES EN useHealthStore():
 * 
 * addSleepRecord(record)
 *   - Agrega nuevo registro de sueño
 *   - Retorna void (actualiza automáticamente)
 * 
 * updateSleepRecord(id, updates)
 *   - Actualiza un registro existente
 * 
 * deleteSleepRecord(id)
 *   - Elimina un registro
 * 
 * getSleepRecordsByRange(startDate, endDate)
 *   - Retorna array de registros entre fechas (ISO format)
 * 
 * getMetrics()
 *   - Retorna objeto HealthMetrics con estadísticas calculadas
 * 
 * clearHistory()
 *   - Elimina todos los registros (¡usar con cuidado!)
 * 
 * Propiedades de estado:
 * - records: SleepRecord[]
 * - metrics: HealthMetrics
 * - last7Days: Array<{ date, hours, quality }>
 */
