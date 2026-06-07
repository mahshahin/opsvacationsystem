const User = require("../models/User"); // تأكد من اسم موديل الموظفين
const LeaveRequest = require("../models/LeaveRequest");
const Roster = require("../models/Roster"); // استدعاء موديل الروستر الجديد
const sendEmail = require("../utils/sendEmail"); // 📧 استدعاء دالة النودميلر

// 1. دالة جلب التهيئة (بقت بتجيب الموظفين + الإجازات + الجدول لو محفوظ)
exports.getRosterInitData = async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "برجاء تحديد الشهر والسنة",
      });
    }

    const employees = await User.find({
      role: "employee",
      workType: "شيفت",
    }).select("name employeeCode _id workType");

    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const leaves = await LeaveRequest.find({
      status: { $in: ["approved", "pending"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).populate("employeeId", "name _id");

    const existingRoster = await Roster.findOne({ month, year });

    console.log("month/year:", month, year);
    console.log("employees count:", employees.length);
    console.log("leaves count:", leaves.length);

    return res.status(200).json({
      success: true,
      employees,
      leaves,
      existingRoster,
    });
  } catch (error) {
    console.error("Error fetching init data:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ في السيرفر",
    });
  }
};

// 2. دالة الحفظ الذكية (للمسودة أو الاعتماد أو التعديل)
exports.saveRoster = async (req, res) => {
  try {
    const { month, year, status, rosterDetails } = req.body;

    if (!month || !year || !rosterDetails) {
      return res
        .status(400)
        .json({ success: false, message: "بيانات غير مكتملة" });
    }

    // 🔍 خطوة ذكية: نعرف ده جدول جديد ولا تعديل عشان نحدد صيغة الإيميل؟
    const existingRoster = await Roster.findOne({ month, year });
    const isUpdate = existingRoster && existingRoster.status === "published";

    // 🛡️ الدرع الواقي: تنظيف البيانات في الباك إند قبل الحفظ 🛡️
    // بنلف على كل يوم وكل نوبة، وأي خانة فاضية بنخليها null عشان Mongoose ترضى بيها
    for (const day in rosterDetails) {
      ["shift1", "shift2", "shift3"].forEach((shift) => {
        if (rosterDetails[day][shift]) {
          // تنظيف رئيس النوبة
          if (rosterDetails[day][shift].leader === "") {
            rosterDetails[day][shift].leader = null;
          }
          // تنظيف أفراد النوبة
          if (Array.isArray(rosterDetails[day][shift].members)) {
            rosterDetails[day][shift].members = rosterDetails[day][
              shift
            ].members.map((member) => (member === "" ? null : member));
          }
        }
      });
    }

    // دلوقتي الداتا بقت نظيفة 100% وجاهزة للحفظ
    const roster = await Roster.findOneAndUpdate(
      { month, year },
      { status, details: rosterDetails },
      { returnDocument: "after", upsert: true },
    );

    // 📧 إرسال الإيميلات في الخلفية لو الجدول "أعتمد" (مش مسودة)
    if (status === "published") {
      // نجمع الـ IDs بتاعة الموظفين اللي في الجدول ده بدون تكرار
      const uniqueUserIds = new Set();
      for (const day in rosterDetails) {
        ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
          const shift = rosterDetails[day][shiftKey];
          if (shift) {
            if (shift.leader) uniqueUserIds.add(shift.leader.toString());
            if (Array.isArray(shift.members)) {
              shift.members.forEach((member) => {
                if (member) uniqueUserIds.add(member.toString());
              });
            }
          }
        });
      }

      // نجيب إيميلات الموظفين دول من الداتابيز
      const usersToNotify = await User.find({
        _id: { $in: Array.from(uniqueUserIds) },
      }).select("email name");

      // نحدد عنوان ونص الإيميل بناءً على هو جديد ولا تعديل
      const subject = isUpdate
        ? `تعديل في جدول ورديات شهر ${month}/${year}`
        : `نشر جدول ورديات شهر ${month}/${year}`;
      const message = isUpdate
        ? `عزيزي الموظف،\n\nتم إجراء تعديلات على جدول وردياتك لشهر ${month}/${year}. برجاء مراجعة النظام لمعرفة مواعيدك الجديدة.`
        : `عزيزي الموظف،\n\nتم اعتماد ونشر جدول الورديات لشهر ${month}/${year}. يمكنك الآن الدخول للنظام لمعرفة أيام عملك.`;

      // نبعت الإيميلات في الخلفية من غير await
      usersToNotify.forEach((user) => {
        if (user.email) {
          sendEmail(user.email, subject, message).catch((err) =>
            console.error(`فشل إرسال الإيميل لـ ${user.email}:`, err),
          );
        }
      });
    }

    res.status(200).json({
      success: true,
      message:
        status === "published"
          ? "تم اعتماد ونشر الجدول بنجاح!"
          : "تم حفظ المسودة بنجاح",
      roster,
    });
  } catch (error) {
    console.error("Error saving roster:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء الحفظ" });
  }
};

