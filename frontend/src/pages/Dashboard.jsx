import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Send, Clock, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import EmployeeLayout from './components/EmployeeLayout'; // استيراد الـ Layout

const Dashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  
  // حالة النافذة المنبثقة للإلغاء
  const [cancelModal, setCancelModal] = useState({ isOpen: false, requestId: null });
  
  // حالات نموذج التقديم
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('employeeData');
    if (savedData) {
      const parsedEmployee = JSON.parse(savedData);
      setEmployee(parsedEmployee);
      
      // 1. جلب البيانات أول مرة
      fetchMyRequests(parsedEmployee.employeeCode);

      // 2. تحديث الطلبات أوتوماتيكياً كل 15 ثانية
      const interval = setInterval(() => {
        fetchMyRequests(parsedEmployee.employeeCode);
      }, 15000);

      // 3. التنظيف عند الخروج
      return () => clearInterval(interval);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchMyRequests = async (code) => {
    try {
      const response = await fetch(`/api/leaves/my-requests/${code}`);
      const data = await response.json();
      if (response.ok) setMyRequests(data);
    } catch (err) {
      console.error("خطأ في جلب الطلبات");
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/leaves/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: employee.employeeCode,
          leaveType, startDate, endDate, reason
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success('تم إرسال الطلب بنجاح!');
        setStartDate(''); setEndDate(''); setReason('');
        fetchMyRequests(employee.employeeCode); // تحديث الجدول فوراً
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالسيرفر.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // دالة تأكيد الإلغاء (اللي بتشتغل لما الموظف يدوس "نعم" في النافذة)
  const confirmCancelRequest = async () => {
    try {
      const response = await fetch(`/api/leaves/cancel-request/${cancelModal.requestId}`, {
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
      // في كل الحالات (نجاح أو فشل) نقفل النافذة ونفضي الـ ID
      setCancelModal({ isOpen: false, requestId: null });
    }
  };

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

  if (!employee) return <div className="min-h-screen flex items-center justify-center font-bold text-blue-600">جاري التحميل...</div>;

  return (
    <EmployeeLayout>
      <div className="p-8">
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">لوحة التحكم</h2>
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-600">أهلاً، {employee.name}</span>
            <div className="bg-navy-light/10 p-2 rounded-full text-navy-light"><User size={20} /></div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-navy-light">
            <p className="text-gray-500 text-sm mb-1">اعتيادي</p>
            <h3 className="text-3xl font-bold">{employee.leaveBalances?.annual || 0} يوم</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-yellow-400">
            <p className="text-gray-500 text-sm mb-1">عارضة</p>
            <h3 className="text-3xl font-bold">{employee.leaveBalances?.casual || 0} يوم</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-r-4 border-green-500">
            <p className="text-gray-500 text-sm mb-1">بدل</p>
            <h3 className="text-3xl font-bold">{employee.leaveBalances?.compensation || 0} يوم</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Send size={20} className="text-navy-light"/> تقديم طلب جديد</h3>
          <form onSubmit={handleLeaveSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="p-3 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-navy-light/50" value={leaveType} onChange={(e)=>setLeaveType(e.target.value)}>
              <option value="annual">اعتيادي</option>
              <option value="casual">عارضة</option>
              <option value="compensation">بدل راحة</option>
            </select>
            <input type="date" className="p-3 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-navy-light/50" value={startDate} onChange={(e)=>setStartDate(e.target.value)} required />
            <input type="date" className="p-3 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-navy-light/50" value={endDate} onChange={(e)=>setEndDate(e.target.value)} required />
            <button disabled={isSubmitting} className="bg-navy-light text-white rounded-lg font-bold hover:bg-navy-dark transition">
              {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-bold text-gray-800">آخر طلبات الإجازة</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="p-4">النوع</th>
                  <th className="p-4">من</th>
                  <th className="p-4">إلى</th>
                  <th className="p-4 text-center">المدة</th>
                  <th className="p-4 text-center">تاريخ التقديم</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center no-print">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myRequests.length > 0 ? myRequests.slice(0, 10).map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium">{req.leaveType === 'annual' ? 'اعتيادي' : req.leaveType === 'casual' ? 'عارضة' : 'بدل راحة'}</td>
                    <td className="p-4 text-sm text-gray-600">{new Date(req.startDate).toLocaleDateString('ar-EG')}</td>
                    <td className="p-4 text-sm text-gray-600">{new Date(req.endDate).toLocaleDateString('ar-EG')}</td>
                    <td className="p-4 text-sm font-bold text-navy-light text-center">{req.duration} يوم</td>
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
                )) : (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">لا يوجد طلبات سابقة حتى الآن</td>
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

export default Dashboard;