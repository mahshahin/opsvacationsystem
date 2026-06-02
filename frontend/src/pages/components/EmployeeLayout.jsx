import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, CalendarDays, FileText, LogOut, User, Menu, X, Briefcase } from 'lucide-react'; 

const EmployeeLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation(); 

  // State للتحكم في ظهور واختفاء القائمة في الموبايل
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('employeeData');
    navigate('/');
  };

  // دالة عشان تنقلنا وتقفل القائمة في الموبايل في نفس الوقت
  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); 
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans" dir="rtl">
      
      {/* 1. الطبقة السودا الشفافة (Overlay) اللي بتظهر ورا القائمة في الموبايل */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* 2. القائمة الجانبية (Sidebar) */}
      <aside 
        className={`fixed top-0 right-0 h-full w-64 bg-navy-light text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* هيدر القائمة الجانبية */}
        <div className="p-6 text-center border-b border-blue-400/30 relative">
          <div className="flex flex-col items-center">
            <Briefcase className="text-blue-300 mb-2" size={32} />
            <h1 className="text-2xl font-bold">السيطرة المركزية</h1>
            <p className="text-sm text-blue-200 mt-1">نظام الإجازات</p>
          </div>
          
          {/* زرار الإغلاق (X) في الموبايل بس */}
          <button 
            className="md:hidden absolute top-4 left-4 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* روابط التنقل */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          
          {/* زرار الرئيسية */}
          <button 
            onClick={() => handleNavigation('/dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/dashboard' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <Home size={20} /> الرئيسية
          </button>
          
          {/* زرار سجل الإجازات */}
          <button 
            onClick={() => handleNavigation('/my-leaves')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/my-leaves' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <CalendarDays size={20} /> سجل الإجازات
          </button>
          
          {/* زرار التقارير */}
          <button 
            onClick={() => handleNavigation('/my-reports')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/my-reports' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <FileText size={20} /> التقارير
          </button>

          {/* زرار حسابي */}
          <button 
            onClick={() => handleNavigation('/profile')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/profile' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <User size={20} /> حسابي
          </button>

        </nav>
        
        {/* زرار تسجيل الخروج */}
        <div className="p-4 border-t border-blue-400/30">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/80 rounded-lg text-blue-100 hover:text-white transition">
            <LogOut size={20} /> تسجيل خروج
          </button>
        </div>
      </aside>

      {/* 3. الجزء الرئيسي لعرض المحتوى (Main Content) */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* هيدر الموبايل العلوي (يظهر في الشاشات الصغيرة فقط ☰) */}
        <header className="bg-navy-light text-white p-4 shadow-md md:hidden flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-200 hover:text-white focus:outline-none"
            >
              <Menu size={28} />
            </button>
            <h1 className="font-bold text-lg">بوابة الموظف</h1>
          </div>
          <Briefcase className="text-blue-300" size={22} />
        </header>

        {/* مساحة العمل اللي هيتغير محتواها حسب الصفحة */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* المحتوى */}
          <div className="flex-1 p-4 md:p-8">
            {children}
          </div>
          
          {/* الفوتر الاحترافي */}
          <footer className="w-full text-left py-4 text-xs text-gray-500 border-t border-gray-200">
            Developed by <span className="font-bold text-gray-700">Mahmoud Shahin</span> &copy; 2026
          </footer>
        </div>
        
      </main>
    </div>
  );
};

export default EmployeeLayout;