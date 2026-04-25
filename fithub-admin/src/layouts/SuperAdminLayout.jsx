import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "../lib/api";

const nav = [
  { to: "/sa", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" },
  { to: "/sa/coaches", label: "Koçlar", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { to: "/sa/students", label: "Öğrenciler", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { to: "/sa/subscriptions", label: "Abonelikler", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { to: "/sa/refunds", label: "İade Talepleri", icon: "M3 10h18M3 14h18m-9 4v-8m-7 8h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
];

const base = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition";

export default function SuperAdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col h-screen fixed left-0 top-0 border-r border-gray-800">
        <div className="px-6 pt-6 pb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900">SA</span>
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight">FitHub</span>
              <span className="text-xs text-amber-400 ml-1 font-semibold">ADMIN</span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 flex-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/sa"}
              className={({ isActive }) =>
                `${base} ${isActive ? "bg-amber-500/10 text-amber-400" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`
              }
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.icon} />
              </svg>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-6 pt-4 border-t border-gray-800 space-y-2">
          <button
            onClick={() => navigate("/")}
            className={`${base} text-gray-500 hover:text-gray-300 w-full`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Koç Paneli
          </button>
          <button
            onClick={() => { clearToken(); navigate("/login"); }}
            className={`${base} text-gray-500 hover:text-red-400 w-full`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Çıkış
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-64">
        <header className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur px-8 flex items-center">
          <span className="text-sm font-semibold text-amber-400">SuperAdmin</span>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
