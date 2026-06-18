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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("employeeData");
    sessionStorage.removeItem("employeeData");
    navigate("/");
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div
      className="flex h-[100dvh] w-full overflow-hidden bg-gray-50 font-sans md:h-screen"
      dir="rtl"
    >
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-64 shrink-0 transform flex-col bg-navy-dark text-white shadow-xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="relative border-b border-blue-400/30 p-6 text-center">
          <div className="flex flex-col items-center">
            <Briefcase className="mb-2 text-blue-300" size={32} />
            <h1 className="text-2xl font-bold">السيطرة المركزية</h1>
            <p className="mt-1 text-sm text-blue-200">النظام الذكي</p>
          </div>

          <button
            className="absolute top-4 left-4 text-gray-400 hover:text-white md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <button
            onClick={() => handleNavigation("/dashboard")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition ${
              location.pathname === "/dashboard"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <Home size={20} />
            الرئيسية
          </button>

          <button
            onClick={() => handleNavigation("/my-shifts")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition ${
              location.pathname === "/my-shifts"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <Calendar size={20} />
            جدول وردياتي
          </button>

          <button
            onClick={() => handleNavigation("/employee/full-roster")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition ${
              location.pathname === "/employee/full-roster"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <Table2 size={20} />
            جدول الشهر الكامل
          </button>

          <button
            onClick={() => handleNavigation("/my-leaves")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition ${
              location.pathname === "/my-leaves"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <CalendarDays size={20} />
            سجل الإجازات
          </button>

          <button
            onClick={() => handleNavigation("/my-reports")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition ${
              location.pathname === "/my-reports"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <FileText size={20} />
            التقارير
          </button>

          <button
            onClick={() => handleNavigation("/profile")}
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium transition ${
              location.pathname === "/profile"
                ? "bg-white/10 text-white"
                : "text-blue-100 hover:bg-white/10"
            }`}
          >
            <User size={20} />
            حسابي
          </button>
        </nav>

        <div className="shrink-0 border-t border-blue-400/30 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-blue-100 transition hover:bg-red-500/80 hover:text-white"
          >
            <LogOut size={20} />
            تسجيل خروج
          </button>
        </div>
      </aside>

      <main className="relative flex h-full min-w-0 flex-1 flex-col">
        <header
          className="fixed top-0 right-0 left-0 z-30 flex items-center justify-between bg-navy-light px-4 pb-4 text-white shadow-md md:hidden"
          style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-200 hover:text-white focus:outline-none"
            >
              <Menu size={32} />
            </button>
            <h1 className="text-xl font-bold">بوابة الموظف</h1>
          </div>

          <Briefcase className="text-blue-300" size={26} />
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div
            className="md:hidden"
            style={{ height: "calc(76px + env(safe-area-inset-top))" }}
          ></div>

          <div className="flex-1 p-4 md:p-8">{children}</div>

          <footer className="w-full shrink-0 border-t border-gray-200 px-4 py-4 text-left text-xs text-gray-500 md:px-8">
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