import { Search, Users, User, ArrowRight, LayoutDashboard, Settings, CheckCircle, Save, School, UserCog, CheckSquare, Square, ClipboardList, BarChart3, UserMinus, UserPlus, Trash2, Edit3, XCircle, Heart, Sparkles, Hash, MapPin, Calendar, Menu, X, MessageCircle, Clock } from 'lucide-react';
import { useEmployeeDB } from './hooks/useEmployeeDB';
import FileUpload from './components/FileUpload';
import ReportForm from './components/ReportForm';
import HistoryList from './components/HistoryList';
import DailyLog from './components/DailyLog';
import StatisticsView from './components/StatisticsView';
import EmployeeManualForm from './components/EmployeeManualForm';
import ScheduleQuestioning from './components/ScheduleQuestioning';
import SentReportsTracking from './components/SentReportsTracking';
import SignReport from './components/SignReport';
import SettingsView from './components/SettingsView';
import MorningAttendance from './components/MorningAttendance';
import DisciplineTrackingView from './components/DisciplineTrackingView';
import { getAllSharedReports, getMorningAttendanceByDate, getClassIncidentsByDate } from './utils/firebase';
import { Employee, Report } from './types';
import * as dbUtils from './utils/db';
import { formatPhoneNumber } from './utils/phoneFormatter';
import React, { useState, useEffect, useMemo } from 'react';

