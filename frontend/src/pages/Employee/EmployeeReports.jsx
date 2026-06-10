import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Search, Printer, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import EmployeeLayout from "../components/EmployeeLayout";

const API_URL = import.meta.env.VITE_API_URL || "";

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

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">
        جاري التحميل...
      </div>
    );
  }

  return (
    <EmployeeLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        {/* الجزء الخاص بالطباعة */}
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

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 no-print">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="text-blue-600" />
              تقارير الإجازات
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              استخرج كشف حساب تفصيلي لإجازاتك المستهلكة
            </p>
          </div>
        </header>

        {/* لوحة البحث */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 no-print relative overflow-hidden">
          {/* لمسة تصميمية */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-600/5 rounded-full -ml-10 -mt-10 pointer-events-none"></div>

          <form
            onSubmit={handleGenerateReport}
            className="flex flex-col md:flex-row items-center gap-5 relative z-20"
          >
            {/* من تاريخ */}
            <div className="relative group z-20 flex-1 w-full">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors z-20">
                <CalendarDays size={18} />
              </div>

              {!startDate && (
                <div className="absolute inset-y-0 right-0 pr-12 flex items-center pointer-events-none text-gray-500 font-medium z-10">
                  من تاريخ
                </div>
              )}

              <input
                type="date"
                className={`relative w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all font-medium cursor-pointer z-20 bg-transparent ${
                  !startDate ? "text-transparent" : "text-gray-700"
                } [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-30`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            {/* إلى تاريخ */}
            <div className="relative group z-20 flex-1 w-full">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors z-20">
                <CalendarDays size={18} />
              </div>

              {!endDate && (
                <div className="absolute inset-y-0 right-0 pr-12 flex items-center pointer-events-none text-gray-500 font-medium z-10">
                  إلى تاريخ
                </div>
              )}

              <input
                type="date"
                className={`relative w-full pl-4 pr-12 py-3.5 border border-gray-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all font-medium cursor-pointer z-20 bg-transparent ${
                  !endDate ? "text-transparent" : "text-gray-700"
                } [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-30`}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>

            {/* زرار استخراج التقرير */}
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 z-10 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  جاري الاستخراج...
                </div>
              ) : (
                <>
                  <Search size={20} />
                  استخراج التقرير
                </>
              )}
            </button>
          </form>
        </div>

        {/* التقرير المستخرج */}
        {reportData && (
          <div
            id="printable-report"
            className="bg-white p-8 rounded-xl shadow-sm border border-gray-100"
          >
            {/* ترويسة الطباعة */}
            <div className="flex justify-between items-start mb-8 border-b pb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  تقرير إجازات الموظف
                </h3>
                <p className="text-gray-600 font-medium">
                  الاسم: {reportData.employeeName}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  الفترة من:{" "}
                  {new Date(reportData.period.from).toLocaleDateString("ar-EG")}{" "}
                  - إلى:{" "}
                  {new Date(reportData.period.to).toLocaleDateString("ar-EG")}
                </p>
              </div>

              <button
                onClick={handlePrint}
                className="no-print flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-bold transition border border-gray-300"
              >
                <Printer size={18} />
                طباعة التقرير
              </button>
            </div>

            {/* ملخص الاستهلاك */}
            <h4 className="font-bold text-lg text-gray-800 mb-4 border-r-4 border-blue-600 pr-3">
              ملخص الأيام المستهلكة (المقبولة فقط)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-600">اعتيادي</span>
                <span className="text-2xl font-black text-blue-600">
                  {reportData.totalConsumedDays.annual} يوم
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-600">عارضة</span>
                <span className="text-2xl font-black text-yellow-600">
                  {reportData.totalConsumedDays.casual} يوم
                </span>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-600">بدل أعياد</span>
                <span className="text-2xl font-black text-green-600">
                  {reportData.totalConsumedDays.compensation} يوم
                </span>
              </div>
            </div>

            {/* تفاصيل الطلبات */}
            <h4 className="font-bold text-lg text-gray-800 mb-4 border-r-4 border-blue-600 pr-3">
              تفاصيل الإجازات في هذه الفترة
            </h4>

            {reportData.detailedLeaves.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100 text-gray-700 text-sm">
                    <tr>
                      <th className="p-4 border-b">نوع الإجازة</th>
                      <th className="p-4 border-b">من تاريخ</th>
                      <th className="p-4 border-b">إلى تاريخ</th>
                      <th className="p-4 text-center border-b">عدد الأيام</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {reportData.detailedLeaves.map((leave) => (
                      <tr key={leave._id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-800">
                          {leave.leaveType === "annual"
                            ? "اعتيادي"
                            : leave.leaveType === "casual"
                              ? "عارضة"
                              : "بدل أعياد"}
                        </td>

                        <td className="p-4 text-gray-600">
                          {new Date(leave.startDate).toLocaleDateString(
                            "ar-EG",
                          )}
                        </td>

                        <td className="p-4 text-gray-600">
                          {new Date(leave.endDate).toLocaleDateString("ar-EG")}
                        </td>

                        <td className="p-4 text-center font-bold">
                          {leave.duration} يوم
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200 text-gray-500">
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
    </EmployeeLayout>
  );
};

export default EmployeeReports;
