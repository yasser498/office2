
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
  
  // لمدخلات إذن الخروج
  const [exitData, setExitData] = useState({ start: '', end: '', reason: '' });
  // لمدخلات الإنذار
  const [warningData, setWarningData] = useState({ level: 'الأول', letterNo: '' });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'غياب': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'تأخر_انصراف': return 'bg-blue-100 text-blue-700 border-blue-200';
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
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
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
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-5 py-2.5 rounded-2xl font-black text-sm hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
          >
            <FileText size={18} />
            <span>تقارير إضافية</span>
            <ChevronDown size={16} className={`transition-transform duration-300 ${showExtraReports ? 'rotate-180' : ''}`} />
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
          <button onClick={() => setShowExitModal(true)} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group text-right">
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

          <button onClick={() => generateLateCumulativeLog(selectedEmployee, reports)} className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group text-right">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0"><Clock size={20}/></div>
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

      {/* نافذة مدخلات إذن الخروج */}
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
                <label className="text-xs font-black text-slate-700 pr-2">السبب (اختياري)</label>
                <input type="text" placeholder="مثلاً: ظرف عائلي، موعد طبي..." value={exitData.reason} onChange={(e) => setExitData({...exitData, reason: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-amber-50 font-bold" />
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={handlePrintExitPermit} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg">
                  <Download size={20} /> طباعة الآن
                </button>
                <button onClick={() => generateExitPermit(selectedEmployee)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all">طباعة فارغ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة مدخلات خطاب الإنذار */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-rose-600 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-black">إصدار خطاب إنذار</h3>
              </div>
              <button onClick={() => setShowWarningModal(false)} className="p-1 hover:bg-white/10 rounded-full transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">مستوى الإنذار</label>
                <select value={warningData.level} onChange={(e) => setWarningData({...warningData, level: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-50 font-black">
                  <option value="الأول">الإنذار الأول</option>
                  <option value="الثاني">الإنذار الثاني</option>
                  <option value="النهائي">الإنذار النهائي</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">رقم الخطاب (اختياري)</label>
                <input type="text" placeholder="مثلاً: 123/أ" value={warningData.letterNo} onChange={(e) => setWarningData({...warningData, letterNo: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-50 font-bold" />
              </div>
              <button onClick={handlePrintWarning} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg">
                <Send size={20} /> إصدار وتوليد الإنذار
              </button>
            </div>
          </div>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
          <AlertCircle size={64} className="mb-4 opacity-20" />
          <p className="font-black text-lg">لا توجد سجلات حالية لهذا الموظف</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="pb-4 pr-4">التاريخ</th>
                <th className="pb-4">النوع</th>
                <th className="pb-4">التفاصيل</th>
                <th className="pb-4 text-center">المراجعة</th>
                <th className="pb-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.map((report) => (
                <tr key={report.id} className="text-slate-700 hover:bg-slate-50 transition-colors group">
                  <td className="py-5 pr-4 font-mono text-sm font-bold">
                    {report.date}
                    {report.endDate && report.endDate !== report.date && (
                      <div className="text-[10px] text-indigo-400 mt-1 opacity-70">إلى: {report.endDate}</div>
                    )}
                  </td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black border ${getTypeColor(report.type)}`}>
                      {getTypeName(report.type)}
                    </span>
                  </td>
                  <td className="py-5 text-sm font-bold max-w-xs truncate text-slate-600">
                    {report.type === 'غياب' ? `${report.daysCount} أيام` : 
                     report.type === 'تأخر_انصراف' ? `حضور: ${report.lateArrivalTime || '--'}` : 
                     report.type === 'مساءلة_حصص' ? `غياب عن ${report.missedClasses?.length || 0} حصة` :
                     report.notes}
                  </td>
                  <td className="py-5 text-center">
                    {(report.type === 'تأخر_انصراف' || report.type === 'مساءلة_حصص') ? (
                      <select 
                        value={report.excuseStatus || 'pending'}
                        onChange={(e) => handleUpdateExcuse(report, e.target.value as any)}
                        className={`text-xs font-black p-1.5 rounded-lg border outline-none ${
                          (!report.excuseStatus || report.excuseStatus === 'pending') ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          report.excuseStatus === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                          'bg-rose-50 text-rose-600 border-rose-200'
                        }`}
                      >
                        <option value="pending">بانتظار العذر</option>
                        <option value="accepted">عذر مقبول</option>
                        <option value="rejected">مرفوض (محسوب)</option>
                      </select>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-5">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => report.type === 'غياب' ? generateOfficialAbsenceForm(selectedEmployee, report) : generateLateArrivalDepartureForm(selectedEmployee, report)}
                        className="flex items-center gap-2 text-white bg-indigo-600 px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg text-[10px] font-black active:scale-95"
                      >
                        <FileCheck size={14} />
                        طباعة
                      </button>
                      <button onClick={() => onEditReport(report)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-indigo-100"><Edit2 size={16} /></button>
                      <button onClick={() => report.id && onDeleteReport(report.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-rose-100"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default HistoryList;
