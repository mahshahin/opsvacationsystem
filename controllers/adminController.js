const SystemSettings = require("../models/SystemSettings");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Log = require("../models/Log");
const LeaveRequest = require("../models/LeaveRequest");
const Admin = require("../models/Admin");
const sendEmail = require("../utils/sendEmail");
const sendPushNotification = require("../utils/sendPushNotification");

/* =========================
   Helpers
========================= */

// قيمة افتراضية فقط لو الأدمن لم يحدد الاستحقاق السنوي يدويًا
const getDefaultAnnualQuota = (jobGrade) => {
  return jobGrade === "كبير" || jobGrade === "درجة اولى" ? 30 : 21;
};

const translateLeaveType = (type) => {
  switch (type) {
    case "annual":
      return "اعتيادي";
    case "casual":
      return "عارضة";
    case "compensation":
      return "بدل أعياد";
    default:
      return type;
  }
};

const normalizeEmail = (email) =>
  String(email || "")
    .trim()
    .toLowerCase();

const buildEmployeeMessageBody = (message) => {
  return `${String(message || "").trim()}

---
هذه الرسالة مرسلة من إدارة النظام.`;
};

// جلب الحد الأقصى الشهري من الإعدادات
const getMonthlyLeaveLimit = async () => {
  const setting = await SystemSettings.findOne({ key: "monthlyLeaveLimit" });
  return setting ? Number(setting.value) : 3;
};

