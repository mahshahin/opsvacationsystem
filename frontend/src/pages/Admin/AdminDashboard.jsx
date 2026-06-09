import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, CheckCircle, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "../components/AdminLayout"; // استيراد الـ Layout

const API_URL = import.meta.env.VITE_API_URL || "";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // دالة جلب الطلبات المعلقة أول ما الصفحة تفتح
  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/pending-requests`);
      const data = await response.json();
      if (response.ok) {
        setPendingRequests(data);
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

  // دالة اتخاذ القرار (قبول أو رفض)
  const handleAction = async (requestId, action) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/handle-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(
          `تم ${action === "approve" ? "قبول" : "رفض"} الطلب بنجاح!`,
        );
        fetchPendingRequests();
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء معالجة الطلب");
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <header className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          {/* العنوان والوصف (هيفضلوا فوق على اليمين) */}
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              مراجعة طلبات الإجازة
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              الطلبات المعلقة التي تنتظر قرار الإدارة
            </p>
          </div>

          {/* بادج الصلاحيات (هينزل تحتهم في الموبايل، ويرجع على الشمال في اللاب توب) */}
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold text-sm w-fit">
            صلاحيات مدير النظام
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                    <td colSpan="6" className="p-8 text-center text-gray-400">
                      جاري تحميل الطلبات...
                    </td>
                  </tr>
                ) : pendingRequests.length > 0 ? (
                  pendingRequests.map((req) => (
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
                          {req.leaveType === "annual"
                            ? "اعتيادي"
                            : req.leaveType === "casual"
                              ? "عارضة"
                              : "بدل أعياد"}
                        </div>
                        {/* بادج الرصيد المتبقي الذكي */}
                        <div className="mt-1.5">
                          <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-bold border border-gray-200">
                            الرصيد المتبقي:{" "}
                            <span
                              className={
                                req.employeeId?.leaveBalances?.[req.leaveType] <
                                req.duration
                                  ? "text-red-600"
                                  : "text-gray-900"
                              }
                            >
                              {req.employeeId?.leaveBalances?.[req.leaveType] ||
                                0}{" "}
                              أيام
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(req.startDate).toLocaleDateString("ar-EG")}{" "}
                        <br />
                        <span className="text-xs text-gray-400">إلى</span>{" "}
                        {new Date(req.endDate).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="p-4 text-sm font-bold text-center">
                        {req.duration} يوم
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-gray-700 font-medium">
                            {new Date(req.createdAt).toLocaleDateString(
                              "ar-EG",
                            )}
                          </span>
                          <span
                            className="text-xs text-gray-400 mt-1 flex items-center gap-1"
                            dir="ltr"
                          >
                            <Clock size={12} />
                            {new Date(req.createdAt).toLocaleTimeString(
                              "ar-EG",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAction(req._id, "approve")}
                            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                          >
                            <CheckCircle size={16} /> قبول
                          </button>
                          <button
                            onClick={() => handleAction(req._id, "reject")}
                            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                          >
                            <XCircle size={16} /> رفض
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
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
