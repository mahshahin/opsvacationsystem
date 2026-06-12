import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Wallet, Edit3, X, Save, Users, Briefcase } from "lucide-react";
import AdminLayout from "../components/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL || "";

const BalanceManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingBalances, setSavingBalances] = useState(false);

  const currentYear = new Date().getFullYear();

  // حالات النافذة المنبثقة
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [balances, setBalances] = useState({
    annual: 0,
    annualLeaveQuota: 21,
    casual: 0,
    compensation: 0,
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/admin/employees`);
      const data = await res.json();

      if (res.ok) {
        const sorted = Array.isArray(data)
          ? [...data].sort(
              (a, b) => Number(a.employeeCode) - Number(b.employeeCode),
            )
          : [];

        setEmployees(sorted);
      } else {
        toast.error(data.message || "حدث خطأ في جلب البيانات");
      }
    } catch (err) {
      toast.error("حدث خطأ في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const sortedEmployees = useMemo(() => {
    return [...employees].sort(
      (a, b) => Number(a.employeeCode) - Number(b.employeeCode),
    );
  }, [employees]);

  const summary = useMemo(() => {
    return {
      count: sortedEmployees.length,
      totalAnnual: sortedEmployees.reduce(
        (sum, emp) => sum + Number(emp.leaveBalances?.annual || 0),
        0,
      ),
      totalCasual: sortedEmployees.reduce(
        (sum, emp) => sum + Number(emp.leaveBalances?.casual || 0),
        0,
      ),
      totalCompensation: sortedEmployees.reduce(
        (sum, emp) => sum + Number(emp.leaveBalances?.compensation || 0),
        0,
      ),
    };
  }, [sortedEmployees]);

  const openEditModal = (emp) => {
    setSelectedEmp(emp);
    setBalances({
      annual: emp.leaveBalances?.annual || 0,
      annualLeaveQuota: emp.annualLeaveQuota || 21,
      casual: emp.leaveBalances?.casual || 0,
      compensation: emp.leaveBalances?.compensation || 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmp(null);
    setBalances({
      annual: 0,
      annualLeaveQuota: 21,
      casual: 0,
      compensation: 0,
    });
  };

  const handleSaveBalances = async (e) => {
    e.preventDefault();
    if (!selectedEmp?._id) return;

    if (Number(balances.annual) > Number(balances.annualLeaveQuota)) {
      toast.error("الرصيد المتبقي لا يمكن أن يكون أكبر من الاستحقاق السنوي.");
      return;
    }

    try {
      setSavingBalances(true);

      const res = await fetch(
        `${API_URL}/api/admin/update-balances/${selectedEmp._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            annual: Number(balances.annual),
            annualLeaveQuota: Number(balances.annualLeaveQuota),
            casual: Number(balances.casual),
            compensation: Number(balances.compensation),
          }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "تم تحديث الأرصدة بنجاح");
        closeModal();
        fetchEmployees();
      } else {
        toast.error(data.message || "حدث خطأ أثناء حفظ الأرصدة");
      }
    } catch (err) {
      toast.error("خطأ أثناء حفظ الأرصدة");
    } finally {
      setSavingBalances(false);
    }
  };

  const BalanceStat = ({ label, value, color }) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="text-xs font-bold text-gray-500">{label}</div>
      <div className={`mt-2 text-2xl font-black ${color}`}>{value}</div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
        {/* Header */}
        <header className="mb-6 md:mb-8 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              إدارة الأرصدة
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              متابعة وتعديل أرصدة الإجازات لدورة عام {currentYear}
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm md:text-base font-bold text-green-700">
            <Wallet size={20} />
            أرصدة المنظومة
          </div>
        </header>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <BalanceStat
            label="عدد الموظفين"
            value={summary.count}
            color="text-slate-800"
          />
          <BalanceStat
            label="إجمالي الاعتيادي"
            value={summary.totalAnnual}
            color="text-blue-600"
          />
          <BalanceStat
            label="إجمالي العارضة"
            value={summary.totalCasual}
            color="text-amber-600"
          />
          <BalanceStat
            label="إجمالي بدل الأعياد"
            value={summary.totalCompensation}
            color="text-emerald-600"
          />
        </div>

        {/* Mobile Cards */}
        <div className="space-y-4 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
              جاري تحميل الأرصدة...
            </div>
          ) : sortedEmployees.length > 0 ? (
            sortedEmployees.map((emp) => (
              <div
                key={emp._id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-500 mb-1">
                      كود الموظف
                    </div>
                    <div className="font-black text-gray-800">
                      {emp.employeeCode}
                    </div>
                  </div>

                  <div className="rounded-full bg-blue-50 p-2 text-blue-700">
                    <Users size={16} />
                  </div>
                </div>

                <div className="mb-4 rounded-xl bg-gray-50 p-3">
                  <div className="text-xs font-bold text-gray-500 mb-1">
                    الاسم بالكامل
                  </div>
                  <div className="font-bold text-gray-800 break-words">
                    {emp.name}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-blue-50 p-3">
                    <div className="text-xs font-bold text-blue-700 mb-1">
                      الاعتيادي
                    </div>
                    <div className="text-lg font-black text-blue-800">
                      {emp.leaveBalances?.annual || 0}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-blue-600/80">
                      من أصل {emp.annualLeaveQuota || 0}
                    </div>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-3">
                    <div className="text-xs font-bold text-amber-700 mb-1">
                      العارضة
                    </div>
                    <div className="text-lg font-black text-amber-800">
                      {emp.leaveBalances?.casual || 0}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-amber-600/80">
                      من أصل 7
                    </div>
                  </div>

                  <div className="col-span-2 rounded-xl bg-emerald-50 p-3">
                    <div className="text-xs font-bold text-emerald-700 mb-1">
                      بدل أعياد
                    </div>
                    <div className="text-lg font-black text-emerald-800">
                      {emp.leaveBalances?.compensation || 0}
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-emerald-600/80">
                      رصيد حالي
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                  {emp.jobGrade && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 font-bold text-gray-700">
                      {emp.jobGrade}
                    </span>
                  )}

                  {emp.workType && (
                    <span
                      className={`rounded-full px-3 py-1 font-bold ${
                        emp.workType === "شيفت"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        <Briefcase size={12} />
                        {emp.workType}
                      </span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => openEditModal(emp)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                >
                  <Edit3 size={16} />
                  تعديل الأرصدة
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
              لا توجد بيانات لعرضها
            </div>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-right min-w-[950px]">
              <thead className="bg-gray-50 text-gray-500 text-sm border-b">
                <tr>
                  <th className="p-4 whitespace-nowrap">الكود</th>
                  <th className="p-4 whitespace-nowrap">الاسم</th>
                  <th className="p-4 text-center whitespace-nowrap">
                    الاعتيادي
                  </th>
                  <th className="p-4 text-center whitespace-nowrap">
                    العارضة المتبقية
                  </th>
                  <th className="p-4 text-center whitespace-nowrap">
                    بدل أعياد
                  </th>
                  <th className="p-4 text-center whitespace-nowrap">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-gray-400 whitespace-nowrap"
                    >
                      جاري تحميل الأرصدة...
                    </td>
                  </tr>
                ) : (
                  sortedEmployees.map((emp) => (
                    <tr key={emp._id} className="hover:bg-gray-50 transition">
                      <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                        {emp.employeeCode}
                      </td>

                      <td className="p-4 font-bold text-gray-800 whitespace-nowrap">
                        {emp.name}
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-blue-600">
                            {emp.leaveBalances?.annual || 0}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            من أصل {emp.annualLeaveQuota || 0}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-orange-500">
                            {emp.leaveBalances?.casual || 0}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            من أصل 7
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-green-600">
                            {emp.leaveBalances?.compensation || 0}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            رصيد حالي
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                        >
                          <Edit3 size={15} />
                          تعديل الأرصدة
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 md:p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-800">
                    تعديل أرصدة: {selectedEmp?.name}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 font-medium">
                    الرصيد الاعتيادي المتبقي يجب ألا يتجاوز الاستحقاق السنوي
                    الأصلي
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  className="text-gray-400 transition hover:text-red-500"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveBalances} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">
                    الاستحقاق السنوي الأصلي
                  </label>
                  <input
                    type="number"
                    value={balances.annualLeaveQuota}
                    onChange={(e) =>
                      setBalances({
                        ...balances,
                        annualLeaveQuota: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">
                    الرصيد الاعتيادي المتبقي
                  </label>
                  <input
                    type="number"
                    value={balances.annual}
                    onChange={(e) =>
                      setBalances({ ...balances, annual: e.target.value })
                    }
                    className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">
                    الإجازة العارضة
                  </label>
                  <input
                    type="number"
                    value={balances.casual}
                    onChange={(e) =>
                      setBalances({ ...balances, casual: e.target.value })
                    }
                    className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700">
                    رصيد بدل أعياد
                  </label>
                  <input
                    type="number"
                    value={balances.compensation}
                    onChange={(e) =>
                      setBalances({
                        ...balances,
                        compensation: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-xl bg-gray-200 p-3 font-bold text-gray-800 transition hover:bg-gray-300"
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    disabled={savingBalances}
                    className="flex-1 rounded-xl bg-blue-600 p-3 font-bold text-white transition hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save size={18} />
                    {savingBalances ? "جاري الحفظ..." : "حفظ الأرصدة"}
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

export default BalanceManagement;
