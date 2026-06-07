import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle, Clock, LogOut, RefreshCw, Search, UserCheck, Users, XCircle } from 'lucide-react';
import { getAdminPortalPayload, getClassIncidentsByDate, getMorningAttendanceByDate, setClassIncident, setMorningAttendanceStatus } from '../utils/firebase';
import { AdminClassIncident, AdminPortalPayload, ClassTiming, MorningAttendanceRecord, ScheduleEntry } from '../types';
import { buildDefaultClassTimings, formatTime12, getArabicDayName, getCurrentClassTiming, getRemainingMinutes } from '../utils/classTimings';

interface RosterEmployee {
  id: number;
  name: string;
  employeeCode?: string;
  workplace?: string;
}

const todayISO = () => new Date().toISOString().split('T')[0];
const CACHE_KEY = 'admin_portal_payload_v1';

const readCache = (): AdminPortalPayload | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (payload: AdminPortalPayload) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
};

const sameClass = (a: ScheduleEntry, b: ScheduleEntry) =>
  a.day === b.day && a.session === b.session && a.grade === b.grade && a.section === b.section && a.teacher === b.teacher;

const MorningAttendance: React.FC = () => {
  const [mode, setMode] = useState<'home' | 'morning' | 'classes'>('home');
  const [payload, setPayload] = useState<AdminPortalPayload>(() => readCache() || { updatedAt: '', employees: [], schedule: [], timings: buildDefaultClassTimings() });
  const [records, setRecords] = useState<Record<string, MorningAttendanceRecord>>({});
  const [classRecords, setClassRecords] = useState<Record<string, AdminClassIncident>>({});
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);

  const date = todayISO();
  const dayName = getArabicDayName();
  const timings = payload.timings?.length ? payload.timings : buildDefaultClassTimings();
  const currentTiming = getCurrentClassTiming(timings) || timings.find(t => t.type === 'class');

  const loadDayRecords = async () => {
    const [dayRecords, incidents] = await Promise.all([
      getMorningAttendanceByDate(date),
      getClassIncidentsByDate(date),
    ]);
    setRecords(dayRecords || {});
    setClassRecords(incidents || {});
  };

  const refreshPayload = async () => {
    setLoading(true);
    try {
      const fresh = await getAdminPortalPayload();
      const normalized = {
        ...fresh,
        timings: fresh.timings?.length ? fresh.timings : buildDefaultClassTimings(),
      };
      setPayload(normalized);
      writeCache(normalized);
      await loadDayRecords();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      if (!payload.updatedAt) {
        await refreshPayload();
        return;
      }
      setLoading(true);
      try {
        await loadDayRecords();
      } finally {
        setLoading(false);
      }
    };
    loadInitial();
  }, []);

  const employees = payload.employees as RosterEmployee[];
  const absentCount = employees.filter(emp => records[String(emp.id)]?.status === 'absent').length;

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(query) ||
      String(emp.employeeCode || '').toLowerCase().includes(query) ||
      String(emp.workplace || '').toLowerCase().includes(query)
    );
  }, [employees, search]);

  const todaySchedule = useMemo(() => {
    const dayRows = payload.schedule.filter(row => row.day === dayName);
    return dayRows.length ? dayRows : payload.schedule;
  }, [payload.schedule, dayName]);

  const grades = Array.from(new Set(todaySchedule.map(row => row.grade).filter(Boolean))).sort();
  const sections = Array.from(new Set(todaySchedule.filter(row => !gradeFilter || row.grade === gradeFilter).map(row => row.section).filter(Boolean))).sort();
  const activeSession = currentTiming?.session || '';

  const filteredSchedule = todaySchedule.filter(row =>
    (!gradeFilter || row.grade === gradeFilter) &&
    (!sectionFilter || row.section === sectionFilter) &&
    (!activeSession || row.session === activeSession)
  );

  const toggleStatus = async (employee: RosterEmployee) => {
    const current = records[String(employee.id)]?.status || 'present';
    const next = current === 'present' ? 'absent' : 'present';
    setSavingId(employee.id);
    try {
      const saved = await setMorningAttendanceStatus(date, { id: employee.id, name: employee.name }, next);
      setRecords(prev => ({ ...prev, [String(employee.id)]: saved }));
    } finally {
      setSavingId(null);
    }
  };

  const findTimingForSession = (session: string): ClassTiming | undefined =>
    timings.find(timing => timing.type === 'class' && timing.session === session) || currentTiming;

  const incidentKey = (row: ScheduleEntry, incidentType: AdminClassIncident['incidentType']) =>
    Object.keys(classRecords).find(key => {
      const record = classRecords[key];
      return record.incidentType === incidentType && sameClass(record.scheduleEntry, row);
    });

  const recordClassIncident = async (row: ScheduleEntry, incidentType: AdminClassIncident['incidentType']) => {
    const timing = findTimingForSession(row.session);
    const remainingMinutes = incidentType === 'early_departure' && timing ? getRemainingMinutes(timing) : (timing?.duration || 45);
    setSavingId(`${row.grade}-${row.section}-${row.session}-${incidentType}`);
    try {
      const saved = await setClassIncident({
        date,
        day: dayName,
        scheduleEntry: row,
        incidentType,
        recordedAt: new Date().toISOString(),
        remainingMinutes,
        classEndTime: timing?.end,
      });
      setClassRecords(prev => ({ ...prev, [saved.id!]: saved }));
    } finally {
      setSavingId(null);
    }
  };

  const Header = () => (
    <div className="bg-emerald-700 text-white rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {mode !== 'home' && <button onClick={() => setMode('home')} className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center"><ArrowRight size={22} /></button>}
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center">
            <UserCheck size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black">بوابة الإداري</h1>
            <p className="text-sm font-bold text-emerald-100">{dayName} - {date}</p>
          </div>
        </div>
        <button onClick={refreshPayload} className="px-4 py-2 rounded-2xl bg-white/15 hover:bg-white/20 font-black flex items-center gap-2">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          تحديث البيانات
        </button>
      </div>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 p-4 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-4">
        <Header />

        {mode === 'home' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onClick={() => setMode('morning')} className="bg-white rounded-[2rem] p-8 border border-emerald-100 shadow-lg text-right hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-5"><Users size={34} /></div>
              <h2 className="text-2xl font-black text-slate-900">تحضير الموظفين الصباحي</h2>
              <p className="text-sm font-bold text-slate-500 mt-2">افتراضيًا الكل حاضر، وعدم الحضور يحسب 15 دقيقة تأخير.</p>
              <div className="mt-5 bg-emerald-50 text-emerald-700 rounded-2xl p-3 font-black">لم يحضر: {absentCount}</div>
            </button>
            <button onClick={() => setMode('classes')} className="bg-white rounded-[2rem] p-8 border border-amber-100 shadow-lg text-right hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mb-5"><BookOpenCheck size={34} /></div>
              <h2 className="text-2xl font-black text-slate-900">تسجيل عدم حضور الحصص</h2>
              <p className="text-sm font-bold text-slate-500 mt-2">يعرض الحصة الحالية والفصول، ويسجل عدم الحضور أو الانصراف مع حساب المدة المتبقية.</p>
              <div className="mt-5 bg-amber-50 text-amber-700 rounded-2xl p-3 font-black">الحصة الحالية: {currentTiming?.label || 'غير محددة'}</div>
            </button>
          </div>
        )}

        {mode === 'morning' && (
          <>
            <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم الموظف..." className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-4 focus:ring-emerald-100" />
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl font-black">عدد الموظفين: {employees.length}</div>
              </div>
            </div>
            <div className="space-y-3">
              {filteredEmployees.map(employee => {
                const status = records[String(employee.id)]?.status || 'present';
                const isAbsent = status === 'absent';
                return (
                  <button key={employee.id} onClick={() => toggleStatus(employee)} disabled={savingId === employee.id} className={`w-full text-right rounded-3xl p-4 shadow-sm border transition-all active:scale-[0.99] ${isAbsent ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div><h2 className="text-lg font-black">{employee.name}</h2><p className="text-xs font-bold opacity-70">{employee.workplace || employee.employeeCode || 'موظف'}</p></div>
                      <div className={`shrink-0 px-4 py-2 rounded-2xl font-black flex items-center gap-2 ${isAbsent ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {savingId === employee.id ? <RefreshCw size={18} className="animate-spin" /> : isAbsent ? <XCircle size={20} /> : <CheckCircle size={20} />}
                        {isAbsent ? 'لم يحضر' : 'حضر'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {mode === 'classes' && (
          <>
            <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-amber-50 rounded-2xl p-4 md:col-span-1">
                  <p className="text-xs font-black text-amber-600">الحصة الحالية</p>
                  <h3 className="text-2xl font-black text-amber-900">{currentTiming?.label || 'غير محددة'}</h3>
                  <p className="text-xs font-bold text-amber-700 mt-1">{currentTiming ? `${formatTime12(currentTiming.start)} - ${formatTime12(currentTiming.end)}` : 'خارج وقت الحصص'}</p>
                </div>
                <select value={gradeFilter} onChange={e => { setGradeFilter(e.target.value); setSectionFilter(''); }} className="px-4 py-3 rounded-2xl border border-slate-200 font-black outline-none focus:ring-4 focus:ring-amber-100">
                  <option value="">كل الصفوف</option>
                  {grades.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
                <select value={sectionFilter} onChange={e => setSectionFilter(e.target.value)} className="px-4 py-3 rounded-2xl border border-slate-200 font-black outline-none focus:ring-4 focus:ring-amber-100">
                  <option value="">كل الفصول</option>
                  {sections.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSchedule.map((row, index) => {
                const absenceRecorded = incidentKey(row, 'absence');
                const departureRecorded = incidentKey(row, 'early_departure');
                const timing = findTimingForSession(row.session);
                const remaining = timing ? getRemainingMinutes(timing) : 0;
                return (
                  <div key={`${row.day}-${row.session}-${row.grade}-${row.section}-${index}`} className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="bg-slate-100 px-3 py-1 rounded-xl text-xs font-black">{row.grade}</span>
                          <span className="bg-slate-100 px-3 py-1 rounded-xl text-xs font-black">فصل {row.section}</span>
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-xl text-xs font-black">{row.session}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">{row.teacher}</h3>
                        <p className="text-sm font-bold text-slate-500">{row.subject || '---'}</p>
                      </div>
                      <div className="text-left text-xs font-bold text-slate-400">
                        {timing ? `${formatTime12(timing.start)} - ${formatTime12(timing.end)}` : ''}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button onClick={() => recordClassIncident(row, 'absence')} disabled={!!absenceRecorded || savingId === `${row.grade}-${row.section}-${row.session}-absence`} className="bg-rose-600 disabled:bg-rose-200 text-white rounded-2xl py-3 font-black flex items-center justify-center gap-2">
                        <XCircle size={18} /> {absenceRecorded ? 'تم عدم الحضور' : 'عدم حضور'}
                      </button>
                      <button onClick={() => recordClassIncident(row, 'early_departure')} disabled={!!departureRecorded || savingId === `${row.grade}-${row.section}-${row.session}-early_departure`} className="bg-amber-500 disabled:bg-amber-200 text-white rounded-2xl py-3 font-black flex items-center justify-center gap-2">
                        <LogOut size={18} /> {departureRecorded ? 'تم الانصراف' : `انصراف (${remaining}د)`}
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredSchedule.length === 0 && (
                <div className="md:col-span-2 bg-white rounded-3xl p-10 text-center font-black text-slate-500">لا توجد حصص مطابقة للفلاتر.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MorningAttendance;
