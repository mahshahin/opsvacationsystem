import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Key,
  UserCheck,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "";

const Register = () => {
  const navigate = useNavigate();

  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordChecks = useMemo(() => {
    const currentPassword = password || "";

    return {
      minLength: currentPassword.length >= 8,
      upperCase: /[A-Z]/.test(currentPassword),
      lowerCase: /[a-z]/.test(currentPassword),
      number: /\d/.test(currentPassword),
      special: /[^A-Za-z0-9]/.test(currentPassword),
    };
  }, [password]);

  const passwordStrength = useMemo(() => {
    const score = Object.values(passwordChecks).filter(Boolean).length;

    if (!password) {
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
  }, [password, passwordChecks]);

  const isStrongPassword = Object.values(passwordChecks).every(Boolean);

  const handleActivation = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("كلمات المرور غير متطابقة!");
      return;
    }

    if (!isStrongPassword) {
      toast.error(
        "كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل، وحرف كبير وصغير، ورقم، ورمز خاص.",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeCode, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "فشل تفعيل الحساب");
      } else {
        toast.success(data.message || "تم تفعيل الحساب بنجاح");
        setTimeout(() => navigate("/"), 1500);
      }
    } catch (err) {
      toast.error("حدث خطأ في الاتصال بالسيرفر.");
    } finally {
      setLoading(false);
    }
  };

  const RuleItem = ({ ok, text }) => (
    <div
      className={`flex items-center gap-2 text-[11px] font-medium ${
        ok ? "text-green-600" : "text-gray-400"
      }`}
    >
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="p-5 sm:p-6">
          <button
            onClick={() => navigate("/")}
            className="mb-5 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-700 transition"
          >
            <ArrowRight size={16} />
            العودة لتسجيل الدخول
          </button>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
              <UserCheck size={26} />
            </div>
            <h2 className="text-2xl font-black text-slate-800">
              تفعيل حساب جديد
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              خاص بالموظفين المسجلين مسبقًا في النظام
            </p>
          </div>

          <form onSubmit={handleActivation} className="space-y-4">
            {/* كود الموظف */}
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                كود الموظف
              </label>
              <input
                type="text"
                placeholder="اكتب كودك المسجل بالإدارة"
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                required
              />
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة مرور قوية"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* مؤشر القوة */}
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-700">
                    قوة كلمة المرور
                  </span>
                  <span
                    className={`text-[11px] font-black ${passwordStrength.color}`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barColor}`}
                    style={{ width: passwordStrength.width }}
                  ></div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <RuleItem
                    ok={passwordChecks.minLength}
                    text="8 أحرف على الأقل"
                  />
                  <RuleItem ok={passwordChecks.upperCase} text="حرف كبير" />
                  <RuleItem ok={passwordChecks.lowerCase} text="حرف صغير" />
                  <RuleItem ok={passwordChecks.number} text="رقم" />
                  <RuleItem ok={passwordChecks.special} text="رمز خاص" />
                </div>
              </div>
            </div>

            {/* تأكيد كلمة المرور */}
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="أعد كتابة كلمة المرور"
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 pl-11 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {confirmPassword && (
                <div
                  className={`mt-2 text-[11px] font-bold ${
                    password === confirmPassword
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {password === confirmPassword
                    ? "كلمتا المرور متطابقتان"
                    : "كلمتا المرور غير متطابقتين"}
                </div>
              )}
            </div>

            {/* زر التفعيل */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-md bg-slate-900 py-3 text-sm font-black text-white transition shadow-lg ${
                loading ? "cursor-not-allowed opacity-70" : "hover:bg-blue-700"
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Key size={18} />
                {loading ? "جاري التفعيل..." : "تفعيل الحساب"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
