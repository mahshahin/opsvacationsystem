import React, { useEffect, useMemo, useState } from "react";
import EmployeeLayout from "../components/EmployeeLayout";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Clock3,
  Crown,
  Users,
  UserCircle2,
  ShieldCheck,
  Sparkles,
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

const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

const MyShifts = () => {
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);

  const getStoredEmployee = () => {
    try {
      return JSON.parse(localStorage.getItem("employeeData"));
    } catch {
      return null;
    }
  };

  const userInfo = getStoredEmployee();
  const employeeId = userInfo ? userInfo.id : null;

  const getWeekDayName = (day) => {
    const date = new Date(year, month - 1, Number(day));
    return weekDays[date.getDay()];
  };

  const getShiftTheme = (shiftName = "") => {
    if (shiftName.includes("الأولى")) {
      return {
        line: "bg-sky-500",
        ring: "border-sky-200",
        card: "from-sky-50 to-white",
        iconBox: "bg-sky-100 text-sky-700",
        badge: "bg-sky-100 text-sky-800 border-sky-200",
        soft: "bg-sky-50 border-sky-100",
      };
    }

    if (shiftName.includes("الثانية")) {
      return {
        line: "bg-emerald-500",
        ring: "border-emerald-200",
        card: "from-emerald-50 to-white",
        iconBox: "bg-emerald-100 text-emerald-700",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
        soft: "bg-emerald-50 border-emerald-100",
      };
    }

    return {
      line: "bg-violet-500",
      ring: "border-violet-200",
      card: "from-violet-50 to-white",
      iconBox: "bg-violet-100 text-violet-700",
      badge: "bg-violet-100 text-violet-800 border-violet-200",
      soft: "bg-violet-50 border-violet-100",
    };
  };

  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => Number(a.day) - Number(b.day));
  }, [shifts]);

  useEffect(() => {
    if (!employeeId) {
      toast.error("برجاء تسجيل الدخول لعرض الجدول");
      return;
    }

    const fetchShifts = async () => {
      try {
        setLoading(true);
        toast.dismiss();

        const res = await fetch(
          `${API_URL}/api/roster/my-shifts?employeeId=${employeeId}&month=${month}&year=${year}`
        );

        const data = await res.json();

        if (data.success) {
          setShifts(Array.isArray(data.shifts) ? data.shifts : []);
        } else {
          setShifts([]);
          toast.error(data.message || "حدث خطأ في جلب البيانات.");
        }
      } catch (error) {
        console.error(error);
        setShifts([]);
        toast.error("حدث خطأ في الاتصال بالسيرفر.");
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, [month, year, employeeId]);

  return (
    <EmployeeLayout>
      <div
        className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 md:p-8"
        dir="rtl"
      >
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur-sm md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-800">
                  <Sparkles size={14} />
                  جدولك الشهري
                </div>

                <h1 className="text-2xl font-black text-slate-800 md:text-3xl">
                  جدول وردياتي
                </h1>

                <p className="mt-2 text-sm font-medium text-slate-500">
                  راجع وردياتك اليومية بشكل واضح ومنظم على الموبايل واللاب
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center md:min-w-[170px]">
                <div className="text-xs font-bold text-slate-500">
                  إجمالي الورديات
                </div>
                <div className="mt-1 text-2xl font-black text-slate-800">
                  {sortedShifts.length}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 rounded-3xl border border-white/70 bg-white p-4 shadow-sm md:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  اختر الشهر
                </label>
                <div className="relative">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500"
                  >
                    {monthNames.map((name, i) => (
                      <option key={i} value={i + 1}>
                        {name} ({i + 1})
                      </option>
                    ))}
                  </select>
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  اختر السنة
                </label>
                <div className="relative">
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <Clock3
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <div className="text-lg font-black text-blue-600">
                جاري تحميل الجدول...
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && sortedShifts.length === 0 && (
            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-center shadow-sm">
              <div className="mb-3 text-4xl">📅</div>
              <div className="text-lg font-black text-yellow-800">
                لا توجد لك ورديات مسجلة في هذا الشهر
              </div>
              <p className="mt-2 text-sm font-medium text-yellow-700">
                جرّب تغيير الشهر أو السنة، أو راجع الإدارة إذا كنت تتوقع وجود
                ورديات.
              </p>
            </div>
          )}

          {/* Timeline / Grid */}
          {!loading && sortedShifts.length > 0 && (
            <div className="relative">
              {/* Mobile timeline line */}
              <div className="absolute right-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 md:hidden"></div>

              <div className="space-y-4 md:grid md:grid-cols-2 md:gap-5 md:space-y-0 xl:grid-cols-3">
                {sortedShifts.map((shift, index) => {
                  const shiftTheme = getShiftTheme(shift.shiftName);

                  return (
                    <div key={index} className="relative">
                      {/* Mobile timeline node */}
                      <div
                        className={`absolute right-[9px] top-9 z-10 h-4 w-4 rounded-full border-4 border-white shadow md:hidden ${shiftTheme.line}`}
                      ></div>

                      <div
                        className={`overflow-hidden rounded-3xl border bg-gradient-to-b ${shiftTheme.card} border-white/70 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
                      >
                        {/* Top colored strip */}
                        <div className={`h-2 w-full ${shiftTheme.line}`}></div>

                        <div className="p-4 pr-8 sm:p-5 sm:pr-10 md:pr-5">
                          {/* Top info */}
                          <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${shiftTheme.iconBox}`}
                                >
                                  <Clock3 size={18} />
                                </div>

                                <div className="min-w-0">
                                  <div className="text-lg font-black text-slate-800 sm:text-xl">
                                    يوم {shift.day}
                                  </div>
                                  <div className="text-xs font-bold text-slate-500 sm:text-sm">
                                    {getWeekDayName(shift.day)} •{" "}
                                    {monthNames[month - 1]} {year}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm">
                              <div className="text-[11px] font-bold text-slate-500">
                                التاريخ
                              </div>
                              <div className="text-sm font-black text-slate-800">
                                {shift.day}/{month}
                              </div>
                            </div>
                          </div>

                          {/* badges */}
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${shiftTheme.badge}`}
                            >
                              <Clock3 size={13} />
                              {shift.shiftName}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${
                                shift.role === "رئيس نوبة"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {shift.role === "رئيس نوبة" ? (
                                <ShieldCheck size={13} />
                              ) : (
                                <UserCircle2 size={13} />
                              )}
                              {shift.role}
                            </span>
                          </div>

                          {/* content */}
                          <div className="space-y-3">
                            <div
                              className={`rounded-2xl border p-3 ${shiftTheme.soft}`}
                            >
                              <div className="mb-1 flex items-center gap-1 text-xs font-bold text-slate-500">
                                <Crown size={13} />
                                رئيس النوبة
                              </div>

                              <div className="text-sm font-black text-slate-800 sm:text-base break-words">
                                {shift.leaderName || "غير محدد"}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-white/90 p-3">
                              <div className="mb-2 flex items-center gap-1 text-xs font-bold text-slate-500">
                                <Users size={13} />
                                أفراد النوبة
                              </div>

                              {shift.teamNames && shift.teamNames.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {shift.teamNames.map((name, i) => (
                                    <span
                                      key={i}
                                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700 sm:text-sm"
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm italic font-medium text-slate-400">
                                  لا يوجد أفراد مسجلين
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default MyShifts;