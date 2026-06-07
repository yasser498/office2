import { Employee, Report } from '../types';

export const FINANCIAL_YEAR_START_MONTH = 0;
export const VERBAL_WARNING_MINUTES = 120;
export const WRITTEN_WARNING_MINUTES = 180;
export const DEDUCTION_MINUTES = 420;

export type DisciplineStage = 'normal' | 'verbal' | 'written' | 'deduction';

export interface DisciplineSummary {
  employee: Employee;
  reports: Report[];
  totalMinutes: number;
  hours: number;
  minutes: number;
  stage: DisciplineStage;
  stageLabel: string;
  nextAction: string;
  nextThresholdMinutes: number | null;
}

const currentFinancialYear = () => new Date().getFullYear();

export const getFinancialYearRange = (year = currentFinancialYear()) => ({
  start: new Date(year, FINANCIAL_YEAR_START_MONTH, 1),
  end: new Date(year, 11, 31, 23, 59, 59, 999),
});

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

export const getReportMinutes = (report: Report) => {
  if (typeof report.minutesCount === 'number') return report.minutesCount;
  if (report.lateArrivalTime) return toNumber(report.lateArrivalTime);
  if (report.earlyDepartureTime && report.violationCategory?.includes('early')) return toNumber(report.earlyDepartureTime);
  if (report.absenceSession || report.type === 'غياب_حصة') return 45;
  if (report.type === 'مساءلة_حصص' && report.missedClasses?.length) return report.missedClasses.length * 45;
  return 0;
};

export const isDelayDeductionReport = (report: Report) => {
  if (report.type === 'غياب') return false;
  return getReportMinutes(report) > 0;
};

export const getStage = (totalMinutes: number): DisciplineStage => {
  if (totalMinutes >= DEDUCTION_MINUTES) return 'deduction';
  if (totalMinutes >= WRITTEN_WARNING_MINUTES) return 'written';
  if (totalMinutes >= VERBAL_WARNING_MINUTES) return 'verbal';
  return 'normal';
};

export const getStageLabel = (stage: DisciplineStage) => {
  switch (stage) {
    case 'deduction': return 'قرار حسم / احتساب من الرصيد';
    case 'written': return 'تنبيه خطي';
    case 'verbal': return 'تنبيه شفهي';
    default: return 'متابعة عادية';
  }
};

export const getNextAction = (totalMinutes: number) => {
  if (totalMinutes >= DEDUCTION_MINUTES) {
    return 'إصدار قرار حسم دقائق التأخر والانصراف أو احتسابها من الرصيد الاعتيادي حسب تقدير المدير، مع إرفاق البيان والمساءلات.';
  }
  if (totalMinutes >= WRITTEN_WARNING_MINUTES) {
    const nextHour = Math.min(DEDUCTION_MINUTES, Math.ceil((totalMinutes + 1) / 60) * 60);
    return `تنبيه خطي، ويتكرر التنبيه عند كل ساعة إضافية حتى بلوغ 7 ساعات. الحد التالي: ${Math.floor(nextHour / 60)} ساعات.`;
  }
  if (totalMinutes >= VERBAL_WARNING_MINUTES) {
    return 'تنبيه الموظف شفهياً من المدير المباشر أو من يفوضه.';
  }
  return 'لا يوجد إجراء الآن، فقط متابعة تراكم الدقائق خلال السنة المالية.';
};

export const getNextThreshold = (totalMinutes: number) => {
  if (totalMinutes < VERBAL_WARNING_MINUTES) return VERBAL_WARNING_MINUTES;
  if (totalMinutes < WRITTEN_WARNING_MINUTES) return WRITTEN_WARNING_MINUTES;
  if (totalMinutes < DEDUCTION_MINUTES) return Math.min(DEDUCTION_MINUTES, Math.ceil((totalMinutes + 1) / 60) * 60);
  return null;
};

export const summarizeEmployeeDiscipline = (employee: Employee, reports: Report[], year = currentFinancialYear()): DisciplineSummary => {
  const { start, end } = getFinancialYearRange(year);
  const employeeReports = reports.filter(report => {
    if (report.employeeId !== employee.id || !isDelayDeductionReport(report)) return false;
    const date = new Date(report.date);
    return date >= start && date <= end;
  });
  const totalMinutes = employeeReports.reduce((sum, report) => sum + getReportMinutes(report), 0);
  const stage = getStage(totalMinutes);
  return {
    employee,
    reports: employeeReports,
    totalMinutes,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    stage,
    stageLabel: getStageLabel(stage),
    nextAction: getNextAction(totalMinutes),
    nextThresholdMinutes: getNextThreshold(totalMinutes),
  };
};

export const summarizeAllEmployeesDiscipline = (employees: Employee[], reports: Report[], year = currentFinancialYear()) =>
  employees.map(employee => summarizeEmployeeDiscipline(employee, reports, year))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
