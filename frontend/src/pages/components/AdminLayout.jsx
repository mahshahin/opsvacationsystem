import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Clock,
  Users,
  LogOut,
  Wallet,
  Activity,
  Archive,
  User,
  Menu,
  X,
  Shield,
  Calendar,
  Mail,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/pending-requests`);
        if (response.ok) {
          const data = await response.json();
          setPendingCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (err) {
        console.error("خطأ في تحديث الإشعارات:", err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("employeeData");
    sessionStorage.removeItem("employeeData");
    navigate("/");
  };

  const handleNavigate = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const navItems = useMemo(
    () => [
      {
        path: "/admin",
        label: "الطلبات المعلقة",
        icon: Clock,
        badge: pendingCount > 0 ? pendingCount : null,
      },
      {
        path: "/admin/roster",
        label: "إدارة الروستر",
        icon: Calendar,
      },
      {
        path: "/admin/employees",
        label: "إدارة الموظفين",
        icon: Users,
      },
      {
        path: "/admin/employee-messages",
        label: "رسائل الموظفين",
        icon: Mail,
      },
      {
        path: "/admin/balances",
        label: "إدارة الأرصدة",
        icon: Wallet,
      },
      {
        path: "/admin/history",
        label: "أرشيف الإجازات",
        icon: Archive,
      },
      {
        path: "/admin/logs",
        label: "سجلات النظام",
        icon: Activity,
      },
      {
        path: "/admin/profile",
        label: "حسابي",
        icon: User,
      },
    ],
    [pendingCount],
  );

  const isActivePath = (path) => location.pathname === path;

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-gray-50 font-sans print:block print:h-auto print:overflow-visible"
      dir="rtl"
    >
      <style>{`
        .admin-sidebar-scrollbar::-webkit-scrollbar {
          width: 0px;
          height: 0px;
        }
        .admin-sidebar-scrollbar {
          scrollbar-width: none;
        }
      `}</style>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 transition-opacity md:hidden print:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-[260px] shrink-0 transform flex-col bg-[#0f172a] text-white shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 print:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="relative border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/15 ring-1 ring-white/10">
              <Shield className="text-yellow-400" size={22} />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-[17px] font-black text-white">
                لوحة الإدارة
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                السيطرة المركزية
              </p>
            </div>
          </div>

          <button
            className="absolute left-4 top-4 text-gray-400 transition hover:text-white md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="admin-sidebar-scrollbar flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                      : "text-slate-300 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                        isActive
                          ? "bg-white/12 text-white"
                          : "bg-white/[0.04] text-slate-300 group-hover:bg-white/[0.08] group-hover:text-white"
                      }`}
                    >
                      <Icon size={16} />
                    </div>

                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge ? (
                    <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-red-500/15 hover:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] transition group-hover:bg-red-500/20">
              <LogOut size={16} />
            </div>
            <span>خروج من الإدارة</span>
          </button>
        </div>
      </aside>

      <main className="relative flex h-full min-w-0 flex-1 flex-col print:block print:h-auto print:overflow-visible">
        {/* Mobile Header */}
        <header className="z-10 flex shrink-0 items-center justify-between bg-[#0f172a] px-4 py-3 text-white shadow-md md:hidden print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-300 transition hover:text-white focus:outline-none"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-base font-bold">لوحة الإدارة</h1>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
            <Shield className="text-yellow-400" size={18} />
          </div>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto print:block print:h-auto print:overflow-visible">
          <div className="flex-1 p-4 md:p-8 print:p-0">{children}</div>

          <footer className="w-full shrink-0 border-t border-gray-200 px-4 py-4 text-left text-xs text-gray-500 print:hidden md:px-8">
            Developed by{" "}
            <span className="font-bold text-gray-700">Mahmoud Shahin</span>{" "}
            &copy; 2026
          </footer>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