// حساب عدد الأيام المشتركة بين فترة إجازة وفترة شهر
const getOverlapDays = (rangeStart, rangeEnd, periodStart, periodEnd) => {
  const start = rangeStart > periodStart ? rangeStart : periodStart;
  const end = rangeEnd < periodEnd ? rangeEnd : periodEnd;

  if (start > end) return 0;

  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

// تقسيم الفترة على الشهور المتداخلة معها
const getMonthChunksBetween = (startDate, endDate) => {
  const chunks = [];

  let cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (cursor <= endDate) {
    const chunkStart = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const chunkEnd = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    chunks.push({
      start: chunkStart,
      end: chunkEnd,
      label: chunkStart.toLocaleDateString("ar-EG", {
        month: "long",
        year: "numeric",
      }),
    });

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return chunks;
};

// إرسال إشعار موحد لكل الأدمنز (بدون تكرار إيميل)
const notifyAdminsByEmail = async (subject, message) => {
  const admins = await Admin.find({
    email: { $exists: true, $ne: "" },
  }).select("email name");

  const uniqueAdminEmails = [
    ...new Set(admins.map((a) => normalizeEmail(a.email)).filter(Boolean)),
  ];

  if (uniqueAdminEmails.length === 0) return;

  await Promise.allSettled(
    uniqueAdminEmails.map((email) => sendEmail(email, subject, message)),
  );
};

// إشعار الأدمن بطلب إجازة جديد
const sendAdminLeaveRequestNotification = async ({
  employeeName,
  employeeCode,
  leaveType,
  startDate,
  endDate,
  duration,
  reason,
}) => {
  const subject = `طلب إجازة جديد من ${employeeName}`;

  const message = `
تم تقديم طلب إجازة جديد ويحتاج إلى مراجعة الإدارة.

اسم الموظف: ${employeeName}
كود الموظف: ${employeeCode}
نوع الإجازة: ${translateLeaveType(leaveType)}
من: ${new Date(startDate).toLocaleDateString("ar-EG")}
إلى: ${new Date(endDate).toLocaleDateString("ar-EG")}
عدد الأيام: ${duration}
السبب: ${reason || "لا يوجد"}

يرجى مراجعة الطلب من لوحة الإدارة.
`;

  await notifyAdminsByEmail(subject, message);
};

// إشعار الأدمن بإلغاء الموظف للطلب
const sendAdminLeaveCancelNotification = async ({
  employeeName,
  employeeCode,
  leaveType,
  startDate,
  endDate,
  duration,
  reason,
}) => {
  const subject = `إلغاء طلب إجازة من ${employeeName}`;

  const message = `
قام الموظف بإلغاء طلب إجازة كان في حالة انتظار.

اسم الموظف: ${employeeName}
كود الموظف: ${employeeCode}
نوع الإجازة: ${translateLeaveType(leaveType)}
من: ${new Date(startDate).toLocaleDateString("ar-EG")}
إلى: ${new Date(endDate).toLocaleDateString("ar-EG")}
عدد الأيام: ${duration}
السبب: ${reason || "لا يوجد"}

تم إلغاء الطلب من قبل الموظف قبل مراجعته.
`;

  await notifyAdminsByEmail(subject, message);
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
        compensation: Number(compensationBalance) || 0,
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
/* =========================
   معالجة الطلبات (الموافقة والرفض) المعدلة لإرسال البادج 
   ودعم الأسماء المختلفة للتوكنز في الـ Schema (expoPushToken أو expoPushTokens)
========================= */
exports.handleRequest = async (req, res) => {
  try {
    const { requestId, action } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({ message: "بيانات ناقصة!" });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "إجراء غير صحيح!" });
    }

    const request = await LeaveRequest.findById(requestId).populate(
      "employeeId"
    );

    if (!request) {
      return res.status(404).json({ message: "الطلب غير موجود!" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "تمت معالجة الطلب مسبقاً!" });
    }

    const user = request.employeeId;
    if (!user) {
      return res.status(404).json({ message: "الموظف غير موجود!" });
    }

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

    // إرسال إيميل للموظف إذا كان عنده بريد إلكتروني
    if (user && user.email) {
      sendEmail(
        user.email,
        user.name,
        request.status,
        request.leaveType,
        request.startDate,
        request.endDate
      ).catch((err) =>
        console.error("خطأ في إرسال البريد الإلكتروني الإشعاري:", err)
      );
    }

    // إرسال Push Notification للموظف وتحديث البادج على أيقونة التطبيق لـ 1
    try {
      const isApproved = action === "approve";
      const title = isApproved
        ? "تم قبول طلب الإجازة"
        : "تم رفض طلب الإجازة";

      const fromDate = new Date(request.startDate).toLocaleDateString("ar-EG");
      const toDate = new Date(request.endDate).toLocaleDateString("ar-EG");
      const body = isApproved
        ? `تم قبول طلب إجازتك من ${fromDate} إلى ${toDate}.`
        : `تم رفض طلب إجازتك من ${fromDate} إلى ${toDate}.`;

      // ⚠️ فحص ذكي لدعم كلا الحقلين في قاعدة البيانات الخاصة بك (مفرد أو جمع)
      const employeeTokens = user.expoPushToken || user.expoPushTokens;

      if (employeeTokens) {
        await sendPushNotification({
          to: employeeTokens, // يدعم كونه String مفرد أو Array جمع تلقائياً
          title,
          body,
          badge: 1, // 👈 هنا قمنا بإضافة البادج ليظهر الرقم 1 على أيقونة التطبيق!
          data: {
            type: isApproved ? "leave_approved" : "leave_rejected",
            screen: "EmployeeHistory",
            requestId: String(request._id),
            status: request.status,
          },
        });
        console.log("تم إرسال الإشعار والـ Badge بنجاح للموظف:", user.employeeCode);
      } else {
        console.log("لم يتم إرسال إشعار لعدم وجود توكن إشعارات مسجل لجهاز الموظف:", user.employeeCode);
      }
    } catch (pushError) {
      console.error("خطأ في إرسال Push Notification:", pushError);
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
   قائمة الموظفين لإرسال الرسائل
========================= */
exports.getMessageEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: { $ne: "admin" } })
      .select("name employeeCode email jobGrade workType role")
      .sort({ employeeCode: 1 });

    res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الموظفين",
      error: error.message,
    });
  }
};

