
import { Employee, Report } from '../types';
import * as dbUtils from './db';

const MINISTRY_LOGO_URL = 'https://www.raed.net/img?id=1486401';

const getArabicDayName = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', { weekday: 'long' }).format(date);
  } catch (e) {
    return '..........';
  }
};

const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

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
  if (doc) {
    doc.open();
    const isMobile = isMobileDevice();
    const scaleStyle = isMobile ? 'body { zoom: 75%; }' : '';
    const injectedHTML = htmlContent.replace('</head>', `
      <style>${scaleStyle}</style>
      </head>
    `).replace('</body>', `
      <script>
        window.onload = function() {
          const images = document.getElementsByTagName('img');
          let loadedCount = 0;
          if (images.length === 0) { startPrint(); } else {
            for (let img of images) {
              if (img.complete) { loadedCount++; if (loadedCount === images.length) startPrint(); } 
              else { img.onload = () => { loadedCount++; if (loadedCount === images.length) startPrint(); };
                     img.onerror = () => { loadedCount++; if (loadedCount === images.length) startPrint(); }; }
            }
          }
          function startPrint() { setTimeout(() => { window.focus(); window.print(); }, 300); }
        };
      </script>
    </body>`);
    doc.write(injectedHTML);
    doc.close();
  }
};

const getCommonStyles = () => `
  @page { size: A4; margin: 0.5cm 1cm 1cm 1cm; }
  body { 
    font-family: 'Cairo', sans-serif; 
    margin: 0; padding: 0; color: #000; 
    -webkit-print-color-adjust: exact; 
    font-size: 9pt; width: 100%;
    line-height: 1.3;
    direction: rtl;
  }
  .page-container { 
    width: 100%; 
    display: flex; flex-direction: column; 
    position: relative; box-sizing: border-box; 
    background: white;
    page-break-after: always;
    padding: 10px;
  }
  .page-container:last-child { page-break-after: auto; }
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; width: 100%; height: 95px; }
  .header-info { flex: 1; font-size: 9pt; font-weight: 700; line-height: 1.3; text-align: right; }
  .logo-container { flex: 1; text-align: center; }
  .logo-container img { max-width: 90px; height: auto; }
  .header-left { flex: 1; text-align: left; font-weight: 700; font-size: 9pt; }

  .title-section { text-align: center; margin-bottom: 12px; width: 100%; }
  .title-section h1 { 
    font-size: 13pt; margin: 0; font-weight: 900; 
    border: 2px solid black; display: inline-block; padding: 5px 25px;
    background: #f8f9fa;
  }
  .title-section p { font-size: 8pt; margin: 5px 0 0 0; font-weight: 700; }

  .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; border: 1.5px solid black; }
  .data-table th, .data-table td { border: 1px solid black; padding: 6px; text-align: center; }
  .data-table td { font-size: 9pt; font-weight: 700; }
  .data-table th { background: #336655; color: white; font-weight: 900; font-size: 10pt; }
  
  .civil-id-label { background: #336655; color: white; padding: 4px 10px; font-weight: 900; border: 1.5px solid black; border-left: none; }
  .civil-id-box { display: flex; direction: ltr; border: 1.5px solid black; padding: 2px; background: #eee; }
  .digit { width: 22px; height: 22px; border: 1px solid black; display: flex; align-items: center; justify-content: center; font-weight: 900; margin: 0 1px; background: white; font-size: 10pt; }

  .signature-row { display: flex; justify-content: space-between; margin: 10px 0; font-weight: 900; font-size: 10pt; align-items: center; }
  .divider { border-top: 1.5px solid #000; margin: 10px 0; }
  .section-label { font-weight: 900; color: #000; text-decoration: underline; margin-bottom: 5px; font-size: 11pt; }
  .dynamic-data { font-weight: 900; border-bottom: 1px solid black; padding: 0 5px; }
  
  .notes-box { border: 1px dashed #444; padding: 8px; margin: 8px 0; font-size: 8pt; background: #fffcf0; }
  
  .important-notes { border: 1.5px solid black; padding: 8px; margin-top: 8px; font-size: 8pt; }
  .important-notes-title { font-weight: 900; text-decoration: underline; margin-bottom: 3px; }
  .important-notes-list { margin: 0; padding-right: 18px; font-weight: 700; }

  .checkbox-list { display: flex; flex-direction: column; gap: 6px; font-weight: 900; margin: 8px 0; }
  .checkbox-item { display: flex; align-items: center; gap: 8px; }
  .checkbox-square { width: 14px; height: 14px; border: 1.5px solid black; display: inline-block; shrink: 0; }
  
  .small-text-7 { font-size: 7pt !important; }
`;

