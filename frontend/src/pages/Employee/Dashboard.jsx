import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  FileText,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import EmployeeLayout from "../components/EmployeeLayout";
import CircularProgress from "../components/CircularProgress";

const API_URL = import.meta.env.VITE_API_URL || "";

/* خريطة أنواع الإجازة (نص + ألوان) لإعادة الاستخدام */
const LEAVE_TYPES = {
  annual: { label: "إجازة اعتيادية", short: "اعتيادي", dot: "bg-blue-500" },
  casual: { label: "إجازة عارضة", short: "عارضة", dot: "bg-amber-500" },
  compensation: {
    label: "بدل أعياد",
    short: "بدل أعياد",
    dot: "bg-emerald-500",
  },
};

/* شارة الحالة (تُستخدم في الجدول والكروت) */
const StatusBadge = ({ status }) => {
  const map = {
    pending: {
      icon: Clock,
      text: "قيد الانتظار",
      cls: "bg-amber-50 text-amber-700 ring-amber-200",
    },
    approved: {
      icon: CheckCircle,
      text: "مقبول",
      cls: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    },
    rejected: {
      icon: XCircle,
      text: "مرفوض",
      cls: "bg-red-50 text-red-700 ring-red-200",
    },
  };
  const cfg = map[status];
  if (!cfg) return <span className="text-gray-400">{status}</span>;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ring-1 ${cfg.cls}`}
    >
      <Icon size={12} /> {cfg.text}
    </span>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    requestId: null,
  });
  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState(false);

  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* الساعة الحية */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* تحميل بيانات الموظف + التحديث الدوري (النسخة الآمنة) */
  useEffect(() => {
    try {
      const savedData =
        sessionStorage.getItem("employeeData") ||
        localStorage.getItem("employeeData");

      // التأكد إن الداتا موجودة ومش عبارة عن نص صريح اسمه "undefined"
      if (savedData && savedData !== "undefined" && savedData !== "null") {
        const parsed = JSON.parse(savedData);

        // التأكد إن البيانات اتحولت لأوبجكت سليم وفيه كود الموظف
        if (parsed && parsed.employeeCode) {
          setEmployee(parsed);
          refreshEmployeeBalance(parsed.employeeCode);
          fetchMyRequests(parsed.employeeCode);

          const interval = setInterval(() => {
            refreshEmployeeBalance(parsed.employeeCode);
            fetchMyRequests(parsed.employeeCode);
          }, 15000);
          return () => clearInterval(interval);
        } else {
          // لو الأوبجكت ناقص أو بايظ، ارمي إيرور عشان الـ catch يمسحه
          throw new Error("بيانات الموظف غير مكتملة");
        }
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error(
        "🚨 تم اكتشاف بيانات تالفة في المتصفح، جاري تنظيفها:",
        error,
      );
      // تنظيف إجباري وطرد للـ Login
      localStorage.removeItem("employeeData");
      sessionStorage.removeItem("employeeData");
      navigate("/");
    }
  }, [navigate]);

  /* جلب الرصيد المُحدّث من السيرفر */
  const refreshEmployeeBalance = async (code) => {
    try {
      // ✅ التعديل الأول: تحديث مسار جلب البروفايل
      const response = await fetch(`${API_URL}/api/employee/profile/${code}`);
      if (response.ok) {
        const data = await response.json();
        setEmployee((prev) => {
          const updated = { ...prev, leaveBalances: data.leaveBalances };
          const storage = localStorage.getItem("employeeData")
            ? localStorage
            : sessionStorage;
          storage.setItem("employeeData", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error("خطأ في تحديث الرصيد");
    }
  };

  const fetchMyRequests = async (code) => {
    try {
      // ✅ التعديل الثاني: تحديث مسار جلب الطلبات
      const response = await fetch(
        `${API_URL}/api/employee/my-requests/${code}`,
      );
      const data = await response.json();
      if (response.ok) setMyRequests(data);
    } catch (err) {
      console.error("خطأ في جلب الطلبات");
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // ✅ التعديل الثالث: تحديث مسار تقديم الطلب
      const response = await fetch(`${API_URL}/api/employee/leave-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode: employee.employeeCode,
          leaveType,
          startDate,
          endDate,
          reason,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success("تم إرسال الطلب بنجاح!");
        setStartDate("");
        setEndDate("");
        setReason("");
        fetchMyRequests(employee.employeeCode);
      }
    } catch (err) {
      toast.error("حدث خطأ في الاتصال بالسيرفر.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmCancelRequest = async () => {
    try {
      // ✅ التعديل الرابع: تحديث مسار إلغاء الطلب وتصليح السلاش المزدوجة //
      const response = await fetch(
        `${API_URL}/api/employee/cancel-request/${cancelModal.requestId}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        fetchMyRequests(employee.employeeCode);
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setCancelModal({ isOpen: false, requestId: null });
    }
  };

  if (!employee)
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">
        جاري التحميل...
      </div>
    );

  const fmtDate = (d) => new Date(d).toLocaleDateString("ar-EG");
  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getAnnualMaxByGrade = (grade) => {
    switch (grade) {
      case "كبير":
        return 45;
      case "درجة اولى":
        return 30;
      case "درجة ثانية":
        return 21;
      case "درجة ثالثة":
        return 21;
      default:
        return 21;
    }
  };

  return (
    <EmployeeLayout>
      <div className="p-3 sm:p-4 md:p-8 max-w-7xl mx-auto">
        {/* ============ الهيدر ============ */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              لوحة التحكم
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              نظرة عامة على رصيد إجازاتك وطلباتك
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-100">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-md shrink-0">
              <User size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-gray-700 text-base sm:text-lg truncate">
                أهلاً،{" "}
                <span className="font-bold text-blue-600">{employee.name}</span>
              </span>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-sm text-gray-500 mt-1 font-medium">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-gray-400" />
                  {currentTime.toLocaleDateString("ar-EG", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
                <span className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full" />
                <span className="flex items-center gap-1.5" dir="ltr">
                  <Clock size={14} className="text-gray-400" />
                  {currentTime.toLocaleTimeString("ar-EG", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* ============ كروت الرصيد ============ */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6">
          <CircularProgress
            value={employee.leaveBalances?.annual || 0}
            max={getAnnualMaxByGrade(employee.jobGrade)}
            label="رصيد اعتيادي"
            type="annual"
          />
          <CircularProgress
            value={employee.leaveBalances?.casual || 0}
            max={7}
            label="رصيد عارضة"
            type="casual"
          />
          <CircularProgress
            value={employee.leaveBalances?.compensation || 0}
            max={employee.leaveBalances?.compensation || 0}
            label="بدل أعياد"
            type="compensation"
          />
        </div>

        {/* ============ كارت تقديم الطلب ============ */}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="text-lg sm:text-xl font-bold mb-5 flex items-center gap-2 text-gray-800">
            <span className="bg-blue-50 p-2 rounded-lg text-blue-600">
              <Send size={20} />
            </span>
            تقديم طلب جديد
          </h3>

          <form
            onSubmit={handleLeaveSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end"
          >
            {/* قائمة نوع الإجازة */}
            <div className="relative z-30 w-full">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                نوع الإجازة
              </label>
              <button
                type="button"
                onClick={() => setIsLeaveMenuOpen(!isLeaveMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-700 font-medium cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${LEAVE_TYPES[leaveType].dot}`}
                  />
                  {LEAVE_TYPES[leaveType].label}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-gray-400 transition-transform duration-300 ${
                    isLeaveMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isLeaveMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLeaveMenuOpen(false)}
                  />
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden py-1">
                    {Object.keys(LEAVE_TYPES).map((type) => (
                      <div
                        key={type}
                        onClick={() => {
                          setLeaveType(type);
                          setIsLeaveMenuOpen(false);
                        }}
                        className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-2 ${
                          leaveType === type
                            ? "bg-blue-50/60 text-blue-700 font-bold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${LEAVE_TYPES[type].dot}`}
                        />
                        {LEAVE_TYPES[type].label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* تاريخ البداية */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                تاريخ البداية
              </label>
              <div
                className="relative bg-gray-50 border border-gray-200 rounded-xl focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all cursor-pointer"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector("input");
                  if (input && input.showPicker) {
                    try {
                      input.showPicker();
                    } catch (err) {}
                  }
                }}
              >
                <CalendarDays
                  size={18}
                  className="absolute inset-y-0 right-3 my-auto text-gray-400 pointer-events-none z-10"
                />

                {!startDate && (
                  <span className="absolute inset-y-0 right-10 flex items-center text-sm text-gray-400 pointer-events-none z-10">
                    اختر تاريخ البداية...
                  </span>
                )}

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className={`w-full pl-3 pr-10 py-3 bg-transparent outline-none cursor-pointer relative z-20 ${
                    !startDate ? "opacity-0" : "opacity-100 text-gray-700"
                  } [&::-webkit-calendar-picker-indicator]:hidden`}
                />
              </div>
            </div>

            {/* تاريخ النهاية */}
            <div className="w-full">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                تاريخ النهاية
              </label>
              <div
                className="relative bg-gray-50 border border-gray-200 rounded-xl focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all cursor-pointer"
                onClick={(e) => {
                  const input = e.currentTarget.querySelector("input");
                  if (input && input.showPicker) {
                    try {
                      input.showPicker();
                    } catch (err) {}
                  }
                }}
              >
                <CalendarDays
                  size={18}
                  className="absolute inset-y-0 right-3 my-auto text-gray-400 pointer-events-none z-10"
                />

                {!endDate && (
                  <span className="absolute inset-y-0 right-10 flex items-center text-sm text-gray-400 pointer-events-none z-10">
                    اختر تاريخ النهاية...
                  </span>
                )}

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className={`w-full pl-3 pr-10 py-3 bg-transparent outline-none cursor-pointer relative z-20 ${
                    !endDate ? "opacity-0" : "opacity-100 text-gray-700"
                  } [&::-webkit-calendar-picker-indicator]:hidden`}
                />
              </div>
            </div>

            {/* زر الإرسال */}
            <div className="w-full">
              <button
                disabled={isSubmitting}
                className="w-full py-3 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <Send size={18} /> إرسال الطلب
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ============ قائمة الطلبات ============ */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" />
              آخر طلبات الإجازة
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              {myRequests.length} طلب
            </span>
          </div>

          {/* ===== عرض الموبايل: كروت (يظهر تحت md) ===== */}
          <div className="md:hidden divide-y divide-gray-100">
            {myRequests.length > 0 ? (
              myRequests.slice(0, 10).map((req) => (
                <div key={req._id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          LEAVE_TYPES[req.leaveType]?.dot || "bg-gray-400"
                        }`}
                      />
                      <span className="font-bold text-gray-800">
                        {LEAVE_TYPES[req.leaveType]?.short || req.leaveType}
                      </span>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        {req.duration} يوم
                      </span>
                    </div>
                    <StatusBadge status={req.status} />
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium">
                      {fmtDate(req.startDate)}
                    </span>
                    <ArrowLeft size={14} className="text-gray-400 shrink-0" />
                    <span className="font-medium">{fmtDate(req.endDate)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className="flex items-center gap-1 text-[11px] text-gray-400"
                      dir="ltr"
                    >
                      <Clock size={11} />
                      {fmtDate(req.createdAt)} — {fmtTime(req.createdAt)}
                    </span>
                    {req.status === "pending" && (
                      <button
                        onClick={() =>
                          setCancelModal({ isOpen: true, requestId: req._id })
                        }
                        className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                      >
                        <Trash2 size={14} /> إلغاء
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-400">
                لا يوجد طلبات سابقة حتى الآن
              </div>
            )}
          </div>

          {/* ===== عرض الكومبيوتر: جدول (يظهر من md فأعلى) ===== */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="p-4 font-semibold">النوع</th>
                  <th className="p-4 font-semibold">من</th>
                  <th className="p-4 font-semibold">إلى</th>
                  <th className="p-4 font-semibold text-center">المدة</th>
                  <th className="p-4 font-semibold text-center">
                    تاريخ التقديم
                  </th>
                  <th className="p-4 font-semibold text-center">الحالة</th>
                  <th className="p-4 font-semibold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myRequests.length > 0 ? (
                  myRequests.slice(0, 10).map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <span className="flex items-center gap-2 font-medium text-gray-700">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              LEAVE_TYPES[req.leaveType]?.dot || "bg-gray-400"
                            }`}
                          />
                          {LEAVE_TYPES[req.leaveType]?.short || req.leaveType}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {fmtDate(req.startDate)}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {fmtDate(req.endDate)}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                          {req.duration} يوم
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-gray-700 font-medium text-sm">
                            {fmtDate(req.createdAt)}
                          </span>
                          <span
                            className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"
                            dir="ltr"
                          >
                            <Clock size={11} /> {fmtTime(req.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="p-4 text-center">
                        {req.status === "pending" ? (
                          <button
                            onClick={() =>
                              setCancelModal({
                                isOpen: true,
                                requestId: req._id,
                              })
                            }
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                            title="إلغاء الطلب"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-gray-400">
                      لا يوجد طلبات سابقة حتى الآن
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============ نافذة تأكيد الإلغاء ============ */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                إلغاء طلب الإجازة
              </h3>
              <p className="text-gray-500 mb-8">
                هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا
                الإجراء.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmCancelRequest}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition shadow-sm hover:shadow-md"
                >
                  نعم، إلغاء الطلب
                </button>
                <button
                  onClick={() =>
                    setCancelModal({ isOpen: false, requestId: null })
                  }
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </EmployeeLayout>
  );
};;

export default Dashboard;
