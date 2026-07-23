const fs = require('fs');
let code = fs.readFileSync('controllers/rosterController.js', 'utf8');
code = code.replace(/if \(currTime >= lStart && currTime <= lEnd\) \{/, if (currTime >= lStart && currTime <= lEnd) { console.log('MATCHED LEAVE!', leave.employeeId.name, new Date(currTime)););
fs.writeFileSync('controllers/rosterController.js', code);
