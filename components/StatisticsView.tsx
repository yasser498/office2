import { Report, Employee } from '../types';
import { BarChart3, Users, AlertTriangle, CalendarDays, TrendingUp, TrendingDown, UserMinus, Printer, Zap } from 'lucide-react';
import { generateStatisticsPDF } from '../utils/pdfGenerator';
import * as dbUtils from '../utils/db';
import React, { useMemo } from 'react';

interface StatisticsViewProps {
  reports: Report[];
  employees: Employee[];
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ reports, employees }) => {
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  const stats = useMemo(() => {
    const totalReports = reports.length;
    const absenceCount = reports.filter(r => r.type === 'غياب').length;
    const lateCount = reports.filter(r => (r.type === 'تأخر_انصراف' || r.type === 'مساءلة_حصص') && (r.excuseStatus === 'rejected' || !r.excuseStatus)).length;
    
    const employeeFreq: Record<number, number> = {};
    reports.forEach(r => {
      employeeFreq[r.employeeId] = (employeeFreq[r.employeeId] || 0) + 1;
    });

    const topEmployees = Object.entries(employeeFreq)
      .map(([id, count]) => ({
        employee: employees.find(e => e.id === Number(id)),
        count
      }))
      .filter(item => item.employee)
      .sort((a, b) => b.count - a.count)
      .slice(0, 40);

    const monthlyData: Record<number, number> = {};
    reports.forEach(r => {
      const d = new Date(r.date);
      const month = d.getMonth();
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    let maxVal = -1;
    let minVal = Infinity;
    let highestMonthIdx = -1;
    let lowestMonthIdx = -1;

    for (let i = 0; i < 12; i++) {
      const val = monthlyData[i] || 0;
      if (val > maxVal) {
        maxVal = val;
        highestMonthIdx = i;
      }
      if (val < minVal) {
        minVal = val;
        lowestMonthIdx = i;
      }
    }

    return { 
      totalReports, 
      absenceCount, 
      lateCount, 
      topEmployees, 
      monthlyData,
      highestMonth: highestMonthIdx !== -1 ? { name: monthNames[highestMonthIdx], count: maxVal } : null,
      lowestMonth: lowestMonthIdx !== -1 ? { name: monthNames[lowestMonthIdx], count: minVal } : null
    };
  }, [reports, employees]);

  const handlePrintStats = async () => {
    const schoolName = await dbUtils.getSetting('schoolName') || '..........';
    const principalName = await dbUtils.getSetting('principalName') || '..........';
    await generateStatisticsPDF(stats, schoolName, principalName);
  };

  const maxMonthValue = Math.max(...(Object.values(stats.monthlyData) as number[]), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-inner">
            <BarChart3 size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">تحليل الأداء والانضباط</h2>
            <p className="text-sm font-bold text-slate-500 mt-1">نظرة شاملة على إحصائيات الموظفين</p>
          </div>
        </div>
        <button 
          onClick={handlePrintStats}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black transition-all shadow-lg shadow-emerald-200 active:scale-95 relative z-10"
        >
          <Printer size={18} />
          <span>طباعة التقرير العام</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md flex items-center gap-5 group hover:border-emerald-200 hover:shadow-xl transition-all">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-inner">
            <BarChart3 size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">إجمالي السجلات</p>
            <h4 className="text-4xl font-black text-slate-800">{stats.totalReports}</h4>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md flex items-center gap-5 group hover:border-rose-200 hover:shadow-xl transition-all">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300 shadow-inner">
            <UserMinus size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">حالات الغياب</p>
            <h4 className="text-4xl font-black text-rose-600">{stats.absenceCount}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-md flex items-center gap-5 group hover:border-amber-200 hover:shadow-xl transition-all">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300 shadow-inner">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">تأخر ومساءلات محسوبة</p>
            <h4 className="text-4xl font-black text-amber-600">{stats.lateCount}</h4>
          </div>
        </div>
      </div>

      {stats.totalReports > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-sm border border-white/10">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-emerald-100 text-xs font-black uppercase tracking-widest opacity-80 mb-1">ذروة التسجيل (الشهر الأعلى)</p>
                <h4 className="text-3xl font-black">{stats.highestMonth?.name}</h4>
                <p className="text-sm font-bold text-emerald-100 mt-2">بإجمالي <span className="text-white text-lg bg-white/20 px-2 py-0.5 rounded-lg">{stats.highestMonth?.count}</span> سجل خلال هذا الشهر</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-emerald-400 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-5 relative z-10">
              <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-sm border border-white/10">
                <TrendingDown size={32} />
              </div>
              <div>
                <p className="text-teal-50 text-xs font-black uppercase tracking-widest opacity-90 mb-1">هدوء التسجيل (الشهر الأقل)</p>
                <h4 className="text-3xl font-black">{stats.lowestMonth?.name}</h4>
                <p className="text-sm font-bold text-teal-50 mt-2">بإجمالي <span className="text-white text-lg bg-white/20 px-2 py-0.5 rounded-lg">{stats.lowestMonth?.count}</span> سجل فقط</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><Zap size={24} /></div>
            <h3 className="text-xl font-black text-slate-800">أكثر الموظفين تسجيلاً للحالات</h3>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.topEmployees.map((item, index) => (
              <div key={item.employee!.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-100 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${index < 3 ? 'bg-amber-100 text-amber-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 group-hover:text-emerald-700 transition-colors">{item.employee!.name}</h4>
                    <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100 mt-1 inline-block">{item.employee!.workplace || 'معلم'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 font-black text-slate-700">
                    {item.count} <span className="text-[10px] text-slate-400">حالة</span>
                  </div>
                </div>
              </div>
            ))}
            {stats.topEmployees.length === 0 && (
              <div className="text-center py-10 text-slate-400 font-bold">لا توجد بيانات كافية لعرضها</div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><CalendarDays size={24} /></div>
            <h3 className="text-xl font-black text-slate-800">التوزيع الشهري للحالات</h3>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 pt-10 pb-4 mt-auto">
            {monthNames.map((month, index) => {
              const count = stats.monthlyData[index] || 0;
              const heightPercentage = maxMonthValue > 0 ? Math.max((count / maxMonthValue) * 100, count > 0 ? 10 : 0) : 0;
              
              return (
                <div key={month} className="flex flex-col items-center flex-1 group">
                  <div className="w-full flex justify-center mb-2 h-6">
                    <span className="text-xs font-black text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-50 px-2 py-0.5 rounded-md">
                      {count}
                    </span>
                  </div>
                  <div className="w-full h-[200px] flex items-end justify-center bg-slate-50/50 rounded-t-xl overflow-hidden relative">
                     <div 
                       className="w-full bg-emerald-500 rounded-t-xl transition-all duration-1000 ease-out group-hover:bg-emerald-400 relative" 
                       style={{ height: `${heightPercentage}%` }}
                     >
                       {count > 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-white/30 rounded-t-xl"></div>}
                     </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 mt-3 -rotate-45 origin-top-right w-full text-center group-hover:text-emerald-600 transition-colors">
                    {month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;
