import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AdminLayout from "./components/AdminLayout";
import toast from "react-hot-toast";
import "./print.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const monthNames = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const weekDays = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const shiftLabels = { shift1: "الأولى", shift2: "الثانية", shift3: "الثالثة" };

const shiftThemes = {
  shift1: {
    header: "bg-sky-600 text-white",
    subHeader: "bg-sky-500 text-white",
    cell: "bg-sky-50/60",
    button:
      "border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-300 focus:ring-2 focus:ring-sky-100",
  },
  shift2: {
    header: "bg-emerald-600 text-white",
    subHeader: "bg-emerald-500 text-white",
    cell: "bg-emerald-50/60",
    button:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 focus:ring-2 focus:ring-emerald-100",
  },
  shift3: {
    header: "bg-violet-600 text-white",
    subHeader: "bg-violet-500 text-white",
    cell: "bg-violet-50/60",
    button:
      "border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-300 focus:ring-2 focus:ring-violet-100",
  },
};

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;
const yearOptions = [currentYear, currentYear - 1];

const createEmptyRoster = (selectedMonth, selectedYear) => {
  const daysCount = new Date(selectedYear, selectedMonth, 0).getDate();
  const initialRoster = {};
  for (let d = 1; d <= daysCount; d++) {
    initialRoster[d] = {
      shift1: { leader: "", members: ["", "", ""] },
      shift2: { leader: "", members: ["", "", ""] },
      shift3: { leader: "", members: ["", "", ""] },
      notes: "",
    };
  }
  return initialRoster;
};

const normalizeRosterData = (details, selectedMonth, selectedYear) => {
  const base = createEmptyRoster(selectedMonth, selectedYear);
  if (!details) return base;
  Object.keys(base).forEach((day) => {
    const sourceDay = details?.[day];
    if (!sourceDay) return;
    base[day] = {
      shift1: {
        leader: sourceDay.shift1?.leader || "",
        members: [
          sourceDay.shift1?.members?.[0] || "",
          sourceDay.shift1?.members?.[1] || "",
          sourceDay.shift1?.members?.[2] || "",
        ],
      },
      shift2: {
        leader: sourceDay.shift2?.leader || "",
        members: [
          sourceDay.shift2?.members?.[0] || "",
          sourceDay.shift2?.members?.[1] || "",
          sourceDay.shift2?.members?.[2] || "",
        ],
      },
      shift3: {
        leader: sourceDay.shift3?.leader || "",
        members: [
          sourceDay.shift3?.members?.[0] || "",
          sourceDay.shift3?.members?.[1] || "",
          sourceDay.shift3?.members?.[2] || "",
        ],
      },
      notes: sourceDay.notes || "",
    };
  });
  return base;
};

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

const getSlotKey = (shift, role, memberIndex = null) =>
  `${shift}-${role}-${memberIndex ?? "x"}`;

const getSlotLabel = (shift, role, memberIndex = null) => {
  if (role === "leader") return `${shiftLabels[shift]} - رئيس النوبة`;
  return `${shiftLabels[shift]} - فرد ${Number(memberIndex) + 1}`;
};

