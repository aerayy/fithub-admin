import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

const card = "bg-white border rounded-2xl p-5";
const label = "text-xs font-semibold text-gray-600";
const input =
  "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10";
const textarea =
  "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 min-h-[110px]";
const btn =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition";
const btnPrimary = `${btn} bg-black text-white hover:bg-black/90`;
const btnGhost = `${btn} border bg-white hover:bg-gray-50`;
const badge = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";

function toCommaString(arr) {
  if (!arr) return "";
  if (Array.isArray(arr)) return arr.join(", ");
  return String(arr || "");
}
function toArrayFromComma(str) {
  if (!str) return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function formatTry(val) {
  if (val === null || val === undefined || val === "") return "—";
  const n = Number(val);
  if (Number.isNaN(n)) return String(val);
  return new Intl.NumberFormat("tr-TR").format(n);
}

export default function MyProfile() {
  // -----------------------------
  // Profile state
  // -----------------------------
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState("");

  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [instagram, setInstagram] = useState("");
  const [isActive, setIsActive] = useState(true);

  const photoPreview = useMemo(() => {
    const s = (photoUrl || "").trim();
    if (!s) return "";
    return s;
  }, [photoUrl]);

  // -----------------------------
  // Packages state
  // -----------------------------
  const [pkgLoading, setPkgLoading] = useState(true);
  const [pkgError, setPkgError] = useState("");
  const [packages, setPackages] = useState([]);

  const [creating, setCreating] = useState(false);
  const [newPkg, setNewPkg] = useState({
    name: "",
    description: "",
    duration_days: 30,
    price: 0,
    is_active: true,
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editPkg, setEditPkg] = useState(null);

  // -----------------------------
  // Fetch
  // -----------------------------
  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/coach/me/profile");
      const p = data?.profile || {};
      setBio(p.bio || "");
      setPhotoUrl(p.photo_url || "");
      setSpecialties(toCommaString(p.specialties));
      setInstagram(p.instagram || "");
      setIsActive(p.is_active ?? true);
    } catch (e) {
      console.error("Profile fetch error:", e?.response?.status, e?.response?.data);
      setError(e?.response?.data?.detail || "Profile yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    setPkgLoading(true);
    setPkgError("");
    try {
      const { data } = await api.get("/coach/packages");
      setPackages(data?.packages || []);
    } catch (e) {
      console.error("Packages fetch error:", e?.response?.status, e?.response?.data);
      setPkgError(e?.response?.data?.detail || "Paketler yüklenemedi.");
    } finally {
      setPkgLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPackages();
  }, []);

  // -----------------------------
  // Actions
  // -----------------------------
  const saveProfile = async () => {
    setSavingProfile(true);
    setError("");
    try {
      const payload = {
        bio,
        photo_url: photoUrl?.trim() || null,
        specialties: toArrayFromComma(specialties),
        instagram: instagram?.trim() || null,
        is_active: !!isActive,
      };

      await api.put("/coach/me/profile", payload);
      await fetchProfile();
    } catch (e) {
      console.error("Profile save error:", e?.response?.status, e?.response?.data);
      setError(e?.response?.data?.detail || "Kaydedilemedi.");
    } finally {
      setSavingProfile(false);
    }
  };

  const createPackage = async () => {
    setCreating(true);
    setPkgError("");
    try {
      const body = {
        name: newPkg.name.trim(),
        description: newPkg.description?.trim() || null,
        duration_days: Number(newPkg.duration_days),
        price: Number(newPkg.price),
        is_active: !!newPkg.is_active,
      };
      await api.post("/coach/packages", body);
      setNewPkg({ name: "", description: "", duration_days: 30, price: 0, is_active: true });
      await fetchPackages();
    } catch (e) {
      console.error("Package create error:", e?.response?.status, e?.response?.data);
      setPkgError(e?.response?.data?.detail || "Paket oluşturulamadı.");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (p) => {
    setEditPkg({
      id: p.id,
      name: p.name || "",
      description: p.description || "",
      duration_days: p.duration_days ?? 30,
      price: p.price ?? 0,
      is_active: p.is_active ?? true,
    });
    setEditOpen(true);
  };

  const updatePackage = async () => {
    if (!editPkg?.id) return;
    setEditSaving(true);
    setPkgError("");
    try {
      const body = {
        name: editPkg.name.trim(),
        description: editPkg.description?.trim() || null,
        duration_days: Number(editPkg.duration_days),
        price: Number(editPkg.price),
        is_active: !!editPkg.is_active,
      };
      await api.put(`/coach/packages/${editPkg.id}`, body);
      setEditOpen(false);
      setEditPkg(null);
      await fetchPackages();
    } catch (e) {
      console.error("Package update error:", e?.response?.status, e?.response?.data);
      setPkgError(e?.response?.data?.detail || "Paket güncellenemedi.");
    } finally {
      setEditSaving(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-sm text-gray-500">
            Koç profilini düzenle ve öğrencilerin göreceği bilgileri yönet.
          </p>
        </div>

        <button
          onClick={saveProfile}
          disabled={savingProfile || loading}
          className={btnPrimary}
          title="Profil kaydet"
        >
          {savingProfile ? "Saving..." : "Save changes"}
        </button>
      </div>

      {/* Errors */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Public Info</div>
            {loading ? (
              <span className="text-xs text-gray-400">Loading...</span>
            ) : (
              <span className={`${badge} ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {isActive ? "Active" : "Hidden"}
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className={label}>Bio</div>
              <textarea
                className={textarea}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Kendini kısaca tanıt (uzmanlık, yaklaşım, deneyim...)"
                disabled={loading}
              />
            </div>

            <div>
              <div className={label}>Specialties</div>
              <input
                className={input}
                value={specialties}
                onChange={(e) => setSpecialties(e.target.value)}
                placeholder="Strength, Fat loss, Mobility"
                disabled={loading}
              />
              <div className="mt-1 text-xs text-gray-400">
                Virgülle ayır: Strength, Fat loss, Mobility...
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className={label}>Instagram</div>
                <input
                  className={input}
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@koc_adi veya link"
                  disabled={loading}
                />
              </div>

              {/* NOT: Aylık ücret alanını UI’dan kaldırdık.
                  Ücret artık paketlerden gelecek. */}
              <div className="hidden" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={card}>
            <div className="text-sm font-semibold mb-4">Profile Photo</div>

            <div className="space-y-3">
              <div>
                <div className={label}>Photo URL</div>
                <input
                  className={input}
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={loading}
                />
              </div>

              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-xs font-semibold text-gray-600 mb-2">Preview</div>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-white border overflow-hidden flex items-center justify-center">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {photoPreview ? "Fotoğraf yüklendi." : "Henüz foto yok."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={card}>
            <div className="text-sm font-semibold mb-3">Visibility</div>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-sm font-semibold">Active profile</div>
                <div className="text-xs text-gray-500">Pasif yaparsan profil listelenmez.</div>
              </div>
              <input
                type="checkbox"
                checked={!!isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={loading}
                className="h-5 w-5"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create */}
        <div className={`${card} lg:col-span-1`}>
          <div className="text-sm font-semibold mb-4">Create Package</div>

          {pkgError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {pkgError}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <div className={label}>Package name</div>
              <input
                className={input}
                value={newPkg.name}
                onChange={(e) => setNewPkg((s) => ({ ...s, name: e.target.value }))}
                placeholder="Örn: 1 Aylık Online Koçluk"
              />
            </div>

            <div>
              <div className={label}>Description (optional)</div>
              <textarea
                className={textarea}
                value={newPkg.description}
                onChange={(e) => setNewPkg((s) => ({ ...s, description: e.target.value }))}
                placeholder="Pakette neler var? (haftalık plan, check-in, mesajlaşma...)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className={label}>Duration (days)</div>
                <input
                  className={input}
                  type="number"
                  min={1}
                  value={newPkg.duration_days}
                  onChange={(e) => setNewPkg((s) => ({ ...s, duration_days: e.target.value }))}
                />
              </div>
              <div>
                <div className={label}>Price (₺)</div>
                <input
                  className={input}
                  type="number"
                  min={0}
                  value={newPkg.price}
                  onChange={(e) => setNewPkg((s) => ({ ...s, price: e.target.value }))}
                />
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <div className="text-sm font-semibold">Active package</div>
                <div className="text-xs text-gray-500">Pasif olursa satışta görünmez.</div>
              </div>
              <input
                type="checkbox"
                checked={!!newPkg.is_active}
                onChange={(e) => setNewPkg((s) => ({ ...s, is_active: e.target.checked }))}
                className="h-5 w-5"
              />
            </label>

            <button
              className={btnPrimary}
              onClick={createPackage}
              disabled={creating || !newPkg.name.trim()}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className={`${card} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">My Packages</div>
            <button className={btnGhost} onClick={fetchPackages} disabled={pkgLoading}>
              Refresh
            </button>
          </div>

          {pkgLoading ? (
            <div className="text-sm text-gray-500">Loading packages...</div>
          ) : packages.length === 0 ? (
            <div className="text-sm text-gray-500">Henüz paket yok. Soldan oluştur.</div>
          ) : (
            <div className="space-y-3">
              {packages.map((p) => (
                <div key={p.id} className="rounded-2xl border p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold truncate">{p.name}</div>
                      <span
                        className={`${badge} ${
                          p.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      <span className="font-semibold">{formatTry(p.price)} ₺</span>{" "}
                      <span className="text-gray-400">•</span>{" "}
                      <span>{p.duration_days} gün</span>
                    </div>

                    {p.description ? (
                      <div className="mt-2 text-sm text-gray-500 line-clamp-2">{p.description}</div>
                    ) : (
                      <div className="mt-2 text-sm text-gray-400">Açıklama yok.</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button className={btnGhost} onClick={() => openEdit(p)}>
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && editPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white border p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-lg font-semibold">Edit Package</div>
                <div className="text-sm text-gray-500">Paket detaylarını güncelle.</div>
              </div>
              <button
                className={btnGhost}
                onClick={() => {
                  setEditOpen(false);
                  setEditPkg(null);
                }}
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className={label}>Package name</div>
                <input
                  className={input}
                  value={editPkg.name}
                  onChange={(e) => setEditPkg((s) => ({ ...s, name: e.target.value }))}
                />
              </div>

              <div>
                <div className={label}>Description</div>
                <textarea
                  className={textarea}
                  value={editPkg.description || ""}
                  onChange={(e) => setEditPkg((s) => ({ ...s, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className={label}>Duration (days)</div>
                  <input
                    className={input}
                    type="number"
                    min={1}
                    value={editPkg.duration_days}
                    onChange={(e) => setEditPkg((s) => ({ ...s, duration_days: e.target.value }))}
                  />
                </div>
                <div>
                  <div className={label}>Price (₺)</div>
                  <input
                    className={input}
                    type="number"
                    min={0}
                    value={editPkg.price}
                    onChange={(e) => setEditPkg((s) => ({ ...s, price: e.target.value }))}
                  />
                </div>
              </div>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-sm font-semibold">Active package</div>
                  <div className="text-xs text-gray-500">Pasif olursa satışta görünmez.</div>
                </div>
                <input
                  type="checkbox"
                  checked={!!editPkg.is_active}
                  onChange={(e) => setEditPkg((s) => ({ ...s, is_active: e.target.checked }))}
                  className="h-5 w-5"
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button className={btnGhost} onClick={() => setEditOpen(false)} disabled={editSaving}>
                  Cancel
                </button>
                <button className={btnPrimary} onClick={updatePackage} disabled={editSaving || !editPkg.name.trim()}>
                  {editSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
