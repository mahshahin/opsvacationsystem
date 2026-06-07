  const mongoose = require('mongoose');

  const shiftSchema = new mongoose.Schema({
    leader: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', // تأكد إن ده اسم موديل الموظفين بتاعك
      default: null 
    },
    members: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      default: null 
    }]
  }, { _id: false });

  const rosterSchema = new mongoose.Schema({
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    details: {
      type: Map,
      of: {
        shift1: { type: shiftSchema, default: () => ({ leader: null, members: [] }) },
        shift2: { type: shiftSchema, default: () => ({ leader: null, members: [] }) },
        shift3: { type: shiftSchema, default: () => ({ leader: null, members: [] }) },
        notes: { type: String, default: '' }
      }
    }
  }, { timestamps: true }); // timestamps بتعمل حقل createdAt تلقائياً

  // 1. منع تكرار الروستر لنفس الشهر والسنة
  rosterSchema.index({ month: 1, year: 1 }, { unique: true });

  // 👇 2. اللمسة الجديدة: المسح التلقائي بعد سنة (TTL Index) 👇
  // 31,536,000 ثانية = 365 يوم × 24 ساعة × 60 دقيقة × 60 ثانية
  rosterSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

  module.exports = mongoose.model('Roster', rosterSchema);