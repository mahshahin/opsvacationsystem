import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AdminLayout from "../components/AdminLayout";
import toast from "react-hot-toast";
import "../../print.css";
import { ChevronDown, Users, Eye, X } from "lucide-react";

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

const shiftLabels = {
  shift1: "الأولى",
  shift2: "الثانية",
  shift3: "الثالثة",
};

const leaveTypeLabels = {
  annual: "اعتيادي",
  casual: "عارضة",
  compensation: "بدل أعياد",
};

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

const translateLeaveType = (type) => leaveTypeLabels[type] || type || "—";

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
  getRestConflict,
  currentShift,
  currentRole,
  currentMemberIndex,
  shiftTheme,
  placeholder = "—",
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

  const selectedRestConflict = value
    ? getRestConflict(value, dayNum, currentShift)
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
  } else if (selectedRestConflict?.blocked) {
    buttonClass =
      "border-red-300 bg-red-50 text-red-700 hover:border-red-400 focus:ring-2 focus:ring-red-100";
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
            ) : selectedRestConflict?.blocked ? (
              <span className="text-xs">🛌</span>
            ) : selectedAlert ? (
              <span className="text-xs">🌴</span>
            ) : null}

            <span
              className={`truncate ${
                selectedEmp ? "text-current" : "text-slate-400"
              }`}
            >
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

          {selectedRestConflict?.blocked && (
            <div className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
              <span>🛌</span>
              <span>راحة</span>
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

                  const restConflict = getRestConflict(
                    emp._id,
                    dayNum,
                    currentShift,
                  );

                  const isSelected = String(emp._id) === String(value);
                  const disabled =
                    usage?.isUsedElsewhere || restConflict?.blocked;

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

                          {restConflict?.blocked && (
                            <div className="mt-1 text-[10px] font-bold text-red-700">
                              {restConflict.reason}
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

                          {restConflict?.blocked && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                              راحة
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

  const [validationModal, setValidationModal] = useState({
    isOpen: false,
    errors: [],
    unscheduled: [],
  });

  const [summarySearch, setSummarySearch] = useState("");
  const [summarySort, setSummarySort] = useState("total-desc");
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewEmployeeId, setPreviewEmployeeId] = useState("");
  const [previewSearch, setPreviewSearch] = useState("");

  const handlePrint = () => {
    window.print();
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

  const getEmployeeLeaveInfo = (empId, dayNum) => {
    const targetEmpId = normalizeId(empId);
    if (!targetEmpId) return null;

    const currentDate = new Date(year, month - 1, dayNum);
    currentDate.setHours(12, 0, 0, 0);

    const matchedLeave = leaves
      .filter((leave) => {
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
      })
      .sort((a, b) => {
        const statusA = String(a.status || "")
          .trim()
          .toLowerCase();
        const statusB = String(b.status || "")
          .trim()
          .toLowerCase();

        if (statusA === statusB) return 0;
        if (statusA === "approved") return -1;
        if (statusB === "approved") return 1;
        return 0;
      })[0];

    if (!matchedLeave) return null;

    const status = String(matchedLeave.status || "")
      .trim()
      .toLowerCase();

    const isPending = status === "pending";

    return {
      status,
      type: isPending ? "طلب إجازة" : "إجازة",
      badgeText: isPending ? "طلب إجازة" : "إجازة",
      badgeClass: isPending
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-red-200 bg-red-50 text-red-700",
      buttonClass: isPending
        ? "border-amber-300 bg-amber-50 text-amber-800"
        : "border-red-300 bg-red-50 text-red-700",
      leaveType: matchedLeave.leaveType,
      leaveTypeLabel: translateLeaveType(matchedLeave.leaveType),
    };
  };

  const getEmployeeAlert = (empId, dayNum) => {
    return getEmployeeLeaveInfo(empId, dayNum);
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

  // ✅ قاعدة الراحة الجديدة:
  // - بعد الوردية الثالثة: لا يعمل الأولى ولا الثانية في اليوم التالي
  // - بعد الوردية الثانية: لا يعمل الأولى في اليوم التالي فقط
  const getRestConflict = (empId, dayNum, currentShift) => {
    if (dayNum <= 1) return null;

    const previousDay = rosterData[dayNum - 1];
    if (!previousDay) return null;

    const targetId = normalizeId(empId);

    const existsInShift = (shiftData) => {
      if (!shiftData) return false;

      const leaderMatch =
        shiftData.leader && normalizeId(shiftData.leader) === targetId;

      const memberMatch =
        Array.isArray(shiftData.members) &&
        shiftData.members.some((m) => m && normalizeId(m) === targetId);

      return leaderMatch || memberMatch;
    };

    const wasInShift2Yesterday = existsInShift(previousDay.shift2);
    const wasInShift3Yesterday = existsInShift(previousDay.shift3);

    if (wasInShift3Yesterday && currentShift === "shift1") {
      return {
        blocked: true,
        reason:
          "كان في الوردية الثالثة أمس ولا يمكنه العمل في الوردية الأولى اليوم",
      };
    }

    if (wasInShift3Yesterday && currentShift === "shift2") {
      return {
        blocked: true,
        reason:
          "كان في الوردية الثالثة أمس ولا يمكنه العمل في الوردية الثانية اليوم",
      };
    }

    if (wasInShift2Yesterday && currentShift === "shift1") {
      return {
        blocked: true,
        reason:
          "كان في الوردية الثانية أمس ولا يمكنه العمل في الوردية الأولى اليوم",
      };
    }

    return null;
  };

  const validateRoster = () => {
    const errors = [];

    daysInMonth.forEach((day) => {
      const dayData = rosterData[day.dayNumber];
      if (!dayData) return;

      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const shiftData = dayData[shiftKey] || {};
        const hasLeader = !!normalizeId(shiftData.leader);

        const membersCount = (shiftData.members || []).filter(
          (m) => !!normalizeId(m),
        ).length;

        const totalPeople = (hasLeader ? 1 : 0) + membersCount;
        const problems = [];

        if (!hasLeader && membersCount > 0) {
          problems.push("بدون رئيس نوبة");
        }

        if (membersCount < 3 && totalPeople > 0) {
          problems.push(`يوجد ${3 - membersCount} خانات أفراد فارغة`);
        }

        if (totalPeople === 1) {
          problems.push("الشيفت به موظف واحد فقط!");
        }

        if (totalPeople === 0) {
          problems.push("الشيفت فارغ تماماً");
        }

        if (problems.length > 0) {
          errors.push({
            day: day.dayNumber,
            dayName: day.dayName,
            shift: shiftLabels[shiftKey],
            problems: problems.join(" — "),
          });
        }
      });

      // ✅ فحص قاعدة الراحة في الوردية الأولى والثانية
      ["shift1", "shift2"].forEach((shiftKey) => {
        const currentShiftData = dayData[shiftKey] || {};
        const idsToCheck = [];

        if (currentShiftData.leader) idsToCheck.push(currentShiftData.leader);

        (currentShiftData.members || []).forEach((m) => {
          if (m) idsToCheck.push(m);
        });

        idsToCheck.forEach((empId) => {
          const restConflict = getRestConflict(empId, day.dayNumber, shiftKey);

          if (restConflict?.blocked) {
            const emp = employees.find(
              (e) => normalizeId(e._id) === normalizeId(empId),
            );

            errors.push({
              day: day.dayNumber,
              dayName: day.dayName,
              shift: shiftLabels[shiftKey],
              problems: `${emp?.name || "موظف"} — ${restConflict.reason}`,
            });
          }
        });
      });
    });

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
        const id = normalizeId(emp._id);
        if (scheduledIds.has(id)) return false;

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

  const saveRosterToServer = async (status) => {
    const payload = {
      month,
      year,
      status,
      rosterDetails: rosterData,
    };

    try {
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

  const handleSaveRoster = async (status) => {
    if (status === "published") {
      const { errors, unscheduled } = validateRoster();

      if (errors.length > 0) {
        setValidationModal({ isOpen: true, errors, unscheduled });
        return;
      }

      if (unscheduled.length > 0) {
        setValidationModal({ isOpen: true, errors: [], unscheduled });
        return;
      }
    }

    await saveRosterToServer(status);
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
      toast.error(`الموظف ده مضاف بالفعل في ${usage.label} لنفس اليوم`);
      return;
    }

    const restConflict = getRestConflict(newValue, dayNum, shift);

    if (restConflict?.blocked) {
      toast.error(
        `لا يمكن تسكين هذا الموظف في النوبة ${shiftLabels[shift]} يوم ${dayNum} لأنه ${restConflict.reason}`,
      );
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
        getRestConflict={getRestConflict}
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

  const getApprovedLeaveDaysInsideMonth = (leave) => {
    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);

    leaveStart.setHours(0, 0, 0, 0);
    leaveEnd.setHours(23, 59, 59, 999);

    const start = leaveStart > monthStart ? leaveStart : monthStart;
    const end = leaveEnd < monthEnd ? leaveEnd : monthEnd;

    if (start > end) return 0;

    return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const employeeRosterSummary = useMemo(() => {
    const summaryMap = {};

    employees.forEach((emp) => {
      const id = normalizeId(emp._id);

      summaryMap[id] = {
        _id: id,
        name: emp.name,
        employeeCode: emp.employeeCode || "—",
        total: 0,
        leaderCount: 0,
        memberCount: 0,
        shift1Count: 0,
        shift2Count: 0,
        shift3Count: 0,
        approvedLeaveDays: 0,
      };
    });

    Object.values(rosterData).forEach((dayData) => {
      if (!dayData) return;

      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const shift = dayData[shiftKey];
        if (!shift) return;

        if (shift.leader) {
          const leaderId = normalizeId(shift.leader);

          if (summaryMap[leaderId]) {
            summaryMap[leaderId].total += 1;
            summaryMap[leaderId].leaderCount += 1;
            summaryMap[leaderId][`${shiftKey}Count`] += 1;
          }
        }

        (shift.members || []).forEach((member) => {
          const memberId = normalizeId(member);

          if (summaryMap[memberId]) {
            summaryMap[memberId].total += 1;
            summaryMap[memberId].memberCount += 1;
            summaryMap[memberId][`${shiftKey}Count`] += 1;
          }
        });
      });
    });

    leaves.forEach((leave) => {
      const empId = normalizeId(leave.employeeId);
      if (!summaryMap[empId]) return;

      const status = String(leave.status || "")
        .trim()
        .toLowerCase();

      if (status !== "approved") return;

      const daysInsideMonth = getApprovedLeaveDaysInsideMonth(leave);
      if (!daysInsideMonth) return;

      summaryMap[empId].approvedLeaveDays += daysInsideMonth;
    });

    return Object.values(summaryMap);
  }, [employees, rosterData, leaves, month, year]);

  const employeeSummaryStats = useMemo(() => {
    const totalAssignments = employeeRosterSummary.reduce(
      (sum, emp) => sum + emp.total,
      0,
    );

    const scheduledCount = employeeRosterSummary.filter(
      (emp) => emp.total > 0,
    ).length;

    const unscheduledCount = employeeRosterSummary.filter(
      (emp) => emp.total === 0,
    ).length;

    const totalApprovedLeaveDays = employeeRosterSummary.reduce(
      (sum, emp) => sum + emp.approvedLeaveDays,
      0,
    );

    const averageAssignments =
      scheduledCount > 0 ? totalAssignments / scheduledCount : 0;

    return {
      totalAssignments,
      scheduledCount,
      unscheduledCount,
      totalApprovedLeaveDays,
      averageAssignments,
    };
  }, [employeeRosterSummary]);

  const getEmployeeLoadStatus = (emp) => {
    if (emp.total === 0) {
      return {
        text: "غير مجدول",
        cls: "bg-gray-100 text-gray-700",
      };
    }

    const avg = employeeSummaryStats.averageAssignments;

    if (avg === 0) {
      return {
        text: "—",
        cls: "bg-slate-100 text-slate-700",
      };
    }

    if (emp.total < avg * 0.7) {
      return {
        text: "أقل من المتوسط",
        cls: "bg-amber-100 text-amber-700",
      };
    }

    if (emp.total > avg * 1.3) {
      return {
        text: "ضغط عالي",
        cls: "bg-red-100 text-red-700",
      };
    }

    return {
      text: "متوازن",
      cls: "bg-green-100 text-green-700",
    };
  };

  const visibleEmployeeRosterSummary = useMemo(() => {
    let rows = [...employeeRosterSummary];
    const q = summarySearch.trim().toLowerCase();

    if (q) {
      rows = rows.filter((emp) => {
        const name = String(emp.name || "").toLowerCase();
        const code = String(emp.employeeCode || "").toLowerCase();
        return name.includes(q) || code.includes(q);
      });
    }

    switch (summarySort) {
      case "total-asc":
        rows.sort((a, b) => a.total - b.total);
        break;
      case "code-asc":
        rows.sort(
          (a, b) => Number(a.employeeCode || 0) - Number(b.employeeCode || 0),
        );
        break;
      case "leader-desc":
        rows.sort((a, b) => b.leaderCount - a.leaderCount);
        break;
      case "shift1-desc":
        rows.sort((a, b) => b.shift1Count - a.shift1Count);
        break;
      case "shift2-desc":
        rows.sort((a, b) => b.shift2Count - a.shift2Count);
        break;
      case "shift3-desc":
        rows.sort((a, b) => b.shift3Count - a.shift3Count);
        break;
      default:
        rows.sort((a, b) => b.total - a.total);
    }

    return rows;
  }, [employeeRosterSummary, summarySearch, summarySort]);

  const openPreviewModal = (employeeId = "") => {
    if (!employees.length) {
      toast.error("لا يوجد موظفون لعرض جدولهم");
      return;
    }

    const nextId =
      normalizeId(employeeId) ||
      normalizeId(previewEmployeeId) ||
      normalizeId(employees[0]?._id);

    setPreviewEmployeeId(nextId);
    setPreviewSearch("");
    setIsPreviewOpen(true);
  };

  const closePreviewModal = () => {
    setIsPreviewOpen(false);
    setPreviewSearch("");
  };

  const previewEmployeeOptions = useMemo(() => {
    const q = previewSearch.trim().toLowerCase();
    if (!q) return employees;

    const filtered = employees.filter((emp) => {
      const name = String(emp.name || "").toLowerCase();
      const code = String(emp.employeeCode || "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });

    if (
      previewEmployeeId &&
      !filtered.some(
        (emp) => normalizeId(emp._id) === normalizeId(previewEmployeeId),
      )
    ) {
      const selected = employees.find(
        (emp) => normalizeId(emp._id) === normalizeId(previewEmployeeId),
      );

      return selected ? [selected, ...filtered] : filtered;
    }

    return filtered;
  }, [employees, previewSearch, previewEmployeeId]);

  const selectedPreviewEmployee = useMemo(() => {
    return employees.find(
      (emp) => normalizeId(emp._id) === normalizeId(previewEmployeeId),
    );
  }, [employees, previewEmployeeId]);

  const getEmployeeAssignmentsForDay = (empId, dayData) => {
    const targetId = normalizeId(empId);
    if (!targetId || !dayData) return [];

    const assignments = [];

    ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
      const shift = dayData[shiftKey];
      if (!shift) return;

      if (shift.leader && normalizeId(shift.leader) === targetId) {
        assignments.push({
          shiftKey,
          role: "leader",
          label: `${shiftLabels[shiftKey]} - رئيس النوبة`,
        });
      }

      (shift.members || []).forEach((member, index) => {
        if (member && normalizeId(member) === targetId) {
          assignments.push({
            shiftKey,
            role: "member",
            label: `${shiftLabels[shiftKey]} - فرد ${index + 1}`,
          });
        }
      });
    });

    return assignments;
  };

  const previewSchedule = useMemo(() => {
    if (!previewEmployeeId) return [];

    return daysInMonth.map((day) => {
      const dayData = rosterData[day.dayNumber] || {};
      const assignments = getEmployeeAssignmentsForDay(
        previewEmployeeId,
        dayData,
      );
      const leaveInfo = getEmployeeLeaveInfo(previewEmployeeId, day.dayNumber);

      return {
        dayNumber: day.dayNumber,
        dayName: day.dayName,
        assignments,
        leaveInfo,
        notes: dayData.notes || "",
      };
    });
  }, [previewEmployeeId, daysInMonth, rosterData, leaves, month, year]);

  const previewStats = useMemo(() => {
    const totalAssignments = previewSchedule.reduce(
      (sum, day) => sum + day.assignments.length,
      0,
    );

    const workedDays = previewSchedule.filter(
      (day) => day.assignments.length > 0,
    ).length;

    const approvedLeaveDays = previewSchedule.filter(
      (day) => day.leaveInfo?.status === "approved",
    ).length;

    const pendingLeaveDays = previewSchedule.filter(
      (day) => day.leaveInfo?.status === "pending",
    ).length;

    const freeDays = previewSchedule.filter(
      (day) => day.assignments.length === 0 && !day.leaveInfo,
    ).length;

    return {
      totalAssignments,
      workedDays,
      approvedLeaveDays,
      pendingLeaveDays,
      freeDays,
    };
  }, [previewSchedule]);

  return (
    <AdminLayout>
      <div
        className="block min-h-screen bg-slate-50 p-4 md:p-6 lg:hidden no-print print:hidden"
        dir="rtl"
      >
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl text-amber-700">
                💻
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 md:text-2xl">
                  إدارة الروستر
                </h1>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  هذه الصفحة مخصّصة للاستخدام من خلال جهاز كمبيوتر أو لابتوب
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-sm font-bold leading-7 text-amber-800 md:text-base">
                يُفضّل التوجّه إلى جهاز كمبيوتر لإدارة الجدول الشهري، وذلك لضمان
                سهولة التعديل، مراجعة الشيفتات، واستخدام جميع أدوات الروستر بشكل
                صحيح.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="hidden min-h-screen bg-slate-50 p-2 md:p-4 lg:block print:block"
        dir="rtl"
      >
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
            <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
              🛌 راحة
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

          <div className="max-h-[78vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible">
            <table className="print-table w-full table-fixed border-collapse text-[11px] leading-tight">
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
                    <td className="border-2 border-black bg-slate-50 p-1.5 font-bold">
                      <div className="flex flex-col items-center gap-1">
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                          {day.dayName}
                        </span>
                      </div>
                    </td>

                    <td className="border-2 border-black bg-slate-50 p-1.5 font-bold">
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

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm no-print">
            <button
              type="button"
              onClick={() => setIsSummaryOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 bg-white px-4 py-4 text-right transition hover:bg-slate-50 md:px-5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Users className="text-blue-600" size={18} />
                  <h3 className="text-lg font-black text-slate-800">
                    ملخص توزيع الورديات على الموظفين
                  </h3>
                </div>

                <p className="mt-1 text-xs font-medium text-slate-500">
                  يوضح نصيب كل موظف من إجمالي الورديات وعدد أيام الإجازات
                  المعتمدة خلال الشهر
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                  {visibleEmployeeRosterSummary.length} موظف
                </span>

                <ChevronDown
                  size={20}
                  className={`text-slate-500 transition-transform duration-300 ${
                    isSummaryOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                isSummaryOpen
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="border-t border-slate-100">
                <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/60 p-4 md:p-5 lg:grid-cols-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                    <div className="text-[11px] font-bold text-blue-700">
                      إجمالي التكليفات
                    </div>
                    <div className="mt-1 text-2xl font-black text-blue-800">
                      {employeeSummaryStats.totalAssignments}
                    </div>
                  </div>

                  <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                    <div className="text-[11px] font-bold text-green-700">
                      موظفون مجدولون
                    </div>
                    <div className="mt-1 text-2xl font-black text-green-800">
                      {employeeSummaryStats.scheduledCount}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="text-[11px] font-bold text-slate-700">
                      غير مجدولين
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-800">
                      {employeeSummaryStats.unscheduledCount}
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="text-[11px] font-bold text-emerald-700">
                      أيام الإجازات المعتمدة
                    </div>
                    <div className="mt-1 text-2xl font-black text-emerald-800">
                      {employeeSummaryStats.totalApprovedLeaveDays}
                    </div>
                  </div>
                </div>

                <div className="border-b border-slate-100 px-4 py-4 md:px-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-700">
                        توزيع الورديات بالتفصيل
                      </h4>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={summarySearch}
                        onChange={(e) => setSummarySearch(e.target.value)}
                        placeholder="ابحث بالاسم أو الكود..."
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />

                      <select
                        value={summarySort}
                        onChange={(e) => setSummarySort(e.target.value)}
                        className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="total-desc">ترتيب: الأكثر ورديات</option>
                        <option value="total-asc">ترتيب: الأقل ورديات</option>
                        <option value="code-asc">ترتيب: حسب الكود</option>
                        <option value="leader-desc">
                          ترتيب: الأكثر رؤساء نوبة
                        </option>
                        <option value="shift1-desc">
                          ترتيب: الأكثر بالأولى
                        </option>
                        <option value="shift2-desc">
                          ترتيب: الأكثر بالثانية
                        </option>
                        <option value="shift3-desc">
                          ترتيب: الأكثر بالثالثة
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-right text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="whitespace-nowrap p-3">الكود</th>
                        <th className="whitespace-nowrap p-3">الاسم</th>
                        <th className="whitespace-nowrap p-3 text-center">
                          الإجمالي
                        </th>
                        <th className="whitespace-nowrap p-3 text-center">
                          رئيس نوبة
                        </th>
                        <th className="whitespace-nowrap p-3 text-center">
                          فرد نوبة
                        </th>
                        <th className="whitespace-nowrap p-3 text-center">
                          الأولى
                        </th>
                        <th className="whitespace-nowrap p-3 text-center">
                          الثانية
                        </th>
                        <th className="whitespace-nowrap p-3 text-center">
                          الثالثة
                        </th>
                        <th className="whitespace-nowrap p-3 text-center">
                          الإجازات المعتمدة
                        </th>
                        <th className="whitespace-nowrap p-3 text-center">
                          الحالة
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {visibleEmployeeRosterSummary.map((emp) => {
                        const status = getEmployeeLoadStatus(emp);

                        return (
                          <tr
                            key={emp._id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="p-3 font-bold text-slate-600">
                              {emp.employeeCode}
                            </td>

                            <td className="p-3 font-bold text-slate-800">
                              <div>{emp.name}</div>

                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={() => openPreviewModal(emp._id)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100"
                                >
                                  <Eye size={13} />
                                  معاينة الجدول
                                </button>
                              </div>
                            </td>

                            <td className="p-3 text-center">
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">
                                {emp.total}
                              </span>
                            </td>

                            <td className="p-3 text-center font-bold text-indigo-700">
                              {emp.leaderCount}
                            </td>

                            <td className="p-3 text-center font-bold text-slate-700">
                              {emp.memberCount}
                            </td>

                            <td className="p-3 text-center">
                              {emp.shift1Count}
                            </td>
                            <td className="p-3 text-center">
                              {emp.shift2Count}
                            </td>
                            <td className="p-3 text-center">
                              {emp.shift3Count}
                            </td>

                            <td className="p-3 text-center">
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                                {emp.approvedLeaveDays} يوم
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.cls}`}
                              >
                                {status.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {visibleEmployeeRosterSummary.length === 0 && (
                        <tr>
                          <td
                            colSpan="10"
                            className="p-8 text-center text-sm font-medium text-slate-400"
                          >
                            لا توجد نتائج مطابقة لبحث الملخص
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2 no-print">
            <button
              onClick={() => openPreviewModal()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Eye size={16} />
              معاينة جدول موظف
            </button>

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

      {validationModal.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 no-print">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div
                className={`px-6 py-4 ${
                  validationModal.errors.length > 0
                    ? "border-b border-red-100 bg-red-50"
                    : "border-b border-amber-100 bg-amber-50"
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

              <div className="max-h-[55vh] space-y-4 overflow-y-auto px-6 py-4">
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
                  رجوع لتعديل الجدول
                </button>

                <button
                  onClick={() => {
                    setValidationModal({
                      isOpen: false,
                      errors: [],
                      unscheduled: [],
                    });
                    saveRosterToServer("published");
                  }}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-bold text-white transition ${
                    validationModal.errors.length > 0
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {validationModal.errors.length > 0
                    ? "تجاهل التحذيرات واعتماد الجدول"
                    : "متابعة الاعتماد"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isPreviewOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 no-print">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 md:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Eye className="text-blue-600" size={20} />
                      <h3 className="text-xl font-black text-slate-800">
                        معاينة جدول موظف من المسودة الحالية
                      </h3>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      يعرض آخر التعديلات الموجودة الآن على الشاشة، حتى لو لم يتم
                      نشر الجدول بعد.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closePreviewModal}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr]">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      ابحث عن الموظف
                    </label>
                    <input
                      type="text"
                      value={previewSearch}
                      onChange={(e) => setPreviewSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو الكود..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-bold text-slate-700">
                      اختر الموظف
                    </label>
                    <select
                      value={previewEmployeeId}
                      onChange={(e) => setPreviewEmployeeId(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    >
                      {previewEmployeeOptions.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} - {emp.employeeCode || "—"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedPreviewEmployee && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      الاسم: {selectedPreviewEmployee.name}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      الكود: {selectedPreviewEmployee.employeeCode || "—"}
                    </span>

                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                      الدرجة: {selectedPreviewEmployee.jobGrade || "—"}
                    </span>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      {monthNames[month - 1]} {year}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-b border-slate-100 bg-white px-5 py-4 md:px-6">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3">
                    <div className="text-[11px] font-bold text-blue-700">
                      إجمالي التكليفات
                    </div>
                    <div className="mt-1 text-2xl font-black text-blue-800">
                      {previewStats.totalAssignments}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
                    <div className="text-[11px] font-bold text-indigo-700">
                      أيام العمل
                    </div>
                    <div className="mt-1 text-2xl font-black text-indigo-800">
                      {previewStats.workedDays}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-green-50 p-3">
                    <div className="text-[11px] font-bold text-green-700">
                      إجازات معتمدة
                    </div>
                    <div className="mt-1 text-2xl font-black text-green-800">
                      {previewStats.approvedLeaveDays}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3">
                    <div className="text-[11px] font-bold text-amber-700">
                      طلبات إجازة
                    </div>
                    <div className="mt-1 text-2xl font-black text-amber-800">
                      {previewStats.pendingLeaveDays}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[11px] font-bold text-slate-700">
                      أيام بدون تكليف
                    </div>
                    <div className="mt-1 text-2xl font-black text-slate-800">
                      {previewStats.freeDays}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-white px-5 py-4 md:px-6">
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[900px] text-right text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-3">اليوم</th>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">التكليف</th>
                        <th className="p-3">الإجازة</th>
                        <th className="p-3">ملاحظات اليوم</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {previewSchedule.map((day, index) => (
                        <tr
                          key={day.dayNumber}
                          className={`align-top ${
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                          }`}
                        >
                          <td className="p-3 font-bold text-slate-800">
                            {day.dayName}
                          </td>

                          <td className="p-3 font-bold text-slate-700">
                            {day.dayNumber}
                          </td>

                          <td className="p-3">
                            {day.assignments.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {day.assignments.map((assignment, idx) => {
                                  const badgeClass =
                                    assignment.shiftKey === "shift1"
                                      ? "border-sky-200 bg-sky-50 text-sky-700"
                                      : assignment.shiftKey === "shift2"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-violet-200 bg-violet-50 text-violet-700";

                                  return (
                                    <span
                                      key={`${day.dayNumber}-${idx}`}
                                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${badgeClass}`}
                                    >
                                      {assignment.label}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                غير مجدول
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            {day.leaveInfo ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${day.leaveInfo.badgeClass}`}
                              >
                                <span>🌴</span>
                                <span>
                                  {day.leaveInfo.badgeText} -{" "}
                                  {day.leaveInfo.leaveTypeLabel}
                                </span>
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-sm text-slate-700">
                            {day.notes ? (
                              <div className="rounded-xl bg-slate-50 px-3 py-2 leading-6">
                                {day.notes}
                              </div>
                            ) : (
                              <span className="text-xs font-medium text-slate-400">
                                لا توجد ملاحظات
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {previewSchedule.length === 0 && (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-8 text-center text-sm font-medium text-slate-400"
                          >
                            لا توجد بيانات لعرضها
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 md:px-6">
                <button
                  type="button"
                  onClick={closePreviewModal}
                  className="rounded-xl bg-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-300"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </AdminLayout>
  );
};

export default RosterManagement;
