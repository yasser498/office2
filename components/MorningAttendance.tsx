import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, Search, UserCheck, XCircle, RefreshCw } from 'lucide-react';
import { getMorningAttendanceByDate, getMorningAttendanceRoster, setMorningAttendanceStatus } from '../utils/firebase';
import { MorningAttendanceRecord } from '../types';

interface RosterEmployee {
  id: number;
  name: string;
  employeeCode?: string;
  workplace?: string;
}

const todayISO = () => new Date().toISOString().split('T')[0];

const MorningAttendance: React.FC = () => {
  const [employees, setEmployees] = useState<RosterEmployee[]>([]);
  const [records, setRecords] = useState<Record<string, MorningAttendanceRecord>>({});
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [roster, dayRecords] = await Promise.all([
        getMorningAttendanceRoster(),
        getMorningAttendanceByDate(date),
      ]);
      setEmployees(roster.employees || []);
      setRecords(dayRecords || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter(emp =>
      emp.name.toLowerCase().includes(query) ||
      String(emp.employeeCode || '').toLowerCase().includes(query) ||
      String(emp.workplace || '').toLowerCase().includes(query)
    );
  }, [employees, search]);

  const absentCount = employees.filter(emp => records[String(emp.id)]?.status === 'absent').length;

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

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 p-4 text-slate-800">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-emerald-700 text-white rounded-3xl p-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center">
              <UserCheck size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black">تحضير الموظفين الصباحي</h1>
              <p className="text-sm font-bold text-emerald-100">الحالة الافتراضية: حضر. غياب التحضير يحسب 15 دقيقة تأخير.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-xs font-bold text-emerald-100">عدد الموظفين</p>
              <p className="text-3xl font-black">{employees.length}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-xs font-bold text-emerald-100">لم يحضر</p>
              <p className="text-3xl font-black">{absentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-lg border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-3">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-slate-200 font-black outline-none focus:ring-4 focus:ring-emerald-100"
            />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث باسم الموظف..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 font-bold outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <button onClick={loadData} className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 font-black flex items-center justify-center gap-2">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              تحديث
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-10 text-center font-black text-slate-500">جاري تحميل التحضير...</div>
        ) : employees.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center">
            <p className="font-black text-slate-700">لم يتم نشر قائمة الموظفين بعد.</p>
            <p className="text-sm font-bold text-slate-400 mt-2">افتح إعدادات النظام من الجهاز الرئيسي واضغط تحديث رابط التحضير.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map(employee => {
              const status = records[String(employee.id)]?.status || 'present';
              const isAbsent = status === 'absent';
              return (
                <button
                  key={employee.id}
                  onClick={() => toggleStatus(employee)}
                  disabled={savingId === employee.id}
                  className={`w-full text-right rounded-3xl p-4 shadow-sm border transition-all active:scale-[0.99] ${
                    isAbsent
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-black">{employee.name}</h2>
                      <p className="text-xs font-bold opacity-70">{employee.workplace || employee.employeeCode || 'موظف'}</p>
                    </div>
                    <div className={`shrink-0 px-4 py-2 rounded-2xl font-black flex items-center gap-2 ${isAbsent ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
                      {savingId === employee.id ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : isAbsent ? (
                        <XCircle size={20} />
                      ) : (
                        <CheckCircle size={20} />
                      )}
                      {isAbsent ? 'لم يحضر' : 'حضر'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MorningAttendance;
