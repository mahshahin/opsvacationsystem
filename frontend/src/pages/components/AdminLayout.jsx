import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Clock, Users, LogOut, Wallet, Activity, Archive, User, Menu, X, Shield } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('https://opsvacationsystem.onrender.com/api/admin/pending-requests');
        if (response.ok) {
          const data = await response.json();
          setPendingCount(data.length);
        }
      } catch (err) {
        console.error('خطأ في تحديث الإشعارات:', err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(interval);
  }, []); 

  const handleLogout = () => {
    localStorage.removeItem('employeeData');
    navigate('/');
  };

  const currentYear = new Date().getFullYear();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    // 1. السر هنا: h-screen w-full overflow-hidden عشان نقفل الشاشة ونمنع السكرول الخارجي
    <div className="flex h-screen w-full bg-gray-50 font-sans overflow-hidden" dir="rtl">
      
      {/* --- طبقة الشفافية للموبايل --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* --- القائمة الجانبية (Sidebar): ضفنا shrink-0 عشان متتضغطش أبداً --- */}
      <aside 
        className={`fixed top-0 right-0 h-full w-64 bg-[#0f172a] text-white z-50 transform transition-transform duration-300 ease-in-out flex flex-col shadow-xl shrink-0 md:relative md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 relative border-b border-gray-800">
          <div className="flex flex-col items-center">
            <Shield className="text-yellow-500 mb-3" size={48} />
            <h2 className="text-xl font-bold">لوحة الإدارة</h2>
            <p className="text-sm text-gray-400 mt-1">السيطرة المركزية</p>
          </div>
          
          <button 
            className="md:hidden absolute top-4 left-4 text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={28} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <button 
            onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition ${location.pathname === '/admin' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            {/* الجزء اليمين: الأيقونة والاسم */}
            <div className="flex items-center gap-3">
              <Clock size={20} /> الطلبات المعلقة
            </div>

            {/* الجزء الشمال: بادج الإشعارات (بيظهر بس لو في طلبات) */}
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                {pendingCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => { navigate('/admin/employees'); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${location.pathname === '/admin/employees' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            <Users size={20} /> إدارة الموظفين
          </button>

          <button 
            onClick={() => { navigate('/admin/balances'); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${location.pathname === '/admin/balances' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            <Wallet size={20} /> إدارة الأرصدة
          </button>

          <button 
            onClick={() => { navigate('/admin/history'); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${location.pathname === '/admin/history' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            <Archive size={20} /> أرشيف الإجازات
          </button>

          <button 
            onClick={() => { navigate('/admin/logs'); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${location.pathname === '/admin/logs' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            <Activity size={20} /> سجلات النظام
          </button>

          <button 
            onClick={() => { navigate('/admin/profile'); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              location.pathname === '/admin/profile' ? 'bg-white/10 text-white' : 'text-blue-100 hover:bg-white/10'
            }`}
          >
            <User size={20} /> حسابي
          </button>
        </nav>

        {/* ضفنا shrink-0 هنا عشان الزرار ده ميتزنقش لو الشاشة صغيرة */}
        <div className="p-4 border-t border-gray-700 shrink-0">
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-500/80 rounded-lg text-gray-300 hover:text-white transition">
            <LogOut size={20} /> خروج من الإدارة
          </button>
        </div>
      </aside>

      {/* --- الجزء الرئيسي المتغير: h-full بدل h-screen --- */}
      <main className="flex-1 h-full flex flex-col min-w-0 relative">
        
        {/* هيدر الموبايل: ضفنا shrink-0 */}
        <header className="bg-[#0f172a] text-white p-4 shadow-md md:hidden flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              <Menu size={28} />
            </button>
            <h1 className="font-bold text-lg">لوحة الإدارة</h1>
          </div>
          <Shield className="text-yellow-500" size={24} />
        </header>

        {/* مساحة العمل (هنا بيبدأ السكرول الداخلي) */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* المحتوى */}
          <div className="flex-1 p-4 md:p-8">
            {children}
          </div>
          
          {/* الفوتر الاحترافي: ضفنا shrink-0 و px-4 md:px-8 */}
          <footer className="w-full text-left px-4 md:px-8 py-4 text-xs text-gray-500 border-t border-gray-200 shrink-0">
            Developed by <span className="font-bold text-gray-700">Mahmoud Shahin</span> &copy; 2026
          </footer>
        </div>
        
      </main>
    </div>
  );
};

export default AdminLayout;