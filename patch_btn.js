const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Admin/RosterManagement.jsx', 'utf8');

// Find the line containing handleBackendAutoGenerate, then the button text is a few lines down.
// Since the file is UTF8, we can just replace 'إعادة توزيع كاملة' with 'التوزيع التلقائي للجدول'
// OR if it was encoded weirdly, we can do a regex.
code = code.replace(/إعادة توزيع كاملة/g, 'التوزيع التلقائي للجدول');

// Wait, let's also try to find the Arabic literal just in case.
const matches = [...code.matchAll(/handleBackendAutoGenerate[\s\S]*?className=[\s\S]*?>\s*(.*?)\s*<\/button>/g)];
if (matches.length > 0) {
  const oldText = matches[0][1];
  code = code.replace(oldText, 'التوزيع التلقائي للجدول');
}

fs.writeFileSync('frontend/src/pages/Admin/RosterManagement.jsx', code);
console.log('Button text updated!');
