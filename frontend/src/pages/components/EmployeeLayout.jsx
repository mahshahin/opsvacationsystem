import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarDays, FileText, LogOut, User } from 'lucide-react'; // ضفنا استدعاء أيقونة User هنا

const EmployeeLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation(); // عشان نعرف إحنا في أي صفحة وننور الزرار بتاعها

  const handleLogout = () => {
    localStorage.removeItem('employeeData');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* القائمة الجانبية */}
      <aside className="w-64 bg-navy-light text-white flex flex-col shadow-xl shrink-0">
        <div className="p-6 text-center border-b border-blue-400/30">
          <h1 className="text-2xl font-bold">السيطرة المركزية</h1>
          <p className="text-sm text-blue-200 mt-2">نظام الإجازات</p>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* زرار الرئيسية */}
          <button 
            onClick={() => navigate('/dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/dashboard' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Home size={20} /> الرئيسية
          </button>
          
          {/* زرار سجل الإجازات */}
          <button 
            onClick={() => navigate('/my-leaves')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/my-leaves' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <CalendarDays size={20} /> سجل الإجازات
          </button>
          
          {/* زرار التقارير */}
          <button 
            onClick={() => navigate('/my-reports')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/my-reports' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <FileText size={20} /> التقارير
          </button>

          {/* زرار حسابي (الجديد) */}
          <button 
            onClick={() => navigate('/profile')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/profile' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <User size={20} /> حسابي
          </button>

        </nav>
        
        <div className="p-4 border-t border-blue-400/30">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/80 rounded-lg text-blue-100 transition">
            <LogOut size={20} /> تسجيل خروج
          </button>
        </div>
      </aside>

      {/* مساحة العمل اللي هيتغير محتواها حسب الصفحة */}
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default EmployeeLayout;