import React, { useState, useEffect } from 'react';
import { User, Lock, Save, ShieldCheck, Briefcase, Hash, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import EmployeeLayout from '../components/EmployeeLayout';

const API_URL = import.meta.env.VITE_API_URL || '';

const EmployeeProfile = () => {
  const [employee, setEmployee] = useState(null);
  
  // حالات الإيميل
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // حالات الباسوورد
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem("employeeData");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setEmployee(parsed);
      setEmail(parsed.email || "");

      // 🔄 جلب البيانات المحدثة من السيرفر فوراً لضمان ظهور الإيميل
      const fetchFreshData = async () => {
        try {
          const response = await fetch(
            `${API_URL}/api/employees/${parsed.employeeCode}`,
          );
          if (response.ok) {
            const data = await response.json();
            setEmail(data.email || "");
            const updated = { ...parsed, email: data.email };
            localStorage.setItem("employeeData", JSON.stringify(updated));
            setEmployee(updated);
          }
        } catch (err) {
          console.error("خطأ في تحديث بيانات البروفايل من السيرفر", err);
        }
      };

      fetchFreshData();
    }
  }, []);

  // دالة تحديث الإيميل
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/employees/update-email/${employee.employeeCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        
        // تحديث اللوكال ستوريدج عشان الإيميل يفضل محفوظ في الجلسة الحالية
        const updatedEmployeeData = { ...employee, email: email };
        localStorage.setItem('employeeData', JSON.stringify(updatedEmployeeData));
        setEmployee(updatedEmployeeData);
      } else {
        toast.error(data.message || 'حدث خطأ أثناء الحفظ');
      }
    } catch (error) {
      toast.error('فشل الاتصال بالسيرفر');
    } finally {
      setEmailLoading(false);
    }
  };

  // دالة تحديث الباسوورد
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error('كلمات المرور الجديدة غير متطابقة!');
    }
    if (passwords.current === passwords.new) {
      return toast.error('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية!');
    }

    setPasswordLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: employee.employeeCode,
          currentPassword: passwords.current,
          newPassword: passwords.new
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setPasswords({ current: '', new: '', confirm: '' });
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!employee) return <div className="min-h-screen flex items-center justify-center font-bold text-navy-light">جاري التحميل...</div>;

  return (
    <EmployeeLayout>
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-navy-light" /> إعدادات حسابي
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            الاطلاع على بياناتك الوظيفية وإدارة حسابك والبريد الإلكتروني
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الأول: بيانات الموظف (للقراءة فقط) */}
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
                <ShieldCheck size={14} className="text-green-500" /> حساب موثق
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-1">
                    <Hash size={12} /> كود الموظف
                  </label>
                  <p className="font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg">
                    {employee.employeeCode}
                  </p>
                </div>

                {/* السطر الجديد اللي هيعرض الإيميل */}
                <div>
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-1">
                    <Mail size={12} /> البريد الإلكتروني
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
                    <Briefcase size={12} /> الصفة بالنظام
                  </label>
                  <p className="font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg">
                    {employee.role === "admin" ? "مدير نظام" : "موظف"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* العمود الثاني: فورمات التعديل (الإيميل والباسوورد) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. كارت البريد الإلكتروني للإشعارات */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
              {/* لمسة تصميمية خفيفة */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-navy-light/5 rounded-full -ml-10 -mt-10 pointer-events-none"></div>

              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 relative z-10">
                <Mail className="text-navy-light" size={20} /> البريد الإلكتروني
                للإشعارات
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
                      <Save size={18} /> حفظ الإيميل
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* 2. كارت تغيير كلمة المرور */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Lock className="text-navy-light" size={20} /> تغيير كلمة المرور
              </h3>

              <form
                onSubmit={handleUpdatePassword}
                className="space-y-5 max-w-md"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    كلمة المرور الحالية
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-navy-light focus:ring-4 focus:ring-navy-light/10 transition-all"
                    value={passwords.current}
                    onChange={(e) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-navy-light focus:ring-4 focus:ring-navy-light/10 transition-all"
                    value={passwords.new}
                    onChange={(e) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-navy-light focus:ring-4 focus:ring-navy-light/10 transition-all"
                    value={passwords.confirm}
                    onChange={(e) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                    required
                  />
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
                      <Save size={18} /> تحديث كلمة المرور
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

export default EmployeeProfile;