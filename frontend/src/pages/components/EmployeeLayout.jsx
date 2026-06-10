import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  CalendarDays,
  FileText,
  LogOut,
  User,
  Menu,
  X,
  Briefcase,
  Calendar,
  Table2,
} from "lucide-react";

const EmployeeLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // State للتحكم في ظهور واختفاء القائمة في الموبايل
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("employeeData");
    sessionStorage.removeItem("employeeData");
    navigate("/");
  };

  // دالة عشان تنقلنا وتقفل القائمة في الموبايل في نفس الوقت
  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      className="flex h-screen w-full bg-gray-50 font-sans overflow-hidden"
      dir="rtl"
    >
      {/* Overlay في الموبايل */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-navy-dark text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl shrink-0 md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* هيدر السايدبار */}
        <div className="p-6 text-center border-b border-blue-400/30 relative">
          <div className="flex flex-col items-center">
            <Briefcase className="text-blue-300 mb-2" size={32} />
            <h1 className="text-2xl font-bold">السيطرة المركزية</h1>
            <p className="text-sm text-blue-200 mt-1">النظام الذكي</p>
          </div>

          {/* زرار الإغلاق في الموبايل */}
          <button
            className="md:hidden absolute top-4 left-4 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* روابط التنقل */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {/* الرئيسية */}
          <button
            onClick={() => handleNavigation("/dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === "/dashboard"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <Home size={20} />
            الرئيسية
          </button>

          {/* جدول وردياتي */}
          <button
            onClick={() => handleNavigation("/my-shifts")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === "/my-shifts"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <Calendar size={20} />
            جدول وردياتي
          </button>

          {/* جدول الشهر الكامل */}
          <button
            onClick={() => handleNavigation("/employee/full-roster")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === "/employee/full-roster"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <Table2 size={20} />
            جدول الشهر الكامل
          </button>

          {/* سجل الإجازات */}
          <button
            onClick={() => handleNavigation("/my-leaves")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === "/my-leaves"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <CalendarDays size={20} />
            سجل الإجازات
          </button>

          {/* التقارير */}
          <button
            onClick={() => handleNavigation("/my-reports")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === "/my-reports"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <FileText size={20} />
            التقارير
          </button>

          {/* حسابي */}
          <button
            onClick={() => handleNavigation("/profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === "/profile"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <User size={20} />
            حسابي
          </button>
        </nav>

        {/* تسجيل الخروج */}
        <div className="p-4 border-t border-blue-400/30 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/80 rounded-lg text-blue-100 hover:text-white transition"
          >
            <LogOut size={20} />
            تسجيل خروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full flex flex-col min-w-0 relative">
        {/* هيدر الموبايل */}
        <header className="bg-navy-light text-white p-4 shadow-md md:hidden flex items-center justify-between z-10 shrink-0">
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

        {/* المحتوى */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex-1 p-4 md:p-8">{children}</div>

          {/* الفوتر */}
          <footer className="w-full text-left px-4 md:px-8 py-4 text-xs text-gray-500 border-t border-gray-200 shrink-0">
            Developed by{" "}
            <span className="font-bold text-gray-700">Mahmoud Shahin</span>{" "}
            &copy; 2026
          </footer>
        </div>
      </main>
    </div>
  );
};

export default EmployeeLayout;
