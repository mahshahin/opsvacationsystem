const User = require("../models/User");
const LeaveRequest = require("../models/LeaveRequest");
const Log = require("../models/Log");
const Admin = require("../models/Admin");
const SystemSettings = require("../models/SystemSettings");
const sendEmail = require("../utils/sendEmail");

/* =========================
   Helpers
========================= */
const getUserByEmployeeCode = async (employeeCode) => {
  return await User.findOne({ employeeCode });
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
    ...new Set(
      admins
        .map((a) =>
          String(a.email || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    ),
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
   Controllers
========================= */

// جلب بيانات البروفايل
exports.getEmployeeProfile = async (req, res) => {
  try {
    const { code } = req.params;
    const user = await User.findOne({ employeeCode: code }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "الموظف غير موجود!" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "خطأ في جلب بيانات الموظف",
      error: error.message,
    });
  }
};

// جلب طلبات الموظف
exports.getMyRequests = async (req, res) => {
  try {
    const { employeeCode } = req.params;
    const user = await getUserByEmployeeCode(employeeCode);
    if (!user) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }
    const requests = await LeaveRequest.find({ employeeId: user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({
      message: "خطأ في السيرفر",
      error: error.message,
    });
  }
};

// إلغاء طلب إجازة + إشعار الأدمن
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await LeaveRequest.findById(id).populate(
      "employeeId",
      "name employeeCode",
    );
    if (!request) {
      return res.status(404).json({ message: "الطلب غير موجود!" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({
        message: "لا يمكن إلغاء طلب تمت معالجته بالفعل!",
      });
    }
    const employee = request.employeeId;
    await LeaveRequest.findByIdAndDelete(id);
    const newLog = new Log({
      action: "LEAVE_CANCELLED_BY_EMPLOYEE",
      performedBy: employee?._id || null,
      details: `قام ${employee?.name || "موظف"} بإلغاء طلب إجازة (${request.leaveType}) لمدة ${request.duration} أيام.`,
      ipAddress: req.ip,
    });
    await newLog.save();

    // إرسال إشعار للإدارة
    try {
      await sendAdminLeaveCancelNotification({
        employeeName: employee?.name || "غير معروف",
        employeeCode: employee?.employeeCode || "—",
        leaveType: request.leaveType,
        startDate: request.startDate,
        endDate: request.endDate,
        duration: request.duration,
        reason: String(request.reason || "").trim(),
      });
    } catch (emailError) {
      console.error("خطأ في إرسال إشعار إلغاء الإجازة للإدارة:", emailError);
    }
    res.status(200).json({ message: "تم إلغاء الطلب بنجاح." });
  } catch (error) {
    res.status(500).json({
      message: "خطأ أثناء إلغاء الطلب",
      error: error.message,
    });
  }
};

// تقديم طلب إجازة
exports.submitLeaveRequest = async (req, res) => {
  try {
    const {
      employeeCode,
      leaveType,
      startDate,
      endDate,
      reason = "",
    } = req.body;

    if (!employeeCode || !leaveType || !startDate || !endDate) {
      return res.status(400).json({
        message: "برجاء استكمال جميع البيانات الأساسية للطلب!",
      });
    }

    const user = await getUserByEmployeeCode(employeeCode);
    if (!user) {
      return res.status(404).json({ message: "الموظف غير موجود!" });
    }

    if (user.role === "admin") {
      return res.status(400).json({
        message: "غير مسموح لمدير النظام بتقديم طلبات إجازة.",
      });
    }

    const cleanReason = String(reason || "").trim();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (end < start) {
      return res.status(400).json({
        message: "تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البداية!",
      });
    }

    if (leaveType !== "casual" && start < today) {
      return res.status(400).json({
        message:
          "لا يمكن تقديم إجازة بأثر رجعي (يُسمح بذلك للإجازة العارضة فقط)!",
      });
    }

    const overlappingRequest = await LeaveRequest.findOne({
      employeeId: user._id,
      status: { $ne: "rejected" },
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });

    if (overlappingRequest) {
      return res.status(400).json({
        message: "لديك بالفعل طلب إجازة يتعارض مع هذه التواريخ!",
      });
    }

    const diffTime = Math.abs(end - start);
    const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // ✅ التحقق من الحد الأقصى الشهري (Dynamic)
    const monthlyLeaveLimit = await getMonthlyLeaveLimit();
    const monthChunks = getMonthChunksBetween(start, end);

    for (const chunk of monthChunks) {
      const requestedDaysInThisMonth = getOverlapDays(
        start,
        end,
        chunk.start,
        chunk.end,
      );

      if (requestedDaysInThisMonth > monthlyLeaveLimit) {
        return res.status(400).json({
          message: `الحد الأقصى المسموح به للإجازات خلال شهر ${chunk.label} هو ${monthlyLeaveLimit} أيام فقط.`,
        });
      }

      const monthRequests = await LeaveRequest.find({
        employeeId: user._id,
        status: { $ne: "rejected" },
        startDate: { $lte: chunk.end },
        endDate: { $gte: chunk.start },
      });

      const usedDaysInThisMonth = monthRequests.reduce((total, req) => {
        const reqStart = new Date(req.startDate);
        const reqEnd = new Date(req.endDate);
        reqStart.setHours(0, 0, 0, 0);
        reqEnd.setHours(23, 59, 59, 999);
        return total + getOverlapDays(reqStart, reqEnd, chunk.start, chunk.end);
      }, 0);

      if (usedDaysInThisMonth + requestedDaysInThisMonth > monthlyLeaveLimit) {
        return res.status(400).json({
          message: `لا يمكن تقديم هذا الطلب لأن الحد الأقصى للإجازات خلال شهر ${chunk.label} هو ${monthlyLeaveLimit} أيام، وقد تم استهلاك ${usedDaysInThisMonth} يوم بالفعل.`,
        });
      }
    }

    if (leaveType === "casual") {
      if (duration > 2) {
        return res.status(400).json({
          message: "الإجازة العارضة لا يمكن أن تتجاوز يومين متصلين!",
        });
      }

      const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);

      const monthLeaves = await LeaveRequest.find({
        employeeId: user._id,
        leaveType: "casual",
        status: { $ne: "rejected" },
        startDate: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const takenCasualDaysThisMonth = monthLeaves.reduce(
        (total, r) => total + r.duration,
        0,
      );

      if (takenCasualDaysThisMonth + duration > 2) {
        return res.status(400).json({
          message: `عفواً، لقد استنفذت الحد الأقصى للعارضة هذا الشهر (متبقي لك ${
            2 - takenCasualDaysThisMonth
          } يوم).`,
        });
      }
    }

    if (user.leaveBalances[leaveType] < duration) {
      return res.status(400).json({
        message: `رصيدك الحالي (${user.leaveBalances[leaveType]} أيام) لا يكفي لطلب ${duration} يوم!`,
      });
    }

    const newLeaveReq = new LeaveRequest({
      employeeId: user._id,
      leaveType,
      startDate: start,
      endDate: end,
      duration,
      reason: cleanReason,
    });

    await newLeaveReq.save();

    const newLog = new Log({
      action: "LEAVE_REQUESTED",
      performedBy: user._id,
      details: `قدم ${user.name} طلب إجازة (${leaveType}) لمدة ${duration} أيام.`,
      ipAddress: req.ip,
    });
    await newLog.save();

    // إرسال إشعار إيميل للإدارة بوجود طلب جديد
    try {
      await sendAdminLeaveRequestNotification({
        employeeName: user.name,
        employeeCode: user.employeeCode,
        leaveType,
        startDate: start,
        endDate: end,
        duration,
        reason: cleanReason,
      });
    } catch (emailError) {
      console.error("خطأ في إرسال إشعار الإيميل للإدارة:", emailError);
    }

    res.status(201).json({
      message: "تم تقديم طلب الإجازة بنجاح.",
      durationRequested: duration,
      requestDetails: newLeaveReq,
    });
  } catch (error) {
    res.status(500).json({
      message: "حدث خطأ أثناء تقديم الطلب",
      error: error.message,
    });
  }
};

// تقرير الإجازات
exports.leaveReport = async (req, res) => {
  try {
    const { employeeCode, startDate, endDate } = req.body;
    if (!employeeCode || !startDate || !endDate) {
      return res.status(400).json({ message: "بيانات التقرير ناقصة!" });
    }

    const user = await getUserByEmployeeCode(employeeCode);
    if (!user) {
      return res.status(404).json({ message: "الموظف غير موجود!" });
    }

    const fromDate = new Date(startDate);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(endDate);
    toDate.setHours(23, 59, 59, 999);

    const leaves = await LeaveRequest.find({
      employeeId: user._id,
      status: "approved",
      startDate: { $gte: fromDate },
      endDate: { $lte: toDate },
    }).sort({ startDate: 1 });

    const summary = { annual: 0, casual: 0, compensation: 0 };
    leaves.forEach((leave) => {
      if (summary[leave.leaveType] !== undefined) {
        summary[leave.leaveType] += leave.duration;
      }
    });

    res.status(200).json({
      message: "تم استخراج التقرير بنجاح.",
      employeeName: user.name,
      period: { from: startDate, to: endDate },
      totalConsumedDays: summary,
      detailedLeaves: leaves,
    });
  } catch (error) {
    res.status(500).json({
      message: "خطأ أثناء استخراج التقرير",
      error: error.message,
    });
  }
};

// تحديث البريد الإلكتروني
exports.updateEmail = async (req, res) => {
  try {
    const { code } = req.params;
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "برجاء إدخال البريد الإلكتروني" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { employeeCode: code },
      { email: email.trim().toLowerCase() },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }

    res.status(200).json({
      message: "تم حفظ البريد الإلكتروني بنجاح",
      employee: updatedUser,
    });
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({
      message: "حدث خطأ في السيرفر أثناء تحديث الإيميل",
    });
  }
};

// حفظ Expo Push Token للموظف عند تسجيل الدخول أو تشغيل التطبيق
exports.savePushToken = async (req, res) => {
  try {
    const { employeeCode, expoPushToken } = req.body;
    if (!employeeCode || !expoPushToken) {
      return res.status(400).json({
        message: "employeeCode and expoPushToken are required",
      });
    }

    const user = await User.findOne({ employeeCode });
    if (!user) {
      return res.status(404).json({
        message: "الموظف غير موجود",
      });
    }

    if (!user.expoPushTokens) {
      user.expoPushTokens = [];
    }

    // إضافة التوكن فقط إذا لم يكن مسجلاً مسبقاً (لمنع التكرار)
    if (!user.expoPushTokens.includes(expoPushToken)) {
      user.expoPushTokens.push(expoPushToken);
      await user.save();
    }

    return res.status(200).json({
      message: "تم حفظ توكن الإشعارات بنجاح",
      expoPushTokens: user.expoPushTokens,
    });
  } catch (error) {
    console.error("Save push token error:", error);
    return res.status(500).json({
      message: "حدث خطأ أثناء حفظ توكن الإشعارات",
      error: error.message,
    });
  }
};

// ✅ جديد: حذف توكن الإشعارات عند تسجيل الخروج
exports.removePushToken = async (req, res) => {
  try {
    const { employeeCode } = req.body;
    if (!employeeCode) {
      return res.status(400).json({
        message: "employeeCode is required",
      });
    }

    const user = await User.findOne({ employeeCode });
    if (!user) {
      return res.status(404).json({
        message: "الموظف غير موجود",
      });
    }

    // تصفير مصفوفة الإشعارات عند خروج المستخدم لمنع وصول الإشعارات للجهاز بعد تسجيل الخروج
    user.expoPushTokens = [];
    await user.save();

    return res.status(200).json({
      message: "تم حذف توكن الإشعارات بنجاح",
    });
  } catch (error) {
    console.error("Remove push token error:", error);
    return res.status(500).json({
      message: "حدث خطأ أثناء إزالة توكن الإشعارات",
      error: error.message,
    });
  }
};