/* =========================
   إرسال رسائل للموظفين
========================= */
exports.sendEmployeeMessage = async (req, res) => {
  try {
    const { sendMode, employeeIds, subject, message } = req.body;

    const normalizedMode = String(sendMode || "")
      .trim()
      .toLowerCase();
    const cleanSubject = String(subject || "").trim();
    const cleanMessage = String(message || "").trim();

    const normalizedEmployeeIds = Array.isArray(employeeIds)
      ? employeeIds.filter(Boolean)
      : employeeIds
        ? [employeeIds]
        : [];

    if (!["single", "multiple", "all"].includes(normalizedMode)) {
      return res.status(400).json({
        success: false,
        message: "نوع الإرسال غير صحيح",
      });
    }

    if (!cleanSubject) {
      return res.status(400).json({
        success: false,
        message: "برجاء إدخال عنوان الرسالة",
      });
    }

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "برجاء إدخال محتوى الرسالة",
      });
    }

    if (normalizedMode === "single" && normalizedEmployeeIds.length !== 1) {
      return res.status(400).json({
        success: false,
        message: "برجاء اختيار موظف واحد فقط",
      });
    }

    if (normalizedMode === "multiple" && normalizedEmployeeIds.length < 1) {
      return res.status(400).json({
        success: false,
        message: "برجاء اختيار موظف واحد على الأقل",
      });
    }

    let targetEmployees = [];

    if (normalizedMode === "all") {
      targetEmployees = await User.find({ role: { $ne: "admin" } }).select(
        "name employeeCode email",
      );
    } else {
      targetEmployees = await User.find({
        _id: { $in: normalizedEmployeeIds },
        role: { $ne: "admin" },
      }).select("name employeeCode email");
    }

    if (!targetEmployees.length) {
      return res.status(404).json({
        success: false,
        message: "لا يوجد موظفون مطابقون للإرسال",
      });
    }

    const employeesWithoutEmail = [];
    const emailMap = new Map();
    let duplicateEmailEmployeesCount = 0;

    targetEmployees.forEach((emp) => {
      const normalizedEmail = normalizeEmail(emp.email);

      if (!normalizedEmail) {
        employeesWithoutEmail.push({
          _id: emp._id,
          name: emp.name,
          employeeCode: emp.employeeCode || "—",
        });
        return;
      }

      if (emailMap.has(normalizedEmail)) {
        duplicateEmailEmployeesCount += 1;
        return;
      }

      emailMap.set(normalizedEmail, {
        email: normalizedEmail,
        name: emp.name,
        employeeCode: emp.employeeCode || "—",
      });
    });

    const finalRecipients = Array.from(emailMap.values());

    if (!finalRecipients.length) {
      return res.status(400).json({
        success: false,
        message: "لا يوجد موظفون لديهم بريد إلكتروني صالح للإرسال",
        employeesWithoutEmail,
      });
    }

    const emailBody = buildEmployeeMessageBody(cleanMessage);

    const emailResults = await Promise.allSettled(
      finalRecipients.map((recipient) =>
        sendEmail(recipient.email, cleanSubject, emailBody),
      ),
    );

    const failedRecipients = [];
    let sentCount = 0;

    emailResults.forEach((result, index) => {
      const recipient = finalRecipients[index];

      if (result.status === "fulfilled") {
        sentCount += 1;
      } else {
        failedRecipients.push({
          email: recipient.email,
          name: recipient.name,
          employeeCode: recipient.employeeCode,
        });
      }
    });

    const newLog = new Log({
      action: "EMPLOYEE_MESSAGE_SENT",
      details: `تم إرسال رسالة بعنوان (${cleanSubject}) بنمط (${normalizedMode}) إلى ${sentCount} بريد إلكتروني، مع تخطي ${employeesWithoutEmail.length} موظف بدون بريد إلكتروني، وفشل ${failedRecipients.length} حالة.`,
      ipAddress: req.ip,
    });

    await newLog.save();

    return res.status(200).json({
      success: true,
      message: `تم إرسال الرسالة إلى ${sentCount} بريد إلكتروني بنجاح${
        employeesWithoutEmail.length
          ? `، وتم تخطي ${employeesWithoutEmail.length} موظف لعدم وجود بريد إلكتروني`
          : ""
      }${
        failedRecipients.length
          ? `، وفشل الإرسال إلى ${failedRecipients.length} بريد`
          : ""
      }.`,
      summary: {
        sendMode: normalizedMode,
        totalMatchedEmployees: targetEmployees.length,
        totalUniqueEmails: finalRecipients.length,
        sentCount,
        failedCount: failedRecipients.length,
        skippedNoEmailCount: employeesWithoutEmail.length,
        duplicateEmailEmployeesCount,
      },
      employeesWithoutEmail,
      failedRecipients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إرسال الرسائل",
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
      .populate(
        "employeeId",
        "name employeeCode jobGrade annualLeaveQuota leaveBalances"
      )
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
   تعديل الإجازة من قبل الإدارة
========================= */
exports.editLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "برجاء إدخال تواريخ صحيحة!" });
    }

    const leave = await LeaveRequest.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "طلب الإجازة غير موجود" });
    }

    const employee = await User.findById(leave.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (end < start) {
      return res.status(400).json({
        message: "تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البداية!",
      });
    }

    const diffTime = Math.abs(end - start);
    const newDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const oldDuration = leave.duration;

    if (leave.status === "approved") {
      const balanceDiff = newDuration - oldDuration;
      if (balanceDiff > 0) {
        // التحقق من الرصيد
        if (employee.leaveBalances[leave.leaveType] < balanceDiff) {
          return res.status(400).json({
            message: `عذرًا، رصيد الموظف لا يكفي لتمديد الإجازة. (متبقي: ${employee.leaveBalances[leave.leaveType]})`,
          });
        }
      }
      
      employee.leaveBalances[leave.leaveType] -= balanceDiff;
      await employee.save();
    }

    leave.startDate = start;
    leave.endDate = end;
    leave.duration = newDuration;
    await leave.save();

    const newLog = new Log({
      action: "LEAVE_EDITED",
      details: `قام مدير النظام بتعديل تواريخ إجازة ${employee.name} (${translateLeaveType(leave.leaveType)}). المدة الجديدة: ${newDuration} يوم.`,
      ipAddress: req.ip,
    });
    await newLog.save();

    const employeeTokens = employee.expoPushToken || employee.expoPushTokens;
    if (employeeTokens) {
      await sendPushNotification({
        to: employeeTokens,
        title: "تم تعديل تواريخ إجازتك",
        body: `قامت الإدارة بتعديل تواريخ إجازتك لتصبح من ${start.toLocaleDateString("ar-EG")} إلى ${end.toLocaleDateString("ar-EG")}.`,
        badge: 1,
        data: {
          type: "leave_edited",
          screen: "EmployeeHistory",
        },
      }).catch(err => console.error("خطأ في إرسال Push Notification لتعديل الإجازة:", err));
    }

    return res.status(200).json({
      success: true,
      message: "تم تعديل الإجازة بنجاح",
      leave
    });

  } catch (error) {
    console.error("Error editing leave request:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تعديل الإجازة",
    });
  }
};

/* =========================
   إنشاء مدير (الإيميل اختياري)
========================= */
exports.createAdmin = async (req, res) => {
  try {
    const { username, name, password, email } = req.body;

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
      email: email ? email.trim().toLowerCase() : "",
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
    const { name, username, email } = req.body;

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

    if (typeof email === "string") {
      admin.email = email.trim().toLowerCase();
    }

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

/* =========================
   إعدادات الحد الأقصى الشهري للإجازات
========================= */
exports.getMonthlyLeaveLimit = async (req, res) => {
  try {
    const setting = await SystemSettings.findOne({
      key: "monthlyLeaveLimit",
    });

    return res.status(200).json({
      success: true,
      monthlyLeaveLimit: setting ? Number(setting.value) : 3,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الحد الشهري",
      error: error.message,
    });
  }
};

exports.updateMonthlyLeaveLimit = async (req, res) => {
  try {
    const { monthlyLeaveLimit } = req.body;

    const parsedLimit = Number(monthlyLeaveLimit);

    if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({
        success: false,
        message: "برجاء إدخال رقم صحيح أكبر من صفر",
      });
    }

    await SystemSettings.findOneAndUpdate(
      { key: "monthlyLeaveLimit" },
      { value: parsedLimit },
      { upsert: true, new: true },
    );

    return res.status(200).json({
      success: true,
      message: "تم تحديث الحد الشهري بنجاح",
      monthlyLeaveLimit: parsedLimit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث الحد الشهري",
      error: error.message,
    });
  }
};