const App: React.FC = () => {
  const { employees, loading, importEmployees, addManualEmployee, getReports, saveReport, removeReport, resetData, clearEmployeesOnly, clearReportsOnly, refresh } = useEmployeeDB();
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
  const [viewMode, setViewMode] = useState<'employees' | 'daily_log' | 'statistics' | 'discipline_tracking' | 'schedule_questioning' | 'tracking' | 'settings'>('employees');
  
  const [tempEmployeeData, setTempEmployeeData] = useState<Employee | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      let updatedReports = [...reports];

      try {
        const shared = await getAllSharedReports();
        let updated = false;
        
        for (const sReport of shared) {
          if (sReport.status === 'signed' && sReport.firebaseId) {
            const localIndex = updatedReports.findIndex(r => r.firebaseId === sReport.firebaseId);
            if (localIndex !== -1) {
              const localReport = updatedReports[localIndex];
              if (!localReport.teacherSignature && sReport.teacherSignature) {
                const updatedReport = {
                  ...localReport,
                  teacherExcuse: sReport.teacherExcuse,
                  teacherSignature: sReport.teacherSignature,
                  signedAt: sReport.signedAt,
                };
                await dbUtils.updateReport(updatedReport);
                updatedReports[localIndex] = updatedReport;
                updated = true;
              }
            }
          }
        }
        if (updated) {
          reports.splice(0, reports.length, ...updatedReports);
        }
      } catch (syncError) {
        console.error('Error syncing with firebase:', syncError);
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const attendance = await getMorningAttendanceByDate(today);
        let attendanceUpdated = false;
        const absentSourceIds = new Set(
          Object.values(attendance)
            .filter(record => record.status === 'absent')
            .map(record => `morning-${record.date}-${record.employeeId}`)
        );
        const staleMorningReports = updatedReports.filter(report =>
          report.source === 'morning_attendance' &&
          report.date === today &&
          report.sourceId &&
          !absentSourceIds.has(report.sourceId)
        );
        for (const report of staleMorningReports) {
          if (!report.id) continue;
          await dbUtils.deleteReport(report.id);
          updatedReports = updatedReports.filter(item => item.id !== report.id);
          attendanceUpdated = true;
        }
        for (const record of Object.values(attendance)) {
          if (record.status !== 'absent') continue;
          const sourceId = `morning-${record.date}-${record.employeeId}`;
          if (updatedReports.some(r => r.sourceId === sourceId)) continue;
          const report: Report = {
            employeeId: record.employeeId,
            date: record.date,
            createdAt: today,
            type: 'تأخر_انصراف',
            notes: 'لم يحضر التحضير الصباحي',
            actionTaken: '',
            lateArrivalTime: '15',
            minutesCount: 15,
            violationCategory: 'morning_attendance_absent',
            source: 'morning_attendance',
            sourceId,
            excuseStatus: 'pending',
          };
          const id = await dbUtils.addReport(report);
          updatedReports.push({ ...report, id: Number(id) });
          attendanceUpdated = true;
        }
        if (attendanceUpdated) await refresh();
      } catch (attendanceError) {
        console.error('Error syncing morning attendance:', attendanceError);
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const incidents = await getClassIncidentsByDate(today);
        let classUpdated = false;
        const findEmployeeByTeacher = (teacherName: string) => {
          const parts = teacherName.split(' ').filter(Boolean);
          return employees.find(emp => {
            if (emp.name === teacherName || teacherName.includes(emp.name) || emp.name.includes(teacherName)) return true;
            if (parts.length >= 2) return emp.name.includes(parts[0]) && emp.name.includes(parts[parts.length - 1]);
            return false;
          });
        };

        for (const incident of Object.values(incidents)) {
          if (!incident?.scheduleEntry?.teacher) continue;
          const sourceId = `class-${incident.id || `${incident.date}-${incident.scheduleEntry.session}-${incident.scheduleEntry.grade}-${incident.scheduleEntry.section}-${incident.incidentType}`}`;
          if (updatedReports.some(r => r.sourceId === sourceId)) continue;
          const employee = findEmployeeByTeacher(incident.scheduleEntry.teacher);
          if (!employee) continue;
          const isAbsence = incident.incidentType === 'absence';
          const report: Report = {
            employeeId: employee.id,
            date: incident.date,
            createdAt: today,
            type: isAbsence ? 'ظ…ط³ط§ط،ظ„ط©_ط­طµطµ' : 'طھط£ط®ط±_ط§ظ†طµط±ط§ظپ',
            notes: isAbsence
              ? `عدم حضور الحصة ${incident.scheduleEntry.session} - ${incident.scheduleEntry.grade}/${incident.scheduleEntry.section}`
              : `انصراف من الحصة ${incident.scheduleEntry.session} - المتبقي ${incident.remainingMinutes} دقيقة`,
            actionTaken: '',
            absenceSession: incident.scheduleEntry.session,
            earlyDepartureTime: isAbsence ? '' : new Date(incident.recordedAt).toLocaleTimeString('ar-SA'),
            minutesCount: incident.remainingMinutes,
            missedClasses: [incident.scheduleEntry],
            violationCategory: isAbsence ? 'class_absence_admin' : 'class_early_departure_admin',
            source: 'admin_class_incident',
            sourceId,
            excuseStatus: 'pending',
          };
          const id = await dbUtils.addReport(report);
          updatedReports.push({ ...report, id: Number(id) });
          classUpdated = true;
        }
        if (classUpdated) await refresh();
      } catch (classIncidentError) {
        console.error('Error syncing class incidents:', classIncidentError);
      }

      setAllReports(updatedReports);
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
      if (prev.includes(id)) return prev.filter(i => i !== id);
      return [...prev, id];
    });
    setEditingReport(null);
    setIsEditingEmployee(false);
    setTempEmployeeData(null);
    if (viewMode === 'statistics') setViewMode('employees'); 
  };

  const handleSelectAll = () => setSelectedIds(filteredEmployees.map(e => e.id));
  const handleDeselectAll = () => setSelectedIds([]);

  const selectedEmployees = useMemo(() => 
    employees.filter(emp => selectedIds.includes(emp.id)), 
  [employees, selectedIds]);

  useEffect(() => {
    const loadReports = async () => {
      if (selectedIds.length === 1) {
        setEmployeeReports(await getReports(selectedIds[0]));
      } else {
        setEmployeeReports([]);
      }
    };
    loadReports();
  }, [selectedIds, getReports]);

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempEmployeeData) {
      const formattedData = {
        ...tempEmployeeData,
        phone: formatPhoneNumber(tempEmployeeData.phone)
      };
      await dbUtils.updateEmployee(formattedData);
      setIsEditingEmployee(false);
      setTempEmployeeData(null);
      await refresh();
      alert('تم تحديث بيانات الموظف بنجاح');
    }
  };

  const handleAddManualEmployee = async (data: Omit<Employee, 'id'>) => {
    await addManualEmployee(data);
  };

  const handleStartEditing = (employee: Employee) => {
    setTempEmployeeData({ ...employee });
    setIsEditingEmployee(true);
    setSelectedIds([employee.id]);
    setViewMode('employees');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (window.confirm(`هل أنت متأكد من حذف الموظف "${employee.name}"؟`)) {
      await dbUtils.deleteEmployee(employee.id);
      setSelectedIds(prev => prev.filter(id => id !== employee.id));
      await refresh();
      await refreshAllReports();
    }
  };

  const handleSaveReportBatch = async (report: Report, employeeId: number) => {
    await saveReport({ ...report, employeeId, principalName, notes: report.notes });
    await refreshAllReports();
    if (selectedIds.includes(employeeId) && selectedIds.length === 1) {
      setEmployeeReports(await getReports(selectedIds[0]));
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    await removeReport(reportId);
    await refreshAllReports();
    if (selectedIds.length > 0) setEmployeeReports(await getReports(selectedIds[0]));
  };

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
    setSelectedIds([report.employeeId]);
    setViewMode('employees');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const lowerQuery = searchQuery.toLowerCase();
    return employees.filter(emp => 
      String(emp.name || '').toLowerCase().includes(lowerQuery) ||
      String(emp.civilId || '').toLowerCase().includes(lowerQuery) ||
      String(emp.workplace || '').toLowerCase().includes(lowerQuery) ||
      String(emp.employeeCode || '').toLowerCase().includes(lowerQuery)
    );
  }, [employees, searchQuery]);

  const urlParams = new URLSearchParams(window.location.search);
  const signId = urlParams.get('sign');
  const attendanceMode = urlParams.get('attendance');

  if (signId) {
    return <SignReport reportId={signId} />;
  }

  if (attendanceMode === 'morning') {
    return <MorningAttendance />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f6] overflow-x-hidden selection:bg-emerald-200 selection:text-emerald-900 font-sans text-slate-800">
      
      {/* Premium Header - Emerald Theme */}
      <header className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-[#022c22] text-white shadow-xl sticky top-0 z-40 border-b border-emerald-700/50 no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-6 relative">
          
          {/* Logo Section */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <div className="flex items-center gap-4 group">
              <div className="bg-white/10 p-3 rounded-2xl group-hover:bg-white/20 transition-all duration-300 backdrop-blur-md border border-white/10 shadow-inner">
                <Sparkles size={28} className="text-emerald-300 group-hover:animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-l from-white to-emerald-200 drop-shadow-sm">
                  إنجاز الذكي
                </h1>
                <p className="text-[10px] font-bold text-emerald-300 tracking-[0.15em] opacity-90 uppercase">منصة الانضباط المدرسي</p>
              </div>
            </div>
            {/* Mobile Menu Toggle */}
            <button className="lg:hidden p-2 text-emerald-200 hover:text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
          
          {/* Settings Section - Glassmorphism */}
          <div className={`flex-wrap items-center gap-3 bg-white/5 p-3 rounded-[1.5rem] border border-white/10 backdrop-blur-md shadow-lg lg:flex ${isMobileMenuOpen ? 'flex' : 'hidden'} w-full lg:w-auto transition-all`}>
            <div className="flex-1 flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5 focus-within:border-emerald-400/50 transition-all">
              <MapPin size={16} className="text-emerald-400" />
              <input type="text" value={educationDept} onChange={(e) => setEducationDept(e.target.value)} placeholder="إدارة التعليم..." className="bg-transparent border-none text-xs font-bold outline-none w-full placeholder:text-emerald-100/40 text-emerald-50" />
            </div>
            <div className="flex-1 flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5 focus-within:border-emerald-400/50 transition-all">
              <School size={16} className="text-emerald-400" />
              <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="اسم المدرسة..." className="bg-transparent border-none text-xs font-bold outline-none w-full placeholder:text-emerald-100/40 text-emerald-50" />
            </div>
            <div className="flex-1 flex items-center gap-2 bg-black/20 px-4 py-2 rounded-xl border border-white/5 focus-within:border-emerald-400/50 transition-all">
              <UserCog size={16} className="text-emerald-400" />
              <input type="text" value={principalName} onChange={(e) => setPrincipalName(e.target.value)} placeholder="اسم المدير..." className="bg-transparent border-none text-xs font-bold outline-none w-full placeholder:text-emerald-100/40 text-emerald-50" />
            </div>

            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
              <button onClick={() => setSchoolGender('boys')} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${schoolGender === 'boys' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-200 hover:text-white'}`}>بنين</button>
              <button onClick={() => setSchoolGender('girls')} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${schoolGender === 'girls' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-200 hover:text-white'}`}>بنات</button>
            </div>

            <button onClick={handleSaveSettings} title="حفظ الإعدادات" className={`p-2.5 rounded-xl transition-all shadow-md active:scale-90 flex items-center justify-center ${isSettingsSaved ? 'bg-teal-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30'}`}>
              {isSettingsSaved ? <CheckCircle size={20} /> : <Save size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full relative">
        <div className="animate-in fade-in slide-in-from-top-4 duration-700 mb-8">
          <FileUpload onDataLoaded={importEmployees} onReset={resetData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sleek Sidebar Navigation */}
          <aside className="lg:col-span-3 flex flex-col gap-6">
            <nav className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col gap-2 sticky top-32">
              <button onClick={() => setViewMode('employees')} className={`w-full flex items-center justify-start gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group ${viewMode === 'employees' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 translate-x-2' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <div className={`${viewMode === 'employees' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'} p-2 rounded-xl transition-colors`}>
                  <Users size={20} className={viewMode === 'employees' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'} />
                </div>
                الموظفون والتقارير
              </button>
              <button onClick={() => setViewMode('daily_log')} className={`w-full flex items-center justify-start gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group ${viewMode === 'daily_log' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 translate-x-2' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <div className={`${viewMode === 'daily_log' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'} p-2 rounded-xl transition-colors`}>
                  <ClipboardList size={20} className={viewMode === 'daily_log' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'} />
                </div>
                السجل العام والطباعة
              </button>
              <button onClick={() => setViewMode('schedule_questioning')} className={`w-full flex items-center justify-start gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group ${viewMode === 'schedule_questioning' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 translate-x-2' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <div className={`${viewMode === 'schedule_questioning' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'} p-2 rounded-xl transition-colors`}>
                  <Calendar size={20} className={viewMode === 'schedule_questioning' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'} />
                </div>
                الجدول والمساءلة
              </button>
              <button onClick={() => setViewMode('statistics')} className={`w-full flex items-center justify-start gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group ${viewMode === 'statistics' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 translate-x-2' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <div className={`${viewMode === 'statistics' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'} p-2 rounded-xl transition-colors`}>
                  <BarChart3 size={20} className={viewMode === 'statistics' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'} />
                </div>
                الإحصائيات والتحليل
              </button>
              <button onClick={() => setViewMode('discipline_tracking')} className={`w-full flex items-center justify-start gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group ${viewMode === 'discipline_tracking' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 translate-x-2' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <div className={`${viewMode === 'discipline_tracking' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'} p-2 rounded-xl transition-colors`}>
                  <Clock size={20} className={viewMode === 'discipline_tracking' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'} />
                </div>
                متابعة التأخر والانصراف
              </button>
              <button onClick={() => setViewMode('tracking')} className={`w-full flex items-center justify-start gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group ${viewMode === 'tracking' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 translate-x-2' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <div className={`${viewMode === 'tracking' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'} p-2 rounded-xl transition-colors`}>
                  <MessageCircle size={20} className={viewMode === 'tracking' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'} />
                </div>
                متابعة المساءلات
              </button>
              <button onClick={() => setViewMode('settings')} className={`w-full flex items-center justify-start gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-300 group ${viewMode === 'settings' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 translate-x-2' : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'}`}>
                <div className={`${viewMode === 'settings' ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-emerald-100'} p-2 rounded-xl transition-colors`}>
                  <Settings size={20} className={viewMode === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-emerald-600'} />
                </div>
                إعدادات النظام
              </button>
            </nav>

            {viewMode === 'employees' && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-[2rem] shadow-lg border border-emerald-100/50 flex flex-col items-center text-center group transition-all hover:shadow-xl">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center mb-4 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                  <UserPlus size={28} />
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-1">إضافة موظف يدوياً</h4>
                <p className="text-slate-500 text-xs mb-5 font-bold leading-relaxed">أضف موظفاً جديداً بدون الحاجة لملف إكسل.</p>
                <button onClick={() => setIsAddingEmployee(true)} className="w-full bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 px-4 py-3 rounded-xl font-black text-sm transition-all shadow-sm active:scale-95">
                  إضافة الآن
                </button>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-9">
            {viewMode === 'settings' ? (
              <SettingsView employees={employees} onClearEmployees={clearEmployeesOnly} onClearReports={clearReportsOnly} onScheduleCleared={async () => {}} />
            ) : viewMode === 'employees' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Search & List Card */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none"></div>
                   <div className="relative z-10 flex flex-col gap-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100/50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                               <Search size={22} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">قائمة الموظفين</h2>
                         </div>
                         <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                           <button onClick={handleSelectAll} className="px-3 py-1.5 rounded-lg text-xs font-black text-emerald-700 hover:bg-emerald-100 transition-colors">تحديد الكل</button>
                           <button onClick={handleDeselectAll} className="px-3 py-1.5 rounded-lg text-xs font-black text-slate-500 hover:bg-slate-200 transition-colors">إلغاء التحديد</button>
                         </div>
                      </div>
                      
                      <div className="relative group">
                         <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                         <input 
                           type="text" 
                           placeholder="ابحث بالاسم، السجل المدني..." 
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full pr-14 pl-6 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-bold text-slate-700"
                         />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredEmployees.length === 0 ? (
                          <div className="col-span-full py-16 text-center flex flex-col items-center gap-3">
                             <div className="bg-slate-50 p-4 rounded-full"><Users size={40} className="text-slate-300" /></div>
                             <p className="text-slate-400 font-bold">لم يتم العثور على أي موظف مطابق للبحث</p>
                          </div>
                        ) : filteredEmployees.map(emp => {
                          const isSelected = selectedIds.includes(emp.id);
                          return (
                            <div 
                              key={emp.id} 
                              onClick={() => toggleEmployeeSelection(emp.id)}
                              className={`group p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden flex items-start gap-4 ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200 translate-y-[-2px]' : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'}`}
                            >
                               {isSelected && <CheckCircle className="absolute top-4 left-4 text-white animate-in zoom-in-50" size={20} />}
                               <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
                                  <User size={24} />
                               </div>
                               <div className="flex-1 min-w-0 pt-1">
                                  <h5 className="font-black text-base truncate mb-1">{emp.name}</h5>
                                  <p className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                                     <Hash size={12} /> {emp.civilId}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                     <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${isSelected ? 'bg-emerald-500/50 text-white' : 'bg-slate-100 text-slate-600'}`}>{emp.workplace || 'معلم'}</span>
                                  </div>
                               </div>
                               
                               <div className="absolute bottom-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); handleStartEditing(emp); }} className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'hover:bg-white/20 text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-emerald-600'}`}><Edit3 size={14} /></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(emp); }} className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'hover:bg-rose-400/50 text-white' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}><Trash2 size={14} /></button>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>
                </div>

                {selectedIds.length > 0 && (
                  <div className="animate-in slide-in-from-bottom-8 duration-500">
                    <ReportForm selectedEmployees={selectedEmployees} onSave={handleSaveReportBatch} editingReport={editingReport} onCancelEdit={() => setEditingReport(null)} />
                  </div>
                )}

                {selectedIds.length === 1 && (
                  <div className="animate-in fade-in duration-700">
                    <HistoryList reports={employeeReports} selectedEmployee={selectedEmployees[0]} onDeleteReport={handleDeleteReport} onEditReport={handleEditReport} onUpdateReport={(report) => handleSaveReportBatch(report, report.employeeId)} />
                  </div>
                )}
              </div>
            ) : viewMode === 'schedule_questioning' ? (
              <ScheduleQuestioning employees={employees} onSaveReport={handleSaveReportBatch} />
            ) : viewMode === 'daily_log' ? (
              <DailyLog employees={employees} reports={allReports} onDeleteReport={handleDeleteReport} />
            ) : viewMode === 'discipline_tracking' ? (
              <DisciplineTrackingView employees={employees} reports={allReports} />
            ) : viewMode === 'tracking' ? (
              <SentReportsTracking employees={employees} />
            ) : (
              <StatisticsView reports={allReports} employees={employees} />
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/60 py-8 no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-600" />
            <span className="text-base font-black text-slate-800">إنجاز الذكي</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 px-5 py-2 rounded-full border border-slate-200 transition-all hover:border-emerald-200 hover:bg-emerald-50">
            <span className="text-xs font-black text-slate-600">تصميم وتطوير بواسطة ياسر الهذلي</span>
            <Heart size={14} className="text-rose-500 fill-rose-500" />
          </div>
          <p className="text-[10px] font-bold text-slate-400">الإصدار 4.0 - تصميم عصري</p>
        </div>
      </footer>

      {/* Modals */}
      {isAddingEmployee && <EmployeeManualForm onSave={handleAddManualEmployee} onClose={() => setIsAddingEmployee(false)} />}

      {isEditingEmployee && tempEmployeeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-emerald-700 p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl"><Edit3 size={24} /></div>
                <div><h3 className="text-xl font-black">تعديل بيانات الموظف</h3></div>
              </div>
              <button onClick={() => setIsEditingEmployee(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><XCircle size={28} /></button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-8 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600">اسم الموظف</label>
                    <input type="text" value={tempEmployeeData.name} onChange={(e) => setTempEmployeeData({...tempEmployeeData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 font-bold transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600">السجل المدني</label>
                    <input type="text" value={tempEmployeeData.civilId} onChange={(e) => setTempEmployeeData({...tempEmployeeData, civilId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 font-bold transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600">رقم الوظيفة</label>
                    <input type="text" value={tempEmployeeData.employeeCode} onChange={(e) => setTempEmployeeData({...tempEmployeeData, employeeCode: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 font-bold transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600">العمل الحالي</label>
                    <input type="text" value={tempEmployeeData.workplace} onChange={(e) => setTempEmployeeData({...tempEmployeeData, workplace: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 font-bold transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600">الجوال</label>
                    <input type="text" value={tempEmployeeData.phone || ''} onChange={(e) => setTempEmployeeData({...tempEmployeeData, phone: e.target.value})} placeholder="05XXXXXXXX" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 font-bold transition-all" />
                  </div>
               </div>
               <div className="flex gap-3 pt-4">
                 <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black text-base transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
                    <Save size={20} /> حفظ التغييرات
                 </button>
                 <button type="button" onClick={() => setIsEditingEmployee(false)} className="px-8 py-4 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-black transition-colors">إلغاء</button>
               </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default App;
