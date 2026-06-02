import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, ShieldAlert, Shield, User, Trash2, Edit2, RotateCcw, Check, X, AlertTriangle } from 'lucide-react';
import AdminLayout from './components/AdminLayout';

const API_URL = import.meta.env.VITE_API_URL || '';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newEmp, setNewEmp] = useState({ 
    employeeCode: '', name: '', jobGrade: 'درجة ثالثة', workType: 'شيفت', role: 'employee' 
  });

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', jobGrade: '', workType: '', role: '' });

  const GOLDEN_ADMIN_CODE = 'admin'; // 👑 كود الأدمن الذهبي الثابت بنظامك الجديد

  // 1. دالة الجلب المزدوجة من الجدولين الفصليين
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // جلب الموظفين العاديين
      const resStaff = await fetch(`${API_URL}/api/admin/employees`);
      const staffData = await resStaff.json();

      // جلب المديرين من الجدول الجديد
      const resAdmins = await fetch(`${API_URL}/api/admin/admins-list`);
      const adminsData = await resAdmins.json();

      // تحويل وتجهيز بيانات المديرين لتتوافق مع أعمدة العرض في الجدول
      const formattedAdmins = adminsData.map(admin => ({
        ...admin,
        employeeCode: admin.username, // تحويل اسم المستخدم لكود للعرض الموحد
        jobGrade: '—', 
        workType: '—'
      }));

      // دمج وترتيب تصاعدي ذكي
      const allData = [...staffData, ...formattedAdmins];
      const sortedData = allData.sort((a, b) => 
        String(a.employeeCode).localeCompare(String(b.employeeCode), undefined, { numeric: true })
      );
      setEmployees(sortedData);
    } catch (err) { 
      toast.error("حدث خطأ في جلب بيانات الإدارة", { style: { background: '#ef4444', color: '#fff' }}); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  // 2. إضافة فرد (موظف في جدول أو أدمن في جدول)
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const isAdmin = newEmp.role === 'admin';
      const url = `${API_URL}${isAdmin ? '/api/admin/create-admin' : '/api/admin/add-employee'}`;
      
      // جهز الداتا حسب الـ Collection المستهدفة
      const bodyData = isAdmin 
        ? { username: newEmp.employeeCode.trim(), name: newEmp.name, password: '123456' } // باسوورد افتراضي للأدمن
        : newEmp;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success(isAdmin ? 'تم إضافة مدير النظام بنجاح! (الباسوورد الافتراضي: 123456)' : 'تمت إضافة الموظف بنجاح!', { 
          style: { background: '#10b981', color: '#fff' },
          duration: 5000
        });
        fetchEmployees();
        setNewEmp({ employeeCode: '', name: '', jobGrade: 'درجة ثالثة', workType: 'شيفت', role: 'employee' });
      } else {
        toast.error(data.message || 'حدث خطأ أثناء الإضافة', { style: { background: '#ef4444', color: '#fff' }});
      }
    } catch (err) {
      toast.error('تعذر الاتصال بالسيرفر', { style: { background: '#ef4444', color: '#fff' }});
    }
  };

  // 3. بدء وضع التعديل
  const handleEditClick = (emp) => {
    setEditingId(emp._id);
    setEditFormData({ name: emp.name, jobGrade: emp.jobGrade, workType: emp.workType, role: emp.role });
  };

  // 4. حفظ التعديلات الذكية (حسب الجدول المستهدف)
  const handleEditSave = async (id) => {
    try {
      const target = employees.find(e => e._id === id);
      const isAdmin = target?.role === 'admin';
      const url = isAdmin ? `/api/admin/update-admin/${id}` : `/api/admin/update-employee/${id}`;
      
      const bodyData = isAdmin 
        ? { username: target.employeeCode, name: editFormData.name }
        : editFormData;

      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message, { style: { background: '#10b981', color: '#fff' }});
        setEditingId(null);
        fetchEmployees();
      } else {
        toast.error(data.message, { style: { background: '#ef4444', color: '#fff' }});
      }
    } catch (err) {
      toast.error('خطأ أثناء حفظ التعديلات', { style: { background: '#ef4444', color: '#fff' }});
    }
  };

  // 5. دالة تأكيد الحذف الديناميكية
  const handleDeleteConfirm = (id, empName, role) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-2 text-red-600 font-bold border-b border-red-100 pb-2">
          <AlertTriangle size={20} />
          <span>تحذير حذف نهائي!</span>
        </div>
        <p className="text-sm text-gray-700">
          هل أنت متأكد من حذف حساب (<span className="font-bold text-red-600">{empName}</span>) نهائياً من السيستم؟
        </p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const url = role === 'admin' ? `/api/admin/delete-admin/${id}` : `/api/admin/delete-employee/${id}`;
                const res = await fetch(url, { method: 'DELETE' });
                const data = await res.json();
                if (res.ok) {
                  toast.success(data.message, { style: { background: '#10b981', color: '#fff' }});
                  fetchEmployees();
                } else toast.error(data.message, { style: { background: '#ef4444', color: '#fff' }});
              } catch (err) { toast.error('خطأ أثناء عملية الحذف', { style: { background: '#ef4444', color: '#fff' }}); }
            }}
            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition"
          >
            نعم، احذف
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition">
            إلغاء
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { border: '1px solid #ef4444', padding: '12px', minWidth: '320px' } });
  };

  // 6. دالة تأكيد تصفير الباسوورد الديناميكية
  const handleResetConfirm = (code, empName) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-center gap-2 text-yellow-600 font-bold border-b border-yellow-100 pb-2">
          <RotateCcw size={20} />
          <span>تأكيد تصفير الحساب</span>
        </div>
        <p className="text-sm text-gray-700">
          هل تريد إعادة تعيين كلمة المرور لحساب (<span className="font-bold text-navy-light">{empName}</span>)؟
        </p>
        <div className="flex gap-2 mt-2">
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch(`${API_URL}/api/admin/reset-password`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ employeeCode: code })
                });
                const data = await res.json();
                if (res.ok) {
                  toast.success(data.message, { duration: 5000, style: { background: '#1e3a8a', color: '#fff' }});
                } else toast.error(data.message, { style: { background: '#ef4444', color: '#fff' }});
              } catch (err) { toast.error('خطأ أثناء تصفير الحساب', { style: { background: '#ef4444', color: '#fff' }}); }
            }}
            className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-yellow-600 transition shadow-sm"
          >
            نعم، قم بالتصفير
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition">
            إلغاء
          </button>
        </div>
      </div>
    ), { duration: Infinity, style: { border: '1px solid #eab308', padding: '12px', minWidth: '320px' } });
  };

  const translateRole = (role) => {
    switch (role) {
      case 'admin': return <span className="flex items-center justify-center gap-1 text-red-600 font-bold bg-red-50 py-1 px-2 rounded-lg text-xs"><ShieldAlert size={14}/> مدير نظام</span>;
      case 'manager': return <span className="flex items-center justify-center gap-1 text-yellow-600 font-bold bg-yellow-50 py-1 px-2 rounded-lg text-xs"><Shield size={14}/> مدير</span>;
      default: return <span className="flex items-center justify-center gap-1 text-gray-600 bg-gray-100 py-1 px-2 rounded-lg text-xs"><User size={14}/> موظف</span>;
    }
  };

  // فرز وعزل القوائم بناءً على الجلب المزدوج الجديد مع فلترة الأمان للأدمن الذهبي
  const loggedInUser = JSON.parse(localStorage.getItem('employeeData') || '{}');
  const adminsList = employees.filter(emp => {
    if (emp.role !== 'admin') return false;
    if (emp.employeeCode === GOLDEN_ADMIN_CODE) {
      return loggedInUser.employeeCode === GOLDEN_ADMIN_CODE;
    }
    return true;
  });
  const staffList = employees.filter(emp => emp.role !== 'admin');

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
  <header className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6 md:mb-8 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
    
    {/* العنوان والوصف */}
    <div>
      <h2 className="text-xl md:text-2xl font-bold text-gray-800">بيان الإدارة والتحكم</h2>
      <p className="text-gray-500 text-sm mt-1">إضافة، تعديل، حذف، وتصفير حسابات الموظفين والمديرين</p>
    </div>

    {/* بادج إجمالي القوة البشرية */}
    <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm w-fit">
      إجمالي القوة البشرية: {staffList.length} فرد
    </div>

  </header>
        
        {/* فورمة الإضافة الذكية */}
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <input 
            placeholder={newEmp.role === 'admin' ? "اسم المستخدم (Username)" : "كود الموظف"} 
            value={newEmp.employeeCode} 
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            onChange={(e) => setNewEmp({...newEmp, employeeCode: e.target.value})} 
            required 
          />
          <input 
            placeholder={newEmp.role === 'admin' ? "اسم المدير الرباعي" : "الاسم الرباعي"} 
            value={newEmp.name} 
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            onChange={(e) => setNewEmp({...newEmp, name: e.target.value})} 
            required 
          />
          <select 
            value={newEmp.role} 
            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700" 
            onChange={(e) => setNewEmp({...newEmp, role: e.target.value, jobGrade: e.target.value === 'admin' ? '' : 'درجة ثالثة', workType: e.target.value === 'admin' ? '' : 'شيفت'})}
          >
            <option value="employee">صفة: موظف</option>
            <option value="manager">صفة: مدير</option>
            <option value="admin">صفة: مدير نظام (Admin)</option>
          </select>

          {newEmp.role !== 'admin' ? (
            <>
              <select value={newEmp.jobGrade} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setNewEmp({...newEmp, jobGrade: e.target.value})}>
                <option value="درجة ثالثة">درجة ثالثة</option>
                <option value="درجة ثانية">درجة ثانية</option>
                <option value="درجة اولى">درجة أولى</option>
                <option value="كبير">كبير</option>
              </select>
              <select value={newEmp.workType} className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" onChange={(e) => setNewEmp({...newEmp, workType: e.target.value})}>
                <option value="شيفت">نظام شيفت</option>
                <option value="أبحاث">نظام أبحاث</option>
              </select>
            </>
          ) : (
            <div className="hidden md:block md:col-span-2"></div>
          )}

          <button type="submit" className="col-span-full bg-gray-900 text-white p-3 rounded-lg font-bold hover:bg-gray-800 flex items-center justify-center gap-2 transition shadow-sm">
            <UserPlus size={20} /> {newEmp.role === 'admin' ? 'إضافة مدير نظام جديد' : 'إضافة فرد جديد للبيان'}
          </button>
        </form>

        <div className="space-y-8">
          {/* 👑 جدول المديرين (Admins Collection) */}
          <div className="bg-white rounded-xl shadow-sm border border-yellow-200 overflow-hidden">
            <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-200 flex items-center gap-2">
              <ShieldAlert className="text-yellow-600" size={20} />
              <h3 className="font-bold text-yellow-800">صلاحيات الإدارة العليا (Admins)</h3>
            </div>
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-sm border-b">
                <tr>
                  <th className="p-4">اسم المستخدم</th>
                  <th className="p-4">الاسم بالكامل</th>
                  <th className="p-4 text-center">الصلاحية بالنظام</th>
                  <th className="p-4 text-center">إجراءات التحكم الإداري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="4" className="p-8 text-center text-gray-400">جاري تحميل البيانات...</td></tr>
                ) : adminsList.map(emp => (
                  <tr key={emp._id} className={emp.employeeCode === GOLDEN_ADMIN_CODE ? "bg-yellow-50/40" : "hover:bg-gray-50 transition"}>
                    <td className="p-4 text-gray-600 font-bold">{emp.employeeCode}</td>
                    <td className="p-4">
                      {editingId === emp._id ? (
                        <input type="text" value={editFormData.name} className="p-1.5 border rounded w-full" onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                      ) : (
                        <span className="font-bold text-gray-800">{emp.name}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">{translateRole(emp.role)}</td>
                    <td className="p-4 text-center">
                      {emp.employeeCode === GOLDEN_ADMIN_CODE ? (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-yellow-200">
                          👑 أدمن ذهبي محمي
                        </span>
                      ) : editingId === emp._id ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEditSave(emp._id)} className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition"><Check size={14}/> حفظ</button>
                          <button onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-gray-300 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-bold hover:bg-gray-400 transition"><X size={14}/> إلغاء</button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleEditClick(emp)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="تعديل البيانات"><Edit2 size={15} /></button>
                          <button onClick={() => handleResetConfirm(emp.employeeCode, emp.name)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition" title="تصفير كلمة المرور"><RotateCcw size={15} /></button>
                          <button onClick={() => handleDeleteConfirm(emp._id, emp.name, emp.role)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="حذف حساب الإدارة نهائياً"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 👥 جدول الموظفين (Users Collection) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-navy-light/5 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <User className="text-navy-light" size={20} />
              <h3 className="font-bold text-gray-800">بيان السادة افراد السيطرة المركزية </h3>
            </div>
            <table className="w-full text-right">
              <thead className="bg-gray-50 text-gray-500 text-sm border-b">
                <tr>
                  <th className="p-4">الكود</th>
                  <th className="p-4">الاسم بالكامل</th>
                  <th className="p-4 text-center">الدرجة</th>
                  <th className="p-4 text-center">نوع العمل</th>
                  <th className="p-4 text-center">الصفة بالنظام</th>
                  <th className="p-4 text-center">إجراءات التحكم الإداري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-gray-400">جاري تحميل البيانات...</td></tr>
                ) : staffList.map(emp => (
                  <tr key={emp._id} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-gray-500 font-medium">{emp.employeeCode}</td>
                    <td className="p-4">
                      {editingId === emp._id ? (
                        <input type="text" value={editFormData.name} className="p-1.5 border rounded w-full" onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                      ) : (
                        <span className="font-bold text-gray-800">{emp.name}</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-600 text-center">
                      {editingId === emp._id ? (
                        <select value={editFormData.jobGrade} className="p-1.5 border rounded" onChange={(e) => setEditFormData({...editFormData, jobGrade: e.target.value})}>
                          <option value="درجة ثالثة">درجة ثالثة</option>
                          <option value="درجة ثانية">درجة ثانية</option>
                          <option value="درجة اولى">درجة أولى</option>
                          <option value="كبير">كبير</option>
                        </select>
                      ) : emp.jobGrade}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === emp._id ? (
                        <select value={editFormData.workType} className="p-1.5 border rounded" onChange={(e) => setEditFormData({...editFormData, workType: e.target.value})}>
                          <option value="شيفت">شيفت</option>
                          <option value="أبحاث">أبحاث</option>
                        </select>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${emp.workType === 'شيفت' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{emp.workType}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === emp._id ? (
                        <select value={editFormData.role} className="p-1.5 border rounded" onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}>
                          <option value="employee">موظف</option>
                          <option value="manager">مدير</option>
                        </select>
                      ) : translateRole(emp.role)}
                    </td>
                    <td className="p-4 text-center">
                      {editingId === emp._id ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEditSave(emp._id)} className="flex items-center gap-1 bg-green-600 text-white px-2.5 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition"><Check size={14}/> حفظ</button>
                          <button onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-gray-300 text-gray-700 px-2.5 py-1.5 rounded-md text-xs font-bold hover:bg-gray-400 transition"><X size={14}/> إلغاء</button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1.5">
                          <button onClick={() => handleEditClick(emp)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="تعديل البيانات"><Edit2 size={15} /></button>
                          <button onClick={() => handleResetConfirm(emp.employeeCode, emp.name)} className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition" title="تصفير كلمة المرور"><RotateCcw size={15} /></button>
                          <button onClick={() => handleDeleteConfirm(emp._id, emp.name, emp.role)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition" title="حذف الموظف نهائياً"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmployeeManagement;