import { NavLink } from "react-router-dom";

const base =
  "flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition";

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white p-4">
      <div className="px-2 text-xl font-semibold mb-8">FitHub Admin</div>

      <nav className="flex flex-col gap-1">
        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          Dashboard
        </NavLink>

        {/* Students */}
        <NavLink
          to="/students"
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          Students
        </NavLink>

        {/* My Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-black text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`
          }
        >
          My Profile
        </NavLink>
      </nav>
    </aside>
  );
}
