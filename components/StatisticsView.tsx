
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
    
    // حساب الموظفين الأكثر تكراراً
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

    // حساب التوزيع الشهري
    const monthlyData: Record<number, number> = {};
    reports.forEach(r => {
      const d = new Date(r.date);
      const month = d.getMonth();
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    // تحديد الشهر الأعلى والأقل
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
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-indigo-600" size={24} />
          <h2 className="text-xl font-black text-slate-800">تحليل الأداء والانضباط</h2>
        </div>
        <button 
          onClick={handlePrintStats}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold transition-all shadow-md active:scale-95"
        >
          <Printer size={18} />
          <span>طباعة التقرير العام</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <BarChart3 size={28} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-black">إجمالي السجلات</p>
            <h4 className="text-3xl font-black text-slate-800">{stats.totalReports}</h4>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <UserMinus size={28} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-black">حالات الغياب</p>
            <h4 className="text-3xl font-black text-rose-600">{stats.absenceCount}</h4>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-black">تأخر ومساءلات محسوبة</p>
            <h4 className="text-3xl font-black text-amber-600">{stats.lateCount}</h4>
          </div>
        </div>
      </div>

      {/* قسم ملخص الذروة والهدوء الشهري */}
      {stats.totalReports > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white/20 p-3 rounded-2xl">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-indigo-100 text-xs font-black uppercase tracking-widest opacity-80">ذروة التسجيل (الشهر الأعلى)</p>
                <h4 className="text-2xl font-black">{stats.highestMonth?.name}</h4>
                <p className="text-sm font-bold text-indigo-200 mt-1">بإجمالي <span className="text-white text-lg">{stats.highestMonth?.count}</span> سجل خلال هذا الشهر</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-white/20 p-3 rounded-2xl">
                <TrendingDown size={32} />
              </div>
              <div>
                <p className="text-emerald-50 text-xs font-black uppercase tracking-widest opacity-80">فترة الهدوء (الشهر الأقل)</p>
                <h4 className="text-2xl font-black">{stats.lowestMonth?.name}</h4>
                <p className="text-sm font-bold text-emerald-100 mt-1">بإجمالي <span className="text-white text-lg">{stats.lowestMonth?.count}</span> سجل فقط</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-indigo-600" />
            <h3 className="font-black text-slate-800">الأكثر تسجيلاً (قائمة المتابعة)</h3>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.topEmployees.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-bold">لا توجد بيانات كافية</p>
            ) : stats.topEmployees.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-xs font-black text-slate-400">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">{item.employee?.name}</div>
                    <div className="text-[10px] text-slate-400">{item.employee?.civilId}</div>
                  </div>
                </div>
                <div className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-black">
                  {item.count} سجلات
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays size={20} className="text-indigo-600" />
            <h3 className="font-black text-slate-800">النشاط الشهري</h3>
          </div>
          <div className="flex items-end justify-between h-48 gap-2 pt-4">
            {monthNames.map((name, idx) => {
              const val = stats.monthlyData[idx] || 0;
              const height = (val / maxMonthValue) * 100;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="relative w-full">
                    <div 
                      className="w-full bg-indigo-500 rounded-t-lg transition-all duration-1000 ease-out group-hover:bg-indigo-400 cursor-help"
                      style={{ height: `${height}%`, minHeight: val > 0 ? '4px' : '0' }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {val} سجل
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-400 rotate-45 mt-2 origin-left">{name}</span>
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
