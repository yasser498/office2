import React, { useState, useRef } from 'react';
import * as xlsx from 'xlsx';
import { Employee, ScheduleEntry, Report } from '../types';
import { Upload, Calendar, Search, Users, AlertCircle, Save, CheckCircle, Table as TableIcon, Trash2, Edit3, X, XCircle } from 'lucide-react';
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
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedClassesForReport, setSelectedClassesForReport] = useState<ScheduleEntry[]>([]);
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editedRowData, setEditedRowData] = useState<ScheduleEntry | null>(null);

  React.useEffect(() => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
    const today = new Date().getDay();
    if (today >= 0 && today <= 4) {
      setSelectedDay(days[today]);
    } else {
      setSelectedDay('الأحد');
    }

    const loadData = async () => {
      try {
        const data = await dbUtils.getSchedule();
        if (data && data.length > 0) setScheduleData(data);
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
          alert('لم يتم العثور على عناوين الأعمدة في الملف.');
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
          alert('الأعمدة الأساسية مفقودة.');
          setLoading(false);
          return;
        }

        const parsedData: ScheduleEntry[] = [];
        for (let i = dataStartIndex; i < data.length; i++) {
          const row = data[i];
          if (!row || !row[teacherIdx]) continue; 

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
        dbUtils.saveSchedule(parsedData).catch(err => console.error(err));
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
    const matchedEmployee = employees.find(emp => {
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
      date: reportDate,
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-100">
            <TableIcon size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">الجدول العام ومساءلة الحصص</h2>
            <p className="text-sm text-slate-500 font-bold mt-1">ارفع الجدول واستعرض الحصص لتسجيل مساءلات الغياب عنها بسهولة</p>
          </div>
        </div>

        {scheduleData.length === 0 ? (
          <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-[2rem] p-16 text-center flex flex-col items-center transition-all hover:bg-emerald-50/50">
            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-emerald-500 mb-6 shadow-xl shadow-emerald-100">
              <Upload size={40} className="animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-emerald-900 mb-2">رفع الجدول العام</h3>
            <p className="text-slate-500 font-bold mb-8">اختر ملف الإكسل (Excel) الذي يحتوي على الجدول بصيغته الرسمية</p>
            
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} ref={fileInputRef} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:bg-slate-300"
            >
              {loading ? 'جاري التحليل ومعالجة البيانات...' : 'اختيار ملف الإكسل الآن'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filters Section */}
            <div className="flex flex-wrap gap-4 bg-[#f8fafc] p-6 rounded-[1.5rem] border border-slate-200 shadow-inner">
              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-600">اليوم</label>
                <select 
                  value={selectedDay} 
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none font-bold transition-all ${
                    selectedDay !== ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][new Date().getDay()] 
                      ? 'border-amber-300 bg-amber-50 text-amber-700 focus:ring-4 focus:ring-amber-100' 
                      : 'border-slate-200 bg-white focus:ring-4 focus:ring-emerald-100'
                  }`}
                >
                  <option value="">الكل</option>
                  {getUniqueValues('day').map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-600">المعلم</label>
                <select value={selectedTeacher} onChange={(e) => { setSelectedTeacher(e.target.value); setSelectedClassesForReport([]); }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 font-bold transition-all">
                  <option value="">الكل</option>
                  {getUniqueValues('teacher').map(teacher => <option key={teacher} value={teacher}>{teacher}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-600">الحصة</label>
                <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 font-bold transition-all">
                  <option value="">الكل</option>
                  {getUniqueValues('session').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-600">الصف</label>
                <select value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 font-bold transition-all">
                  <option value="">الكل</option>
                  {getUniqueValues('grade').map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="flex-1 min-w-[150px] space-y-2">
                <label className="text-xs font-black text-slate-600">الفصل</label>
                <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 font-bold transition-all">
                  <option value="">الكل</option>
                  {getUniqueValues('section').map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-black text-xs border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-16 text-center">اختيار</th>
                    <th className="p-4">المعلم</th>
                    <th className="p-4">المادة</th>
                    <th className="p-4">الحصة</th>
                    <th className="p-4">الصف / الفصل</th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                  {filteredData.slice(0, 100).map((row, _idx) => {
                    const originalIndex = scheduleData.indexOf(row);
                    const isSelected = selectedClassesForReport.some(p => p.session === row.session && p.day === row.day && p.teacher === row.teacher);
                    const isEditing = editingRowIndex === originalIndex;

                    return (
                      <tr key={originalIndex} className={`hover:bg-emerald-50/50 transition-colors ${isSelected ? 'bg-emerald-50' : ''}`}>
                        <td className="p-4 text-center cursor-pointer" onClick={() => !isEditing && toggleClassSelection(row)}>
                          <div className={`w-6 h-6 mx-auto rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'border-2 border-slate-300 hover:border-emerald-400'}`}>
                            {isSelected && <CheckCircle size={16} />}
                          </div>
                        </td>
                        <td className="p-4">
                          {isEditing ? <input value={editedRowData?.teacher || ''} onChange={(e) => setEditedRowData({...editedRowData!, teacher: e.target.value})} className="w-full p-2 text-xs border border-emerald-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-100" /> : <span className="text-slate-800">{row.teacher}</span>}
                        </td>
                        <td className="p-4">
                          {isEditing ? <input value={editedRowData?.subject || ''} onChange={(e) => setEditedRowData({...editedRowData!, subject: e.target.value})} className="w-full p-2 text-xs border border-emerald-300 rounded-lg outline-none" /> : <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-600 text-xs border border-slate-200">{row.subject}</span>}
                        </td>
                        <td className="p-4">
                          {isEditing ? <input value={editedRowData?.session || ''} onChange={(e) => setEditedRowData({...editedRowData!, session: e.target.value})} className="w-full p-2 text-xs border border-emerald-300 rounded-lg outline-none" /> : <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-700">{row.session}</div>}
                        </td>
                        <td className="p-4">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <input value={editedRowData?.grade || ''} onChange={(e) => setEditedRowData({...editedRowData!, grade: e.target.value})} className="w-1/2 p-2 text-xs border border-emerald-300 rounded-lg outline-none" placeholder="الصف" />
                              <input value={editedRowData?.section || ''} onChange={(e) => setEditedRowData({...editedRowData!, section: e.target.value})} className="w-1/2 p-2 text-xs border border-emerald-300 rounded-lg outline-none" placeholder="الفصل" />
                            </div>
                          ) : (
                            <span className="text-slate-600">{row.grade} / {row.section}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {isEditing ? (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => handleSaveEditedRow(originalIndex)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 shadow-md">حفظ</button>
                              <button onClick={() => setEditingRowIndex(null)} className="text-xs bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-300">إلغاء</button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-2">
                              <button onClick={() => { setEditingRowIndex(originalIndex); setEditedRowData(row); }} className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 rounded-lg transition-colors"><Edit3 size={16} /></button>
                              <button onClick={() => handleDeleteRow(originalIndex)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Floating Action Bar */}
            {selectedClassesForReport.length > 0 && (
              <div className="bg-emerald-900/95 backdrop-blur-xl rounded-[2rem] p-5 text-white flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-4 shadow-2xl shadow-emerald-900/30 border border-emerald-700/50 sticky bottom-4 z-50">
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-800 p-3 rounded-2xl border border-emerald-600/50 shadow-inner">
                    <AlertCircle size={24} className="text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-emerald-50">إصدار مساءلة حصص</h4>
                    <p className="text-emerald-300 text-xs font-bold mt-1">
                      تم اختيار ({selectedClassesForReport.length}) حصص للمعلم "{selectedClassesForReport[0]?.teacher}"
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-3 bg-black/20 px-4 py-2.5 rounded-[1.5rem] border border-white/10 w-full md:w-auto">
                    <label className="text-xs font-bold text-emerald-200">تاريخ المساءلة:</label>
                    <input 
                      type="date" 
                      value={reportDate} 
                      onChange={e => setReportDate(e.target.value)} 
                      className="bg-transparent text-white outline-none font-black text-sm"
                    />
                  </div>
                  <button 
                    onClick={handleSaveQuestioningReport}
                    className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-8 py-3.5 rounded-[1.5rem] font-black text-sm transition-all shadow-lg shadow-emerald-900/50 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    حفظ في سجل الموظف
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={async () => {
                  if (window.confirm('هل أنت متأكد من حذف الجدول كاملاً من النظام؟')) {
                    await dbUtils.clearSchedule();
                    setScheduleData([]);
                    setSelectedClassesForReport([]);
                  }
                }}
                className="text-xs font-black text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-100"
              >
                <Trash2 size={14} /> تفريغ الجدول بالكامل
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleQuestioning;
