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
  Download,
  User,
  Layers,
  AlertTriangle,
  FileText,
  SortDesc,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL || "";

const monthNames = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
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
  const [sortBy, setSortBy] = useState("newest");

  const [reasonModal, setReasonModal] = useState({
    isOpen: false,
    reason: "",
    employeeName: "",
    leaveTypeLabel: "",
  });

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
              ? [...empData].sort((a, b) => Number(a.employeeCode) - Number(b.employeeCode))
              : []
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

  const filteredAndSortedLeaves = useMemo(() => {
    let result = allLeaves.filter((leave) => {
      if (!leave.startDate) return false;

      const leaveDate = new Date(leave.startDate);

      const matchEmp = selectedEmp === "all" || leave.employeeId?.employeeCode === selectedEmp;
      const matchYear = selectedYear === "all" || leaveDate.getFullYear().toString() === selectedYear;
      const matchMonth = selectedMonth === "all" || (leaveDate.getMonth() + 1).toString() === selectedMonth;

      return matchEmp && matchYear && matchMonth;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === "longest") {
        return (b.duration || 0) - (a.duration || 0);
      }
      return 0;
    });

    return result;
  }, [allLeaves, selectedEmp, selectedYear, selectedMonth, sortBy]);

  const groupedLeaves = useMemo(() => {
    const map = new Map();
    filteredAndSortedLeaves.forEach((req) => {
      const empId = req.employeeId?._id || req.employeeId?.employeeCode || "unknown";
      if (!map.has(empId)) {
        map.set(empId, {
          employee: req.employeeId || { name: "غير معروف", employeeCode: "---", jobGrade: "---" },
          requests: [],
        });
      }
      map.get(empId).requests.push(req);
    });

    const groups = Array.from(map.values());
    groups.sort((a, b) => {
      const codeA = String(a.employee?.employeeCode || "").trim();
      const codeB = String(b.employee?.employeeCode || "").trim();

      const numA = Number(codeA);
      const numB = Number(codeB);

      if (!isNaN(numA) && !isNaN(numB) && codeA !== "" && codeB !== "") {
        return numA - numB;
      }
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: "base" });
    });

    return groups;
  }, [filteredAndSortedLeaves]);

  const translateType = (type) => {
    const types = {
      annual: "اعتيادي",
      casual: "عارضة",
      compensation: "بدل أعياد",
    };
    return types[type] || type;
  };

  const getLeaveTypeBadgeClass = (type) => {
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
          <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-green-100 text-green-700 px-3 py-1 text-xs font-bold">
            <CheckCircle size={14} />
            تمت الموافقة
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-100 text-red-700 px-3 py-1 text-xs font-bold">
            <XCircle size={14} />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-bold">
            <Clock size={14} />
            قيد الانتظار
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("ar-EG");
  };

  const formatTime = (value) => {
    if (!value) return "---";
    return new Date(value).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRemainingBalance = (req) => {
    return req.employeeId?.leaveBalances?.[req.leaveType] ?? "---";
  };

  const exportToCSV = () => {
    if (filteredAndSortedLeaves.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const headers = [
      "كود الموظف",
      "اسم الموظف",
      "نوع الإجازة",
      "المدة (أيام)",
      "تاريخ البداية",
      "تاريخ النهاية",
      "حالة الطلب",
      "تاريخ التقديم",
      "السبب"
    ];

    const rows = filteredAndSortedLeaves.map(req => [
      req.employeeId?.employeeCode || "---",
      req.employeeId?.name || "غير معروف",
      translateType(req.leaveType),
      req.duration || 0,
      formatDate(req.startDate),
      formatDate(req.endDate),
      req.status === "approved" ? "مقبول" : req.status === "rejected" ? "مرفوض" : "معلق",
      formatDate(req.createdAt),
      String(req.reason || "").replace(/,/g, " ").replace(/\n/g, " ") // Avoid CSV break
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // UTF-8 BOM
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ارشيف_الاجازات_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  لو كانت الإجازة معتمدة، سيتم إرجاع الرصيد ثم حذف الطلب نهائيًا.
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
        { duration: Infinity, position: "top-center" }
      );
    });
  };

  const handleCancelLeave = async (leave) => {
    const confirmed = await confirmCancelLeaveToast(leave);
    if (!confirmed) return;

    const loadingToastId = toast.loading("جاري إلغاء الإجازة...");

    try {
      setDeletingId(leave._id);

      const res = await fetch(`${API_URL}/api/admin/leave-archive/${leave._id}`, {
        method: "DELETE",
      });

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

  const openReasonModal = (req) => {
    setReasonModal({
      isOpen: true,
      employeeName: req.employeeId?.name || "غير معروف",
      leaveTypeLabel: translateType(req.leaveType),
      reason: String(req.reason || "").trim(),
    });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
        <header className="mb-6 md:mb-8 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              أرشيف إجازات الموظفين
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              كشف حساب شامل لجميع الطلبات مع الفلترة والتصدير
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm"
            >
              <Download size={16} />
              تصدير إلى Excel
            </button>
          </div>
        </header>

        {/* الفلاتر والترتيب */}
        <div className="mb-6 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          {/* فلتر الموظف */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 shadow-inner">
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
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 shadow-inner">
            <Calendar size={16} className="text-gray-400 shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full cursor-pointer border-none bg-transparent text-sm font-bold text-gray-700 outline-none focus:ring-0"
            >
              <option value="all">كل السنوات</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* فلتر الشهر */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 shadow-inner">
            <CalendarDays size={16} className="text-gray-400 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full cursor-pointer border-none bg-transparent text-sm font-bold text-gray-700 outline-none focus:ring-0"
            >
              <option value="all">كل الشهور</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{monthNames[i]}</option>
              ))}
            </select>
          </div>

          {/* الترتيب */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 shadow-inner">
            <SortDesc size={16} className="text-gray-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full cursor-pointer border-none bg-transparent text-sm font-bold text-gray-700 outline-none focus:ring-0"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="oldest">الأقدم أولاً</option>
              <option value="longest">المدة الأطول</option>
            </select>
          </div>
        </div>

        {/* الإحصائية */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-gray-600">
          إجمالي الإجازات المعروضة:
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-800">
            {filteredAndSortedLeaves.length} طلب إجازة
          </span>
        </div>

        {/* عرض الموظفين وإجازاتهم (تصميم جديد) */}
        <div className="space-y-6">
          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
              جاري تحميل الأرشيف...
            </div>
          ) : groupedLeaves.length > 0 ? (
            groupedLeaves.map((group) => {
              const emp = group.employee;
              const reqs = group.requests;
              const totalDays = reqs.reduce((sum, r) => sum + (r.duration || 0), 0);

              return (
                <div
                  key={emp._id || emp.employeeCode || emp.name}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                        <User size={28} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 md:text-2xl">
                          {emp.name || "غير معروف"}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1.5 font-bold">
                            كود:{" "}
                            <strong className="rounded-lg bg-indigo-100/80 px-2.5 py-0.5 text-sm font-black text-indigo-900">
                              {emp.employeeCode || "---"}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700">
                        <Layers size={14} />
                        {reqs.length} طلبات
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800">
                        إجمالي المدة: {totalDays} يوم
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-base">
                      <thead className="bg-gray-50/80 text-sm font-black text-gray-700 border-b border-gray-100">
                        <tr>
                          <th className="p-4 pr-6">نوع الإجازة</th>
                          <th className="p-4">التاريخ (من - إلى)</th>
                          <th className="p-4 text-center">المدة</th>
                          <th className="p-4 text-center">حالة الطلب</th>
                          <th className="p-4 text-center">الرصيد المتبقي</th>
                          <th className="p-4 text-center">تاريخ التقديم</th>
                          <th className="p-4 text-center">الإجراء</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reqs.map((leave) => {
                          const hasReason = Boolean(String(leave.reason || "").trim());
                          return (
                            <tr key={leave._id} className="transition hover:bg-slate-50/70">
                              <td className="p-4 pr-6 font-bold text-gray-800">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span
                                    className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${getLeaveTypeBadgeClass(
                                      leave.leaveType
                                    )}`}
                                  >
                                    {translateType(leave.leaveType)}
                                  </span>
                                  {hasReason && (
                                    <button
                                      type="button"
                                      onClick={() => openReasonModal(leave)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                                    >
                                      <FileText size={14} />
                                      عرض السبب
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="p-4 text-base text-gray-800">
                                <span className="font-extrabold">{formatDate(leave.startDate)}</span>
                                <span className="mx-2 text-sm font-medium text-gray-500">إلى</span>
                                <span className="font-extrabold">{formatDate(leave.endDate)}</span>
                              </td>

                              <td className="p-4 text-center text-base font-black text-indigo-700">
                                {leave.duration} يوم
                              </td>

                              <td className="p-4 text-center">
                                {getStatusBadge(leave.status)}
                              </td>

                              <td className="p-4 text-center">
                                <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-extrabold bg-gray-100 text-gray-800">
                                  {getRemainingBalance(leave)}
                                </span>
                              </td>

                              <td className="p-4 text-center">
                                <div className="text-sm font-bold text-gray-800">
                                  {formatDate(leave.createdAt)}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500" dir="ltr">
                                  {formatTime(leave.createdAt)}
                                </div>
                              </td>

                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleCancelLeave(leave)}
                                  disabled={deletingId === leave._id}
                                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-red-100 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="حذف نهائي"
                                >
                                  <Trash2 size={16} />
                                  {deletingId === leave._id ? "جاري..." : "حذف"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center text-gray-400 shadow-sm">
              <Archive size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-lg">لا توجد نتائج تتطابق مع الفلاتر المحددة.</p>
            </div>
          )}
        </div>

        {/* مودال سبب الإجازة */}
        {reasonModal.isOpen && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                <div className="flex items-center gap-2 text-slate-800">
                  <FileText size={18} className="text-blue-600" />
                  <h3 className="text-lg font-black">سبب الإجازة المكتوب</h3>
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <div>
                    <span className="font-bold">الموظف:</span> {reasonModal.employeeName}
                  </div>
                  <div>
                    <span className="font-bold">نوع الإجازة:</span> {reasonModal.leaveTypeLabel}
                  </div>
                </div>
              </div>
              <div className="px-6 py-5">
                <div className="whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                  {reasonModal.reason}
                </div>
              </div>
              <div className="border-t border-slate-100 px-6 py-4">
                <button
                  onClick={() => setReasonModal({ isOpen: false, reason: "", employeeName: "", leaveTypeLabel: "" })}
                  className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default LeaveHistory;
