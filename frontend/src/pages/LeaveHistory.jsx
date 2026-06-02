import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Archive, CheckCircle, XCircle, Clock, Filter, CalendarDays, Calendar } from 'lucide-react';
import AdminLayout from './components/AdminLayout';

const API_URL = import.meta.env.VITE_API_URL || '';


const LeaveHistory = () => {
  const [allLeaves, setAllLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // حالات الفلاتر الثلاثة
  const [selectedEmp, setSelectedEmp] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const archiveRes = await fetch(`${API_URL}/api/admin/leave-archive`);
        const archiveData = await archiveRes.json();
        
        const empRes = await fetch(`${API_URL}/api/admin/employees`);
        const empData = await empRes.json();

        if (archiveRes.ok && empRes.ok) {
          setAllLeaves(archiveData);
          setEmployees(empData.sort((a, b) => Number(a.employeeCode) - Number(b.employeeCode)));
        }
      } catch (err) {
        toast.error('حدث خطأ في جلب أرشيف الإجازات');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // استخراج السنوات المتاحة في الأرشيف ديناميكياً
  const availableYears = useMemo(() => {
    const years = allLeaves.map(leave => new Date(leave.startDate).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a); // ترتيب تنازلي (الأحدث فوق)
  }, [allLeaves]);

  // محرك الفلترة الذكي: بيطبق الـ 3 شروط مع بعض
  const filteredLeaves = useMemo(() => {
    return allLeaves.filter(leave => {
      if (!leave.startDate) return false;
      const leaveDate = new Date(leave.startDate);
      
      const matchEmp = selectedEmp === 'all' || leave.employeeId?.employeeCode === selectedEmp;
      const matchYear = selectedYear === 'all' || leaveDate.getFullYear().toString() === selectedYear;
      const matchMonth = selectedMonth === 'all' || (leaveDate.getMonth() + 1).toString() === selectedMonth;

      return matchEmp && matchYear && matchMonth;
    });
  }, [allLeaves, selectedEmp, selectedYear, selectedMonth]);

  const translateType = (type) => {
    const types = { annual: 'اعتيادي', casual: 'عارضة', compensation: 'بدل راحة' };
    return types[type] || type;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="flex items-center justify-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle size={14}/> تمت الموافقة</span>;
      case 'rejected': return <span className="flex items-center justify-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold"><XCircle size={14}/> مرفوض</span>;
      default: return <span className="flex items-center justify-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold"><Clock size={14}/> قيد الانتظار</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  return (
    <AdminLayout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <header className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">أرشيف إجازات الموظفين</h2>
            <p className="text-gray-500 text-sm mt-1">كشف حساب شامل لجميع الطلبات مع إمكانية الفلترة المتقدمة</p>
          </div>
          
          {/* لوحة الفلاتر */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-200 w-full xl:w-auto">
            
            {/* فلتر الموظف */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm flex-1 min-w-[200px]">
              <Filter size={16} className="text-gray-400" />
              <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="bg-transparent border-none text-gray-700 text-sm font-bold focus:ring-0 outline-none w-full cursor-pointer">
                <option value="all">كل الموظفين</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp.employeeCode}>{emp.employeeCode} - {emp.name}</option>
                ))}
              </select>
            </div>

            {/* فلتر السنة */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm flex-1 min-w-[120px]">
              <Calendar size={16} className="text-gray-400" />
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent border-none text-gray-700 text-sm font-bold focus:ring-0 outline-none w-full cursor-pointer">
                <option value="all">كل السنوات</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* فلتر الشهر */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm flex-1 min-w-[120px]">
              <CalendarDays size={16} className="text-gray-400" />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-gray-700 text-sm font-bold focus:ring-0 outline-none w-full cursor-pointer">
                <option value="all">كل الشهور</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>شهر {i+1}</option>
                ))}
              </select>
            </div>

          </div>
        </header>

        {/* شريط الإحصائيات السريعة للنتائج */}
        <div className="mb-4 text-sm font-bold text-gray-600 flex items-center gap-2">
          إجمالي النتائج المعروضة: <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{filteredLeaves.length} طلب إجازة</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b">
              <tr>
                <th className="p-4">الموظف</th>
                <th className="p-4">نوع الإجازة</th>
                <th className="p-4 text-center">المدة</th>
                <th className="p-4 text-center">التاريخ (من - إلى)</th>
                <th className="p-4 text-center">حالة الطلب</th>
                <th className="p-4">تاريخ التقديم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">جاري تحميل الأرشيف...</td></tr>
              ) : filteredLeaves.length > 0 ? (
                filteredLeaves.map(leave => (
                  <tr key={leave._id} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      {leave.employeeId ? (
                        <>
                          <div className="font-bold text-gray-800">{leave.employeeId.name}</div>
                          <div className="text-xs text-gray-400">كود: {leave.employeeId.employeeCode}</div>
                        </>
                      ) : (
                        <span className="text-red-400 text-sm">موظف محذوف</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-600">{translateType(leave.leaveType)}</td>
                    <td className="p-4 text-center font-bold text-blue-600">{leave.duration} أيام</td>
                    <td className="p-4 text-center text-sm text-gray-500">
                      {formatDate(leave.startDate)} <br/> إلى <br/> {formatDate(leave.endDate)}
                    </td>
                    <td className="p-4 text-center">{getStatusBadge(leave.status)}</td>
                    <td className="p-4 text-sm text-gray-400 flex items-center gap-1 mt-3">
                      <Clock size={14}/> {formatDate(leave.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-gray-400">
                    <Archive size={40} className="mx-auto mb-3 text-gray-300" />
                    لا توجد نتائج تتطابق مع الفلاتر المحددة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LeaveHistory;