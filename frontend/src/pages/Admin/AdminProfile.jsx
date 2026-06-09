import React, { useState, useEffect } from 'react';
import { User, Lock, Save, ShieldCheck, Briefcase, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../components/AdminLayout'; // تأكد إن المسار ده صح حسب مجلداتك

const API_URL = import.meta.env.VITE_API_URL || '';

const AdminProfile = () => {
  const [employee, setEmployee] = useState(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('employeeData');
    if (savedData) {
      setEmployee(JSON.parse(savedData));
    }
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error('كلمات المرور الجديدة غير متطابقة!');
    }
    if (passwords.current === passwords.new) {
      return toast.error('كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية!');
    }

    setLoading(true);
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
      setLoading(false);
    }
  };

  if (!employee) return <div className="min-h-screen flex items-center justify-center font-bold text-navy-light">جاري التحميل...</div>;

  return (
    <AdminLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <header className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-navy-light" /> إعدادات حسابي (الإدارة)
          </h2>
          <p className="text-gray-500 text-sm mt-1">الاطلاع على بياناتك وإدارة كلمة المرور لمديري النظام</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* العمود الأول: بيانات الأدمن */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-yellow-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-yellow-400"></div>
              <div className="w-20 h-20 bg-yellow-50 rounded-full border-4 border-white shadow-sm flex items-center justify-center mb-4">
                <User size={40} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">{employee.name}</h3>
              <p className="text-sm text-gray-500 font-medium mb-6 flex items-center gap-1">
                <ShieldCheck size={14} className="text-green-500" /> حساب إدارة موثق
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-1"><Hash size={12}/> اسم المستخدم</label>
                  <p className="font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg">{employee.employeeCode}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-bold flex items-center gap-1 mb-1"><Briefcase size={12}/> الصفة بالنظام</label>
                  <p className="font-semibold text-gray-700 bg-gray-50 p-2 rounded-lg">مدير نظام</p>
                </div>
              </div>
            </div>
          </div>

          {/* العمود الثاني: فورم تغيير كلمة المرور */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Lock className="text-navy-light" size={20} /> تغيير كلمة المرور
              </h3>
              
              <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-md">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور الحالية</label>
                  <input type="password" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:ring-2 focus:ring-navy-light/20 transition" value={passwords.current} onChange={(e) => setPasswords({...passwords, current: e.target.value})} />
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-2">كلمة المرور الجديدة</label>
                  <input type="password" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:ring-2 focus:ring-navy-light/20 transition" value={passwords.new} onChange={(e) => setPasswords({...passwords, new: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">تأكيد كلمة المرور الجديدة</label>
                  <input type="password" required className="w-full px-4 py-3 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:ring-2 focus:ring-navy-light/20 transition" value={passwords.confirm} onChange={(e) => setPasswords({...passwords, confirm: e.target.value})} />
                </div>
                <button type="submit" disabled={loading} className={`mt-4 bg-navy-light text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-navy-dark shadow-md'}`}>
                  <Save size={18} /> {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;