// models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: { 
    type: String, 
    required: true // نوع العملية (مثال: 'EMPLOYEE_ADDED', 'USER_REGISTERED', 'LOGIN_SUCCESS')
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // الشخص الذي قام بالعملية (إذا كان مسجلاً بالسيستم)
    required: false // نجعله غير إجباري لأن عملية إضافة الكود الأولية قد لا تحتوي على مستخدم مسجل بعد
  },
  details: {
    type: String, 
    required: true // تفاصيل العملية نصياً (مثال: "تم إضافة الموظف أحمد بكود 102")
  },
  ipAddress: {
    type: String // لتتبع جهاز الشخص الذي قام بالعملية للأمان
  }
}, { timestamps: true }); // الـ timestamps هنا ستعطينا وقت العملية بالملي ثانية تلقائياً عبر createdAt

// إضافة خاصية التدمير الذاتي (TTL)
// السطر ده بيخلي الداتا بيز تمسح السجل تلقائياً بعد 30 يوم من إنشائه
logSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });


module.exports = mongoose.model('Log', logSchema);