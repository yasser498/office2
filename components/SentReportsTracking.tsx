import React, { useState, useEffect } from 'react';
import { getAllSharedReports } from '../utils/firebase';
import { CheckCircle, Clock, Search, Printer, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
export const printSignedReport = (report: any, schoolName: string, principalName: string) => {
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
  if (doc) {
    doc.open();
    let causeText = report.type === 'تأخر_انصراف' ? `لوحظ تأخركم عن الحضور للمدرسة يوم ${report.date} لمدة (${report.lateArrivalTime}) دقيقة.` :
                    report.type === 'مساءلة_حصص' ? `لوحظ عدم تواجدكم في الحصص المقررة يوم ${report.date}.` :
                    `لوحظ غيابكم عن الدوام الرسمي يوم ${report.date}.`;

    const htmlContent = `
    <html dir="rtl" lang="ar">
    <head>
      <title>مساءلة موقعة - ${report.employeeName}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.8; }
        .header { display: flex; justify-content: space-between; margin-bottom: 50px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
        .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 40px; color: #0f172a; }
        .content { margin-bottom: 30px; font-size: 16px; }
        .content { margin-bottom: 30px; font-size: 16px; }
        .signature-row { display: flex; justify-content: space-between; align-items: center; margin: 10px 0; font-weight: 900; }
        .dynamic-data { font-weight: 900; border-bottom: 1px solid black; padding: 0 5px; }
        @media print { body { padding: 0; } }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <p>المملكة العربية السعودية</p>
          <p>وزارة التعليم</p>
          <p>مدرسة: ${schoolName}</p>
        </div>
        <div style="text-align: left;">
          <p>التاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
      </div>

      <div class="title">مساءلة رسمية (معتمدة إلكترونياً)</div>

      <div class="content">
        <p><strong>المكرم / ${report.employeeName} المحترم</strong></p>
        <p>السلام عليكم ورحمة الله وبركاته، وبعد:</p>
        <p>${causeText}</p>
        <p>نأمل إفادتنا عن أسباب ذلك.</p>
        <br/>
        <p style="text-align: left;"><strong>مدير المدرسة:</strong> ${principalName}</p>
      </div>

      <div style="border: 2px solid #000; padding: 15px; margin-top: 30px;">
        <div style="font-weight: 900; text-decoration: underline; margin-bottom: 10px;">إفادة الموظف/ة:</div>
        <div class="signature-row">
          <span>المكرم مدير المدرسة / <span class="dynamic-data">${principalName}</span></span>
          <span>وفقه الله</span>
        </div>
        <p style="font-weight: 900; margin: 5px 0;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد:</p>
        <p style="font-weight: 700; margin: 5px 0;">أفيدكم أن ${report.type === 'تأخر_انصراف' ? 'تأخري' : 'غيابي'} كان للأسباب التالية :</p>
        
        ${report.teacherExcuse ? 
           `<div style="margin: 10px 0; font-weight: 900; min-height: 40px; font-size: 16px; color: #000; line-height: 2; border-bottom: 1px dotted black; padding-bottom: 5px;">${report.teacherExcuse}</div>` : 
           `<div style="border-bottom: 1px dotted black; height: 30px; margin-bottom: 10px;"></div>
            <div style="border-bottom: 1px dotted black; height: 30px; margin-bottom: 10px;"></div>`
        }

        <p style="font-weight: 700; margin: 10px 0;">وسأقوم بتقديم ما يثبت ذلك خلال أسبوع من تاريخه.</p>
        
        <div class="signature-row" style="margin-top: 25px;">
          <span>الاسم: <span class="dynamic-data">${report.employeeName}</span></span>
          <span style="display: flex; align-items: center; gap: 10px;">
            التوقيع: 
            ${report.teacherSignature ? `<img src="${report.teacherSignature}" style="height: 60px; border-bottom: 1px solid #000;" />` : `..........................`}
          </span>
          <span>
             ${report.signedAt ? `التاريخ: <span class="dynamic-data" style="margin-right: 5px;">${report.signedAt.split('T')[0]} م</span>` : `التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ`}
          </span>
        </div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(() => { window.print(); }, 500);
        };
      </script>
    </body>
    </html>`;
    doc.write(htmlContent);
    doc.close();
  }
};


const SentReportsTracking: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    const data = await getAllSharedReports();
    // Sort descending by share date
    setReports(data.sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()));
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSendWhatsApp = (report: any) => {
    const link = `${window.location.origin}/?sign=${report.firebaseId}`;
    const text = `السلام عليكم أ. ${report.employeeName}،\nنأمل منكم الدخول على الرابط المرفق وتعبئة نموذج إفادة (مساءلة) خاصة بكم:\n\nالرابط: ${link}\n\nوشكراً لكم.`;

    const phoneParam = report.employeePhone ? `${report.employeePhone}?` : '?';
    window.open(`https://wa.me/${phoneParam}text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = (report: any) => {
    printSignedReport(report, "المدرسة", "مدير المدرسة");
  };

  const filteredReports = reports.filter(r => r.employeeName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in duration-500 min-h-[500px]">
      <div className="p-8 border-b border-slate-50 bg-slate-50/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-200">
              <MessageCircle size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">متابعة المساءلات المرسلة</h3>
              <p className="text-sm text-blue-600 font-bold mt-1">تتبع المساءلات المرسلة عبر الواتساب وردود المعلمين</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button onClick={fetchReports} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm active:scale-95">
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              تحديث البيانات
            </button>
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="بحث باسم الموظف..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-5 py-3 bg-white border border-slate-200 rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold">لا يوجد مساءلات مرسلة حالياً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map(report => (
              <div key={report.firebaseId} className="flex flex-col md:flex-row items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow gap-4">
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${report.status === 'signed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {report.status === 'signed' ? <CheckCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg">{report.employeeName}</h4>
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-500 mt-1">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">{report.type.replace('_', ' ')}</span>
                      <span>تاريخ الحالة: {report.date}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto flex items-center gap-3">
                  {report.status === 'signed' ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="flex flex-col text-left px-4">
                        <span className="text-xs font-black text-emerald-600">تم الرد والتوقيع</span>
                        <span className="text-[10px] text-slate-400 font-bold">{new Date(report.signedAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                      <button onClick={() => handlePrint(report)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-700 transition-colors shadow-md">
                        <Printer size={18} />
                        طباعة المساءلة
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-3 w-full">
                      <span className="text-xs font-black text-amber-600 px-4">بانتظار الرد...</span>
                      <button onClick={() => handleSendWhatsApp(report)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-[#1ebd5a] transition-colors shadow-md">
                        <MessageCircle size={18} />
                        إرسال واتساب
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SentReportsTracking;
