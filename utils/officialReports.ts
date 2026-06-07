import { Employee, Report } from '../types';
import * as dbUtils from './db';
import { getReportMinutes } from './discipline';

const MINISTRY_LOGO_URL = 'https://www.raed.net/img?id=1486401';

const printContent = (htmlContent: string) => {
  const oldFrame = document.getElementById('print-iframe');
  if (oldFrame) document.body.removeChild(oldFrame);
  const iframe = document.createElement('iframe');
  iframe.id = 'print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '100%';
  iframe.style.bottom = '100%';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(htmlContent.replace('</body>', `<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},300);}</script></body>`));
  doc.close();
};

const styles = `
  @page { size: A4; margin: 0.8cm 1cm; }
  body { font-family: 'Cairo', sans-serif; direction: rtl; color: #000; font-size: 9pt; }
  .page { padding: 8px; box-sizing: border-box; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; font-weight: 900; }
  .header div { flex: 1; line-height: 1.5; }
  .logo { text-align: center; }
  .logo img { width: 105px; }
  .left { text-align: left; }
  .title { text-align: center; margin: 12px 0 16px; }
  .title h1 { display: inline-block; border: 2px solid #000; padding: 7px 28px; font-size: 14pt; margin: 0; }
  .info { border: 1.5px solid #000; padding: 10px; display: flex; justify-content: space-between; gap: 10px; font-weight: 900; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { border: 1px solid #000; padding: 7px; text-align: center; font-weight: 700; }
  th { background: #336655; color: white; font-weight: 900; }
  .section-title { font-weight: 900; text-align: center; margin: 18px 0 8px; font-size: 11pt; }
  .signatures { display: flex; justify-content: space-between; margin-top: 42px; font-weight: 900; }
`;

const header = (schoolName: string, educationDept: string, sideTitle: string) => `
  <div class="header">
    <div>
      <div>المملكة العربية السعودية</div>
      <div>وزارة التعليم</div>
      <div>${educationDept}</div>
      <div>${schoolName}</div>
    </div>
    <div class="logo"><img src="${MINISTRY_LOGO_URL}" /></div>
    <div class="left">${sideTitle}<br/>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</div>
  </div>
`;

const reportTypeName = (type: string) => {
  switch (type) {
    case 'غياب': return 'مساءلة غياب';
    case 'تأخر_انصراف': return 'تأخر / انصراف';
    case 'مساءلة_حصص': return 'مساءلة حصص';
    case 'إذن_خروج': return 'إذن خروج';
    case 'خطاب_إنذار': return 'خطاب إنذار';
    case 'شكر_وتقدير': return 'شكر وتقدير';
    default: return type || 'غير محدد';
  }
};

const replyStatus = (report: Report) => {
  if (report.teacherSignature || report.teacherExcuse) return 'تم الرد والتوقيع';
  if (report.firebaseId) return 'مرسلة بانتظار الرد';
  return 'محفوظة محلياً';
};

export const generateOfficialStatisticsPDF = async (stats: any, schoolName: string, principalName: string) => {
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const counts = [
    ['مساءلات الغياب', stats.absenceCount || 0],
    ['التأخر والانصراف', stats.lateCount || 0],
    ['مساءلات الحصص', stats.classQuestioningCount || 0],
    ['مرسلة بانتظار الرد', stats.pendingRepliesCount || 0],
    ['تم الرد والتوقيع', stats.signedRepliesCount || 0],
    ['إجمالي السجلات', stats.totalReports || 0],
  ];
  const rows = counts.map(([label, count], i) => `<tr><td>${i + 1}</td><td style="text-align:right">${label}</td><td>${count}</td></tr>`).join('');
  const topRows = (stats.topEmployees || []).slice(0, 15).map((item: any, i: number) => `<tr><td>${i + 1}</td><td style="text-align:right">${item.employee?.name || '---'}</td><td>${item.employee?.workplace || '---'}</td><td>${item.count}</td></tr>`).join('');
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${styles}</style></head><body><div class="page">
    ${header(schoolName, educationDept, 'التقرير الإحصائي العام')}
    <div class="title"><h1>التقرير الإحصائي العام للانضباط</h1></div>
    <div class="info"><span>المدرسة: ${schoolName}</span><span>مدير المدرسة: ${principalName}</span><span>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</span></div>
    <table><thead><tr><th style="width:40px">م</th><th>نوع السجل</th><th>العدد</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="section-title">أكثر الموظفين تسجيلاً للحالات</div>
    <table><thead><tr><th style="width:40px">م</th><th>الموظف</th><th>العمل الحالي</th><th>عدد الحالات</th></tr></thead><tbody>${topRows || '<tr><td colspan="4">لا توجد بيانات</td></tr>'}</tbody></table>
    <div class="signatures"><span>مسؤول الانضباط: ...........................</span><span>مدير المدرسة: ${principalName}</span><span>الختم: ...........................</span></div>
  </div></body></html>`;
  printContent(html);
};

export const generateOfficialEmployeePDF = async (employee: Employee, reports: Report[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const rows = [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((report, i) => `<tr>
    <td>${i + 1}</td><td>${report.date}</td><td>${reportTypeName(report.type)}</td><td>${getReportMinutes(report) || '---'}</td><td>${replyStatus(report)}</td>
    <td style="font-size:8pt;text-align:right">${report.teacherExcuse || report.notes || '---'}</td><td>${report.signedAt ? report.signedAt.replace('T', ' ').slice(0, 16) : '---'}</td>
  </tr>`).join('');
  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${styles}</style></head><body><div class="page">
    ${header(schoolName, educationDept, 'سجل الانضباط الفردي')}
    <div class="title"><h1>سجل الانضباط الفردي</h1></div>
    <div class="info"><span>اسم الموظف: ${employee.name}</span><span>السجل المدني: ${employee.civilId || '---'}</span><span>رقم الوظيفة: ${employee.employeeCode || '---'}</span></div>
    <table><thead><tr><th style="width:35px">م</th><th>التاريخ</th><th>نوع المساءلة</th><th>الدقائق</th><th>حالة الرد</th><th>الرد / الملاحظات</th><th>وقت الرد</th></tr></thead><tbody>${rows || '<tr><td colspan="7">لا توجد سجلات انضباط لهذا الموظف</td></tr>'}</tbody></table>
    <div style="margin-top:18px;font-weight:900">إجمالي السجلات: ${reports.length}</div>
    <div class="signatures"><span>مسؤول الانضباط: ...........................</span><span>توقيع الموظف بالعلم: ...........................</span><span>مدير المدرسة: ${principalName}</span></div>
  </div></body></html>`;
  printContent(html);
};
