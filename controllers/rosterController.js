const User = require("../models/User");
const LeaveRequest = require("../models/LeaveRequest");
const Roster = require("../models/Roster");
const sendEmail = require("../utils/sendEmail");

/* =========================
   Helpers
========================= */

const isMapLike = (value) => {
  return (
    value &&
    typeof value.get === "function" &&
    typeof value.entries === "function"
  );
};

const getRosterEntries = (details) => {
  if (!details) return [];
  return isMapLike(details)
    ? Array.from(details.entries())
    : Object.entries(details);
};

const getRosterDay = (details, dayNumber) => {
  if (!details) return null;

  if (isMapLike(details)) {
    return details.get(String(dayNumber)) || details.get(dayNumber) || null;
  }

  return details?.[dayNumber] || details?.[String(dayNumber)] || null;
};

/* =========================
   1) جلب بيانات التهيئة
========================= */

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

/* =========================
   2) حفظ الروستر
========================= */

exports.saveRoster = async (req, res) => {
  try {
    const month = Number(req.body.month);
    const year = Number(req.body.year);
    const { status, rosterDetails } = req.body;

    if (!month || !year || !rosterDetails) {
      return res.status(400).json({
        success: false,
        message: "بيانات غير مكتملة",
      });
    }

    const existingRoster = await Roster.findOne({ month, year });
    const isUpdate = existingRoster && existingRoster.status === "published";

    // تنظيف البيانات قبل الحفظ
    for (const day in rosterDetails) {
      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        if (rosterDetails[day][shiftKey]) {
          if (rosterDetails[day][shiftKey].leader === "") {
            rosterDetails[day][shiftKey].leader = null;
          }

          if (Array.isArray(rosterDetails[day][shiftKey].members)) {
            rosterDetails[day][shiftKey].members = rosterDetails[day][
              shiftKey
            ].members.map((member) => (member === "" ? null : member));
          }
        }
      });
    }

    const roster = await Roster.findOneAndUpdate(
      { month, year },
      { status, details: rosterDetails },
      { new: true, upsert: true },
    );

    // إرسال إيميلات لو الجدول معتمد
    if (status === "published") {
      const uniqueUserIds = new Set();

      for (const day in rosterDetails) {
        ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
          const shift = rosterDetails[day][shiftKey];

          if (shift) {
            if (shift.leader) {
              uniqueUserIds.add(shift.leader.toString());
            }

            if (Array.isArray(shift.members)) {
              shift.members.forEach((member) => {
                if (member) uniqueUserIds.add(member.toString());
              });
            }
          }
        });
      }

      const usersToNotify = await User.find({
        _id: { $in: Array.from(uniqueUserIds) },
      }).select("email name");

      const subject = isUpdate
        ? `تعديل في جدول ورديات شهر ${month}/${year}`
        : `نشر جدول ورديات شهر ${month}/${year}`;

      const message = isUpdate
        ? `عزيزي الموظف،\n\nتم إجراء تعديلات على جدول وردياتك لشهر ${month}/${year}. برجاء مراجعة النظام لمعرفة مواعيدك الجديدة.`
        : `عزيزي الموظف،\n\nتم اعتماد ونشر جدول الورديات لشهر ${month}/${year}. يمكنك الآن الدخول للنظام لمعرفة أيام عملك.`;

      usersToNotify.forEach((user) => {
        if (user.email) {
          sendEmail(user.email, subject, message).catch((err) =>
            console.error(`فشل إرسال الإيميل لـ ${user.email}:`, err),
          );
        }
      });
    }

    return res.status(200).json({
      success: true,
      message:
        status === "published"
          ? "تم اعتماد ونشر الجدول بنجاح!"
          : "تم حفظ المسودة بنجاح",
      roster,
    });
  } catch (error) {
    console.error("Error saving roster:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء الحفظ",
    });
  }
};

/* =========================
   3) ورديات موظف محدد
========================= */

