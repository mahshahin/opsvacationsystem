import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  User,
  BadgeInfo,
  FileText,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../components/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL || "";

const AdminDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({
    requestId: null,
    action: null,
  });

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pending-requests`);
      const data = await response.json();

      if (response.ok) {
        setPendingRequests(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.message || "فشل تحميل الطلبات");
      }
    } catch (err) {
      toast.error("حدث خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();

    const interval = setInterval(() => {
      fetchPendingRequests();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = async (requestId, action) => {
    try {
      setActionLoading({ requestId, action });

      const response = await fetch(`${API_URL}/api/admin/handle-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل معالجة الطلب");
      } else {
        toast.success(
          `تم ${action === "approve" ? "قبول" : "رفض"} الطلب بنجاح!`,
        );
        fetchPendingRequests();
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء معالجة الطلب");
    } finally {
      setActionLoading({ requestId: null, action: null });
    }
  };

  const translateLeaveType = (type) => {
    switch (type) {
      case "annual":
        return "اعتيادي";
      case "casual":
        return "عارضة";
      case "compensation":
        return "بدل أعياد";
      default:
        return type;
    }
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

  const formatDate = (value) => {
    if (!value) return "---";
    return new Date(value).toLocaleDateString("ar-EG");
  };

  const formatTime = (value) => {
    if (!value) return "---";
    return new Date(value).toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRemainingBalance = (req) => {
    return req.employeeId?.leaveBalances?.[req.leaveType] || 0;
  };

  const hasInsufficientBalance = (req) => {
    return getRemainingBalance(req) < req.duration;
  };

  const stats = useMemo(() => {
    return {
      total: pendingRequests.length,
      annual: pendingRequests.filter((r) => r.leaveType === "annual").length,
      casual: pendingRequests.filter((r) => r.leaveType === "casual").length,
      alerts: pendingRequests.filter((r) => hasInsufficientBalance(r)).length,
    };
  }, [pendingRequests]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
        {/* Header */}
        <header className="mb-6 md:mb-8 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              مراجعة طلبات الإجازة
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              الطلبات المعلقة التي تنتظر قرار الإدارة
            </p>
          </div>

          <div className="w-fit rounded-xl bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-800">
            صلاحيات مدير النظام
          </div>
        </header>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
            <div className="text-xs font-bold text-blue-700">
              إجمالي الطلبات
            </div>
            <div className="mt-2 text-2xl font-black text-blue-800">
              {stats.total}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-bold text-slate-500">اعتيادي</div>
            <div className="mt-2 text-2xl font-black text-slate-800">
              {stats.annual}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
            <div className="text-xs font-bold text-amber-700">عارضة</div>
            <div className="mt-2 text-2xl font-black text-amber-800">
              {stats.casual}
            </div>
          </div>

          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm">
            <div className="text-xs font-bold text-red-700">تنبيهات رصيد</div>
            <div className="mt-2 text-2xl font-black text-red-800">
              {stats.alerts}
            </div>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
              جاري تحميل الطلبات...
            </div>
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((req) => {
              const remainingBalance = getRemainingBalance(req);
              const insufficient = hasInsufficientBalance(req);
              const isLoading = actionLoading.requestId === req._id;

              return (
                <div
                  key={req._id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-blue-50 p-2 text-blue-600">
                          <User size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-800 break-words">
                            {req.employeeId?.name || "غير معروف"}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            كود: {req.employeeId?.employeeCode || "---"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                      {req.employeeId?.jobGrade || "---"}
                    </span>
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getLeaveTypeBadgeClass(
                        req.leaveType,
                      )}`}
                    >
                      {translateLeaveType(req.leaveType)}
                    </span>

                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                      {req.duration} يوم
                    </span>
                  </div>

                  <div className="mb-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-1 text-xs font-bold text-gray-500">
                      الرصيد المتبقي
                    </div>
                    <div
                      className={`text-sm font-black ${
                        insufficient ? "text-red-600" : "text-gray-800"
                      }`}
                    >
                      {remainingBalance} أيام
                    </div>

                    {insufficient && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700">
                        <AlertTriangle size={12} />
                        الرصيد لا يكفي
                      </div>
                    )}
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-bold text-gray-500 mb-1">
                        من
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        {formatDate(req.startDate)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-bold text-gray-500 mb-1">
                        إلى
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        {formatDate(req.endDate)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 rounded-xl bg-gray-50 p-3">
                    <div className="text-xs font-bold text-gray-500 mb-1">
                      تاريخ التقديم
                    </div>
                    <div className="text-sm font-bold text-gray-800">
                      {formatDate(req.createdAt)}
                    </div>
                    <div
                      className="mt-1 flex items-center gap-1 text-xs text-gray-400"
                      dir="ltr"
                    >
                      <Clock size={12} />
                      {formatTime(req.createdAt)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAction(req._id, "approve")}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-3 py-3 text-sm font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle size={16} />
                      {isLoading && actionLoading.action === "approve"
                        ? "جاري..."
                        : "قبول"}
                    </button>

                    <button
                      onClick={() => handleAction(req._id, "reject")}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-3 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle size={16} />
                      {isLoading && actionLoading.action === "reject"
                        ? "جاري..."
                        : "رفض"}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
              <ShieldCheck size={48} className="mx-auto mb-3 text-gray-300" />
              لا يوجد أي طلبات معلقة حالياً، كل شيء على ما يرام!
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="p-4">اسم الموظف</th>
                  <th className="p-4">الدرجة</th>
                  <th className="p-4">نوع الإجازة</th>
                  <th className="p-4">من - إلى</th>
                  <th className="p-4 text-center">المدة</th>
                  <th className="p-4 text-center">تاريخ التقديم</th>
                  <th className="p-4 text-center">الإجراء</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">
                      جاري تحميل الطلبات...
                    </td>
                  </tr>
                ) : pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => {
                    const remainingBalance = getRemainingBalance(req);
                    const insufficient = hasInsufficientBalance(req);
                    const isLoading = actionLoading.requestId === req._id;

                    return (
                      <tr key={req._id} className="hover:bg-gray-50 transition">
                        <td className="p-4 font-bold text-gray-800">
                          {req.employeeId?.name || "غير معروف"}
                          <div className="text-xs text-gray-400 font-normal mt-1">
                            كود: {req.employeeId?.employeeCode}
                          </div>
                        </td>

                        <td className="p-4 text-sm text-gray-600">
                          {req.employeeId?.jobGrade}
                        </td>

                        <td className="p-4">
                          <div className="font-medium text-blue-600">
                            {translateLeaveType(req.leaveType)}
                          </div>

                          <div className="mt-1.5">
                            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-bold border border-gray-200">
                              الرصيد المتبقي:
                              <span
                                className={
                                  insufficient
                                    ? "text-red-600"
                                    : "text-gray-900"
                                }
                              >
                                {remainingBalance} أيام
                              </span>
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-sm text-gray-600">
                          {formatDate(req.startDate)}
                          <br />
                          <span className="text-xs text-gray-400">
                            إلى
                          </span>{" "}
                          {formatDate(req.endDate)}
                        </td>

                        <td className="p-4 text-sm font-bold text-center">
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
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleAction(req._id, "approve")}
                              disabled={isLoading}
                              className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <CheckCircle size={16} />
                              {isLoading && actionLoading.action === "approve"
                                ? "جاري..."
                                : "قبول"}
                            </button>

                            <button
                              onClick={() => handleAction(req._id, "reject")}
                              disabled={isLoading}
                              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              <XCircle size={16} />
                              {isLoading && actionLoading.action === "reject"
                                ? "جاري..."
                                : "رفض"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-12 text-center text-gray-400 text-lg"
                    >
                      <ShieldCheck
                        size={48}
                        className="mx-auto mb-3 text-gray-300"
                      />
                      لا يوجد أي طلبات معلقة حالياً، كل شيء على ما يرام!
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

export default AdminDashboard;
