import React, { useState } from 'react';
import { Settings, Trash2, ShieldAlert, Database, Users, MessageSquare, Link2, ClipboardCheck, CalendarX } from 'lucide-react';
import { deleteAllFirebaseReports, publishMorningAttendanceRoster } from '../utils/firebase';
import { Employee } from '../types';
import * as dbUtils from '../utils/db';

interface SettingsViewProps {
  employees: Employee[];
  onClearEmployees: () => Promise<void>;
  onClearReports: () => Promise<void>;
  onScheduleCleared?: () => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ employees, onClearEmployees, onClearReports, onScheduleCleared }) => {
  const [isDeletingFirebase, setIsDeletingFirebase] = useState(false);
  const [isPublishingRoster, setIsPublishingRoster] = useState(false);
  const attendanceLink = `${window.location.origin}${window.location.pathname}?attendance=morning`;

  const handleClearEmployees = async () => {
    if (window.confirm('تحذير: سيتم حذف جميع أسماء وبيانات الموظفين المخزنة محلياً. هل أنت متأكد؟')) {
      await onClearEmployees();
      alert('تم حذف جميع الموظفين بنجاح');
    }
  };

  const handleClearReports = async () => {
    if (window.confirm('تحذير: سيتم حذف جميع المساءلات المخزنة محلياً. هل أنت متأكد؟')) {
      await onClearReports();
      alert('تم حذف جميع المساءلات المحلية بنجاح');
    }
  };

  const handleClearFirebase = async () => {
    if (window.confirm('تحذير خطير: سيتم حذف قاعدة البيانات والمساءلات من خوادم Firebase نهائياً ولن يتمكن المعلمون من فتح الروابط القديمة. هل أنت متأكد؟')) {
      setIsDeletingFirebase(true);
      try {
        await deleteAllFirebaseReports();
        alert('تم تفريغ قاعدة بيانات Firebase بنجاح');
      } catch (e) {
        alert('حدث خطأ أثناء الاتصال بقاعدة البيانات');
      } finally {
        setIsDeletingFirebase(false);
      }
    }
  };

  const handlePublishAttendanceLink = async () => {
    if (employees.length === 0) {
      alert('لا توجد قائمة موظفين لنشر رابط التحضير.');
      return;
    }
    setIsPublishingRoster(true);
    try {
      await publishMorningAttendanceRoster(employees);
      await navigator.clipboard?.writeText(attendanceLink);
      alert('تم تحديث رابط التحضير ونسخه. يمكن إرساله للإداري الآن.');
    } catch (e) {
      alert('حدث خطأ أثناء تحديث رابط التحضير.');
    } finally {
      setIsPublishingRoster(false);
    }
  };

  const handleClearSchedule = async () => {
    if (window.confirm('سيتم حذف جدول الحصص المحفوظ محلياً حتى تتمكن من رفع جدول جديد. هل أنت متأكد؟')) {
      await dbUtils.clearSchedule();
      if (onScheduleCleared) await onScheduleCleared();
      alert('تم حذف الجدول بنجاح.');
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
          <Settings size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800">إعدادات النظام المتقدمة</h2>
          <p className="text-sm text-slate-500 font-bold mt-1">إدارة البيانات المخزنة وتفريغ النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center text-center gap-4 hover:shadow-md transition-all md:col-span-2">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h3 className="font-black text-emerald-950 text-lg">رابط تحضير الموظفين الصباحي</h3>
            <p className="text-xs text-emerald-700 mt-2 font-bold leading-relaxed">يناسب الجوال وجميع الشاشات. الحالة الافتراضية حضر، وعند اختيار لم يحضر تنعكس في النظام وتحسب 15 دقيقة تأخير عند مزامنة الصفحة الرئيسية.</p>
            <div className="mt-4 bg-white border border-emerald-100 rounded-2xl p-3 text-xs font-bold text-slate-600 break-all direction-ltr text-left">
              {attendanceLink}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-auto">
            <button onClick={handlePublishAttendanceLink} disabled={isPublishingRoster} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50 shadow-md shadow-emerald-200">
              <Link2 size={18} />
              {isPublishingRoster ? 'جاري التحديث...' : 'تحديث ونسخ الرابط'}
            </button>
            <button onClick={() => window.open(attendanceLink, '_blank')} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-4 py-3 rounded-xl font-black text-sm transition-all">
              فتح الرابط
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center text-center gap-4 hover:shadow-md transition-all">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
            <CalendarX size={32} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-lg">جدول الحصص</h3>
            <p className="text-xs text-slate-500 mt-2 font-bold leading-relaxed">حذف الجدول المحفوظ لتغييره أو رفع نسخة جديدة من شاشة الجدول والمساءلة.</p>
          </div>
          <button onClick={handleClearSchedule} className="mt-auto w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-4 py-3 rounded-xl font-black text-sm transition-all">
            <Trash2 size={18} />
            حذف الجدول
          </button>
        </div>

        {/* Local Employees */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center text-center gap-4 hover:shadow-md transition-all">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Users size={32} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-lg">بيانات الموظفين</h3>
            <p className="text-xs text-slate-500 mt-2 font-bold leading-relaxed">حذف جميع الأسماء وبيانات الموظفين المحفوظة محلياً على هذا الجهاز فقط.</p>
          </div>
          <button onClick={handleClearEmployees} className="mt-auto w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-4 py-3 rounded-xl font-black text-sm transition-all">
            <Trash2 size={18} />
            حذف الأسماء
          </button>
        </div>

        {/* Local Reports */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex flex-col items-center text-center gap-4 hover:shadow-md transition-all">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
            <MessageSquare size={32} />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-lg">المساءلات المحلية</h3>
            <p className="text-xs text-slate-500 mt-2 font-bold leading-relaxed">حذف جميع التقارير والمساءلات المحفوظة محلياً على هذا الجهاز.</p>
          </div>
          <button onClick={handleClearReports} className="mt-auto w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-4 py-3 rounded-xl font-black text-sm transition-all">
            <Trash2 size={18} />
            حذف المساءلات
          </button>
        </div>

        {/* Firebase DB */}
        <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex flex-col items-center text-center gap-4 hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
          <div className="w-16 h-16 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center">
            <Database size={32} />
          </div>
          <div>
            <h3 className="font-black text-rose-900 text-lg">قاعدة بيانات Firebase</h3>
            <p className="text-xs text-rose-700/80 mt-2 font-bold leading-relaxed">حذف جميع البيانات من الخادم السحابي. المعلمون لن يتمكنوا من فتح الروابط القديمة!</p>
          </div>
          <button disabled={isDeletingFirebase} onClick={handleClearFirebase} className="mt-auto w-full flex items-center justify-center gap-2 bg-rose-600 text-white hover:bg-rose-700 px-4 py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50 shadow-md shadow-rose-200">
            {isDeletingFirebase ? <ShieldAlert className="animate-spin" size={18} /> : <Trash2 size={18} />}
            {isDeletingFirebase ? 'جاري الحذف...' : 'إفراغ الخادم السحابي'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
