import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './pages/components/ProtectedRoute';

const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard')); 
const EmployeeManagement = React.lazy(() => import('./pages/EmployeeManagement')); 
const BalanceManagement = React.lazy(() => import('./pages/BalanceManagement'));
const LeaveHistory = React.lazy(() => import('./pages/LeaveHistory'));
const EmployeeHistory = React.lazy(() => import('./pages/EmployeeHistory'));
const EmployeeReports = React.lazy(() => import('./pages/EmployeeReports'));
const Register = React.lazy(() => import('./pages/Register'));
const EmployeeProfile = React.lazy(() => import('./pages/EmployeeProfile'));
const AdminProfile = React.lazy(() => import('./pages/AdminProfile'));
const SystemLogs = React.lazy(() => import('./pages/SystemLogs'));// مسار الملف الجديد

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
            {/* === المسارات العامة === */}
            <Route path="/" element={<Login />} />
            
            {/* لو عندك صفحة تسجيل فعلية، شيل الكومنت من السطر اللي جاي وضيف الاستدعاء بتاعها فوق */}
            <Route path="/register" element={<Register />} /> {/* تفعيل السطر هنا */}

            {/* === مسارات الموظف (محمية) === */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <EmployeeProfile />
              </ProtectedRoute>
            } />
            <Route path="/my-leaves" element={
              <ProtectedRoute>
                <EmployeeHistory />
              </ProtectedRoute>
            } />
            <Route path="/my-reports" element={
              <ProtectedRoute>
                <EmployeeReports />
              </ProtectedRoute>
            } />


            {/* === مسارات الإدارة (محمية وصلاحية أدمن فقط) === */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
              <ProtectedRoute requiredRole="admin">
                <EmployeeManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/balances" element={
              <ProtectedRoute requiredRole="admin">
                <BalanceManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/history" element={
              <ProtectedRoute requiredRole="admin">
                <LeaveHistory />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute requiredRole="admin">
                <AdminProfile />
              </ProtectedRoute>
            } />
            <Route path="/admin/logs" element={
              <ProtectedRoute requiredRole="admin">
                <SystemLogs />
              </ProtectedRoute>
            } />  

          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;