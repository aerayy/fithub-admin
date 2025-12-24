import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";

import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