exports.getMyShifts = async (req, res) => {
  try {
    const employeeId = String(req.query.employeeId || "");
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "برجاء إرسال بيانات الموظف والشهر والسنة",
      });
    }

    const roster = await Roster.findOne({ month, year, status: "published" });

    if (!roster) {
      return res.status(200).json({
        success: true,
        shifts: [],
        message: "لا يوجد جدول معتمد لهذا الشهر حتى الآن",
      });
    }

    const myShifts = [];
    const userIdsToFetch = new Set();

    const dayEntries = getRosterEntries(roster.details);

    for (const [day, dayData] of dayEntries) {
      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const shift = dayData?.[shiftKey];
        if (!shift) return;

        const isLeader = shift.leader && shift.leader.toString() === employeeId;

        const isMember =
          Array.isArray(shift.members) &&
          shift.members.some((m) => m && m.toString() === employeeId);

        if (isLeader || isMember) {
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

          if (shift.leader) {
            userIdsToFetch.add(shift.leader.toString());
          }

          if (Array.isArray(shift.members)) {
            shift.members.forEach((m) => {
              if (m) userIdsToFetch.add(m.toString());
            });
          }
        }
      });
    }

    const users = await User.find({
      _id: { $in: Array.from(userIdsToFetch) },
    }).select("name");

    const userNames = {};
    users.forEach((u) => {
      userNames[u._id.toString()] = u.name;
    });

    const formattedShifts = myShifts.map((shift) => {
      const allMemberIds = shift.memberIds || [];
      const allUserIds = [shift.leaderId, ...allMemberIds].filter(Boolean);

      const members = allUserIds.map((id) => {
        const idStr = id.toString();
        const isLeader = shift.leaderId && shift.leaderId.toString() === idStr;
        return {
          name: userNames[idStr] || "غير محدد",
          role: isLeader ? "رئيس نوبة" : "فرد نوبة",
        };
      });

      return {
        day: shift.day,
        shiftName: shift.shiftName,
        role: shift.role,
        leaderName: shift.leaderId
          ? userNames[shift.leaderId.toString()] || "غير محدد"
          : "غير محدد",
        teamNames: (shift.memberIds || [])
          .map((id) => (id ? userNames[id.toString()] || null : null))
          .filter(Boolean),
        members,
      };
    });

    formattedShifts.sort((a, b) => a.day - b.day);

    return res.status(200).json({
      success: true,
      shifts: formattedShifts,
    });
  } catch (error) {
    console.error("Error fetching my shifts:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الجدول",
    });
  }
};

/* =========================
   4) الروستر المعتمد الكامل
========================= */

exports.getPublishedFullRoster = async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "برجاء تحديد الشهر والسنة",
      });
    }

    const roster = await Roster.findOne({ month, year, status: "published" });

    if (!roster) {
      return res.status(200).json({
        success: true,
        days: [],
        message: "لا يوجد جدول معتمد لهذا الشهر حتى الآن",
      });
    }

    const detailsEntries = getRosterEntries(roster.details);

    const userIds = new Set();

    detailsEntries.forEach(([, dayData]) => {
      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const shift = dayData?.[shiftKey];
        if (!shift) return;

        if (shift.leader) {
          userIds.add(shift.leader.toString());
        }

        if (Array.isArray(shift.members)) {
          shift.members.forEach((member) => {
            if (member) userIds.add(member.toString());
          });
        }
      });
    });

    const users = await User.find({
      _id: { $in: Array.from(userIds) },
    }).select("name");

    const userNames = {};
    users.forEach((u) => {
      userNames[u._id.toString()] = u.name;
    });

    const weekDays = [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ];

    const daysCount = new Date(year, month, 0).getDate();

    const mapShift = (shift) => {
      return {
        leaderName: shift?.leader
          ? userNames[shift.leader.toString()] || "—"
          : "—",
        memberNames: Array.isArray(shift?.members)
          ? shift.members
              .map((id) => (id ? userNames[id.toString()] || null : null))
              .filter(Boolean)
          : [],
      };
    };

    const days = Array.from({ length: daysCount }, (_, i) => {
      const dayNumber = i + 1;
      const dateObj = new Date(year, month - 1, dayNumber);
      const dayData = getRosterDay(roster.details, dayNumber);

      return {
        dayNumber,
        dayName: weekDays[dateObj.getDay()],
        shift1: mapShift(dayData?.shift1),
        shift2: mapShift(dayData?.shift2),
        shift3: mapShift(dayData?.shift3),
        notes: dayData?.notes || "",
      };
    });

    return res.status(200).json({
      success: true,
      month,
      year,
      days,
    });
  } catch (error) {
    console.error("Error fetching published full roster:", error);
    return res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الروستر المعتمد",
    });
  }
};

