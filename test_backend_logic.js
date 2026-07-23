const mongoose = require('mongoose');
require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ops-vacation").then(async () => {
    const month = 8;
    const year = 2026;
    const ignorePendingLeaves = false;
    const leaveStatuses = ignorePendingLeaves ? ["approved"] : ["approved", "pending"];
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const leaves = await LeaveRequest.find({
      status: { $in: leaveStatuses },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).populate("employeeId", "name");

    console.log("Found leaves for auto-generate logic:", leaves.length);
    let day4Notes = [];
    leaves.forEach(leave => {
        const lStart = new Date(leave.startDate).setHours(0,0,0,0);
        const lEnd = new Date(leave.endDate).setHours(23,59,59,999);
        const currTime = new Date(2026, 7, 4).getTime();
        
        if (currTime >= lStart && currTime <= lEnd) {
          if (leave.employeeId && leave.employeeId.name) {
            const statusText = leave.status === 'pending' ? ' (معلقة)' : '';
            day4Notes.push(leave.employeeId.name + statusText);
          }
        }
    });
    console.log("Day 4 notes array:", day4Notes);
    process.exit();
});
