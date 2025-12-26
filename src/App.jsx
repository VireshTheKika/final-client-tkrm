import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import React from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import ManagerPanel from "./pages/ManagerPanel";
import EmployeePanel from "./pages/EmployeePanel";
import Tasks from "./pages/Tasks";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// ✅ Protected route for authentication and role checking
function ProtectedRoute({ children, allowedRoles }) {
  const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));

  if (!userInfo) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userInfo.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public route */}
        <Route path="/" element={<Login />} />

        {/* Common Dashboard (if used for all roles) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Panel */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Manager Panel */}
        <Route
          path="/manager"
          element={
            <ProtectedRoute allowedRoles={["Manager", "Admin"]}>
              <ManagerPanel />
            </ProtectedRoute>
          }
        />

        {/* Employee Panel */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={["Employee"]}>
              <EmployeePanel />
            </ProtectedRoute>
          }
        />

        {/* Tasks Page (accessible by all logged-in users) */}
        <Route
          path="/tasks"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Manager", "Employee"]}>
              <Tasks />
            </ProtectedRoute>
          }
        />

        {/* Unauthorized Access Page */}
        <Route
          path="/unauthorized"
          element={
            <div className="flex h-screen items-center justify-center text-xl text-red-600 font-semibold">
              Access Denied — You don’t have permission to view this page.
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
