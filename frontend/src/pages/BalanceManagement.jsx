import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Wallet, Edit3, X, Save } from 'lucide-react';
import AdminLayout from './components/AdminLayout';

const BalanceManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  // حالات النافذة المنبثقة (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [balances, setBalances] = useState({ annual: 0, casual: 0, compensation: 0 });

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/admin/employees');
      const data = await res.json();
      if (res.ok) {
        // ترتيب تصاعدي حسب الكود
        setEmployees(data.sort((a, b) => Number(a.employeeCode) - Number(b.employeeCode)));
      }
    } catch (err) { 
      toast.error("حدث خطأ في جلب البيانات"); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // فتح نافذة التعديل
  const openEditModal = (emp) => {
    setSelectedEmp(emp);
    setBalances({
      annual: emp.leaveBalances?.annual || 0,
      casual: emp.leaveBalances?.casual || 0,
      compensation: emp.leaveBalances?.compensation || 0
    });
    setIsModalOpen(true);
  };

  // حفظ التعديلات
  const handleSaveBalances = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/update-balances/${selectedEmp._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(balances)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setIsModalOpen(false);
        fetchEmployees(); // تحديث الجدول
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('خطأ أثناء حفظ الأرصدة');
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 bg-gray-50 min-h-screen relative">
        <header className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">إدارة خزينة الأرصدة</h2>
            <p className="text-gray-500 text-sm mt-1">متابعة وتعديل أرصدة الإجازات لدورة عام {currentYear}</p>
          </div>
          <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 font-bold">
            <Wallet size={24} /> أرصدة المنظومة
          </div>
        </header>

        {/* جدول الأرصدة */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b">
              <tr>
                <th className="p-4">الكود</th>
                <th className="p-4">الاسم</th>
                <th className="p-4 text-center">الاعتيادي</th>
                <th className="p-4 text-center">العارضة المتبقية</th>
                <th className="p-4 text-center">بدل الراحة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">جاري تحميل الأرصدة...</td></tr>
              ) : employees.map(emp => (
                <tr key={emp._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-gray-500 font-medium">{emp.employeeCode}</td>
                  <td className="p-4 font-bold text-gray-800">{emp.name}</td>
                  <td className="p-4 text-center font-bold text-blue-600">{emp.leaveBalances?.annual || 0}</td>
                  <td className="p-4 text-center font-bold text-orange-500">{emp.leaveBalances?.casual || 0}</td>
                  <td className="p-4 text-center font-bold text-green-600">{emp.leaveBalances?.compensation || 0}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => openEditModal(emp)} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition">
                      <Edit3 size={15} /> تعديل الأرصدة
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* النافذة المنبثقة (Modal) للتعديل */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between mb-6 border-b pb-3">
                <h3 className="text-xl font-bold text-gray-800">تعديل أرصدة: {selectedEmp?.name}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSaveBalances} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الرصيد الاعتيادي</label>
                  <input type="number" value={balances.annual} onChange={(e) => setBalances({...balances, annual: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الإجازة العارضة</label>
                  <input type="number" value={balances.casual} onChange={(e) => setBalances({...balances, casual: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">رصيد بدل الراحة</label>
                  <input type="number" value={balances.compensation} onChange={(e) => setBalances({...balances, compensation: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition">
                    <Save size={20} /> حفظ الأرصدة
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-lg font-bold hover:bg-gray-300 transition">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default BalanceManagement;