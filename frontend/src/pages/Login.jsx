import React, { useState } from 'react';
import toast from 'react-hot-toast'; // استدعاء مكتبة الإشعارات
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

const Login = () => {
  const navigate = useNavigate();  
  const [employeeCode, setEmployeeCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // لعرض رسائل الخطأ من السيرفر
  const [loading, setLoading] = useState(false); // لعمل تأثير تحميل أثناء الاتصال
  const [rememberMe, setRememberMe] = useState(false); // حالة تذكرني

  const handleForgotPassword = (e) => {
    e.preventDefault();
    toast('برجاء التواصل مع مدير النظام لإعادة ضبط وتصفير حسابك.', {
  icon: '🔒',
  style: { background: '#1e3a8a', color: '#fff' }
});
  };  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeCode, password }),
      });

      const data = await response.json();

      if (rememberMe) {
        localStorage.setItem('savedEmployeeCode', employeeCode);
        } else {
         localStorage.removeItem('savedEmployeeCode');
        }

      if (!response.ok) {
        // لو السيرفر رفض الدخول (باسوورد غلط أو غير مفعل)
        setError(data.message);
      } else {
        // حفظ بيانات الموظف في ذاكرة المتصفح
        localStorage.setItem('employeeData', JSON.stringify(data.user));
        // لو الدخول نجح
        toast.success(`تم تسجيل الدخول بنجاح! أهلاً بك يا ${data.user.name}`);
        // تأخير بسيط ثانية واحدة عشان الموظف يلحق يقرأ الترحيب قبل ما يتنقل
        setTimeout(() => {
          // التوجيه الذكي بناءً على الصلاحية
          if (data.user.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      }
      
    } catch (err) {
      setError('حدث خطأ في الاتصال بالسيرفر. تأكد أن السيرفر يعمل.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        
       {/* اللوحة اليمنى (الترحيبية) */}
<div className="w-full md:w-2/5 bg-navy-light text-white p-8 md:p-10 text-center relative overflow-hidden flex flex-col">
  
  {/* الدوائر الجمالية في الخلفية */}
  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full -ml-10 -mb-10"></div>
  
  {/* حاوية داخلية بترتب العناصر بذكاء من غير تداخل */}
  <div className="relative z-10 flex flex-col h-full w-full">
    
    {/* اللوجو: واخد مكانه فوق باحترام من غير ما يزنق الكلام */}
    <div className="w-full flex justify-center mb-6 md:mb-4 pt-2">
      <img 
        src="/logo.png" 
        alt="لوجو الإدارة" 
        className="w-40 md:w-52 h-auto object-contain drop-shadow-xl"
      />
    </div>

    {/* الكلام والزرار: متسنتر في الموبايل، وبمسافة محكومة وشيك جداً في اللاب توب */}
    <div className="flex-1 flex flex-col items-center justify-center md:justify-start md:mt-6">
      <h3 className="text-3xl md:text-4xl font-bold mb-4">مرحباً بك</h3>
      <p className="text-lg md:text-xl font-bold mb-8">
        نظام إجازات السيطرة المركزية .. 
      </p>
      <button 
        onClick={() => navigate('/register')} 
        className="border-2 border-white text-white px-8 py-2 rounded-full font-semibold hover:bg-white hover:text-navy-light transition duration-300 shadow-lg"
      >
        تفعيل حساب جديد
      </button>
    </div>

  </div>
</div>

        {/* اللوحة اليسرى (نموذج الدخول) */}
        <div className="w-full md:w-3/5 p-10 flex flex-col justify-center items-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">تسجيل الدخول</h2>
          
          <form onSubmit={handleLogin} className="w-full max-w-sm">
            
            {/* رسالة الخطأ تظهر هنا لو موجودة */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="mb-6">
              <input 
                type="text" 
                placeholder="كود الموظف" 
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-navy-light focus:bg-white focus:ring-2 focus:ring-navy-light/20 transition"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <input 
                type="password" 
                placeholder="كلمة المرور" 
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:border-navy-light focus:bg-white focus:ring-2 focus:ring-navy-light/20 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex justify-between items-center mb-8 text-sm text-gray-500">
              <label className="flex items-center cursor-pointer hover:text-navy-light transition">
                <input type="checkbox" className="ml-2 accent-navy-light w-4 h-4" checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}/>
                <span>تذكرني</span>
              </label>
              <a href="#" onClick={handleForgotPassword} className="hover:text-navy-light transition font-medium">نسيت كلمة المرور؟</a>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className={`w-full bg-navy-light text-white py-3 rounded-lg font-bold transition duration-300 shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-navy-dark'}`}
                >
               دخول
            </button>
          </form>
        </div>

      </div>
      <div className="absolute bottom-4 left-4 text-xs text-gray-400" dir="ltr">
        Developed by <span className="font-bold text-gray-500">Mahmoud Shahin</span> &copy; 2026
      </div>
    </div>
  );
};

export default Login;