import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AdminLayout from "../components/AdminLayout";
import toast from "react-hot-toast";
import "../../print.css";
import {
  ChevronDown,
  Users,
  Eye,
  X,
  Maximize2,
  Minimize2,
  Search,
} from "lucide-react";

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

const REST_DAY = "rest";

const workShiftLabels = {
  shift1: "صبح",
  shift2: "ضهر",
  shift3: "ليل",
  rest: "راحة",
};

const preferredWorkPatterns = [
  {
    name: "صبح - ضهر - ليل - راحة - راحة",
    sequence: ["shift1", "shift2", "shift3", REST_DAY, REST_DAY],
  },
  {
    name: "صبح - صبح - ليل - راحة - راحة",
    sequence: ["shift1", "shift1", "shift3", REST_DAY, REST_DAY],
  },
  {
    name: "صبح - ضهر - ضهر - راحة - راحة",
    sequence: ["shift1", "shift2", "shift2", REST_DAY, REST_DAY],
  },
  {
    name: "ضهر - ضهر - ليل - راحة - راحة",
    sequence: ["shift2", "shift2", "shift3", REST_DAY, REST_DAY],
  },
  {
    name: "صبح - راحة - صبح - ضهر - راحة - راحة",
    sequence: ["shift1", REST_DAY, "shift1", "shift2", REST_DAY, REST_DAY],
  },
  {
    name: "صبح - صبح - راحة - صبح - راحة - راحة",
    sequence: ["shift1", "shift1", REST_DAY, "shift1", REST_DAY, REST_DAY],
  },
];

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

const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ");

