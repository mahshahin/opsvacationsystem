import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const savedData = localStorage.getItem('employeeData');
  const user = savedData ? JSON.parse(savedData) : null;

  // 1. لو مش عامل تسجيل دخول أصلاً، رجعه لشاشة الدخول
  if (!user) return <Navigate to="/" />;

  // 2. لو مطلوب صلاحية معينة (زي أدمن) وهو مش أدمن، رجعه للوحة تحكمه
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }

  // 3. لو كله تمام، افتح له الصفحة
  return children;
};

export default ProtectedRoute;