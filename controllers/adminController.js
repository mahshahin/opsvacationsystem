const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Log = require("../models/Log");
const LeaveRequest = require("../models/LeaveRequest");
const Admin = require("../models/Admin");
const sendLeaveEmail = require("../utils/sendEmail");

/* =========================
   Helpers
========================= */

// قيمة افتراضية فقط لو الأدمن لم يحدد الاستحقاق السنوي يدويًا
const getDefaultAnnualQuota = (jobGrade) => {
  return jobGrade === "كبير" || jobGrade === "درجة اولى" ? 30 : 21;
};

/* =========================
   إضافة موظف
========================= */
exports.addEmployee = async (req, res) => {
  try {
    const {
      employeeCode,
      name,
      role,
      jobGrade,
      workType,
      compensationBalance,
      annualLeaveQuota,
    } = req.body;

    if (!employeeCode || !name) {
      return res.status(400).json({
        message: "برجاء إدخال البيانات الأساسية!",
      });
    }

    const existingUser = await User.findOne({ employeeCode });

    if (existingUser) {
      return res.status(400).json({ message: "هذا الكود مسجل مسبقاً!" });
    }

    let userJobGrade = jobGrade;
    let userWorkType = workType || "شيفت";
    let annualBalance = 0;
    let annualQuota = 0;

    if (role === "admin") {
      userJobGrade = undefined;
      userWorkType = undefined;
      annualBalance = 0;
      annualQuota = 0;
    } else {
      if (!jobGrade) {
        return res.status(400).json({
          message: "برجاء اختيار الدرجة الوظيفية للموظف!",
        });
      }

      const parsedQuota = Number(annualLeaveQuota);
      annualQuota =
        !Number.isNaN(parsedQuota) && parsedQuota >= 0
          ? parsedQuota
          : getDefaultAnnualQuota(jobGrade);

      annualBalance = annualQuota;
    }

    const newEmployee = new User({
      employeeCode,
      name,
      role: role || "employee",
      jobGrade: userJobGrade,
      workType: userWorkType,
      annualLeaveQuota: annualQuota,
      leaveBalances: {
        annual: annualBalance,
        casual: role === "admin" ? 0 : 7,
        compensation: compensationBalance || 0,
      },
    });

    await newEmployee.save();

    const newLog = new Log({
      action: "EMPLOYEE_ADDED",
      details: `تم إضافة ${
        role === "admin" ? "مدير نظام" : "موظف"
      }: ${name} (الكود: ${employeeCode})`,
      ipAddress: req.ip,
    });

    await newLog.save();

    res.status(201).json({ message: "تم الإضافة بنجاح!" });
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};

/* =========================
   تصفير كلمة المرور
========================= */
exports.resetPassword = async (req, res) => {
  try {
    const { employeeCode } = req.body;

    if (employeeCode === "admin") {
      return res.status(403).json({ message: "محظور تصفير الأدمن الذهبي!" });
    }

    const admin = await Admin.findOne({ username: employeeCode });

    if (admin) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash("123456", salt);
      await admin.save();

      return res.status(200).json({
        message: `تم إعادة كلمة مرور المدير (${admin.name}) للباسوورد الافتراضي: 123456`,
      });
    }

    const user = await User.findOne({ employeeCode });

    if (!user) {
      return res.status(404).json({ message: "المستهدف غير موجود بالنظام!" });
    }

    user.password = undefined;
    user.isRegistered = false;
    await user.save();

    res.status(200).json({
      message: `تم تصفير حساب الموظف (${user.name}) بنجاح.`,
    });
  } catch (error) {
    res.status(500).json({
      message: "خطأ في السيرفر",
      error: error.message,
    });
  }
};

/* =========================
   الطلبات المعلقة
========================= */
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ status: "pending" })
      .populate(
        "employeeId",
        "name employeeCode jobGrade leaveBalances annualLeaveQuota",
      )
      .sort({ createdAt: 1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "خطأ في جلب الطلبات",
      error: error.message,
    });
  }
};

