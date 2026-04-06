import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-64">
        <Topbar />
        <main className="flex-1 px-6 py-8 xl:px-16 2xl:px-[120px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
