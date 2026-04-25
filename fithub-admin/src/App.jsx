import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import MyProfile from "./pages/MyProfile";
import Messages from "./pages/Messages";
import SADashboard from "./pages/superadmin/SADashboard";
import SACoaches from "./pages/superadmin/SACoaches";
import SAStudents from "./pages/superadmin/SAStudents";
import SASubscriptions from "./pages/superadmin/SASubscriptions";
import SARefunds from "./pages/superadmin/SARefunds";

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* PROTECTED ADMIN AREA */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Students */}
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentDetail />} />

          {/* Messages */}
          <Route path="messages" element={<Messages />} />

          {/* Coach profile */}
          <Route path="profile" element={<MyProfile />} />

          {/* Fallback inside admin */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* SUPERADMIN AREA */}
        <Route
          path="/sa"
          element={
            <ProtectedRoute>
              <SuperAdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SADashboard />} />
          <Route path="coaches" element={<SACoaches />} />
          <Route path="students" element={<SAStudents />} />
          <Route path="subscriptions" element={<SASubscriptions />} />
          <Route path="refunds" element={<SARefunds />} />
        </Route>

        {/* Global fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
