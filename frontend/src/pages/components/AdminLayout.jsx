import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Clock, Users, LogOut,Wallet, Activity, Archive, User } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation(); // عشان نعرف إحنا في أي صفحة وننور الزرار بتاعها
  const [pendingCount, setPendingCount] = useState(0);

  // دالة لجلب عدد الطلبات المعلقة للإشعارات
  const fetchPendingCount = async () => {
    try {
      const response = await fetch('https://opsvacationsystem.onrender.com/api/admin/pending-requests');
      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.length); // بناخد العدد بس
      }
    } catch (err) {
      console.error('خطأ في تحديث الإشعارات');
    }
  };

  useEffect(() => {
    fetchPendingCount();
    // تحديث الإشعار كل 10 ثواني أوتوماتيكياً
    const interval = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // دالة تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('employeeData');
    navigate('/');
  };

  const currentYear = new Date().getFullYear();
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* القائمة الجانبية الخاصة بالإدارة */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl shrink-0">
        <div className="p-6 text-center border-b border-gray-700">
          <ShieldCheck size={40} className="mx-auto mb-2 text-yellow-500" />
          <h1 className="text-xl font-bold flex items-center justify-center gap-2">
  لوحة الإدارة
        </h1>
        <p className="text-sm text-gray-400 mt-1">السيطرة المركزية</p>

        <div className="mt-4 bg-gray-800 rounded-lg p-2 border border-gray-700">
          <p className="text-xs text-gray-300 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               دورة إجازات عام {currentYear}
          </p>
        </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* زرار الطلبات المعلقة */}
          <button 
            onClick={() => navigate('/admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/admin' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <Clock size={20} className={location.pathname === '/admin' ? 'text-yellow-500' : ''}/> 
            الطلبات المعلقة
            {pendingCount > 0 && (
              <span className="mr-auto bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>

          {/* زرار إدارة الموظفين */}
          <button 
            onClick={() => navigate('/admin/employees')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location.pathname === '/admin/employees' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <Users size={20} className={location.pathname === '/admin/employees' ? 'text-blue-400' : ''}/> 
            إدارة الموظفين
          </button>

            {/* زرار إدارة الأرصدة */}
          <button 
            onClick={() => navigate('/admin/balances')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location.pathname === '/admin/balances' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <Wallet size={20} className={location.pathname === '/admin/balances' ? 'text-green-400' : ''}/> 
            إدارة الأرصدة
          </button>

          {/* زرار أرشيف الإجازات */}
          <button 
            onClick={() => navigate('/admin/history')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              location.pathname === '/admin/history' ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            <Archive size={20} className={location.pathname === '/admin/history' ? 'text-orange-400' : ''}/> 
            أرشيف الإجازات
          </button>

            {/* زرار حسابي للأدمن */}
          <button 
            onClick={() => navigate('/admin/profile')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
            location.pathname === '/admin/profile' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
          }`}
          >
          <User size={20} /> حسابي
          </button>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/80 rounded-lg text-gray-300 transition">
            <LogOut size={20} /> خروج من الإدارة
          </button>
        </div>
      </aside>

      {/* المحتوى المتغير */}
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;