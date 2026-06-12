import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Printer,
  CalendarDays,
  Clock,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import EmployeeLayout from "../components/EmployeeLayout";

const API_URL = import.meta.env.VITE_API_URL || "";

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

const EmployeeReports = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

  // حالة الفلاتر
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // حالة البيانات الراجعة من السيرفر
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedData =
      sessionStorage.getItem("employeeData") ||
      localStorage.getItem("employeeData");

    if (savedData) {
      setEmployee(JSON.parse(savedData));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleGenerateReport = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("برجاء تحديد تاريخ البداية والنهاية");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/employee/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode: employee.employeeCode,
          startDate,
          endDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "حدث خطأ في استخراج التقرير");
      } else {
        setReportData(data);
        toast.success("تم استخراج التقرير بنجاح");
      }
    } catch (error) {
      toast.error("خطأ في الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportSummary = useMemo(() => {
    if (!reportData) return null;

    const total =
      Number(reportData.totalConsumedDays?.annual || 0) +
      Number(reportData.totalConsumedDays?.casual || 0) +
      Number(reportData.totalConsumedDays?.compensation || 0);

    return {
      total,
      annual: reportData.totalConsumedDays?.annual || 0,
      casual: reportData.totalConsumedDays?.casual || 0,
      compensation: reportData.totalConsumedDays?.compensation || 0,
    };
  }, [reportData]);

  const formatDate = (value) => {
    if (!value) return "---";
    return new Date(value).toLocaleDateString("ar-EG");
  };

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">
        جاري التحميل...
      </div>
    );
  }

  return (
    <EmployeeLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              #printable-report, #printable-report * { visibility: visible; }
              #printable-report {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20px;
                background: white;
              }
              .no-print { display: none !important; }
            }
          `}
        </style>

        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-6 md:mb-8 rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm no-print">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                  <FileText size={14} />
                  تقارير الإجازات
                </div>

                <h2 className="text-2xl md:text-3xl font-black text-gray-800">
                  كشف حساب الإجازات
                </h2>

                <p className="mt-2 text-sm font-medium text-gray-500">
                  استخرج تقريرًا تفصيليًا لإجازاتك المقبولة خلال فترة محددة
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3 text-center">
                <div className="text-xs font-bold text-gray-500">
                  الموظف الحالي
                </div>
                <div className="mt-1 text-sm md:text-base font-black text-gray-800">
                  {employee.name}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  كود: {employee.employeeCode}
                </div>
              </div>
            </div>
          </header>

          {/* Filter Form */}
          <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 no-print">
            <form
              onSubmit={handleGenerateReport}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Start Date */}
              <div className="relative group">
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  من تاريخ
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                  />

                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-11 pl-4 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="relative group">
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  إلى تاريخ
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                  />

                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pr-11 pl-4 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                      جاري الاستخراج...
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      استخراج التقرير
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Report */}
          {reportData && (
            <div
              id="printable-report"
              className="rounded-2xl border border-gray-100 bg-white p-5 md:p-8 shadow-sm"
            >
              {/* Top */}
              <div className="mb-8 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">
                    تقرير إجازات الموظف
                  </h3>

                  <p className="text-gray-700 font-bold">
                    الاسم: {reportData.employeeName}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    الفترة من: {formatDate(reportData.period.from)} - إلى:{" "}
                    {formatDate(reportData.period.to)}
                  </p>
                </div>

                <button
                  onClick={handlePrint}
                  className="no-print inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
                >
                  <Printer size={18} />
                  طباعة التقرير
                </button>
              </div>

              {/* Summary Cards */}
              {reportSummary && (
                <>
                  <h4 className="mb-4 border-r-4 border-blue-600 pr-3 text-lg font-black text-gray-800">
                    ملخص الأيام المستهلكة (المقبولة فقط)
                  </h4>

                  <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="text-xs font-bold text-slate-500">
                        الإجمالي
                      </div>
                      <div className="mt-2 text-2xl font-black text-slate-800">
                        {reportSummary.total}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="text-xs font-bold text-blue-700">
                        اعتيادي
                      </div>
                      <div className="mt-2 text-2xl font-black text-blue-800">
                        {reportSummary.annual}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <div className="text-xs font-bold text-amber-700">
                        عارضة
                      </div>
                      <div className="mt-2 text-2xl font-black text-amber-800">
                        {reportSummary.casual}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <div className="text-xs font-bold text-emerald-700">
                        بدل أعياد
                      </div>
                      <div className="mt-2 text-2xl font-black text-emerald-800">
                        {reportSummary.compensation}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Details */}
              <h4 className="mb-4 border-r-4 border-blue-600 pr-3 text-lg font-black text-gray-800">
                تفاصيل الإجازات في هذه الفترة
              </h4>

              {reportData.detailedLeaves.length > 0 ? (
                <>
                  {/* Mobile Cards */}
                  <div className="space-y-4 md:hidden">
                    {reportData.detailedLeaves.map((leave) => {
                      const typeInfo = leaveTypeConfig[leave.leaveType] || {
                        label: leave.leaveType,
                        badge: "bg-gray-100 text-gray-700",
                        dot: "bg-gray-400",
                        soft: "bg-gray-50 border-gray-100",
                      };

                      return (
                        <div
                          key={leave._id}
                          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                        >
                          <div className={`h-1.5 ${typeInfo.dot}`}></div>

                          <div className="p-4">
                            <div className="mb-4 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${typeInfo.badge}`}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${typeInfo.dot}`}
                                  ></span>
                                  {typeInfo.label}
                                </span>

                                <div className="mt-2 text-sm font-black text-gray-800">
                                  إجازة معتمدة
                                </div>
                              </div>

                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                                <CheckCircle size={12} />
                                {leave.duration} يوم
                              </span>
                            </div>

                            <div
                              className={`rounded-2xl border p-3 ${typeInfo.soft}`}
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
                                    {formatDate(leave.startDate)}
                                  </div>
                                </div>

                                <div className="text-slate-400">←</div>

                                <div className="flex-1 rounded-xl bg-white px-3 py-2 text-center shadow-sm">
                                  <div className="text-[11px] font-bold text-slate-400">
                                    إلى
                                  </div>
                                  <div className="mt-1 text-sm font-black text-slate-800">
                                    {formatDate(leave.endDate)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right border border-gray-200 rounded-lg">
                      <thead className="bg-gray-100 text-gray-700 text-sm">
                        <tr>
                          <th className="p-4 border-b">نوع الإجازة</th>
                          <th className="p-4 border-b">من تاريخ</th>
                          <th className="p-4 border-b">إلى تاريخ</th>
                          <th className="p-4 text-center border-b">
                            عدد الأيام
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {reportData.detailedLeaves.map((leave) => (
                          <tr key={leave._id} className="hover:bg-gray-50">
                            <td className="p-4 font-bold text-gray-800">
                              {leaveTypeConfig[leave.leaveType]?.label ||
                                leave.leaveType}
                            </td>

                            <td className="p-4 text-gray-600">
                              {formatDate(leave.startDate)}
                            </td>

                            <td className="p-4 text-gray-600">
                              {formatDate(leave.endDate)}
                            </td>

                            <td className="p-4 text-center font-bold">
                              {leave.duration} يوم
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
                  <CalendarDays
                    size={40}
                    className="mx-auto mb-2 text-gray-400"
                  />
                  لم تقم باستهلاك أي إجازات (مقبولة) في هذه الفترة.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeReports;
