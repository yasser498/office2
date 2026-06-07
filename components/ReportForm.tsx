import React, { useState, useEffect } from 'react';
import { Report, Employee, ReportType } from '../types';
import { Send, FileText, Clock, Users, X, UserCheck, LogOut, Calendar, AlertCircle } from 'lucide-react';

interface ReportFormProps {
  selectedEmployees: Employee[];
  onSave: (report: Report, employeeId: number) => Promise<void>;
  editingReport: Report | null;
  onCancelEdit: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ selectedEmployees, onSave, editingReport, onCancelEdit }) => {
  const [formData, setFormData] = useState<Omit<Report, 'employeeId'>>({
    date: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    daysCount: 1,
    type: 'غياب' as ReportType,
    notes: '',
    actionTaken: '',
    lateArrivalTime: '',
    absenceSession: '',
    earlyDepartureTime: '',
    minutesCount: 0,
    violationCategory: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const sessions = ["الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة"];

  useEffect(() => {
    if (editingReport) {
      setFormData({
        id: editingReport.id,
        date: editingReport.date,
        endDate: editingReport.endDate || editingReport.date,
        daysCount: editingReport.daysCount || 1,
        type: editingReport.type,
        notes: editingReport.notes,
        actionTaken: editingReport.actionTaken,
        lateArrivalTime: editingReport.lateArrivalTime || '',
        absenceSession: editingReport.absenceSession || '',
        earlyDepartureTime: editingReport.earlyDepartureTime || '',
        minutesCount: editingReport.minutesCount || 0,
        violationCategory: editingReport.violationCategory || '',
        principalName: editingReport.principalName,
        createdAt: editingReport.createdAt
      });
    }
  }, [editingReport]);

  useEffect(() => {
    if (formData.type === 'غياب' && formData.date && formData.endDate) {
      const start = new Date(formData.date);
      const end = new Date(formData.endDate);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        if (end < start) {
          setDateError("خطأ: تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية");
          setFormData(prev => ({ ...prev, daysCount: 0 }));
        } else {
          setDateError(null);
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          setFormData(prev => ({ ...prev, daysCount: diffDays }));
        }
      }
    } else {
      setDateError(null);
      setFormData(prev => ({ ...prev, daysCount: 1 }));
    }
  }, [formData.date, formData.endDate, formData.type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmployees.length === 0) return;

    if (formData.type === 'غياب' && new Date(formData.endDate!) < new Date(formData.date)) {
      alert("يرجى تصحيح التاريخ: تاريخ النهاية يسبق تاريخ البداية!");
      return;
    }
    
    setIsSubmitting(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const normalizeReport = (employeeId: number): Report => {
      const minutes = Number(formData.minutesCount || formData.lateArrivalTime || 0);
      if (formData.type === 'تأخر') {
        return {
          ...formData,
          employeeId,
          type: 'تأخر_انصراف',
          minutesCount: minutes,
          violationCategory: 'morning_late',
          period: 'morning',
          createdAt: formData.createdAt || todayStr
        } as Report;
      }
      if (formData.type === 'انصراف') {
        return {
          ...formData,
          employeeId,
          type: 'تأخر_انصراف',
          minutesCount: minutes,
          violationCategory: 'early_departure',
          period: 'day',
          createdAt: formData.createdAt || todayStr
        } as Report;
      }
      if (formData.type === 'غياب_حصة') {
        return {
          ...formData,
          employeeId,
          type: 'تأخر_انصراف',
          minutesCount: minutes || 45,
          violationCategory: 'class_absence',
          period: formData.absenceSession || '',
          createdAt: formData.createdAt || todayStr
        } as Report;
      }
      return { ...formData, employeeId, createdAt: formData.createdAt || todayStr } as Report;
    };

    try {
      if (editingReport) {
        await onSave(normalizeReport(selectedEmployees[0].id), selectedEmployees[0].id);
        onCancelEdit();
      } else {
        for (const emp of selectedEmployees) {
          await onSave(normalizeReport(emp.id), emp.id);
        }
        setFormData({
          date: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          daysCount: 1,
          type: 'غياب',
          notes: '',
          actionTaken: '',
          lateArrivalTime: '',
          absenceSession: '',
          earlyDepartureTime: '',
          minutesCount: 0,
          violationCategory: ''
        });
      }
      alert(editingReport ? 'تم تحديث التقرير' : `تم إنشاء ${selectedEmployees.length} تقارير بنجاح`);
    } catch (err) {
      alert('فشل حفظ التقارير');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border transition-all duration-300 ${editingReport ? 'border-emerald-400 ring-4 ring-emerald-50 scale-[1.01]' : 'border-slate-100 hover:shadow-2xl hover:border-emerald-100'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-md ${editingReport ? 'bg-emerald-600 text-white animate-pulse' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
            <FileText size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">{editingReport ? 'تعديل بيانات التقرير' : 'إنشاء سجل حالة جديد'}</h3>
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-black mt-1">
              <UserCheck size={16} />
              <span>المستهدفون: {selectedEmployees.length} موظفاً</span>
            </div>
          </div>
        </div>
        {editingReport && (
          <button onClick={onCancelEdit} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all bg-slate-50 border border-slate-100">
            <X size={24} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <span className="text-sm font-bold text-slate-500 ml-2 py-1.5 flex items-center gap-2">
          <Users size={16} /> الموظفون:
        </span>
        {selectedEmployees.map(emp => (
          <span key={emp.id} className="bg-white text-emerald-700 px-4 py-1.5 rounded-xl text-xs font-black border border-emerald-100 shadow-sm animate-in zoom-in-50 duration-300 flex items-center gap-2 hover:bg-emerald-50 cursor-default">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            {emp.name}
          </span>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="space-y-2 lg:col-span-3">
            <label className="text-sm font-black text-slate-700 mr-2">نوع الحالة</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ReportType })}
              className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-slate-50 font-black text-slate-700 appearance-none"
            >
              <option value="غياب">غياب يوم كامل أو أكثر</option>
              <option value="تأخر">تأخر صباحي</option>
              <option value="غياب_حصة">غياب عن حصة</option>
              <option value="انصراف">انصراف مبكر</option>
            </select>
          </div>

          <div className="space-y-2 lg:col-span-3">
            <label className="text-sm font-black text-slate-700 mr-2">تاريخ البداية (من)</label>
            <div className="relative">
              <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full pl-4 pr-12 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-slate-50 font-black text-slate-700"
                required
              />
            </div>
          </div>

          {formData.type === 'غياب' && (
            <div className="space-y-2 lg:col-span-3 animate-in fade-in zoom-in-95">
              <label className="text-sm font-black text-slate-700 mr-2">تاريخ النهاية (إلى)</label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={`w-full pl-4 pr-12 py-3.5 border rounded-2xl outline-none focus:ring-4 transition-all bg-slate-50 font-black text-slate-700 ${dateError ? 'border-rose-400 focus:ring-rose-100 text-rose-600' : 'border-slate-200 focus:ring-emerald-100 focus:border-emerald-400'}`}
                  required
                />
              </div>
            </div>
          )}

          {formData.type === 'غياب' && (
            <div className="space-y-2 lg:col-span-3 animate-in fade-in">
               <label className="text-sm font-black text-slate-700 mr-2">عدد الأيام</label>
               <div className={`w-full px-5 py-3.5 border rounded-2xl font-black text-lg text-center shadow-inner ${dateError ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  {formData.daysCount} <span className="text-sm font-bold opacity-70">يوم</span>
               </div>
            </div>
          )}

          {dateError && formData.type === 'غياب' && (
             <div className="lg:col-span-12 flex items-center gap-2 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-200 animate-in slide-in-from-top-2">
                <AlertCircle size={20} />
                <p className="font-bold text-sm">{dateError}</p>
             </div>
          )}

          {formData.type === 'تأخر' && (
            <div className="space-y-2 lg:col-span-3 animate-in fade-in">
              <label className="text-sm font-black text-slate-700 mr-2">وقت التأخر (دقيقة)</label>
              <div className="relative">
                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="number"
                  min="1"
                  placeholder="مثال: 15"
                  value={formData.lateArrivalTime}
                  onChange={(e) => setFormData({ ...formData, lateArrivalTime: e.target.value })}
                  className="w-full pl-4 pr-12 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-slate-50 font-black text-slate-700"
                  required
                />
              </div>
            </div>
          )}

          {formData.type === 'انصراف' && (
            <>
            <div className="space-y-2 lg:col-span-3 animate-in fade-in">
              <label className="text-sm font-black text-slate-700 mr-2">وقت الانصراف المبكر</label>
              <div className="relative">
                <LogOut className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="time"
                  value={formData.earlyDepartureTime}
                  onChange={(e) => setFormData({ ...formData, earlyDepartureTime: e.target.value })}
                  className="w-full pl-4 pr-12 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-slate-50 font-black text-slate-700"
                  required
                />
              </div>
            </div>
            <div className="space-y-2 lg:col-span-3 animate-in fade-in">
              <label className="text-sm font-black text-slate-700 mr-2">الدقائق المحتسبة</label>
              <input
                type="number"
                min="1"
                placeholder="مثال: 20"
                value={formData.minutesCount || ''}
                onChange={(e) => setFormData({ ...formData, minutesCount: Number(e.target.value) })}
                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-slate-50 font-black text-slate-700"
                required
              />
            </div>
            </>
          )}

          {formData.type === 'غياب_حصة' && (
            <>
            <div className="space-y-2 lg:col-span-3 animate-in fade-in">
              <label className="text-sm font-black text-slate-700 mr-2">الحصة المفقودة</label>
              <select
                value={formData.absenceSession}
                onChange={(e) => setFormData({ ...formData, absenceSession: e.target.value })}
                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-slate-50 font-black text-slate-700 appearance-none"
                required
              >
                <option value="">-- اختر الحصة --</option>
                {sessions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2 lg:col-span-3 animate-in fade-in">
              <label className="text-sm font-black text-slate-700 mr-2">الدقائق المحتسبة</label>
              <input
                type="number"
                min="1"
                value={formData.minutesCount || 45}
                onChange={(e) => setFormData({ ...formData, minutesCount: Number(e.target.value) })}
                className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-slate-50 font-black text-slate-700"
                required
              />
            </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700 mr-2">ملاحظات إضافية (اختياري)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 transition-all bg-slate-50 font-bold text-slate-700 resize-none"
            rows={3}
            placeholder="اكتب أي تفاصيل أخرى هنا..."
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting || (formData.type === 'غياب' && !!dateError)}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-lg shadow-emerald-200 active:scale-95 flex items-center justify-center gap-3 w-full md:w-auto min-w-[200px]"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Send size={20} />
                {editingReport ? 'حفظ التعديلات' : 'تسجيل الحالة وإصدار التقرير'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
