
import * as XLSX from 'xlsx';

export const downloadExcelTemplate = () => {
  const headers = [
    {
      'اسم الموظف': 'مثال: محمد علي',
      'السجل المدني': '1023456789',
      'التخصص': 'لغة عربية',
      'المستوى / المرتبة': 'الخامس',
      'الدرجة': '3',
      'رقم الوظيفة': '789456',
      'العمل الحالي': 'معلم',
      'الجوال': '0500000000'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(headers);
  XLSX.utils.book_append_sheet(wb, ws, "قالب الموظفين");
  
  // ضبط عرض الأعمدة
  ws['!cols'] = [
    { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
    { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
  ];

  XLSX.writeFile(wb, "نموذج_بيانات_الموظفين.xlsx");
};
