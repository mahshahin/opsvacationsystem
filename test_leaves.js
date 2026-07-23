const mongoose = require('mongoose');
require('./models/User'); // Register User schema
const LeaveRequest = require('./models/LeaveRequest');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ops-vacation").then(async () => {
  const leaves = await LeaveRequest.find().populate("employeeId", "name");
  console.log("Found leaves total:", leaves.length);
  leaves.forEach(l => {
    console.log(l.startDate, l.endDate, l.employeeId ? l.employeeId.name : null, l.status);
  });
  process.exit();
});
