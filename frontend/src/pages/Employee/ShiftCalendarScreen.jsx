import React, { useEffect, useMemo, useState } from "react";
import EmployeeLayout from "../components/EmployeeLayout";
import toast from "react-hot-toast";
import {
  ChevronRight,
  ChevronLeft,
  Sun,
  CloudSun,
  Moon,
  Plane,
  Bed,
  Calendar,
  X,
  Briefcase,
  UserCircle,
  AlertCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

const SHIFT_TYPES = {
  morning: {
    keys: ["صبح", "الصبح", "صباح", "الأولى", "الاولي"],
    label: "صبح",
    color: "#0866ff",
    bg: "#e7f3ff",
    icon: Sun,
  },
  afternoon: {
    keys: ["ضهر", "الضهر", "الثانية"],
    label: "ضهر",
    color: "#f5a623",
    bg: "#fff6e5",
    icon: CloudSun,
  },
  night: {
    keys: ["ليل", "الليل", "مساء", "الثالثة"],
    label: "ليل",
    color: "#7c3aed",
    bg: "#ede9fe",
    icon: Moon,
  },
  leave: {
    keys: ["إجازة", "اجازة", "اعتيادي", "عارضة", "أعياد"],
    label: "إجازة",
    color: "#31a24c",
    bg: "#eaf6ec",
    icon: Plane,
  },
  rest: {
    keys: ["راحة", "راحه", "off"],
    label: "راحة",
    color: "#65676b",
    bg: "#e4e6eb",
    icon: Bed,
  },
};

const WEEK_DAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

function getShiftTheme(shiftName = "") {
  for (const type of Object.values(SHIFT_TYPES)) {
    if (type.keys.some((key) => shiftName.toLowerCase().includes(key))) {
      return type;
    }
  }
  return {
    label: shiftName || "أخرى",
    color: "#050505",
    bg: "#f0f2f5",
    icon: Briefcase,
  };
}

const getStoredEmployee = () => {
  try {
    const savedData =
      sessionStorage.getItem("employeeData") ||
      localStorage.getItem("employeeData");
    return savedData ? JSON.parse(savedData) : null;
  } catch {
    return null;
  }
};

const ShiftCalendarScreen = () => {
  const userInfo = getStoredEmployee();
  const employeeId = userInfo?.id;
  const employeeCode = userInfo?.employeeCode;

  const today = new Date();
  const [currentDate, setCurrentDate] = useState(today);
  const [shifts, setShifts] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, currentYear]);

  const fetchCalendarData = async () => {
    if (!employeeId) return;
    setLoading(true);

    try {
      const promises = [
        fetch(
          `${API_URL}/api/roster/my-shifts?employeeId=${employeeId}&month=${currentMonth}&year=${currentYear}`,
        ),
      ];

      if (employeeCode) {
        promises.push(
          fetch(`${API_URL}/api/employee/my-requests/${employeeCode}`),
        );
      }

      const results = await Promise.all(promises);

      const shiftsRes = results[0];
      if (shiftsRes.ok) {
        const data = await shiftsRes.json();
        setShifts(
          data.success && Array.isArray(data.shifts) ? data.shifts : [],
        );
      }

      if (employeeCode && results[1] && results[1].ok) {
        const leavesData = await results[1].json();
        const allRequests = Array.isArray(leavesData) ? leavesData : [];
        setApprovedLeaves(
          allRequests.filter((req) => req.status === "approved"),
        );
      }
    } catch (error) {
      console.error("Fetch calendar data error:", error);
      toast.error("فشل في تحميل بيانات التقويم.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentYear, currentMonth - 2, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentYear, currentMonth, 1));

  const getLeaveForDay = (year, month, day) => {
    const targetDate = new Date(year, month - 1, day).setHours(0, 0, 0, 0);
    return approvedLeaves.find((req) => {
      if (!req.startDate || !req.endDate) return false;
      const start = new Date(req.startDate).setHours(0, 0, 0, 0);
      const end = new Date(req.endDate).setHours(0, 0, 0, 0);
      return targetDate >= start && targetDate <= end;
    });
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysArray = [];

    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const leaveForDay = getLeaveForDay(currentYear, currentMonth, i);
      const shiftForDay = shifts.find((s) => Number(s.day) === i);
      let finalShift = null;

      if (leaveForDay) {
        const leaveNames = {
          annual: "إجازة اعتيادية",
          casual: "إجازة عارضة",
          compensation: "إجازة بدل أعياد",
        };
        finalShift = {
          shiftName: leaveNames[leaveForDay.leaveType] || "إجازة",
          notes: leaveForDay.reason || "تمت الموافقة على طلب الإجازة",
        };
      } else if (shiftForDay) {
        finalShift = shiftForDay;
      } else {
        finalShift = {
          shiftName: "راحة",
          notes: "يوم راحة أسبوعية أو غير مسجل به وردية",
        };
      }

      daysArray.push({
        dayNumber: i,
        shift: finalShift,
        isToday:
          i === today.getDate() &&
          currentMonth === today.getMonth() + 1 &&
          currentYear === today.getFullYear(),
      });
    }

    return daysArray;
  }, [currentYear, currentMonth, shifts, approvedLeaves]);

  const openDayDetails = (dayData) => {
    if (!dayData) return;
    setSelectedDay(dayData);
    setModalVisible(true);
  };

  return (
    <EmployeeLayout>
      <div className="mx-auto max-w-5xl px-4 py-6" dir="rtl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Calendar className="text-blue-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">جدول الورديات</h1>
        </div>

        {/* Month Navigator */}
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
          >
            <ChevronRight size={18} />
            السابق
          </button>

          <span className="text-lg font-bold text-gray-800">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>

          <button
            onClick={handleNextMonth}
            className="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
          >
            التالي
            <ChevronLeft size={18} />
          </button>
        </div>

        {/* Legend */}
        <div className="mb-5 flex flex-wrap justify-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
          {Object.values(SHIFT_TYPES).map((type, index) => {
            const Icon = type.icon;
            return (
              <div key={index} className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <Icon size={14} style={{ color: type.color }} />
                <span className="text-sm font-bold text-gray-600">
                  {type.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Calendar Card */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm" dir="ltr">
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-white/70">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          )}

          {/* Week Days Header */}
          <div className="flex border-b border-gray-100 bg-gray-50 px-2 py-3">
            {WEEK_DAYS.map((day, index) => (
              <div
                key={index}
                className="flex-1 text-center text-sm font-bold text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex flex-wrap">
            {calendarDays.map((dayData, index) => {
              if (!dayData) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="aspect-square w-[14.28%] border border-gray-50"
                  />
                  );
              }

              const theme = getShiftTheme(dayData.shift?.shiftName);
              const Icon = theme.icon;

              return (
                <button
                  key={`day-${dayData.dayNumber}`}
                  onClick={() => openDayDetails(dayData)}
                  className={`relative flex aspect-square w-[14.28%] flex-col items-center justify-center gap-1 border border-gray-50 p-1 transition hover:bg-gray-50 ${
                    dayData.isToday ? "bg-blue-50 ring-2 ring-blue-500 ring-inset" : ""
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${
                      dayData.isToday ? "text-blue-600" : "text-gray-800"
                    }`}
                  >
                    {dayData.dayNumber}
                  </span>

                  <span
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: theme.color }}
                  >
                    <Icon size={10} />
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {modalVisible && selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalVisible(false)}
        >
          <div
            className="w-full max-w-md animate-fadeIn rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-800">
                {selectedDay.dayNumber} {MONTH_NAMES[currentMonth - 1]}{" "}
                {currentYear}
              </h2>
              <button
                onClick={() => setModalVisible(false)}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            {selectedDay.shift && (() => {
              const theme = getShiftTheme(selectedDay.shift.shiftName);
              const Icon = theme.icon;

              return (
                <div>
                  {/* Shift Main Info */}
                  <div className="mb-5 flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: theme.bg }}
                    >
                      <Icon size={28} style={{ color: theme.color }} />
                    </div>
                    <div className="flex flex-1 flex-col items-end">
                      <span className="text-sm font-bold text-gray-500">
                        البيان
                      </span>
                      <span
                        className="text-2xl font-bold"
                        style={{ color: theme.color }}
                      >
                        {selectedDay.shift.shiftName}
                      </span>
                    </div>
                  </div>

                  {/* Team Members */}
                  <div className="mb-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-600">
                      <UserCircle size={18} />
                      أفراد النوبة
                    </h3>

                    {selectedDay.shift.members && selectedDay.shift.members.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDay.shift.members.map((member, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5"
                          >
                            <span className="text-sm font-bold text-gray-800">
                              {member.name || "غير محدد"}
                            </span>
                            <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-gray-500 shadow-sm">
                              {member.role || member.position || "عضو"}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-gray-50 py-4 text-center text-sm font-bold text-gray-400">
                        لا توجد بيانات لأفراد النوبة
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {selectedDay.shift.notes && (
                    <div className="flex items-start gap-2 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                      <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0 text-yellow-600"
                      />
                      <span className="text-sm font-bold text-yellow-800">
                        {selectedDay.shift.notes}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
};

export default ShiftCalendarScreen;