const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  // اسم المستخدم (اللي هيدخل بيه السيستم)
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  // الاسم الفعلي لعرضه في الشاشة
  name: { 
    type: String, 
    required: true 
  },
  // الرقم السري (هيتشفر طبعاً)
  password: { 
    type: String, 
    required: true 
  },
  // الصفة ثابتة (مدير نظام)
  role: { 
    type: String, 
    default: 'admin' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);