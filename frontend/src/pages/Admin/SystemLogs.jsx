import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, FileText, Search } from 'lucide-react';
import AdminLayout from '../components/AdminLayout'; // تأكد من مسار الـ Layout عندك
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || '';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        toast.error('حدث خطأ في جلب السجلات');
      }
    } catch (error) {
      toast.error('تعذر الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // فلترة السجلات بناءً على البحث
  const filteredLogs = logs.filter(log => 
    (log.action && log.action.includes(searchTerm)) || 
    (log.adminName && log.adminName.includes(searchTerm)) ||
    (log.details && log.details.includes(searchTerm))
  );

  // دالة لتنسيق التاريخ والوقت
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(dateString).toLocaleDateString('ar-EG', options);
  };

  return (
    <AdminLayout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <header className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="text-blue-600" />
              سجل نشاط النظام (Audit Logs)
            </h2>
            <p className="text-gray-500 text-sm mt-1">مراقبة وتتبع جميع الحركات والتعديلات التي تمت بواسطة الإدارة</p>
          </div>
          
          {/* مربع البحث */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="ابحث في السجلات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
            <Search className="absolute top-2.5 right-3 text-gray-400" size={18} />
          </div>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500 text-sm border-b">
              <tr>
                <th className="p-4 w-48">
                  <div className="flex items-center gap-1.5"><Clock size={16}/> التاريخ والوقت</div>
                </th>
                <th className="p-4 w-40">
                  <div className="flex items-center gap-1.5"><User size={16}/> المسئول</div>
                </th>
                <th className="p-4 w-48">
                  <div className="flex items-center gap-1.5"><Activity size={16}/> نوع العملية</div>
                </th>
                <th className="p-4">
                  <div className="flex items-center gap-1.5"><FileText size={16}/> التفاصيل</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-400 font-medium">
                    جاري تحميل سجلات النظام...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-400 font-medium">
                    لا توجد سجلات مطابقة للبحث أو النظام خالي.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log._id || index} className="hover:bg-gray-50 transition text-sm">
                    <td className="p-4 text-gray-500" dir="ltr" style={{ textAlign: 'right' }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="p-4 font-bold text-gray-700">
                      {log.adminName || log.adminId || 'نظام آلي'}
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-100">
                        {log.action || 'عملية إدارية'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {log.details || log.description || 'لا توجد تفاصيل إضافية'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SystemLogs;