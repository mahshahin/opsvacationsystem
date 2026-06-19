import React, { useEffect, useMemo, useState } from "react";
import {
  Mail,
  Send,
  Users,
  User,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../components/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL || "";

const sendModes = [
  {
    id: "single",
    title: "موظف واحد",
    description: "إرسال رسالة إلى موظف واحد فقط",
  },
  {
    id: "multiple",
    title: "أكثر من موظف",
    description: "إرسال رسالة إلى مجموعة موظفين محددين",
  },
  {
    id: "all",
    title: "الكل",
    description: "إرسال رسالة إلى كل الموظفين الذين لديهم بريد إلكتروني",
  },
];

const EmployeeMessages = () => {
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [sendMode, setSendMode] = useState("single");
  const [search, setSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [sendResult, setSendResult] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await fetch(`${API_URL}/api/admin/message-employees`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل تحميل الموظفين");
        return;
      }

      const rows = Array.isArray(data.employees) ? data.employees : [];
      setEmployees(rows);

      if (rows.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(rows[0]._id);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل الموظفين");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;

    return employees.filter((emp) => {
      const name = String(emp.name || "").toLowerCase();
      const code = String(emp.employeeCode || "").toLowerCase();
      const email = String(emp.email || "").toLowerCase();
      return name.includes(q) || code.includes(q) || email.includes(q);
    });
  }, [employees, search]);

  const employeesWithEmailCount = useMemo(() => {
    return employees.filter((emp) => String(emp.email || "").trim()).length;
  }, [employees]);

  const employeesWithoutEmailCount = useMemo(() => {
    return employees.length - employeesWithEmailCount;
  }, [employees, employeesWithEmailCount]);

  const selectedEmployeesCount = selectedEmployeeIds.length;

  const selectedSingleEmployee = useMemo(() => {
    return employees.find((emp) => emp._id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  const toggleEmployeeSelection = (employeeId) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const clearSelection = () => {
    setSelectedEmployeeIds([]);
  };

  const handleChangeMode = (mode) => {
    setSendMode(mode);
    setSendResult(null);
    setSearch("");
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject) {
      toast.error("من فضلك أدخل عنوان الرسالة");
      return;
    }

    if (!cleanMessage) {
      toast.error("من فضلك أدخل محتوى الرسالة");
      return;
    }

    if (sendMode === "single" && !selectedEmployeeId) {
      toast.error("من فضلك اختر موظفًا");
      return;
    }

    if (sendMode === "multiple" && selectedEmployeeIds.length === 0) {
      toast.error("من فضلك اختر موظفًا واحدًا على الأقل");
      return;
    }

    try {
      setSending(true);
      setSendResult(null);

      const payload = {
        sendMode,
        employeeIds:
          sendMode === "single"
            ? [selectedEmployeeId]
            : sendMode === "multiple"
              ? selectedEmployeeIds
              : [],
        subject: cleanSubject,
        message: cleanMessage,
      };

      const response = await fetch(
        `${API_URL}/api/admin/send-employee-message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل إرسال الرسائل");
        return;
      }

      toast.success(data.message || "تم إرسال الرسائل بنجاح");
      setSendResult(data);

      setSubject("");
      setMessage("");

      if (sendMode === "multiple") {
        setSelectedEmployeeIds([]);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء إرسال الرسائل");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-black text-slate-800 md:text-2xl">
                  رسائل الموظفين
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  إرسال رسائل بريد إلكتروني لموظف واحد أو مجموعة موظفين أو لجميع
                  الموظفين
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
                <Mail size={16} />
                التواصل الإداري عبر البريد الإلكتروني
              </div>
            </div>
          </header>

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-500">
                إجمالي الموظفين
              </div>
              <div className="mt-2 text-2xl font-black text-slate-800">
                {employees.length}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
              <div className="text-xs font-bold text-emerald-700">
                لديهم بريد إلكتروني
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-800">
                {employeesWithEmailCount}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
              <div className="text-xs font-bold text-amber-700">
                بدون بريد إلكتروني
              </div>
              <div className="mt-2 text-2xl font-black text-amber-800">
                {employeesWithoutEmailCount}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:p-6">
            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <h2 className="mb-3 text-sm font-black text-slate-800">
                  اختر نوع الإرسال
                </h2>

                <div className="grid gap-3 md:grid-cols-3">
                  {sendModes.map((mode) => {
                    const isActive = sendMode === mode.id;

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleChangeMode(mode.id)}
                        className={`rounded-2xl border p-4 text-right transition ${
                          isActive
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div
                              className={`text-sm font-black ${
                                isActive ? "text-blue-700" : "text-slate-800"
                              }`}
                            >
                              {mode.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {mode.description}
                            </div>
                          </div>

                          {isActive && (
                            <div className="rounded-full bg-blue-600 px-2 py-1 text-[10px] font-bold text-white">
                              مختار
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {(sendMode === "single" || sendMode === "multiple") && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-800">
                        اختيار الموظفين
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        يمكنك البحث بالاسم أو الكود أو البريد الإلكتروني
                      </p>
                    </div>

                    {sendMode === "multiple" && selectedEmployeesCount > 0 && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="w-fit rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
                      >
                        مسح التحديد ({selectedEmployeesCount})
                      </button>
                    )}
                  </div>

                  <div className="relative mb-4">
                    <Search
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="ابحث بالاسم أو الكود أو البريد..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pr-10 pl-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  {loadingEmployees ? (
                    <div className="rounded-xl bg-white p-6 text-center text-sm font-bold text-slate-400">
                      جاري تحميل الموظفين...
                    </div>
                  ) : sendMode === "single" ? (
                    <div className="space-y-3">
                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      >
                        {filteredEmployees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.name} - {emp.employeeCode || "—"}
                          </option>
                        ))}
                      </select>

                      {selectedSingleEmployee && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-black text-slate-800">
                                {selectedSingleEmployee.name}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                كود الموظف:{" "}
                                {selectedSingleEmployee.employeeCode || "—"}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                البريد الإلكتروني:{" "}
                                {selectedSingleEmployee.email || "غير مسجل"}
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                selectedSingleEmployee.email
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {selectedSingleEmployee.email
                                ? "جاهز للإرسال"
                                : "بدون بريد"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="max-h-[380px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => {
                          const isSelected = selectedEmployeeIds.includes(
                            emp._id,
                          );

                          return (
                            <label
                              key={emp._id}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                isSelected
                                  ? "border-blue-300 bg-blue-50"
                                  : "border-slate-100 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleEmployeeSelection(emp._id)
                                }
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-800">
                                  {emp.name}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  كود الموظف: {emp.employeeCode || "—"}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  البريد الإلكتروني: {emp.email || "غير مسجل"}
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  emp.email
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {emp.email ? "بريد متاح" : "بدون بريد"}
                              </span>
                            </label>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-sm font-medium text-slate-400">
                          لا توجد نتائج مطابقة
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {sendMode === "all" && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-blue-800">
                        إرسال إلى جميع الموظفين
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-blue-700">
                        سيتم إرسال الرسالة إلى جميع الموظفين الذين لديهم بريد
                        إلكتروني مسجل.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-white px-3 py-1 text-blue-700">
                          إجمالي الموظفين: {employees.length}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-emerald-700">
                          لديهم بريد: {employeesWithEmailCount}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-amber-700">
                          بدون بريد: {employeesWithoutEmailCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    عنوان الرسالة
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="مثال: تنبيه بخصوص جدول العمل"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    محتوى الرسالة
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={7}
                    placeholder="اكتب نص الرسالة هنا..."
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-medium text-slate-500">
                  سيتم تجاهل أي موظف لا يملك بريدًا إلكترونيًا، وسيتم منع تكرار
                  الإرسال لنفس البريد.
                </div>

                <button
                  type="submit"
                  disabled={sending || loadingEmployees}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} />
                  {sending ? "جاري الإرسال..." : "إرسال الرسالة"}
                </button>
              </div>
            </form>
          </div>

          {sendResult && (
            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <CheckCircle className="text-emerald-600" size={20} />
                <h3 className="text-lg font-black text-slate-800">
                  نتيجة الإرسال
                </h3>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <div className="text-[11px] font-bold text-emerald-700">
                    تم الإرسال
                  </div>
                  <div className="mt-1 text-2xl font-black text-emerald-800">
                    {sendResult.summary?.sentCount || 0}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                  <div className="text-[11px] font-bold text-amber-700">
                    بدون بريد إلكتروني
                  </div>
                  <div className="mt-1 text-2xl font-black text-amber-800">
                    {sendResult.summary?.skippedNoEmailCount || 0}
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                  <div className="text-[11px] font-bold text-red-700">
                    فشل الإرسال
                  </div>
                  <div className="mt-1 text-2xl font-black text-red-800">
                    {sendResult.summary?.failedCount || 0}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-bold text-slate-700">
                    إجمالي الإيميلات الفريدة
                  </div>
                  <div className="mt-1 text-2xl font-black text-slate-800">
                    {sendResult.summary?.totalUniqueEmails || 0}
                  </div>
                </div>
              </div>

              {(sendResult.employeesWithoutEmail?.length > 0 ||
                sendResult.failedRecipients?.length > 0) && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {sendResult.employeesWithoutEmail?.length > 0 && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <div className="mb-3 flex items-center gap-2 text-amber-700">
                        <AlertTriangle size={16} />
                        <h4 className="font-black">
                          موظفون تم تخطيهم لعدم وجود بريد
                        </h4>
                      </div>

                      <div className="space-y-2">
                        {sendResult.employeesWithoutEmail.map((emp, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            {emp.name} ({emp.employeeCode})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sendResult.failedRecipients?.length > 0 && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                      <div className="mb-3 flex items-center gap-2 text-red-700">
                        <XCircle size={16} />
                        <h4 className="font-black">حالات فشل الإرسال</h4>
                      </div>

                      <div className="space-y-2">
                        {sendResult.failedRecipients.map((emp, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700"
                          >
                            {emp.name} ({emp.employeeCode}) - {emp.email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeMessages;
