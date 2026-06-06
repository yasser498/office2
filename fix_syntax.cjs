const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Azzam/Desktop/office';
const files = [
  'App.tsx',
  'components/ScheduleQuestioning.tsx',
  'components/ReportForm.tsx',
  'components/HistoryList.tsx',
  'components/DailyLog.tsx',
  'components/StatisticsView.tsx'
];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Remove backslashes before backticks and dollar signs
    content = content.replace(/\\`/g, '`');
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  }
});
