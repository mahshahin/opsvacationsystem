import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import ProtectedRoute from "./pages/components/ProtectedRoute";

// استدعاءات عامة
const Login = React.lazy(() => import("./pages/Login/Login"));
const Register = React.lazy(() => import("./pages/Login/Register"));

// استدعاءات الموظف
const Dashboard = React.lazy(() => import("./pages/Employee/Dashboard"));
const MyShifts = React.lazy(() => import("./pages/Employee/MyShifts"));
const EmployeeHistory = React.lazy(
  () => import("./pages/Employee/EmployeeHistory"),
);
const EmployeeReports = React.lazy(
  () => import("./pages/Employee/EmployeeReports"),
);
const EmployeeProfile = React.lazy(
  () => import("./pages/Employee/EmployeeProfile"),
);
const EmployeeFullRoster = React.lazy(
  () => import("./pages/Employee/EmployeeFullRoster"),
);

// استدعاءات الإدارة
const AdminDashboard = React.lazy(() => import("./pages/Admin/AdminDashboard"));
const EmployeeManagement = React.lazy(
  () => import("./pages/Admin/EmployeeManagement"),
);
const EmployeeMessages = React.lazy(
  () => import("./pages/Admin/EmployeeMessages"),
);
const BalanceManagement = React.lazy(
  () => import("./pages/Admin/BalanceManagement"),
);
const LeaveHistory = React.lazy(() => import("./pages/Admin/LeaveHistory"));
const AdminProfile = React.lazy(() => import("./pages/Admin/AdminProfile"));
const SystemLogs = React.lazy(() => import("./pages/Admin/SystemLogs"));
const RosterManagement = React.lazy(
  () => import("./pages/Admin/RosterManagement"),
);

function App() {
  return (
    <Router>
      <div>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "inherit",
              fontSize: "15px",
              fontWeight: "bold",
            },
          }}
        />

        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <span className="text-lg font-medium text-gray-600">
                  جاري التحميل...
                </span>
              </div>
            </div>
          }
        >
          <Routes>
            {/* === مسارات عامة === */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* === مسارات الموظف === */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-leaves"
              element={
                <ProtectedRoute>
                  <EmployeeHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-reports"
              element={
                <ProtectedRoute>
                  <EmployeeReports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/my-shifts"
              element={
                <ProtectedRoute>
                  <MyShifts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/employee/full-roster"
              element={
                <ProtectedRoute>
                  <EmployeeFullRoster />
                </ProtectedRoute>
              }
            />

            {/* === مسارات الإدارة === */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/employees"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EmployeeManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/employee-messages"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EmployeeMessages />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/balances"
              element={
                <ProtectedRoute requiredRole="admin">
                  <BalanceManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/history"
              element={
                <ProtectedRoute requiredRole="admin">
                  <LeaveHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute requiredRole="admin">
                  <SystemLogs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/roster"
              element={
                <ProtectedRoute requiredRole="admin">
                  <RosterManagement />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
