import { useEffect, useMemo, useState } from "react";
import { api, uploadImage } from "../lib/api";
import { useToast } from "../components/Toast";
import { translateError } from "../lib/errorHandler";

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
  return new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const SERVICE_TAGS = [
  "7/24 Sohbet",
  "Form Analizi",
  "Beslenme Planı",
  "Kişiye Özel Antrenman",
  "Görüntülü Görüşme",
  "Birebir Antrenman",
  "Haftalık Kontrol",
  "Takviye Rehberliği",
  "Mobilite/Esneme",
  "İlerleme Takibi"
];

// Preset specialties - click to add/remove
const SPECIALTY_PRESETS = [
  "Güç Antrenmanı",
  "Yağ Yakma",
  "Kas Geliştirme",
  "Mobilite",
  "Esneme",
  "Kardiyo",
  "HIIT",
  "CrossFit",
  "Beslenme",
  "Spor Beslenmesi",
  "Fonksiyonel Antrenman",
  "Pilates",
  "Yoga",
  "Rehabilitasyon",
  "Postür",
  "Atletik Performans",
];

// Service icons for package cards
const SERVICE_ICONS = {
  "7/24 Sohbet": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ),
  "Form Analizi": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>
  ),
  "Beslenme Planı": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
  ),
  "Kişiye Özel Antrenman": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5l11 11M21 21l-1.5-1.5M2.5 2.5L4 4M14.5 6.5l-3 3M9.5 14.5l-3 3M18 3l3 3M3 18l3 3"/></svg>
  ),
  "Görüntülü Görüşme": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
  ),
  "Birebir Antrenman": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  "Haftalık Kontrol": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  "Takviye Rehberliği": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.5 20.5L3.5 13.5a2.83 2.83 0 0 1 0-4L13.5 0"/><path d="M20.5 10.5l-7 7"/></svg>
  ),
  "Mobilite/Esneme": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="3"/><path d="M12 8v3M8 14l4-3 4 3M8 14l-3 5M16 14l3 5"/></svg>
  ),
  "İlerleme Takibi": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  ),
};

