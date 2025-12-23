import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
