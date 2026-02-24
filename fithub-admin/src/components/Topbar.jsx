import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useNavigate, useLocation } from "react-router-dom";


export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [newPurchases, setNewPurchases] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState({ full_name: "", title: "", photo_url: "" });
  const nav = useNavigate();
  const location = useLocation();


  // Daha önce gördüğümüz subscription_id'ler
  const seenRef = useRef(new Set());
  const firstLoadRef = useRef(true);

  const fetchNewPurchases = async () => {
    try {
      const { data } = await api.get("/coach/students/new-purchases?days=7");
      const list = data?.students || [];

      // İlk yükleme: mevcutları "seen" yap, bildirim patlatma
      if (firstLoadRef.current) {
        list.forEach((x) => x.subscription_id && seenRef.current.add(x.subscription_id));
        firstLoadRef.current = false;
      } else {
        // Yeni gelenler
        const fresh = list.filter(
          (x) => x.subscription_id && !seenRef.current.has(x.subscription_id)
        );

        if (fresh.length > 0) {
          fresh.forEach((x) => seenRef.current.add(x.subscription_id));
          setUnreadCount((c) => c + fresh.length);
        }
      }

      setNewPurchases(list);
    } catch (e) {
      // Topbar polling hata basmasın diye sessiz geçiyoruz
      // istersen console.log yapabilirsin
    }
  };

  useEffect(() => {
    fetchNewPurchases();
    const t = setInterval(fetchNewPurchases, 15000); // 15 saniye
    return () => clearInterval(t);
  }, []);

  // Fetch user profile for header
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/coach/me/profile");
        const p = data?.profile || {};
        setUserProfile({
          full_name: p.full_name || "Koç",
          title: p.title || p.job_title || "Elit Koç",
          photo_url: p.photo_url || "",
        });
      } catch (e) {
        console.error("Error fetching profile for header:", e);
      }
    };
    fetchProfile();
  }, []);

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/profile") return "profilim";
    if (path.startsWith("/students")) return "öğrenciler";
    if (path.startsWith("/workouts")) return "antrenmanlar";
    return "kontrol paneli";
  };

  const toggle = () => {
    setOpen((v) => !v);
    setUnreadCount(0);
  };

  return (
    <header className="h-16 border-b border-[#E2E8F0] bg-white px-8 flex items-center justify-between relative" style={{ marginLeft: '256px' }}>
      <div className="text-xl font-bold text-[#1D293D] capitalize" style={{ letterSpacing: '-0.449219px' }}>
        {getPageTitle()}
      </div>

      <div className="flex items-center gap-6">
        {/* 🔔 Bell */}
        <button
          onClick={toggle}
          className="relative rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          title="Bildirimler"
        >
          🔔
          {unreadCount > 0 ? (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-black text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          ) : null}
        </button>

        {/* Dropdown */}
        {open ? (
          <div className="absolute right-8 top-16 w-96 rounded-2xl border bg-white shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 text-sm font-semibold border-b">
              Yeni satın almalar (7g)
            </div>

            <div className="max-h-80 overflow-auto">
              {newPurchases.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500">Yeni satın alma yok.</div>
              ) : (
                newPurchases.map((x) => (
                  <div
                    key={x.subscription_id || `${x.student_id}-${x.purchased_at}`}
                    className="px-4 py-3 border-b cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      setOpen(false);
                      nav(`/students?tab=new`);
                    }}
                  >
                    {/* Purchase item content */}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {/* User Card */}
        <div className="flex items-center gap-4 pl-6 border-l border-[#E2E8F0] cursor-pointer" onClick={() => nav("/profile")}>
          <div className="flex flex-col items-end">
            <div className="text-sm font-semibold text-[#0F172B] leading-5" style={{ letterSpacing: '-0.150391px' }}>
              {userProfile.full_name || "Koç"}
            </div>
            <div className="text-xs text-[#62748E] leading-4">
              {userProfile.title || "Elit Koç"}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border border-[#F1F5F9] overflow-hidden bg-gray-100">
            {userProfile.photo_url ? (
              <img src={userProfile.photo_url} alt={userProfile.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                {userProfile.full_name?.[0]?.toUpperCase() || "C"}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
