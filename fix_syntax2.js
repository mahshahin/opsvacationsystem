const fs = require('fs');
let code = fs.readFileSync('controllers/rosterController.js', 'utf8');

code = code.replace(/const actualMembers =[\s\S]*?console.log\(Day   missing  members\);/m, 'const actualMembers = (dayData[shiftKey].members || []).filter(Boolean);\n        const missingCount = membersPerShift - actualMembers.length;');

code = code.replace(/dayData\[shiftKey\]\.members = actualMembers; dayData\[shiftKey\]\.members\.push\(chosenOne\); console\.log\(Day   assigned \);/, 'dayData[shiftKey].members = actualMembers; dayData[shiftKey].members.push(chosenOne);');

fs.writeFileSync('controllers/rosterController.js', code);
console.log('fixed syntax error again');
