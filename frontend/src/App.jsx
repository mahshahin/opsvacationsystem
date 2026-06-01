import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard'; 
import ProtectedRoute from './pages/components/ProtectedRoute'; 
import EmployeeManagement from './pages/EmployeeManagement'; 
import BalanceManagement from './pages/BalanceManagement';
import LeaveHistory from './pages/LeaveHistory';
import EmployeeHistory from './pages/EmployeeHistory';
import EmployeeReports from './pages/EmployeeReports';
import Register from './pages/Register';
import EmployeeProfile from './pages/EmployeeProfile';
import AdminProfile from './pages/AdminProfile';


function App() {
  return (
    <Router>
      <div>
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

        </Routes>
      </div>
    </Router>
  );
}

export default App;