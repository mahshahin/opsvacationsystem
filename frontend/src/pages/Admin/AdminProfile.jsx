import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Lock,
  Save,
  ShieldCheck,
  Briefcase,
  Hash,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";

const API_URL = import.meta.env.VITE_API_URL || "";

const AdminProfile = () => {
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState(null);

  // البريد الإلكتروني
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // الباسورد
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  // إظهار/إخفاء الباسورد
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const getStoredAdminData = () => {
    try {
      const sessionData = sessionStorage.getItem("employeeData");
      const localData = localStorage.getItem("employeeData");

      if (sessionData) {
        return {
          source: "session",
          data: JSON.parse(sessionData),
        };
      }

      if (localData) {
        return {
          source: "local",
          data: JSON.parse(localData),
        };
      }

      return null;
    } catch {
      return null;
    }
  };

  const updateStoredAdminData = (updatedData) => {
    if (sessionStorage.getItem("employeeData")) {
      sessionStorage.setItem("employeeData", JSON.stringify(updatedData));
    } else if (localStorage.getItem("employeeData")) {
      localStorage.setItem("employeeData", JSON.stringify(updatedData));
    }
  };

  useEffect(() => {
    const stored = getStoredAdminData();

    if (stored?.data) {
      const parsed = stored.data;
      setAdminUser(parsed);
      setEmail(parsed.email || "");

      const fetchFreshAdminData = async () => {
        try {
          const response = await fetch(`${API_URL}/api/admin/admins-list`);

          if (response.ok) {
            const admins = await response.json();

            const currentAdmin = Array.isArray(admins)
              ? admins.find(
                  (admin) =>
                    String(admin._id) === String(parsed.id) ||
                    String(admin.username) === String(parsed.employeeCode),
                )
              : null;

            if (currentAdmin) {
              const updated = {
                ...parsed,
                name: currentAdmin.name || parsed.name,
                employeeCode: currentAdmin.username || parsed.employeeCode,
                email: currentAdmin.email || "",
                role: currentAdmin.role || parsed.role,
              };

              setEmail(currentAdmin.email || "");
              updateStoredAdminData(updated);
              setAdminUser(updated);
            }
          }
        } catch (err) {
          console.error("خطأ في تحديث بيانات الأدمن من السيرفر", err);
        }
      };

      fetchFreshAdminData();
    } else {
      navigate("/");
    }
  }, [navigate]);

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const passwordChecks = useMemo(() => {
    const newPassword = passwords.new || "";

    return {
      minLength: newPassword.length >= 8,
      upperCase: /[A-Z]/.test(newPassword),
      lowerCase: /[a-z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [passwords.new]);

  const passwordStrength = useMemo(() => {
    const newPassword = passwords.new || "";
    const score = Object.values(passwordChecks).filter(Boolean).length;

    if (!newPassword) {
      return {
        label: "لم يتم الإدخال بعد",
        color: "text-gray-400",
        barColor: "bg-gray-200",
        width: "0%",
      };
    }

    if (score <= 2) {
      return {
        label: "ضعيفة",
        color: "text-red-600",
        barColor: "bg-red-500",
        width: `${(score / 5) * 100}%`,
      };
    }

    if (score <= 4) {
      return {
        label: "متوسطة",
        color: "text-amber-600",
        barColor: "bg-amber-500",
        width: `${(score / 5) * 100}%`,
      };
    }

    return {
      label: "قوية",
      color: "text-green-600",
      barColor: "bg-green-500",
      width: "100%",
    };
  }, [passwords.new, passwordChecks]);

  const isStrongPassword = Object.values(passwordChecks).every(Boolean);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();

    if (!adminUser?.id) return;

    setEmailLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/update-admin/${adminUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: adminUser.name,
            username: adminUser.employeeCode,
            email,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "حدث خطأ أثناء تحديث البريد الإلكتروني");
      } else {
        toast.success(data.message || "تم تحديث البريد الإلكتروني بنجاح");

        const updated = {
          ...adminUser,
          email,
        };

        updateStoredAdminData(updated);
        setAdminUser(updated);
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      return toast.error("كلمات المرور الجديدة غير متطابقة!");
    }

    if (passwords.current === passwords.new) {
      return toast.error("كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية!");
    }

    if (!isStrongPassword) {
      return toast.error(
        "كلمة المرور الجديدة ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل، وحرف كبير وصغير ورقم ورمز خاص.",
      );
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode: adminUser.employeeCode,
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل تغيير كلمة المرور");
      } else {
        toast.success(data.message || "تم تغيير كلمة المرور بنجاح!");
        setPasswords({ current: "", new: "", confirm: "" });
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setLoading(false);
    }
  };

  const RuleItem = ({ ok, text }) => (
    <div
      className={`flex items-center gap-2 text-xs font-medium ${
        ok ? "text-green-600" : "text-gray-400"
      }`}
    >
      {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      <span>{text}</span>
    </div>
  );

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-navy-light">
        جاري التحميل...
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto" dir="rtl">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-navy-light" />
            إعدادات حسابي (الإدارة)
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            الاطلاع على بياناتك وإدارة كلمة المرور والبريد الإلكتروني لمديري
            النظام
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الأول: بيانات الأدمن */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-yellow-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-yellow-400"></div>

              <div className="w-20 h-20 bg-yellow-50 rounded-full border-4 border-white shadow-sm flex items-center justify-center mb-4">
                <User size={40} className="text-yellow-600" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {adminUser.name}
              </h3>

              <p className="text-sm text-gray-500 font-medium mb-6 flex items-center gap-1">
                <ShieldCheck size={14} className="text-green-500" />
                حساب إدارة موثق
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-1">
                    <Hash size={12} />
                    اسم المستخدم
                  </label>
                  <p className="font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg">
                    {adminUser.employeeCode}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-1">
                    <Mail size={12} />
                    البريد الإلكتروني
                  </label>
                  <p
                    className="font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg text-left"
                    dir="ltr"
                  >
                    {adminUser.email || "لم يتم تسجيل بريد إلكتروني"}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-1">
                    <Briefcase size={12} />
                    الصفة بالنظام
                  </label>
                  <p className="font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg">
                    مدير نظام
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* العمود الثاني: النماذج */}
          <div className="lg:col-span-2 space-y-6">
            {/* كارت الإيميل */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Mail className="text-navy-light" size={20} />
                البريد الإلكتروني للإشعارات
              </h3>

              <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:ring-2 focus:ring-navy-light/20 transition text-left"
                    dir="ltr"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-400 font-medium">
                    سيتم إرسال إشعارات طلبات الإجازة الجديدة إلى هذا البريد
                    الإلكتروني.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={emailLoading}
                  className={`bg-navy-light text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${
                    emailLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-navy-dark shadow-md"
                  }`}
                >
                  <Save size={18} />
                  {emailLoading ? "جاري الحفظ..." : "حفظ البريد الإلكتروني"}
                </button>
              </form>
            </div>

            {/* كارت تغيير كلمة المرور */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Lock className="text-navy-light" size={20} />
                تغيير كلمة المرور
              </h3>

              <form
                onSubmit={handleUpdatePassword}
                className="space-y-5 max-w-md"
              >
                {/* كلمة المرور الحالية */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    كلمة المرور الحالية
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      required
                      className="w-full px-4 py-3 pl-12 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:ring-2 focus:ring-navy-light/20 transition"
                      value={passwords.current}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          current: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("current")}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-light transition"
                    >
                      {showPasswords.current ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* كلمة المرور الجديدة */}
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      required
                      className="w-full px-4 py-3 pl-12 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:ring-2 focus:ring-navy-light/20 transition"
                      value={passwords.new}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          new: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-light transition"
                    >
                      {showPasswords.new ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {/* مؤشر القوة */}
                  <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-black text-gray-700">
                        قوة كلمة المرور
                      </span>
                      <span
                        className={`text-xs font-black ${passwordStrength.color}`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barColor}`}
                        style={{ width: passwordStrength.width }}
                      ></div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-black text-gray-700">
                        يجب أن تحتوي كلمة المرور الجديدة على:
                      </div>

                      <RuleItem
                        ok={passwordChecks.minLength}
                        text="8 أحرف على الأقل"
                      />
                      <RuleItem
                        ok={passwordChecks.upperCase}
                        text="حرف إنجليزي كبير واحد على الأقل"
                      />
                      <RuleItem
                        ok={passwordChecks.lowerCase}
                        text="حرف إنجليزي صغير واحد على الأقل"
                      />
                      <RuleItem
                        ok={passwordChecks.number}
                        text="رقم واحد على الأقل"
                      />
                      <RuleItem
                        ok={passwordChecks.special}
                        text="رمز خاص واحد على الأقل مثل @ أو !"
                      />
                    </div>
                  </div>
                </div>

                {/* تأكيد كلمة المرور */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      required
                      className="w-full px-4 py-3 pl-12 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:ring-2 focus:ring-navy-light/20 transition"
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          confirm: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-light transition"
                    >
                      {showPasswords.confirm ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-4 bg-navy-light text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${
                    loading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-navy-dark shadow-md"
                  }`}
                >
                  <Save size={18} />
                  {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const RuleItem = ({ ok, text }) => (
  <div
    className={`flex items-center gap-2 text-xs font-medium ${
      ok ? "text-green-600" : "text-gray-400"
    }`}
  >
    {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
    <span>{text}</span>
  </div>
);

export default AdminProfile;
