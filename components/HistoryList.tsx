import React, { useState } from 'react';
import { Report, Employee } from '../types';
import { History, Download, FileCheck, AlertCircle, Clock, Edit2, Trash2, LogOut, FileText, Award, ChevronDown, X, Send, AlertTriangle } from 'lucide-react';
import { 
  generateOfficialAbsenceForm, 
  generateEmployeePDF, 
  generateLateArrivalDepartureForm, 
  generateExitPermit, 
  generateLateCumulativeLog, 
  generateAppreciationCertificate,
  generateWarningLetter
} from '../utils/pdfGenerator';

interface HistoryListProps {
  reports: Report[];
  selectedEmployee: Employee;
  onDeleteReport: (reportId: number) => Promise<void>;
  onEditReport: (report: Report) => void;
  onUpdateReport: (report: Report) => Promise<void>;
}

const HistoryList: React.FC<HistoryListProps> = ({ reports, selectedEmployee, onDeleteReport, onEditReport, onUpdateReport }) => {
  const [showExtraReports, setShowExtraReports] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  
  const [exitData, setExitData] = useState({ start: '', end: '', reason: '' });
  const [warningData, setWarningData] = useState({ level: 'الأول', letterNo: '' });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'غياب': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'تأخر_انصراف': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'تأخر_انصراف': return 'تنبيه تأخر';
      case 'غياب': return 'غياب (مساءلة)';
      case 'مساءلة_حصص': return 'مساءلة حصص';
      default: return type;
    }
  };

  const handleUpdateExcuse = async (report: Report, status: 'pending' | 'accepted' | 'rejected') => {
    await onUpdateReport({ ...report, excuseStatus: status });
  };

  const handlePrintExitPermit = () => {
    generateExitPermit(selectedEmployee, exitData.start, exitData.end, exitData.reason);
    setShowExitModal(false);
  };

  const handlePrintWarning = () => {
    generateWarningLetter(selectedEmployee, warningData.level, warningData.letterNo);
    setShowWarningModal(false);
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500 relative">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
            <History size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">سجل الانضباط الفردي</h3>
            <p className="text-xs text-slate-400 font-bold">إدارة التقارير والمساءلات الخاصة بالموظف</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowExtraReports(!showExtraReports)}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-2xl font-black text-sm hover:bg-emerald-100 transition-all border border-emerald-200 shadow-sm"
          >
            <FileText size={18} />
            <span>تقارير إضافية</span>
            <ChevronDown size={16} className={\`transition-transform duration-300 \${showExtraReports ? 'rotate-180' : ''}\`} />
          </button>
          
          <button
            onClick={() => generateEmployeePDF(selectedEmployee, reports)}
            className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl"
          >
            <Download size={18} />
            تحميل السجل
          </button>
        </div>
      </div>

      {showExtraReports && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <button onClick={() => setShowExitModal(true)} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group text-right">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shrink-0"><LogOut size={20}/></div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-700">إذن خروج (20-01)</span>
              <span className="text-[9px] text-slate-400 font-bold">بمدخلات وقت الخروج</span>
            </div>
          </button>
          
          <button onClick={() => setShowWarningModal(true)} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all group text-right">
            <div className="bg-rose-100 p-2 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all shrink-0"><AlertTriangle size={20}/></div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-700">خطاب إنذار رسمي</span>
              <span className="text-[9px] text-slate-400 font-bold">للمخالفات المتكررة</span>
            </div>
          </button>

          <button onClick={() => generateLateCumulativeLog(selectedEmployee, reports)} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group text-right">
            <div className="bg-teal-100 p-2 rounded-xl text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all shrink-0"><Clock size={20}/></div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-700">سجل حصر التأخر</span>
              <span className="text-[9px] text-slate-400 font-bold">تراكمي لرفع الحسم</span>
            </div>
          </button>

          <button onClick={() => generateAppreciationCertificate(selectedEmployee)} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group text-right">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0"><Award size={20}/></div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-700">شكر وتقدير</span>
              <span className="text-[9px] text-slate-400 font-bold">شهادة تميز انضباطي</span>
            </div>
          </button>
        </div>
      )}

      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-amber-500 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut size={24} />
                <h3 className="text-xl font-black">تجهيز إذن خروج</h3>
              </div>
              <button onClick={() => setShowExitModal(false)} className="p-1 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-2">وقت الخروج</label>
                  <input type="time" value={exitData.start} onChange={(e) => setExitData({...exitData, start: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 pr-2">وقت العودة</label>
                  <input type="time" value={exitData.end} onChange={(e) => setExitData({...exitData, end: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 font-bold" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">سبب الخروج</label>
                <input type="text" value={exitData.reason} onChange={(e) => setExitData({...exitData, reason: e.target.value})} placeholder="اكتب السبب..." className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 font-bold" />
              </div>
              <div className="flex gap-3 pt-4">
                 <button onClick={handlePrintExitPermit} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-black text-base transition-all shadow-lg active:scale-95">استخراج وطباعة</button>
                 <button onClick={() => setShowExitModal(false)} className="px-8 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-black transition-colors">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-rose-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-black">إصدار إنذار رسمي</h3>
              </div>
              <button onClick={() => setShowWarningModal(false)} className="p-1 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">مستوى الإنذار</label>
                <select value={warningData.level} onChange={(e) => setWarningData({...warningData, level: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-50 font-bold">
                  <option value="الأول">الإنذار الأول (شفهي/مكتوب)</option>
                  <option value="الثاني">الإنذار الثاني</option>
                  <option value="الثالث">الإنذار الثالث (النهائي)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">رقم الخطاب (اختياري)</label>
                <input type="text" value={warningData.letterNo} onChange={(e) => setWarningData({...warningData, letterNo: e.target.value})} placeholder="مثال: 45/123" className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-50 font-bold" />
              </div>
              <div className="flex gap-3 pt-4">
                 <button onClick={handlePrintWarning} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-black text-base transition-all shadow-lg active:scale-95">استخراج وطباعة</button>
                 <button onClick={() => setShowWarningModal(false)} className="px-8 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-black transition-colors">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-4">
          <div className="bg-slate-50 p-6 rounded-full">
            <FileCheck size={48} className="text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold text-lg">سجل الموظف نظيف ولا توجد أي مخالفات</p>
        </div>
      ) : (
        <div className="space-y-4 relative">
          <div className="absolute top-0 bottom-0 right-8 w-1 bg-slate-100 rounded-full"></div>

          {reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((report) => (
            <div key={report.id} className="relative z-10 flex gap-6">
              <div className="w-16 h-16 shrink-0 bg-white rounded-2xl shadow-md border-4 border-slate-50 flex items-center justify-center flex-col z-10">
                <span className="text-xl font-black text-emerald-600 leading-none mb-1">{new Date(report.date).getDate()}</span>
                <span className="text-[10px] font-bold text-slate-400">{new Date(report.date).toLocaleDateString('ar-SA', { month: 'short' })}</span>
              </div>
              
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <span className={\`px-3 py-1 rounded-lg text-xs font-black border \${getTypeColor(report.type)}\`}>
                      {getTypeName(report.type)}
                    </span>
                    {report.type === 'غياب' && <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{report.daysCount} أيام</span>}
                    {report.lateArrivalTime && <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg flex items-center gap-1"><Clock size={12}/> تأخر {report.lateArrivalTime} د</span>}
                    {report.earlyDepartureTime && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1"><LogOut size={12}/> انصراف {report.earlyDepartureTime}</span>}
                    {report.absenceSession && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg flex items-center gap-1"><AlertCircle size={12}/> الحصة {report.absenceSession}</span>}
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        if (report.type === 'غياب' || report.type === 'غياب_حصة') generateOfficialAbsenceForm(selectedEmployee, report);
                        else generateLateArrivalDepartureForm(selectedEmployee, report);
                      }}
                      className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-xl transition-colors"
                      title="طباعة المساءلة"
                    >
                      <Download size={16} />
                    </button>
                    <button onClick={() => onEditReport(report)} className="p-2 text-slate-500 bg-slate-50 hover:bg-slate-600 hover:text-white rounded-xl transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => window.confirm('هل أنت متأكد من حذف هذا السجل؟') && onDeleteReport(report.id!)} 
                      className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {report.notes && (
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl mb-4 font-bold leading-relaxed border border-slate-100">{report.notes}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-500">حالة العذر:</span>
                    <select
                      value={report.excuseStatus || 'pending'}
                      onChange={(e) => handleUpdateExcuse(report, e.target.value as any)}
                      className={\`text-xs font-black px-3 py-1.5 rounded-lg border outline-none \${
                        report.excuseStatus === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        report.excuseStatus === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }\`}
                    >
                      <option value="pending">قيد المراجعة</option>
                      <option value="accepted">مقبول</option>
                      <option value="rejected">غير مقبول (حسم)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryList;
