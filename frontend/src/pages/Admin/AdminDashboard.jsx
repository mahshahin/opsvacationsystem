import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  User,
  BadgeInfo,
  AlertTriangle,
  Save,
  Printer,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../components/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL || "";

const initialConfirmModal = {
  isOpen: false,
  requestId: null,
  action: null,
  employeeName: "",
  leaveTypeLabel: "",
  duration: 0,
};

const initialReasonModal = {
  isOpen: false,
  employeeName: "",
  leaveTypeLabel: "",
  reason: "",
};

const AdminDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({
    requestId: null,
    action: null,
  });

  const [monthlyLeaveLimit, setMonthlyLeaveLimit] = useState("");
  const [currentMonthlyLeaveLimit, setCurrentMonthlyLeaveLimit] =
    useState(null);
  const [monthlyLimitLoading, setMonthlyLimitLoading] = useState(true);
  const [savingMonthlyLimit, setSavingMonthlyLimit] = useState(false);

  const [confirmModal, setConfirmModal] = useState(initialConfirmModal);
  const [reasonModal, setReasonModal] = useState(initialReasonModal);

  const printedAt = useMemo(() => {
    return new Date().toLocaleString("ar-EG");
  }, []);

  const extractMonthlyLimit = (data) => {
    const value = data?.monthlyLeaveLimit ?? data?.value ?? 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

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

  const fetchMonthlyLeaveLimit = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/admin/leave-rules/monthly-limit`,
      );
      const data = await response.json();

      if (response.ok) {
        const limit = extractMonthlyLimit(data);
        setMonthlyLeaveLimit(String(limit));
        setCurrentMonthlyLeaveLimit(limit);
      } else {
        toast.error(data.message || "فشل تحميل الحد الشهري للإجازات");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء تحميل إعدادات الإجازات");
    } finally {
      setMonthlyLimitLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchMonthlyLeaveLimit();

    const interval = setInterval(() => {
      fetchPendingRequests();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveMonthlyLeaveLimit = async () => {
    const parsedLimit = Number(monthlyLeaveLimit);

    if (
      monthlyLeaveLimit === "" ||
      Number.isNaN(parsedLimit) ||
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1
    ) {
      toast.error("من فضلك أدخل عدد أيام صحيح أكبر من أو يساوي 1");
      return;
    }

    try {
      setSavingMonthlyLimit(true);

      const response = await fetch(
        `${API_URL}/api/admin/leave-rules/monthly-limit`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthlyLeaveLimit: parsedLimit }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل حفظ الحد الشهري");
        return;
      }

      const savedLimit = extractMonthlyLimit(data) || parsedLimit;

      setMonthlyLeaveLimit(String(savedLimit));
      setCurrentMonthlyLeaveLimit(savedLimit);

      toast.success(data.message || "تم تحديث الحد الشهري للإجازات بنجاح");
    } catch (err) {
      toast.error("حدث خطأ أثناء حفظ الحد الشهري");
    } finally {
      setSavingMonthlyLimit(false);
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

  const hasReason = (req) => Boolean(String(req?.reason || "").trim());

  const stats = useMemo(() => {
    return {
      total: pendingRequests.length,
      annual: pendingRequests.filter((r) => r.leaveType === "annual").length,
      casual: pendingRequests.filter((r) => r.leaveType === "casual").length,
      alerts: pendingRequests.filter((r) => hasInsufficientBalance(r)).length,
    };
  }, [pendingRequests]);

  const openReasonModal = (req) => {
    setReasonModal({
      isOpen: true,
      employeeName: req.employeeId?.name || "غير معروف",
      leaveTypeLabel: translateLeaveType(req.leaveType),
      reason: String(req.reason || "").trim(),
    });
  };

  const closeReasonModal = () => {
    setReasonModal(initialReasonModal);
  };

  const openConfirmModal = (req, action) => {
    setConfirmModal({
      isOpen: true,
      requestId: req._id,
      action,
      employeeName: req.employeeId?.name || "غير معروف",
      leaveTypeLabel: translateLeaveType(req.leaveType),
      duration: req.duration || 0,
    });
  };

  const closeConfirmModal = () => {
    if (actionLoading.requestId) return;
    setConfirmModal(initialConfirmModal);
  };

  const executeAction = async (requestId, action) => {
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
        setConfirmModal(initialConfirmModal);
        fetchPendingRequests();
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء معالجة الطلب");
    } finally {
      setActionLoading({ requestId: null, action: null });
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.requestId || !confirmModal.action) return;
    await executeAction(confirmModal.requestId, confirmModal.action);
  };

  const isConfirmLoading =
    confirmModal.requestId &&
    actionLoading.requestId === confirmModal.requestId &&
    actionLoading.action === confirmModal.action;

  return (
    <AdminLayout>
      <div
        className="min-h-screen bg-gray-50 p-4 md:p-8 print:bg-white print:p-0"
        dir="rtl"
      >
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:mb-8 md:flex-row md:items-center md:justify-between md:p-6 print:mb-4 print:rounded-none print:border print:shadow-none">
          <div>
            <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
              مراجعة طلبات الإجازة
            </h2>
            <p className="mt-1 text-sm text-gray-500 print:hidden">
              الطلبات المعلقة التي تنتظر قرار الإدارة
            </p>
            <p className="mt-1 hidden text-sm text-gray-600 print:block">
              تاريخ الطباعة: {printedAt}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              <Printer size={16} />
              طباعة الطلبات
            </button>

            <div className="w-fit rounded-xl bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-800">
              صلاحيات مدير النظام
            </div>
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm md:p-6 print:hidden">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-600">
                  <BadgeInfo size={20} />
                </div>

                <div>
                  <h3 className="text-lg font-black text-gray-800">
                    الحد الشهري للإجازات
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    أي طلب إجازة يتجاوز هذا العدد أو يجعل مجموع إجازات الموظف
                    خلال نفس الشهر يتعدى هذا الحد سيتم رفضه تلقائيًا.
                  </p>
                </div>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2 text-sm font-bold text-violet-700">
                <BadgeInfo size={16} />
                {monthlyLimitLoading
                  ? "جاري تحميل الحد الحالي..."
                  : `الحد الحالي المطبق: ${currentMonthlyLeaveLimit ?? 0} يوم`}
              </div>

              <p className="mt-3 text-xs text-gray-500">
                مثال: لو القيمة 5، أي طلب أكبر من 5 أيام أو أي مجموع إجازات في
                نفس الشهر يتعدى 5 سيتم رفضه.
              </p>
            </div>

            <div className="w-full xl:w-auto">
              <div className="grid gap-3 md:grid-cols-[240px_160px]">
                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    عدد الأيام المسموح بها شهريًا
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={monthlyLeaveLimit}
                    onChange={(e) => setMonthlyLeaveLimit(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base font-bold text-gray-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                    placeholder="مثال: 5"
                  />
                </div>

                <button
                  onClick={handleSaveMonthlyLeaveLimit}
                  disabled={savingMonthlyLimit || monthlyLimitLoading}
                  className="mt-0 inline-flex h-[50px] items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 md:mt-7"
                >
                  <Save size={16} />
                  {savingMonthlyLimit ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 print:hidden">
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

        <div className="space-y-4 md:hidden print:hidden">
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
                          <div className="break-words font-black text-gray-800">
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
                      <div className="mb-1 text-xs font-bold text-gray-500">
                        من
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        {formatDate(req.startDate)}
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="mb-1 text-xs font-bold text-gray-500">
                        إلى
                      </div>
                      <div className="text-sm font-bold text-gray-800">
                        {formatDate(req.endDate)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 rounded-xl bg-gray-50 p-3">
                    <div className="mb-1 text-xs font-bold text-gray-500">
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

                  {hasReason(req) && (
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={() => openReasonModal(req)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                      >
                        <FileText size={14} />
                        عرض الملاحظة
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => openConfirmModal(req, "approve")}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-3 py-3 text-sm font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle size={16} />
                      {isLoading && actionLoading.action === "approve"
                        ? "جاري..."
                        : "قبول"}
                    </button>

                    <button
                      onClick={() => openConfirmModal(req, "reject")}
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

        <div className="hidden overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm md:block print:block print:rounded-none print:border print:shadow-none">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="border-b border-gray-200 p-4">اسم الموظف</th>
                  <th className="border-b border-gray-200 p-4">الدرجة</th>
                  <th className="border-b border-gray-200 p-4">نوع الإجازة</th>
                  <th className="border-b border-gray-200 p-4">من - إلى</th>
                  <th className="border-b border-gray-200 p-4 text-center">
                    المدة
                  </th>
                  <th className="border-b border-gray-200 p-4 text-center">
                    تاريخ التقديم
                  </th>
                  <th className="border-b border-gray-200 p-4 text-center print:hidden">
                    الإجراء
                  </th>
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
                      <tr key={req._id} className="transition hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-800">
                          {req.employeeId?.name || "غير معروف"}
                          <div className="mt-1 text-xs font-normal text-gray-400">
                            كود: {req.employeeId?.employeeCode || "---"}
                          </div>
                        </td>

                        <td className="p-4 text-sm text-gray-600">
                          {req.employeeId?.jobGrade || "---"}
                        </td>

                        <td className="p-4">
                          <div className="font-medium text-blue-600">
                            {translateLeaveType(req.leaveType)}
                          </div>

                          {hasReason(req) && (
                            <button
                              type="button"
                              onClick={() => openReasonModal(req)}
                              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200 print:hidden"
                            >
                              <FileText size={12} />
                              عرض الملاحظة
                            </button>
                          )}

                          <div className="mt-1.5">
                            <span className="inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
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

                        <td className="p-4 text-center text-sm font-bold">
                          {req.duration} يوم
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-medium text-gray-700">
                              {formatDate(req.createdAt)}
                            </span>
                            <span
                              className="mt-1 flex items-center gap-1 text-xs text-gray-400"
                              dir="ltr"
                            >
                              <Clock size={12} />
                              {formatTime(req.createdAt)}
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-center print:hidden">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openConfirmModal(req, "approve")}
                              disabled={isLoading}
                              className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <CheckCircle size={16} />
                              {isLoading && actionLoading.action === "approve"
                                ? "جاري..."
                                : "قبول"}
                            </button>

                            <button
                              onClick={() => openConfirmModal(req, "reject")}
                              disabled={isLoading}
                              className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="p-12 text-center text-lg text-gray-400"
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

        {reasonModal.isOpen && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 p-4 print:hidden">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-5">
                <div className="flex items-center gap-2 text-slate-800">
                  <FileText size={18} className="text-blue-600" />
                  <h3 className="text-lg font-black">ملاحظة الموظف</h3>
                </div>

                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <div>
                    <span className="font-bold">الموظف:</span>{" "}
                    {reasonModal.employeeName}
                  </div>
                  <div>
                    <span className="font-bold">نوع الإجازة:</span>{" "}
                    {reasonModal.leaveTypeLabel}
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
                  onClick={closeReasonModal}
                  className="w-full rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 print:hidden">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div
                className={`px-6 py-5 ${
                  confirmModal.action === "approve"
                    ? "border-b border-green-100 bg-green-50"
                    : "border-b border-red-100 bg-red-50"
                }`}
              >
                <h3
                  className={`text-lg font-black ${
                    confirmModal.action === "approve"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {confirmModal.action === "approve"
                    ? "تأكيد قبول الطلب"
                    : "تأكيد رفض الطلب"}
                </h3>

                <p className="mt-2 text-sm leading-7 text-gray-600">
                  هل أنت متأكد أنك تريد{" "}
                  <span className="font-black text-gray-800">
                    {confirmModal.action === "approve" ? "قبول" : "رفض"}
                  </span>{" "}
                  طلب الإجازة الخاص بالموظف{" "}
                  <span className="font-black text-gray-800">
                    {confirmModal.employeeName}
                  </span>
                  ؟
                </p>

                <div className="mt-4 space-y-2 rounded-xl bg-white/70 p-4">
                  <div className="text-sm text-gray-700">
                    <span className="font-bold">نوع الإجازة:</span>{" "}
                    {confirmModal.leaveTypeLabel}
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-bold">المدة:</span>{" "}
                    {confirmModal.duration} يوم
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4">
                <button
                  onClick={closeConfirmModal}
                  disabled={isConfirmLoading}
                  className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  إلغاء
                </button>

                <button
                  onClick={handleConfirmAction}
                  disabled={isConfirmLoading}
                  className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    confirmModal.action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isConfirmLoading
                    ? "جاري التنفيذ..."
                    : confirmModal.action === "approve"
                      ? "نعم، قبول الطلب"
                      : "نعم، رفض الطلب"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
