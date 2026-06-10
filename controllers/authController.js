const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Admin = require("../models/Admin");
const Log = require("../models/Log");

// تفعيل الحساب
exports.register = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({
        message: "برجاء إدخال كود الموظف وكلمة المرور الجديدة!",
      });
    }

    const user = await User.findOne({ employeeCode });

    if (!user) {
      return res.status(404).json({ message: "الكود غير مسجل بالنظام!" });
    }

    if (user.isRegistered) {
      return res.status(400).json({
        message: "هذا الحساب مفعل ومسجل بالفعل!",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.isRegistered = true;
    await user.save();

    const newLog = new Log({
      action: "USER_REGISTERED",
      performedBy: user._id,
      details: `المستخدم ${user.name} قام بتفعيل حسابه.`,
      ipAddress: req.ip,
    });

    await newLog.save();

    res.status(200).json({ message: "تم تفعيل حسابك بنجاح!" });
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء التسجيل",
      error: error.message,
    });
  }
};

// تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({
        message: "برجاء إدخال اسم المستخدم/الكود وكلمة المرور!",
      });
    }

    const adminUser = await Admin.findOne({ username: employeeCode });

    if (adminUser) {
      const isMatch = await bcrypt.compare(password, adminUser.password);

      if (!isMatch) {
        return res.status(400).json({ message: "بيانات الدخول غير صحيحة!" });
      }

      return res.status(200).json({
        message: "تم تسجيل الدخول بنجاح كمدير نظام!",
        user: {
          id: adminUser._id,
          employeeCode: adminUser.username,
          name: adminUser.name,
          role: adminUser.role,
        },
      });
    }

    const regularUser = await User.findOne({ employeeCode });

    if (!regularUser) {
      return res.status(400).json({ message: "الحساب غير مسجل بالنظام!" });
    }

    if (!regularUser.isRegistered) {
      return res.status(400).json({ message: "هذا الحساب غير مفعل بعد!" });
    }

    const isMatch = await bcrypt.compare(password, regularUser.password);

    if (!isMatch) {
      return res.status(400).json({ message: "بيانات الدخول غير صحيحة!" });
    }

    res.status(200).json({
      message: "تم تسجيل الدخول بنجاح!",
      user: {
        id: regularUser._id,
        employeeCode: regularUser.employeeCode,
        name: regularUser.name,
        role: regularUser.role,
        leaveBalances: regularUser.leaveBalances,
        email: regularUser.email || "",
        jobGrade: regularUser.jobGrade,
        workType: regularUser.workType,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء تسجيل الدخول",
      error: error.message,
    });
  }
};

// تغيير كلمة المرور
exports.changePassword = async (req, res) => {
  try {
    const { employeeCode, currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية!",
      });
    }

    let account = await Admin.findOne({ username: employeeCode });

    if (!account) {
      account = await User.findOne({ employeeCode });
    }

    if (!account) {
      return res.status(404).json({ message: "الحساب غير موجود!" });
    }

    if (!account.password) {
      return res.status(400).json({
        message: "هذا الحساب غير مفعّل/تم تصفيره. برجاء إعادة التفعيل أولاً.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, account.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "كلمة المرور الحالية غير صحيحة!",
      });
    }

    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(newPassword, salt);
    await account.save();

    res.status(200).json({ message: "تم تغيير كلمة المرور بنجاح!" });
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};