const employeeMatchesSearch = (employee, searchText) => {
  const q = normalizeSearchText(searchText);
  if (!q || !employee) return false;

  const name = normalizeSearchText(employee.name);
  const code = normalizeSearchText(employee.employeeCode);

  return name.includes(q) || code.includes(q);
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
  isHighlighted = false,
  compact = false,
  placeholder = "—",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  const selectedEmp = employees.find((emp) => String(emp._id) === String(value));
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
    const q = normalizeSearchText(search);
    if (!q) return employees;

    return employees.filter((emp) => employeeMatchesSearch(emp, q));
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

  if (isHighlighted) {
    buttonClass =
      "border-yellow-400 bg-yellow-100 text-yellow-950 shadow-[0_0_0_2px_rgba(250,204,21,0.55)] hover:border-yellow-500 focus:ring-2 focus:ring-yellow-200";
  } else if (selectedUsage?.isUsedElsewhere) {
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
          className={`flex w-full items-center justify-between gap-1.5 rounded-md border font-semibold shadow-sm outline-none transition ${
            compact ? "h-7 px-1.5 text-[10px]" : "h-8 px-2 text-[11px]"
          } ${buttonClass}`}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {isHighlighted ? (
              <span className="text-xs">🔎</span>
            ) : selectedUsage?.isUsedElsewhere ? (
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
          {isHighlighted && (
            <div className="inline-flex items-center gap-1 rounded-full border border-yellow-300 bg-yellow-100 px-2 py-0.5 text-[10px] font-black text-yellow-800">
              <span>🔎</span>
              <span>مطابق للبحث</span>
            </div>
          )}
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
                  const disabled = usage?.isUsedElsewhere || restConflict?.blocked;

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
  const [isRosterFullscreen, setIsRosterFullscreen] = useState(false);
  const [rosterHighlightSearch, setRosterHighlightSearch] = useState("");
  const [shiftLeaderIds, setShiftLeaderIds] = useState([]);
  const [isLeadersModalOpen, setIsLeadersModalOpen] = useState(false);
  const [leaderSearch, setLeaderSearch] = useState("");
  const [workGroups, setWorkGroups] = useState([]);
  const [reserveEmployeeIds, setReserveEmployeeIds] = useState([]);
  const [isWorkGroupsModalOpen, setIsWorkGroupsModalOpen] = useState(false);
  const [workGroupSearch, setWorkGroupSearch] = useState("");
  const [selectedWorkGroupId, setSelectedWorkGroupId] = useState("");
  const [autoFillReport, setAutoFillReport] = useState({
    isOpen: false,
    mode: "",
    filledCount: 0,
    skippedSlots: [],
    warnings: [],
  });

  const handlePrint = () => {
    window.print();
  };

  const showConfirmToast = ({
    title = "تأكيد الإجراء",
    message,
    confirmText = "تأكيد",
    cancelText = "إلغاء",
    danger = false,
    onConfirm,
  }) => {
    toast.custom(
      (t) => (
        <div
          className={`w-[360px] max-w-[calc(100vw-32px)] rounded-2xl border bg-white p-4 text-right shadow-2xl ${
            t.visible ? "animate-enter" : "animate-leave"
          }`}
          dir="rtl"
        >
          <div className="text-sm font-black text-slate-800">{title}</div>
          {message && (
            <div className="mt-2 text-xs font-bold leading-6 text-slate-600">
              {message}
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                onConfirm?.();
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold text-white transition ${
                danger
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      { duration: 12000 },
    );
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

  const shiftLeadersStorageKey = useMemo(
    () => `roster-shift-leaders-${year}-${month}`,
    [month, year],
  );

  const workGroupsStorageKey = "roster-work-groups-v1";
  const reserveEmployeesStorageKey = "roster-reserve-employees-v1";

  const persistReserveEmployeeIds = (nextIds) => {
    const uniqueIds = Array.from(new Set((nextIds || []).map(normalizeId))).filter(
      Boolean,
    );

    setReserveEmployeeIds(uniqueIds);

    try {
      localStorage.setItem(reserveEmployeesStorageKey, JSON.stringify(uniqueIds));
    } catch (error) {
      console.error("Error saving reserve employees locally:", error);
    }
  };

  const persistWorkGroups = (nextGroups) => {
    const normalizedGroups = (Array.isArray(nextGroups) ? nextGroups : []).map(
      (group, index) => ({
        id: group.id || `group-${Date.now()}-${index}`,
        name: group.name || `مجموعة ${index + 1}`,
        leaderId: normalizeId(group.leaderId),
        memberIds: Array.from(
          new Set((group.memberIds || []).map(normalizeId).filter(Boolean)),
        ).filter((id) => id !== normalizeId(group.leaderId)),
      }),
    );

    setWorkGroups(normalizedGroups);

    if (
      normalizedGroups.length > 0 &&
      !normalizedGroups.some((group) => group.id === selectedWorkGroupId)
    ) {
      setSelectedWorkGroupId(normalizedGroups[0].id);
    }

    if (normalizedGroups.length === 0) {
      setSelectedWorkGroupId("");
    }

    try {
      localStorage.setItem(workGroupsStorageKey, JSON.stringify(normalizedGroups));
    } catch (error) {
      console.error("Error saving work groups locally:", error);
    }
  };

  const persistShiftLeaderIds = (nextIds) => {
    const uniqueIds = Array.from(new Set((nextIds || []).map(normalizeId))).filter(
      Boolean,
    );

    setShiftLeaderIds(uniqueIds);

    try {
      localStorage.setItem(shiftLeadersStorageKey, JSON.stringify(uniqueIds));
    } catch (error) {
      console.error("Error saving shift leaders locally:", error);
    }
  };

  useEffect(() => {
    if (!isRosterFullscreen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsRosterFullscreen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRosterFullscreen]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(shiftLeadersStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      setShiftLeaderIds(Array.isArray(parsed) ? parsed.map(normalizeId).filter(Boolean) : []);
    } catch (error) {
      console.error("Error loading shift leaders locally:", error);
      setShiftLeaderIds([]);
    }

    setLeaderSearch("");
  }, [shiftLeadersStorageKey]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(workGroupsStorageKey);
      const parsed = saved ? JSON.parse(saved) : [];
      const normalizedGroups = Array.isArray(parsed)
        ? parsed.map((group, index) => ({
            id: group.id || `group-${Date.now()}-${index}`,
            name: group.name || `مجموعة ${index + 1}`,
            leaderId: normalizeId(group.leaderId),
            memberIds: Array.from(
              new Set((group.memberIds || []).map(normalizeId).filter(Boolean)),
            ).filter((id) => id !== normalizeId(group.leaderId)),
          }))
        : [];

      setWorkGroups(normalizedGroups);
      setSelectedWorkGroupId(normalizedGroups[0]?.id || "");
    } catch (error) {
      console.error("Error loading work groups locally:", error);
      setWorkGroups([]);
      setSelectedWorkGroupId("");
    }

    try {
      const savedReserve = localStorage.getItem(reserveEmployeesStorageKey);
      const parsedReserve = savedReserve ? JSON.parse(savedReserve) : [];
      setReserveEmployeeIds(
        Array.isArray(parsedReserve)
          ? parsedReserve.map(normalizeId).filter(Boolean)
          : [],
      );
    } catch (error) {
      console.error("Error loading reserve employees locally:", error);
      setReserveEmployeeIds([]);
    }
  }, []);

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

        const status = String(leave.status || "").trim().toLowerCase();
        if (!["approved", "pending"].includes(status)) return false;

        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        return currentDate >= start && currentDate <= end;
      })
      .sort((a, b) => {
        const statusA = String(a.status || "").trim().toLowerCase();
        const statusB = String(b.status || "").trim().toLowerCase();
        if (statusA === statusB) return 0;
        if (statusA === "approved") return -1;
        if (statusB === "approved") return 1;
        return 0;
      })[0];

    if (!matchedLeave) return null;

    const status = String(matchedLeave.status || "").trim().toLowerCase();
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
    const currentKey = getSlotKey(currentShift, currentRole, currentMemberIndex);
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

        if (totalPeople === 0) {
          problems.push("الشيفت فارغ تماماً");
        }
        if (!hasLeader && membersCount > 0) {
          problems.push("بدون رئيس نوبة");
        }
        if (hasLeader && membersCount === 0) {
          problems.push("يوجد رئيس نوبة بدون أي فرد");
        }
        if (!hasLeader && membersCount === 1) {
          problems.push("الشيفت به فرد واحد فقط وبدون رئيس نوبة");
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

  const saveRosterToServer = async (
    status,
    rosterDetailsOverride = rosterData,
    successMessage = "",
  ) => {
    const payload = {
      month,
      year,
      status,
      rosterDetails: rosterDetailsOverride,
    };

    try {
      const response = await fetch(`${API_URL}/api/roster/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (result.success) {
        toast.success(successMessage || result.message || "تم الحفظ بنجاح");
        setRosterStatus(status);
        return true;
      } else {
        toast.error(result.message || "فشل حفظ الروستر");
        return false;
      }
    } catch (error) {
      console.error("Error saving roster:", error);
      toast.error("حدث خطأ في الاتصال بالسيرفر");
      return false;
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

  const handleClearDraft = (skipConfirm = false) => {
    if (rosterStatus === "published") {
      toast.error("لا يمكن مسح جدول معتمد من زر مسح المسودة");
      return;
    }

    if (!skipConfirm) {
      showConfirmToast({
        title: "مسح المسودة وبدء جدول جديد",
        message: `سيتم تفريغ كل تسكين وملاحظات جدول ${monthNames[month - 1]} ${year}. سيتم حفظ جدول فارغ كمسودة حتى لا ترجع البيانات القديمة بعد تحديث الصفحة.`,
        confirmText: "مسح المسودة",
        danger: true,
        onConfirm: () => handleClearDraft(true),
      });
      return;
    }

    const emptyRoster = createEmptyRoster(month, year);

    setRosterData(emptyRoster);
    setValidationModal({ isOpen: false, errors: [], unscheduled: [] });
    setAutoFillReport({
      isOpen: false,
      mode: "",
      filledCount: 0,
      skippedSlots: [],
      warnings: [],
    });
    setRosterHighlightSearch("");

    saveRosterToServer(
      "draft",
      emptyRoster,
      "تم مسح المسودة ويمكنك بدء جدول جديد",
    );
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

  const shiftLeaderIdSet = useMemo(
    () => new Set(shiftLeaderIds.map(normalizeId).filter(Boolean)),
    [shiftLeaderIds],
  );

  const visibleLeaderEmployees = useMemo(() => {
    const q = normalizeSearchText(leaderSearch);
    if (!q) return employees;

    return employees.filter((emp) => employeeMatchesSearch(emp, q));
  }, [employees, leaderSearch]);

  const importShiftLeadersFromCurrentRoster = () => {
    const ids = getLeaderEligibleIdsFromRoster(rosterData);
    const nextIds = Array.from(new Set([...shiftLeaderIds, ...Array.from(ids)]));

    if (nextIds.length === shiftLeaderIds.length) {
      toast("لا يوجد رؤساء نوبة جدد للاستيراد من الجدول الحالي");
      return;
    }

    persistShiftLeaderIds(nextIds);
    toast.success("تم استيراد رؤساء النوبة من الجدول الحالي");
  };

  const toggleShiftLeader = (employeeId) => {
    const id = normalizeId(employeeId);
    if (!id) return;

    const nextSet = new Set(shiftLeaderIds.map(normalizeId).filter(Boolean));

    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }

    persistShiftLeaderIds(Array.from(nextSet));
  };

  const selectedWorkGroup = useMemo(
    () => workGroups.find((group) => group.id === selectedWorkGroupId) || null,
    [workGroups, selectedWorkGroupId],
  );

  const reserveEmployeeIdSet = useMemo(
    () => new Set(reserveEmployeeIds.map(normalizeId).filter(Boolean)),
    [reserveEmployeeIds],
  );

  const groupedEmployeeIdSet = useMemo(() => {
    const ids = new Set();

    workGroups.forEach((group) => {
      const leaderId = normalizeId(group.leaderId);
      if (leaderId) ids.add(leaderId);

      (group.memberIds || []).forEach((memberId) => {
        const id = normalizeId(memberId);
        if (id) ids.add(id);
      });
    });

    return ids;
  }, [workGroups]);

  const visibleWorkGroupEmployees = useMemo(() => {
    const q = normalizeSearchText(workGroupSearch);
    if (!q) return employees;

    return employees.filter((emp) => employeeMatchesSearch(emp, q));
  }, [employees, workGroupSearch]);

  const createWorkGroup = () => {
    const nextGroup = {
      id: `group-${Date.now()}`,
      name: `مجموعة ${workGroups.length + 1}`,
      leaderId: "",
      memberIds: [],
    };

    persistWorkGroups([...workGroups, nextGroup]);
    setSelectedWorkGroupId(nextGroup.id);
  };

  const updateWorkGroup = (groupId, patch) => {
    persistWorkGroups(
      workGroups.map((group) => {
        if (group.id !== groupId) return group;

        const nextGroup = { ...group, ...patch };
        const leaderId = normalizeId(nextGroup.leaderId);

        return {
          ...nextGroup,
          leaderId,
          memberIds: Array.from(
            new Set((nextGroup.memberIds || []).map(normalizeId).filter(Boolean)),
          ).filter((id) => id !== leaderId),
        };
      }),
    );
  };

  const deleteWorkGroup = (groupId) => {
    const group = workGroups.find((item) => item.id === groupId);

    showConfirmToast({
      title: "حذف مجموعة العمل",
      message: `هل تريد حذف ${group?.name || "مجموعة العمل"}؟ سيتم حذفها من التخزين المحلي فقط.`,
      confirmText: "حذف",
      danger: true,
      onConfirm: () => {
        const nextGroups = workGroups.filter((item) => item.id !== groupId);
        persistWorkGroups(nextGroups);
        setSelectedWorkGroupId(nextGroups[0]?.id || "");
        toast.success("تم حذف مجموعة العمل");
      },
    });
  };

  const toggleWorkGroupMember = (groupId, employeeId) => {
    const id = normalizeId(employeeId);
    if (!id) return;

    const group = workGroups.find((item) => item.id === groupId);
    if (!group) return;

    if (normalizeId(group.leaderId) === id) {
      toast.error("رئيس المجموعة لا يمكن إضافته كفرد داخل نفس المجموعة");
      return;
    }

    const nextSet = new Set((group.memberIds || []).map(normalizeId).filter(Boolean));

    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }

    updateWorkGroup(groupId, { memberIds: Array.from(nextSet) });
  };

  const toggleReserveEmployee = (employeeId) => {
    const id = normalizeId(employeeId);
    if (!id) return;

    if (groupedEmployeeIdSet.has(id)) {
      toast.error("الموظف موجود داخل مجموعة عمل، يجب إزالته من المجموعة أولًا قبل جعله احتياطيًا");
      return;
    }

    const nextSet = new Set(reserveEmployeeIds.map(normalizeId).filter(Boolean));

    if (nextSet.has(id)) {
      nextSet.delete(id);
    } else {
      nextSet.add(id);
    }

    persistReserveEmployeeIds(Array.from(nextSet));
  };

  const getEmployeeNameById = (employeeId) => {
    const id = normalizeId(employeeId);
    const emp = employees.find((item) => normalizeId(item._id) === id);
    return emp?.name || "—";
  };

  const highlightedEmployeeIds = useMemo(() => {
    const q = normalizeSearchText(rosterHighlightSearch);
    if (!q) return new Set();

    return new Set(
      employees
        .filter((emp) => employeeMatchesSearch(emp, q))
        .map((emp) => normalizeId(emp._id)),
    );
  }, [employees, rosterHighlightSearch]);

  const highlightedAssignmentsCount = useMemo(() => {
    if (highlightedEmployeeIds.size === 0) return 0;

    let count = 0;

    Object.values(rosterData).forEach((dayData) => {
      if (!dayData) return;

      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const shift = dayData[shiftKey];
        if (!shift) return;

        if (
          shift.leader &&
          highlightedEmployeeIds.has(normalizeId(shift.leader))
        ) {
          count += 1;
        }

        (shift.members || []).forEach((member) => {
          if (member && highlightedEmployeeIds.has(normalizeId(member))) {
            count += 1;
          }
        });
      });
    });

    return count;
  }, [highlightedEmployeeIds, rosterData]);

  const renderHighlightSearchBox = (variant = "normal") => {
    const hasSearch = !!rosterHighlightSearch.trim();
    const compact = variant === "fullscreen";

    return (
      <div
        className={`flex min-w-0 flex-wrap items-center gap-2 ${
          compact ? "w-full" : "w-full md:w-auto"
        }`}
      >
        <div className={`relative ${compact ? "w-full" : "w-full md:w-[420px]"}`}>
          <Search
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={rosterHighlightSearch}
            onChange={(e) => setRosterHighlightSearch(e.target.value)}
            placeholder="اكتب اسم أو كود موظف لتظليل أماكنه..."
            className={`w-full rounded-xl border border-slate-200 bg-white px-9 pl-9 font-bold text-slate-700 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 ${
              compact ? "h-8 text-xs" : "h-10 text-sm"
            }`}
          />
          {hasSearch && (
            <button
              type="button"
              onClick={() => setRosterHighlightSearch("")}
              className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              title="مسح البحث"
            >
              ×
            </button>
          )}
        </div>

        {hasSearch && (
          <span
            className={`rounded-full border px-3 py-1 text-[11px] font-black ${
              highlightedAssignmentsCount > 0
                ? "border-yellow-300 bg-yellow-100 text-yellow-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {highlightedAssignmentsCount > 0
              ? `${highlightedAssignmentsCount} مكان مطابق / ${highlightedEmployeeIds.size} موظف`
              : "لا توجد أماكن مطابقة"}
          </span>
        )}
      </div>
    );
  };

  const renderEmployeeDropdown = (dayNum, shift, role, memberIndex = null) => {
    const val =
      role === "leader"
        ? rosterData[dayNum]?.[shift]?.leader || ""
        : rosterData[dayNum]?.[shift]?.members?.[memberIndex] || "";
    const isHighlighted =
      !!val && highlightedEmployeeIds.has(normalizeId(val));

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
        isHighlighted={isHighlighted}
        compact={isRosterFullscreen}
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

      const status = String(leave.status || "").trim().toLowerCase();
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
      const assignments = getEmployeeAssignmentsForDay(previewEmployeeId, dayData);
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

  const cloneRosterForAutoFill = (sourceData) =>
    normalizeRosterData(sourceData, month, year);

  const getLeaderEligibleIdsFromRoster = (sourceData) => {
    const ids = new Set();

    Object.values(sourceData || {}).forEach((dayData) => {
      if (!dayData) return;

      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const leaderId = normalizeId(dayData?.[shiftKey]?.leader);
        if (leaderId) ids.add(leaderId);
      });
    });

    return ids;
  };

  const buildAutoFillStats = (sourceData) => {
    const stats = {};

    employees.forEach((emp) => {
      const id = normalizeId(emp._id);
      stats[id] = {
        total: 0,
        leaderCount: 0,
        memberCount: 0,
        shift1Count: 0,
        shift2Count: 0,
        shift3Count: 0,
      };
    });

    Object.values(sourceData || {}).forEach((dayData) => {
      if (!dayData) return;

      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const shift = dayData[shiftKey];
        if (!shift) return;

        const leaderId = normalizeId(shift.leader);
        if (leaderId && stats[leaderId]) {
          stats[leaderId].total += 1;
          stats[leaderId].leaderCount += 1;
          stats[leaderId][`${shiftKey}Count`] += 1;
        }

        (shift.members || []).forEach((member) => {
          const memberId = normalizeId(member);
          if (memberId && stats[memberId]) {
            stats[memberId].total += 1;
            stats[memberId].memberCount += 1;
            stats[memberId][`${shiftKey}Count`] += 1;
          }
        });
      });
    });

    return stats;
  };

  const isEmployeeUsedInDay = (sourceData, dayNum, empId) => {
    const targetId = normalizeId(empId);
    const dayData = sourceData?.[dayNum];
    if (!targetId || !dayData) return false;

    return ["shift1", "shift2", "shift3"].some((shiftKey) => {
      const shift = dayData[shiftKey];
      if (!shift) return false;

      const isLeader = normalizeId(shift.leader) === targetId;
      const isMember = (shift.members || []).some(
        (member) => normalizeId(member) === targetId,
      );

      return isLeader || isMember;
    });
  };

  const getRestConflictInRoster = (sourceData, empId, dayNum, currentShift) => {
    if (dayNum <= 1) return null;

    const previousDay = sourceData?.[dayNum - 1];
    if (!previousDay) return null;

    const targetId = normalizeId(empId);
    if (!targetId) return null;

    const existsInShift = (shiftData) => {
      if (!shiftData) return false;

      const leaderMatch = normalizeId(shiftData.leader) === targetId;
      const memberMatch = (shiftData.members || []).some(
        (member) => normalizeId(member) === targetId,
      );

      return leaderMatch || memberMatch;
    };

    const wasInShift2Yesterday = existsInShift(previousDay.shift2);
    const wasInShift3Yesterday = existsInShift(previousDay.shift3);

    if (wasInShift3Yesterday && currentShift === "shift1") {
      return "كان في الوردية الثالثة أمس";
    }

    if (wasInShift3Yesterday && currentShift === "shift2") {
      return "كان في الوردية الثالثة أمس";
    }

    if (wasInShift2Yesterday && currentShift === "shift1") {
      return "كان في الوردية الثانية أمس";
    }

    return null;
  };

  const updateAutoFillStats = (stats, empId, shiftKey, role) => {
    const id = normalizeId(empId);
    if (!id || !stats[id]) return;

    stats[id].total += 1;
    stats[id][`${shiftKey}Count`] += 1;

    if (role === "leader") {
      stats[id].leaderCount += 1;
    } else {
      stats[id].memberCount += 1;
    }
  };

  const getEmployeeShiftInRosterForPattern = (sourceData, empId, dayNum) => {
    const targetId = normalizeId(empId);
    const dayData = sourceData?.[dayNum];

    if (!targetId || !dayData) return REST_DAY;

    for (const shiftKey of ["shift1", "shift2", "shift3"]) {
      const shift = dayData[shiftKey];
      if (!shift) continue;

      const isLeader = normalizeId(shift.leader) === targetId;
      const isMember = (shift.members || []).some(
        (member) => normalizeId(member) === targetId,
      );

      if (isLeader || isMember) return shiftKey;
    }

    return REST_DAY;
  };

  const checkEmployeeWorkPattern = (sourceData, empId, dayNum, proposedShift) => {
    const maxPatternLength = Math.max(
      ...preferredWorkPatterns.map((pattern) => pattern.sequence.length),
    );
    const windowStart = Math.max(1, dayNum - maxPatternLength * 2 + 1);
    const days = [];

    for (let d = windowStart; d <= dayNum; d++) {
      days.push({
        day: d,
        value:
          d === dayNum
            ? proposedShift
            : getEmployeeShiftInRosterForPattern(sourceData, empId, d),
      });
    }

    const firstWorkIndex = days.findIndex((item) => item.value !== REST_DAY);

    if (firstWorkIndex === -1) {
      return {
        valid: true,
        penalty: 0,
        reason: "",
        matchedPattern: "",
      };
    }

    // تجاهل فترات الراحة الطويلة قبل بداية بلوك العمل، مع الاحتفاظ بيومين راحة بحد أقصى
    // لأن القاعدة الأساسية تسمح براحتين قبل بداية دورة عمل جديدة.
    const relevantDays = days.slice(Math.max(0, firstWorkIndex - 2));

    for (const pattern of preferredWorkPatterns) {
      const { sequence } = pattern;

      for (let offset = 0; offset < sequence.length; offset++) {
        const matches = relevantDays.every(({ day, value }) => {
          const expected = sequence[(day - 1 + offset) % sequence.length];
          return expected === value;
        });

        if (matches) {
          return {
            valid: true,
            penalty: 0,
            reason: "",
            matchedPattern: pattern.name,
          };
        }
      }
    }

    const readableSequence = relevantDays
      .map((item) => `${item.day}: ${workShiftLabels[item.value] || item.value}`)
      .join("، ");

    return {
      valid: false,
      penalty: 3000,
      reason: `خارج أنماط التشغيل المفضلة (${readableSequence})`,
      matchedPattern: "",
    };
  };

  const getAutoFillSlotValue = (sourceData, dayNum, shiftKey, role, memberIndex) => {
    if (role === "leader") return sourceData?.[dayNum]?.[shiftKey]?.leader || "";
    return sourceData?.[dayNum]?.[shiftKey]?.members?.[memberIndex] || "";
  };

  const setAutoFillSlotValue = (
    sourceData,
    dayNum,
    shiftKey,
    role,
    memberIndex,
    value,
  ) => {
    if (role === "leader") {
      sourceData[dayNum][shiftKey].leader = value;
      return;
    }

    sourceData[dayNum][shiftKey].members[memberIndex] = value;
  };

  const canUseEmployeeForAutoFill = ({
    sourceData,
    empId,
    dayNum,
    shiftKey,
    role = "members",
    leaderEligibleIds,
    avoidPendingLeave = false,
  }) => {
    const id = normalizeId(empId);
    if (!id) return false;

    if (role === "leader" && leaderEligibleIds && !leaderEligibleIds.has(id)) {
      return false;
    }

    if (isEmployeeUsedInDay(sourceData, dayNum, id)) return false;

    const leaveInfo = getEmployeeLeaveInfo(id, dayNum);
    if (leaveInfo?.status === "approved") return false;
    if (avoidPendingLeave && leaveInfo?.status === "pending") return false;

    const restReason = getRestConflictInRoster(sourceData, id, dayNum, shiftKey);
    if (restReason) return false;

    return true;
  };

  const getShiftPeopleCount = (shiftData) => {
    if (!shiftData) return { hasLeader: false, membersCount: 0, total: 0 };

    const hasLeader = !!normalizeId(shiftData.leader);
    const membersCount = (shiftData.members || []).filter(
      (member) => !!normalizeId(member),
    ).length;

    return {
      hasLeader,
      membersCount,
      total: (hasLeader ? 1 : 0) + membersCount,
    };
  };

  const fillShiftFromWorkGroup = ({
    sourceData,
    stats,
    group,
    dayNum,
    shiftKey,
    leaderEligibleIds,
  }) => {
    if (!group) return { filled: 0, primaryUnavailable: 0 };

    let filled = 0;
    let primaryUnavailable = 0;
    const shiftData = sourceData?.[dayNum]?.[shiftKey];
    if (!shiftData) return { filled, primaryUnavailable };

    const groupLeaderId = normalizeId(group.leaderId);

    if (!normalizeId(shiftData.leader) && groupLeaderId) {
      if (
        canUseEmployeeForAutoFill({
          sourceData,
          empId: groupLeaderId,
          dayNum,
          shiftKey,
          role: "leader",
          leaderEligibleIds,
          avoidPendingLeave: true,
        })
      ) {
        shiftData.leader = groupLeaderId;
        updateAutoFillStats(stats, groupLeaderId, shiftKey, "leader");
        filled += 1;
      } else {
        primaryUnavailable += 1;
      }
    }

    const availableGroupMembers = (group.memberIds || [])
      .map(normalizeId)
      .filter(Boolean)
      .filter((memberId) => {
        const available = canUseEmployeeForAutoFill({
          sourceData,
          empId: memberId,
          dayNum,
          shiftKey,
          role: "members",
          leaderEligibleIds,
          avoidPendingLeave: true,
        });

        if (!available) primaryUnavailable += 1;
        return available;
      });

    let memberPointer = 0;

    for (let index = 0; index < 3; index++) {
      if (normalizeId(shiftData.members?.[index])) continue;

      const nextMemberId = availableGroupMembers[memberPointer];
      if (!nextMemberId) break;

      shiftData.members[index] = nextMemberId;
      updateAutoFillStats(stats, nextMemberId, shiftKey, "members");
      memberPointer += 1;
      filled += 1;
    }

    return { filled, primaryUnavailable };
  };

  const getWorkGroupPotentialForShift = ({
    sourceData,
    group,
    dayNum,
    shiftKey,
    leaderEligibleIds,
  }) => {
    const groupLeaderId = normalizeId(group.leaderId);
    const leaderAvailable = groupLeaderId
      ? canUseEmployeeForAutoFill({
          sourceData,
          empId: groupLeaderId,
          dayNum,
          shiftKey,
          role: "leader",
          leaderEligibleIds,
          avoidPendingLeave: true,
        })
      : false;
    const availableMembersCount = (group.memberIds || []).filter((memberId) =>
      canUseEmployeeForAutoFill({
        sourceData,
        empId: memberId,
        dayNum,
        shiftKey,
        role: "members",
        leaderEligibleIds,
        avoidPendingLeave: true,
      }),
    ).length;

    return {
      leaderAvailable,
      availableMembersCount,
      potentialPeople: (leaderAvailable ? 1 : 0) + availableMembersCount,
    };
  };

  const findRotationWorkGroupForShift = ({
    sourceData,
    groupUsageCounts,
    usedGroupIdsForDay,
    dayNum,
    shiftKey,
    leaderEligibleIds,
  }) => {
    const activeGroups = workGroups.filter(
      (group) => normalizeId(group.leaderId) || (group.memberIds || []).length > 0,
    );

    if (activeGroups.length === 0) return null;

    const shiftCyclePosition = {
      shift1: 0,
      shift2: 1,
      shift3: 2,
    }[shiftKey];

    const dayIndex = dayNum - 1;
    const rotationCandidates = activeGroups
      .map((group, index) => ({ group, index }))
      .filter(({ group, index }) => {
        if (usedGroupIdsForDay.has(group.id)) return false;
        return (dayIndex + index) % 5 === shiftCyclePosition;
      })
      .map(({ group }) => {
        const potential = getWorkGroupPotentialForShift({
          sourceData,
          group,
          dayNum,
          shiftKey,
          leaderEligibleIds,
        });
        const usage = groupUsageCounts[group.id] || 0;
        const score =
          usage * 1000 +
          (potential.leaderAvailable ? 0 : 120) -
          potential.potentialPeople * 30;

        return { group, score, ...potential };
      })
      .filter((candidate) => candidate.potentialPeople > 0);

    if (rotationCandidates.length === 0) return null;

    rotationCandidates.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (b.potentialPeople !== a.potentialPeople) {
        return b.potentialPeople - a.potentialPeople;
      }
      return String(a.group.name || "").localeCompare(String(b.group.name || ""), "ar");
    });

    return rotationCandidates[0]?.group || null;
  };

  const findBestWorkGroupForShift = ({
    sourceData,
    stats,
    groupUsageCounts,
    usedGroupIdsForDay,
    dayNum,
    shiftKey,
    leaderEligibleIds,
  }) => {
    const activeGroups = workGroups.filter(
      (group) => normalizeId(group.leaderId) || (group.memberIds || []).length > 0,
    );

    if (activeGroups.length === 0) return null;

    const candidates = activeGroups.map((group) => {
      const groupId = group.id;
      const isUsedToday = usedGroupIdsForDay.has(groupId);
      const potential = getWorkGroupPotentialForShift({
        sourceData,
        group,
        dayNum,
        shiftKey,
        leaderEligibleIds,
      });
      const usage = groupUsageCounts[groupId] || 0;
      const score =
        usage * 1000 +
        (isUsedToday ? 500 : 0) +
        (potential.leaderAvailable ? 0 : 250) -
        potential.potentialPeople * 30;

      return { group, score, potentialPeople: potential.potentialPeople };
    });

    candidates.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (b.potentialPeople !== a.potentialPeople) {
        return b.potentialPeople - a.potentialPeople;
      }
      return String(a.group.name || "").localeCompare(String(b.group.name || ""), "ar");
    });

    return candidates[0]?.group || null;
  };

  const findBestEmployeeForSlot = ({
    sourceData,
    stats,
    leaderEligibleIds,
    dayNum,
    shiftKey,
    role,
    memberIndex,
    preferredEmployeeIds = [],
  }) => {
    const preferredIdSet = new Set(
      (preferredEmployeeIds || []).map(normalizeId).filter(Boolean),
    );
    const candidates = [];
    const rejectionCounts = {
      notLeader: 0,
      sameDay: 0,
      approvedLeave: 0,
      rest: 0,
    };

    employees.forEach((emp) => {
      const id = normalizeId(emp._id);
      if (!id) return;

      if (role === "leader" && !leaderEligibleIds.has(id)) {
        rejectionCounts.notLeader += 1;
        return;
      }

      if (isEmployeeUsedInDay(sourceData, dayNum, id)) {
        rejectionCounts.sameDay += 1;
        return;
      }

      const leaveInfo = getEmployeeLeaveInfo(id, dayNum);

      if (leaveInfo?.status === "approved") {
        rejectionCounts.approvedLeave += 1;
        return;
      }

      const restReason = getRestConflictInRoster(sourceData, id, dayNum, shiftKey);
      if (restReason) {
        rejectionCounts.rest += 1;
        return;
      }

      const empStats = stats[id] || {
        total: 0,
        leaderCount: 0,
        memberCount: 0,
        shift1Count: 0,
        shift2Count: 0,
        shift3Count: 0,
      };
      const shiftCount = empStats[`${shiftKey}Count`] || 0;
      const roleCount = role === "leader" ? empStats.leaderCount : empStats.memberCount;
      const pendingPenalty = leaveInfo?.status === "pending" ? 700 : 0;
      const isPreferred = preferredIdSet.has(id);
      const preferencePenalty =
        preferredIdSet.size > 0 && !isPreferred && role !== "leader" ? 6000 : 0;
      const patternCheck = checkEmployeeWorkPattern(
        sourceData,
        id,
        dayNum,
        shiftKey,
      );
      const patternPenalty = patternCheck.penalty || 0;
      const workedYesterdayPenalty = isEmployeeUsedInDay(sourceData, dayNum - 1, id)
        ? 20
        : 0;
      const codeTieBreaker = Number(emp.employeeCode || 0) || 0;
      const deterministicTieBreaker =
        ((dayNum * 13 +
          codeTieBreaker * 7 +
          (memberIndex ?? 0) * 11 +
          (shiftKey === "shift1" ? 1 : shiftKey === "shift2" ? 2 : 3)) %
          37) /
        100;

      const score =
        empStats.total * 100 +
        shiftCount * 35 +
        roleCount * 25 +
        pendingPenalty +
        preferencePenalty +
        patternPenalty +
        workedYesterdayPenalty +
        deterministicTieBreaker;

      candidates.push({ emp, score, leaveInfo, patternCheck, isPreferred });
    });

    candidates.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const codeA = Number(a.emp.employeeCode || 0);
      const codeB = Number(b.emp.employeeCode || 0);
      if (codeA !== codeB) return codeA - codeB;
      return String(a.emp.name || "").localeCompare(String(b.emp.name || ""), "ar");
    });

    return {
      candidate: candidates[0] || null,
      rejectionCounts,
    };
  };

  const handleAutoFillRoster = (mode, skipConfirm = false) => {
    if (!employees.length) {
      toast.error("لا يوجد موظفون للتوزيع التلقائي");
      return;
    }

    const isRegenerate = mode === "regenerate";
    const modeLabel = isRegenerate
      ? "إعادة توزيع كاملة"
      : "ملء الخانات الفارغة فقط";

    if (isRegenerate && !skipConfirm) {
      showConfirmToast({
        title: "تأكيد إعادة التوزيع الكاملة",
        message: `سيتم مسح كل تسكين جدول ${monthNames[month - 1]} ${year} وإعادة توزيعه تلقائيًا من البداية. هل أنت متأكد؟`,
        confirmText: "إعادة التوزيع",
        danger: true,
        onConfirm: () => handleAutoFillRoster(mode, true),
      });
      return;
    }

    const originalRoster = cloneRosterForAutoFill(rosterData);
    const nextRoster = isRegenerate
      ? createEmptyRoster(month, year)
      : cloneRosterForAutoFill(rosterData);
    const fallbackLeaderIds = getLeaderEligibleIdsFromRoster(originalRoster);
    const workGroupLeaderIds = workGroups
      .map((group) => normalizeId(group.leaderId))
      .filter(Boolean);
    const leaderEligibleIds =
      shiftLeaderIds.length > 0
        ? new Set([
            ...shiftLeaderIds.map(normalizeId).filter(Boolean),
            ...workGroupLeaderIds,
          ])
        : new Set([...Array.from(fallbackLeaderIds), ...workGroupLeaderIds]);
    const stats = buildAutoFillStats(nextRoster);
    const groupUsageCounts = {};
    const usedGroupIdsByDay = {};
    const effectiveReserveEmployeeIds = reserveEmployeeIds.filter(
      (id) => !groupedEmployeeIdSet.has(normalizeId(id)),
    );
    const skippedSlots = [];
    const warnings = [];
    let filledCount = 0;
    let patternBreakCount = 0;
    const patternWarningLimit = 60;

    if (leaderEligibleIds.size === 0) {
      warnings.push(
        "لم يتم العثور على رؤساء نوبة سابقين في الجدول الحالي؛ لذلك سيتم ترك خانات رئيس النوبة الفارغة بدون توزيع. ضع رئيس نوبة واحد على الأقل يدويًا ثم جرّب مرة أخرى، أو غيّر معيار رؤساء النوبة لاحقًا.",
      );
    }

    const activeWorkGroups = workGroups.filter(
      (group) => normalizeId(group.leaderId) || (group.memberIds || []).length > 0,
    );
    const hasActiveWorkGroups = activeWorkGroups.length > 0;

    if (hasActiveWorkGroups && activeWorkGroups.length < 5) {
      warnings.push(
        `تنبيه: نظام الدوران الافتراضي صبح/ضهر/ليل/راحة/راحة يحتاج 5 مجموعات لتغطية كل الورديات يوميًا. الموجود حاليًا ${activeWorkGroups.length} مجموعة، لذلك قد يحدث تعويض أو خانات ناقصة.`,
      );
    }

    daysInMonth.forEach((day) => {
      usedGroupIdsByDay[day.dayNumber] = usedGroupIdsByDay[day.dayNumber] || new Set();

      ["shift1", "shift2", "shift3"].forEach((shiftKey) => {
        const initialShiftState = getShiftPeopleCount(
          nextRoster?.[day.dayNumber]?.[shiftKey],
        );

        if (hasActiveWorkGroups && !isRegenerate && initialShiftState.total > 0) {
          // في وضع "ملء الفراغات" لا نخلط مجموعة العمل مع تسكين موجود مسبقًا.
          // لو الشيفت فيه أي اختيار يدوي/قديم، نسيبه كما هو حفاظًا على الالتزام بالمجموعات.
          return;
        }

        if (hasActiveWorkGroups) {
          const rotationGroup = findRotationWorkGroupForShift({ 
            sourceData: nextRoster,
            groupUsageCounts,
            usedGroupIdsForDay: usedGroupIdsByDay[day.dayNumber],
            dayNum: day.dayNumber,
            shiftKey,
            leaderEligibleIds,
          });
          const bestGroup =
            rotationGroup ||
            findBestWorkGroupForShift({
              sourceData: nextRoster,
              stats,
              groupUsageCounts,
              usedGroupIdsForDay: usedGroupIdsByDay[day.dayNumber],
              dayNum: day.dayNumber,
              shiftKey,
              leaderEligibleIds,
            });

          if (bestGroup) {
            const beforeCount = getShiftPeopleCount(
              nextRoster?.[day.dayNumber]?.[shiftKey],
            ).total;
            const groupResult = fillShiftFromWorkGroup({
              sourceData: nextRoster,
              stats,
              group: bestGroup,
              dayNum: day.dayNumber,
              shiftKey,
              leaderEligibleIds,
            });
            const afterCount = getShiftPeopleCount(
              nextRoster?.[day.dayNumber]?.[shiftKey],
            ).total;

            if (afterCount > beforeCount) {
              groupUsageCounts[bestGroup.id] = (groupUsageCounts[bestGroup.id] || 0) + 1;
              usedGroupIdsByDay[day.dayNumber].add(bestGroup.id);
              filledCount += groupResult.filled;

              if (!rotationGroup) {
                warnings.push(
                  `لم توجد مجموعة مطابقة للدوران الافتراضي يوم ${day.dayNumber} (${day.dayName}) — النوبة ${shiftLabels[shiftKey]}، فتم اختيار ${bestGroup.name} كبديل.`,
                );
              }

              if (groupResult.primaryUnavailable > 0) {
                warnings.push(
                  `تم استخدام ${bestGroup.name} يوم ${day.dayNumber} (${day.dayName}) — النوبة ${shiftLabels[shiftKey]} مع تعويض/استكمال للحد الأدنى فقط بسبب إجازات أو تعارضات.`,
                );
              }
            }
          }
        }

        const shiftState = getShiftPeopleCount(nextRoster?.[day.dayNumber]?.[shiftKey]);
        let slots = [];

        if (hasActiveWorkGroups) {
          // في وضع مجموعات العمل: نلتزم بالمجموعة ولا نكمل من خارجها إلا للوصول للحد الأدنى
          // الحد الأدنى المقبول = رئيس نوبة + فرد واحد.
          if (shiftState.hasLeader && shiftState.membersCount >= 1) {
            return;
          }

          if (!shiftState.hasLeader) {
            slots.push({ role: "leader", memberIndex: null, label: "رئيس النوبة" });
          }

          if (shiftState.membersCount < 1) {
            const emptyMemberIndex = [0, 1, 2].find(
              (index) =>
                !normalizeId(nextRoster?.[day.dayNumber]?.[shiftKey]?.members?.[index]),
            );

            if (emptyMemberIndex !== undefined) {
              slots.push({
                role: "members",
                memberIndex: emptyMemberIndex,
                label: `فرد ${emptyMemberIndex + 1}`,
              });
            }
          }
        } else {
          slots = [
            { role: "leader", memberIndex: null, label: "رئيس النوبة" },
            { role: "members", memberIndex: 0, label: "فرد 1" },
            { role: "members", memberIndex: 1, label: "فرد 2" },
            { role: "members", memberIndex: 2, label: "فرد 3" },
          ];
        }

        slots.forEach((slot) => {
          const currentValue = getAutoFillSlotValue(
            nextRoster,
            day.dayNumber,
            shiftKey,
            slot.role,
            slot.memberIndex,
          );

          if (normalizeId(currentValue)) return;

          const { candidate, rejectionCounts } = findBestEmployeeForSlot({
            sourceData: nextRoster,
            stats,
            leaderEligibleIds,
            dayNum: day.dayNumber,
            shiftKey,
            role: slot.role === "leader" ? "leader" : "members",
            memberIndex: slot.memberIndex,
            preferredEmployeeIds:
              hasActiveWorkGroups && slot.role !== "leader"
                ? effectiveReserveEmployeeIds
                : [],
          });

          if (!candidate) {
            const reasons = [];
            if (slot.role === "leader" && leaderEligibleIds.size === 0) {
              reasons.push("لا توجد قائمة رؤساء نوبة مؤهلين");
            }
            if (rejectionCounts.approvedLeave > 0) {
              reasons.push(`${rejectionCounts.approvedLeave} إجازة معتمدة`);
            }
            if (rejectionCounts.sameDay > 0) {
              reasons.push(`${rejectionCounts.sameDay} مستخدمون في نفس اليوم`);
            }
            if (rejectionCounts.rest > 0) {
              reasons.push(`${rejectionCounts.rest} تعارض راحة`);
            }
            if (slot.role === "leader" && rejectionCounts.notLeader > 0) {
              reasons.push(`${rejectionCounts.notLeader} غير مؤهلين كرئيس نوبة`);
            }

            skippedSlots.push({
              day: day.dayNumber,
              dayName: day.dayName,
              shift: shiftLabels[shiftKey],
              slot: slot.label,
              reason: reasons.length ? reasons.join(" — ") : "لا يوجد موظف مناسب",
            });
            return;
          }

          setAutoFillSlotValue(
            nextRoster,
            day.dayNumber,
            shiftKey,
            slot.role,
            slot.memberIndex,
            candidate.emp._id,
          );
          updateAutoFillStats(
            stats,
            candidate.emp._id,
            shiftKey,
            slot.role === "leader" ? "leader" : "members",
          );

          if (
            hasActiveWorkGroups &&
            slot.role !== "leader" &&
            candidate.isPreferred
          ) {
            warnings.push(
              `تم استخدام الاحتياطي ${candidate.emp.name || "موظف"} يوم ${day.dayNumber} (${day.dayName}) — النوبة ${shiftLabels[shiftKey]} للوصول إلى الحد الأدنى للتغطية.`,
            );
          }

          if (candidate.patternCheck && !candidate.patternCheck.valid) {
            patternBreakCount += 1;

            if (patternBreakCount <= patternWarningLimit) {
              warnings.push(
                `تم كسر نمط التشغيل للموظف ${candidate.emp.name || "موظف"} يوم ${day.dayNumber} (${day.dayName}) — النوبة ${shiftLabels[shiftKey]} — ${slot.label}: ${candidate.patternCheck.reason}`,
              );
            }
          }

          filledCount += 1;
        });
      });
    });

    if (patternBreakCount > patternWarningLimit) {
      warnings.push(
        `... وتم كسر نمط التشغيل في ${patternBreakCount - patternWarningLimit} خانات أخرى بسبب عدم توفر بدائل أفضل.`,
      );
    }

    setRosterData(nextRoster);
    setAutoFillReport({
      isOpen: true,
      mode: modeLabel,
      filledCount,
      skippedSlots,
      warnings,
    });

    if (skippedSlots.length > 0 || warnings.length > 0) {
      toast.success(`تم التوزيع تلقائيًا مع ${skippedSlots.length} خانة غير مكتملة`);
    } else {
      toast.success(`تم ${modeLabel} بنجاح`);
    }
  };

  const renderAutoFillButtons = (compact = false) => {
    const buttonSizeClass = compact
      ? "px-2.5 py-1.5 text-[11px]"
      : "px-4 py-2.5 text-sm";

    return (
      <>
        <button
          type="button"
          onClick={() => handleAutoFillRoster("fill-empty")}
          className={`rounded-lg bg-yellow-500 font-black text-slate-950 shadow-sm transition hover:bg-yellow-400 ${buttonSizeClass}`}
        >
          ✨ ملء الفراغات تلقائيًا
        </button>
        <button
          type="button"
          onClick={() => handleAutoFillRoster("regenerate")}
          className={`rounded-lg bg-rose-600 font-bold text-white shadow-sm transition hover:bg-rose-700 ${buttonSizeClass}`}
        >
          إعادة توزيع كاملة
        </button>
      </>
    );
  };

  const renderLeadersButton = (compact = false) => (
    <button
      type="button"
      onClick={() => setIsLeadersModalOpen(true)}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 font-bold text-white shadow-sm transition hover:bg-cyan-700 ${
        compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-sm"
      }`}
    >
      <Users size={compact ? 14 : 16} />
      إدارة رؤساء النوبات
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">
        {shiftLeaderIds.length}
      </span>
    </button>
  );

  const renderWorkGroupsButton = (compact = false) => (
    <button
      type="button"
      onClick={() => setIsWorkGroupsModalOpen(true)}
      className={`inline-flex items-center gap-1.5 rounded-lg bg-fuchsia-600 font-bold text-white shadow-sm transition hover:bg-fuchsia-700 ${
        compact ? "px-2.5 py-1.5 text-[11px]" : "px-4 py-2.5 text-sm"
      }`}
    >
      <Users size={compact ? 14 : 16} />
      مجموعات العمل
      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black">
        {workGroups.length}
      </span>
    </button>
  );

  const renderRosterActionButtons = (compact = false) => {
    const buttonSizeClass = compact
      ? "px-2.5 py-1.5 text-[11px]"
      : "px-4 py-2.5 text-sm";

    return (
      <>
        {rosterStatus === "published" ? (
          <button
            type="button"
            onClick={() => handleSaveRoster("published")}
            className={`rounded-lg bg-orange-500 font-bold text-white shadow-sm transition hover:bg-orange-600 ${buttonSizeClass}`}
          >
            تحديث الجدول المعتمد
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleClearDraft()}
              className={`rounded-lg bg-red-100 font-bold text-red-700 shadow-sm transition hover:bg-red-200 ${buttonSizeClass}`}
            >
              مسح المسودة
            </button>
            <button
              type="button"
              onClick={() => handleSaveRoster("draft")}
              className={`rounded-lg bg-slate-600 font-bold text-white shadow-sm transition hover:bg-slate-700 ${buttonSizeClass}`}
            >
              حفظ كمسودة
            </button>
            <button
              type="button"
              onClick={() => handleSaveRoster("published")}
              className={`rounded-lg bg-green-600 font-bold text-white shadow-sm transition hover:bg-green-700 ${buttonSizeClass}`}
            >
              اعتماد ونشر الروستر
            </button>
          </>
        )}
      </>
    );
  };

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
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 no-print">
            {renderHighlightSearchBox()}

            <div className="flex flex-wrap items-center justify-end gap-2">
              {renderLeadersButton()}
              {renderWorkGroupsButton()}
              {renderAutoFillButtons()}

              <button
                type="button"
                onClick={() => setIsRosterFullscreen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Maximize2 size={16} />
                عرض الجدول ملء الشاشة
              </button>
            </div>
          </div>

          <div
            className={
              isRosterFullscreen
                ? "fixed inset-0 z-[9998] flex min-h-0 flex-col bg-slate-50 p-1.5 print:static print:block print:bg-white print:p-0"
                : "print:block"
            }
          >
            {isRosterFullscreen && (
              <div className="mb-1.5 shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm no-print">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-black text-slate-800">
                      إدارة الروستر - {monthNames[month - 1]} {year}
                    </h2>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                      وضع ملء الشاشة — Esc للخروج
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {loading && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600"></span>
                        جاري تحميل البيانات...
                      </span>
                    )}

                    {renderLeadersButton(true)}
                    {renderWorkGroupsButton(true)}
                    {renderAutoFillButtons(true)}

                    <button
                      type="button"
                      onClick={handlePrint}
                      className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      طباعة PDF
                    </button>

                    {renderRosterActionButtons(true)}

                    <button
                      type="button"
                      onClick={() => setIsRosterFullscreen(false)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-slate-800"
                    >
                      <Minimize2 size={14} />
                      خروج
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 border-t border-slate-100 pt-1.5">
                  {renderHighlightSearchBox("fullscreen")}
                </div>
              </div>
            )}

            <div
              className={
                isRosterFullscreen
                  ? "min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
                  : "max-h-[78vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm print:w-full print:overflow-visible"
              }
            >
              <table
                className={`print-table w-full table-fixed border-collapse leading-tight ${
                  isRosterFullscreen ? "text-[10px]" : "text-[11px]"
                }`}
              >
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
                      <td className={`border-2 border-black bg-slate-50 font-bold ${isRosterFullscreen ? "p-1" : "p-1.5"}`}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white">
                            {day.dayName}
                          </span>
                        </div>
                      </td>
                      <td className={`border-2 border-black bg-slate-50 font-bold ${isRosterFullscreen ? "p-1" : "p-1.5"}`}>
                        <span className="inline-flex min-w-[28px] items-center justify-center rounded-md bg-white px-2 py-1 text-[11px] shadow-sm">
                          {day.dayNumber}
                        </span>
                      </td>
                      <td
                        className={`border-2 border-black ${isRosterFullscreen ? "p-1" : "p-1.5"} ${shiftThemes.shift1.cell}`}
                      >
                        {renderEmployeeDropdown(day.dayNumber, "shift1", "leader")}
                      </td>
                      <td
                        className={`border-2 border-black ${isRosterFullscreen ? "p-1" : "p-1.5"} ${shiftThemes.shift1.cell}`}
                      >
                        <div className={`flex flex-col ${isRosterFullscreen ? "gap-0.5" : "gap-1"}`}>
                          {renderEmployeeDropdown(day.dayNumber, "shift1", "members", 0)}
                          {renderEmployeeDropdown(day.dayNumber, "shift1", "members", 1)}
                          {renderEmployeeDropdown(day.dayNumber, "shift1", "members", 2)}
                        </div>
                      </td>
                      <td
                        className={`border-2 border-black ${isRosterFullscreen ? "p-1" : "p-1.5"} ${shiftThemes.shift2.cell}`}
                      >
                        {renderEmployeeDropdown(day.dayNumber, "shift2", "leader")}
                      </td>
                      <td
                        className={`border-2 border-black ${isRosterFullscreen ? "p-1" : "p-1.5"} ${shiftThemes.shift2.cell}`}
                      >
                        <div className={`flex flex-col ${isRosterFullscreen ? "gap-0.5" : "gap-1"}`}>
                          {renderEmployeeDropdown(day.dayNumber, "shift2", "members", 0)}
                          {renderEmployeeDropdown(day.dayNumber, "shift2", "members", 1)}
                          {renderEmployeeDropdown(day.dayNumber, "shift2", "members", 2)}
                        </div>
                      </td>
                      <td
                        className={`border-2 border-black ${isRosterFullscreen ? "p-1" : "p-1.5"} ${shiftThemes.shift3.cell}`}
                      >
                        {renderEmployeeDropdown(day.dayNumber, "shift3", "leader")}
                      </td>
                      <td
                        className={`border-2 border-black ${isRosterFullscreen ? "p-1" : "p-1.5"} ${shiftThemes.shift3.cell}`}
                      >
                        <div className={`flex flex-col ${isRosterFullscreen ? "gap-0.5" : "gap-1"}`}>
                          {renderEmployeeDropdown(day.dayNumber, "shift3", "members", 0)}
                          {renderEmployeeDropdown(day.dayNumber, "shift3", "members", 1)}
                          {renderEmployeeDropdown(day.dayNumber, "shift3", "members", 2)}
                        </div>
                      </td>
                      <td className={`border-2 border-black ${isRosterFullscreen ? "p-1" : "p-1.5"}`}>
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
                          className={`w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-2 font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 no-print ${
                            isRosterFullscreen
                              ? "min-h-[36px] py-1 text-[10px]"
                              : "min-h-[58px] py-1.5 text-[11px]"
                          }`}
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
                isSummaryOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
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
                        <option value="leader-desc">ترتيب: الأكثر رؤساء نوبة</option>
                        <option value="shift1-desc">ترتيب: الأكثر بالأولى</option>
                        <option value="shift2-desc">ترتيب: الأكثر بالثانية</option>
                        <option value="shift3-desc">ترتيب: الأكثر بالثالثة</option>
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
                        <th className="whitespace-nowrap p-3 text-center">الإجمالي</th>
                        <th className="whitespace-nowrap p-3 text-center">رئيس نوبة</th>
                        <th className="whitespace-nowrap p-3 text-center">فرد نوبة</th>
                        <th className="whitespace-nowrap p-3 text-center">الأولى</th>
                        <th className="whitespace-nowrap p-3 text-center">الثانية</th>
                        <th className="whitespace-nowrap p-3 text-center">الثالثة</th>
                        <th className="whitespace-nowrap p-3 text-center">الإجازات المعتمدة</th>
                        <th className="whitespace-nowrap p-3 text-center">الحالة</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {visibleEmployeeRosterSummary.map((emp) => {
                        const status = getEmployeeLoadStatus(emp);

                        return (
                          <tr key={emp._id} className="transition hover:bg-slate-50">
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
                            <td className="p-3 text-center">{emp.shift1Count}</td>
                            <td className="p-3 text-center">{emp.shift2Count}</td>
                            <td className="p-3 text-center">{emp.shift3Count}</td>
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
              type="button"
              onClick={() => openPreviewModal()}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Eye size={16} />
              معاينة جدول موظف
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
            >
              طباعة PDF
            </button>

            {renderRosterActionButtons()}
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
                  type="button"
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
                  type="button"
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

      {isWorkGroupsModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-2 no-print">
            <div className="flex h-[96vh] w-[98vw] max-w-none flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="shrink-0 border-b border-fuchsia-100 bg-fuchsia-50 px-5 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-black text-fuchsia-800">
                      <Users size={20} />
                      إدارة مجموعات العمل
                    </h3>
                    <p className="mt-1 text-xs font-bold text-slate-600">
                      المجموعات محفوظة محليًا على هذا الجهاز. التوزيع التلقائي سيحاول تسكين المجموعة معًا، ولو عضو عنده إجازة/تعارض يتم تعويضه من المتاحين.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWorkGroupsModalOpen(false)}
                    className="rounded-xl border border-fuchsia-200 bg-white p-2 text-slate-500 transition hover:bg-fuchsia-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
                <div className="flex min-h-0 flex-col border-b border-slate-100 bg-slate-50 p-4 lg:border-b-0 lg:border-l">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-black text-slate-800">
                        المجموعات
                      </div>
                      <div className="mt-1 text-[11px] font-bold text-slate-500">
                        {workGroups.length} مجموعة
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={createWorkGroup}
                      className="rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-fuchsia-700"
                    >
                      + إضافة
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
                    {workGroups.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs font-bold leading-6 text-slate-500">
                        لا توجد مجموعات بعد. اضغط إضافة لإنشاء أول مجموعة عمل.
                      </div>
                    ) : (
                      workGroups.map((group) => {
                        const selected = group.id === selectedWorkGroupId;
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => setSelectedWorkGroupId(group.id)}
                            className={`w-full rounded-xl border p-3 text-right transition ${
                              selected
                                ? "border-fuchsia-300 bg-fuchsia-50 shadow-sm"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <div className="font-black text-slate-800">
                              {group.name}
                            </div>
                            <div className="mt-1 text-[11px] font-bold text-slate-500">
                              رئيس: {getEmployeeNameById(group.leaderId)}
                            </div>
                            <div className="mt-1 text-[11px] font-bold text-slate-500">
                              أفراد: {(group.memberIds || []).length}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-black text-amber-800">
                        أفراد الاحتياطي
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800">
                        {reserveEmployeeIds.length}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {reserveEmployeeIds.length === 0 ? (
                        <span className="text-[11px] font-bold text-amber-700">
                          لا يوجد احتياطي محدد
                        </span>
                      ) : (
                        reserveEmployeeIds.map((id) => (
                          <span
                            key={id}
                            className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-amber-800"
                          >
                            {getEmployeeNameById(id)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex min-h-0 flex-col bg-white">
                  {selectedWorkGroup ? (
                    <>
                      <div className="shrink-0 border-b border-slate-100 p-3">
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-700">
                              اسم المجموعة
                            </label>
                            <input
                              type="text"
                              value={selectedWorkGroup.name}
                              onChange={(e) =>
                                updateWorkGroup(selectedWorkGroup.id, {
                                  name: e.target.value,
                                })
                              }
                              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                            />
                          </div>

                          <div>
                            <label className="mb-1.5 block text-xs font-bold text-slate-700">
                              رئيس المجموعة / رئيس النوبة
                            </label>
                            <select
                              value={selectedWorkGroup.leaderId || ""}
                              onChange={(e) =>
                                updateWorkGroup(selectedWorkGroup.id, {
                                  leaderId: e.target.value,
                                })
                              }
                              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                            >
                              <option value="">اختر رئيس المجموعة</option>
                              {employees.map((emp) => (
                                <option key={emp._id} value={emp._id}>
                                  {emp.name} - {emp.employeeCode || "—"}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteWorkGroup(selectedWorkGroup.id)}
                            className="rounded-xl bg-red-100 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-200"
                          >
                            حذف المجموعة
                          </button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-[11px] font-black text-fuchsia-800">
                            أفراد المجموعة: {(selectedWorkGroup.memberIds || []).length}
                          </span>
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-800">
                            الاحتياطي: {reserveEmployeeIds.length}
                          </span>
                          {reserveEmployeeIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => persistReserveEmployeeIds([])}
                              className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100"
                            >
                              مسح الاحتياطي
                            </button>
                          )}
                          {(selectedWorkGroup.memberIds || []).length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                updateWorkGroup(selectedWorkGroup.id, {
                                  memberIds: [],
                                })
                              }
                              className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200"
                            >
                              مسح أفراد المجموعة
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 border-b border-slate-100 p-3">
                        <div className="relative w-full max-w-2xl">
                          <Search
                            size={16}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="text"
                            value={workGroupSearch}
                            onChange={(e) => setWorkGroupSearch(e.target.value)}
                            placeholder="ابحث لإضافة أفراد المجموعة أو تحديد الاحتياطي..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-9 pl-9 text-sm font-bold text-slate-700 outline-none transition focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-100"
                          />
                          {workGroupSearch.trim() && (
                            <button
                              type="button"
                              onClick={() => setWorkGroupSearch("")}
                              className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-3">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                          {visibleWorkGroupEmployees.map((emp) => {
                            const id = normalizeId(emp._id);
                            const isLeader =
                              normalizeId(selectedWorkGroup.leaderId) === id;
                            const checked = (selectedWorkGroup.memberIds || [])
                              .map(normalizeId)
                              .includes(id);

                            const isReserve = reserveEmployeeIdSet.has(id);
                            const inAnyGroup = groupedEmployeeIdSet.has(id);

                            return (
                              <div
                                key={emp._id}
                                className={`rounded-xl border p-3 text-right transition ${
                                  isReserve
                                    ? "border-amber-300 bg-amber-50 shadow-sm"
                                    : isLeader
                                      ? "border-cyan-200 bg-cyan-50"
                                      : checked
                                        ? "border-fuchsia-300 bg-fuchsia-50 shadow-sm"
                                        : "border-slate-200 bg-white"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-black text-slate-800">
                                      {emp.name}
                                    </div>
                                    <div className="mt-1 text-[11px] font-bold text-slate-500">
                                      كود: {emp.employeeCode || "—"}
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {isLeader && (
                                        <span className="inline-flex rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-700">
                                          رئيس المجموعة
                                        </span>
                                      )}
                                      {checked && (
                                        <span className="inline-flex rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-black text-fuchsia-700">
                                          فرد بالمجموعة
                                        </span>
                                      )}
                                      {isReserve && (
                                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">
                                          احتياطي
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    disabled={isLeader || isReserve}
                                    onClick={() =>
                                      toggleWorkGroupMember(selectedWorkGroup.id, emp._id)
                                    }
                                    className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
                                      checked
                                        ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700"
                                        : isLeader || isReserve
                                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                    }`}
                                  >
                                    {checked ? "إزالة من المجموعة" : "فرد بالمجموعة"}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={inAnyGroup && !isReserve}
                                    onClick={() => toggleReserveEmployee(emp._id)}
                                    className={`rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
                                      isReserve
                                        ? "bg-amber-500 text-white hover:bg-amber-600"
                                        : inAnyGroup
                                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
                                          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                    }`}
                                  >
                                    {isReserve ? "إزالة الاحتياطي" : "احتياطي"}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {visibleWorkGroupEmployees.length === 0 && (
                          <div className="rounded-xl bg-white p-8 text-center text-sm font-bold text-slate-400">
                            لا توجد نتائج مطابقة للبحث
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-1 items-center justify-center p-8 text-center">
                      <div>
                        <div className="text-4xl">👥</div>
                        <div className="mt-3 text-sm font-black text-slate-700">
                          اختر مجموعة من القائمة أو أنشئ مجموعة جديدة
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-5 py-3">
                <p className="text-xs font-bold text-slate-500">
                  الحد الأدنى المقبول للوردية في الاعتماد أصبح: رئيس نوبة + فرد واحد.
                </p>
                <button
                  type="button"
                  onClick={() => setIsWorkGroupsModalOpen(false)}
                  className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
                >
                  تم
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isLeadersModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4 no-print">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-cyan-100 bg-cyan-50 px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-black text-cyan-800">
                      <Users size={20} />
                      إدارة رؤساء النوبات
                    </h3>
                    <p className="mt-1 text-xs font-bold text-slate-600">
                      اختر الموظفين المؤهلين لرئاسة النوبة في {monthNames[month - 1]} {year}. التوزيع التلقائي سيستخدم هذه القائمة أولًا.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLeadersModalOpen(false)}
                    className="rounded-xl border border-cyan-200 bg-white p-2 text-slate-500 transition hover:bg-cyan-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="border-b border-slate-100 bg-white px-6 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={leaderSearch}
                      onChange={(e) => setLeaderSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو الكود..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-9 pl-9 text-sm font-bold text-slate-700 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    />
                    {leaderSearch.trim() && (
                      <button
                        type="button"
                        onClick={() => setLeaderSearch("")}
                        className="absolute left-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 transition hover:bg-slate-300"
                        title="مسح البحث"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-[11px] font-black text-cyan-800">
                      محدد: {shiftLeaderIds.length}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                      المعروض: {visibleLeaderEmployees.length}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      persistShiftLeaderIds(employees.map((emp) => emp._id))
                    }
                    className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-cyan-700"
                  >
                    تحديد كل الموظفين
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      persistShiftLeaderIds([
                        ...shiftLeaderIds,
                        ...visibleLeaderEmployees.map((emp) => emp._id),
                      ])
                    }
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
                  >
                    تحديد المعروض
                  </button>
                  <button
                    type="button"
                    onClick={importShiftLeadersFromCurrentRoster}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    استيراد من رؤساء الجدول الحالي
                  </button>
                  <button
                    type="button"
                    onClick={() => persistShiftLeaderIds([])}
                    className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-300"
                  >
                    إلغاء الكل
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-slate-50 px-6 py-4">
                {visibleLeaderEmployees.length === 0 ? (
                  <div className="rounded-xl bg-white p-8 text-center text-sm font-bold text-slate-400">
                    لا توجد نتائج مطابقة للبحث
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {visibleLeaderEmployees.map((emp) => {
                      const id = normalizeId(emp._id);
                      const checked = shiftLeaderIdSet.has(id);

                      return (
                        <button
                          key={emp._id}
                          type="button"
                          onClick={() => toggleShiftLeader(emp._id)}
                          className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-right transition ${
                            checked
                              ? "border-cyan-300 bg-cyan-50 shadow-sm"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-black text-slate-800">
                              {emp.name}
                            </div>
                            <div className="mt-1 text-[11px] font-bold text-slate-500">
                              كود: {emp.employeeCode || "—"}
                            </div>
                            <div className="mt-1 text-[11px] font-bold text-slate-500">
                              الدرجة: {emp.jobGrade || "—"}
                            </div>
                          </div>

                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-black ${
                              checked
                                ? "border-cyan-500 bg-cyan-600 text-white"
                                : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            ✓
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-6 py-4">
                <p className="text-xs font-bold text-slate-500">
                  يتم حفظ الاختيارات محليًا لهذا الشهر والسنة على نفس الجهاز.
                </p>
                <button
                  type="button"
                  onClick={() => setIsLeadersModalOpen(false)}
                  className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
                >
                  تم
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {autoFillReport.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50 p-4 no-print">
            <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-yellow-100 bg-yellow-50 px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-yellow-800">
                      ✨ تقرير التوزيع التلقائي
                    </h3>
                    <p className="mt-1 text-xs font-bold text-slate-600">
                      الوضع: {autoFillReport.mode} — تم ملء {autoFillReport.filledCount} خانة
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAutoFillReport({
                        isOpen: false,
                        mode: "",
                        filledCount: 0,
                        skippedSlots: [],
                        warnings: [],
                      })
                    }
                    className="rounded-xl border border-yellow-200 bg-white p-2 text-slate-500 transition hover:bg-yellow-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="max-h-[62vh] space-y-4 overflow-y-auto px-6 py-4">
                {autoFillReport.warnings.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-2 text-sm font-black text-amber-800">
                      تنبيهات مهمة
                    </div>
                    <div className="space-y-2">
                      {autoFillReport.warnings.map((warning, index) => (
                        <div key={index} className="text-xs font-bold leading-6 text-amber-800">
                          ⚠️ {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {autoFillReport.skippedSlots.length > 0 ? (
                  <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-black text-red-700">
                        خانات لم يتمكن النظام من ملئها ({autoFillReport.skippedSlots.length})
                      </span>
                      <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-bold text-red-700">
                        لم يتم كسر قواعد الإجازات أو التكرار أو الراحة
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {autoFillReport.skippedSlots.slice(0, 60).map((slot, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-1 gap-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-xs md:grid-cols-[1fr_1.4fr]"
                        >
                          <span className="font-black text-slate-800">
                            يوم {slot.day} ({slot.dayName}) — النوبة {slot.shift} — {slot.slot}
                          </span>
                          <span className="font-bold text-red-700">
                            {slot.reason}
                          </span>
                        </div>
                      ))}

                      {autoFillReport.skippedSlots.length > 60 && (
                        <div className="text-center text-xs font-semibold text-slate-500">
                          ... و {autoFillReport.skippedSlots.length - 60} خانة أخرى
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-center text-sm font-black text-green-700">
                    تم ملء كل الخانات المطلوبة بنجاح بدون خانات متروكة.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setAutoFillReport({
                      isOpen: false,
                      mode: "",
                      filledCount: 0,
                      skippedSlots: [],
                      warnings: [],
                    })
                  }
                  className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
                >
                  تمام
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isPreviewOpen &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-2 no-print">
            <div className="flex h-[96vh] w-[98vw] max-w-none flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-5 py-3 md:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Eye className="text-blue-600" size={20} />
                      <h3 className="text-2xl font-black text-slate-800">
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

                <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[320px_1fr]">
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

              <div className="shrink-0 border-b border-slate-100 bg-white px-5 py-3 md:px-6">
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-2.5">
                    <div className="text-[11px] font-bold text-blue-700">
                      إجمالي التكليفات
                    </div>
                    <div className="mt-0.5 text-2xl font-black text-blue-800">
                      {previewStats.totalAssignments}
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-2.5">
                    <div className="text-[11px] font-bold text-indigo-700">
                      أيام العمل
                    </div>
                    <div className="mt-0.5 text-2xl font-black text-indigo-800">
                      {previewStats.workedDays}
                    </div>
                  </div>

                  <div className="rounded-xl border border-green-100 bg-green-50 p-2.5">
                    <div className="text-[11px] font-bold text-green-700">
                      إجازات معتمدة
                    </div>
                    <div className="mt-0.5 text-2xl font-black text-green-800">
                      {previewStats.approvedLeaveDays}
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-2.5">
                    <div className="text-[11px] font-bold text-amber-700">
                      طلبات إجازة
                    </div>
                    <div className="mt-0.5 text-2xl font-black text-amber-800">
                      {previewStats.pendingLeaveDays}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <div className="text-[11px] font-bold text-slate-700">
                      أيام بدون تكليف
                    </div>
                    <div className="mt-0.5 text-2xl font-black text-slate-800">
                      {previewStats.freeDays}
                    </div>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto bg-white px-4 py-3 md:px-5">
                <div className="h-full overflow-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[1100px] text-right text-base">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 shadow-sm">
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
                                      className={`rounded-full border px-2.5 py-1 text-sm font-bold ${badgeClass}`}
                                    >
                                      {assignment.label}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                                غير مجدول
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {day.leaveInfo ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-bold ${day.leaveInfo.badgeClass}`}
                              >
                                <span>🌴</span>
                                <span>
                                  {day.leaveInfo.badgeText} - {" "}
                                  {day.leaveInfo.leaveTypeLabel}
                                </span>
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-slate-400">
                                —
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-base text-slate-700">
                            {day.notes ? (
                              <div className="rounded-xl bg-slate-50 px-3 py-2 leading-6">
                                {day.notes}
                              </div>
                            ) : (
                              <span className="text-sm font-medium text-slate-400">
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

              <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 md:px-6">
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
