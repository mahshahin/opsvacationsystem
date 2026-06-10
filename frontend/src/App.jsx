import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './pages/components/ProtectedRoute';
import EmployeeFullRoster from "./pages/Employee/EmployeeFullRoster";

// استدعاءات عامة
const Login = React.lazy(() => import('./pages/Login/Login'));// استدعاء شاشة تسجيل الدخول
const Register = React.lazy(() => import("./pages/Login/Register"));// استدعاء شاشة التسجيل (لو عندك واحدة)

//استدعاءات الخاصة بالموظف
const Dashboard = React.lazy(() => import("./pages/Employee/Dashboard"));// استدعاء شاشة لوحة تحكم الموظف
const MyShifts = React.lazy(() => import("./pages/Employee/MyShifts")); // استدعاء شاشة ورديات الموظف 
const EmployeeHistory = React.lazy(() => import("./pages/Employee/EmployeeHistory"),);// استدعاء شاشة تاريخ الإجازات للموظف
const EmployeeReports = React.lazy(() => import("./pages/Employee/EmployeeReports"),);// استدعاء شاشة تقارير الموظف
const EmployeeProfile = React.lazy(() => import("./pages/Employee/EmployeeProfile"),);// استدعاء شاشة الملف الشخصي للموظف


// استدعاءات خاصة بالإدارة
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'));// استدعاء شاشة لوحة تحكم الإدارة
const EmployeeManagement = React.lazy(() => import('./pages/Admin/EmployeeManagement'));// استدعاء شاشة إدارة الموظفين 
const BalanceManagement = React.lazy(() => import('./pages/Admin/BalanceManagement'));// استدعاء شاشة إدارة أرصدة الإجازات
const LeaveHistory = React.lazy(() => import('./pages/Admin/LeaveHistory'));// استدعاء شاشة تاريخ الإجازات للإدارة
const AdminProfile = React.lazy(() => import('./pages/Admin/AdminProfile'));// استدعاء شاشة الملف الشخصي للإدارة
const SystemLogs = React.lazy(() => import('./pages/Admin/SystemLogs'));// استدعاء شاشة سجلات النظام
const RosterManagement = React.lazy(() => import('./pages/Admin/RosterManagement'));// استدعاء شاشة إدارة الجداول


function App() {
  return (
    <Router>
      <div>
        {/* التنبيهات بره الـ Suspense عشان تفضل شغالة ومتاحة دايماً */}
        <Toaster 
          position="top-center" 
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'inherit',
              fontSize: '15px',
              fontWeight: 'bold',
            },
          }} 
        />
        
        {/* تغليف المسارات بالـ Suspense لعرض شاشة تحميل أنيقة وقت التنقل */}
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600 font-medium text-lg">جاري التحميل...</span>
            </div>
          </div>
        }>
          <Routes>
            {/* === مسارات عامة (غير محمية) === */}
            <Route path="/" element={<Login />} />
            
            {/* مسار التسجيل */}
            <Route path="/register" element={<Register />} /> 

            {/* === مسارات الموظف (محمية) === */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* إضافة مسارات الموظف المحمية */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <EmployeeProfile />
              </ProtectedRoute>
            } />

            {/* مسارات الموظف المحمية الأخرى */}
            <Route path="/my-leaves" element={
              <ProtectedRoute>
                <EmployeeHistory />
              </ProtectedRoute>
            } />

            {/* مسارات الموظف المحمية الأخرى */}
            <Route path="/my-reports" element={
              <ProtectedRoute>
                <EmployeeReports />
              </ProtectedRoute>
            } />

            {/* مسارات الموظف المحمية الأخرى */}
            <Route path="/my-shifts" element={
              <ProtectedRoute>
                <MyShifts />
              </ProtectedRoute>
            } />  

            {/* مسارات الموظف المحمية الأخرى */}
            <Route path="/Employee/full-roster" element={
              <ProtectedRoute>
                <EmployeeFullRoster />
              </ProtectedRoute>
            } />

            {/* === مسارات الإدارة (محمية وصلاحية أدمن فقط) === */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* إضافة مسارات الإدارة المحمية */}
            <Route path="/admin/employees" element={
              <ProtectedRoute requiredRole="admin">
                <EmployeeManagement />
              </ProtectedRoute>
            } />

            {/* مسارات الإدارة المحمية الأخرى */}
            <Route path="/admin/balances" element={
              <ProtectedRoute requiredRole="admin">
                <BalanceManagement />
              </ProtectedRoute>
            } />

            {/* مسارات الإدارة المحمية الأخرى */}
            <Route path="/admin/history" element={
              <ProtectedRoute requiredRole="admin">
                <LeaveHistory />
              </ProtectedRoute>
            } />

            {/* مسارات الإدارة المحمية الأخرى */}
            <Route path="/admin/profile" element={
              <ProtectedRoute requiredRole="admin">
                <AdminProfile />
              </ProtectedRoute>
            } />

            {/* مسارات الإدارة المحمية الأخرى */}
            <Route path="/admin/logs" element={
              <ProtectedRoute requiredRole="admin">
                <SystemLogs />
              </ProtectedRoute>
            } /> 

            {/* مسارات الإدارة المحمية الأخرى */} 
            <Route path="/admin/roster" element={
              <ProtectedRoute requiredRole="admin">
                <RosterManagement />
              </ProtectedRoute>
            } />
            
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;