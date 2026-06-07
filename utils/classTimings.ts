import { ClassTiming } from '../types';

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
