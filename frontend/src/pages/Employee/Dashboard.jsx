import React, { useEffect, useMemo, useState } from "react";
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

/* خريطة أنواع الإجازة */
const LEAVE_TYPES = {
  annual: {
    label: "إجازة اعتيادية",
    short: "اعتيادي",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
    soft: "bg-blue-50 border-blue-100",
    strip: "bg-blue-500",
  },
  casual: {
    label: "إجازة عارضة",
    short: "عارضة",
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    soft: "bg-amber-50 border-amber-100",
    strip: "bg-amber-500",
  },
  compensation: {
    label: "بدل أعياد",
    short: "بدل أعياد",
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    soft: "bg-emerald-50 border-emerald-100",
    strip: "bg-emerald-500",
  },
};

/* شارة الحالة */
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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${cfg.cls}`}
    >
      <Icon size={12} />
      {cfg.text}
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
  const [showReasonField, setShowReasonField] = useState(false);

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

  /* تحميل بيانات الموظف + التحديث الدوري */
  useEffect(() => {
    try {
      const savedData =
        sessionStorage.getItem("employeeData") ||
        localStorage.getItem("employeeData");

      if (savedData && savedData !== "undefined" && savedData !== "null") {
        const parsed = JSON.parse(savedData);

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
          throw new Error("بيانات الموظف غير مكتملة");
        }
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("تم اكتشاف بيانات تالفة في المتصفح:", error);
      localStorage.removeItem("employeeData");
      sessionStorage.removeItem("employeeData");
      navigate("/");
    }
  }, [navigate]);

  /* جلب الرصيد المُحدّث */
  const refreshEmployeeBalance = async (code) => {
    try {
      const response = await fetch(`${API_URL}/api/employee/profile/${code}`);

      if (response.ok) {
        const data = await response.json();

        setEmployee((prev) => {
          if (!prev) return prev;

          const updated = {
            ...prev,
            leaveBalances: data.leaveBalances,
            annualLeaveQuota:
              data.annualLeaveQuota || prev.annualLeaveQuota || 21,
            email: data.email || prev.email || "",
            jobGrade: data.jobGrade || prev.jobGrade,
            workType: data.workType || prev.workType,
            name: data.name || prev.name,
            role: data.role || prev.role,
          };

          const storage = localStorage.getItem("employeeData")
            ? localStorage
            : sessionStorage;

          storage.setItem("employeeData", JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error("خطأ في تحديث الرصيد", err);
    }
  };

  const fetchMyRequests = async (code) => {
    try {
      const response = await fetch(
        `${API_URL}/api/employee/my-requests/${code}`
      );
      const data = await response.json();

      if (response.ok) {
        setMyRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("خطأ في جلب الطلبات", err);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/employee/leave-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode: employee.employeeCode,
          leaveType,
          startDate,
          endDate,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل إرسال الطلب");
      } else {
        toast.success("تم إرسال الطلب بنجاح!");
        setStartDate("");
        setEndDate("");
        setReason("");
        setShowReasonField(false);
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
      const response = await fetch(
        `${API_URL}/api/employee/cancel-request/${cancelModal.requestId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل إلغاء الطلب");
      } else {
        toast.success(data.message || "تم إلغاء الطلب");
        fetchMyRequests(employee.employeeCode);
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setCancelModal({ isOpen: false, requestId: null });
    }
  };

  const latestRequests = useMemo(() => myRequests.slice(0, 10), [myRequests]);

  const fmtDate = (d) => new Date(d).toLocaleDateString("ar-EG");

  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!employee) {
    return (
      <div className="flex min-h-screen items-center justify-center font-bold text-blue-600">
        جاري التحميل...
      </div>
    );
  }

  return (
    <EmployeeLayout>
      <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-8">
        {/* الهيدر */}
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 sm:text-2xl">
              لوحة التحكم
            </h2>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              نظرة عامة على رصيد إجازاتك وطلباتك
            </p>
          </div>

          <div className="flex w-full items-center gap-3 border-t border-gray-100 pt-4 sm:w-auto sm:gap-4 sm:border-0 sm:pt-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md sm:h-12 sm:w-12">
              <User size={22} />
            </div>

            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-medium text-gray-700 sm:text-lg">
                أهلاً،{" "}
                <span className="font-bold text-blue-600">{employee.name}</span>
              </span>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-gray-500 sm:text-sm">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-gray-400" />
                  {currentTime.toLocaleDateString("ar-EG", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>

                <span className="hidden h-1 w-1 rounded-full bg-gray-300 sm:block" />

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

        {/* كروت الرصيد */}
        <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
          <CircularProgress
            value={employee.leaveBalances?.annual || 0}
            max={employee.annualLeaveQuota || 21}
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
            max={Math.max(employee.leaveBalances?.compensation || 0, 1)}
            label="بدل أعياد"
            type="compensation"
          />
        </div>

        {/* كارت تقديم الطلب */}
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 md:p-8">
          <h3 className="mb-5 flex items-center gap-2 text-lg font-bold text-gray-800 sm:text-xl">
            <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Send size={20} />
            </span>
            تقديم طلب جديد
          </h3>

          <form
            onSubmit={handleLeaveSubmit}
            className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
          >
            {/* قائمة نوع الإجازة */}
            <div className="relative z-10 w-full md:z-30">
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                نوع الإجازة
              </label>

              <button
                type="button"
                onClick={() => setIsLeaveMenuOpen(!isLeaveMenuOpen)}
                className="w-full cursor-pointer rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right font-medium text-gray-700 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${LEAVE_TYPES[leaveType].dot}`}
                    />
                    {LEAVE_TYPES[leaveType].label}
                  </span>

                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-300 ${
                      isLeaveMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {isLeaveMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10 md:z-40"
                    onClick={() => setIsLeaveMenuOpen(false)}
                  />

                  <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-2xl md:z-50">
                    {Object.keys(LEAVE_TYPES).map((type) => (
                      <div
                        key={type}
                        onClick={() => {
                          setLeaveType(type);
                          setIsLeaveMenuOpen(false);
                        }}
                        className={`flex cursor-pointer items-center gap-2 px-4 py-3 transition-colors ${
                          leaveType === type
                            ? "bg-blue-50/60 font-bold text-blue-700"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${LEAVE_TYPES[type].dot}`}
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
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                تاريخ البداية
              </label>

              <div
                className="relative cursor-pointer rounded-xl border border-gray-200 bg-gray-50 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"
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
                  className="pointer-events-none absolute inset-y-0 right-3 z-10 my-auto text-gray-400"
                />

                {!startDate && (
                  <span className="pointer-events-none absolute inset-y-0 right-10 z-10 flex items-center text-sm text-gray-400">
                    اختر تاريخ البداية...
                  </span>
                )}

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className={`relative z-20 w-full cursor-pointer bg-transparent py-3 pl-3 pr-10 outline-none [&::-webkit-calendar-picker-indicator]:hidden ${
                    !startDate ? "opacity-0" : "text-gray-700 opacity-100"
                  }`}
                />
              </div>
            </div>

            {/* تاريخ النهاية */}
            <div className="w-full">
              <label className="mb-1.5 block text-xs font-semibold text-gray-500">
                تاريخ النهاية
              </label>

              <div
                className="relative cursor-pointer rounded-xl border border-gray-200 bg-gray-50 transition-all focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10"
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
                  className="pointer-events-none absolute inset-y-0 right-3 z-10 my-auto text-gray-400"
                />

                {!endDate && (
                  <span className="pointer-events-none absolute inset-y-0 right-10 z-10 flex items-center text-sm text-gray-400">
                    اختر تاريخ النهاية...
                  </span>
                )}

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className={`relative z-20 w-full cursor-pointer bg-transparent py-3 pl-3 pr-10 outline-none [&::-webkit-calendar-picker-indicator]:hidden ${
                    !endDate ? "opacity-0" : "text-gray-700 opacity-100"
                  }`}
                />
              </div>
            </div>

            {/* زر الإرسال */}
            <div className="w-full">
              <button
                disabled={isSubmitting}
                className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    جاري الإرسال...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send size={18} />
                    إرسال الطلب
                  </span>
                )}
              </button>
            </div>

            {/* زر/حقل الملاحظات */}
            <div className="sm:col-span-2 lg:col-span-4">
              {!showReasonField ? (
                <button
                  type="button"
                  onClick={() => setShowReasonField(true)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-600"
                >
                  <FileText size={16} />
                  إضافة ملاحظة (اختياري)
                </button>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="text-sm font-bold text-slate-700">
                      ملاحظات إضافية للأدمن
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setShowReasonField(false);
                        setReason("");
                      }}
                      className="text-xs font-bold text-slate-400 transition hover:text-red-500"
                    >
                      إلغاء الملاحظة
                    </button>
                  </div>

                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    maxLength={200}
                    rows={3}
                    placeholder="مثال: الإجازة ضرورية جدًا - ظروف سفر - موعد طبي - ظرف عائلي"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />

                  <div className="mt-2 text-left text-xs font-medium text-slate-400">
                    {reason.length}/200
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* قائمة الطلبات */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/60 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 font-bold text-gray-800">
              <FileText size={18} className="text-blue-600" />
              آخر طلبات الإجازة
            </h3>
            <span className="text-xs font-medium text-gray-400">
              {myRequests.length} طلب
            </span>
          </div>

          {/* عرض الموبايل */}
          <div className="space-y-4 p-4 md:hidden">
            {latestRequests.length > 0 ? (
              latestRequests.map((req) => {
                const typeInfo = LEAVE_TYPES[req.leaveType] || {
                  short: req.leaveType,
                  badge: "bg-gray-100 text-gray-700",
                  soft: "bg-gray-50 border-gray-100",
                  strip: "bg-gray-400",
                  dot: "bg-gray-400",
                };

                return (
                  <div
                    key={req._id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                  >
                    <div className={`h-1.5 ${typeInfo.strip}`}></div>

                    <div className="p-4">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${typeInfo.badge}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${typeInfo.dot}`}
                              ></span>
                              {typeInfo.short}
                            </span>

                            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              {req.duration} يوم
                            </span>
                          </div>

                          <div className="mt-2 text-sm font-bold text-slate-800">
                            طلب إجازة رقم {String(req._id).slice(-6)}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <StatusBadge status={req.status} />
                        </div>
                      </div>

                      <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                          <CalendarDays size={13} />
                          فترة الإجازة
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                            <div className="text-[11px] font-bold text-slate-400">
                              من
                            </div>
                            <div className="mt-1 text-sm font-black text-slate-800">
                              {fmtDate(req.startDate)}
                            </div>
                          </div>

                          <ArrowLeft
                            size={16}
                            className="shrink-0 text-slate-400"
                          />

                          <div className="flex-1 rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                            <div className="text-[11px] font-bold text-slate-400">
                              إلى
                            </div>
                            <div className="mt-1 text-sm font-black text-slate-800">
                              {fmtDate(req.endDate)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 rounded-2xl bg-gray-50 px-3 py-2.5">
                        <div className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Clock size={13} />
                          تاريخ التقديم
                        </div>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-bold text-slate-700">
                            {fmtDate(req.createdAt)}
                          </span>
                          <span
                            className="text-xs font-medium text-slate-400"
                            dir="ltr"
                          >
                            {fmtTime(req.createdAt)}
                          </span>
                        </div>
                      </div>

                      {req.status === "pending" ? (
                        <button
                          onClick={() =>
                            setCancelModal({ isOpen: true, requestId: req._id })
                          }
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 transition hover:bg-red-100"
                        >
                          <Trash2 size={16} />
                          إلغاء الطلب
                        </button>
                      ) : (
                        <div className="text-center text-xs font-medium text-slate-400">
                          لا توجد إجراءات متاحة لهذا الطلب
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center text-gray-400">
                لا يوجد طلبات سابقة حتى الآن
              </div>
            )}
          </div>

          {/* عرض الكمبيوتر */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="p-4 font-semibold">النوع</th>
                  <th className="p-4 font-semibold">من</th>
                  <th className="p-4 font-semibold">إلى</th>
                  <th className="p-4 text-center font-semibold">المدة</th>
                  <th className="p-4 text-center font-semibold">
                    تاريخ التقديم
                  </th>
                  <th className="p-4 text-center font-semibold">الحالة</th>
                  <th className="p-4 text-center font-semibold">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {latestRequests.length > 0 ? (
                  latestRequests.map((req) => (
                    <tr key={req._id} className="transition hover:bg-gray-50">
                      <td className="p-4">
                        <span className="flex items-center gap-2 font-medium text-gray-700">
                          <span
                            className={`h-2 w-2 rounded-full ${
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
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-600">
                          {req.duration} يوم
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {fmtDate(req.createdAt)}
                          </span>
                          <span
                            className="mt-0.5 flex items-center gap-1 text-xs text-gray-400"
                            dir="ltr"
                          >
                            <Clock size={11} />
                            {fmtTime(req.createdAt)}
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
                            className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-700"
                            title="إلغاء الطلب"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
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

      {/* نافذة تأكيد الإلغاء */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-fadeIn">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="text-red-500" size={32} />
              </div>

              <h3 className="mb-2 text-xl font-bold text-gray-800">
                إلغاء طلب الإجازة
              </h3>

              <p className="mb-8 text-gray-500">
                هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا
                الإجراء.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={confirmCancelRequest}
                  className="flex-1 rounded-xl bg-red-500 py-3 font-bold text-white shadow-sm transition hover:bg-red-600 hover:shadow-md"
                >
                  نعم، إلغاء الطلب
                </button>

                <button
                  onClick={() =>
                    setCancelModal({ isOpen: false, requestId: null })
                  }
                  className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700 transition hover:bg-gray-200"
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
};

export default Dashboard;