const EmployeeDropdown = ({
  employees,
  value,
  onChange,
  dayNum,
  getEmployeeAlert,
  getEmployeeDayUsage,
  currentShift,
  currentRole,
  currentMemberIndex,
  shiftTheme,
  placeholder = "اختر موظف",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  const selectedEmp = employees.find(
    (emp) => String(emp._id) === String(value),
  );

  const selectedAlert = value ? getEmployeeAlert(value, dayNum) : null;
  const selectedUsage = value
    ? getEmployeeDayUsage(
        dayNum,
        value,
        currentShift,
        currentRole,
        currentMemberIndex,
      )
    : null;

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const name = String(emp.name || "").toLowerCase();
      const code = String(emp.employeeCode || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [employees, search]);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  let buttonClass =
    shiftTheme?.button ||
    "border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-blue-100";

  if (selectedUsage?.isUsedElsewhere) {
    buttonClass =
      "border-purple-300 bg-purple-50 text-purple-800 hover:border-purple-400 focus:ring-2 focus:ring-purple-100";
  } else if (selectedAlert) {
    buttonClass = selectedAlert.buttonClass;
  }

  return (
    <>
      <div className="relative no-print" ref={wrapperRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex h-8 w-full items-center justify-between gap-2 rounded-md border px-2 text-[11px] font-semibold shadow-sm outline-none transition ${buttonClass}`}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {selectedUsage?.isUsedElsewhere ? (
              <span className="text-xs">⚠️</span>
            ) : selectedAlert ? (
              <span className="text-xs">🌴</span>
            ) : null}
            <span className="truncate">
              {selectedEmp ? selectedEmp.name : placeholder}
            </span>
          </div>
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <div className="mt-1 flex flex-wrap gap-1">
          {selectedAlert && (
            <div
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${selectedAlert.badgeClass}`}
            >
              <span>🌴</span>
              <span>{selectedAlert.badgeText}</span>
            </div>
          )}
          {selectedUsage?.isUsedElsewhere && (
            <div className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
              <span>⚠️</span>
              <span>مكرر في نفس اليوم</span>
            </div>
          )}
        </div>

        {open && (
          <div className="absolute right-0 top-full z-[90] mt-1.5 w-[300px] rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الكود..."
              autoFocus
              className="mb-2 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
                setSearch("");
              }}
              className={`mb-2 flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-right text-[11px] font-semibold transition ${
                !value
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>بدون اختيار</span>
              {!value && <span>✓</span>}
            </button>

            <div className="max-h-64 space-y-1 overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="rounded-lg bg-slate-50 px-3 py-4 text-center text-[11px] font-semibold text-slate-500">
                  لا توجد نتائج
                </div>
              ) : (
                filteredEmployees.map((emp) => {
                  const alert = getEmployeeAlert(emp._id, dayNum);
                  const usage = getEmployeeDayUsage(
                    dayNum,
                    emp._id,
                    currentShift,
                    currentRole,
                    currentMemberIndex,
                  );
                  const isSelected = String(emp._id) === String(value);
                  const disabled = usage?.isUsedElsewhere;

                  return (
                    <button
                      key={emp._id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        onChange(emp._id);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full rounded-lg border px-2.5 py-2 text-right transition ${
                        disabled
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
                          : isSelected
                            ? "border-blue-300 bg-blue-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[11px] font-bold text-slate-800">
                            {emp.name}
                          </div>
                          <div className="mt-0.5 text-[10px] font-medium text-slate-500">
                            كود: {emp.employeeCode || "—"}
                          </div>
                          {usage?.isUsedElsewhere && (
                            <div className="mt-1 text-[10px] font-bold text-purple-700">
                              مستخدم في: {usage.label}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {alert && (
                            <span
                              className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${alert.badgeClass}`}
                            >
                              {alert.badgeText}
                            </span>
                          )}
                          {usage?.isUsedElsewhere && (
                            <span className="rounded-full border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-700">
                              مكرر
                            </span>
                          )}
                          {isSelected && !disabled && (
                            <span className="text-xs font-black text-blue-600">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <span className="print-only print-cell-text">
        {selectedEmp ? selectedEmp.name : "—"}
      </span>
    </>
  );
};

const RosterManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [rosterStatus, setRosterStatus] = useState(null);
  const [rosterData, setRosterData] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ جديد: نافذة التحقق قبل الاعتماد
  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    errors: [], // الأيام/الشيفتات الناقصة (تمنع الاعتماد)
    unscheduled: [], // الموظفون غير المجدولين
  });

  const handlePrint = () => {
    window.print();
  };

  // ✅ جديد: التحقق من اكتمال الروستر قبل الاعتماد
  const validateRoster = () => {
    const errors = [];

    // 1) فحص كل يوم/شيفت: لازم رئيس نوبة + فرد واحد على الأقل
    daysInMonth.forEach((day) => {
      const dayData = rosterData[day.dayNumber];
      if (!dayData) return;

      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const shiftData = dayData[shiftKey] || {};
        const hasLeader = !!normalizeId(shiftData.leader);
        const membersCount = (shiftData.members || []).filter(
          (m) => !!normalizeId(m),
        ).length;

        const problems = [];
        if (!hasLeader) problems.push("بدون رئيس نوبة");
        if (membersCount < 1) problems.push("بدون أفراد");

        if (problems.length > 0) {
          errors.push({
            day: day.dayNumber,
            dayName: day.dayName,
            shift: shiftLabels[shiftKey],
            problems: problems.join(" و "),
          });
        }
      });
    });

    // 2) فحص الموظفين غير المجدولين (مع استثناء من في إجازة طوال الشهر)
    const scheduledIds = new Set();
    Object.values(rosterData).forEach((dayData) => {
      if (!dayData) return;
      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const s = dayData[shiftKey] || {};
        if (s.leader) scheduledIds.add(normalizeId(s.leader));
        (s.members || []).forEach((m) => {
          if (m) scheduledIds.add(normalizeId(m));
        });
      });
    });

    const unscheduled = employees
      .filter((emp) => {
        // استثناء المديرين (لا يُجدولون عادةً)
        if (emp.role === "admin") return false;
        const id = normalizeId(emp._id);
        if (scheduledIds.has(id)) return false;
        // لو الموظف في إجازة طوال أيام الشهر، لا نعتبره "منسياً"
        const onLeaveAllMonth = daysInMonth.every(
          (day) => !!getEmployeeAlert(emp._id, day.dayNumber),
        );
        return !onLeaveAllMonth;
      })
      .map((emp) => ({
        name: emp.name,
        code: emp.employeeCode || "—",
      }));

    return { errors, unscheduled };
  };

  const handleSaveRoster = async (status) => {
    // ✅ التحقق يُطبّق فقط عند الاعتماد/النشر (المسودة تُحفظ دون تحقق)
    if (status === "published") {
      const { errors, unscheduled } = validateRoster();

      // 🔍 تشخيص مؤقت — افتح Console (F12) وشوف الأرقام دي عند الضغط على اعتماد
      console.log("🔍 [تحقق الروستر] عدد الأخطاء:", errors.length);
      console.log("🔍 [تحقق الروستر] الأخطاء:", errors);
      console.log(
        "🔍 [تحقق الروستر] غير المجدولين:",
        unscheduled.length,
        unscheduled,
      );
      console.log("🔍 [تحقق الروستر] عدد أيام الشهر:", daysInMonth.length);
      console.log("🔍 [تحقق الروستر] عدد الموظفين:", employees.length);

      if (errors.length > 0) {
        setValidationModal({ isOpen: true, errors, unscheduled });
        return; // يمنع الاعتماد
      }
      // لا أخطاء حاجزة، لكن نعرض تنبيه الموظفين غير المجدولين (إن وُجد) للتأكيد
      if (unscheduled.length > 0) {
        setValidationModal({ isOpen: true, errors: [], unscheduled });
        return;
      }
    }

    await saveRosterToServer(status);
  };

  // الحفظ الفعلي للسيرفر (يُستدعى مباشرة أو بعد التأكيد من النافذة)
  const saveRosterToServer = async (status) => {
    const payload = { month, year, status, rosterDetails: rosterData };
    try {
      // ✅ إصلاح fetch (كان tagged template خاطئ)
      const response = await fetch(`${API_URL}/api/roster/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(result.message || "تم الحفظ بنجاح");
        setRosterStatus(status);
      } else {
        toast.error(result.message || "فشل حفظ الروستر");
      }
    } catch (error) {
      console.error("Error saving roster:", error);
      toast.error("حدث خطأ في الاتصال بالسيرفر");
    }
  };

  const daysInMonth = useMemo(() => {
    const daysCount = new Date(year, month, 0).getDate();
    const daysArray = [];
    for (let d = 1; d <= daysCount; d++) {
      const dateObj = new Date(year, month - 1, d);
      daysArray.push({ dayNumber: d, dayName: weekDays[dateObj.getDay()] });
    }
    return daysArray;
  }, [month, year]);

  useEffect(() => {
    let isMounted = true;
    const fetchInitData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/api/roster/init?month=${month}&year=${year}`,
        );
        const data = await response.json();
        if (!isMounted) return;

        if (data.success) {
          setEmployees(
            Array.isArray(data.employees)
              ? [...data.employees].sort((a, b) => {
                  const codeA = Number(a.employeeCode || 0);
                  const codeB = Number(b.employeeCode || 0);
                  if (codeA !== codeB) return codeA - codeB;
                  return String(a.name || "").localeCompare(
                    String(b.name || ""),
                    "ar",
                  );
                })
              : [],
          );
          setLeaves(Array.isArray(data.leaves) ? data.leaves : []);

          if (data.existingRoster) {
            setRosterData(
              normalizeRosterData(data.existingRoster.details, month, year),
            );
            setRosterStatus(data.existingRoster.status || null);
          } else {
            setRosterData(createEmptyRoster(month, year));
            setRosterStatus(null);
          }
        } else {
          toast.error(data.message || "فشل تحميل البيانات");
          setEmployees([]);
          setLeaves([]);
          setRosterData(createEmptyRoster(month, year));
          setRosterStatus(null);
        }
      } catch (error) {
        console.error("Error fetching roster init data:", error);
        if (isMounted) {
          toast.error("حدث خطأ أثناء تحميل البيانات");
          setEmployees([]);
          setLeaves([]);
          setRosterData(createEmptyRoster(month, year));
          setRosterStatus(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitData();
    return () => {
      isMounted = false;
    };
  }, [month, year]);

  const handleRosterChange = (dayNum, shift, role, memberIndex, value) => {
    setRosterData((prev) => {
      const newData = { ...prev };
      if (!newData[dayNum]) return prev;
      const dayCopy = {
        ...newData[dayNum],
        shift1: {
          ...newData[dayNum].shift1,
          members: [...newData[dayNum].shift1.members],
        },
        shift2: {
          ...newData[dayNum].shift2,
          members: [...newData[dayNum].shift2.members],
        },
        shift3: {
          ...newData[dayNum].shift3,
          members: [...newData[dayNum].shift3.members],
        },
      };
      if (role === "leader") {
        dayCopy[shift].leader = value;
      } else if (role === "members") {
        dayCopy[shift].members[memberIndex] = value;
      } else if (role === "notes") {
        dayCopy.notes = value;
      }
      newData[dayNum] = dayCopy;
      return newData;
    });
  };

  const getEmployeeAlert = (empId, dayNum) => {
    const targetEmpId = normalizeId(empId);
    const currentDate = new Date(year, month - 1, dayNum);
    currentDate.setHours(12, 0, 0, 0);

    const matchedLeave = leaves.find((leave) => {
      const leaveEmpId = normalizeId(leave.employeeId);
      if (!leaveEmpId || leaveEmpId !== targetEmpId) return false;
      const status = String(leave.status || "")
        .trim()
        .toLowerCase();
      if (!["approved", "pending"].includes(status)) return false;
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return currentDate >= start && currentDate <= end;
    });

    if (!matchedLeave) return null;

    const status = String(matchedLeave.status || "")
      .trim()
      .toLowerCase();
    const isPending = status === "pending";

    return {
      type: isPending ? "طلب إجازة" : "إجازة",
      badgeText: isPending ? "طلب إجازة" : "إجازة",
      badgeClass: isPending
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700",
      buttonClass: isPending
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-red-300 bg-red-50 text-red-700",
    };
  };

  const getEmployeeDayUsage = (
    dayNum,
    empId,
    currentShift,
    currentRole,
    currentMemberIndex = null,
  ) => {
    const dayData = rosterData[dayNum];
    if (!dayData || !empId) return null;

    const targetId = normalizeId(empId);
    const currentKey = getSlotKey(
      currentShift,
      currentRole,
      currentMemberIndex,
    );
    const usedSlots = [];

    ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
      const shiftData = dayData[shiftKey];
      if (!shiftData) return;
      if (shiftData.leader && normalizeId(shiftData.leader) === targetId) {
        usedSlots.push({
          key: getSlotKey(shiftKey, "leader"),
          label: getSlotLabel(shiftKey, "leader"),
        });
      }
      (shiftData.members || []).forEach((member, index) => {
        if (member && normalizeId(member) === targetId) {
          usedSlots.push({
            key: getSlotKey(shiftKey, "members", index),
            label: getSlotLabel(shiftKey, "members", index),
          });
        }
      });
    });

    const usedElsewhere = usedSlots.filter((slot) => slot.key !== currentKey);
    if (usedElsewhere.length === 0) return null;

    return {
      isUsedElsewhere: true,
      label: usedElsewhere[0].label,
      count: usedElsewhere.length,
    };
  };

  const handleEmployeeSelect = (dayNum, shift, role, memberIndex, newValue) => {
    if (!newValue) {
      handleRosterChange(dayNum, shift, role, memberIndex, "");
      return;
    }
    const usage = getEmployeeDayUsage(
      dayNum,
      newValue,
      shift,
      role,
      memberIndex,
    );
    if (usage?.isUsedElsewhere) {
      // ✅ إصلاح toast.error (كان tagged template خاطئ)
      toast.error(`الموظف ده مضاف بالفعل في ${usage.label} لنفس اليوم`);
      return;
    }
    handleRosterChange(dayNum, shift, role, memberIndex, newValue);
  };

  const renderEmployeeDropdown = (dayNum, shift, role, memberIndex = null) => {
    const val =
      role === "leader"
        ? rosterData[dayNum]?.[shift]?.leader || ""
        : rosterData[dayNum]?.[shift]?.members?.[memberIndex] || "";

    return (
      <EmployeeDropdown
        employees={employees}
        value={val}
        dayNum={dayNum}
        getEmployeeAlert={getEmployeeAlert}
        getEmployeeDayUsage={getEmployeeDayUsage}
        currentShift={shift}
        currentRole={role}
        currentMemberIndex={memberIndex}
        shiftTheme={shiftThemes[shift]}
        onChange={(newValue) =>
          handleEmployeeSelect(dayNum, shift, role, memberIndex, newValue)
        }
      />
    );
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 p-2 md:p-4" dir="rtl">
        <div className="mx-auto w-full">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-800 md:text-3xl">
                إدارة الروستر
              </h1>
              <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">
                تنظيم الورديات الشهرية مع تنبيه الإجازات وطلبات الإجازة
              </p>
            </div>

            {loading && (
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 no-print">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
                جاري تحميل البيانات...
              </div>
            )}
          </div>

          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm no-print">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  اختر الشهر
                </label>
                <div className="relative">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pl-8 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {monthNames.map((name, i) => (
                      <option key={i} value={i + 1}>
                        {name} ({i + 1})
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-slate-400">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  اختر السنة
                </label>
                <div className="relative">
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 pl-8 text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-slate-400">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-end">
                <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-bold text-slate-500">
                    حالة الجدول
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-slate-800">
                      {monthNames[month - 1]} {year}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        rosterStatus === "published"
                          ? "bg-green-100 text-green-700"
                          : rosterStatus === "draft"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {rosterStatus === "published"
                        ? "معتمد"
                        : rosterStatus === "draft"
                          ? "مسودة"
                          : "جديد"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 no-print">
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
              الأولى
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              الثانية
            </span>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
              الثالثة
            </span>
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700">
              🌴 إجازة معتمدة
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
              🌴 طلب إجازة
            </span>
            <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700">
              ⚠️ مكرر في نفس اليوم
            </span>
          </div>

          <div className="mb-4 rounded-xl border-2 border-black bg-[#ffe600] p-4 text-center shadow-sm print-banner">
            <h2 className="mb-1 text-lg font-black text-red-600 md:text-xl">
              {monthNames[month - 1]} {year}
            </h2>
            <p className="text-sm font-bold text-slate-800">
              الإلتزام بالجدول ومراعاة الحضور والإنصراف في المواعيد المحددة
            </p>
            <p className="mt-1 text-[11px] font-semibold text-slate-700 md:text-xs">
              الالتزام بمواعيد الحضور للنوبات من الأولى (06:30 إلى 14:30) ---
              الثانية (14:30 إلى 22:30) --- الثالثة (22:30 إلى 06:30)
            </p>
          </div>

          <div className="max-h-[78vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:overflow-visible print:w-full">
            <table className="w-full table-fixed border-collapse text-[11px] leading-tight print-table">
              <thead>
                <tr className="text-slate-900">
                  <th
                    rowSpan="2"
                    className="sticky top-0 z-30 h-[72px] w-20 border-2 border-black bg-[#ffe600] px-1.5 py-2 shadow-sm"
                  >
                    اليوم
                  </th>
                  <th
                    rowSpan="2"
                    className="sticky top-0 z-30 h-[72px] w-14 border-2 border-black bg-[#ffe600] px-1.5 py-2 shadow-sm"
                  >
                    التاريخ
                  </th>
                  <th
                    colSpan="2"
                    className={`sticky top-0 z-30 h-11 border-2 border-black px-1.5 py-2 shadow-sm ${shiftThemes.shift1.header}`}
                  >
                    الأولى
                  </th>
                  <th
                    colSpan="2"
                    className={`sticky top-0 z-30 h-11 border-2 border-black px-1.5 py-2 shadow-sm ${shiftThemes.shift2.header}`}
                  >
                    الثانية
                  </th>
                  <th
                    colSpan="2"
                    className={`sticky top-0 z-30 h-11 border-2 border-black px-1.5 py-2 shadow-sm ${shiftThemes.shift3.header}`}
                  >
                    الثالثة
                  </th>
                  <th
                    rowSpan="2"
                    className="sticky top-0 z-30 h-[72px] w-36 border-2 border-black bg-[#ffe600] px-1.5 py-2 shadow-sm"
                  >
                    ملاحظات
                  </th>
                </tr>

                <tr className="text-slate-900">
                  <th
                    className={`sticky top-11 z-20 h-8 border-2 border-black px-1 py-1.5 shadow-sm ${shiftThemes.shift1.subHeader}`}
                  >
                    رئيس النوبة
                  </th>
                  <th
                    className={`sticky top-11 z-20 h-8 border-2 border-black px-1 py-1.5 shadow-sm ${shiftThemes.shift1.subHeader}`}
                  >
                    أفراد النوبة
                  </th>
                  <th
                    className={`sticky top-11 z-20 h-8 border-2 border-black px-1 py-1.5 shadow-sm ${shiftThemes.shift2.subHeader}`}
                  >
                    رئيس النوبة
                  </th>
                  <th
                    className={`sticky top-11 z-20 h-8 border-2 border-black px-1 py-1.5 shadow-sm ${shiftThemes.shift2.subHeader}`}
                  >
                    أفراد النوبة
                  </th>
                  <th
                    className={`sticky top-11 z-20 h-8 border-2 border-black px-1 py-1.5 shadow-sm ${shiftThemes.shift3.subHeader}`}
                  >
                    رئيس النوبة
                  </th>
                  <th
                    className={`sticky top-11 z-20 h-8 border-2 border-black px-1 py-1.5 shadow-sm ${shiftThemes.shift3.subHeader}`}
                  >
                    أفراد النوبة
                  </th>
                </tr>
              </thead>

              <tbody>
                {daysInMonth.map((day, index) => (
                  <tr
                    key={day.dayNumber}
                    className={`align-top ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                    } hover:bg-blue-50/40`}
                  >
                    <td className="border-2 border-black p-1.5 font-bold bg-slate-50">
                      <div className="flex flex-col items-center gap-1">
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                          {day.dayName}
                        </span>
                      </div>
                    </td>

                    <td className="border-2 border-black p-1.5 font-bold bg-slate-50">
                      <span className="inline-flex min-w-[28px] items-center justify-center rounded-md bg-white px-2 py-1 text-[11px] shadow-sm">
                        {day.dayNumber}
                      </span>
                    </td>

                    <td
                      className={`border-2 border-black p-1.5 ${shiftThemes.shift1.cell}`}
                    >
                      {renderEmployeeDropdown(
                        day.dayNumber,
                        "shift1",
                        "leader",
                      )}
                    </td>
                    <td
                      className={`border-2 border-black p-1.5 ${shiftThemes.shift1.cell}`}
                    >
                      <div className="flex flex-col gap-1">
                        {renderEmployeeDropdown(
                          day.dayNumber,
                          "shift1",
                          "members",
                          0,
                        )}
                        {renderEmployeeDropdown(
                          day.dayNumber,
                          "shift1",
                          "members",
                          1,
                        )}
                        {renderEmployeeDropdown(
                          day.dayNumber,
                          "shift1",
                          "members",
                          2,
                        )}
                      </div>
                    </td>

                    <td
                      className={`border-2 border-black p-1.5 ${shiftThemes.shift2.cell}`}
                    >
                      {renderEmployeeDropdown(
                        day.dayNumber,
                        "shift2",
                        "leader",
                      )}
                    </td>
                    <td
                      className={`border-2 border-black p-1.5 ${shiftThemes.shift2.cell}`}
                    >
                      <div className="flex flex-col gap-1">
                        {renderEmployeeDropdown(
                          day.dayNumber,
                          "shift2",
                          "members",
                          0,
                        )}
                        {renderEmployeeDropdown(
                          day.dayNumber,
                          "shift2",
                          "members",
                          1,
                        )}
                        {renderEmployeeDropdown(
                          day.dayNumber,
                          "shift2",
                          "members",
                          2,
                        )}
                      </div>
                    </td>

                    <td
                      className={`border-2 border-black p-1.5 ${shiftThemes.shift3.cell}`}
                    >
                      {renderEmployeeDropdown(
                        day.dayNumber,
                        "shift3",
                        "leader",
                      )}
                    </td>
                    <td
                      className={`border-2 border-black p-1.5 ${shiftThemes.shift3.cell}`}
                    >
                      <div className="flex flex-col gap-1">
                        {renderEmployeeDropdown(
                          day.dayNumber,
                          "shift3",
                          "members",
                          0,
                        )}
                        {renderEmployeeDropdown(
                          day.dayNumber,
                          "shift3",
                          "members",
                          1,
                        )}
                        {renderEmployeeDropdown(
                          day.dayNumber,
                          "shift3",
                          "members",
                          2,
                        )}
                      </div>
                    </td>

                    <td className="border-2 border-black p-1.5">
                      <textarea
                        value={rosterData[day.dayNumber]?.notes || ""}
                        onChange={(e) =>
                          handleRosterChange(
                            day.dayNumber,
                            null,
                            "notes",
                            null,
                            e.target.value,
                          )
                        }
                        className="min-h-[58px] w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11px] font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 no-print"
                        rows="2"
                        placeholder="ملاحظات..."
                      ></textarea>
                      <span className="print-only print-cell-text">
                        {rosterData[day.dayNumber]?.notes || ""}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2 no-print">
            <button
              onClick={handlePrint}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              طباعة PDF
            </button>

            {rosterStatus === "published" ? (
              <button
                onClick={() => handleSaveRoster("published")}
                className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
              >
                تحديث الجدول المعتمد
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSaveRoster("draft")}
                  className="rounded-lg bg-slate-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700"
                >
                  حفظ كمسودة
                </button>
                <button
                  onClick={() => handleSaveRoster("published")}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700"
                >
                  اعتماد ونشر الروستر
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============ نافذة التحقق قبل الاعتماد (عبر Portal على body) ============ */}
      {validationModal.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 no-print">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              {/* رأس النافذة */}
              <div
                className={`px-6 py-4 ${
                  validationModal.errors.length > 0
                    ? "bg-red-50 border-b border-red-100"
                    : "bg-amber-50 border-b border-amber-100"
                }`}
              >
                <h3
                  className={`flex items-center gap-2 text-lg font-black ${
                    validationModal.errors.length > 0
                      ? "text-red-700"
                      : "text-amber-700"
                  }`}
                >
                  {validationModal.errors.length > 0 ? (
                    <>⛔ لا يمكن اعتماد الروستر</>
                  ) : (
                    <>⚠️ تنبيه قبل الاعتماد</>
                  )}
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {validationModal.errors.length > 0
                    ? "يجب استكمال النواقص التالية قبل الاعتماد:"
                    : "الجدول مكتمل، لكن انتبه للملاحظات التالية:"}
                </p>
              </div>

              <div className="max-h-[55vh] overflow-y-auto px-6 py-4 space-y-4">
                {/* الأخطاء الحاجزة: الشيفتات الناقصة */}
                {validationModal.errors.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-bold text-red-700">
                        شيفتات ناقصة ({validationModal.errors.length})
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {validationModal.errors.slice(0, 30).map((err, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-xs"
                        >
                          <span className="font-bold text-slate-800">
                            يوم {err.day} ({err.dayName}) — النوبة {err.shift}
                          </span>
                          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-700">
                            {err.problems}
                          </span>
                        </div>
                      ))}
                      {validationModal.errors.length > 30 && (
                        <div className="text-center text-xs font-semibold text-slate-500">
                          ... و {validationModal.errors.length - 30} حالة أخرى
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* الموظفون غير المجدولين */}
                {validationModal.unscheduled.length > 0 && (
                  <div>
                    <span className="mb-2 block text-sm font-bold text-amber-700">
                      موظفون لم يُجدولوا هذا الشهر (
                      {validationModal.unscheduled.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {validationModal.unscheduled.map((emp, i) => (
                        <span
                          key={i}
                          className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800"
                        >
                          {emp.name} ({emp.code})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* أزرار النافذة */}
              <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() =>
                    setValidationModal({
                      isOpen: false,
                      errors: [],
                      unscheduled: [],
                    })
                  }
                  className="flex-1 rounded-lg bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  {validationModal.errors.length > 0 ? "حسناً، سأكمل" : "رجوع"}
                </button>

                {/* زر المتابعة يظهر فقط لو مفيش أخطاء حاجزة (تنبيه الموظفين فقط) */}
                {validationModal.errors.length === 0 && (
                  <button
                    onClick={() => {
                      setValidationModal({
                        isOpen: false,
                        errors: [],
                        unscheduled: [],
                      });
                      saveRosterToServer("published");
                    }}
                    className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-bold text-white transition hover:bg-green-700"
                  >
                    متابعة الاعتماد
                  </button>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </AdminLayout>
  );
};

export default RosterManagement;
