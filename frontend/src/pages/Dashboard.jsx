import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Send, Clock, CheckCircle, XCircle, Trash2, AlertTriangle, CalendarDays, ChevronDown, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import EmployeeLayout from './components/EmployeeLayout';
import CircularProgress from './components/CircularProgress';

const API_URL = import.meta.env.VITE_API_URL || '';

const Dashboard = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  
  // حالة الوقت المباشر
  const [currentTime, setCurrentTime] = useState(new Date());

  const [cancelModal, setCancelModal] = useState({ isOpen: false, requestId: null });
  const [isLeaveMenuOpen, setIsLeaveMenuOpen] = useState(false);
  
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedData = sessionStorage.getItem('employeeData') || localStorage.getItem('employeeData');
    if (savedData) {
      const parsedEmployee = JSON.parse(savedData);
      setEmployee(parsedEmployee);
      
      fetchMyRequests(parsedEmployee.employeeCode);

      const interval = setInterval(() => {
        fetchMyRequests(parsedEmployee.employeeCode);
      }, 15000);

      return () => clearInterval(interval);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const fetchMyRequests = async (code) => {
    try {
      const response = await fetch(`${API_URL}/api/leaves/my-requests/${code}`);
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
      const response = await fetch(`${API_URL}/api/leaves/request`, {
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
        fetchMyRequests(employee.employeeCode);
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالسيرفر.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        fetchMyRequests(employee.employeeCode);
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
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

  // حسبة الحد الأقصى للإجازة الاعتيادية بناءً على الدرجة الوظيفية
  const maxAnnual = (employee.jobGrade === 'كبير' || employee.jobGrade === 'درجة اولى') ? 30 : 21;

  return (
    <EmployeeLayout>
      <div className="p-4 md:p-8">
        
        {/* === الهيدر === */}
        <header className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-8 bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100">
          
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              لوحة التحكم
            </h2>
            <p className="text-sm text-gray-500 mt-1">نظرة عامة على رصيد إجازاتك وطلباتك</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-gray-100">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-inner shrink-0">
              <User size={24} />
            </div>
            
            <div className="flex flex-col">
              <span className="font-medium text-gray-700 text-lg">
                أهلاً، <span className="font-bold text-blue-600">{employee.name}</span>
              </span>
              
              <div className="flex items-center gap-3 text-xs md:text-sm text-gray-500 mt-1.5 font-medium">
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-gray-400" />
                  {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                
                <span className="flex items-center gap-1.5" dir="ltr">
                  <Clock size={14} className="text-gray-400" />
                  {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            </div>

          </div>
        </header>

        {/* 🌟 كروت الرصيد بالتصميم الدائري المودرن 🌟 */}
        <div className="grid grid-cols-3 gap-2 md:gap-6 mb-8">
          <CircularProgress 
            value={employee.leaveBalances?.annual || 0} 
            max={maxAnnual} 
            label="رصيد اعتيادي" 
            type="annual" 
          />
          <CircularProgress 
            value={employee.leaveBalances?.casual || 0} 
            max={7} 
            label="رصيد عارضة" 
            type="casual" 
          />
          <CircularProgress 
            value={employee.leaveBalances?.compensation || 0} 
            max={0} 
            label="بدل راحة" 
            type="compensation" 
          />
        </div>

        {/* كارت تقديم الطلب */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 mb-8 relative">
          
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-navy-light/5 rounded-full -ml-10 -mt-10"></div>
          </div>
          
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 relative z-10">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Send size={20} className="text-navy-light"/>
            </div>
            تقديم طلب جديد
          </h3>
          
          <form onSubmit={handleLeaveSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full items-start relative z-20">
            
            <div className="relative z-30 w-full">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <FileText size={18} />
              </div>
              
              <button
                type="button"
                onClick={() => setIsLeaveMenuOpen(!isLeaveMenuOpen)}
                className="w-full text-right pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-navy-light focus:ring-4 focus:ring-navy-light/10 transition-all text-gray-700 font-medium cursor-pointer"
              >
                {leaveType === 'annual' ? 'إجازة اعتيادية' : leaveType === 'casual' ? 'إجازة عارضة' : 'بدل راحة'}
              </button>

              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <ChevronDown size={18} className={`transition-transform duration-300 ${isLeaveMenuOpen ? 'rotate-180' : ''}`} />
              </div>

              {isLeaveMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsLeaveMenuOpen(false)}></div>
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden py-1">
                    {['annual', 'casual', 'compensation'].map((type) => (
                      <div
                        key={type}
                        onClick={() => {
                          setLeaveType(type);
                          setIsLeaveMenuOpen(false);
                        }}
                        className={`px-4 py-3 cursor-pointer transition-colors flex items-center gap-2 ${
                          leaveType === type ? 'bg-blue-50/60 text-navy-light font-bold' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${leaveType === type ? 'bg-navy-light' : 'bg-transparent'}`}></div>
                        {type === 'annual' ? 'إجازة اعتيادية' : type === 'casual' ? 'إجازة عارضة' : 'بدل راحة'}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative w-full bg-gray-50 border border-gray-200 rounded-xl focus-within:border-navy-light focus-within:ring-4 focus-within:ring-navy-light/10 transition-all group">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within:text-navy-light z-10">
                <CalendarDays size={18} />
              </div>
              {!startDate && (
                <div className="absolute inset-y-0 right-0 pr-10 flex items-center pointer-events-none text-gray-500 font-medium z-10">
                  تاريخ البداية
                </div>
              )}
              <input 
                type="date"
                className={`relative w-full pl-3 pr-10 py-3 bg-transparent outline-none cursor-pointer z-20 ${!startDate ? 'text-transparent' : 'text-gray-700'} [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-30`} 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)} 
                required 
              />
            </div>

            <div className="relative w-full bg-gray-50 border border-gray-200 rounded-xl focus-within:border-navy-light focus-within:ring-4 focus-within:ring-navy-light/10 transition-all group">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 group-focus-within:text-navy-light z-10">
                <CalendarDays size={18} />
              </div>
              {!endDate && (
                <div className="absolute inset-y-0 right-0 pr-10 flex items-center pointer-events-none text-gray-500 font-medium z-10">
                  تاريخ النهاية
                </div>
              )}
              <input 
                type="date"
                className={`relative w-full pl-3 pr-10 py-3 bg-transparent outline-none cursor-pointer z-20 ${!endDate ? 'text-transparent' : 'text-gray-700'} [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:z-30`} 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)} 
                required 
              />
            </div>

            <div className="w-full">
              <button disabled={isSubmitting} className="w-full h-full py-3 flex items-center justify-center gap-2 bg-navy-light text-white rounded-xl font-bold hover:bg-[#0f172a] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 z-10">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    جاري الإرسال...
                  </div>
                ) : (
                  <>
                    <Send size={18} /> إرسال الطلب
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* جدول آخر الطلبات */}
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