/* =========================
   5) إنشاء الروستر تلقائياً (Auto-Scheduler)
========================= */

exports.generateAutoRoster = async (req, res) => {
  try {
    const month = Number(req.body.month);
    const year = Number(req.body.year);
    const config = req.body.config || {};
    const workGroups = req.body.workGroups || [];
    const reserveEmployeeIds = req.body.reserveEmployeeIds || [];
    const reserveSet = new Set(reserveEmployeeIds.map(id => id.toString()));

    const ignorePendingLeaves = config.ignorePendingLeaves === true;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: "برجاء تحديد الشهر والسنة" });
    }

    if (!workGroups || workGroups.length === 0) {
      return res.status(400).json({ success: false, message: "لا يوجد مجموعات عمل. يرجى إنشاء مجموعات عمل أولاً." });
    }

    // 1. Fetch Leaves with employee names
    const leaveStatuses = ignorePendingLeaves ? ["approved"] : ["approved", "pending"];
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const LeaveRequest = require("../models/LeaveRequest");
    const Roster = require("../models/Roster");
    
    const leaves = await LeaveRequest.find({
      status: { $in: leaveStatuses },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).populate("employeeId", "name");

    const daysCount = new Date(year, month, 0).getDate();
    const rosterDetails = {};

    // 2. Determine previous month
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevRoster = await Roster.findOne({ month: prevMonth, year: prevYear });
    const prevDaysCount = new Date(prevYear, prevMonth, 0).getDate();

    const groupStates = workGroups.map((g, index) => {
      let initialState = index % 5; 

      if (prevRoster && prevRoster.details) {
        let found = false;
        for (let d = prevDaysCount; d >= 1 && !found; d--) {
          const dayData = prevRoster.details.get ? prevRoster.details.get(String(d)) : prevRoster.details[d];
          if (!dayData) continue;

          const groupMembersStr = new Set([
            g.leaderId?.toString(),
            ...(g.memberIds || []).map(id => id?.toString())
          ].filter(Boolean));

          const checkShift = (shiftKey, stateVal) => {
            if (!dayData[shiftKey]) return false;
            const shiftMembers = [
              dayData[shiftKey].leader?.toString(),
              ...(dayData[shiftKey].members || []).map(id => id?.toString())
            ].filter(Boolean);

            const isGroupInShift = shiftMembers.some(id => groupMembersStr.has(id));
            if (isGroupInShift) {
              const diffToDay1 = prevDaysCount - d + 1;
              initialState = (stateVal + diffToDay1) % 5;
              found = true;
              return true;
            }
            return false;
          };

          checkShift('shift1', 0);
          if (found) break;
          checkShift('shift2', 1);
          if (found) break;
          checkShift('shift3', 2);
        }
      }

      return {
        group: g,
        initialState
      };
    });

    for (let day = 1; day <= daysCount; day++) {
      const currentDate = new Date(year, month - 1, day);

      const employeesOnLeave = new Set();
      const leaveNotes = [];

      leaves.forEach(leave => {
        const lStart = new Date(leave.startDate).setHours(0,0,0,0);
        const lEnd = new Date(leave.endDate).setHours(23,59,59,999);
        const currTime = currentDate.getTime();
        
        if (currTime >= lStart && currTime <= lEnd) {
          const empId = leave.employeeId && leave.employeeId._id ? leave.employeeId._id.toString() : leave.employeeId.toString();
          employeesOnLeave.add(empId);
          
          if (leave.employeeId && leave.employeeId.name) {
            const statusText = leave.status === 'pending' ? ' (معلقة)' : '';
            leaveNotes.push(leave.employeeId.name + statusText);
          }
        }
      });

      if (day === 4) console.log('DAY 4 NOTES:', leaveNotes); rosterDetails[day] = {
        shift1: { leader: null, members: [] },
        shift2: { leader: null, members: [] },
        shift3: { leader: null, members: [] },
        notes: leaveNotes.length > 0 ? "إجازات اليوم: " + leaveNotes.join("، ") : ""
      };

      groupStates.forEach(({ group, initialState }) => {
        const currentState = (initialState + day - 1) % 5;
        let targetShift = null;

        if (currentState === 0) targetShift = "shift1";
        else if (currentState === 1) targetShift = "shift2";
        else if (currentState === 2) targetShift = "shift3";

        if (targetShift) {
          if (group.leaderId && !employeesOnLeave.has(group.leaderId.toString())) {
            rosterDetails[day][targetShift].leader = group.leaderId;
          }

          const availableMembers = (group.memberIds || []).filter(
            id => id && !employeesOnLeave.has(id.toString()) && !reserveSet.has(id.toString())
          );

          rosterDetails[day][targetShift].members.push(...availableMembers);
        }
      });
    }

    return res.status(200).json({
      success: true,
      rosterDetails,
      message: "تم توليد الجدول التلقائي بنجاح!"
    });

  } catch (error) {
    console.error("Error generating auto roster:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء الإنشاء التلقائي" });
  }
};




