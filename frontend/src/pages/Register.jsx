import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, UserCheck, ArrowRight } from 'lucide-react'; // تم تغيير KeyRound إلى Key
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivation = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://opsvacationsystem.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeCode, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message);
      } else {
        toast.success(data.message);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      toast.error('حدث خطأ في الاتصال بالسيرفر.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
        
        <button 
          onClick={() => navigate('/')} 
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-navy-light mb-6 transition"
        >
          <ArrowRight size={16} /> العودة لصفحة الدخول
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-navy-light rounded-full flex items-center justify-center mx-auto mb-3">
            <UserCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">تفعيل حساب جديد</h2>
          <p className="text-gray-500 text-sm mt-1">خاص بالموظفين المسجلين مسبقاً في النظام</p>
        </div>

        <form onSubmit={handleActivation} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">كود الموظف</label>
            <input 
              type="text" 
              placeholder="اكتب كودك المسجل بالإدارة" 
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:bg-white focus:ring-2 focus:ring-navy-light/20 transition"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">تعيين كلمة المرور</label>
            <input 
              type="password" 
              placeholder="أدخل كلمة مرور قوية" 
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:bg-white focus:ring-2 focus:ring-navy-light/20 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">تأكيد كلمة المرور</label>
            <input 
              type="password" 
              placeholder="أعد كتابة كلمة المرور" 
              className="w-full px-4 py-3 rounded-lg bg-gray-50 border outline-none focus:border-navy-light focus:bg-white focus:ring-2 focus:ring-navy-light/20 transition"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full bg-navy-light text-white py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-navy-dark'
            }`}
          >
            <Key size={18} />
            {loading ? 'جاري التفعيل...' : 'تفعيل الحساب والاشتراك'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Register;