// 3. دالة جلب ورديات موظف محدد (شاشة الموظف)
exports.getMyShifts = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "برجاء إرسال بيانات الموظف والشهر والسنة",
      });
    }

    // 1. نجيب الجدول "المعتمد" فقط للشهر والسنة دي
    const roster = await Roster.findOne({ month, year, status: "published" });

    if (!roster) {
      // لو مفيش جدول معتمد، نرجع مصفوفة فاضية عشان الفرونت إند يكتب "لا يوجد جدول معتمد"
      return res.status(200).json({
        success: true,
        shifts: [],
        message: "لا يوجد جدول معتمد لهذا الشهر حتى الآن",
      });
    }

    // 2. هندور جوه أيام الشهر على شفتات الموظف ده
    const myShifts = [];
    const userIdsToFetch = new Set(); // بنجمع هنا كل الـ IDs بتاعة زمايله عشان نجيب أساميهم مرة واحدة

    // roster.details.entries() بتلف على كل يوم في الجدول
    for (const [day, dayData] of roster.details.entries()) {
      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const shift = dayData[shiftKey];
        if (!shift) return;

        // هل الموظف ده رئيس النوبة دي؟
        const isLeader = shift.leader && shift.leader.toString() === employeeId;

        // أو هل هو فرد من أفراد النوبة دي؟
        const isMember =
          shift.members &&
          shift.members.some((m) => m && m.toString() === employeeId);

        if (isLeader || isMember) {
          // لو لقيناه، نسجل تفاصيل النوبة
          myShifts.push({
            day: Number(day),
            shiftName:
              shiftKey === "shift1"
                ? "الأولى (06:30 إلى 14:30)"
                : shiftKey === "shift2"
                  ? "الثانية (14:30 إلى 22:30)"
                  : "الثالثة (22:30 إلى 06:30)",
            role: isLeader ? "رئيس نوبة" : "فرد نوبة",
            leaderId: shift.leader,
            memberIds: shift.members || [],
          });

          // نحفظ الـ IDs بتاعة الطاقم كله عشان نجيب أساميهم من الداتابيز
          if (shift.leader) userIdsToFetch.add(shift.leader.toString());
          if (shift.members)
            shift.members.forEach((m) => m && userIdsToFetch.add(m.toString()));
        }
      });
    }

    // 3. نجيب أسماء الطاقم من الداتابيز بخبطة واحدة
    const users = await User.find({
      _id: { $in: Array.from(userIdsToFetch) },
    }).select("name");

    // نعمل قاموس (Dictionary) سريع يربط الـ ID بالاسم
    const userNames = {};
    users.forEach((u) => {
      userNames[u._id.toString()] = u.name;
    });

    // 4. نركب الأسماء جوه الشفتات بدل الـ IDs
    const formattedShifts = myShifts.map((shift) => ({
      day: shift.day,
      shiftName: shift.shiftName,
      role: shift.role,
      leaderName: shift.leaderId
        ? userNames[shift.leaderId.toString()]
        : "غير محدد",
      teamNames: shift.memberIds
        .map((id) => (id ? userNames[id.toString()] : null))
        .filter(Boolean),
    }));

    // نرتبهم من أول يوم في الشهر لآخره
    formattedShifts.sort((a, b) => a.day - b.day);

    res.status(200).json({ success: true, shifts: formattedShifts });
  } catch (error) {
    console.error("Error fetching my shifts:", error);
    res
      .status(500)
      .json({ success: false, message: "حدث خطأ أثناء جلب الجدول" });
  }
};
