import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Calendar,
  Trash2,
  AlertTriangle,
  FileText,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import EmployeeLayout from "../components/EmployeeLayout";

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

const leaveTypeConfig = {
  annual: {
    label: "اعتيادي",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    soft: "bg-blue-50 border-blue-100",
  },
  casual: {
    label: "عارضة",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    soft: "bg-amber-50 border-amber-100",
  },
  compensation: {
    label: "بدل أعياد",
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50 border-emerald-100",
  },
};

const EmployeeHistory = () => {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [cancelModal, setCancelModal] = useState({
    isOpen: false,
    requestId: null,
  });

  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    const savedData =
      sessionStorage.getItem("employeeData") ||
      localStorage.getItem("employeeData");

    if (savedData) {
      const parsedEmployee = JSON.parse(savedData);
      setEmployee(parsedEmployee);
      fetchMyRequests(parsedEmployee.employeeCode);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const fetchMyRequests = async (code) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/employee/my-requests/${code}`,
      );

      const data = await response.json();

      if (response.ok) {
        setAllRequests(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.message || "حدث خطأ في جلب سجل الإجازات");
      }
    } catch (err) {
      toast.error("حدث خطأ في جلب سجل الإجازات");
    } finally {
      setLoading(false);
    }
  };

  const confirmCancelRequest = async () => {
    try {
      setCancelLoading(true);

      const response = await fetch(
        `${API_URL}/api/employee/cancel-request/${cancelModal.requestId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل إلغاء الطلب");
      } else {
        toast.success(data.message || "تم إلغاء الطلب بنجاح");
        fetchMyRequests(employee.employeeCode);
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setCancelLoading(false);
      setCancelModal({ isOpen: false, requestId: null });
    }
  };

  const availableYears = useMemo(() => {
    const years = allRequests
      .filter((req) => req.startDate)
      .map((req) => new Date(req.startDate).getFullYear());

    return [...new Set(years)].sort((a, b) => b - a);
  }, [allRequests]);

  const filteredRequests = useMemo(() => {
    return allRequests.filter((req) => {
      if (!req.startDate) return false;

      const reqDate = new Date(req.startDate);

      const matchYear =
        selectedYear === "all" ||
        reqDate.getFullYear().toString() === selectedYear;

      const matchMonth =
        selectedMonth === "all" ||
        (reqDate.getMonth() + 1).toString() === selectedMonth;

      const matchStatus =
        selectedStatus === "all" || req.status === selectedStatus;

      return matchYear && matchMonth && matchStatus;
    });
  }, [allRequests, selectedYear, selectedMonth, selectedStatus]);

  const summary = useMemo(() => {
    return {
      total: filteredRequests.length,
      pending: filteredRequests.filter((req) => req.status === "pending")
        .length,
      approved: filteredRequests.filter((req) => req.status === "approved")
        .length,
      rejected: filteredRequests.filter((req) => req.status === "rejected")
        .length,
    };
  }, [filteredRequests]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full">
            <Clock size={12} />
            قيد الانتظار
          </span>
        );

      case "approved":
        return (
          <span className="inline-flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
            <CheckCircle size={12} />
            مقبول
          </span>
        );

      case "rejected":
        return (
          <span className="inline-flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">
            <XCircle size={12} />
            مرفوض
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center justify-center gap-1 text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "---";
    return new Date(dateValue).toLocaleDateString("ar-EG");
  };

  const formatTime = (dateValue) => {
    if (!dateValue) return "---";
    return new Date(dateValue).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold">
        جاري التحميل...
      </div>
    );
  }

  return (
    <EmployeeLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-6 md:mb-8 rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                  <FileText size={14} />
                  سجل الإجازات
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-gray-800">
                  سجل الإجازات الشامل
                </h2>

                <p className="mt-2 text-sm text-gray-500 font-medium">
                  استعرض جميع طلبات الإجازة السابقة مع إمكانية الفلترة حسب الشهر
                  والسنة والحالة
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-center">
                <div className="text-xs font-bold text-gray-500">
                  إجمالي الطلبات
                </div>
                <div className="mt-1 text-2xl font-black text-gray-800">
                  {allRequests.length}
                </div>
              </div>
            </div>
          </header>

          {/* Filters */}
          <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* السنة */}
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                <Calendar size={16} className="text-gray-400 shrink-0" />
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full cursor-pointer border-none bg-transparent text-sm font-bold text-gray-700 outline-none"
                >
                  <option value="all">كل السنوات</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* الشهر */}
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                <CalendarDays size={16} className="text-gray-400 shrink-0" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full cursor-pointer border-none bg-transparent text-sm font-bold text-gray-700 outline-none"
                >
                  <option value="all">كل الشهور</option>
                  {monthNames.map((name, i) => (
                    <option key={i + 1} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* الحالة */}
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                <Filter size={16} className="text-gray-400 shrink-0" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full cursor-pointer border-none bg-transparent text-sm font-bold text-gray-700 outline-none"
                >
                  <option value="all">كل الحالات</option>
                  <option value="approved">المقبولة فقط</option>
                  <option value="rejected">المرفوضة فقط</option>
                  <option value="pending">قيد الانتظار</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-500">المعروضة</div>
              <div className="mt-2 text-2xl font-black text-slate-800">
                {summary.total}
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 shadow-sm">
              <div className="text-xs font-bold text-yellow-700">
                قيد الانتظار
              </div>
              <div className="mt-2 text-2xl font-black text-yellow-800">
                {summary.pending}
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4 shadow-sm">
              <div className="text-xs font-bold text-green-700">المقبولة</div>
              <div className="mt-2 text-2xl font-black text-green-800">
                {summary.approved}
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm">
              <div className="text-xs font-bold text-red-700">المرفوضة</div>
              <div className="mt-2 text-2xl font-black text-red-800">
                {summary.rejected}
              </div>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {loading ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
                جاري تحميل السجل...
              </div>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map((req) => {
                const typeInfo = leaveTypeConfig[req.leaveType] || {
                  label: req.leaveType,
                  badge: "bg-gray-100 text-gray-700",
                  dot: "bg-gray-400",
                  soft: "bg-gray-50 border-gray-100",
                };

                return (
                  <div
                    key={req._id}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                  >
                    <div className={`h-1.5 ${typeInfo.dot}`}></div>

                    <div className="p-4">
                      {/* Top */}
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${typeInfo.badge}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${typeInfo.dot}`}
                              ></span>
                              {typeInfo.label}
                            </span>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              {req.duration} يوم
                            </span>
                          </div>

                          <div className="mt-2 text-sm font-black text-slate-800">
                            طلب إجازة
                          </div>
                        </div>

                        <div className="shrink-0">
                          {getStatusBadge(req.status)}
                        </div>
                      </div>

                      {/* الفترة */}
                      <div
                        className={`mb-3 rounded-2xl border p-3 ${typeInfo.soft}`}
                      >
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
                              {formatDate(req.startDate)}
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
                              {formatDate(req.endDate)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* تاريخ التقديم */}
                      <div className="mb-4 rounded-2xl bg-gray-50 px-3 py-3">
                        <div className="mb-1 flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Clock size={13} />
                          تاريخ التقديم
                        </div>
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-bold text-slate-700">
                            {formatDate(req.createdAt)}
                          </span>
                          <span
                            className="text-xs font-medium text-slate-400"
                            dir="ltr"
                          >
                            {formatTime(req.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
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
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
                <CalendarDays
                  size={40}
                  className="mx-auto mb-3 text-gray-300"
                />
                لا توجد طلبات تتطابق مع الفلاتر المحددة.
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr>
                    <th className="p-4">نوع الإجازة</th>
                    <th className="p-4">التاريخ (من - إلى)</th>
                    <th className="p-4 text-center">المدة</th>
                    <th className="p-4 text-center">تاريخ التقديم</th>
                    <th className="p-4 text-center">الحالة</th>
                    <th className="p-4 text-center">الإجراء</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-400">
                        جاري تحميل السجل...
                      </td>
                    </tr>
                  ) : filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-bold text-gray-800">
                          {leaveTypeConfig[req.leaveType]?.label ||
                            req.leaveType}
                        </td>

                        <td className="p-4 text-sm text-gray-600">
                          {formatDate(req.startDate)}
                          <br />
                          <span className="text-xs text-gray-400">
                            إلى
                          </span>{" "}
                          {formatDate(req.endDate)}
                        </td>

                        <td className="p-4 text-sm font-bold text-blue-600 text-center">
                          {req.duration} يوم
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-gray-700 font-medium">
                              {formatDate(req.createdAt)}
                            </span>
                            <span
                              className="text-xs text-gray-400 mt-1 flex items-center gap-1"
                              dir="ltr"
                            >
                              <Clock size={12} />
                              {formatTime(req.createdAt)}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {getStatusBadge(req.status)}
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
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                              title="إلغاء الطلب"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-12 text-center text-gray-400"
                      >
                        <CalendarDays
                          size={40}
                          className="mx-auto mb-3 text-gray-300"
                        />
                        لا توجد طلبات تتطابق مع الفلاتر المحددة.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* نافذة التأكيد المنبثقة */}
        {cancelModal.isOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-red-500" size={32} />
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  إلغاء طلب الإجازة
                </h3>

                <p className="text-gray-500 mb-8">
                  هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ لا يمكن التراجع عن
                  هذا الإجراء.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={confirmCancelRequest}
                    disabled={cancelLoading}
                    className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {cancelLoading ? "جاري الإلغاء..." : "نعم، إلغاء الطلب"}
                  </button>

                  <button
                    onClick={() =>
                      setCancelModal({ isOpen: false, requestId: null })
                    }
                    disabled={cancelLoading}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeHistory;
