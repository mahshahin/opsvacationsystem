import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Archive,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  CalendarDays,
  Calendar,
  Trash2,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";

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

const LeaveHistory = () => {
  const [allLeaves, setAllLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // حالات الفلاتر
  const [selectedEmp, setSelectedEmp] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const archiveRes = await fetch(`${API_URL}/api/admin/leave-archive`);
        const archiveData = await archiveRes.json();

        const empRes = await fetch(`${API_URL}/api/admin/employees`);
        const empData = await empRes.json();

        if (archiveRes.ok && empRes.ok) {
          setAllLeaves(Array.isArray(archiveData) ? archiveData : []);
          setEmployees(
            Array.isArray(empData)
              ? [...empData].sort(
                  (a, b) => Number(a.employeeCode) - Number(b.employeeCode),
                )
              : [],
          );
        } else {
          toast.error("فشل في تحميل البيانات");
        }
      } catch (err) {
        toast.error("حدث خطأ في جلب أرشيف الإجازات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const availableYears = useMemo(() => {
    const years = allLeaves
      .filter((leave) => leave.startDate)
      .map((leave) => new Date(leave.startDate).getFullYear());

    return [...new Set(years)].sort((a, b) => b - a);
  }, [allLeaves]);

  const filteredLeaves = useMemo(() => {
    return allLeaves.filter((leave) => {
      if (!leave.startDate) return false;

      const leaveDate = new Date(leave.startDate);

      const matchEmp =
        selectedEmp === "all" || leave.employeeId?.employeeCode === selectedEmp;

      const matchYear =
        selectedYear === "all" ||
        leaveDate.getFullYear().toString() === selectedYear;

      const matchMonth =
        selectedMonth === "all" ||
        (leaveDate.getMonth() + 1).toString() === selectedMonth;

      return matchEmp && matchYear && matchMonth;
    });
  }, [allLeaves, selectedEmp, selectedYear, selectedMonth]);

  const translateType = (type) => {
    const types = {
      annual: "اعتيادي",
      casual: "عارضة",
      compensation: "بدل أعياد",
    };
    return types[type] || type;
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "annual":
        return "bg-blue-100 text-blue-700";
      case "casual":
        return "bg-amber-100 text-amber-700";
      case "compensation":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center justify-center gap-1 rounded-full bg-green-100 text-green-700 px-2.5 py-1 text-xs font-bold">
            <CheckCircle size={14} />
            تمت الموافقة
          </span>
        );

      case "rejected":
        return (
          <span className="inline-flex items-center justify-center gap-1 rounded-full bg-red-100 text-red-700 px-2.5 py-1 text-xs font-bold">
            <XCircle size={14} />
            مرفوض
          </span>
        );

      default:
        return (
          <span className="inline-flex items-center justify-center gap-1 rounded-full bg-yellow-100 text-yellow-700 px-2.5 py-1 text-xs font-bold">
            <Clock size={14} />
            قيد الانتظار
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "---";

    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const confirmCancelLeaveToast = (leave) => {
    return new Promise((resolve) => {
      toast.custom(
        (t) => (
          <div
            dir="rtl"
            className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-4 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-xl">⚠️</div>

              <div className="flex-1">
                <h3 className="mb-2 text-sm font-black text-gray-800">
                  تأكيد إلغاء الإجازة
                </h3>

                <p className="text-sm leading-6 text-gray-600">
                  هل أنت متأكد من إلغاء الإجازة للموظف{" "}
                  <span className="font-bold text-gray-800">
                    "{leave.employeeId?.name || "غير معروف"}"
                  </span>{" "}
                  نهائيًا؟
                </p>

                <p className="mt-2 text-xs font-bold text-red-600">
                  لو كانت الإجازة معتمدة، سيتم إرجاع الرصيد ثم حذف الطلب
                  نهائيًا.
                </p>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      toast.dismiss(t.id);
                      resolve(false);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    تراجع
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toast.dismiss(t.id);
                      resolve(true);
                    }}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-700"
                  >
                    تأكيد الإلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          position: "top-center",
        },
      );
    });
  };

  const handleCancelLeave = async (leave) => {
    const confirmed = await confirmCancelLeaveToast(leave);
    if (!confirmed) return;

    const loadingToastId = toast.loading("جاري إلغاء الإجازة...");

    try {
      setDeletingId(leave._id);

      const res = await fetch(
        `${API_URL}/api/admin/leave-archive/${leave._id}`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      toast.dismiss(loadingToastId);

      if (!res.ok || !data.success) {
        throw new Error(data.message || "فشل إلغاء الإجازة");
      }

      setAllLeaves((prev) => prev.filter((item) => item._id !== leave._id));
      toast.success(data.message || "تم إلغاء الإجازة نهائيًا");
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error(error.message || "حدث خطأ أثناء إلغاء الإجازة");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
        <header className="mb-6 md:mb-8 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              أرشيف إجازات الموظفين
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              كشف حساب شامل لجميع الطلبات مع إمكانية الفلترة المتقدمة
            </p>
          </div>

          {/* الفلاتر */}
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:w-auto xl:flex-wrap xl:items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
            {/* فلتر الموظف */}
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm min-w-0 xl:min-w-[220px]">
              <Filter size={16} className="text-gray-400 shrink-0" />
              <select
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                className="w-full cursor-pointer border-none bg-transparent text-sm font-bold text-gray-700 outline-none focus:ring-0"
              >
                <option value="all">كل الموظفين</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp.employeeCode}>
                    {emp.employeeCode} - {emp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* فلتر السنة */}
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm min-w-0 xl:min-w-[120px]">
              <Calendar size={16} className="text-gray-400 shrink-0" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full cursor-pointer border-none bg-transparent text-sm font-bold text-gray-700 outline-none focus:ring-0"
              >
                <option value="all">كل السنوات</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* فلتر الشهر */}
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm min-w-0 xl:min-w-[120px]">
              <CalendarDays size={16} className="text-gray-400 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full cursor-pointer border-none bg-transparent text-sm font-bold text-gray-700 outline-none focus:ring-0"
              >
                <option value="all">كل الشهور</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {monthNames[i]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* الإحصائية */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-gray-600">
          إجمالي النتائج المعروضة:
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
            {filteredLeaves.length} طلب إجازة
          </span>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
              جاري تحميل الأرشيف...
            </div>
          ) : filteredLeaves.length > 0 ? (
            filteredLeaves.map((leave) => (
              <div
                key={leave._id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {leave.employeeId ? (
                      <>
                        <div className="font-black text-gray-800 break-words">
                          {leave.employeeId.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          كود: {leave.employeeId.employeeCode}
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-red-400">موظف محذوف</span>
                    )}
                  </div>

                  <div className="shrink-0">{getStatusBadge(leave.status)}</div>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${getTypeBadge(
                      leave.leaveType,
                    )}`}
                  >
                    {translateType(leave.leaveType)}
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                    {leave.duration} أيام
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-xs font-bold text-gray-500 mb-1">
                      من
                    </div>
                    <div className="font-bold text-gray-700">
                      {formatDate(leave.startDate)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-xs font-bold text-gray-500 mb-1">
                      إلى
                    </div>
                    <div className="font-bold text-gray-700">
                      {formatDate(leave.endDate)}
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={13} />
                  {formatDate(leave.createdAt)}
                </div>

                <button
                  onClick={() => handleCancelLeave(leave)}
                  disabled={deletingId === leave._id}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-100 px-3 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {deletingId === leave._id ? "جاري الإلغاء..." : "إلغاء نهائي"}
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
              <Archive size={40} className="mx-auto mb-3 text-gray-300" />
              لا توجد نتائج تتطابق مع الفلاتر المحددة.
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="border-b bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="p-4">الموظف</th>
                  <th className="p-4">نوع الإجازة</th>
                  <th className="p-4 text-center">المدة</th>
                  <th className="p-4 text-center">التاريخ (من - إلى)</th>
                  <th className="p-4 text-center">حالة الطلب</th>
                  <th className="p-4">تاريخ التقديم</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">
                      جاري تحميل الأرشيف...
                    </td>
                  </tr>
                ) : filteredLeaves.length > 0 ? (
                  filteredLeaves.map((leave) => (
                    <tr key={leave._id} className="transition hover:bg-gray-50">
                      <td className="p-4">
                        {leave.employeeId ? (
                          <>
                            <div className="font-bold text-gray-800">
                              {leave.employeeId.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              كود: {leave.employeeId.employeeCode}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-red-400">
                            موظف محذوف
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-medium text-gray-600">
                        {translateType(leave.leaveType)}
                      </td>

                      <td className="p-4 text-center font-bold text-blue-600">
                        {leave.duration} أيام
                      </td>

                      <td className="p-4 text-center text-sm text-gray-500">
                        {formatDate(leave.startDate)}
                        <br />
                        إلى
                        <br />
                        {formatDate(leave.endDate)}
                      </td>

                      <td className="p-4 text-center">
                        {getStatusBadge(leave.status)}
                      </td>

                      <td className="p-4 text-sm text-gray-400">
                        <div className="mt-3 flex items-center gap-1">
                          <Clock size={14} />
                          {formatDate(leave.createdAt)}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleCancelLeave(leave)}
                          disabled={deletingId === leave._id}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          {deletingId === leave._id
                            ? "جاري الإلغاء..."
                            : "إلغاء نهائي"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gray-400">
                      <Archive
                        size={40}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      لا توجد نتائج تتطابق مع الفلاتر المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LeaveHistory;
