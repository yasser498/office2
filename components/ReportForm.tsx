
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
    earlyDepartureTime: ''
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

    // فحص إضافي قبل الإرسال
    if (formData.type === 'غياب' && new Date(formData.endDate!) < new Date(formData.date)) {
      alert("يرجى تصحيح التاريخ: تاريخ النهاية يسبق تاريخ البداية!");
      return;
    }
    
    setIsSubmitting(true);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      if (editingReport) {
        await onSave({ ...formData, employeeId: selectedEmployees[0].id } as Report, selectedEmployees[0].id);
        onCancelEdit();
      } else {
        for (const emp of selectedEmployees) {
          await onSave({ ...formData, createdAt: todayStr } as Report, emp.id);
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
          earlyDepartureTime: ''
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
    <div className={`bg-white p-5 md:p-8 rounded-[2.5rem] shadow-2xl border transition-all ${editingReport ? 'border-indigo-400 ring-8 ring-indigo-50' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${editingReport ? 'bg-indigo-600 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
            <FileText size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">{editingReport ? 'تعديل بيانات التقرير' : 'إنشاء سجل حالة جديد'}</h3>
            <div className="flex items-center gap-2 text-indigo-600 text-sm font-black mt-1">
              <UserCheck size={16} />
              <span>المستهدفون: {selectedEmployees.length} موظفاً</span>
            </div>
          </div>
        </div>
        {editingReport && (
          <button onClick={onCancelEdit} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all">
            <X size={24} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5 mb-8">
        {selectedEmployees.map(emp => (
          <span key={emp.id} className="bg-white text-indigo-700 px-4 py-1.5 rounded-xl text-xs font-black border border-indigo-100 shadow-sm animate-in zoom-in-50 duration-300 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
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
              className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 transition-all bg-slate-50 font-black text-slate-700 appearance-none"
            >
              <option value="غياب">غياب (مساءلة)</option>
              <option value="تأخر_انصراف">تنبيه تأخر / انصراف</option>
            </select>
          </div>

          <div className="space-y-2 lg:col-span-3">
            <label className="text-sm font-black text-slate-700 mr-2">تاريخ البداية (من)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-black text-slate-700"
              />
            </div>
          </div>

          {formData.type === 'غياب' ? (
            <>
              <div className="space-y-2 lg:col-span-3">
                <label className="text-sm font-black text-slate-700 mr-2">تاريخ النهاية (إلى)</label>
                <div className="relative">
                  <Calendar className={`absolute left-4 top-1/2 -translate-y-1/2 ${dateError ? 'text-rose-500' : 'text-slate-400'}`} size={18} />
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl outline-none focus:ring-4 font-black transition-all ${dateError ? 'border-rose-300 focus:ring-rose-50 text-rose-600' : 'border-slate-200 focus:ring-indigo-100 text-slate-700'}`}
                  />
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col justify-end">
                <div className={`p-4 rounded-2xl flex items-center gap-4 border transition-all ${dateError ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                  {dateError ? <AlertCircle size={24} /> : <Calendar size={24} />}
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-60">إجمالي المدة</p>
                    <p className="text-xl font-black">{formData.daysCount > 0 ? `${formData.daysCount} أيام` : '---'}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-black text-slate-700 mr-2 flex items-center gap-1"><Clock size={14}/> وقت الحضور</label>
                <input
                  type="time"
                  value={formData.lateArrivalTime}
                  onChange={(e) => setFormData({ ...formData, lateArrivalTime: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-black text-slate-700"
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-black text-slate-700 mr-2 flex items-center gap-1"><LogOut size={14}/> وقت الانصراف</label>
                <input
                  type="time"
                  value={formData.earlyDepartureTime}
                  onChange={(e) => setFormData({ ...formData, earlyDepartureTime: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-100 font-black text-slate-700"
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-black text-slate-700 mr-2 flex items-center gap-1"><Users size={14}/> الحصة</label>
                <select
                  value={formData.absenceSession}
                  onChange={(e) => setFormData({ ...formData, absenceSession: e.target.value })}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-black text-slate-700 appearance-none"
                >
                  <option value="">-- اختر --</option>
                  {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </>
          )}
        </div>

        {dateError && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl flex items-center gap-3 animate-bounce border border-rose-100">
            <AlertCircle size={20} />
            <span className="font-black text-sm">{dateError}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-black text-slate-700 mr-2">الأسباب / ملاحظات إضافية (تظهر في المطبوع)</label>
          <textarea
            rows={3}
            value={formData.notes}
            placeholder="اكتب الأسباب والظروف هنا..."
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none font-bold text-slate-700 placeholder:text-slate-300"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || selectedEmployees.length === 0 || !!dateError}
            className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black text-xl transition-all shadow-2xl active:scale-[0.98] text-white ${editingReport ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none shadow-indigo-200'}`}
          >
            <Send size={24} />
            {isSubmitting ? 'جاري الحفظ...' : editingReport ? 'تحديث السجل الحالي' : `تطبيق على ${selectedEmployees.length} موظفاً`}
          </button>
          
          {editingReport && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-10 py-5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-[2rem] font-black transition-all"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
