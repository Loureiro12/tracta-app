import { create } from 'zustand';

import type {
  BodyLogEntry,
  HealthSegment,
  MetricPeriod,
  ReportPeriod,
  SleepRange,
} from './health.types';

type HealthState = {
  /** Selected segment of the Saúde tab (Sono / Atividade / Corpo). */
  segment: HealthSegment;
  setSegment: (segment: HealthSegment) => void;
  sleepRange: SleepRange;
  setSleepRange: (range: SleepRange) => void;
  metricPeriod: MetricPeriod;
  setMetricPeriod: (period: MetricPeriod) => void;
  reportPeriod: ReportPeriod;
  setReportPeriod: (period: ReportPeriod) => void;
  /** Custom report range (days of October). */
  reportFrom: number;
  reportTo: number;
  adjustReportFrom: (delta: number) => void;
  adjustReportTo: (delta: number) => void;
  /** Manual weight/measurement entries (in-memory mock). */
  bodyLogs: BodyLogEntry[];
  addBodyLog: (entry: BodyLogEntry) => void;
};

const REPORT_MIN_DAY = 1;
const REPORT_MAX_DAY = 26;

export const useHealthStore = create<HealthState>((set) => ({
  segment: 'sleep',
  setSegment: (segment) => set({ segment }),
  sleepRange: '7',
  setSleepRange: (sleepRange) => set({ sleepRange }),
  metricPeriod: 'D',
  setMetricPeriod: (metricPeriod) => set({ metricPeriod }),
  reportPeriod: '7',
  setReportPeriod: (reportPeriod) => set({ reportPeriod }),
  reportFrom: 1,
  reportTo: 15,
  adjustReportFrom: (delta) =>
    set((s) => ({
      reportFrom: Math.min(s.reportTo, Math.max(REPORT_MIN_DAY, s.reportFrom + delta)),
    })),
  adjustReportTo: (delta) =>
    set((s) => ({
      reportTo: Math.max(s.reportFrom, Math.min(REPORT_MAX_DAY, s.reportTo + delta)),
    })),
  bodyLogs: [],
  addBodyLog: (entry) =>
    set((s) => ({ bodyLogs: [...s.bodyLogs.filter((x) => x.day !== entry.day), entry] })),
}));
