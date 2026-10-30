import { create } from 'zustand';

import type { HealthSegment, MetricPeriod, ReportPeriod, SleepRange } from './health.types';

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
  /** Custom report range (days of the current month). */
  reportFrom: number;
  reportTo: number;
  adjustReportFrom: (delta: number) => void;
  /** `maxDay` = today's day of the month (the range never goes past today). */
  adjustReportTo: (delta: number, maxDay: number) => void;
};

const REPORT_MIN_DAY = 1;

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
  adjustReportTo: (delta, maxDay) =>
    set((s) => ({
      reportTo: Math.max(s.reportFrom, Math.min(maxDay, s.reportTo + delta)),
    })),
}));
