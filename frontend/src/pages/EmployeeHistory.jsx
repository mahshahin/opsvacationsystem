import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle, XCircle, Clock, Filter, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import EmployeeLayout from './components/EmployeeLayout';

const API_URL = import.meta.env.VITE_API_URL || '';

const EmployeeHistory = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالة النافذة المنبثقة للإلغاء
  const [cancelModal, setCancelModal] = useState({ isOpen: false, requestId: null });

  // حالات الفلاتر
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const savedData = localStorage.getItem('employeeData');
    if (savedData) {
      const parsedEmployee = JSON.parse(savedData);
      setEmployee(parsedEmployee);
      fetchMyRequests(parsedEmployee.employeeCode);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchMyRequests = async (code) => {
    try {
      const response = await fetch(`${API_URL}/api/leaves/my-requests/${code}`);
      const data = await response.json();
      if (response.ok) {
        setAllRequests(data);
      }
    } catch (err) {
      toast.error("حدث خطأ في جلب سجل الإجازات");
    } finally {
      setLoading(false);
    }
  };

  // دالة تأكيد الإلغاء (اللي بتشتغل لما الموظف يدوس "نعم" في النافذة)
  const confirmCancelRequest = async () => {
    try {
      const response = await fetch(`${API_URL}/api/leaves/cancel-request/${cancelModal.requestId}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        fetchMyRequests(employee.employeeCode); // تحديث السجل فوراً
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      // قفل النافذة في كل الحالات
      setCancelModal({ isOpen: false, requestId: null });
    }
  };

  // استخراج السنوات المتاحة في السجل ديناميكياً
  const availableYears = useMemo(() => {
    const years = allRequests.map(req => new Date(req.startDate).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  }, [allRequests]);

  // محرك الفلترة الذكي
  const filteredRequests = useMemo(() => {
    return allRequests.filter(req => {
      if (!req.startDate) return false;
      const reqDate = new Date(req.startDate);
      
      const matchYear = selectedYear === 'all' || reqDate.getFullYear().toString() === selectedYear;
      const matchMonth = selectedMonth === 'all' || (reqDate.getMonth() + 1).toString() === selectedMonth;
      const matchStatus = selectedStatus === 'all' || req.status === selectedStatus;

      return matchYear && matchMonth && matchStatus;
    });
  }, [allRequests, selectedYear, selectedMonth, selectedStatus]);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return <span className="flex items-center justify-center gap-1 text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full"><Clock size={12}/> قيد الانتظار</span>;
      case 'approved': 
        return <span className="flex items-center justify-center gap-1 text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full"><CheckCircle size={12}/> مقبول</span>;
      case 'rejected': 
        return <span className="flex items-center justify-center gap-1 text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full"><XCircle size={12}/> مرفوض</span>;
      default: return status;
    }
  };

  if (!employee) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold">جاري التحميل...</div>;

  return (
    <EmployeeLayout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <header className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarDays className="text-blue-600" /> سجل الإجازات الشامل
            </h2>
            <p className="text-gray-500 text-sm mt-1">كشف حساب بجميع طلباتك السابقة وحالاتها</p>
          </div>
          
          {/* لوحة الفلاتر */}
          <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-200 w-full xl:w-auto">
            {/* فلتر السنة */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm flex-1 min-w-[120px]">
              <Calendar size={16} className="text-gray-400" />
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="bg-transparent border-none text-gray-700 text-sm font-bold outline-none w-full cursor-pointer">
                <option value="all">كل السنوات</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* فلتر الشهر */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm flex-1 min-w-[120px]">
              <CalendarDays size={16} className="text-gray-400" />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent border-none text-gray-700 text-sm font-bold outline-none w-full cursor-pointer">
                <option value="all">كل الشهور</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>شهر {i+1}</option>
                ))}
              </select>
            </div>

            {/* فلتر الحالة */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-gray-200 shadow-sm flex-1 min-w-[140px]">
              <Filter size={16} className="text-gray-400" />
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="bg-transparent border-none text-gray-700 text-sm font-bold outline-none w-full cursor-pointer">
                <option value="all">كل الحالات</option>
                <option value="approved">المقبولة فقط</option>
                <option value="rejected">المرفوضة فقط</option>
                <option value="pending">قيد الانتظار</option>
              </select>
            </div>
          </div>
        </header>

        {/* شريط الإحصائيات السريعة */}
        <div className="mb-4 text-sm font-bold text-gray-600 flex items-center gap-2">
          إجمالي الطلبات المعروضة: <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{filteredRequests.length} طلب</span>
        </div>

        {/* جدول السجل */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="p-4">نوع الإجازة</th>
                  <th className="p-4">التاريخ (من - إلى)</th>
                  <th className="p-4 text-center">المدة</th>
                  <th className="p-4 text-center">تاريخ التقديم</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-400">جاري تحميل السجل...</td></tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-bold text-gray-800">
                        {req.leaveType === 'annual' ? 'اعتيادي' : req.leaveType === 'casual' ? 'عارضة' : 'بدل راحة'}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {new Date(req.startDate).toLocaleDateString('ar-EG')} <br/> 
                        <span className="text-xs text-gray-400">إلى</span> {new Date(req.endDate).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-4 text-sm font-bold text-blue-600 text-center">{req.duration} يوم</td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-gray-700 font-medium">
                            {new Date(req.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                          <span className="text-xs text-gray-400 mt-1 flex items-center gap-1" dir="ltr">
                            <Clock size={12} />
                            {new Date(req.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">{getStatusBadge(req.status)}</td>
                      <td className="p-4 text-center">
                        {req.status === 'pending' ? (
                          <button 
                            onClick={() => setCancelModal({ isOpen: true, requestId: req._id })}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition"
                            title="إلغاء الطلب"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400">
                      <CalendarDays size={40} className="mx-auto mb-3 text-gray-300" />
                      لا توجد طلبات تتطابق مع الفلاتر المحددة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* === نافذة التأكيد المنبثقة (Modal) === */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">إلغاء طلب الإجازة</h3>
              <p className="text-gray-500 mb-8">هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={confirmCancelRequest}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition shadow-sm hover:shadow-md"
                >
                  نعم، إلغاء الطلب
                </button>
                <button 
                  onClick={() => setCancelModal({ isOpen: false, requestId: null })}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </EmployeeLayout>
  );
};

export default EmployeeHistory;