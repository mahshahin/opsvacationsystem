const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Admin/RosterManagement.jsx', 'utf8');

code = code.replace(/className=\{.w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-2[\s\S]*?rows="2"/m, (match) => {
    return "className={w-full h-full resize-none rounded-md border border-slate-200 bg-slate-50 px-2 \nfont-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 no-print }\n";
});

// Also make sure the td has h-full logic if we need the height to stretch
code = code.replace(/className=\{.border-2 border-black \$\{isRosterFullscreen \? "p-1" : "p-1\.5"\}.\}/, 'className={order-2 border-black h-1 }');

fs.writeFileSync('frontend/src/pages/Admin/RosterManagement.jsx', code);
