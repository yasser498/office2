
import React, { useState } from 'react';
import { X, Save, UserPlus, Fingerprint, Briefcase, Hash, GraduationCap, Building } from 'lucide-react';
import { Employee } from '../types';

interface EmployeeManualFormProps {
  onSave: (employee: Omit<Employee, 'id'>) => Promise<void>;
  onClose: () => void;
}

const EmployeeManualForm: React.FC<EmployeeManualFormProps> = ({ onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
    name: '',
    civilId: '',
    specialization: '',
    level: '',
    workplace: '',
    phone: '',
    employeeCode: '',
    grade: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = formData.name.trim() !== '' && formData.civilId.trim().length >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      alert('حدث خطأ أثناء حفظ الموظف');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <UserPlus size={24} />
            </div>
            <h3 className="text-xl font-black">إضافة موظف جديد يدوياً</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                اسم الموظف <span className="text-rose-500">* (مطلوب)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد محمود علي"
                  className="w-full pr-4 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black text-slate-700 flex items-center gap-2">
                السجل المدني <span className="text-rose-500">* (مطلوب)</span>
              </label>
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="مثال: 1023456789"
                  className="w-full pr-4 pl-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
                  value={formData.civilId}
                  onChange={(e) => setFormData({ ...formData, civilId: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black text-slate-500 flex items-center gap-2">التخصص</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  placeholder="مثال: لغة عربية"
                  className="w-full pr-4 pl-10 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black text-slate-500 flex items-center gap-2">رقم الوظيفة</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  placeholder="مثال: 789456"
                  className="w-full pr-4 pl-10 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black text-slate-500 flex items-center gap-2">المرتبة / المستوى</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  className="w-full pr-4 pl-10 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-black text-slate-500 flex items-center gap-2">العمل الحالي</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="text"
                  className="w-full pr-4 pl-10 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
                  value={formData.workplace}
                  onChange={(e) => setFormData({ ...formData, workplace: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95"
            >
              <Save size={22} />
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات الموظف'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl font-bold transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeManualForm;
