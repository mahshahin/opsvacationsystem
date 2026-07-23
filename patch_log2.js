const fs = require('fs');
let code = fs.readFileSync('controllers/rosterController.js', 'utf8');
code = code.replace(/rosterDetails\[day\] = \{/, "if (day === 4) console.log('DAY 4 NOTES:', leaveNotes); rosterDetails[day] = {");
fs.writeFileSync('controllers/rosterController.js', code);