/* =========================
   معالجة الطلبات
========================= */
exports.handleRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({ message: "بيانات ناقصة!" });
    }

    const request =
      await LeaveRequest.findById(requestId).populate("employeeId");

    if (!request) {
      return res.status(404).json({ message: "الطلب غير موجود!" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "تمت معالجة الطلب مسبقاً!" });
    }

    const user = request.employeeId;

    if (action === "approve") {
      if (user.leaveBalances[request.leaveType] < request.duration) {
        return res.status(400).json({ message: "رصيد الموظف لا يكفي!" });
      }

      user.leaveBalances[request.leaveType] -= request.duration;
      user.markModified("leaveBalances");
      await user.save();

      request.status = "approved";
    } else {
      request.status = "rejected";
    }

    await request.save();

    if (user && user.email) {
      sendLeaveEmail(
        user.email,
        user.name,
        request.status,
        request.leaveType,
        request.startDate,
        request.endDate,
      ).catch((err) =>
        console.error("خطأ في إرسال البريد الإلكتروني الإشعاري:", err),
      );
    }

    const newLog = new Log({
      action: action === "approve" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
      details: `تم ${action === "approve" ? "قبول" : "رفض"} إجازة ${user.name}.`,
      ipAddress: req.ip,
    });

    await newLog.save();

    res.status(200).json({
      message: `تم ${action === "approve" ? "قبول" : "رفض"} الطلب!`,
    });
  } catch (error) {
    res.status(500).json({
      message: "خطأ في المعالجة",
      error: error.message,
    });
  }
};

/* =========================
   الموظفين
========================= */
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.find().sort({ employeeCode: 1 });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({
      message: "خطأ في الجلب",
      error: error.message,
    });
  }
};

/* =========================
   تعديل موظف
========================= */
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, jobGrade, workType, role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود!" });
    }

    if (
      (user.employeeCode === "1111" || user.employeeCode === "admin") &&
      role !== "admin"
    ) {
      return res.status(403).json({
        message: "مرفوض: لا يمكن تجريد الأدمن الذهبي من صلاحياته!",
      });
    }

    user.name = name || user.name;
    user.role = role || user.role;

    if (user.role === "admin") {
      user.jobGrade = undefined;
      user.workType = undefined;
      user.annualLeaveQuota = 0;
    } else {
      user.jobGrade = jobGrade || user.jobGrade;
      user.workType = workType || user.workType;
      // ✅ لم نعد نغير leaveBalances.annual ولا annualLeaveQuota تلقائيًا حسب الدرجة
    }

    await user.save();

    const newLog = new Log({
      action: "EMPLOYEE_UPDATED",
      details: `تعديل بيانات: ${user.name}`,
      ipAddress: req.ip,
    });

    await newLog.save();

    res.status(200).json({ message: "تم التحديث بنجاح!" });
  } catch (error) {
    res.status(500).json({
      message: "خطأ في التحديث",
      error: error.message,
    });
  }
};

/* =========================
   حذف موظف
========================= */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود!" });
    }

    if (user.employeeCode === "1111" || user.employeeCode === "admin") {
      return res.status(403).json({
        message: "تحذير أمني: يمنع حذف حساب الأدمن الذهبي للنظام!",
      });
    }

    await User.findByIdAndDelete(id);
    await LeaveRequest.deleteMany({ employeeId: id });

    const newLog = new Log({
      action: "EMPLOYEE_DELETED",
      details: `حذف نهائي: ${user.name}`,
      ipAddress: req.ip,
    });

    await newLog.save();

    res.status(200).json({ message: "تم الحذف بنجاح!" });
  } catch (error) {
    res.status(500).json({
      message: "خطأ أثناء الحذف",
      error: error.message,
    });
  }
};

/* =========================
   تعديل الأرصدة
========================= */
exports.updateBalances = async (req, res) => {
  try {
    const { id } = req.params;
    const { annual, annualLeaveQuota, casual, compensation } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "الموظف غير موجود!" });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        message: "ليس للمديرين أرصدة إجازات للتعديل!",
      });
    }

    const parsedAnnual = Number(annual);
    const parsedQuota = Number(annualLeaveQuota);
    const parsedCasual = Number(casual);
    const parsedCompensation = Number(compensation);

    if (
      Number.isNaN(parsedAnnual) ||
      Number.isNaN(parsedQuota) ||
      Number.isNaN(parsedCasual) ||
      Number.isNaN(parsedCompensation)
    ) {
      return res.status(400).json({
        message: "برجاء إدخال قيم صحيحة للأرصدة.",
      });
    }

    if (
      parsedAnnual < 0 ||
      parsedQuota < 0 ||
      parsedCasual < 0 ||
      parsedCompensation < 0
    ) {
      return res.status(400).json({
        message: "لا يمكن إدخال قيم سالبة في الأرصدة.",
      });
    }

    if (parsedAnnual > parsedQuota) {
      return res.status(400).json({
        message:
          "الرصيد الاعتيادي المتبقي لا يمكن أن يكون أكبر من الاستحقاق السنوي.",
      });
    }

    user.annualLeaveQuota = parsedQuota;
    user.leaveBalances.annual = parsedAnnual;
    user.leaveBalances.casual = parsedCasual;
    user.leaveBalances.compensation = parsedCompensation;
    user.markModified("leaveBalances");

    await user.save();

    const newLog = new Log({
      action: "BALANCES_UPDATED",
      details: `تعديل أرصدة (${user.name})`,
      ipAddress: req.ip,
    });

    await newLog.save();

    res.status(200).json({ message: "تم التحديث بنجاح!" });
  } catch (error) {
    res.status(500).json({
      message: "خطأ في التحديث",
      error: error.message,
    });
  }
};

