import React, { useState, useRef } from 'react';
import * as xlsx from 'xlsx';
import { Employee, ScheduleEntry, Report } from '../types';
import { Upload, Calendar, Search, Users, AlertCircle, Save, CheckCircle, Table as TableIcon } from 'lucide-react';
import * as dbUtils from '../utils/db';

interface ScheduleQuestioningProps {
  employees: Employee[];
  onSaveReport: (report: Report, employeeId: number) => Promise<void>;
}

const ScheduleQuestioning: React.FC<ScheduleQuestioningProps> = ({ employees, onSaveReport }) => {
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedClassesForReport, setSelectedClassesForReport] = useState<ScheduleEntry[]>([]);

  // حالة التعديل على الحصص
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editedRowData, setEditedRowData] = useState<ScheduleEntry | null>(null);

  // تحميل الجدول من قاعدة البيانات وتحديد اليوم الافتراضي
  React.useEffect(() => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const today = new Date().getDay();
    if (today >= 0 && today <= 4) {
      setSelectedDay(days[today]);
    } else {
      setSelectedDay('الأحد'); // افتراضي لو كان إجازة
    }

    const loadData = async () => {
      try {
        const data = await dbUtils.getSchedule();
        if (data && data.length > 0) {
          setScheduleData(data);
        }
      } catch (e) {
        console.error("Failed to load schedule", e);
      }
    };
    loadData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json<any>(ws, { header: 1 });

        // البحث عن عناوين الأعمدة
        let headers: string[] = [];
        let dataStartIndex = 0;

        for (let i = 0; i < Math.min(10, data.length); i++) {
          const row = data[i];
          if (row && row.some && row.some((cell: any) => typeof cell === 'string' && (cell.includes('اليوم') || cell.includes('المعلم')))) {
            headers = row;
            dataStartIndex = i + 1;
            break;
          }
        }

        if (headers.length === 0) {
          alert('لم يتم العثور على عناوين الأعمدة في الملف. تأكد من وجود أعمدة: اليوم، الحصة، الصف، الفصل، المعلم، المادة.');
          setLoading(false);
          return;
        }

        const findIndex = (keyword: string) => headers.findIndex(h => typeof h === 'string' && h.trim() === keyword);
        
        const dayIdx = findIndex('اليوم');
        const sessionIdx = findIndex('الحصة');
        const gradeIdx = findIndex('الصف');
        const sectionIdx = findIndex('الفصل');
        const teacherIdx = findIndex('المعلم');
        const subjectIdx = findIndex('المادة');

        if (dayIdx === -1 || sessionIdx === -1 || teacherIdx === -1) {
          alert('الأعمدة الأساسية مفقودة (اليوم، الحصة، المعلم). الرجاء التأكد من ملف الجدول.');
          setLoading(false);
          return;
        }

        const parsedData: ScheduleEntry[] = [];
        for (let i = dataStartIndex; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[teacherIdx]) continue; // تجاوز الصفوف الفارغة

          parsedData.push({
            day: String(row[dayIdx] || '').trim(),
            session: String(row[sessionIdx] || '').trim(),
            grade: String(row[gradeIdx] || '').trim(),
            section: String(row[sectionIdx] || '').trim(),
            teacher: String(row[teacherIdx] || '').trim(),
            subject: String(row[subjectIdx] || '').trim(),
          });
        }

        setScheduleData(parsedData);
        dbUtils.saveSchedule(parsedData).catch(err => console.error('Failed to save to IndexedDB', err));
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء قراءة الملف');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const getUniqueValues = (field: keyof ScheduleEntry, data: ScheduleEntry[] = scheduleData) => {
    return Array.from(new Set(data.map(item => item[field]).filter(Boolean))).sort();
  };

  // تصفية البيانات الأساسية
  let filteredData = scheduleData;
  if (selectedDay) filteredData = filteredData.filter(d => d.day === selectedDay);
  if (selectedSession) filteredData = filteredData.filter(d => d.session === selectedSession);
  if (selectedGrade) filteredData = filteredData.filter(d => d.grade === selectedGrade);
  if (selectedSection) filteredData = filteredData.filter(d => d.section === selectedSection);
  if (selectedTeacher) filteredData = filteredData.filter(d => d.teacher === selectedTeacher);

  const toggleClassSelection = (entry: ScheduleEntry) => {
    setSelectedClassesForReport(prev => {
      const exists = prev.find(p => p.session === entry.session && p.day === entry.day && p.teacher === entry.teacher);
      if (exists) return prev.filter(p => p !== exists);
      return [...prev, entry];
    });
  };

  const handleDeleteRow = async (index: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحصة؟')) return;
    const newData = [...scheduleData];
    newData.splice(index, 1);
    setScheduleData(newData);
    await dbUtils.saveSchedule(newData);
  };

  const handleSaveEditedRow = async (index: number) => {
    if (!editedRowData) return;
    const newData = [...scheduleData];
    newData[index] = editedRowData;
    setScheduleData(newData);
    await dbUtils.saveSchedule(newData);
    setEditingRowIndex(null);
    setEditedRowData(null);
  };

  const handleSaveQuestioningReport = async () => {
    if (selectedClassesForReport.length === 0) {
      alert('الرجاء اختيار الحصص أولاً.');
      return;
    }

    const teacherName = selectedClassesForReport[0].teacher;
    // محاولة العثور على الموظف في قاعدة البيانات
    const matchedEmployee = employees.find(emp => {
      // مطابقة الاسم الأول والأخير أو مطابقة جزئية قوية
      const parts = teacherName.split(' ');
      if (parts.length >= 2) {
        return emp.name.includes(parts[0]) && emp.name.includes(parts[parts.length - 1]);
      }
      return emp.name.includes(teacherName) || teacherName.includes(emp.name);
    });

    if (!matchedEmployee) {
      alert(`لم يتم العثور على الموظف "${teacherName}" في قائمة الموظفين. يرجى إضافته أولاً.`);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    const report: Report = {
      employeeId: matchedEmployee.id,
      date: todayStr,
      type: 'مساءلة_حصص',
      notes: `غياب عن ${selectedClassesForReport.length} حصص`,
      actionTaken: '',
      excuseStatus: 'pending',
      missedClasses: selectedClassesForReport,
      createdAt: todayStr
    };

    try {
      await onSaveReport(report, matchedEmployee.id);
      alert('تم حفظ المساءلة بنجاح.');
      setSelectedClassesForReport([]);
    } catch (err) {
      alert('فشل الحفظ. تأكد من الاتصال.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
            <TableIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">الجدول العام ومساءلة الحصص</h2>
            <p className="text-sm text-slate-500 font-bold mt-1">ارفع الجدول واستعرض الحصص لتسجيل مساءلات الغياب عنها</p>
          </div>
        </div>

        {scheduleData.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-400 mb-6">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-700 mb-2">رفع الجدول العام</h3>
            <p className="text-slate-500 font-bold mb-8">اختر ملف الإكسل الذي يحتوي على الجدول بصيغته الرسمية</p>
            
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:bg-slate-300"
            >
              {loading ? 'جاري التحليل...' : 'اختيار ملف الإكسل'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">اليوم</label>
                <select 
                  value={selectedDay} 
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border outline-none font-bold transition-all ${
                    selectedDay !== ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][new Date().getDay()] 
                      ? 'border-amber-300 bg-amber-50 text-amber-700 focus:ring-4 focus:ring-amber-100' 
                      : 'border-slate-200 bg-white focus:ring-4 focus:ring-indigo-100'
                  }`}
                >
                  <option value="">الكل</option>
                  {getUniqueValues('day', scheduleData).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
                {selectedDay !== ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][new Date().getDay()] && selectedDay !== '' && (
                  <p className="text-[10px] text-amber-600 font-black animate-pulse flex items-center gap-1">
                    <AlertCircle size={10} /> تنبيه: لقد قمت بتغيير اليوم الحالي
                  </p>
                )}
              </div>

              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">المعلم</label>
                <select 
                  value={selectedTeacher} 
                  onChange={(e) => {
                    setSelectedTeacher(e.target.value);
                    setSelectedClassesForReport([]); // Reset selections on teacher change
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold"
                >
                  <option value="">الكل</option>
                  {getUniqueValues('teacher', scheduleData).map(teacher => (
                    <option key={teacher} value={teacher}>{teacher}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">الحصة</label>
                <select 
                  value={selectedSession} 
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold"
                >
                  <option value="">الكل</option>
                  {getUniqueValues('session', scheduleData).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">الصف</label>
                <select 
                  value={selectedGrade} 
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold"
                >
                  <option value="">الكل</option>
                  {getUniqueValues('grade', scheduleData).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-700 pr-2">الفصل</label>
                <select 
                  value={selectedSection} 
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold"
                >
                  <option value="">الكل</option>
                  {getUniqueValues('section', scheduleData).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-100 bg-white">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 font-black text-xs">
                  <tr>
                    <th className="p-4">اختيار</th>
                    <th className="p-4">المعلم</th>
                    <th className="p-4">المادة</th>
                    <th className="p-4">الحصة</th>
                    <th className="p-4">الصف</th>
                    <th className="p-4">الفصل</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm font-bold text-slate-700">
                  {filteredData.slice(0, 100).map((row, _idx) => {
                    const originalIndex = scheduleData.indexOf(row);
                    const isSelected = selectedClassesForReport.some(p => p.session === row.session && p.day === row.day && p.teacher === row.teacher);
                    const isEditing = editingRowIndex === originalIndex;

                    return (
                      <tr 
                        key={originalIndex} 
                        className={`hover:bg-indigo-50/50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
                      >
                        <td className="p-4 cursor-pointer" onClick={() => !isEditing && toggleClassSelection(row)}>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'border-2 border-slate-300'}`}>
                            {isSelected && <CheckCircle size={14} />}
                          </div>
                        </td>
                        <td className="p-4">
                          {isEditing ? <input value={editedRowData?.teacher || ''} onChange={(e) => setEditedRowData({...editedRowData!, teacher: e.target.value})} className="w-full p-1 text-xs border rounded" /> : row.teacher}
                        </td>
                        <td className="p-4">
                          {isEditing ? <input value={editedRowData?.subject || ''} onChange={(e) => setEditedRowData({...editedRowData!, subject: e.target.value})} className="w-full p-1 text-xs border rounded" /> : <span className="bg-slate-100 px-2 py-1 rounded-lg text-slate-600 text-[10px]">{row.subject}</span>}
                        </td>
                        <td className="p-4">
                          {isEditing ? <input value={editedRowData?.session || ''} onChange={(e) => setEditedRowData({...editedRowData!, session: e.target.value})} className="w-full p-1 text-xs border rounded" /> : row.session}
                        </td>
                        <td className="p-4">
                          {isEditing ? <input value={editedRowData?.grade || ''} onChange={(e) => setEditedRowData({...editedRowData!, grade: e.target.value})} className="w-full p-1 text-xs border rounded" /> : row.grade}
                        </td>
                        <td className="p-4">
                          {isEditing ? <input value={editedRowData?.section || ''} onChange={(e) => setEditedRowData({...editedRowData!, section: e.target.value})} className="w-full p-1 text-xs border rounded" /> : row.section}
                        </td>
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleSaveEditedRow(originalIndex)} className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100">حفظ</button>
                              <button onClick={() => setEditingRowIndex(null)} className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded hover:bg-slate-100">إلغاء</button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => { setEditingRowIndex(originalIndex); setEditedRowData(row); }} className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline">تعديل</button>
                              <button onClick={() => handleDeleteRow(originalIndex)} className="text-xs text-rose-500 hover:text-rose-700 hover:underline">حذف</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredData.length > 100 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-400 font-bold text-xs bg-slate-50">
                        هناك المزيد من النتائج، يرجى تضييق نطاق البحث...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedClassesForReport.length > 0 && (
              <div className="bg-indigo-600 rounded-[2rem] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-4 shadow-2xl shadow-indigo-200">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black">إصدار مساءلة حصص</h4>
                    <p className="text-indigo-200 text-sm font-bold mt-1">
                      تم اختيار ({selectedClassesForReport.length}) حصص للمعلم "{selectedClassesForReport[0]?.teacher}"
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleSaveQuestioningReport}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 px-8 py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
                >
                  <Save size={18} />
                  حفظ المساءلة في سجل الموظف
                </button>
              </div>
            )}
            
            <div className="flex justify-end">
              <button 
                onClick={async () => {
                  if (window.confirm('هل أنت متأكد من حذف الجدول من النظام؟')) {
                    await dbUtils.clearSchedule();
                    setScheduleData([]);
                    setSelectedClassesForReport([]);
                  }
                }}
                className="text-xs font-black text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors"
              >
                حذف الجدول المحمل
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleQuestioning;
