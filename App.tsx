
import { Search, Users, User, ArrowRight, LayoutDashboard, Settings, CheckCircle, Save, School, UserCog, CheckSquare, Square, ClipboardList, BarChart3, UserMinus, UserPlus, Trash2, Edit3, XCircle, Heart, Sparkles, Hash, MapPin, Calendar } from 'lucide-react';
import { useEmployeeDB } from './hooks/useEmployeeDB';
import FileUpload from './components/FileUpload';
import ReportForm from './components/ReportForm';
import HistoryList from './components/HistoryList';
import DailyLog from './components/DailyLog';
import StatisticsView from './components/StatisticsView';
import EmployeeManualForm from './components/EmployeeManualForm';
import ScheduleQuestioning from './components/ScheduleQuestioning';
import { Employee, Report } from './types';
import * as dbUtils from './utils/db';
import React, { useState, useEffect, useMemo } from 'react';

const App: React.FC = () => {
  const { employees, loading, importEmployees, addManualEmployee, getReports, saveReport, removeReport, resetData, refresh } = useEmployeeDB();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [employeeReports, setEmployeeReports] = useState<Report[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [educationDept, setEducationDept] = useState('');
  const [schoolGender, setSchoolGender] = useState<'boys' | 'girls'>('boys');
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [viewMode, setViewMode] = useState<'employees' | 'daily_log' | 'statistics' | 'schedule_questioning'>('employees');
  
  const [tempEmployeeData, setTempEmployeeData] = useState<Employee | null>(null);

  useEffect(() => {
    dbUtils.getSetting('principalName').then(name => { if (name) setPrincipalName(name); }).catch(console.error);
    dbUtils.getSetting('schoolName').then(name => { if (name) setSchoolName(name); }).catch(console.error);
    dbUtils.getSetting('educationDept').then(dept => { if (dept) setEducationDept(dept); }).catch(console.error);
    dbUtils.getSetting('schoolGender').then(gender => { if (gender) setSchoolGender(gender); }).catch(console.error);
    refreshAllReports();
  }, []);

  const refreshAllReports = async () => {
    try {
      const reports = await dbUtils.getAllReports();
      setAllReports(reports);
    } catch (error) {
      console.error('Error fetching all reports:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await dbUtils.setSetting('principalName', principalName);
      await dbUtils.setSetting('schoolName', schoolName);
      await dbUtils.setSetting('educationDept', educationDept);
      await dbUtils.setSetting('schoolGender', schoolGender);
      setIsSettingsSaved(true);
      setTimeout(() => setIsSettingsSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('فشل في حفظ الإعدادات');
    }
  };

  const toggleEmployeeSelection = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else {
        return [...prev, id];
      }
    });
    setEditingReport(null);
    setIsEditingEmployee(false);
    setTempEmployeeData(null);
    if (viewMode === 'statistics') setViewMode('employees'); 
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredEmployees.map(e => e.id);
    setSelectedIds(allFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const selectedEmployees = useMemo(() => 
    employees.filter(emp => selectedIds.includes(emp.id)), 
  [employees, selectedIds]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        if (selectedIds.length === 1) {
          const reports = await getReports(selectedIds[0]);
          setEmployeeReports(reports);
        } else if (selectedIds.length > 1) {
          setEmployeeReports([]); 
        } else {
          setEmployeeReports([]);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
      }
    };
    loadReports();
  }, [selectedIds, getReports]);

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempEmployeeData) {
      try {
        await dbUtils.updateEmployee(tempEmployeeData);
        setIsEditingEmployee(false);
        setTempEmployeeData(null);
        await refresh();
        alert('تم تحديث بيانات الموظف بنجاح');
      } catch (error) {
        console.error('Failed to update employee:', error);
      }
    }
  };

  const handleAddManualEmployee = async (data: Omit<Employee, 'id'>) => {
    try {
      await addManualEmployee(data);
    } catch (error) {
      console.error('Failed to add employee:', error);
    }
  };

  const handleStartEditing = (employee: Employee) => {
    setTempEmployeeData({ ...employee });
    setIsEditingEmployee(true);
    setSelectedIds([employee.id]);
    setViewMode('employees');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (window.confirm(`هل أنت متأكد من حذف الموظف "${employee.name}"؟ سيؤدي ذلك لحذف كافة تقاريره ومساءلاته نهائياً.`)) {
      try {
        await dbUtils.deleteEmployee(employee.id);
        setSelectedIds(prev => prev.filter(id => id !== employee.id));
        await refresh();
        await refreshAllReports();
      } catch (error) {
        console.error('Failed to delete employee:', error);
      }
    }
  };

  const handleSaveReportBatch = async (report: Report, employeeId: number) => {
    try {
      const reportWithSettings = { 
        ...report, 
        employeeId,
        principalName, 
        notes: report.notes
      };
      await saveReport(reportWithSettings);
      await refreshAllReports();
      if (selectedIds.includes(employeeId) && selectedIds.length === 1) {
        const updatedReports = await getReports(selectedIds[0]);
        setEmployeeReports(updatedReports);
      }
    } catch (error) {
      console.error('Error saving report batch:', error);
      throw error;
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    try {
      await removeReport(reportId);
      await refreshAllReports();
      if (selectedIds.length > 0) {
        const updatedReports = await getReports(selectedIds[0]);
        setEmployeeReports(updatedReports);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setSelectedIds([report.employeeId]);
    setViewMode('employees');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const lowerQuery = searchQuery.toLowerCase();
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(lowerQuery) ||
      emp.civilId?.toLowerCase().includes(lowerQuery) ||
      emp.workplace?.toLowerCase().includes(lowerQuery) ||
      emp.employeeCode?.toLowerCase().includes(lowerQuery)
    );
  }, [employees, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-800 text-white shadow-2xl sticky top-0 z-40 border-b border-white/10 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between py-6 gap-6">
          <div className="flex items-center gap-5 group">
            <div className="bg-white/10 p-4 rounded-3xl group-hover:bg-white/20 transition-all duration-500 border border-white/20 shadow-xl">
              <Sparkles size={36} className="text-indigo-100 animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-blue-200">
                إنجاز الذكي
              </h1>
              <p className="text-[10px] lg:text-xs font-bold text-indigo-300 tracking-[0.2em] opacity-80 uppercase">منصة إدارة الانضباط المدرسي</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-indigo-900/40 p-4 rounded-[2rem] border border-white/10 w-full lg:w-auto backdrop-blur-sm">
            <div className="flex-1 flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 focus-within:border-white/20 transition-all min-w-[150px]">
              <MapPin size={20} className="text-indigo-300" />
              <input type="text" value={educationDept} onChange={(e) => setEducationDept(e.target.value)} placeholder="إدارة التعليم بـ..." className="bg-transparent border-none text-sm font-bold outline-none w-full placeholder:text-indigo-300/40" />
            </div>
            <div className="flex-1 flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 focus-within:border-white/20 transition-all min-w-[150px]">
              <School size={20} className="text-indigo-300" />
              <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="اسم المدرسة..." className="bg-transparent border-none text-sm font-bold outline-none w-full placeholder:text-indigo-300/40" />
            </div>
            <div className="flex-1 flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/5 focus-within:border-white/20 transition-all min-w-[150px]">
              <UserCog size={20} className="text-indigo-300" />
              <input type="text" value={principalName} onChange={(e) => setPrincipalName(e.target.value)} placeholder="اسم المدير..." className="bg-transparent border-none text-sm font-bold outline-none w-full placeholder:text-indigo-300/40" />
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setSchoolGender('boys')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${schoolGender === 'boys' ? 'bg-white text-indigo-700 shadow-lg' : 'text-indigo-200 hover:bg-white/5'}`}
              >
                بنين
              </button>
              <button 
                onClick={() => setSchoolGender('girls')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${schoolGender === 'girls' ? 'bg-white text-rose-600 shadow-lg' : 'text-indigo-200 hover:bg-white/5'}`}
              >
                بنات
              </button>
            </div>

            <button onClick={handleSaveSettings} title="حفظ الإعدادات" className={`p-3 rounded-2xl transition-all shadow-xl active:scale-90 ${isSettingsSaved ? 'bg-emerald-500 text-white scale-110' : 'bg-indigo-600 hover:bg-white hover:text-indigo-700 text-white'}`}>
              {isSettingsSaved ? <CheckCircle size={22} /> : <Save size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10 flex-1 w-full relative">
        <div className="animate-in fade-in slide-in-from-top-6 duration-1000">
          <FileUpload onDataLoaded={importEmployees} onReset={resetData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-4 space-y-8">
            <div className="bg-white p-3 rounded-[2.5rem] border border-slate-100 shadow-2xl flex flex-col gap-2 overflow-hidden sticky top-32">
              <button 
                onClick={() => setViewMode('employees')}
                className={`w-full flex items-center justify-start gap-5 px-6 py-5 rounded-3xl text-sm font-black transition-all duration-300 ${viewMode === 'employees' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-[1.03]' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <div className={`${viewMode === 'employees' ? 'bg-white/20' : 'bg-indigo-50'} p-2.5 rounded-2xl transition-colors`}>
                  <Users size={22} className={viewMode === 'employees' ? 'text-white' : 'text-indigo-600'} />
                </div>
                الموظفون والتقارير
              </button>
              <button 
                onClick={() => setViewMode('daily_log')}
                className={`w-full flex items-center justify-start gap-5 px-6 py-5 rounded-3xl text-sm font-black transition-all duration-300 ${viewMode === 'daily_log' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-[1.03]' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <div className={`${viewMode === 'daily_log' ? 'bg-white/20' : 'bg-indigo-50'} p-2.5 rounded-2xl transition-colors`}>
                  <ClipboardList size={22} className={viewMode === 'daily_log' ? 'text-white' : 'text-indigo-600'} />
                </div>
                السجل العام والطباعة
              </button>
              <button 
                onClick={() => setViewMode('schedule_questioning')}
                className={`w-full flex items-center justify-start gap-5 px-6 py-5 rounded-3xl text-sm font-black transition-all duration-300 ${viewMode === 'schedule_questioning' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-[1.03]' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <div className={`${viewMode === 'schedule_questioning' ? 'bg-white/20' : 'bg-indigo-50'} p-2.5 rounded-2xl transition-colors`}>
                  <Calendar size={22} className={viewMode === 'schedule_questioning' ? 'text-white' : 'text-indigo-600'} />
                </div>
                مساءلة الحصص والجدول
              </button>
              <button 
                onClick={() => setViewMode('statistics')}
                className={`w-full flex items-center justify-start gap-5 px-6 py-5 rounded-3xl text-sm font-black transition-all duration-300 ${viewMode === 'statistics' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-[1.03]' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <div className={`${viewMode === 'statistics' ? 'bg-white/20' : 'bg-indigo-50'} p-2.5 rounded-2xl transition-colors`}>
                  <BarChart3 size={22} className={viewMode === 'statistics' ? 'text-white' : 'text-indigo-600'} />
                </div>
                الإحصائيات والتحليل
              </button>
            </div>

            {viewMode === 'employees' && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-8 rounded-[2.5rem] shadow-xl border border-indigo-100 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-200">
                  <UserPlus size={40} />
                </div>
                <h4 className="text-xl font-black text-slate-800 mb-2">إضافة موظف جديد؟</h4>
                <p className="text-slate-500 text-sm mb-6 font-bold leading-relaxed">يمكنك إضافة بيانات الموظف يدوياً دون الحاجة لملف إكسل.</p>
                <button 
                  onClick={() => setIsAddingEmployee(true)}
                  className="w-full bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white px-6 py-4 rounded-[1.8rem] font-black text-sm transition-all duration-300 shadow-lg active:scale-95"
                >
                  إضافة يدوية الآن
                </button>
              </div>
            )}
          </aside>

          <section className="lg:col-span-8 space-y-10">
            {viewMode === 'employees' ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-slate-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
                   <div className="relative z-10 flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                               <Search size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">قائمة الموظفين</h2>
                         </div>
                         <div className="flex items-center gap-3">
                           <button onClick={handleSelectAll} className="text-xs font-black text-indigo-600 hover:underline">اختيار الكل</button>
                           <button onClick={handleDeselectAll} className="text-xs font-black text-slate-400 hover:underline">إلغاء المختار</button>
                         </div>
                      </div>
                      
                      <div className="relative group">
                         <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                         <input 
                           type="text" 
                           placeholder="ابحث بالاسم، السجل المدني، أو رقم الوظيفة..." 
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full pr-12 pl-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.8rem] outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-bold text-slate-700"
                         />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredEmployees.length === 0 ? (
                          <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                             <XCircle size={64} className="text-slate-200" />
                             <p className="text-slate-400 font-black text-lg">لم يتم العثور على أي موظف مطابق للبحث</p>
                          </div>
                        ) : filteredEmployees.map(emp => {
                          const isSelected = selectedIds.includes(emp.id);
                          return (
                            <div 
                              key={emp.id} 
                              onClick={() => toggleEmployeeSelection(emp.id)}
                              className={`group p-5 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 relative overflow-hidden ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-100 scale-[1.02]' : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50'}`}
                            >
                               {isSelected && <CheckCircle className="absolute top-4 left-4 text-white animate-in zoom-in-50" size={24} />}
                               <div className="flex items-start gap-4">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>
                                     <User size={28} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                     <h5 className="font-black text-lg truncate leading-tight mb-1">{emp.name}</h5>
                                     <p className={`text-xs font-bold mb-2 flex items-center gap-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                        <Hash size={12} /> {emp.civilId}
                                     </p>
                                     <div className="flex flex-wrap gap-2">
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${isSelected ? 'bg-indigo-500/50 text-white' : 'bg-white text-indigo-600'}`}>{emp.workplace || 'معلم'}</span>
                                        {emp.employeeCode && <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${isSelected ? 'bg-indigo-500/50 text-white' : 'bg-slate-200 text-slate-600'}`}>{emp.employeeCode}</span>}
                                     </div>
                                  </div>
                               </div>
                               
                               <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleStartEditing(emp); }}
                                    className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white text-slate-400 hover:text-indigo-600 shadow-sm'}`}
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp); }}
                                    className={`p-2 rounded-xl transition-all ${isSelected ? 'bg-rose-400/20 hover:bg-rose-400 text-white' : 'bg-white text-slate-400 hover:text-rose-600 shadow-sm'}`}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </div>

                {selectedIds.length > 0 && (
                  <div className="animate-in slide-in-from-bottom-10 duration-700">
                    <ReportForm 
                      selectedEmployees={selectedEmployees} 
                      onSave={handleSaveReportBatch}
                      editingReport={editingReport}
                      onCancelEdit={() => setEditingReport(null)}
                    />
                  </div>
                )}

                {selectedIds.length === 1 && (
                  <div className="animate-in fade-in duration-1000">
                    <HistoryList 
                      reports={employeeReports} 
                      selectedEmployee={selectedEmployees[0]} 
                      onDeleteReport={handleDeleteReport}
                      onEditReport={handleEditReport}
                      onUpdateReport={(report) => handleSaveReportBatch(report, report.employeeId)}
                    />
                  </div>
                )}
              </div>
            ) : viewMode === 'schedule_questioning' ? (
              <ScheduleQuestioning employees={employees} onSaveReport={handleSaveReportBatch} />
            ) : viewMode === 'daily_log' ? (
              <DailyLog employees={employees} reports={allReports} onDeleteReport={handleDeleteReport} />
            ) : (
              <StatisticsView reports={allReports} employees={employees} />
            )}
          </section>
        </div>
      </main>

      <footer className="mt-auto bg-white border-t border-slate-100 py-10 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-600" />
              <span className="text-lg font-black text-slate-800 tracking-tight">إنجاز الذكي</span>
            </div>
            <p className="text-xs font-bold text-slate-400">© 2024 جميع الحقوق محفوظة - الإصدار 3.0</p>
          </div>
          
          <div className="flex items-center gap-2 bg-indigo-50 px-6 py-3 rounded-full border border-indigo-100 shadow-sm group hover:scale-105 transition-all duration-300">
            <span className="text-sm font-black text-indigo-900">تم بواسطة ياسر الهذلي</span>
            <Heart size={16} className="text-rose-500 fill-rose-500 animate-pulse group-hover:scale-125 transition-transform" />
          </div>
          
          <div className="flex gap-4">
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                <School size={20} />
             </div>
             <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                <Users size={20} />
             </div>
          </div>
        </div>
      </footer>

      {isAddingEmployee && (
        <EmployeeManualForm onSave={handleAddManualEmployee} onClose={() => setIsAddingEmployee(false)} />
      )}

      {isEditingEmployee && tempEmployeeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-indigo-700 p-8 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl shadow-xl">
                  <Edit3 size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black">تعديل بيانات الموظف</h3>
                  <p className="text-xs text-indigo-200 font-bold">تحديث البيانات الأساسية للسجلات</p>
                </div>
              </div>
              <button onClick={() => setIsEditingEmployee(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <XCircle size={32} />
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-10 overflow-y-auto space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 mr-2">اسم الموظف</label>
                    <input type="text" value={tempEmployeeData.name} onChange={(e) => setTempEmployeeData({...tempEmployeeData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 mr-2">السجل المدني</label>
                    <input type="text" value={tempEmployeeData.civilId} onChange={(e) => setTempEmployeeData({...tempEmployeeData, civilId: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 mr-2">رقم الوظيفة</label>
                    <input type="text" value={tempEmployeeData.employeeCode} onChange={(e) => setTempEmployeeData({...tempEmployeeData, employeeCode: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-slate-700 mr-2">العمل الحالي</label>
                    <input type="text" value={tempEmployeeData.workplace} onChange={(e) => setTempEmployeeData({...tempEmployeeData, workplace: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all" />
                  </div>
               </div>
               <div className="flex gap-4 pt-6">
                 <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3">
                    <Save size={24} />
                    حفظ التغييرات
                 </button>
                 <button type="button" onClick={() => setIsEditingEmployee(false)} className="px-10 py-5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-[2rem] font-black transition-all">إلغاء</button>
               </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;
