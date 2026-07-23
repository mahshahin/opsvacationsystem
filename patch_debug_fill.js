const fs = require('fs');
let code = fs.readFileSync('controllers/rosterController.js', 'utf8');

code = code.replace(
  'const missingCount = membersPerShift - currentMembersCount;',
  'const actualMembers = (dayData[shiftKey].members || []).filter(Boolean);\n        const currentMembersCount = actualMembers.length;\n        const missingCount = membersPerShift - currentMembersCount;\n        if (missingCount > 0) console.log(Day \ \ missing \ members);'
);

code = code.replace(
  'dayData[shiftKey].members.push(chosenOne);',
  'dayData[shiftKey].members = actualMembers; dayData[shiftKey].members.push(chosenOne); console.log(Day \ \ assigned \);'
);

fs.writeFileSync('controllers/rosterController.js', code);
console.log('patched fill empty logic with logs and null fixes');
