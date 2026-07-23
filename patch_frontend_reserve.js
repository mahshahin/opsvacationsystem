const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/Admin/RosterManagement.jsx', 'utf8');

code = code.replace(
  'workGroups,\n            config: { membersPerShift: 1, leaderRequired: true, ignorePendingLeaves: false }',
  'workGroups,\n            reserveEmployeeIds,\n            config: { membersPerShift: 1, leaderRequired: true, ignorePendingLeaves: false }'
);

fs.writeFileSync('frontend/src/pages/Admin/RosterManagement.jsx', code);
console.log('patched frontend auto-generate to send reserveEmployeeIds');
