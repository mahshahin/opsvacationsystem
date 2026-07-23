const mongoose = require('mongoose');
require('./models/User');
const LeaveRequest = require('./models/LeaveRequest');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ops-vacation").then(async () => {
  const leaves = await LeaveRequest.find({}).populate("employeeId", "name");
  console.log("Is populated?", leaves[0].employeeId.name);
  process.exit();
});