const gt = (gender: 'boys' | 'girls', masc: string, fem: string) => gender === 'boys' ? masc : fem;

/**
 * تقرير الغياب (تم الحفاظ عليه كما هو)
 */
const getAbsenceHTML = (employee: Employee, report: Report, schoolName: string, principalName: string, educationDept: string, gender: 'boys' | 'girls') => {
  const dayName = getArabicDayName(report.date);
  const endDayName = getArabicDayName(report.endDate || report.date);
  const civilId = String(employee.civilId || '').padStart(10, ' ').slice(-10);
  const civilIdHtml = civilId.split('').map(num => `<div class="digit">${num.trim() || '&nbsp;'}</div>`).join('');

  return `
    <div class="page-container">
        <div class="header">
          <div class="header-info">
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>${educationDept}</div>
            <div>${schoolName}</div>
          </div>
          <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
          <div class="header-left">التاريخ: ${report.date} م</div>
        </div>

        <div class="title-section">
          <h1>مساءلة غياب</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 01 - 04 )</p>
        </div>

        <div style="display: flex; align-items: center; margin-bottom: 10px;">
           <div class="civil-id-label">السجل المدني</div>
           <div class="civil-id-box">${civilIdHtml}</div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 32%;">الاسم</th>
              <th>التخصص</th>
              <th>المستوى</th>
              <th>رقم الوظيفة</th>
              <th>عدد الأيام</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${employee.name}</td>
              <td>${employee.specialization || '---'}</td>
              <td>${employee.level || '---'}</td>
              <td>${employee.employeeCode || '---'}</td>
              <td style="font-size: 11pt; font-weight: 900;">${report.daysCount || '1'}</td>
            </tr>
          </tbody>
        </table>

        <div style="background: #f2f2f2; border: 1.5px solid #000; padding: 10px; text-align: center; font-weight: 900; margin-bottom: 12px;">
          إنه في يوم (<span class="dynamic-data">${dayName}</span>) بتاريخ (<span class="dynamic-data">${report.date} م</span>) 
          ${gt(gender, 'تغيب', 'تغيبت')} عن العمل إلى يوم (<span class="dynamic-data">${endDayName}</span>) الموافق (<span class="dynamic-data">${report.endDate || report.date} م</span>)
        </div>

        <div style="border: 1px solid #000; padding: 12px; margin-bottom: 10px;">
          <div class="section-label small-text-7">(1) طلب الإفادة :</div>
          <div class="signature-row small-text-7">
            <span>${gt(gender, 'الأستاذ:', 'الأستاذة:')} <span class="dynamic-data">${employee.name}</span></span>
            <span>${gt(gender, 'وفقه الله', 'وفقها الله')}</span>
          </div>
          <p class="small-text-7" style="font-weight: 700;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد :</p>
          <p class="small-text-7" style="text-align: justify; font-weight: 700; line-height: 1.6;">
            من خلال متابعة سجل الدوام تبين غيابكم خلال الفترة الموضحة أعلاه ، نأمل الإفادة عن أسباب ذلك وتقديم ما يؤيد عذركم خلال أسبوع من تاريخه.
          </p>
          <div class="signature-row small-text-7" style="margin-top: 15px;">
            <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: .........................</span>
            <span>التاريخ: <span class="dynamic-data">${report.date} م</span></span>
          </div>
        </div>

        <div style="border: 1px solid #000; padding: 12px; margin-bottom: 10px;">
          <div class="section-label small-text-7">(2) إفادة الموظف/ة:</div>
          <div class="signature-row small-text-7">
            <span>${gt(gender, 'المكرم مدير المدرسة /', 'المكرمة مديرة المدرسة /')} <span class="dynamic-data">${principalName}</span></span>
            <span>${gt(gender, 'وفقه الله', 'وفقها الله')}</span>
          </div>
          <p class="small-text-7" style="font-weight: 900; margin: 5px 0;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد :</p>
          <p class="small-text-7" style="margin: 5px 0; font-weight: 700;">أفيدكم أن غيابي كان للأسباب التالية :</p>
          
          ${report.teacherExcuse ? 
             `<div style="position: relative; margin-bottom: 10px;">
                <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 8px;"></div>
                <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 0;"></div>
                <div style="position: absolute; top: 0; right: 0; width: 100%; height: 100%; font-weight: 900; font-size: 10pt; color: #000; line-height: 25px; padding-right: 5px; box-sizing: border-box; overflow: hidden;">${report.teacherExcuse}</div>
              </div>` : 
             `<div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 8px;"></div>
              <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 10px;"></div>`
          }

          <p class="small-text-7" style="font-weight: 700;">وسأقوم بتقديم ما يثبت ذلك خلال أسبوع من تاريخه.</p>
          
          <div class="signature-row small-text-7" style="margin-top: 15px; align-items: flex-end;">
            <span>الاسم: <span class="dynamic-data">${employee.name}</span></span>
            <span style="display: flex; align-items: flex-end; gap: 5px;">
              <span>التوقيع:</span>
              ${report.teacherSignature ? 
                `<span style="border-bottom: 1px solid #000; display: inline-block; padding: 0 20px;"><img src="${report.teacherSignature}" style="height: 40px; vertical-align: bottom; margin-bottom: 2px;" /></span>` : 
                `<span>..........................</span>`}
            </span>
            <span>
               ${report.signedAt ? `التاريخ: <span class="dynamic-data" style="margin-right: 5px;">${report.signedAt.split('T')[0]} م</span>` : `التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ`}
            </span>
          </div>
        </div>

        <div style="border: 2px solid #000; padding: 12px; background: #fafafa;">
          <div class="section-label small-text-7">(3) قرار ${gt(gender, 'مدير المدرسة :', 'مديرة المدرسة :')}</div>
          <div class="checkbox-list small-text-7">
            <div class="checkbox-item"><span class="checkbox-square"></span> تحتسب له إجازة مرضية بعد التأكد من نظامية التقرير.</div>
            <div class="checkbox-item"><span class="checkbox-square"></span> تحتسب له إجازة وفاة.</div>
            <div class="checkbox-item"><span class="checkbox-square"></span> تحتسب له إجازة مرافقة.</div>
            <div class="checkbox-item"><span class="checkbox-square"></span> يحتسب غيابه من رصيده للإجازات الاضطرارية لقبول عذره إذا كان رصيده يسمح وإلا يحسم عليه.</div>
            <div class="checkbox-item"><span class="checkbox-square"></span> يعتمد الحسم لعدم قبول عذره.</div>
          </div>
          <div class="signature-row small-text-7" style="margin-top: 15px;">
            <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:') } <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: .........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>

        <div class="important-notes">
          <div class="important-notes-title">ملاحظات هامة:</div>
          <ol class="important-notes-list">
            <li>يجب أن يوضح المتغيب أسباب غيابه فور تسلمه الاستمارة.</li>
            <li>يعطى المتغيب مدة أسبوع لتقديم ما يفيد عذره.</li>
            <li>تحفظ أصل المساءلة في ملف الموظف بالمدرسة والرفع بالحسم للإدارة في حال عدم قبول العذر.</li>
          </ol>
        </div>
    </div>`;
};

/**
 * تقرير التأخر والانصراف (تم الحفاظ عليه كما هو)
 */
const getLateArrivalHTML = (employee: Employee, report: Report, schoolName: string, principalName: string, educationDept: string, gender: 'boys' | 'girls') => {
  const actualDayName = (report.type === 'مساءلة_حصص' && report.missedClasses && report.missedClasses.length > 0)
    ? report.missedClasses[0].day
    : getArabicDayName(report.date);
  const civilId = String(employee.civilId || '').padStart(10, ' ').slice(-10);
  const civilIdHtml = civilId.split('').map(num => `<div class="digit">${num.trim() || '&nbsp;'}</div>`).join('');

  return `
    <div class="page-container">
        <div class="header">
          <div class="header-info">
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>${educationDept}</div>
            <div>${schoolName}</div>
          </div>
          <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
          <div class="header-left">التاريخ: ${report.date} م</div>
        </div>

        <div class="title-section">
          <h1>${report.type === 'مساءلة_حصص' ? 'نموذج مساءلة حصص' : 'نموذج تنبيه على تأخر / انصراف'}</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 20 - 02 )</p>
        </div>

        <div style="display: flex; align-items: center; margin-bottom: 10px;">
           <div class="civil-id-label">السجل المدني</div>
           <div class="civil-id-box">${civilIdHtml}</div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 35%;">الاسم</th>
              <th>التخصص</th>
              <th>رقم الوظيفة</th>
              <th>العمل الحالي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${employee.name}</td>
              <td>${employee.specialization || '---'}</td>
              <td>${employee.employeeCode || '---'}</td>
              <td>${employee.workplace || '---'}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 10px;">
          <div class="signature-row">
            <span>${gt(gender, 'المكرم الأستاذ:', 'المكرمة الأستاذة:')} <span class="dynamic-data">${employee.name}</span></span>
            <span>${gt(gender, 'وفقه الله', 'وفقها الله')}</span>
          </div>
          <p style="font-weight: 900; margin: 8px 0;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد:</p>
          <p style="font-weight: 700; line-height: 1.6; margin: 5px 0;">
            إنه في يوم: <span class="dynamic-data">${actualDayName}</span>، بتاريخ: <span class="dynamic-data">${report.date} م</span>، اتضح لنا ما يلي:
          </p>
          
          ${report.type === 'مساءلة_حصص' ? `
          <div style="margin-top: 5px;">
            <p style="font-weight: 900; margin-bottom: 4px; font-size: 8.5pt;">عدم تواجدكم أثناء العمل في الحصص التالية:</p>
            <table class="data-table" style="width: 100%; margin-bottom: 5px;">
              <thead>
                <tr>
                  <th style="padding: 2px;">اليوم</th>
                  <th style="padding: 2px;">الحصة</th>
                  <th style="padding: 2px;">المادة</th>
                  <th style="padding: 2px;">الصف</th>
                  <th style="padding: 2px;">الفصل</th>
                </tr>
              </thead>
              <tbody>
                ${(report.missedClasses || []).map(c => `<tr><td style="padding: 2px;">${c.day}</td><td style="padding: 2px;">${c.session}</td><td style="padding: 2px;">${c.subject}</td><td style="padding: 2px;">${c.grade}</td><td style="padding: 2px;">${c.section}</td></tr>`).join('')}
              </tbody>
            </table>
            <p style="font-weight: 900; color: #c00; margin-top: 2px; font-size: 8pt;">ملاحظة: سوف يتم احتسابها كإنصراف مبكر بمدة (45 دقيقة لكل حصة).</p>
          </div>
          ` : `
          <div style="margin-right: 20px; margin-top: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="width: 18px; height: 18px; border: 1.5px solid black; display: inline-block; text-align: center; line-height: 16px;">${report.lateArrivalTime ? '✓' : ''}</span>
              <span style="font-weight: 900;">${gt(gender, 'تأخركم', 'تأخركن')} من بداية الدوام وحضوركم الساعة ( <span class="dynamic-data">${report.lateArrivalTime || '.......'}</span> )</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="width: 18px; height: 18px; border: 1.5px solid black; display: inline-block; text-align: center; line-height: 16px;">${report.absenceSession ? '✓' : ''}</span>
              <span style="font-weight: 900;">عدم تواجدكم أثناء العمل في الحصة ( <span class="dynamic-data">${report.absenceSession || '.......'}</span> )</span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
              <span style="width: 18px; height: 18px; border: 1.5px solid black; display: inline-block; text-align: center; line-height: 16px;">${report.earlyDepartureTime ? '✓' : ''}</span>
              <span style="font-weight: 900;">انصرافكم مبكراً قبل نهاية الدوام من الساعة ( <span class="dynamic-data">${report.earlyDepartureTime || '.......'}</span> )</span>
            </div>
          </div>
          `}

          ${report.notes ? `<div class="notes-box" style="margin: 4px 0; padding: 4px;"><b>الأسباب / الملاحظات:</b> ${report.notes}</div>` : ''}

          <p style="margin-top: 5px; font-weight: 700;">نأمل توضيح أسباب ذلك مع إرفاق ما يؤيد عذركم ،،،،،، ولكم تحياتي</p>
          
          <div class="signature-row" style="margin-top: 10px;">
            <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: <span class="dynamic-data">${report.date} م</span></span>
          </div>
        </div>

        <div class="divider" style="margin: 5px 0;"></div>

        <div>
          <div class="section-label">إفادة الموظف/ة:</div>
          <div class="signature-row">
            <span>${gt(gender, 'المكرم مدير المدرسة /', 'المكرمة مديرة المدرسة /')} <span class="dynamic-data">${principalName}</span></span>
            <span>${gt(gender, 'وفقه الله', 'وفقها الله')}</span>
          </div>
          <p style="font-weight: 900; margin: 2px 0;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد:</p>
          <p style="font-weight: 700; margin: 2px 0;">أفيدكم أن تأخري كان للأسباب التالية :</p>
          
          ${report.teacherExcuse ? 
             `<div style="position: relative; margin-bottom: 10px;">
                <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 8px;"></div>
                <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 0;"></div>
                <div style="position: absolute; top: 0; right: 0; width: 100%; height: 100%; font-weight: 900; font-size: 10pt; color: #000; line-height: 25px; padding-right: 5px; box-sizing: border-box; overflow: hidden;">${report.teacherExcuse}</div>
              </div>` : 
             `<div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 8px;"></div>
              <div style="border-bottom: 1px dotted black; height: 25px; margin-bottom: 10px;"></div>`
          }

          <p style="font-weight: 700; margin: 2px 0;">وسأقوم بتقديم ما يثبت ذلك خلال أسبوع من تاريخه.</p>
          
          <div class="signature-row" style="margin-top: 15px; align-items: flex-end;">
            <span>الاسم: <span class="dynamic-data">${employee.name}</span></span>
            <span style="display: flex; align-items: flex-end; gap: 5px;">
              <span>التوقيع:</span>
              ${report.teacherSignature ? 
                `<span style="border-bottom: 1px solid #000; display: inline-block; padding: 0 20px;"><img src="${report.teacherSignature}" style="height: 40px; vertical-align: bottom; margin-bottom: 2px;" /></span>` : 
                `<span>..........................</span>`}
            </span>
            <span>
               ${report.signedAt ? `التاريخ: <span class="dynamic-data" style="margin-right: 5px;">${report.signedAt.split('T')[0]} م</span>` : `التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ`}
            </span>
          </div>
        </div>

        <div style="border: 2px solid black; padding: 6px 10px; margin-top: 5px; background: #fafafa;">
          <div class="section-label" style="text-decoration: underline; margin-bottom: 2px;">رأي ${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')}</div>
          <div class="checkbox-list" style="margin: 4px 0;">
            <div class="checkbox-item"><span class="checkbox-square"></span> ${gt(gender, 'عذره مقبول', 'عذرها مقبول')}</div>
            <div class="checkbox-item"><span class="checkbox-square"></span> ${report.type === 'مساءلة_حصص' ? gt(gender, 'عذره غير مقبول وتسجل في سجل التأخر والانصراف', 'عذرها غير مقبول وتسجل في سجل التأخر والانصراف') : gt(gender, 'عذره غير مقبول ويحسم عليه', 'عذرها غير مقبول ويحسم عليها')}</div>
          </div>
          <div class="signature-row">
            <span>${gt(gender, 'مدير المدرسة:', 'مديرة المدرسة:')} <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: ..........................</span>
            <span>التاريخ: &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; 144 هـ</span>
          </div>
        </div>
    </div>`;
};

// ==========================================
// الدوال الجديدة المحدثة (الإذن، الإنذار، الحصر، الشكر)
// ==========================================

export const generateExitPermit = async (employee: Employee, startTime?: string, endTime?: string, reason?: string) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const html = `
    <div class="page-container" style="padding: 20px; border: 2px solid #333;">
        <div class="header">
          <div class="header-info">
            <div>المملكة العربية السعودية</div>
            <div>وزارة التعليم</div>
            <div>${educationDept}</div>
            <div>${schoolName}</div>
          </div>
          <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
          <div class="header-left">التاريخ: ${currentDate} هـ</div>
        </div>
        <div class="title-section">
          <h1 style="background: #eee; border: 2px solid #000;">بطاقة خروج موظف (ظرف طارئ)</h1>
          <p>رمز النموذج : ( و . م . ع . ن - 20 - 01 )</p>
        </div>
        
        <div style="border: 1.5px solid black; padding: 15px; background: white;">
          <div style="margin-bottom: 15px; font-weight: 900; font-size: 11pt;">
            ${gt(gender, 'سعادة مدير المدرسة /', 'سعادة مديرة المدرسة /')} <span class="dynamic-data">${principalName}</span> المحترم/ة
          </div>
          <p style="font-weight: 700; line-height: 2.2; font-size: 11pt;">
            أرجو التكرم بالموافقة لي بالخروج من المدرسة لظرف طارئ في يوم <span class="dynamic-data">${getArabicDayName(new Date().toISOString())}</span> 
            من الساعة ( <span class="dynamic-data" style="color: blue;">${startTime || '........'}</span> ) إلى الساعة ( <span class="dynamic-data" style="color: blue;">${endTime || '........'}</span> ).
          </p>
          <div style="margin: 15px 0; font-weight: 700; border-bottom: 1px dotted #000; padding-bottom: 5px;">
            السبب: <span class="dynamic-data">${reason || '..........................................................'}</span>
          </div>
          
          <div class="signature-row" style="margin-top: 30px;">
            <span>الاسم: <span class="dynamic-data">${employee.name}</span></span>
            <span>التوقيع: ...........................</span>
          </div>
        </div>

        <div style="border: 1.5px solid black; border-top: none; padding: 15px; background: #fcfcfc;">
          <div class="section-label" style="font-size: 10pt;">مرئيات الإدارة:</div>
          <div style="margin: 15px 0; font-weight: 900; display: flex; gap: 30px;">
            <div>( &nbsp;&nbsp; ) يوافق له/ا</div>
            <div>( &nbsp;&nbsp; ) لا يوافق له/ا</div>
          </div>
          <div class="signature-row" style="margin-top: 10px;">
            <span>${gt(gender, 'مدير المدرسة', 'مديرة المدرسة')}: <span class="dynamic-data">${principalName}</span></span>
            <span>التوقيع: ...........................</span>
          </div>
        </div>

        <div style="margin-top: 20px; font-size: 8pt; text-align: center; border: 1px dashed #999; padding: 5px;">
           ملاحظة: تحفظ هذه البطاقة في ملف الموظف بالمدرسة للرجوع إليها عند الحاجة.
        </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateWarningLetter = async (employee: Employee, warningLevel: string, letterNo?: string) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const currentDate = new Date().toLocaleDateString('ar-SA');
  
  const content = {
    'الأول': 'نحيطكم علماً بضرورة الالتزام بمواعيد الدوام الرسمي، حيث لوحظ تكرار تأخركم/غيابكم مؤخراً، ونأمل أن يكون هذا آخر تنبيه بهذا الخصوص.',
    'الثاني': 'نظراً لعدم استجابتكم للتنبيه السابق، فإننا نوجه لكم هذا الإنذار الثاني، ونحيطكم علماً بأن تكرار ذلك سيؤدي لاتخاذ إجراءات نظامية صارمة.',
    'النهائي': 'بناءً على تكرار المخالفة وعدم المبالاة بالإنذارات السابقة، نوجه لكم هذا الإنذار النهائي تمهيداً للرفع لجهة الاختصاص لاتخاذ اللازم حسب الأنظمة.'
  }[warningLevel] || 'نأمل الالتزام بالأنظمة والتعليمات المنظمة للعمل.';

  const html = `
    <div class="page-container" style="padding: 40px; border: 1px solid #eee;">
      <div class="header">
        <div class="header-info">
          <div>المملكة العربية السعودية</div>
          <div>وزارة التعليم</div>
          <div>${educationDept}</div>
          <div>${schoolName}</div>
        </div>
        <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
        <div class="header-left">
          الرقم: ${letterNo || '---'}<br>
          التاريخ: ${currentDate} م<br>
          المرفقات: لا يوجد
        </div>
      </div>
      
      <div class="title-section" style="margin-top: 30px;">
        <h1 style="color: #c00; border-color: #c00;">خطاب إنذار (${warningLevel})</h1>
      </div>
      
      <div style="margin-top: 40px; font-size: 12pt;">
        <p style="font-weight: 900;">${gt(gender, 'المكرم الأستاذ:', 'المكرمة الأستاذة:')} ${employee.name} <span style="float: left;">${gt(gender, 'المحترم', 'المحترمة')}</span></p>
        <p style="font-weight: 900; margin-top: 20px;">السلام عليكم ورحمة الله وبركاته &nbsp;&nbsp;&nbsp;&nbsp; وبعد :</p>
        
        <p style="text-align: justify; line-height: 2; margin-top: 20px; font-weight: 700;">
           ${content}
        </p>
        
        <p style="margin-top: 30px; font-weight: 700;">نأمل منكم التقيد بالتعليمات والأنظمة المتبعة، متمنين لكم التوفيق والسداد.</p>
        
        <p style="text-align: center; margin-top: 40px; font-weight: 900;">وتقبلوا وافر تحياتي ،،،</p>
        
        <div class="signature-row" style="margin-top: 60px;">
          <div style="text-align: center; flex: 1;">
            <div style="font-weight: 900;">${gt(gender, 'مدير المدرسة', 'مديرة المدرسة')}</div>
            <div style="margin-top: 10px; font-weight: 900;">${principalName}</div>
            <div style="margin-top: 15px;">التوقيع: ..........................</div>
          </div>
        </div>
      </div>
      
      <div style="margin-top: auto; border-top: 1px solid #ccc; padding-top: 10px; font-size: 8pt; color: #666;">
        صورة لملف الموظف
      </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateLateCumulativeLog = async (employee: Employee, reports: Report[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  
  const lateReports = reports.filter(r => r.type === 'تأخر_انصراف');
  const rows = lateReports.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.date}</td>
      <td>${getArabicDayName(r.date)}</td>
      <td>${r.lateArrivalTime || '---'}</td>
      <td>${r.earlyDepartureTime || '---'}</td>
      <td style="font-size: 8pt;">${r.notes || ''}</td>
    </tr>
  `).join('');

  const html = `
    <div class="page-container">
      <div class="header">
        <div class="header-info"><div>وزارة التعليم</div><div>${educationDept}</div><div>${schoolName}</div></div>
        <div class="logo-container"><img src="${MINISTRY_LOGO_URL}"></div>
        <div class="header-left">سجل حصر تراكمي</div>
      </div>
      
      <div class="title-section">
        <h1>بيان حصر حالات التأخر والانصراف المبكر</h1>
      </div>
      
      <div style="margin-bottom: 15px; border: 1px solid #000; padding: 10px; background: #f9f9f9; display: flex; justify-content: space-between;">
        <span>اسم الموظف: <b>${employee.name}</b></span>
        <span>رقم الوظيفة: <b>${employee.employeeCode || '---'}</b></span>
        <span>السجل المدني: <b>${employee.civilId}</b></span>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 30px;">م</th>
            <th>التاريخ</th>
            <th>اليوم</th>
            <th>وقت الحضور</th>
            <th>وقت الانصراف</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6">لا توجد حالات مسجلة</td></tr>'}
        </tbody>
      </table>
      
      <div style="margin-top: 20px; font-weight: 700; text-align: left;">
        <p>إجمالي عدد الحالات: ${lateReports.length}</p>
      </div>

      <div class="signature-row" style="margin-top: 40px;">
        <span>مسؤول الدوام: ...........................</span>
        <span>توقيع الموظف بالعلم: ...........................</span>
        <span>مدير المدرسة: ${principalName}</span>
      </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateAppreciationCertificate = async (employee: Employee) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const currentDate = new Date().toLocaleDateString('ar-SA');

  const html = `
    <div class="page-container" style="border: 15px double #336655; padding: 40px; height: 100%; text-align: center; background: #fffdf5;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
        <div style="text-align: right; font-weight: 900; font-size: 10pt;">المملكة العربية السعودية<br>وزارة التعليم<br>${educationDept}<br>${schoolName}</div>
        <img src="${MINISTRY_LOGO_URL}" style="width: 100px;">
        <div style="text-align: left; font-weight: 900; font-size: 10pt;">التاريخ: ${currentDate}<br>الموضوع: شهادة شكر</div>
      </div>

      <h1 style="font-family: 'Cairo', sans-serif; font-size: 36pt; color: #336655; margin: 40px 0; font-weight: 900; border: none; background: transparent;">شهادة شكر وتقدير</h1>
      
      <p style="font-size: 18pt; margin: 20px 0; font-weight: 700;">تتقدم إدارة المدرسة بوافر الشكر والتقدير</p>
      
      <p style="font-size: 24pt; color: #c00; font-weight: 900; margin: 20px 0;">${gt(gender, 'للأستاذ /', 'للأستاذة /')} ${employee.name}</p>
      
      <p style="font-size: 16pt; line-height: 2; font-weight: 700; max-width: 80%; margin: 20px auto;">
        نظراً لجهودكم المتميزة وانضباطكم المشهود في العمل خلال الفترة الماضية، مما كان له أطيب الأثر في سير العملية التعليمية.
      </p>
      
      <p style="font-size: 16pt; margin: 40px 0; font-weight: 700;">سائلين المولى عز وجل لكم مزيداً من التوفيق والنجاح ،،،</p>

      <div style="margin-top: 60px; display: flex; justify-content: center;">
         <div style="text-align: center;">
            <p style="font-size: 14pt; font-weight: 900;">مدير المدرسة</p>
            <p style="font-size: 16pt; font-weight: 900; color: #336655;">${principalName}</p>
         </div>
      </div>
    </div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

