import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";

const base =
  "flex items-center gap-3 px-4 py-3 rounded-[14px] text-base font-medium transition";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="w-64 bg-[#0F172B] flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="px-6 pt-6 pb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] rounded-[10px] flex items-center justify-center shadow-[0_2px_8px_rgba(62,158,142,0.4)]">
            <span className="text-base font-bold text-white">F</span>
          </div>
          <span className="text-xl font-bold text-white tracking-[-0.949219px]">FitHub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 px-4 flex-1">
        {/* Dashboard */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white shadow-[0_4px_16px_rgba(62,158,142,0.35)]"
                : "text-[#90A1B9] hover:bg-[#1D293D] hover:text-white"
            }`
          }
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2.5" y="2.5" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.67" />
            <rect x="12.5" y="2.5" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.67" />
            <rect x="2.5" y="12.5" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.67" />
            <rect x="12.5" y="12.5" width="7.5" height="7.5" stroke="currentColor" strokeWidth="1.67" />
          </svg>
          Kontrol Paneli
        </NavLink>

        {/* Students */}
        <NavLink
          to="/students"
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white shadow-[0_4px_16px_rgba(62,158,142,0.35)]"
                : "text-[#90A1B9] hover:bg-[#1D293D] hover:text-white"
            }`
          }
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.67" />
            <circle cx="15" cy="5" r="3" stroke="currentColor" strokeWidth="1.67" />
            <circle cx="5" cy="15" r="3" stroke="currentColor" strokeWidth="1.67" />
            <circle cx="15" cy="15" r="3" stroke="currentColor" strokeWidth="1.67" />
            <circle cx="10" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.67" />
          </svg>
          Öğrenciler
        </NavLink>

        {/* Messages */}
        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white shadow-[0_4px_16px_rgba(62,158,142,0.35)]"
                : "text-[#90A1B9] hover:bg-[#1D293D] hover:text-white"
            }`
          }
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2.5 5.833C2.5 4.912 3.246 4.167 4.167 4.167H15.833C16.754 4.167 17.5 4.912 17.5 5.833V14.167C17.5 15.088 16.754 15.833 15.833 15.833H4.167C3.246 15.833 2.5 15.088 2.5 14.167V5.833Z" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.5 6.667L10 10.833L17.5 6.667" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Mesajlar
        </NavLink>

        {/* My Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${base} ${
              isActive
                ? "bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white shadow-[0_4px_16px_rgba(62,158,142,0.35)]"
                : "text-[#90A1B9] hover:bg-[#1D293D] hover:text-white"
            }`
          }
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="6.25" r="3.75" stroke="currentColor" strokeWidth="1.67" />
            <path d="M2.5 17.5C2.5 13.634 6.134 10.5 10.5 10.5C14.866 10.5 18.5 13.634 18.5 17.5" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" />
          </svg>
          Profilim
        </NavLink>
      </nav>

      {/* Sign Out */}
      <div className="px-4 pb-6 border-t border-[#1D293D] pt-6">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 text-base font-medium text-[#90A1B9] hover:text-white transition w-full"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13.333 5L17.5 10L13.333 15" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" />
            <path d="M7.5 10H17.5" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" />
            <path d="M2.5 3.75V16.25" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" />
          </svg>
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
