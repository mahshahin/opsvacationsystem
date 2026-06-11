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
import EmployeeLayout from "../components/EmployeeLayout";

const API_URL = import.meta.env.VITE_API_URL || "";

const EmployeeProfile = () => {
  const [employee, setEmployee] = useState(null);

  // حالات الإيميل
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // حالات الباسوورد
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // إظهار/إخفاء الباسورد
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const getStoredEmployeeData = () => {
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

  const updateStoredEmployeeData = (updatedData) => {
    if (sessionStorage.getItem("employeeData")) {
      sessionStorage.setItem("employeeData", JSON.stringify(updatedData));
    } else if (localStorage.getItem("employeeData")) {
      localStorage.setItem("employeeData", JSON.stringify(updatedData));
    }
  };

  useEffect(() => {
    const stored = getStoredEmployeeData();

    if (stored?.data) {
      const parsed = stored.data;
      setEmployee(parsed);
      setEmail(parsed.email || "");

      const fetchFreshData = async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/employee/profile/${parsed.employeeCode}`,
          );

          if (response.ok) {
            const data = await response.json();
            setEmail(data.email || "");

            const updated = { ...parsed, email: data.email };
            updateStoredEmployeeData(updated);
            setEmployee(updated);
          }
        } catch (err) {
          console.error("خطأ في تحديث بيانات البروفايل من السيرفر", err);
        }
      };

      fetchFreshData();
    }
  }, []);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/employee/update-email/${employee.employeeCode}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);

        const updatedEmployeeData = { ...employee, email };
        updateStoredEmployeeData(updatedEmployeeData);
        setEmployee(updatedEmployeeData);
      } else {
        toast.error(data.message || "حدث خطأ أثناء الحفظ");
      }
    } catch (error) {
      toast.error("فشل الاتصال بالسيرفر");
    } finally {
      setEmailLoading(false);
    }
  };

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
        score: 0,
        label: "لم يتم الإدخال بعد",
        color: "text-gray-400",
        barColor: "bg-gray-200",
        width: "0%",
      };
    }

    if (score <= 2) {
      return {
        score,
        label: "ضعيفة",
        color: "text-red-600",
        barColor: "bg-red-500",
        width: `${(score / 5) * 100}%`,
      };
    }

    if (score <= 4) {
      return {
        score,
        label: "متوسطة",
        color: "text-amber-600",
        barColor: "bg-amber-500",
        width: `${(score / 5) * 100}%`,
      };
    }

    return {
      score,
      label: "قوية",
      color: "text-green-600",
      barColor: "bg-green-500",
      width: "100%",
    };
  }, [passwords.new, passwordChecks]);

  const isStrongPassword = Object.values(passwordChecks).every(Boolean);

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

    setPasswordLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode: employee.employeeCode,
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setPasswords({ current: "", new: "", confirm: "" });
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء الاتصال بالسيرفر");
    } finally {
      setPasswordLoading(false);
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

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-navy-light">
        جاري التحميل...
      </div>
    );
  }

  return (
    <EmployeeLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-navy-light" />
            إعدادات حسابي
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            الاطلاع على بياناتك الوظيفية وإدارة حسابك والبريد الإلكتروني
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الأول: بيانات الموظف */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-navy-light"></div>

              <div className="w-20 h-20 bg-gray-50 rounded-full border-4 border-white shadow-sm flex items-center justify-center mb-4">
                <User size={40} className="text-gray-400" />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">
                {employee.name}
              </h3>

              <p className="text-sm text-gray-500 font-medium mb-6 flex items-center gap-1">
                <ShieldCheck size={14} className="text-green-500" />
                حساب موثق
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-1">
                    <Hash size={12} />
                    كود الموظف
                  </label>
                  <p className="font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg">
                    {employee.employeeCode}
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
                    {employee.email
                      ? employee.email
                      : "لم يتم تسجيل بريد إلكتروني"}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-1">
                    <Briefcase size={12} />
                    الصفة بالنظام
                  </label>
                  <p className="font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg">
                    {employee.role === "admin" ? "مدير نظام" : "موظف"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* العمود الثاني: فورمات التعديل */}
          <div className="lg:col-span-2 space-y-6">
            {/* كارت البريد الإلكتروني */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-navy-light/5 rounded-full -ml-10 -mt-10 pointer-events-none"></div>

              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 relative z-10">
                <Mail className="text-navy-light" size={20} />
                البريد الإلكتروني للإشعارات
              </h3>

              <form
                onSubmit={handleUpdateEmail}
                className="space-y-5 max-w-md relative z-10"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    تحديث البريد الإلكتروني
                  </label>

                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within:text-navy-light transition-colors">
                      <Mail size={18} />
                    </div>

                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-navy-light focus:ring-4 focus:ring-navy-light/10 transition-all text-gray-700 font-medium text-left"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      dir="ltr"
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-2 font-medium">
                    <span className="text-red-500">*</span> سيتم إرسال إشعارات
                    فورية لك عند اتخاذ الإدارة قراراً على طلبات إجازاتك.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={emailLoading}
                  className={`mt-4 bg-navy-light text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${
                    emailLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-[#0f172a] hover:-translate-y-0.5 hover:shadow-lg"
                  }`}
                >
                  {emailLoading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      جاري الحفظ...
                    </div>
                  ) : (
                    <>
                      <Save size={18} />
                      حفظ الإيميل
                    </>
                  )}
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
                      className="w-full px-4 py-3 pl-12 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-navy-light focus:ring-4 focus:ring-navy-light/10 transition-all"
                      value={passwords.current}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          current: e.target.value,
                        })
                      }
                      required
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
                      className="w-full px-4 py-3 pl-12 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-navy-light focus:ring-4 focus:ring-navy-light/10 transition-all"
                      value={passwords.new}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          new: e.target.value,
                        })
                      }
                      required
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
                      className="w-full px-4 py-3 pl-12 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-navy-light focus:ring-4 focus:ring-navy-light/10 transition-all"
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords({
                          ...passwords,
                          confirm: e.target.value,
                        })
                      }
                      required
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
                  disabled={passwordLoading}
                  className={`mt-4 bg-navy-light text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${
                    passwordLoading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-[#0f172a] hover:-translate-y-0.5 hover:shadow-lg"
                  }`}
                >
                  {passwordLoading ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      جاري التحديث...
                    </div>
                  ) : (
                    <>
                      <Save size={18} />
                      تحديث كلمة المرور
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
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

export default EmployeeProfile;
