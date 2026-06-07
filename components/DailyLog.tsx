import React, { useState, useMemo } from 'react';
import { Report, Employee } from '../types';
import { ClipboardList, Printer, Search, Calendar, CheckSquare, Square, Trash2, Clock, LogOut, Filter, History, FileSignature, MessageCircle } from 'lucide-react';
import { generateBatchForms, generateAcknowledgmentLog } from '../utils/pdfGenerator';
import { shareReportToFirebase } from '../utils/firebase';
import * as dbUtils from '../utils/db';

interface DailyLogProps {
  employees: Employee[];
  onDeleteReport: (reportId: number) => Promise<void>;
  reports: Report[];
}

const DailyLog: React.FC<DailyLogProps> = ({ employees, onDeleteReport, reports }) => {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('الكل');
  const [filterMode, setFilterMode] = useState<'event' | 'creation'>('creation');
  const [selectedReportIds, setSelectedReportIds] = useState<number[]>([]);

  const employeeMap = useMemo(() => {
    const map = new Map<number, Employee>();
    employees.forEach(e => map.set(e.id, e));
    return map;
  }, [employees]);

  const filteredReports = useMemo(() => {
    return reports
      .filter(r => {
        const emp = employeeMap.get(r.employeeId);
        const targetDate = filterMode === 'event' ? r.date : (r.createdAt || r.date);
        const matchesDate = !dateFilter || targetDate === dateFilter;
        const matchesSearch = !searchQuery || emp?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'الكل' || r.type === typeFilter;
        return matchesDate && matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [reports, dateFilter, searchQuery, typeFilter, filterMode, employeeMap]);

  const handleShareWhatsApp = async (report: Report) => {
    const employee = employeeMap.get(report.employeeId);
    if (!employee) {
      alert('لم يتم العثور على بيانات الموظف لهذا السجل.');
      return;
    }
    const popup = window.open('', '_blank');
    try {
      const schoolName = await dbUtils.getSetting('schoolName') || '..........';
      const firebaseId = await shareReportToFirebase({
        employeeName: employee.name,
        employeePhone: employee.phone || null,
        type: report.type,
        date: report.date,
        missedClasses: report.missedClasses || null,
        lateArrivalTime: report.lateArrivalTime || null,
        earlyDepartureTime: report.earlyDepartureTime || null,
        absenceSession: report.absenceSession || null,
        schoolName,
      });
      const link = `${window.location.origin}/?sign=${firebaseId}`;
      const text = `السلام عليكم أ. ${employee.name}\nنأمل منكم الدخول على الرابط المرفق وتعبئة نموذج إفادة المساءلة الخاصة بكم:\n\n${link}\n\nوشكراً لكم.`;
      const phoneParam = employee.phone ? `${employee.phone}?` : '?';
      const whatsappUrl = `https://wa.me/${phoneParam}text=${encodeURIComponent(text)}`;
      if (popup) popup.location.href = whatsappUrl;
      else window.location.href = whatsappUrl;
    } catch (e) {
      if (popup) popup.close();
      alert('حدث خطأ أثناء تجهيز رابط الواتساب.');
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      <div className="p-8 border-b border-slate-50 bg-slate-50/50">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-emerald-200">
              <ClipboardList size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">السجل العام واليومي</h3>
              <p className="text-sm text-emerald-600 font-bold mt-1">إدارة الطباعة الجماعية وبيانات الحضور</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full xl:w-auto">
            <button
                onClick={() => generateAcknowledgmentLog(employees)}
                className="flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl font-black text-sm transition-all border border-emerald-200 active:scale-95 shadow-sm hover:shadow-md"
            >
                <FileSignature size={18} />
                بيان التوقيع بالعلم
            </button>
            <button
                onClick={() => { setFilterMode('creation'); setDateFilter(new Date().toISOString().split('T')[0]); }}
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-teal-200 active:scale-95"
            >
                <History size={18} />
                مسجلات اليوم
            </button>
            <button
              onClick={() => generateBatchForms(selectedReportIds.map(id => ({ employee: employeeMap.get(reports.find(r => r.id === id)!.employeeId)!, report: reports.find(r => r.id === id)! })))}
              disabled={selectedReportIds.length === 0}
              className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-200 active:scale-95"
            >
              <Printer size={20} />
              طباعة المختار ({selectedReportIds.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
           <div className="relative">
             <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as any)} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all appearance-none">
               <option value="creation">حسب تاريخ الإدخال</option>
               <option value="event">حسب تاريخ الحالة</option>
             </select>
           </div>
           <div className="relative">
             <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all text-slate-700" />
           </div>
           <div className="relative">
             <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all appearance-none">
               <option value="الكل">جميع الحالات</option>
               <option value="غياب">غياب</option>
               <option value="تأخر_انصراف">تأخر / انصراف</option>
               <option value="مساءلة_حصص">مساءلة حصص</option>
             </select>
           </div>
           <div className="relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
             <input type="text" placeholder="بحث باسم الموظف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 transition-all placeholder:text-slate-400 text-slate-700" />
           </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-200">
              <th className="px-6 py-5 text-center w-12">
                <button onClick={() => setSelectedReportIds(selectedReportIds.length === filteredReports.length ? [] : filteredReports.map(r => r.id!))} className="text-emerald-600 hover:text-emerald-700 transition-colors">
                  {selectedReportIds.length === filteredReports.length && filteredReports.length > 0 ? <CheckSquare size={22}/> : <Square size={22}/>}
                </button>
              </th>
              <th className="px-6 py-5">الموظف</th>
              <th className="px-6 py-5">تاريخ الحالة</th>
              <th className="px-6 py-5">النوع</th>
              <th className="px-6 py-5">التفاصيل</th>
              <th className="px-6 py-5 text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/60">
            {filteredReports.map((report) => {
              const emp = employeeMap.get(report.employeeId);
              const isSelected = selectedReportIds.includes(report.id!);
              return (
                <tr key={report.id} className={`hover:bg-emerald-50/40 transition-all duration-200 ${isSelected ? 'bg-emerald-50/60' : ''}`}>
                  <td className="px-6 py-5 text-center">
                    <button onClick={() => setSelectedReportIds(prev => prev.includes(report.id!) ? prev.filter(i => i !== report.id) : [...prev, report.id!])} className={`transition-colors ${isSelected ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-400'}`}>
                      {isSelected ? <CheckSquare size={22}/> : <Square size={22}/>}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-800 text-sm mb-0.5">{emp?.name || '---'}</div>
                    <div className="text-[11px] text-slate-400 font-bold tracking-tight">{emp?.civilId}</div>
                  </td>
                  <td className="px-6 py-5 font-bold text-sm text-slate-600">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/50">{report.date}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[11px] font-black px-3 py-1.5 rounded-lg border ${report.type === 'غياب' ? 'bg-amber-50 text-amber-600 border-amber-100' : report.type === 'مساءلة_حصص' ? 'bg-teal-50 text-teal-600 border-teal-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                      {report.type === 'غياب' ? 'غياب' : report.type === 'مساءلة_حصص' ? 'مساءلة حصص' : 'تنبيه تأخر'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-600">
                    {report.type === 'غياب' ? `${report.daysCount} أيام` : report.type === 'مساءلة_حصص' ? `غياب عن ${report.missedClasses?.length || 0} حصة` : `حضور: ${report.lateArrivalTime || '--'}`}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button onClick={() => report.id && window.confirm('حذف نهائي؟') && onDeleteReport(report.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 size={18}/>
                    </button>
                    <button onClick={() => handleShareWhatsApp(report)} className="p-2 mr-2 text-blue-500 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all" title="إرسال واتساب">
                      <MessageCircle size={18}/>
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {filteredReports.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-slate-50 p-4 rounded-full">
                      <ClipboardList size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-bold text-sm">لا توجد سجلات مطابقة للبحث</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyLog;
