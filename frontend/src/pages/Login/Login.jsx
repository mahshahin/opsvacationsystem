import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User, LogIn } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

const Login = () => {
  const navigate = useNavigate();

  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmployeeCode = localStorage.getItem("savedEmployeeCode");
    if (savedEmployeeCode) {
      setEmployeeCode(savedEmployeeCode);
      setRememberMe(true);
    }
  }, []);

  const handleForgotPassword = (e) => {
    e.preventDefault();

    toast("برجاء التواصل مع مدير النظام لإعادة ضبط وتصفير حسابك.", {
      icon: "🔒",
      style: {
        background: "#1e3a8a",
        color: "#fff",
        borderRadius: "14px",
      },
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeCode, password }),
      });

      const data = await response.json();

      if (rememberMe) {
        localStorage.setItem("savedEmployeeCode", employeeCode);
      } else {
        localStorage.removeItem("savedEmployeeCode");
      }

      if (!response.ok) {
        setError(data.message || "فشل تسجيل الدخول");
        toast.error(data.message || "فشل تسجيل الدخول");
      } else {
        // حفظ بيانات المستخدم حسب remember me
        if (rememberMe) {
          localStorage.setItem("employeeData", JSON.stringify(data.user));
          sessionStorage.removeItem("employeeData");
        } else {
          sessionStorage.setItem("employeeData", JSON.stringify(data.user));
          localStorage.removeItem("employeeData");
        }

        toast.success(`تم تسجيل الدخول بنجاح! أهلاً بك يا ${data.user.name}`);

        setTimeout(() => {
          if (data.user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }, 1000);
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال بالسيرفر. تأكد أن السيرفر يعمل.");
      toast.error("حدث خطأ في الاتصال بالسيرفر.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 relative">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        {/* اللوحة اليمنى - التصميم الاحترافي الجديد */}
        <div className="w-full md:w-2/5 relative overflow-hidden flex flex-col items-center justify-center p-8 md:p-10 text-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950">
          {/* 1. إضاءات مشعة */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 opacity-20 blur-[80px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400 opacity-20 blur-[80px] rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

          {/* 2. شبكة نظام خفيفة */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

          <div className="relative z-10 flex flex-col h-full w-full justify-between">
            {/* اللوجو */}
            <div className="w-full flex justify-center mt-2 mb-8">
              <div className="p-5 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl">
                <img
                  src="/logo.png"
                  alt="لوجو الإدارة"
                  className="w-36 md:w-48 h-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                />
              </div>
            </div>

            {/* النصوص */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="space-y-3">
                <h3 className="text-3xl md:text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">
                  أهلاً بك من جديد
                </h3>
                <p className="text-base md:text-lg font-medium text-blue-100/80 max-w-[260px] mx-auto leading-relaxed">
                  منصتك المركزية لكل ما يخص إجازاتك ومواعيد عملك
                </p>
              </div>

              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-40 rounded-full"></div>

              {/* الجزء ده متساب زي ما هو */}
              <button
                onClick={() => navigate("/register")}
                className="group relative mt-4 px-8 py-3.5 w-[85%] md:w-auto overflow-hidden rounded-full bg-white/10 text-white border border-white/20 backdrop-blur-md transition-all duration-300 hover:bg-white hover:text-blue-900 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:-translate-y-1"
              >
                <span className="relative z-10 font-bold text-sm md:text-base flex items-center justify-center gap-2">
                  تفعيل حساب جديد
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* اللوحة اليسرى */}
        <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-center items-center bg-white">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                تسجيل الدخول
              </h2>
              <p className="text-sm text-gray-500">
                أدخل بياناتك للوصول إلى حسابك
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full">
              {error && (
                <div className="mb-5 p-3 bg-red-100 border border-red-300 text-red-700 rounded-xl text-sm text-center font-medium">
                  {error}
                </div>
              )}

              {/* كود الموظف */}
              <div className="mb-5">
                <label className="block mb-2 text-sm font-bold text-gray-700">
                  كود الموظف
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="أدخل كود الموظف"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-navy-light focus:bg-white focus:ring-2 focus:ring-navy-light/20 transition font-medium text-gray-700"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    required
                  />
                  <User
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="mb-5">
                <label className="block mb-2 text-sm font-bold text-gray-700">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    className="w-full px-4 py-3 pr-11 pl-11 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-navy-light focus:bg-white focus:ring-2 focus:ring-navy-light/20 transition font-medium text-gray-700"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-light transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8 text-sm text-gray-500">
                <label className="flex items-center cursor-pointer hover:text-navy-light transition">
                  <input
                    type="checkbox"
                    className="ml-2 accent-navy-light w-4 h-4"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>تذكرني</span>
                </label>

                <a
                  href="#"
                  onClick={handleForgotPassword}
                  className="hover:text-navy-light transition font-medium"
                >
                  نسيت كلمة المرور؟
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold transition duration-300 shadow-lg flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-navy-light/70 text-white cursor-not-allowed"
                    : "bg-navy-dark text-white hover:bg-navy-light"
                }`}
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    جاري الدخول...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    دخول
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 text-xs text-gray-400" dir="ltr">
        Developed by{" "}
        <span className="font-bold text-gray-500">Mahmoud Shahin</span> &copy;
        2026
      </div>
    </div>
  );
};

export default Login;
