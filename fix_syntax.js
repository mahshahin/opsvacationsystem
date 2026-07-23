const fs = require('fs');
let code = fs.readFileSync('controllers/rosterController.js', 'utf8');

// I need to remove the previous declaration: const currentMembersCount = (dayData[shiftKey].members || []).length;
code = code.replace(
  'const currentMembersCount = (dayData[shiftKey].members || []).length;\n        const actualMembers =',
  'const actualMembers ='
);

fs.writeFileSync('controllers/rosterController.js', code);
console.log('fixed syntax error');
