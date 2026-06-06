
export type ReportType = 'غياب' | 'تأخر_انصراف' | 'إذن_خروج' | 'خطاب_إنذار' | 'شكر_وتقدير' | 'مساءلة_حصص';

export interface Employee {
  id: number;
  name: string;
  civilId?: string;      // السجل المدني
  specialization?: string; // التخصص
  level?: string;        // المستوى / المرتبة
  workplace?: string;    // العمل الحالي
  phone?: string;        // الجوال
  department?: string;
  position?: string;
  employeeCode?: string;
  grade?: string;
}

export interface Report {
  id?: number;
  employeeId: number;
  date: string;          // تاريخ البداية (تاريخ الحالة)
  endDate?: string;      // تاريخ النهاية (للغياب)
  createdAt?: string;    // تاريخ الإدخال الفعلي للنظام
  daysCount?: number;    // عدد أيام الغياب
  type: ReportType;
  notes: string;
  actionTaken: string;
  principalName?: string; // مدير المدرسة
  
  // حقول خاصة بتنبيه التأخر والانصراف
  lateArrivalTime?: string;
  absenceSession?: string;
  earlyDepartureTime?: string;

  // حقول خاصة بالتقارير الإدارية
  warningLevel?: string;
  letterNo?: string;

  // حقول جديدة
  excuseStatus?: 'pending' | 'accepted' | 'rejected';
  missedClasses?: ScheduleEntry[];
}

export interface ScheduleEntry {
  id?: number;     // المعرف
  day: string;     // اليوم
  session: string; // الحصة
  grade: string;   // الصف
  section: string; // الفصل
  subject: string; // المادة
  teacher: string; // المعلم
}

export interface DBConfig {
  dbName: string;
  version: number;
  stores: {
    employees: string;
    reports: string;
  };
}