// ==========================================
// الدوال المساعدة للطباعة الجماعية والمساءلات (تظل كما هي)
// ==========================================

export const generateBatchForms = async (batch: { employee: Employee, report: Report }[]) => {
  const schoolName = await dbUtils.getSetting('schoolName') || '..........';
  const educationDept = await dbUtils.getSetting('educationDept') || '..........';
  const principalName = await dbUtils.getSetting('principalName') || '..........';
  const gender = await dbUtils.getSetting('schoolGender') || 'boys';
  const formsHTML = batch.map((item) => {
    return (item.report.type === 'تأخر_انصراف' || item.report.type === 'مساءلة_حصص')
      ? getLateArrivalHTML(item.employee, item.report, schoolName, principalName, educationDept, gender)
      : getAbsenceHTML(item.employee, item.report, schoolName, principalName, educationDept, gender);
  }).join('');
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${formsHTML}</body></html>`);
};

export const generateLateArrivalDepartureForm = async (employee: Employee, report: Report) => {
    const principalName = await dbUtils.getSetting('principalName') || '..........';
    const schoolName = await dbUtils.getSetting('schoolName') || '..........';
    const educationDept = await dbUtils.getSetting('educationDept') || '..........';
    const gender = await dbUtils.getSetting('schoolGender') || 'boys';
    const html = getLateArrivalHTML(employee, report, schoolName, principalName, educationDept, gender);
    printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateOfficialAbsenceForm = async (employee: Employee, report: Report) => {
    const principalName = await dbUtils.getSetting('principalName') || '..........';
    const schoolName = await dbUtils.getSetting('schoolName') || '..........';
    const educationDept = await dbUtils.getSetting('educationDept') || '..........';
    const gender = await dbUtils.getSetting('schoolGender') || 'boys';
    const html = getAbsenceHTML(employee, report, schoolName, principalName, educationDept, gender);
    printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateAcknowledgmentLog = async (employees: Employee[]) => {
  const rows = employees.map((emp, idx) => `<tr><td>${idx+1}</td><td style="text-align:right;">${emp.name}</td><td>${emp.employeeCode || '---'}</td><td></td></tr>`).join('');
  const html = `<div class="page-container"><h1>بيان التوقيع بالعلم على الأنظمة والتعليمات</h1><p style="text-align:right; font-weight:700;">أقر أنا الموظف الموضح اسمي أدناه بأني اطلعت على الأنظمة والتعليمات المنظمة للدوام الرسمي وأتحمل مسؤولية التقيد بها:</p><table class="data-table"><thead><tr><th style="width:40px;">م</th><th>الاسم</th><th>رقم الوظيفة</th><th>التوقيع</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateStatisticsPDF = async (stats: any, schoolName: string, principalName: string) => {
  const html = `<div class="page-container"><h1>التقرير الإحصائي العام للانضباط</h1><p>المدرسة: ${schoolName}</p><p>إجمالي السجلات: ${stats.totalReports}</p><p>حالات الغياب: ${stats.absenceCount}</p><p>حالات التأخر: ${stats.lateCount}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};

export const generateEmployeePDF = async (employee: Employee, reports: Report[]) => {
  const html = `<div class="page-container"><h1>سجل الانضباط للموظف: ${employee.name}</h1><p>عدد السجلات الإجمالي: ${reports.length}</p></div>`;
  printContent(`<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><style>${getCommonStyles()}</style></head><body>${html}</body></html>`);
};