export default function MyProfile() {
  const { showToast, ToastContainer } = useToast();

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
  const [twitter, setTwitter] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [certificates, setCertificates] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [specialtyInput, setSpecialtyInput] = useState("");

  // Initial state for change tracking
  const [initialState, setInitialState] = useState(null);

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
    duration_months: 1,
    price: 0,
    discount_percentage: 0,
    is_active: true,
    services: [],
    image_url: "",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [createPackageOpen, setCreatePackageOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [location, setLocation] = useState("İstanbul, Türkiye"); // UI-only field
  const [mediaTab, setMediaTab] = useState("certificates"); // UI-only: 'certificates' | 'photos'
  const [referralCode, setReferralCode] = useState("");

  // -----------------------------
  // Fetch
  // -----------------------------
  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/coach/me/profile");
      const p = data?.profile || {};
      const fetchedBio = p.bio || "";
      const fetchedPhotoUrl = p.photo_url || "";
      const fetchedSpecialties = toCommaString(p.specialties);
      const fetchedInstagram = p.instagram || "";
      const fetchedTwitter = p.twitter || "";
      const fetchedLinkedin = p.linkedin || "";
      const fetchedWebsite = p.website || "";
      const fetchedIsActive = p.is_active ?? true;
      
      // Use backend values, or keep existing if backend doesn't return them
      const fetchedFullName = p.full_name ?? fullName ?? "";
      const fetchedEmail = p.email ?? email ?? "";
      const fetchedTitle = p.title ?? p.job_title ?? title ?? "";
      const fetchedCertificates = Array.isArray(p.certificates) ? p.certificates : [];
      const fetchedPhotos = Array.isArray(p.photos) ? p.photos : [];
      
      setBio(fetchedBio);
      setPhotoUrl(fetchedPhotoUrl);
      setSpecialties(fetchedSpecialties);
      setInstagram(fetchedInstagram);
      setTwitter(fetchedTwitter);
      setLinkedin(fetchedLinkedin);
      setWebsite(fetchedWebsite);
      setIsActive(fetchedIsActive);
      setFullName(fetchedFullName);
      setEmail(fetchedEmail);
      setTitle(fetchedTitle);
      setCertificates(fetchedCertificates);
      setPhotos(fetchedPhotos);
      setReferralCode(p.referral_code || "");

      // Save initial state for change tracking
      setInitialState({
        bio: fetchedBio,
        photo_url: fetchedPhotoUrl,
        specialties: fetchedSpecialties,
        instagram: fetchedInstagram,
        twitter: fetchedTwitter,
        linkedin: fetchedLinkedin,
        website: fetchedWebsite,
        is_active: fetchedIsActive,
        full_name: fetchedFullName,
        email: fetchedEmail,
        title: fetchedTitle,
        certificates: JSON.stringify(fetchedCertificates),
        photos: JSON.stringify(fetchedPhotos),
      });
    } catch (e) {
      console.error("Profile fetch error:", e?.response?.status, e?.response?.data);
      const msg = translateError(e);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    setPkgLoading(true);
    try {
      const { data } = await api.get("/coach/packages");
      
      // Backend might return packages array directly or wrapped in packages key
      let packagesList = [];
      if (Array.isArray(data)) {
        packagesList = data;
      } else if (data && typeof data === 'object') {
        packagesList = Array.isArray(data.packages) ? data.packages : [];
      }
      
      setPackages(packagesList);
      setPkgError(""); // Clear error on success
    } catch (e) {
      console.error("Packages fetch error:", e?.response?.status, e?.response?.data);
      const msg = translateError(e);
      setPkgError(msg);
      showToast(msg, "error");
      setPackages([]); // Set empty array on error
    } finally {
      setPkgLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------
  // Actions
  // -----------------------------
  const saveProfile = async () => {
    setSavingProfile(true);
    setError("");
    try {
      const cleanCertificates = certificates.filter((url) => url?.trim());
      const cleanPhotos = photos.filter((url) => url?.trim());
      
      const payload = {
        full_name: fullName?.trim() || null,
        title: title?.trim() || null,
        email: email?.trim() || null,
        bio,
        photo_url: photoUrl?.trim() || null,
        specialties: toArrayFromComma(specialties),
        instagram: instagram?.trim() || null,
        twitter: twitter?.trim() || null,
        linkedin: linkedin?.trim() || null,
        website: website?.trim() || null,
        is_active: !!isActive,
        certificates: cleanCertificates,
        photos: cleanPhotos,
      };

      const response = await api.put("/coach/me/profile", payload);
      
      // Update initial state with saved values before fetching
      setInitialState({
        bio,
        photo_url: photoUrl?.trim() || "",
        specialties,
        instagram: instagram?.trim() || "",
        twitter: twitter?.trim() || "",
        linkedin: linkedin?.trim() || "",
        website: website?.trim() || "",
        is_active: isActive,
        full_name: fullName?.trim() || "",
        email: email?.trim() || "",
        title: title?.trim() || "",
        certificates: JSON.stringify(cleanCertificates),
        photos: JSON.stringify(cleanPhotos),
      });
      
      // Refresh from server - but if backend doesn't return all fields, we keep current values
      try {
        await fetchProfile();
      } catch (fetchError) {
        console.error("Error fetching profile after save:", fetchError);
        // If fetch fails, at least we've updated initialState
      }
    } catch (e) {
      console.error("Profile save error:", e?.response?.status, e?.response?.data);
      const msg = translateError(e);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // Check if profile has changes
  const hasChanges = useMemo(() => {
    if (!initialState) return false;
    
    return (
      fullName?.trim() !== initialState.full_name?.trim() ||
      title?.trim() !== initialState.title?.trim() ||
      email?.trim() !== initialState.email?.trim() ||
      bio !== initialState.bio ||
      photoUrl?.trim() !== initialState.photo_url?.trim() ||
      specialties !== initialState.specialties ||
      instagram?.trim() !== initialState.instagram?.trim() ||
      twitter?.trim() !== initialState.twitter?.trim() ||
      linkedin?.trim() !== initialState.linkedin?.trim() ||
      website?.trim() !== initialState.website?.trim() ||
      isActive !== initialState.is_active ||
      JSON.stringify(certificates) !== initialState.certificates ||
      JSON.stringify(photos) !== initialState.photos
    );
  }, [fullName, title, email, bio, photoUrl, specialties, instagram, twitter, linkedin, website, isActive, certificates, photos, initialState]);

  const createPackage = async () => {
    if (creating || !newPkg.name.trim()) return;
    
    setCreating(true);
    setPkgError("");
    try {
      const body = {
        name: newPkg.name.trim(),
        description: newPkg.description?.trim() || null,
        duration_days: Number(newPkg.duration_months) * 30, // Convert months to days
        price: parseFloat(newPkg.price) || 0,
        discount_percentage: parseFloat(newPkg.discount_percentage) || 0,
        is_active: !!newPkg.is_active,
        services: Array.isArray(newPkg.services) ? newPkg.services : [],
        image_url: newPkg.image_url || null,
      };

      const response = await api.post("/coach/packages", body);
      
      // Success - reset form and close modal
      setNewPkg({ name: "", description: "", duration_months: 1, price: 0, discount_percentage: 0, is_active: true, services: [], image_url: "" });
      setPkgError("");
      setCreatePackageOpen(false);
      
      // Refresh packages list
      try {
        await fetchPackages();
      } catch (fetchError) {
        console.error("Error fetching packages after create:", fetchError);
        // Don't show error to user, packages will show on next load
      }
    } catch (e) {
      console.error("Package create error:", e?.response?.status, e?.response?.data);
      const msg = translateError(e);
      setPkgError(msg);
      showToast(msg, "error");
      // Don't close modal on error, keep form data
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (p) => {
    const price = parseFloat(p.price) || 0;

    setEditPkg({
      id: p.id,
      name: p.name || "",
      description: p.description || "",
      duration_months: p.duration_months ?? (p.duration_days ? Math.round(p.duration_days / 30) : 1),
      price: price,
      discount_percentage: p.discount_percentage ?? 0,
      is_active: p.is_active ?? true,
      services: Array.isArray(p.services) ? p.services : [],
      image_url: p.image_url || "",
    });
    setEditOpen(true);
  };

  const updatePackage = async () => {
    if (!editPkg?.id || editSaving || !editPkg.name.trim()) return;
    
    setEditSaving(true);
    setPkgError("");
    try {
      const body = {
        name: editPkg.name.trim(),
        description: editPkg.description?.trim() || null,
        duration_days: Number(editPkg.duration_months) * 30, // Convert months to days
        price: parseFloat(editPkg.price) || 0,
        discount_percentage: parseFloat(editPkg.discount_percentage) || 0,
        is_active: !!editPkg.is_active,
        services: Array.isArray(editPkg.services) ? editPkg.services : [],
        image_url: editPkg.image_url || null,
      };
      await api.put(`/coach/packages/${editPkg.id}`, body);
      // Success - close modal and refresh
      setPkgError("");
      setEditOpen(false);
      setEditPkg(null);
      await fetchPackages();
    } catch (e) {
      console.error("Package update error:", e?.response?.status, e?.response?.data);
      const msg = translateError(e);
      setPkgError(msg);
      showToast(msg, "error");
      // Don't close modal on error, keep form data
    } finally {
      setEditSaving(false);
    }
  };

  const deletePackage = async (packageId) => {
    if (!confirm("Bu paketi silmek istediğinize emin misiniz?")) return;
    setPkgError("");
    try {
      await api.delete(`/coach/packages/${packageId}`);
      await fetchPackages();
    } catch (e) {
      console.error("Package delete error:", e?.response?.status, e?.response?.data);
      const msg = translateError(e);
      setPkgError(msg);
      showToast(msg, "error");
    }
  };

  const handleCertificateUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";

    if (!file.type.startsWith("image/")) { showToast("Lütfen bir görsel dosyası seçin.", "error"); return; }
    if (file.size > 10 * 1024 * 1024) { showToast("Dosya boyutu maksimum 10MB olabilir.", "error"); return; }

    try {
      const result = await uploadImage(file);
      setCertificates((prev) => [...prev, result.url]);
    } catch {
      showToast("Sertifika yüklenemedi. Lütfen tekrar deneyin.", "error");
    }
  };

  const removeCertificate = (index) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";

    if (photos.length >= 20) { showToast("Maksimum 20 fotoğraf ekleyebilirsiniz.", "error"); return; }
    if (!file.type.startsWith("image/")) { showToast("Lütfen bir görsel dosyası seçin.", "error"); return; }
    if (file.size > 10 * 1024 * 1024) { showToast("Dosya boyutu maksimum 10MB olabilir.", "error"); return; }

    try {
      const result = await uploadImage(file);
      setPhotos((prev) => [...prev, result.url]);
    } catch {
      showToast("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.", "error");
    }
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleProfilePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Lütfen bir görsel dosyası seçin.", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast("Dosya boyutu maksimum 10MB olabilir.", "error");
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = await uploadImage(file);
      setPhotoUrl(result.url);
    } catch (e) {
      console.error("Photo upload error:", e);
      showToast("Fotoğraf yüklenemedi. Lütfen tekrar deneyin.", "error");
    } finally {
      setUploadingPhoto(false);
      event.target.value = "";
    }
  };

  const removeProfilePhoto = () => {
    if (confirm("Profil fotoğrafını kaldırmak istediğinize emin misiniz?")) {
      setPhotoUrl("");
    }
  };

  // Preview public profile
  const handlePreviewPublicProfile = () => {
    // Construct public profile URL
    const slug = (fullName || "coach").toLowerCase().replace(/\s+/g, "-");
    const publicUrl = `${window.location.origin}/coach/${slug}`;
    window.open(publicUrl, "_blank");
  };

  // Handle edit profile modal
  const handleEditProfile = () => {
    setEditProfileOpen(true);
  };

  const handleCancelEdit = () => {
    // Revert to initial state
    if (initialState) {
      setBio(initialState.bio || "");
      setPhotoUrl(initialState.photo_url || "");
      setSpecialties(initialState.specialties || "");
      setInstagram(initialState.instagram || "");
      setTwitter(initialState.twitter || "");
      setLinkedin(initialState.linkedin || "");
      setWebsite(initialState.website || "");
      setIsActive(initialState.is_active ?? true);
      setFullName(initialState.full_name || "");
      setEmail(initialState.email || "");
      setTitle(initialState.title || "");
      setCertificates(initialState.certificates ? JSON.parse(initialState.certificates) : []);
      setPhotos(initialState.photos ? JSON.parse(initialState.photos) : []);
    }
    setEditProfileOpen(false);
    setError("");
  };

  const handleSaveProfile = async () => {
    await saveProfile();
    if (!error) {
      setEditProfileOpen(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  if (loading && !initialState) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-200 rounded mb-6"></div>
          <div className="flex gap-6">
            <div className="w-80 h-96 bg-gray-200 rounded-[14px]"></div>
            <div className="flex-1 space-y-6">
              <div className="h-64 bg-gray-200 rounded-[14px]"></div>
              <div className="h-80 bg-gray-200 rounded-[14px]"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="w-full max-w-[1280px] mx-auto">
      {/* HERO BANNER */}
      <div className="relative mb-6 rounded-[22px] overflow-hidden border border-slate-200/70 shadow-[0_4px_24px_rgba(15,23,43,0.04)] bg-white">
        {/* Top accent line */}
        <div className="h-[3px] bg-gradient-to-r from-transparent via-[#3E9E8E] to-transparent" />

        {/* Content area */}
        <div className="relative px-6 lg:px-8 py-6">
          {/* Top row: avatar + identity + actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-5 gap-5">
            <div className="flex items-center gap-5 min-w-0">
              {/* Avatar */}
              <div className="relative group flex-shrink-0">
                <div className="w-[104px] h-[104px] rounded-2xl overflow-hidden bg-white ring-1 ring-slate-200 shadow-[0_4px_16px_rgba(15,23,43,0.06)] relative">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profil"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" className="text-slate-400">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {editProfileOpen && !uploadingPhoto && (
                  <label
                    className="absolute -bottom-1 -right-1 w-11 h-11 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.18)] border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                    title="Profil fotoğrafını değiştir"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      className="hidden"
                      disabled={loading || uploadingPhoto}
                    />
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F172B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </label>
                )}
                {editProfileOpen && photoPreview && !uploadingPhoto && (
                  <button
                    type="button"
                    onClick={removeProfilePhoto}
                    className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] border border-slate-200 flex items-center justify-center text-red-600 hover:bg-red-50"
                    title="Profil fotoğrafını kaldır"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !isActive;
                      const confirmMsg = next
                        ? "Profilini öğrencilere görünür yapmak istiyor musun? Referans kodun ile sana ulaşabilecekler."
                        : "Profilini gizlemek istiyor musun? Öğrenciler seni göremeyecek ve referans kodun çalışmayacak.";
                      if (!window.confirm(confirmMsg)) return;
                      try {
                        await api.put("/coach/me/profile", { is_active: next });
                        setIsActive(next);
                        showToast(next ? "Profilin yayında!" : "Profilin gizlendi", "success");
                      } catch {
                        showToast("Durum değiştirilemedi", "error");
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] transition-colors hover:opacity-80 ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                    }`}
                    title={isActive ? "Tıkla: profili gizle" : "Tıkla: profili yayınla"}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                    {isActive ? "Yayında" : "Gizli"}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {editProfileOpen && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] bg-amber-50 text-amber-700 border border-amber-200">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Düzenleme Modu
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={fullName || ""}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ad Soyad"
                  disabled={loading || !editProfileOpen}
                  className="w-full text-[30px] lg:text-[32px] font-black text-[#0F172B] leading-[1.1] tracking-tight bg-transparent border-none outline-none disabled:cursor-default mb-0.5"
                />
                <input
                  type="text"
                  value={title || ""}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Elit Performans Koçu"
                  disabled={loading || !editProfileOpen}
                  className="w-full text-sm font-semibold text-[#3E9E8E] bg-transparent border-none outline-none disabled:cursor-default mb-2"
                />
                <div className="flex items-center gap-2 text-xs text-[#62748E]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2C5.79 2 4 3.79 4 6C4 10 8 14 8 14C8 14 12 10 12 6C12 3.79 10.21 2 8 2Z" stroke="currentColor" strokeWidth="1.33" />
                    <circle cx="8" cy="7" r="1" stroke="currentColor" strokeWidth="1.33"/>
                  </svg>
                  <span className="font-medium">{location}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 lg:pb-1">
              {!editProfileOpen ? (
                <>
                  <button
                    onClick={handlePreviewPublicProfile}
                    className="inline-flex items-center gap-2 px-4 h-10 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-[#0F172B] hover:border-slate-300 hover:bg-slate-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Önizle
                  </button>
                  <button
                    onClick={handleEditProfile}
                    disabled={savingProfile || loading}
                    className="inline-flex items-center gap-2 px-5 h-10 rounded-lg text-sm font-bold text-white bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] hover:shadow-lg hover:shadow-[#3E9E8E]/25 transition-all disabled:opacity-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Profili Düzenle
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-2 px-4 h-10 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || loading || !hasChanges}
                    className="inline-flex items-center gap-2 px-5 h-10 rounded-lg text-sm font-bold text-white bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] hover:shadow-lg hover:shadow-[#3E9E8E]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Değişiklikleri Kaydet
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3E9E8E]/15 to-[#3E9E8E]/5 flex items-center justify-center flex-shrink-0 border border-[#3E9E8E]/10">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3E9E8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1z" />
                  <path d="M9 3v4M15 3v4" />
                </svg>
              </div>
              <div>
                <div className="text-[22px] font-black text-[#0F172B] leading-none tracking-tight">{packages.length}</div>
                <div className="text-[10px] font-bold text-[#62748E] uppercase tracking-[0.1em] mt-1">Paket</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0 border border-amber-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7"/>
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                </svg>
              </div>
              <div>
                <div className="text-[22px] font-black text-[#0F172B] leading-none tracking-tight">{certificates.length}</div>
                <div className="text-[10px] font-bold text-[#62748E] uppercase tracking-[0.1em] mt-1">Sertifika</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div>
                <div className="text-[22px] font-black text-[#0F172B] leading-none tracking-tight">{toArrayFromComma(specialties).length}</div>
                <div className="text-[10px] font-bold text-[#62748E] uppercase tracking-[0.1em] mt-1">Uzmanlık</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 flex items-center justify-center flex-shrink-0 border border-fuchsia-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="m21 15-5-5L5 21"/>
                </svg>
              </div>
              <div>
                <div className="text-[22px] font-black text-[#0F172B] leading-none tracking-tight">{photos.length}</div>
                <div className="text-[10px] font-bold text-[#62748E] uppercase tracking-[0.1em] mt-1">Galeri</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {pkgError && !createPackageOpen && !editOpen && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {pkgError}
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left Side - Profile Card */}
        <div className="flex flex-col w-full lg:w-[340px] gap-5">
          {/* Contact Card */}
          <div className="bg-white rounded-[18px] p-6 shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)] border border-slate-100">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
              <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#0F172B]">İletişim</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {/* Email */}
              <div className={`group flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
                editProfileOpen ? "border-slate-200 bg-white hover:border-[#3E9E8E]/40 focus-within:border-[#3E9E8E] focus-within:ring-2 focus-within:ring-[#3E9E8E]/15" : "border-slate-100 bg-slate-50/60"
              }`}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-200/80">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email || ""}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  disabled={loading || !editProfileOpen}
                  className="flex-1 text-sm font-semibold text-[#0F172B] bg-transparent border-none outline-none disabled:cursor-default min-w-0"
                />
              </div>

              {/* Profile URL */}
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3E9E8E]/15 to-[#3E9E8E]/5 flex items-center justify-center flex-shrink-0 border border-[#3E9E8E]/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3E9E8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <span className="flex-1 text-xs font-semibold text-[#0F172B] truncate">
                  fithub.com/coach/{(fullName || "coach").toLowerCase().replace(/\s+/g, '-')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const slug = (fullName || "coach").toLowerCase().replace(/\s+/g, '-');
                    navigator.clipboard?.writeText(`${window.location.origin}/coach/${slug}`);
                    showToast("Profil bağlantısı kopyalandı", "success");
                  }}
                  className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-[#3E9E8E] hover:bg-white transition-colors"
                  title="Bağlantıyı kopyala"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Referral Code Card */}
          {referralCode && (
            <div className="bg-gradient-to-br from-[#3E9E8E]/5 to-white rounded-[18px] p-5 shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)] border border-[#3E9E8E]/20">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
                <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#0F172B]">Referans Kodu</h3>
              </div>
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-white border border-[#3E9E8E]/20">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3E9E8E]/15 to-[#3E9E8E]/5 flex items-center justify-center flex-shrink-0 border border-[#3E9E8E]/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3E9E8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                    <line x1="12" y1="11" x2="12" y2="17"/>
                    <line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                </div>
                <span className="flex-1 text-lg font-black tracking-wider text-[#0F172B]">{referralCode}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(referralCode);
                    showToast("Referans kodu kopyalandı", "success");
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white text-xs font-bold hover:shadow-md transition-all"
                >
                  Kopyala
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">Bu kodu öğrencilerinle paylaş. Onboarding'de girerek sana direkt ulaşırlar.</p>
            </div>
          )}

          {/* Social Profiles Card */}
          <div className="bg-white rounded-[18px] p-6 shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)] border border-slate-100">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
              <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#0F172B]">Sosyal Profiller</h3>
            </div>
            <div className="flex flex-col gap-2">
              {/* Instagram */}
              <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                editProfileOpen ? "border border-slate-200 hover:border-pink-300 focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-400/15" : "border border-transparent hover:bg-slate-50"
              }`}>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={instagram || ""}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@alextrainer"
                  disabled={loading || !editProfileOpen}
                  className="flex-1 text-sm font-semibold text-[#0F172B] bg-transparent border-none outline-none disabled:cursor-default min-w-0"
                />
              </div>

              {/* Twitter/X */}
              <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                editProfileOpen ? "border border-slate-200 hover:border-slate-400 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10" : "border border-transparent hover:bg-slate-50"
              }`}>
                <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={twitter || ""}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@alex_fit"
                  disabled={loading || !editProfileOpen}
                  className="flex-1 text-sm font-semibold text-[#0F172B] bg-transparent border-none outline-none disabled:cursor-default min-w-0"
                />
              </div>

              {/* LinkedIn */}
              <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                editProfileOpen ? "border border-slate-200 hover:border-[#0A66C2]/40 focus-within:border-[#0A66C2] focus-within:ring-2 focus-within:ring-[#0A66C2]/15" : "border border-transparent hover:bg-slate-50"
              }`}>
                <div className="w-9 h-9 rounded-lg bg-[#0A66C2] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={linkedin || ""}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="in/koçadı"
                  disabled={loading || !editProfileOpen}
                  className="flex-1 text-sm font-semibold text-[#0F172B] bg-transparent border-none outline-none disabled:cursor-default min-w-0"
                />
              </div>

              {/* Website */}
              <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                editProfileOpen ? "border border-slate-200 hover:border-[#3E9E8E]/40 focus-within:border-[#3E9E8E] focus-within:ring-2 focus-within:ring-[#3E9E8E]/15" : "border border-transparent hover:bg-slate-50"
              }`}>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={website || ""}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://siteadresiniz.com"
                  disabled={loading || !editProfileOpen}
                  className="flex-1 text-sm font-semibold text-[#0F172B] bg-transparent border-none outline-none disabled:cursor-default min-w-0"
                />
              </div>
            </div>
          </div>

          {/* Profile Visibility Card */}
          <div className="bg-white rounded-[18px] p-5 shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)] border border-slate-100">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
              <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#0F172B]">Görünürlük</h3>
            </div>
            <label className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
              isActive ? "bg-emerald-50/50 border-emerald-100" : "bg-slate-50 border-slate-200"
            } ${!editProfileOpen ? "cursor-default" : "cursor-pointer"}`}>
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#0F172B] truncate">
                  {isActive ? "Profil herkese açık" : "Profil gizli"}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {isActive ? "Öğrenci uygulamasında görünür" : "Öğrenciler göremez"}
                </div>
              </div>
              <div className="relative inline-block w-11 h-6 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={loading || !editProfileOpen}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#3E9E8E]/20 rounded-full peer peer-checked:bg-gradient-to-br peer-checked:from-[#3E9E8E] peer-checked:to-[#2B7B6E] peer-disabled:opacity-60 peer-disabled:cursor-not-allowed after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:shadow after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
              </div>
            </label>
          </div>

          {/* Media Card (Certificates + Photos tabs) */}
          <div className="bg-white rounded-[18px] shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)] border border-slate-100 overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#0F172B]">Medya</h3>
                </div>
                {mediaTab === "certificates" ? (
                  <label className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    editProfileOpen
                      ? "bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white hover:shadow-md shadow-sm"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCertificateUpload}
                      className="hidden"
                      disabled={loading || !editProfileOpen}
                    />
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    Sertifika
                  </label>
                ) : (
                  photos.length < 20 && (
                    <label className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      editProfileOpen
                        ? "bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white hover:shadow-md shadow-sm"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={loading || !editProfileOpen}/>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      Fotoğraf
                    </label>
                  )
                )}
              </div>

              {/* Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setMediaTab("certificates")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                    mediaTab === "certificates"
                      ? "bg-white text-[#0F172B] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                  </svg>
                  Sertifikalar
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black ${
                    mediaTab === "certificates" ? "bg-[#3E9E8E]/15 text-[#2B7B6E]" : "bg-slate-200 text-slate-500"
                  }`}>{certificates.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMediaTab("photos")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                    mediaTab === "photos"
                      ? "bg-white text-[#0F172B] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="m21 15-5-5L5 21"/>
                  </svg>
                  Galeri
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black ${
                    mediaTab === "photos" ? "bg-[#3E9E8E]/15 text-[#2B7B6E]" : "bg-slate-200 text-slate-500"
                  }`}>{photos.length}</span>
                </button>
              </div>
            </div>

            <div className="px-6 pb-5">
              {mediaTab === "certificates" ? (
                certificates.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {certificates.map((url, index) => (
                      <div key={index} className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                        <img
                          src={url}
                          alt={`Sertifika ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml;utf8," +
                              encodeURIComponent(
                                "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23F1F5F9'/><stop offset='100%' stop-color='%23E2E8F0'/></linearGradient></defs><rect width='160' height='160' rx='12' fill='url(%23g)'/><g stroke='%2394A3B8' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round' transform='translate(56 52)'><rect x='0' y='0' width='48' height='42' rx='6'/><circle cx='14' cy='16' r='4'/><path d='M2 34 L18 22 L30 32 L40 24 L46 28'/></g><text x='80' y='128' text-anchor='middle' font-family='system-ui,-apple-system,Segoe UI,sans-serif' font-size='11' font-weight='600' fill='%2394A3B8'>Yüklenemedi</text></svg>"
                              );
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                        {editProfileOpen && (
                          <button
                            onClick={() => removeCertificate(index)}
                            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-white/90 backdrop-blur text-red-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 flex items-center justify-center shadow-sm"
                            title="Sertifikayı kaldır"
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mb-3 border border-amber-100">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="7"/>
                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Henüz sertifika yok</p>
                    <p className="text-xs text-slate-400 mt-1">{editProfileOpen ? "Yüklemek için yukarıdaki butona bas" : "Düzenleme moduna geç"}</p>
                  </div>
                )
              ) : photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                      <img
                        src={url}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;utf8," +
                            encodeURIComponent(
                              "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23F1F5F9'/><stop offset='100%' stop-color='%23E2E8F0'/></linearGradient></defs><rect width='160' height='160' rx='12' fill='url(%23g)'/><g stroke='%2394A3B8' stroke-width='2.4' fill='none' stroke-linecap='round' stroke-linejoin='round' transform='translate(56 52)'><rect x='0' y='0' width='48' height='42' rx='6'/><circle cx='14' cy='16' r='4'/><path d='M2 34 L18 22 L30 32 L40 24 L46 28'/></g><text x='80' y='128' text-anchor='middle' font-family='system-ui,-apple-system,Segoe UI,sans-serif' font-size='11' font-weight='600' fill='%2394A3B8'>Yüklenemedi</text></svg>"
                            );
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                      {editProfileOpen && (
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-white/90 backdrop-blur text-red-600 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 flex items-center justify-center shadow-sm"
                          title="Kaldır"
                        >
                          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-100 to-fuchsia-50 flex items-center justify-center mb-3 border border-fuchsia-100">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C026D3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="m21 15-5-5L5 21"/>
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Henüz fotoğraf yok</p>
                  <p className="text-xs text-slate-400 mt-1">{editProfileOpen ? "En fazla 20 fotoğraf yükleyebilirsin" : "Düzenleme moduna geç"}</p>
                </div>
              )}
            </div>
          </div>
          </div>

        {/* Right Side - About Me & Packages */}
        <div className="flex flex-col flex-1 gap-5 min-w-0">
          {/* About Me Card */}
          <div className="bg-white rounded-[18px] p-7 shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)] border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
              <div>
                <h3 className="text-[20px] font-black tracking-tight text-[#0F172B] leading-none">Hakkımda</h3>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mt-1">Biyografi & Uzmanlık Alanları</p>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              {/* Bio */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Biyografi</label>
                  {editProfileOpen && (
                    <span className={`text-[11px] font-semibold ${bio.length > 800 ? "text-amber-600" : "text-slate-400"}`}>
                      {bio.length} karakter
                    </span>
                  )}
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={loading || !editProfileOpen}
                  placeholder="Sertifikalı Güç ve Kondisyon Uzmanı (CSCS), 10 yılı aşkın deneyim ile sporculara ve profesyonellere en üst düzey fiziksel performanslarına ulaşmalarında yardımcı oluyor. Yaklaşımım, kanıta dayalı antrenman yöntemlerini sürdürülebilir beslenme alışkanlıklarıyla birleştiriyor."
                  className="w-full min-h-[120px] px-4 py-3 border border-slate-200 rounded-xl text-[15px] font-normal text-slate-700 leading-[1.7] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#3E9E8E]/15 focus:border-[#3E9E8E] disabled:bg-slate-50 disabled:cursor-default transition-all"
                />
              </div>

              {/* Specialties */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">Uzmanlık Alanları</label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3E9E8E]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {toArrayFromComma(specialties).length} seçili
                  </span>
                </div>

                {/* Selected chips row */}
                <div className={`flex flex-wrap gap-1.5 min-h-[42px] p-2.5 rounded-xl border ${
                  editProfileOpen ? "border-dashed border-slate-300 bg-slate-50/60" : "border-transparent bg-transparent"
                }`}>
                  {toArrayFromComma(specialties).length === 0 ? (
                    <span className="text-xs text-slate-400 italic self-center px-1">
                      {editProfileOpen ? "Aşağıdan uzmanlık seç veya özel ekle" : "Henüz uzmanlık eklenmemiş"}
                    </span>
                  ) : (
                    toArrayFromComma(specialties).map((spec, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] rounded-full text-xs font-bold text-white shadow-[0_2px_8px_rgba(62,158,142,0.25)]"
                      >
                        {spec}
                        {editProfileOpen && (
                          <button
                            type="button"
                            onClick={() => {
                              const current = toArrayFromComma(specialties);
                              setSpecialties(current.filter((s) => s !== spec).join(", "));
                            }}
                            className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                            title="Kaldır"
                          >
                            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                              <path d="M2 2L8 8M2 8L8 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </span>
                    ))
                  )}
                </div>

                {/* Preset picker - only in edit mode */}
                {editProfileOpen && (
                  <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-4 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3E9E8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-600">
                          Hızlı Seçim
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {SPECIALTY_PRESETS.map((preset) => {
                          const selected = toArrayFromComma(specialties).includes(preset);
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                const current = toArrayFromComma(specialties);
                                if (selected) {
                                  setSpecialties(current.filter((s) => s !== preset).join(", "));
                                } else {
                                  setSpecialties([...current, preset].join(", "));
                                }
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                                selected
                                  ? "bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white border border-[#2B7B6E] shadow-[0_2px_8px_rgba(62,158,142,0.3)]"
                                  : "bg-white text-slate-600 border border-slate-200 hover:border-[#3E9E8E]/50 hover:text-[#3E9E8E] hover:shadow-sm"
                              }`}
                            >
                              {selected ? (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              ) : (
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                              )}
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom add */}
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2 mb-2.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3E9E8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-600">
                          Özel Uzmanlık Ekle
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={specialtyInput}
                          onChange={(e) => setSpecialtyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = specialtyInput.trim();
                              if (!val) return;
                              const current = toArrayFromComma(specialties);
                              if (!current.includes(val)) {
                                setSpecialties([...current, val].join(", "));
                              }
                              setSpecialtyInput("");
                            }
                          }}
                          placeholder="Örn: TRX, Kickboks, Sırt Rehabilitasyonu"
                          className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3E9E8E]/15 focus:border-[#3E9E8E]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = specialtyInput.trim();
                            if (!val) return;
                            const current = toArrayFromComma(specialties);
                            if (!current.includes(val)) {
                              setSpecialties([...current, val].join(", "));
                            }
                            setSpecialtyInput("");
                          }}
                          disabled={!specialtyInput.trim()}
                          className="inline-flex items-center gap-1 px-3.5 py-2 bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white rounded-lg text-xs font-bold hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 2V10M2 6H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                          Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Packages Card */}
          <div className="bg-white rounded-[18px] p-7 shadow-[0_1px_3px_rgba(15,23,43,0.04),0_8px_24px_rgba(15,23,43,0.04)] border border-slate-100">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[20px] font-black tracking-tight text-[#0F172B] leading-none">Paketlerim</h3>
                    {!pkgLoading && packages.length > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 bg-[#3E9E8E]/10 text-[#2B7B6E] rounded-full text-[11px] font-black">
                        {packages.length}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mt-1">Sunduğun Koçluk Planları</p>
                </div>
              </div>
              <button
                onClick={() => setCreatePackageOpen(true)}
                className="inline-flex items-center gap-2 px-4 h-10 bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#3E9E8E]/25 transition-all shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                Yeni Paket
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {pkgLoading ? (
                <div className="py-12 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-[#3E9E8E] rounded-full animate-spin"></div>
                  <p className="mt-3 text-xs font-semibold text-slate-500">Paketler yükleniyor...</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="py-12 px-6 rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-white text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3E9E8E]/15 to-[#3E9E8E]/5 mb-3 border border-[#3E9E8E]/10">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3E9E8E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1z" />
                      <path d="M9 3v4M15 3v4" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1">Henüz paket oluşturmadın</p>
                  <p className="text-xs text-slate-500 mb-4">İlk paketini oluştur ve öğrencilerine sunmaya başla.</p>
                  <button
                    onClick={() => setCreatePackageOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#3E9E8E] to-[#2B7B6E] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#3E9E8E]/25 transition-all"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    </svg>
                    İlk Paketini Oluştur
                  </button>
                </div>
              ) : (
                packages.map((p) => {
                  const durationMonths = p.duration_months ?? (p.duration_days ? Math.round(p.duration_days / 30) : 1);
                  const originalPrice = parseFloat(p.price) || 0;
                  const discount = parseFloat(p.discount_percentage) || 0;
                  const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
                  const hasDiscount = discount > 0;
                  const services = Array.isArray(p.services) ? p.services : [];

                  return (
                    <div
                      key={p.id}
                      className={`group relative rounded-2xl border transition-all overflow-hidden ${
                        p.is_active
                          ? "bg-white border-slate-200 hover:border-[#3E9E8E]/40 hover:shadow-[0_6px_24px_rgba(62,158,142,0.12)]"
                          : "bg-slate-50/60 border-slate-200"
                      }`}
                    >
                      {/* Left accent stripe for active */}
                      {p.is_active && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#3E9E8E] to-[#2B7B6E]" />
                      )}

                      <div className="p-4 pl-5 flex gap-4">
                        {/* Image / Placeholder */}
                        <div className="flex-shrink-0">
                          {p.image_url ? (
                            <img src={p.image_url} alt="" className="w-[88px] h-[88px] rounded-xl object-cover border border-slate-200" />
                          ) : (
                            <div className="w-[88px] h-[88px] rounded-xl bg-gradient-to-br from-[#3E9E8E]/15 via-[#3E9E8E]/8 to-[#3E9E8E]/5 flex items-center justify-center border border-[#3E9E8E]/10">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3E9E8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1z" />
                                <path d="M9 3v4M15 3v4" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Top row: title + status */}
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="min-w-0">
                              <h5 className="text-[16px] font-black text-[#0F172B] truncate tracking-tight">
                                {p.name}
                              </h5>
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                {durationMonths} aylık program
                              </p>
                            </div>
                            <span
                              className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                p.is_active
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                              {p.is_active ? "Aktif" : "Pasif"}
                            </span>
                          </div>

                          {/* Price row */}
                          <div className="flex items-baseline gap-2 mb-2.5 flex-wrap">
                            {hasDiscount ? (
                              <>
                                <span className="text-[22px] font-black text-[#0F172B] tracking-tight leading-none">
                                  {formatTry(discountedPrice)} ₺
                                </span>
                                <span className="text-[13px] text-slate-400 line-through font-medium">
                                  {formatTry(originalPrice)} ₺
                                </span>
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-md text-[10px] font-black shadow-sm">
                                  %{discount.toFixed(0)} İNDİRİM
                                </span>
                              </>
                            ) : (
                              <span className="text-[22px] font-black text-[#0F172B] tracking-tight leading-none">
                                {formatTry(originalPrice)} ₺
                              </span>
                            )}
                          </div>

                          {/* Description (optional) */}
                          {p.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mb-2.5 leading-relaxed">
                              {p.description}
                            </p>
                          )}

                          {/* Service chips */}
                          {services.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {services.slice(0, 4).map((svc, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#3E9E8E]/8 text-[#2B7B6E] rounded-md text-[10px] font-bold border border-[#3E9E8E]/15"
                                >
                                  {SERVICE_ICONS[svc] && (
                                    <span className="text-[#3E9E8E]">{SERVICE_ICONS[svc]}</span>
                                  )}
                                  {svc}
                                </span>
                              ))}
                              {services.length > 4 && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                                  +{services.length - 4} daha
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(p)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#3E9E8E]/10 text-slate-500 hover:text-[#3E9E8E] transition-colors"
                            title="Paketi düzenle"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`"${p.name}" paketini silmek istediğinize emin misiniz?`)) {
                                deletePackage(p.id);
                              }
                            }}
                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                            title="Paketi sil"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Create Package Modal */}
      {createPackageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#F8FAFC] to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#155DFC] to-[#4F8EF7] flex items-center justify-center shadow-sm">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a1 1 0 0 0-1-1z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 3v4M15 3v4" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Yeni Paket Oluştur</h3>
                  <p className="text-xs text-gray-500">Öğrencilerine sunacağın koçluk planını tanımla</p>
                </div>
              </div>
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => { setCreatePackageOpen(false); setPkgError(""); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form
              className="flex flex-col flex-1 min-h-0"
              onSubmit={(e) => { e.preventDefault(); if (!creating && newPkg.name.trim()) createPackage(); }}
            >
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {pkgError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {pkgError}
                  </div>
                )}

                {/* Görsel */}
                <div>
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Kapak Görseli</span>
                    <span className="text-[10px] text-gray-400">İsteğe bağlı</span>
                  </label>
                  {newPkg.image_url ? (
                    <div className="relative h-32 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={newPkg.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => setNewPkg(p => ({...p, image_url: ""}))}
                        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                        title="Görseli kaldır"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#155DFC] hover:bg-[#EFF6FF]/50 transition-all group">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 group-hover:text-[#155DFC] mb-1">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs text-gray-500 group-hover:text-[#155DFC] font-medium">Görsel yükle</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG — Maks 10MB</span>
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (!file.type.startsWith("image/")) { showToast("Lütfen bir görsel dosyası seçin.", "error"); return; }
                        if (file.size > 10 * 1024 * 1024) { showToast("Dosya boyutu max 10MB olabilir.", "error"); return; }
                        try { const result = await uploadImage(file); setNewPkg(p => ({...p, image_url: result.url})); } catch { showToast("Görsel yüklenemedi.", "error"); }
                      }} />
                    </label>
                  )}
                </div>

                {/* Temel Bilgiler section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Temel Bilgiler</span>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Paket Adı *</label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] transition-all"
                      value={newPkg.name}
                      onChange={(e) => setNewPkg(s => ({ ...s, name: e.target.value }))}
                      placeholder="Örn: 1 Aylık Online Koçluk"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Açıklama</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] min-h-[72px] resize-none transition-all"
                      value={newPkg.description}
                      onChange={(e) => setNewPkg(s => ({ ...s, description: e.target.value }))}
                      placeholder="Bu pakette öğrenci neler elde edecek? Kısaca anlat..."
                    />
                  </div>
                </div>

                {/* Süre, Fiyat, İndirim */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fiyatlandırma</span>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Süre</label>
                      <div className="relative">
                        <input
                          className="w-full rounded-lg border border-gray-200 pl-3.5 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] transition-all"
                          type="number"
                          min={1}
                          value={newPkg.duration_months}
                          onChange={(e) => setNewPkg(s => ({ ...s, duration_months: e.target.value }))}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">ay</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fiyat</label>
                      <div className="relative">
                        <input
                          className="w-full rounded-lg border border-gray-200 pl-3.5 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] transition-all"
                          type="number"
                          min={0}
                          step="0.01"
                          value={newPkg.price}
                          onChange={(e) => setNewPkg(s => ({ ...s, price: e.target.value }))}
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">₺</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">İndirim</label>
                      <div className="relative">
                        <input
                          className="w-full rounded-lg border border-gray-200 pl-3.5 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] transition-all"
                          type="number"
                          min={0}
                          max={100}
                          value={newPkg.discount_percentage}
                          onChange={(e) => setNewPkg(s => ({ ...s, discount_percentage: e.target.value }))}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Fiyat özeti */}
                  {(parseFloat(newPkg.price) > 0) && (
                    <div className="rounded-lg bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]/40 border border-[#BFDBFE] px-3.5 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-[#1E40AF] font-medium">Öğrencinin ödeyeceği:</span>
                      <div className="flex items-baseline gap-2">
                        {parseFloat(newPkg.discount_percentage) > 0 ? (
                          <>
                            <span className="text-[11px] text-gray-500 line-through">{formatTry(parseFloat(newPkg.price))} ₺</span>
                            <span className="text-base font-bold text-[#155DFC]">
                              {formatTry(parseFloat(newPkg.price) * (1 - parseFloat(newPkg.discount_percentage) / 100))} ₺
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-bold text-[#155DFC]">{formatTry(parseFloat(newPkg.price))} ₺</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dahil Hizmetler */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Dahil Hizmetler
                      {Array.isArray(newPkg.services) && newPkg.services.length > 0 && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0 bg-[#155DFC] text-white rounded-full text-[9px]">
                          {newPkg.services.length}
                        </span>
                      )}
                    </span>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_TAGS.map((tag) => {
                      const isSelected = Array.isArray(newPkg.services) && newPkg.services.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const cur = Array.isArray(newPkg.services) ? newPkg.services : [];
                            setNewPkg(s => ({ ...s, services: isSelected ? cur.filter(t => t !== tag) : [...cur, tag] }));
                          }}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all ${
                            isSelected
                              ? "bg-gradient-to-br from-[#155DFC] to-[#2563EB] text-white shadow-sm ring-2 ring-[#155DFC]/30"
                              : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#155DFC]/40 hover:bg-white"
                          }`}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                            isSelected ? "bg-white/20" : "bg-white border border-gray-200"
                          }`}>
                            <span className={isSelected ? "text-white" : "text-[#155DFC]"}>
                              {SERVICE_ICONS[tag] || (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                          </span>
                          <span className="flex-1 truncate">{tag}</span>
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="flex-shrink-0">
                              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Aktif toggle */}
                <label className="flex items-center justify-between gap-3 cursor-pointer bg-gray-50/60 border border-gray-100 rounded-lg p-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${newPkg.is_active ? "bg-[#DCFCE7]" : "bg-gray-100"}`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={newPkg.is_active ? "#15803D" : "#9CA3AF"} strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Paket aktif olsun</div>
                      <div className="text-xs text-gray-500">Pasif olursa öğrenciler satın alamaz</div>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={!!newPkg.is_active}
                      onChange={(e) => setNewPkg(s => ({ ...s, is_active: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-[#155DFC]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#155DFC]"></div>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => { setCreatePackageOpen(false); setPkgError(""); }}
                  disabled={creating}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-[#155DFC] to-[#2563EB] text-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                  disabled={creating || !newPkg.name.trim()}
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Paketi Oluştur
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {editOpen && editPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#F8FAFC] to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#155DFC] to-[#4F8EF7] flex items-center justify-center shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Paketi Düzenle</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[280px]">{editPkg.name || "Paket detaylarını güncelle"}</p>
                </div>
              </div>
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => {
                  setEditOpen(false);
                  setEditPkg(null);
                  setPkgError("");
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <form
              className="flex flex-col flex-1 min-h-0"
              onSubmit={(e) => {
                e.preventDefault();
                if (!editSaving && editPkg?.name.trim()) {
                  updatePackage();
                }
              }}
            >
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {pkgError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {pkgError}
                  </div>
                )}

                {/* Görsel */}
                <div>
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Kapak Görseli</span>
                    <span className="text-[10px] text-gray-400">İsteğe bağlı</span>
                  </label>
                  {editPkg.image_url ? (
                    <div className="relative h-32 rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={editPkg.image_url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => setEditPkg((p) => ({ ...p, image_url: "" }))}
                        className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
                        title="Görseli kaldır"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-[#155DFC] hover:bg-[#EFF6FF]/50 transition-all group">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 group-hover:text-[#155DFC] mb-1">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs text-gray-500 group-hover:text-[#155DFC] font-medium">Görsel yükle</span>
                      <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG — Maks 10MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          if (!file.type.startsWith("image/")) { showToast("Lütfen bir görsel dosyası seçin.", "error"); return; }
                          if (file.size > 10 * 1024 * 1024) { showToast("Dosya boyutu max 10MB olabilir.", "error"); return; }
                          try {
                            const result = await uploadImage(file);
                            setEditPkg((p) => ({ ...p, image_url: result.url }));
                          } catch {
                            showToast("Görsel yüklenemedi.", "error");
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Temel Bilgiler */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Temel Bilgiler</span>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Paket Adı *</label>
                    <input
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] transition-all"
                      value={editPkg.name}
                      onChange={(e) => setEditPkg((s) => ({ ...s, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Açıklama</label>
                    <textarea
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] min-h-[72px] resize-none transition-all"
                      value={editPkg.description || ""}
                      onChange={(e) => setEditPkg((s) => ({ ...s, description: e.target.value }))}
                      placeholder="Bu pakette öğrenci neler elde edecek? Kısaca anlat..."
                    />
                  </div>
                </div>

                {/* Fiyatlandırma */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fiyatlandırma</span>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Süre</label>
                      <div className="relative">
                        <input
                          className="w-full rounded-lg border border-gray-200 pl-3.5 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] transition-all"
                          type="number"
                          min={1}
                          value={editPkg.duration_months}
                          onChange={(e) => setEditPkg((s) => ({ ...s, duration_months: e.target.value }))}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">ay</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fiyat</label>
                      <div className="relative">
                        <input
                          className="w-full rounded-lg border border-gray-200 pl-3.5 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] transition-all"
                          type="number"
                          min={0}
                          step="0.01"
                          value={editPkg.price}
                          onChange={(e) => setEditPkg((s) => ({ ...s, price: e.target.value }))}
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">₺</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">İndirim</label>
                      <div className="relative">
                        <input
                          className="w-full rounded-lg border border-gray-200 pl-3.5 pr-10 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] transition-all"
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={editPkg.discount_percentage}
                          onChange={(e) => setEditPkg((s) => ({ ...s, discount_percentage: e.target.value }))}
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Fiyat özeti */}
                  {(parseFloat(editPkg.price) > 0) && (
                    <div className="rounded-lg bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE]/40 border border-[#BFDBFE] px-3.5 py-2.5 flex items-center justify-between">
                      <span className="text-xs text-[#1E40AF] font-medium">Öğrencinin ödeyeceği:</span>
                      <div className="flex items-baseline gap-2">
                        {parseFloat(editPkg.discount_percentage) > 0 ? (
                          <>
                            <span className="text-[11px] text-gray-500 line-through">{formatTry(parseFloat(editPkg.price))} ₺</span>
                            <span className="text-base font-bold text-[#155DFC]">
                              {formatTry(parseFloat(editPkg.price) * (1 - parseFloat(editPkg.discount_percentage) / 100))} ₺
                            </span>
                          </>
                        ) : (
                          <span className="text-base font-bold text-[#155DFC]">{formatTry(parseFloat(editPkg.price))} ₺</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dahil Hizmetler */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Dahil Hizmetler
                      {Array.isArray(editPkg.services) && editPkg.services.length > 0 && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0 bg-[#155DFC] text-white rounded-full text-[9px]">
                          {editPkg.services.length}
                        </span>
                      )}
                    </span>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_TAGS.map((tag) => {
                      const isSelected = Array.isArray(editPkg.services) && editPkg.services.includes(tag);
                      const isDisabled = !isSelected && Array.isArray(editPkg.services) && editPkg.services.length >= 12;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (isDisabled) return;
                            const currentServices = Array.isArray(editPkg.services) ? editPkg.services : [];
                            if (isSelected) {
                              setEditPkg((s) => ({ ...s, services: currentServices.filter((t) => t !== tag) }));
                            } else {
                              setEditPkg((s) => ({ ...s, services: [...currentServices, tag] }));
                            }
                          }}
                          disabled={isDisabled}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-all ${
                            isSelected
                              ? "bg-gradient-to-br from-[#155DFC] to-[#2563EB] text-white shadow-sm ring-2 ring-[#155DFC]/30"
                              : isDisabled
                              ? "bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed"
                              : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-[#155DFC]/40 hover:bg-white"
                          }`}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center ${
                            isSelected ? "bg-white/20" : "bg-white border border-gray-200"
                          }`}>
                            <span className={isSelected ? "text-white" : isDisabled ? "text-gray-300" : "text-[#155DFC]"}>
                              {SERVICE_ICONS[tag] || (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                          </span>
                          <span className="flex-1 truncate">{tag}</span>
                          {isSelected && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="flex-shrink-0">
                              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {Array.isArray(editPkg.services) && editPkg.services.length >= 12 && (
                    <p className="text-xs text-amber-600">Maksimum 12 hizmet seçildi.</p>
                  )}
                </div>

                {/* Aktif toggle */}
                <label className="flex items-center justify-between gap-3 cursor-pointer bg-gray-50/60 border border-gray-100 rounded-lg p-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${editPkg.is_active ? "bg-[#DCFCE7]" : "bg-gray-100"}`}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={editPkg.is_active ? "#15803D" : "#9CA3AF"} strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Paket aktif</div>
                      <div className="text-xs text-gray-500">Pasif olursa öğrenciler satın alamaz</div>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={!!editPkg.is_active}
                      onChange={(e) => setEditPkg((s) => ({ ...s, is_active: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-[#155DFC]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#155DFC]"></div>
                  </div>
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    setEditOpen(false);
                    setEditPkg(null);
                    setPkgError("");
                  }}
                  disabled={editSaving}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-[#155DFC] to-[#2563EB] text-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                  disabled={editSaving || !editPkg.name.trim()}
                >
                  {editSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Değişiklikleri Kaydet
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
}
