const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    // اسم المستخدم
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // الاسم الظاهر
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // البريد الإلكتروني للإشعارات
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // الرقم السري
    password: {
      type: String,
      required: true,
    },

    // الصفة
    role: {
      type: String,
      default: "admin",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Admin", adminSchema);
