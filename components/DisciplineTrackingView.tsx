import React, { useMemo, useState } from 'react';
import { Employee, Report } from '../types';
import { summarizeAllEmployeesDiscipline } from '../utils/discipline';
import { AlertTriangle, CheckCircle, Clock, Search, ShieldCheck } from 'lucide-react';

interface DisciplineTrackingViewProps {
  employees: Employee[];
  reports: Report[];
}

const getStageClasses = (stage: string) => {
  switch (stage) {
    case 'deduction': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'written': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'verbal': return 'bg-blue-50 text-blue-700 border-blue-200';
    default: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
};

const DisciplineTrackingView: React.FC<DisciplineTrackingViewProps> = ({ employees, reports }) => {
  const [search, setSearch] = useState('');
  const summaries = useMemo(() => summarizeAllEmployeesDiscipline(employees, reports), [employees, reports]);
  const filtered = summaries.filter(item => item.employee.name.toLowerCase().includes(search.toLowerCase()));
  const needingAction = summaries.filter(item => item.totalMinutes >= 120).length;
  const completedFollowUp = summaries.filter(item => item.totalMinutes > 0 && item.stage === 'normal').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-amber-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-amber-200">
              <Clock size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800">متابعة التأخر والانصراف خلال السنة المالية</h2>
              <p className="text-sm text-slate-500 font-bold mt-1">تعرف أن المتابعة تمت عندما تظهر الحالة الحالية والإجراء المطلوب لكل موظف بناءً على سجلاته المحفوظة.</p>
            </div>
          </div>
          <div className="relative xl:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث باسم الموظف..."
              className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-amber-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-5">
            <div className="flex items-center gap-3 text-emerald-700 font-black"><ShieldCheck size={22} /> تمت متابعتهم</div>
            <p className="text-4xl font-black text-emerald-800 mt-3">{completedFollowUp}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">لديهم دقائق مسجلة ولم يبلغوا حد الإجراء.</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5">
            <div className="flex items-center gap-3 text-amber-700 font-black"><AlertTriangle size={22} /> يحتاج إجراء</div>
            <p className="text-4xl font-black text-amber-800 mt-3">{needingAction}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">بلغوا ساعتين فأكثر ويظهر الإجراء المطلوب.</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
            <div className="flex items-center gap-3 text-slate-700 font-black"><CheckCircle size={22} /> السنة المالية</div>
            <p className="text-4xl font-black text-slate-800 mt-3">{new Date().getFullYear()}</p>
            <p className="text-xs font-bold text-slate-500 mt-1">من 1 يناير إلى 31 ديسمبر.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs font-black border-b border-slate-200">
                <th className="px-6 py-5">الموظف</th>
                <th className="px-6 py-5">إجمالي الدقائق</th>
                <th className="px-6 py-5">الحالة</th>
                <th className="px-6 py-5">كيف أعرف أنه تمت المتابعة؟</th>
                <th className="px-6 py-5">الإجراء المطلوب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(item => (
                <tr key={item.employee.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-800">{item.employee.name}</div>
                    <div className="text-xs text-slate-400 font-bold">{item.employee.workplace || item.employee.employeeCode || '---'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-black text-2xl text-slate-900">{item.hours}:{String(item.minutes).padStart(2, '0')}</div>
                    <div className="text-xs font-bold text-slate-400">{item.totalMinutes} دقيقة</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex px-3 py-1.5 rounded-xl border text-xs font-black ${getStageClasses(item.stage)}`}>{item.stageLabel}</span>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-600">
                    {item.totalMinutes === 0 ? 'لا توجد دقائق مسجلة بعد.' : 'تمت المتابعة آلياً من السجلات، وتظهر المرحلة الحالية هنا. عند تنفيذ الإجراء يمكن توثيقه في ملاحظات المساءلة أو طباعة البيان.'}
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-700 max-w-md">{item.nextAction}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-bold">لا توجد نتائج مطابقة.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DisciplineTrackingView;
