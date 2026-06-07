import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { getSharedReport, submitTeacherResponse } from '../utils/firebase';
import { PenTool, Send, AlertCircle, CheckCircle, Clock, ShieldCheck, FileCheck2 } from 'lucide-react';

interface SignReportProps {
  reportId: string;
}

const SignReport: React.FC<SignReportProps> = ({ reportId }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [excuse, setExcuse] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string>('');
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getSharedReport(reportId);
        if (data) {
          setReport(data);
          if (data.status === 'signed') {
            setSubmitted(true);
            setSubmittedAt(data.signedAt || '');
          }
        } else {
          setError('لم يتم العثور على المساءلة. تأكد من صحة الرابط.');
        }
      } catch (err) {
        setError('حدث خطأ أثناء الاتصال بالخادم.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [reportId]);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSubmit = async () => {
    setValidationError('');
    if (!excuse.trim()) {
      setValidationError('الرجاء كتابة العذر أو الرد في المربع أعلاه قبل الاعتماد.');
      return;
    }
    if (sigCanvas.current?.isEmpty()) {
      setValidationError('الرجاء رسم توقيعك في المربع المخصص قبل الاعتماد.');
      return;
    }

    setLoading(true);
    try {
      const signatureDataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
      if (signatureDataUrl) {
        await submitTeacherResponse(reportId, excuse, signatureDataUrl);
        const now = new Date().toISOString();
        setSubmittedAt(now);
        setReport((prev: any) => ({ ...prev, status: 'signed', signedAt: now }));
        setSubmitted(true);
      }
    } catch (err) {
      alert('فشل إرسال الرد. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-md w-full border border-rose-100">
          <AlertCircle size={48} className="mx-auto text-rose-500 mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">عفواً</h2>
          <p className="text-slate-600 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted || (report && report.status === 'signed')) {
    const replyDate = new Date(submittedAt || report?.signedAt || new Date().toISOString());
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 p-4" dir="rtl">
        <div className="bg-white/95 p-10 rounded-[2.5rem] shadow-2xl text-center max-w-lg w-full border border-emerald-100 animate-in zoom-in-95 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-2 bg-emerald-500"></div>
          <div className="w-24 h-24 mx-auto rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
            <ShieldCheck size={58} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">تم اعتماد الرد والتوقيع بنجاح</h2>
          <p className="text-slate-500 font-bold mb-6">شكراً لتعاونك، تم إرسال إفادتك لإدارة المدرسة بنجاح وتم تضمينها في نموذج المساءلة الرسمي.</p>
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm font-bold text-slate-700 text-right space-y-3">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">نوع المساءلة:</span>
              <span className="text-emerald-700 font-black">{report.type === 'غياب' ? 'غياب' : report.type === 'تأخر_انصراف' ? 'تأخر / انصراف' : 'مساءلة حصص'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">تاريخ الحالة:</span>
              <span className="text-emerald-700 font-black">{report.date}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 flex items-center gap-1"><Clock size={16}/> وقت الرد والاعتماد:</span>
              <span className="text-emerald-600 font-black" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {replyDate.toLocaleTimeString('ar-SA')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500 flex items-center gap-1"><FileCheck2 size={16}/> تاريخ اعتماد الرد:</span>
              <span className="text-emerald-600 font-black">{replyDate.toLocaleDateString('ar-SA')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 font-sans text-slate-800" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-emerald-800 p-6 rounded-[2rem] shadow-lg text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
              <AlertCircle size={32} className="text-emerald-100" />
            </div>
            <div>
              <h1 className="text-xl font-black">نموذج مساءلة رسمية</h1>
              <p className="text-emerald-200 text-sm font-bold mt-1">مدرسة: {report.schoolName}</p>
            </div>
          </div>
        </div>

        {/* Report Details */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-4">التفاصيل:</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-bold">اسم الموظف:</span>
              <span className="font-black text-slate-800">{report.employeeName}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-bold">التاريخ:</span>
              <span className="font-black text-slate-800">{report.date}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-bold">نوع الحالة:</span>
              <span className={`px-3 py-1 rounded-lg text-xs font-black ${report.type === 'غياب' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                {report.type.replace('_', ' ')}
              </span>
            </div>
            
            {report.type === 'مساءلة_حصص' && report.missedClasses && (
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                <p className="text-rose-700 font-bold text-sm mb-2">الحصص المفقودة:</p>
                <div className="flex flex-wrap gap-2">
                  {report.missedClasses.map((c: any, idx: number) => (
                    <span key={idx} className="bg-white px-3 py-1.5 rounded-lg text-xs font-black text-rose-600 shadow-sm border border-rose-100">
                      الحصة {c.session} ({c.grade}/{c.section})
                    </span>
                  ))}
                </div>
              </div>
            )}
            {report.lateArrivalTime && (
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <span className="text-slate-500 font-bold">وقت التأخر:</span>
                 <span className="font-black text-rose-600">{report.lateArrivalTime} دقيقة</span>
              </div>
            )}
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 space-y-6">
          <div className="space-y-3">
            <label className="text-slate-700 font-black flex items-center gap-2">
              <PenTool size={18} className="text-emerald-600" />
              أسباب التأخر / الغياب الموضحة أعلاه:
            </label>
            <textarea 
              value={excuse}
              onChange={(e) => setExcuse(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 transition-all resize-none h-32"
              placeholder="اكتب ردك أو أسبابك هنا بوضوح..."
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-slate-700 font-black flex items-center gap-2">
                <PenTool size={18} className="text-emerald-600" />
                توقيع الموظف (ارسم توقيعك في المربع):
              </label>
              <button onClick={clearSignature} className="text-xs text-rose-500 font-bold hover:bg-rose-50 px-3 py-1 rounded-lg transition-colors">
                مسح التوقيع
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden relative">
               <SignatureCanvas 
                 ref={sigCanvas} 
                 penColor="black"
                 canvasProps={{ className: "w-full h-40 cursor-crosshair touch-none" }} 
               />
               <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                 <span className="text-4xl font-black rotate-[-20deg]">التوقيع هنا</span>
               </div>
            </div>
          </div>
        </div>

        {validationError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-2xl flex items-center gap-3 font-black animate-in slide-in-from-top-4">
            <AlertCircle size={24} />
            {validationError}
          </div>
        )}

        {/* Action Buttons */}
        <button 
          onClick={handleSubmit}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-95"
        >
          <Send size={22} />
          اعتماد الرد وإرسال
        </button>

      </div>
    </div>
  );
};

export default SignReport;