/* =========================
   السجلات
========================= */
exports.getLogs = async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(200);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({
      message: "خطأ في جلب السجلات",
      error: error.message,
    });
  }
};

/* =========================
   أرشيف الإجازات
========================= */
exports.getLeaveArchive = async (req, res) => {
  try {
    const requests = await LeaveRequest.find()
      .populate("employeeId", "name employeeCode jobGrade annualLeaveQuota")
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "خطأ في الأرشيف",
      error: error.message,
    });
  }
};

/* =========================
   حذف نهائي من الأرشيف
========================= */
exports.deleteLeaveArchive = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await LeaveRequest.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "طلب الإجازة غير موجود",
      });
    }

    const employee = await User.findById(leave.employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "الموظف غير موجود",
      });
    }

    if (leave.status === "approved") {
      if (leave.leaveType === "annual") {
        employee.leaveBalances.annual =
          (employee.leaveBalances.annual || 0) + leave.duration;
      } else if (leave.leaveType === "casual") {
        employee.leaveBalances.casual =
          (employee.leaveBalances.casual || 0) + leave.duration;
      } else if (leave.leaveType === "compensation") {
        employee.leaveBalances.compensation =
          (employee.leaveBalances.compensation || 0) + leave.duration;
      }

      employee.markModified("leaveBalances");
      await employee.save();
    }

    await LeaveRequest.findByIdAndDelete(id);

    const newLog = new Log({
      action: "LEAVE_CANCELLED",
      details: `تم إلغاء طلب إجازة نهائيًا للموظف ${employee.name}`,
      ipAddress: req.ip,
    });

    await newLog.save();

    return res.status(200).json({
      success: true,
      message: "تم إلغاء الإجازة نهائيًا وحذفها من السجل",
    });
  } catch (error) {
    console.error("Error cancelling leave request:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إلغاء الإجازة",
    });
  }
};

/* =========================
   إنشاء مدير
========================= */
exports.createAdmin = async (req, res) => {
  try {
    const { username, name, password } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({
        message: "برجاء إدخال اسم المستخدم، الاسم، والرقم السري!",
      });
    }

    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
      return res.status(400).json({ message: "اسم المستخدم مسجل مسبقاً!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      username,
      name,
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();

    res.status(201).json({ message: "تم إضافة مدير النظام بنجاح!" });
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ في السيرفر",
      error: error.message,
    });
  }
};

/* =========================
   قائمة المدراء
========================= */
exports.getAdminsList = async (req, res) => {
  try {
    const admins = await Admin.find().select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({
      message: "خطأ في جلب بيانات الإدارة",
      error: error.message,
    });
  }
};

/* =========================
   تعديل مدير
========================= */
exports.updateAdmin = async (req, res) => {
  try {
    const { name, username } = req.body;

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "المدير غير موجود!" });
    }

    if (admin.username === "admin" && username !== "admin") {
      return res.status(403).json({
        message: "لا يمكن تغيير اسم المستخدم للأدمن الذهبي!",
      });
    }

    admin.name = name || admin.name;

    if (admin.username !== "admin") {
      admin.username = username || admin.username;
    }

    await admin.save();

    res.status(200).json({ message: "تم تحديث بيانات المدير بنجاح!" });
  } catch (error) {
    res.status(500).json({
      message: "خطأ في التحديث",
      error: error.message,
    });
  }
};

/* =========================
   حذف مدير
========================= */
exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "المدير غير موجود!" });
    }

    if (admin.username === "admin") {
      return res.status(403).json({
        message: "تحذير أمني: يمنع مسح الأدمن الذهبي للنظام!",
      });
    }

    await Admin.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "تم مسح حساب المدير نهائياً!" });
  } catch (error) {
    res.status(500).json({
      message: "خطأ أثناء المسح",
      error: error.message,
    });
  }
};
