import { ClassTiming } from '../types';

const SESSION_ALIASES: Record<string, string> = {
  '1': '1',
  '01': '1',
  'الأولى': '1',
  'الاولى': '1',
  'اولى': '1',
  'الحصة الأولى': '1',
  'الحصة الاولى': '1',
  '2': '2',
  '02': '2',
  'الثانية': '2',
  'ثانية': '2',
  'الحصة الثانية': '2',
  '3': '3',
  '03': '3',
  'الثالثة': '3',
  'ثالثة': '3',
  'الحصة الثالثة': '3',
  '4': '4',
  '04': '4',
  'الرابعة': '4',
  'رابعة': '4',
  'الحصة الرابعة': '4',
  '5': '5',
  '05': '5',
  'الخامسة': '5',
  'خامسة': '5',
  'الحصة الخامسة': '5',
  '6': '6',
  '06': '6',
  'السادسة': '6',
  'سادسة': '6',
  'الحصة السادسة': '6',
  '7': '7',
  '07': '7',
  'السابعة': '7',
  'سابعة': '7',
  'الحصة السابعة': '7',
};

export const normalizeSession = (session?: string) => {
  const value = String(session || '').trim();
  if (!value) return '';
  const numeric = value.match(/\d+/)?.[0];
  if (numeric) return String(Number(numeric));
  const cleaned = value.replace(/^حصة\s*/, '').replace(/^الحصة\s*/, '').trim();
  return SESSION_ALIASES[value] || SESSION_ALIASES[cleaned] || cleaned;
};

export const sameSession = (a?: string, b?: string) => normalizeSession(a) === normalizeSession(b);

export const SESSION_LABELS = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'];

const pad = (value: number) => String(value).padStart(2, '0');

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const minutesToTime = (minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
};

export const formatTime12 = (time: string) => {
  const total = timeToMinutes(time);
  const hours24 = Math.floor(total / 60);
  const minutes = total % 60;
  const period = hours24 >= 12 ? 'م' : 'ص';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${pad(minutes)}${period}`;
};

export const buildDefaultClassTimings = () => buildClassTimings('06:45', 15, 45, 20, 2);

export const buildClassTimings = (
  dayStart: string,
  assemblyDuration: number,
  classDuration: number,
  breakDuration: number,
  breakAfterSession: number
): ClassTiming[] => {
  const timings: ClassTiming[] = [];
  let cursor = timeToMinutes(dayStart);
  const push = (timing: Omit<ClassTiming, 'start' | 'end'>) => {
    const start = minutesToTime(cursor);
    cursor += timing.duration;
    timings.push({ ...timing, start, end: minutesToTime(cursor) });
  };

  push({ id: 'assembly', label: 'الطابور', duration: assemblyDuration, type: 'assembly' });
  SESSION_LABELS.forEach((label, index) => {
    const sessionNumber = index + 1;
    push({ id: `session-${sessionNumber}`, label, duration: classDuration, type: 'class', session: label });
    if (sessionNumber === breakAfterSession) {
      push({ id: 'break', label: 'الفسحة', duration: breakDuration, type: 'break' });
    }
  });
  return timings;
};

export const getCurrentClassTiming = (timings: ClassTiming[], now = new Date()) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return timings.find(timing => timing.type === 'class' && currentMinutes >= timeToMinutes(timing.start) && currentMinutes < timeToMinutes(timing.end));
};

export const getRemainingMinutes = (timing: ClassTiming, now = new Date()) => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.max(0, timeToMinutes(timing.end) - currentMinutes);
};

export const getArabicDayName = (date = new Date()) => {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
};