exports.fillEmptyRoster = async (req, res) => {
  try {
    const { month, year, rosterDetails, reserveEmployeeIds, config } = req.body;
    if (!month || !year || !rosterDetails || !reserveEmployeeIds) {
      return res.status(400).json({ success: false, message: "بيانات غير مكتملة لتعبئة الفراغات" });
    }

    const membersPerShift = config?.membersPerShift || 1;
    const daysCount = new Date(year, month, 0).getDate();

    const LeaveRequest = require("../models/LeaveRequest");
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    const leaves = await LeaveRequest.find({
      status: { $in: ["approved", "pending"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });

    const reserveShiftCounts = {};
    reserveEmployeeIds.forEach(id => { reserveShiftCounts[id] = 0; });

    for (let day = 1; day <= daysCount; day++) {
      const dayData = rosterDetails[String(day)];
      if (!dayData) continue;
      ['shift1', 'shift2', 'shift3'].forEach(shiftKey => {
        if (!dayData[shiftKey]) return;
        const members = dayData[shiftKey].members || [];
        members.forEach(mId => {
          if (mId && reserveShiftCounts.hasOwnProperty(mId.toString())) {
            reserveShiftCounts[mId.toString()]++;
          }
        });
      });
    }

    for (let day = 1; day <= daysCount; day++) {
      const currentDate = new Date(year, month - 1, day);
      const currTime = currentDate.getTime();
      const dayData = rosterDetails[String(day)];
      if (!dayData) continue;

      const reserveOnLeaveToday = new Set();
      leaves.forEach(leave => {
        const lStart = new Date(leave.startDate).setHours(0,0,0,0);
        const lEnd = new Date(leave.endDate).setHours(23,59,59,999);
        if (currTime >= lStart && currTime <= lEnd) {
          const empId = leave.employeeId && leave.employeeId._id ? leave.employeeId._id.toString() : leave.employeeId.toString();
          if (reserveShiftCounts.hasOwnProperty(empId)) {
            reserveOnLeaveToday.add(empId);
          }
        }
      });

      const employeesWorkingToday = new Set();
      ['shift1', 'shift2', 'shift3'].forEach(shiftKey => {
        if (!dayData[shiftKey]) return;
        if (dayData[shiftKey].leader) employeesWorkingToday.add(dayData[shiftKey].leader.toString());
        (dayData[shiftKey].members || []).forEach(mId => employeesWorkingToday.add(mId.toString()));
      });

      ['shift1', 'shift2', 'shift3'].forEach(shiftKey => {
        if (!dayData[shiftKey]) return;
        
        const actualMembers = (dayData[shiftKey].members || []).filter(Boolean);
        const missingCount = membersPerShift - actualMembers.length;

        if (missingCount > 0) {
          for (let i = 0; i < missingCount; i++) {
            const eligibleReserves = reserveEmployeeIds.filter(id => {
              const strId = id.toString();
              return !reserveOnLeaveToday.has(strId) && !employeesWorkingToday.has(strId);
            });

            if (eligibleReserves.length > 0) {
              eligibleReserves.sort((a, b) => reserveShiftCounts[a.toString()] - reserveShiftCounts[b.toString()]);
              
              const chosenOne = eligibleReserves[0];
              const chosenStr = chosenOne.toString();
              
              dayData[shiftKey].members = actualMembers; dayData[shiftKey].members.push(chosenOne);
              employeesWorkingToday.add(chosenStr);
              reserveShiftCounts[chosenStr]++;
            }
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      rosterDetails,
      message: "تم ملء الفراغات المتبقية بنجاح باستخدام الاحتياطي"
    });

  } catch (error) {
    console.error("Error filling empty roster gaps:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء تعبئة الفراغات" });
  }
};
