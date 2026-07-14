import React, { useEffect, useState } from "react";
import EmployeeLayout from "../components/EmployeeLayout";
import toast from "react-hot-toast";
import { CalendarDays, Users, Crown, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

const ShiftBox = ({ title, data, color }) => {
  return (
    <div
      className={`rounded-xl border p-2 md:p-3 text-center flex flex-col h-full ${color}`}
    >
      {/* عنوان الشفت */}
      <div className="mb-2 font-black text-sm md:text-base text-slate-800 border-b border-black/5 pb-2">
        {title}
      </div>

      {/* رئيس النوبة */}
      <div className="mb-2">
        <div className="text-[10px] md:text-xs text-slate-500 mb-1 flex justify-center items-center gap-1">
          <Crown size={10} /> رئيس النوبة
        </div>
        <div className="text-xs md:text-sm font-bold text-slate-800 truncate px-1">
          {data.leaderName || "—"}
        </div>
      </div>

      {/* الأفراد */}
      <div className="flex-1">
        <div className="text-[10px] md:text-xs text-slate-500 mb-1 flex justify-center items-center gap-1">
          <Users size={10} /> الأفراد
        </div>

        {data.memberNames?.length > 0 ? (
          <div className="flex flex-col gap-1">
            {data.memberNames.map((name, index) => (
              <div
                key={index}
                className="rounded-md bg-white border border-slate-200 px-1 py-1.5 text-[11px] md:text-xs font-bold text-slate-700 truncate w-full"
                title={name}
              >
                {name}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] md:text-xs italic text-slate-400 mt-2">
            لا يوجد
          </div>
        )}
      </div>
    </div>
  );
};

const EmployeeFullRoster = () => {
  const navigate = useNavigate();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedData =
      sessionStorage.getItem("employeeData") ||
      localStorage.getItem("employeeData");

    if (!savedData) {
      navigate("/");
      return;
    }

    const fetchRoster = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/roster/published-full?month=${month}&year=${year}`,
        );

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "حدث خطأ أثناء تحميل الروستر");
          setDays([]);
        } else {
          setDays(Array.isArray(data.days) ? data.days : []);

          if (data.message && (!data.days || data.days.length === 0)) {
            toast(data.message, { icon: "📅" });
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("حدث خطأ في الاتصال بالسيرفر");
        setDays([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
  }, [month, year, navigate]);

  return (
    <EmployeeLayout>
      <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                  <FileText size={14} />
                  الروستر المعتمد
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800">
                  جدول الشهر الكامل
                </h1>
                <p className="mt-2 text-sm text-slate-500 font-medium">
                  استعراض الروستر المعتمد بالكامل لهذا الشهر
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
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
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    اختر السنة
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-blue-500"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              <div className="text-lg font-black text-blue-600">
                جاري تحميل الروستر...
              </div>
            </div>
          )}

          {!loading && days.length === 0 && (
            <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-center shadow-sm">
              <div className="mb-3 text-4xl">📅</div>
              <div className="text-lg font-black text-yellow-800">
                لا يوجد روستر معتمد لهذا الشهر
              </div>
            </div>
          )}

          {!loading && days.length > 0 && (
            <div className="space-y-4">
              {days.map((day) => (
                <div
                  key={day.dayNumber}
                  className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-lg font-black text-slate-800">
                        يوم {day.dayNumber}
                      </h2>
                      <p className="text-sm font-bold text-slate-500">
                        {day.dayName} - {monthNames[month - 1]} {year}
                      </p>
                    </div>

                    {day.notes ? (
                      <div className="rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2 text-xs font-bold text-amber-700">
                        ملاحظات: {day.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <ShiftBox
                      title="صبح"
                      data={day.shift1}
                      color="bg-sky-50 border-sky-100"
                    />
                    <ShiftBox
                      title="ضهر"
                      data={day.shift2}
                      color="bg-emerald-50 border-emerald-100"
                    />
                    <ShiftBox
                      title="ليل"
                      data={day.shift3}
                      color="bg-violet-50 border-violet-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeFullRoster;
