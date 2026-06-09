import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole }) => {
  // 1. جلب البيانات بالطريقة الجديدة الموحدة (من السيرفر أو اللوكال)
  const savedData =
    sessionStorage.getItem("employeeData") ||
    localStorage.getItem("employeeData");

  // 2. لو مفيش بيانات أو البيانات تالفة، ارجع فوراً لصفحة تسجيل الدخول
  if (!savedData || savedData === "undefined" || savedData === "null") {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(savedData);

    // 3. التحقق من الصلاحية (لو المسار يخص الإدارة والمستخدم مش أدمن)
    if (requiredRole === "admin" && user.role !== "admin") {
      // لو موظف عادي وبيحاول يدخل للأدمن، ودديه لوحة تحكم الموظف بتاعته
      return <Navigate to="/dashboard" replace />;
    }

    // 4. لو كل حاجة تمام، عدّيه وسيبه يدخل الصفحة
    return children;
  } catch (error) {
    // حماية ضد كراش الـ JSON.parse لو الداتا تالفة
    localStorage.removeItem("employeeData");
    sessionStorage.removeItem("employeeData");
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;
