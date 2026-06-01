const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // مربوط بجدول الموظفين
    required: true
  },
  leaveType: {
    type: String,
    enum: ['annual', 'casual', 'compensation'], // اعتيادي، عارضة، بدل
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'], // حالة الطلب (قيد الانتظار، مقبول، مرفوض)
    default: 'pending' // أي طلب جديد بيكون قيد الانتظار تلقائياً
  }
}, { timestamps: true }); // لتسجيل وقت تقديم الطلب

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);