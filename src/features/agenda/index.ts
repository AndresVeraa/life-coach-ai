/**
 * Agenda Feature - Exports
 * Life Coach AI - Universidad + Calendario Académico 2026-1
 */

// Store
export {
  useUniversityStore,
  useCurrentWeekSummary,
  useTodaySchedule,
  useDaysUntilNextEvaluation,
  selectSubjects,
  selectStudyBlocks,
  selectAcademicEvents,
  selectIsInitialized,
} from './university.store';

// Screens
export { UniversityScheduleScreen } from './screens/UniversityScheduleScreen';

// Components
export {
  WeeklyView,
  CalendarView,
  SubjectsView,
  AddSubjectModal,
} from './components';
