import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - fixed width 256px */}
      <Sidebar />

      {/* Main content - offset by sidebar */}
      <div className="flex flex-col flex-1" style={{ marginLeft: '256px' }}>
        <Topbar />

        <main className="flex-1" style={{ padding: '32px 187px 0 187px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
