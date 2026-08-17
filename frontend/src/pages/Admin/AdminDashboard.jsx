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
  Search,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Edit2,
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

const initialEditModal = {
  isOpen: false,
  requestId: null,
  employeeName: "",
  leaveTypeLabel: "",
  startDate: "",
  endDate: "",
};

const AdminDashboard = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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
  const [editModal, setEditModal] = useState(initialEditModal);
  const [isEditing, setIsEditing] = useState(false);
  
  const [employees, setEmployees] = useState([]);
  const [addLeaveModal, setAddLeaveModal] = useState({
    isOpen: false,
    employeeId: "",
    leaveType: "annual",
    startDate: "",
    endDate: "",
    duration: 1,
    reason: "",
    loading: false,
  });

  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (empId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [empId]: !prev[empId]
    }));
  };

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

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/employees`);
      const data = await response.json();
      if (response.ok) {
        setEmployees(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    fetchMonthlyLeaveLimit();
    fetchEmployees();

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

  const filteredPendingRequests = useMemo(() => {
    if (!searchTerm.trim()) return pendingRequests;
    const term = searchTerm.trim().toLowerCase();
    return pendingRequests.filter((req) => {
      const name = req.employeeId?.name || "";
      const code = req.employeeId?.employeeCode || "";
      return (
        name.toLowerCase().includes(term) ||
        code.toLowerCase().includes(term)
      );
    });
  }, [pendingRequests, searchTerm]);

  const groupedPendingRequests = useMemo(() => {
    const map = new Map();
    filteredPendingRequests.forEach((req) => {
      const empId =
        req.employeeId?._id || req.employeeId?.employeeCode || "unknown";
      if (!map.has(empId)) {
        map.set(empId, {
          employee: req.employeeId || {
            name: "غير معروف",
            employeeCode: "---",
            jobGrade: "---",
          },
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
      return codeA.localeCompare(codeB, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    return groups;
  }, [filteredPendingRequests]);

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

  const openEditModal = (req) => {
    setEditModal({
      isOpen: true,
      requestId: req._id,
      employeeName: req.employeeId?.name || "غير معروف",
      leaveTypeLabel: translateLeaveType(req.leaveType),
      startDate: new Date(req.startDate).toISOString().split('T')[0],
      endDate: new Date(req.endDate).toISOString().split('T')[0],
    });
  };

  const closeEditModal = () => {
    if (isEditing) return;
    setEditModal(initialEditModal);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsEditing(true);
      const response = await fetch(`${API_URL}/api/admin/edit-leave-request/${editModal.requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: editModal.startDate,
          endDate: editModal.endDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل تعديل الطلب");
      } else {
        toast.success("تم تعديل الإجازة بنجاح!");
        closeEditModal();
        fetchPendingRequests();
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء تعديل الطلب");
    } finally {
      setIsEditing(false);
    }
  };

  const handleAddLeaveSubmit = async (e) => {
    e.preventDefault();
    setAddLeaveModal((prev) => ({ ...prev, loading: true }));
    try {
      const response = await fetch(`${API_URL}/api/admin/add-leave-on-behalf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addLeaveModal),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "فشل تسجيل الإجازة");
      } else {
        toast.success("تم تسجيل الإجازة بنجاح!");
        setAddLeaveModal({ isOpen: false, employeeId: "", leaveType: "annual", startDate: "", endDate: "", duration: 1, reason: "", loading: false });
        fetchPendingRequests();
      }
    } catch (err) {
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setAddLeaveModal((prev) => ({ ...prev, loading: false }));
    }
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
              onClick={() => setAddLeaveModal((prev) => ({ ...prev, isOpen: true }))}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700"
            >
              <CheckCircle size={16} />
              تسجيل إجازة لموظف
            </button>
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

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between print:hidden">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم الموظف أو الكود..."
              className="w-full rounded-xl border border-gray-200 py-2.5 pr-10 pl-10 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 hover:text-gray-600"
                title="مسح البحث"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {searchTerm && (
            <div className="text-xs font-bold text-gray-500">
              النتائج المطابقة:{" "}
              <span className="font-extrabold text-indigo-600">
                {filteredPendingRequests.length}
              </span>{" "}
              طلب معلق
            </div>
          )}
        </div>

        <div className="space-y-6 print:space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
              جاري تحميل الطلبات...
            </div>
          ) : groupedPendingRequests.length > 0 ? (
            groupedPendingRequests.map((group) => {
              const emp = group.employee;
              const reqs = group.requests;
              const totalDays = reqs.reduce(
                (sum, r) => sum + (r.duration || 0),
                0,
              );
              const hasAnyInsufficient = reqs.some((r) =>
                hasInsufficientBalance(r),
              );

              return (
                <div
                  key={emp._id || emp.employeeCode || emp.name}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md print:rounded-none print:border print:shadow-none"
                >
                  <div 
                    onClick={() => toggleGroup(emp._id || emp.employeeCode || emp.name)}
                    className="flex flex-col gap-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-indigo-50/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 cursor-pointer hover:bg-indigo-50/60 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
                        <User size={28} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-black text-gray-900 md:text-2xl">
                            {emp.name || "غير معروف"}
                          </h3>
                          {hasAnyInsufficient && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                              <AlertTriangle size={14} />
                              تنبيه رصيد
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1.5 font-bold">
                            كود:{" "}
                            <strong className="rounded-lg bg-indigo-100/80 px-2.5 py-0.5 text-sm font-black text-indigo-900">
                              {emp.employeeCode || "---"}
                            </strong>
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="inline-flex items-center gap-1.5 font-bold">
                            الدرجة:{" "}
                            <strong className="rounded-lg bg-slate-200/80 px-2.5 py-0.5 text-sm font-bold text-slate-800">
                              {emp.jobGrade || "---"}
                            </strong>
                          </span>
                          {emp.leaveBalances && (
                            <>
                              <div className="h-4 w-[1px] bg-gray-300 hidden sm:block"></div>
                              <span className="inline-flex items-center gap-1.5 font-bold">
                                الأرصدة المتبقية:
                                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-100">
                                  اعتيادي: {emp.leaveBalances.annual ?? "---"}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-100">
                                  عارضة: {emp.leaveBalances.casual ?? "---"}
                                </span>
                                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-100">
                                  بدل أعياد: {emp.leaveBalances.compensation ?? "---"}
                                </span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700">
                        <Layers size={14} />
                        {reqs.length}{" "}
                        {reqs.length === 1 ? "طلب معلق" : "طلبات معلقة"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800">
                        إجمالي المدة: {totalDays} يوم
                      </span>
                      <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm transition hover:bg-gray-50 hover:text-indigo-600 print:hidden">
                        {expandedGroups[emp._id || emp.employeeCode || emp.name] ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedGroups[emp._id || emp.employeeCode || emp.name] && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-base">
                      <thead className="bg-gray-50/80 text-sm font-black text-gray-700 border-b border-gray-100">
                        <tr>
                          <th className="p-4 pr-6">نوع الإجازة</th>
                          <th className="p-4">الفترة الزمنية</th>
                          <th className="p-4 text-center">المدة</th>
                          <th className="p-4">الرصيد المتبقي</th>
                          <th className="p-4 text-center">تاريخ التقديم</th>
                          <th className="p-4 text-center print:hidden">
                            الإجراء
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reqs.map((req) => {
                          const remainingBalance = getRemainingBalance(req);
                          const insufficient = hasInsufficientBalance(req);
                          const isLoading =
                            actionLoading.requestId === req._id;

                          return (
                            <tr
                              key={req._id}
                              className="transition hover:bg-slate-50/70"
                            >
                              <td className="p-4 pr-6 font-bold text-gray-800">
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span
                                    className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${getLeaveTypeBadgeClass(
                                      req.leaveType,
                                    )}`}
                                  >
                                    {translateLeaveType(req.leaveType)}
                                  </span>
                                  {hasReason(req) && (
                                    <button
                                      type="button"
                                      onClick={() => openReasonModal(req)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-200 print:hidden"
                                    >
                                      <FileText size={14} />
                                      عرض الملاحظة
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="p-4 text-base text-gray-800">
                                <span className="font-extrabold">
                                  {formatDate(req.startDate)}
                                </span>
                                <span className="mx-2 text-sm font-medium text-gray-500">
                                  إلى
                                </span>
                                <span className="font-extrabold">
                                  {formatDate(req.endDate)}
                                </span>
                              </td>

                              <td className="p-4 text-center text-base font-black text-indigo-700">
                                {req.duration} يوم
                              </td>

                              <td className="p-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-extrabold ${
                                    insufficient
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {insufficient && <AlertTriangle size={14} />}
                                  {remainingBalance} أيام
                                </span>
                              </td>

                              <td className="p-4 text-center">
                                <div className="text-sm font-bold text-gray-800">
                                  {formatDate(req.createdAt)}
                                </div>
                                <div
                                  className="mt-0.5 text-xs text-gray-500"
                                  dir="ltr"
                                >
                                  {formatTime(req.createdAt)}
                                </div>
                              </td>

                              <td className="p-4 text-center print:hidden">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() =>
                                      openConfirmModal(req, "approve")
                                    }
                                    disabled={isLoading}
                                    className="flex items-center gap-1.5 rounded-xl bg-green-500 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <CheckCircle size={16} />
                                    {isLoading &&
                                    actionLoading.action === "approve"
                                      ? "جاري..."
                                      : "قبول"}
                                  </button>

                                  <button
                                    onClick={() =>
                                      openConfirmModal(req, "reject")
                                    }
                                    disabled={isLoading}
                                    className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <XCircle size={16} />
                                    {isLoading &&
                                    actionLoading.action === "reject"
                                      ? "جاري..."
                                      : "رفض"}
                                  </button>

                                  <button
                                    onClick={() => openEditModal(req)}
                                    disabled={isLoading}
                                    title="تعديل تواريخ الإجازة"
                                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-sm font-black text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  )}
                </div>
              );
            })
          ) : pendingRequests.length > 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
              <Search size={44} className="mx-auto mb-3 text-gray-300" />
              لا توجد طلبات معلقة تطابق "{searchTerm}"
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
              <ShieldCheck size={48} className="mx-auto mb-3 text-gray-300" />
              لا يوجد أي طلبات معلقة حالياً، كل شيء على ما يرام!
            </div>
          )}
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

        {/* مودال التعديل */}
        {editModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={closeEditModal}
            ></div>
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="bg-amber-500 p-6 text-center text-white">
                <Edit2 size={48} className="mx-auto mb-3 opacity-90" />
                <h3 className="text-xl font-black">تعديل تواريخ الإجازة</h3>
                <p className="mt-1 text-amber-100 opacity-90 font-bold">
                  {editModal.employeeName} ({editModal.leaveTypeLabel})
                </p>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6">
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-bold text-gray-700">تاريخ البداية الجديد</label>
                  <input
                    type={editModal.startDate ? "date" : "text"}
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = "text";
                    }}
                    placeholder="بداية التاريخ"
                    required
                    value={editModal.startDate}
                    onChange={(e) => setEditModal({...editModal, startDate: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 py-3 px-4 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-bold text-gray-700">تاريخ النهاية الجديد</label>
                  <input
                    type={editModal.endDate ? "date" : "text"}
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => {
                      if (!e.target.value) e.target.type = "text";
                    }}
                    placeholder="نهاية التاريخ"
                    required
                    value={editModal.endDate}
                    onChange={(e) => setEditModal({...editModal, endDate: e.target.value})}
                    className="w-full rounded-xl border border-gray-200 py-3 px-4 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={isEditing}
                    className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isEditing}
                    className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-60"
                  >
                    {isEditing ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* مودال تسجيل إجازة نيابة عن موظف */}
        {addLeaveModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setAddLeaveModal({ ...addLeaveModal, isOpen: false })}
            ></div>
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="bg-teal-600 p-6 text-center text-white">
                <CheckCircle size={48} className="mx-auto mb-3 opacity-90" />
                <h3 className="text-xl font-black">تسجيل إجازة لموظف</h3>
                <p className="mt-1 text-teal-100 opacity-90 font-bold">
                  سيتم تسجيل الإجازة كـ (مقبولة) وخصمها من الرصيد مباشرة
                </p>
              </div>

              <form onSubmit={handleAddLeaveSubmit} className="p-6">
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-bold text-gray-700">الموظف</label>
                  <select
                    required
                    value={addLeaveModal.employeeId}
                    onChange={(e) => setAddLeaveModal({ ...addLeaveModal, employeeId: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 py-3 px-4 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">-- اختر الموظف --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">نوع الإجازة</label>
                    <select
                      required
                      value={addLeaveModal.leaveType}
                      onChange={(e) => setAddLeaveModal({ ...addLeaveModal, leaveType: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 py-3 px-4 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="annual">اعتيادي</option>
                      <option value="casual">عارضة</option>
                      <option value="compensation">بدل أعياد</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">مدة الإجازة (أيام)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={addLeaveModal.duration}
                      onChange={(e) => setAddLeaveModal({ ...addLeaveModal, duration: Number(e.target.value) })}
                      className="w-full rounded-xl border border-gray-200 py-3 px-4 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">تاريخ البداية</label>
                    <input
                      type={addLeaveModal.startDate ? "date" : "text"}
                      onFocus={(e) => (e.target.type = "date")}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = "text";
                      }}
                      placeholder="بداية التاريخ"
                      required
                      value={addLeaveModal.startDate}
                      onChange={(e) => setAddLeaveModal({ ...addLeaveModal, startDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 py-3 px-4 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">تاريخ النهاية</label>
                    <input
                      type={addLeaveModal.endDate ? "date" : "text"}
                      onFocus={(e) => (e.target.type = "date")}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.type = "text";
                      }}
                      placeholder="نهاية التاريخ"
                      required
                      value={addLeaveModal.endDate}
                      onChange={(e) => setAddLeaveModal({ ...addLeaveModal, endDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 py-3 px-4 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="mb-2 block text-sm font-bold text-gray-700">السبب (اختياري)</label>
                  <input
                    type="text"
                    value={addLeaveModal.reason}
                    onChange={(e) => setAddLeaveModal({ ...addLeaveModal, reason: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 py-3 px-4 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAddLeaveModal({ ...addLeaveModal, isOpen: false })}
                    disabled={addLeaveModal.loading}
                    className="flex-1 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={addLeaveModal.loading}
                    className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-60"
                  >
                    {addLeaveModal.loading ? "جاري التسجيل..." : "تسجيل الإجازة"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
