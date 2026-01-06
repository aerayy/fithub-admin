import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";


export default function Topbar() {
  const [open, setOpen] = useState(false);
  const [newPurchases, setNewPurchases] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const nav = useNavigate();


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

  const toggle = () => {
    setOpen((v) => !v);
    setUnreadCount(0);
  };

  return (
    <header className="h-14 border-b bg-white px-6 flex items-center justify-between relative">
      <div className="font-medium">Admin Panel</div>

      <div className="flex items-center gap-3">
        {/* 🔔 Bell */}
        <button
          onClick={toggle}
          className="relative rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
          title="Notifications"
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
          <div className="absolute right-6 top-14 w-96 rounded-2xl border bg-white shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 text-sm font-semibold border-b">
              New purchases (7d)
            </div>

            <div className="max-h-80 overflow-auto">
              {newPurchases.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500">No new purchases.</div>
              ) : (
                newPurchases.map((x) => (
                  <div
  key={x.subscription_id || `${x.student_id}-${x.purchased_at}`}
  className="px-4 py-3 border-b cursor-pointer hover:bg-gray-50"
  onClick={() => {
    setOpen(false);
    // New purchases sekmesi açık gelsin
    nav(`/students?tab=new`);
  }}
>
  ...
</div>

                ))
              )}
            </div>
          </div>
        ) : null}

        <div className="text-sm text-gray-600">Coach / Superadmin</div>
      </div>
    </header>
  );
}
