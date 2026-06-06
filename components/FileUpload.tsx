
import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Download, Trash2, FileSpreadsheet, Info } from 'lucide-react';
import { Employee } from '../types';
import * as dbUtils from '../utils/db';
import { downloadExcelTemplate } from '../utils/excelTemplate';

interface FileUploadProps {
  onDataLoaded: (data: Omit<Employee, 'id'>[]) => void;
  onReset: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onReset }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const mappedData: Omit<Employee, 'id'>[] = data.map((item) => ({
        name: item['اسم الموظف'] || item.Name || item['الاسم'] || 'اسم غير معروف',
        civilId: String(item['السجل المدني'] || item.CivilID || ''),
        specialization: item['التخصص'] || item.Specialization || '',
        level: item['المستوى / المرتبة'] || item['المستوى'] || item.Level || '',
        workplace: item['العمل الحالي'] || item.Workplace || '',
        phone: String(item['الجوال'] || item.Phone || ''),
        employeeCode: item['رقم الوظيفة'] || item['الكود'] || '',
        grade: item['الدرجة'] || '',
      }));

      onDataLoaded(mappedData);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const handleExportAll = async () => {
    try {
      const employees = await dbUtils.getAllEmployees();
      const reports = await dbUtils.getAllReports();
      const wb = XLSX.utils.book_new();
      
      const exportEmployees = employees.map(emp => ({
        'اسم الموظف': emp.name,
        'السجل المدني': emp.civilId,
        'التخصص': emp.specialization,
        'المستوى / المرتبة': emp.level,
        'العمل الحالي': emp.workplace,
        'الجوال': emp.phone,
        'رقم الوظيفة': emp.employeeCode,
        'الدرجة': emp.grade
      }));

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportEmployees), "الموظفون");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reports), "التقارير");
      XLSX.writeFile(wb, `بيانات_الموظفين_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      alert('فشل التصدير');
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-600" />
            إدارة قاعدة بيانات الموظفين
          </h3>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
            <Info size={14} className="text-amber-500" />
            الأعمدة المطلوبة: <b>اسم الموظف، السجل المدني</b>. يفضل وجود: <b>التخصص، رقم الوظيفة</b>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <button onClick={downloadExcelTemplate} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm transition-all">
            <Download size={18} />
            <span>تحميل القالب</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm shadow-md transition-all">
            <Upload size={18} />
            <span>استيراد</span>
          </button>
          <button onClick={handleExportAll} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm shadow-md transition-all">
            <Download size={18} />
            <span>تصدير الكل</span>
          </button>
          <button onClick={() => window.confirm('سيتم مسح جميع البيانات، هل أنت متأكد؟') && onReset()} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 px-4 py-2.5 rounded-xl text-sm hover:bg-rose-100 transition-all">
            <Trash2 size={18} />
            <span>مسح القاعدة</span>
          </button>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />
    </div>
  );
};

export default FileUpload;
