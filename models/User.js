// models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    employeeCode: { type: String, required: true, unique: true, trim: true },

    name: { type: String, required: true, trim: true },

    password: { type: String },

    isRegistered: { type: Boolean, default: false },

    role: {
      type: String,
      enum: ["employee", "manager", "admin"],
      default: "employee",
    },

    department: { type: String, default: "السيطرة المركزية" },

    // البريد الإلكتروني
    email: { type: String, default: "" },

    jobGrade: {
      type: String,
      required: true,
      enum: ["كبير", "درجة اولى", "درجة ثانية", "درجة ثالثة"],
      default: "درجة ثالثة",
    },

    // نوع العمل
    workType: {
      type: String,
      enum: ["أبحاث", "شيفت"],
      default: "شيفت",
    },

    // ✅ جديد: الاستحقاق السنوي الأصلي (من أصل كام)
    annualLeaveQuota: {
      type: Number,
      default: 21,
    },

    // الأرصدة الحالية المتبقية
    leaveBalances: {
      annual: { type: Number, default: 21 },
      casual: { type: Number, default: 7 },
      compensation: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
