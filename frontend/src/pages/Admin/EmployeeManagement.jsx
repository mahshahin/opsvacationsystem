import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  UserPlus,
  ShieldAlert,
  Shield,
  User,
  Trash2,
  Edit2,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  Briefcase,
  Hash,
  Users,
} from "lucide-react";
import AdminLayout from "../components/AdminLayout";

const API_URL =
  import.meta.env.VITE_API_URL || "https://opsvacationsystem.onrender.com";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newEmp, setNewEmp] = useState({
    employeeCode: "",
    name: "",
    jobGrade: "درجة ثالثة",
    workType: "شيفت",
    role: "employee",
  });

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    jobGrade: "",
    workType: "",
    role: "",
  });

  const GOLDEN_ADMIN_CODE = "admin";

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const resStaff = await fetch(`${API_URL}/api/admin/employees`);
      const staffData = await resStaff.json();

      const resAdmins = await fetch(`${API_URL}/api/admin/admins-list`);
      const adminsData = await resAdmins.json();

      const formattedAdmins = Array.isArray(adminsData)
        ? adminsData.map((admin) => ({
            ...admin,
            employeeCode: admin.username,
            jobGrade: "—",
            workType: "—",
          }))
        : [];

      const allData = [
        ...(Array.isArray(staffData) ? staffData : []),
        ...formattedAdmins,
      ];

      const sortedData = allData.sort((a, b) =>
        String(a.employeeCode).localeCompare(
          String(b.employeeCode),
          undefined,
          {
            numeric: true,
          },
        ),
      );

      setEmployees(sortedData);
    } catch (err) {
      toast.error("حدث خطأ في جلب بيانات الإدارة", {
        style: { background: "#ef4444", color: "#fff" },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();

    try {
      const isAdmin = newEmp.role === "admin";
      const url = `${API_URL}${
        isAdmin ? "/api/admin/create-admin" : "/api/admin/add-employee"
      }`;

      const bodyData = isAdmin
        ? {
            username: newEmp.employeeCode.trim(),
            name: newEmp.name,
            password: "123456",
          }
        : newEmp;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(
          isAdmin
            ? "تم إضافة مدير النظام بنجاح! (الباسوورد الافتراضي: 123456)"
            : "تمت إضافة الموظف بنجاح!",
          {
            style: { background: "#10b981", color: "#fff" },
            duration: 5000,
          },
        );

        fetchEmployees();
        setNewEmp({
          employeeCode: "",
          name: "",
          jobGrade: "درجة ثالثة",
          workType: "شيفت",
          role: "employee",
        });
      } else {
        toast.error(data.message || "حدث خطأ أثناء الإضافة", {
          style: { background: "#ef4444", color: "#fff" },
        });
      }
    } catch (err) {
      toast.error("تعذر الاتصال بالسيرفر", {
        style: { background: "#ef4444", color: "#fff" },
      });
    }
  };

  const handleEditClick = (emp) => {
    setEditingId(emp._id);
    setEditFormData({
      name: emp.name,
      jobGrade: emp.jobGrade,
      workType: emp.workType,
      role: emp.role,
    });
  };

  const handleEditSave = async (id) => {
    try {
      const target = employees.find((e) => e._id === id);
      const isAdmin = target?.role === "admin";

      const url = isAdmin
        ? `${API_URL}/api/admin/update-admin/${id}`
        : `${API_URL}/api/admin/update-employee/${id}`;

      const bodyData = isAdmin
        ? { username: target.employeeCode, name: editFormData.name }
        : editFormData;

      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message, {
          style: { background: "#10b981", color: "#fff" },
        });
        setEditingId(null);
        fetchEmployees();
      } else {
        toast.error(data.message, {
          style: { background: "#ef4444", color: "#fff" },
        });
      }
    } catch (err) {
      toast.error("خطأ أثناء حفظ التعديلات", {
        style: { background: "#ef4444", color: "#fff" },
      });
    }
  };

  const handleDeleteConfirm = (id, empName, role) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <div className="flex items-center gap-2 border-b border-red-100 pb-2 font-bold text-red-600">
            <AlertTriangle size={20} />
            <span>تحذير حذف نهائي!</span>
          </div>

          <p className="text-sm text-gray-700">
            هل أنت متأكد من حذف حساب (
            <span className="font-bold text-red-600">{empName}</span>) نهائياً
            من السيستم؟
          </p>

          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const url =
                    role === "admin"
                      ? `${API_URL}/api/admin/delete-admin/${id}`
                      : `${API_URL}/api/admin/delete-employee/${id}`;

                  const res = await fetch(url, { method: "DELETE" });
                  const data = await res.json();

                  if (res.ok) {
                    toast.success(data.message, {
                      style: { background: "#10b981", color: "#fff" },
                    });
                    fetchEmployees();
                  } else {
                    toast.error(data.message, {
                      style: { background: "#ef4444", color: "#fff" },
                    });
                  }
                } catch (err) {
                  toast.error("خطأ أثناء عملية الحذف", {
                    style: { background: "#ef4444", color: "#fff" },
                  });
                }
              }}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              نعم، احذف
            </button>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
            >
              إلغاء
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          border: "1px solid #ef4444",
          padding: "12px",
          minWidth: "320px",
        },
      },
    );
  };

  const handleResetConfirm = (code, empName) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-1">
          <div className="flex items-center gap-2 border-b border-yellow-100 pb-2 font-bold text-yellow-600">
            <RotateCcw size={20} />
            <span>تأكيد تصفير الحساب</span>
          </div>

          <p className="text-sm text-gray-700">
            هل تريد إعادة تعيين كلمة المرور لحساب (
            <span className="font-bold text-blue-700">{empName}</span>)؟
          </p>

          <div className="mt-2 flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const res = await fetch(
                    `${API_URL}/api/admin/reset-password`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ employeeCode: code }),
                    },
                  );

                  const data = await res.json();

                  if (res.ok) {
                    toast.success(data.message, {
                      duration: 5000,
                      style: { background: "#1e3a8a", color: "#fff" },
                    });
                  } else {
                    toast.error(data.message, {
                      style: { background: "#ef4444", color: "#fff" },
                    });
                  }
                } catch (err) {
                  toast.error("خطأ أثناء تصفير الحساب", {
                    style: { background: "#ef4444", color: "#fff" },
                  });
                }
              }}
              className="flex-1 rounded-lg bg-yellow-500 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-yellow-600"
            >
              نعم، قم بالتصفير
            </button>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-200"
            >
              إلغاء
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          border: "1px solid #eab308",
          padding: "12px",
          minWidth: "320px",
        },
      },
    );
  };

  const translateRole = (role) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-bold text-red-600">
            <ShieldAlert size={14} />
            مدير نظام
          </span>
        );
      case "manager":
        return (
          <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-600">
            <Shield size={14} />
            مدير
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600">
            <User size={14} />
            موظف
          </span>
        );
    }
  };

  const loggedInUser = JSON.parse(localStorage.getItem("employeeData") || "{}");

  const adminsList = useMemo(() => {
    return employees.filter((emp) => {
      if (emp.role !== "admin") return false;
      if (emp.employeeCode === GOLDEN_ADMIN_CODE) {
        return loggedInUser.employeeCode === GOLDEN_ADMIN_CODE;
      }
      return true;
    });
  }, [employees, loggedInUser.employeeCode]);

  const staffList = useMemo(
    () => employees.filter((emp) => emp.role !== "admin"),
    [employees],
  );

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
        {/* Header */}
        <header className="mb-6 md:mb-8 flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              بيان الإدارة والتحكم
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              إضافة، تعديل، حذف، وتصفير حسابات الموظفين والمديرين
            </p>
          </div>

          <div className="w-fit rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">
            إجمالي القوة البشرية: {staffList.length} فرد
          </div>
        </header>

        {/* Add Form */}
        <form
          onSubmit={handleAdd}
          className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2">
            <UserPlus className="text-gray-800" size={20} />
            <h3 className="text-lg font-bold text-gray-800">إضافة جديد</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <input
              placeholder={
                newEmp.role === "admin"
                  ? "اسم المستخدم (Username)"
                  : "كود الموظف"
              }
              value={newEmp.employeeCode}
              className="rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-blue-500"
              onChange={(e) =>
                setNewEmp({ ...newEmp, employeeCode: e.target.value })
              }
              required
            />

            <input
              placeholder={
                newEmp.role === "admin" ? "اسم المدير الرباعي" : "الاسم الرباعي"
              }
              value={newEmp.name}
              className="rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
              required
            />

            <select
              value={newEmp.role}
              className="rounded-xl border p-3 font-bold text-gray-700 outline-none transition focus:ring-2 focus:ring-blue-500"
              onChange={(e) =>
                setNewEmp({
                  ...newEmp,
                  role: e.target.value,
                  jobGrade: e.target.value === "admin" ? "" : "درجة ثالثة",
                  workType: e.target.value === "admin" ? "" : "شيفت",
                })
              }
            >
              <option value="employee">صفة: موظف</option>
              <option value="manager">صفة: مدير</option>
              <option value="admin">صفة: مدير نظام (Admin)</option>
            </select>

            {newEmp.role !== "admin" ? (
              <>
                <select
                  value={newEmp.jobGrade}
                  className="rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    setNewEmp({ ...newEmp, jobGrade: e.target.value })
                  }
                >
                  <option value="درجة ثالثة">درجة ثالثة</option>
                  <option value="درجة ثانية">درجة ثانية</option>
                  <option value="درجة اولى">درجة أولى</option>
                  <option value="كبير">كبير</option>
                </select>

                <select
                  value={newEmp.workType}
                  className="rounded-xl border p-3 outline-none transition focus:ring-2 focus:ring-blue-500"
                  onChange={(e) =>
                    setNewEmp({ ...newEmp, workType: e.target.value })
                  }
                >
                  <option value="شيفت">نظام شيفت</option>
                  <option value="أبحاث">نظام أبحاث</option>
                </select>
              </>
            ) : (
              <div className="hidden xl:block xl:col-span-2"></div>
            )}
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-gray-900 p-3 font-bold text-white shadow-sm transition hover:bg-gray-800 flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            {newEmp.role === "admin"
              ? "إضافة مدير نظام جديد"
              : "إضافة فرد جديد للبيان"}
          </button>
        </form>

        <div className="space-y-8">
          {/* Admins Section */}
          <section className="overflow-hidden rounded-2xl border border-yellow-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-yellow-200 bg-yellow-50 px-4 md:px-6 py-4">
              <ShieldAlert className="text-yellow-600" size={20} />
              <h3 className="font-bold text-yellow-800">
                صلاحيات الإدارة العليا (Admins)
              </h3>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 p-4 md:hidden">
              {loading ? (
                <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-400">
                  جاري تحميل البيانات...
                </div>
              ) : adminsList.length > 0 ? (
                adminsList.map((emp) => (
                  <div
                    key={emp._id}
                    className={`rounded-2xl border p-4 ${
                      emp.employeeCode === GOLDEN_ADMIN_CODE
                        ? "border-yellow-200 bg-yellow-50/50"
                        : "border-gray-100 bg-white"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-gray-500">
                          اسم المستخدم
                        </div>
                        <div className="mt-1 font-black text-gray-800">
                          {emp.employeeCode}
                        </div>
                      </div>

                      {translateRole(emp.role)}
                    </div>

                    <div className="mb-3 rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-bold text-gray-500 mb-1">
                        الاسم بالكامل
                      </div>

                      {editingId === emp._id ? (
                        <input
                          type="text"
                          value={editFormData.name}
                          className="w-full rounded-lg border p-2 outline-none"
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              name: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="font-bold text-gray-800">
                          {emp.name}
                        </div>
                      )}
                    </div>

                    {emp.employeeCode === GOLDEN_ADMIN_CODE ? (
                      <div className="inline-flex items-center gap-1 rounded-lg border border-yellow-200 bg-yellow-100 px-3 py-2 text-xs font-bold text-yellow-700">
                        👑 أدمن ذهبي محمي
                      </div>
                    ) : editingId === emp._id ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleEditSave(emp._id)}
                          className="flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                        >
                          <Check size={14} />
                          حفظ
                        </button>

                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center justify-center gap-1 rounded-lg bg-gray-200 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-300"
                        >
                          <X size={14} />
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleEditClick(emp)}
                          className="flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          title="تعديل"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleResetConfirm(emp.employeeCode, emp.name)
                          }
                          className="flex items-center justify-center rounded-lg bg-yellow-50 p-2 text-yellow-600 transition hover:bg-yellow-100"
                          title="تصفير الحساب"
                        >
                          <RotateCcw size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteConfirm(emp._id, emp.name, emp.role)
                          }
                          className="flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-400">
                  لا يوجد مدراء للعرض
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-right min-w-[800px]">
                <thead className="bg-gray-50 text-gray-500 text-sm border-b">
                  <tr>
                    <th className="p-4 whitespace-nowrap">اسم المستخدم</th>
                    <th className="p-4 whitespace-nowrap">الاسم بالكامل</th>
                    <th className="p-4 text-center whitespace-nowrap">
                      الصلاحية بالنظام
                    </th>
                    <th className="p-4 text-center whitespace-nowrap">
                      إجراءات التحكم الإداري
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-8 text-center text-gray-400 whitespace-nowrap"
                      >
                        جاري تحميل البيانات...
                      </td>
                    </tr>
                  ) : (
                    adminsList.map((emp) => (
                      <tr
                        key={emp._id}
                        className={
                          emp.employeeCode === GOLDEN_ADMIN_CODE
                            ? "bg-yellow-50/40"
                            : "hover:bg-gray-50 transition"
                        }
                      >
                        <td className="p-4 text-gray-600 font-bold whitespace-nowrap">
                          {emp.employeeCode}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          {editingId === emp._id ? (
                            <input
                              type="text"
                              value={editFormData.name}
                              className="p-1.5 border rounded w-full"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  name: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <span className="font-bold text-gray-800">
                              {emp.name}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          {translateRole(emp.role)}
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          {emp.employeeCode === GOLDEN_ADMIN_CODE ? (
                            <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-200">
                              👑 أدمن ذهبي محمي
                            </span>
                          ) : editingId === emp._id ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditSave(emp._id)}
                                className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition"
                              >
                                <Check size={14} />
                                حفظ
                              </button>

                              <button
                                onClick={() => setEditingId(null)}
                                className="flex items-center gap-1 bg-gray-300 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-bold hover:bg-gray-400 transition"
                              >
                                <X size={14} />
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => handleEditClick(emp)}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                title="تعديل البيانات"
                              >
                                <Edit2 size={15} />
                              </button>

                              <button
                                onClick={() =>
                                  handleResetConfirm(emp.employeeCode, emp.name)
                                }
                                className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition"
                                title="تصفير كلمة المرور"
                              >
                                <RotateCcw size={15} />
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteConfirm(
                                    emp._id,
                                    emp.name,
                                    emp.role,
                                  )
                                }
                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                title="حذف حساب الإدارة نهائياً"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Staff Section */}
          <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 bg-navy-light/5 px-4 md:px-6 py-4">
              <Users className="text-navy-light" size={20} />
              <h3 className="font-bold text-gray-800">
                بيان السادة أفراد السيطرة المركزية
              </h3>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 p-4 md:hidden">
              {loading ? (
                <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-400">
                  جاري تحميل البيانات...
                </div>
              ) : staffList.length > 0 ? (
                staffList.map((emp) => (
                  <div
                    key={emp._id}
                    className="rounded-2xl border border-gray-100 bg-white p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-gray-500 mb-1">
                          الكود
                        </div>
                        <div className="font-black text-gray-800">
                          {emp.employeeCode}
                        </div>
                      </div>

                      {editingId === emp._id ? (
                        <select
                          value={editFormData.role}
                          className="rounded-lg border p-2 text-xs"
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              role: e.target.value,
                            })
                          }
                        >
                          <option value="employee">موظف</option>
                          <option value="manager">مدير</option>
                        </select>
                      ) : (
                        translateRole(emp.role)
                      )}
                    </div>

                    <div className="mb-3 rounded-xl bg-gray-50 p-3">
                      <div className="text-xs font-bold text-gray-500 mb-1">
                        الاسم بالكامل
                      </div>

                      {editingId === emp._id ? (
                        <input
                          type="text"
                          value={editFormData.name}
                          className="w-full rounded-lg border p-2 outline-none"
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              name: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <div className="font-bold text-gray-800">
                          {emp.name}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="text-xs font-bold text-gray-500 mb-1">
                          الدرجة
                        </div>
                        {editingId === emp._id ? (
                          <select
                            value={editFormData.jobGrade}
                            className="w-full rounded-lg border p-2 text-sm"
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                jobGrade: e.target.value,
                              })
                            }
                          >
                            <option value="درجة ثالثة">درجة ثالثة</option>
                            <option value="درجة ثانية">درجة ثانية</option>
                            <option value="درجة اولى">درجة أولى</option>
                            <option value="كبير">كبير</option>
                          </select>
                        ) : (
                          <div className="font-bold text-gray-700">
                            {emp.jobGrade}
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="text-xs font-bold text-gray-500 mb-1">
                          نوع العمل
                        </div>
                        {editingId === emp._id ? (
                          <select
                            value={editFormData.workType}
                            className="w-full rounded-lg border p-2 text-sm"
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                workType: e.target.value,
                              })
                            }
                          >
                            <option value="شيفت">شيفت</option>
                            <option value="أبحاث">أبحاث</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              emp.workType === "شيفت"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {emp.workType}
                          </span>
                        )}
                      </div>
                    </div>

                    {editingId === emp._id ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleEditSave(emp._id)}
                          className="flex items-center justify-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-green-700"
                        >
                          <Check size={14} />
                          حفظ
                        </button>

                        <button
                          onClick={() => setEditingId(null)}
                          className="flex items-center justify-center gap-1 rounded-lg bg-gray-200 px-3 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-300"
                        >
                          <X size={14} />
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleEditClick(emp)}
                          className="flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          title="تعديل"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleResetConfirm(emp.employeeCode, emp.name)
                          }
                          className="flex items-center justify-center rounded-lg bg-yellow-50 p-2 text-yellow-600 transition hover:bg-yellow-100"
                          title="تصفير"
                        >
                          <RotateCcw size={16} />
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteConfirm(emp._id, emp.name, emp.role)
                          }
                          className="flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-400">
                  لا يوجد موظفون للعرض
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-right min-w-[1000px]">
                <thead className="bg-gray-50 text-gray-500 text-sm border-b">
                  <tr>
                    <th className="p-4 whitespace-nowrap">الكود</th>
                    <th className="p-4 whitespace-nowrap">الاسم بالكامل</th>
                    <th className="p-4 text-center whitespace-nowrap">
                      الدرجة
                    </th>
                    <th className="p-4 text-center whitespace-nowrap">
                      نوع العمل
                    </th>
                    <th className="p-4 text-center whitespace-nowrap">
                      الصفة بالنظام
                    </th>
                    <th className="p-4 text-center whitespace-nowrap">
                      إجراءات التحكم الإداري
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="p-8 text-center text-gray-400 whitespace-nowrap"
                      >
                        جاري تحميل البيانات...
                      </td>
                    </tr>
                  ) : (
                    staffList.map((emp) => (
                      <tr key={emp._id} className="hover:bg-gray-50 transition">
                        <td className="p-4 text-gray-500 font-medium whitespace-nowrap">
                          {emp.employeeCode}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          {editingId === emp._id ? (
                            <input
                              type="text"
                              value={editFormData.name}
                              className="p-1.5 border rounded w-full"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  name: e.target.value,
                                })
                              }
                            />
                          ) : (
                            <span className="font-bold text-gray-800">
                              {emp.name}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-sm text-gray-600 text-center whitespace-nowrap">
                          {editingId === emp._id ? (
                            <select
                              value={editFormData.jobGrade}
                              className="p-1.5 border rounded"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  jobGrade: e.target.value,
                                })
                              }
                            >
                              <option value="درجة ثالثة">درجة ثالثة</option>
                              <option value="درجة ثانية">درجة ثانية</option>
                              <option value="درجة اولى">درجة أولى</option>
                              <option value="كبير">كبير</option>
                            </select>
                          ) : (
                            emp.jobGrade
                          )}
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          {editingId === emp._id ? (
                            <select
                              value={editFormData.workType}
                              className="p-1.5 border rounded"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  workType: e.target.value,
                                })
                              }
                            >
                              <option value="شيفت">شيفت</option>
                              <option value="أبحاث">أبحاث</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                                emp.workType === "شيفت"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {emp.workType}
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          {editingId === emp._id ? (
                            <select
                              value={editFormData.role}
                              className="p-1.5 border rounded"
                              onChange={(e) =>
                                setEditFormData({
                                  ...editFormData,
                                  role: e.target.value,
                                })
                              }
                            >
                              <option value="employee">موظف</option>
                              <option value="manager">مدير</option>
                            </select>
                          ) : (
                            translateRole(emp.role)
                          )}
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          {editingId === emp._id ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEditSave(emp._id)}
                                className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition"
                              >
                                <Check size={14} />
                                حفظ
                              </button>

                              <button
                                onClick={() => setEditingId(null)}
                                className="flex items-center gap-1 bg-gray-300 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-bold hover:bg-gray-400 transition"
                              >
                                <X size={14} />
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1.5">
                              <button
                                onClick={() => handleEditClick(emp)}
                                className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                title="تعديل البيانات"
                              >
                                <Edit2 size={15} />
                              </button>

                              <button
                                onClick={() =>
                                  handleResetConfirm(emp.employeeCode, emp.name)
                                }
                                className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition"
                                title="تصفير كلمة المرور"
                              >
                                <RotateCcw size={15} />
                              </button>

                              <button
                                onClick={() =>
                                  handleDeleteConfirm(
                                    emp._id,
                                    emp.name,
                                    emp.role,
                                  )
                                }
                                className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                title="حذف الموظف نهائياً"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeManagement;
