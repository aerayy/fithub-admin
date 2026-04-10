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
    <div className="w-full max-w-[1024px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[30px] font-bold text-[#0F172B] leading-[36px] tracking-[0.395508px] mb-1">
            Koç Profili
          </h2>
          <p className="text-base text-[#62748E] leading-6 tracking-[-0.3125px]">
            Herkese açık profilinizi ve koç ayarlarınızı yönetin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePreviewPublicProfile}
            className="flex items-center justify-center px-4 py-2 h-9 bg-white border border-black/10 rounded-lg text-sm font-medium text-[#0A0A0A] hover:bg-gray-50"
          >
            Herkese Açık Profili Önizle
          </button>
          <button
            onClick={editProfileOpen ? handleSaveProfile : handleEditProfile}
            disabled={savingProfile || loading || (editProfileOpen && !hasChanges)}
            className="flex items-center justify-center px-4 py-2 h-9 bg-[#155DFC] rounded-lg text-sm font-medium text-white hover:bg-[#1350e0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingProfile ? "Kaydediliyor..." : editProfileOpen ? "Değişiklikleri Kaydet" : "Profili Düzenle"}
          </button>
          {editProfileOpen && (
            <button
              onClick={handleCancelEdit}
              className="flex items-center justify-center px-4 py-2 h-9 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              İptal
            </button>
          )}
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
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Profile Card */}
        <div className="flex flex-col w-full lg:w-80 gap-6">
          {/* Profile Info Card */}
          <div className="bg-white rounded-[14px] p-6 shadow-sm">
            <div className="flex flex-col items-center">
              {/* Profile Photo */}
              <div className="relative group mb-4">
                <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden cursor-pointer relative">
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
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {/* Upload spinner */}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  {editProfileOpen && !uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                      <span className="text-white text-xs font-medium">Fotoğrafı Değiştir</span>
                    </div>
                  )}
                </div>
                {/* Dropdown Menu */}
                {editProfileOpen && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <label className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        className="hidden"
                        disabled={loading || uploadingPhoto}
                      />
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-600">
                          <path d="M8 11V5M5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <path d="M2 4C2 3.44772 2.44772 3 3 3H13C13.5523 3 14 3.44772 14 4V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        Fotoğraf Yükle
                      </span>
                    </label>
                    {photoPreview && (
                      <button
                        onClick={removeProfilePhoto}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-red-600">
                          <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Fotoğrafı Kaldır
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Name */}
              <input
                type="text"
                value={fullName || ""}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ad Soyad"
                disabled={loading || !editProfileOpen}
                className="text-center text-xl font-bold text-[#0F172B] mb-2 bg-transparent border-none outline-none disabled:cursor-default w-full"
              />

              {/* Title */}
              <input
                type="text"
                value={title || ""}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Elit Performans Koçu"
                disabled={loading || !editProfileOpen}
                className="text-center text-base font-medium text-[#62748E] mb-4 bg-transparent border-none outline-none disabled:cursor-default w-full"
              />

              {/* Location */}
              <div className="flex items-center gap-2 mb-4">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#62748E]">
                  <path d="M8 2C5.79 2 4 3.79 4 6C4 10 8 14 8 14C8 14 12 10 12 6C12 3.79 10.21 2 8 2Z" stroke="currentColor" strokeWidth="1.33" />
                  <path d="M8 8C8.552 8 9 7.552 9 7C9 6.448 8.552 6 8 6C7.448 6 7 6.448 7 7C7 7.552 7.448 8 8 8Z" stroke="currentColor" strokeWidth="1.33" />
                </svg>
                <span className="text-sm text-[#62748E]">{location}</span>
              </div>

              {/* Email */}
              <div className="w-full mb-3">
                <div className="relative flex items-center bg-white border border-black/10 rounded-lg px-4 py-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#90A1B9] mr-3">
                    <path d="M2 4L8 8L14 4" stroke="currentColor" strokeWidth="1.33" />
                    <path d="M2 6L8 10L14 6" stroke="currentColor" strokeWidth="1.33" />
                  </svg>
                  <input
                    type="email"
                    value={email || ""}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    disabled={loading || !editProfileOpen}
                    className="flex-1 text-sm font-medium text-[#0A0A0A] bg-transparent border-none outline-none disabled:cursor-default"
                  />
                </div>
              </div>
              
              {/* Profile URL */}
              <div className="w-full">
                <div className="relative flex items-center bg-white border border-black/10 rounded-lg px-4 py-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#90A1B9] mr-3">
                    <path d="M6.67 6.67L9.33 9.33M9.33 6.67L6.67 9.33" stroke="currentColor" strokeWidth="1.33" />
                    <path d="M8 2C4.69 2 2 4.69 2 8C2 11.31 4.69 14 8 14C11.31 14 14 11.31 14 8C14 4.69 11.31 2 8 2Z" stroke="currentColor" strokeWidth="1.33" />
                  </svg>
                  <span className="flex-1 text-sm font-medium text-[#0A0A0A]">
                    fithub.com/coach/{(fullName || "coach").toLowerCase().replace(/\s+/g, '-')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Profiles Card */}
          <div className="bg-white rounded-[14px] p-6 shadow-sm">
            <h4 className="text-base font-medium text-[#0A0A0A] mb-4">Sosyal Profiller</h4>
            <div className="flex flex-col gap-4">
              {/* Instagram */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F8FAFC]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#45556C]">
                    <path d="M10 2C6.48 2 3.5 4.98 3.5 8.5C3.5 12.02 6.48 15 10 15C13.52 15 16.5 12.02 16.5 8.5C16.5 4.98 13.52 2 10 2ZM10 13C7.79 13 6 11.21 6 9C6 6.79 7.79 5 10 5C12.21 5 14 6.79 14 9C14 11.21 12.21 13 10 13Z" stroke="currentColor" strokeWidth="1.67" />
                    <circle cx="10" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.67" />
                    <circle cx="13" cy="6" r="0.5" fill="currentColor" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={instagram || ""}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@alextrainer"
                  disabled={loading || !editProfileOpen}
                  className="flex-1 text-sm font-medium text-[#0A0A0A] bg-transparent border-none outline-none disabled:cursor-default"
                />
              </div>

              {/* Twitter/X */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F8FAFC]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#45556C]">
                    <path d="M18 4L11 11L12 16L6 10L2 11L9 4H18Z" stroke="currentColor" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={twitter || ""}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@alex_fit"
                  disabled={loading || !editProfileOpen}
                  className="flex-1 text-sm font-medium text-[#0A0A0A] bg-transparent border-none outline-none disabled:cursor-default"
                />
              </div>

              {/* LinkedIn */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F8FAFC]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#45556C]">
                    <path d="M4 6H2V18H4V6Z" stroke="currentColor" strokeWidth="1.67" />
                    <path d="M3 4C3.828 4 4.5 3.328 4.5 2.5C4.5 1.672 3.828 1 3 1C2.172 1 1.5 1.672 1.5 2.5C1.5 3.328 2.172 4 3 4Z" stroke="currentColor" strokeWidth="1.67" />
                    <path d="M7.5 6V18H9.5V12C9.5 10 11 9 12.5 9C14 9 15.5 10 15.5 12V18H17.5V11C17.5 8 15.5 6 13 6C11.5 6 10.5 7 10 7.5V6H7.5Z" stroke="currentColor" strokeWidth="1.67" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={linkedin || ""}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="in/koçadı"
                  disabled={loading || !editProfileOpen}
                  className="flex-1 text-sm font-medium text-[#0A0A0A] bg-transparent border-none outline-none disabled:cursor-default"
                />
              </div>

              {/* Website */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F8FAFC]">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#45556C]">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.67" />
                    <path d="M2 10H18M10 2C12 5 12 15 10 18M10 2C8 5 8 15 10 18" stroke="currentColor" strokeWidth="1.67" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={website || ""}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://siteadresiniz.com"
                  disabled={loading || !editProfileOpen}
                  className="flex-1 text-sm font-medium text-[#0A0A0A] bg-transparent border-none outline-none disabled:cursor-default"
                />
              </div>
            </div>
          </div>

            {/* Profile Visibility Card */}
            <div className="bg-white rounded-[14px] shadow-sm p-6">
              <h4 className="text-base font-medium text-[#0A0A0A] mb-4">Profil Görünürlüğü</h4>
              <div className="space-y-4">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <div>
                    <div className="text-sm font-semibold text-[#0A0A0A]">
                      {isActive ? "Profil görüntüleniyor" : "Profil görüntülenmiyor"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isActive
                        ? "Profiliniz öğrenci uygulamasında görünür"
                        : "Profiliniz öğrenci uygulamasında gizli"}
                    </div>
                  </div>
                  <div className="relative inline-block w-11 h-6">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      disabled={loading || !editProfileOpen}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#155DFC]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#155DFC]"></div>
                  </div>
                </label>
              </div>
            </div>

            {/* Certificates Card */}
            <div className="bg-white rounded-[14px] shadow-sm p-6">
              <h4 className="text-base font-medium text-[#0A0A0A] mb-4">Sertifikalar</h4>
              <div className="space-y-3">
                {/* Add Certificate */}
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCertificateUpload}
                    className="hidden"
                    disabled={loading || !editProfileOpen}
                  />
                  <div className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 cursor-pointer text-center">
                    Sertifika Yükle
                  </div>
                </label>

                {/* Certificates List */}
                {certificates.length > 0 ? (
                  <div className="space-y-2">
                    {certificates.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <img
                            src={url}
                            alt={`Sertifika ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='sans-serif' font-size='12'%3EImage%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <button
                          onClick={() => removeCertificate(index)}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Sertifikayı kaldır"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M12 4L4 12M4 4L12 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Henüz sertifika eklenmemiş.</p>
                )}
              </div>
            </div>

            {/* Photos Card */}
            <div className="bg-white rounded-[14px] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-base font-medium text-[#0A0A0A]">Fotoğraflar</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{photos.length}/20 fotoğraf</p>
                </div>
                {photos.length < 20 && (
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-black/90 cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Yükle
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img
                        src={url}
                        alt={`Fotoğraf ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-family='sans-serif' font-size='12'%3EYok%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        title="Kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-gray-200">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  <p className="text-sm text-gray-400 mt-2">Henüz fotoğraf eklenmemiş</p>
                </div>
              )}
            </div>
          </div>

        {/* Right Side - About Me & Packages */}
        <div className="flex flex-col flex-1 gap-6">
          {/* About Me Card */}
          <div className="bg-white rounded-[14px] p-6 shadow-sm">
            <h4 className="text-base font-normal text-[#0A0A0A] mb-6">Hakkımda</h4>
            <div className="flex flex-col gap-6">
              {/* Bio */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0A0A0A]">Biyografi</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={loading || !editProfileOpen}
                  placeholder="Sertifikalı Güç ve Kondisyon Uzmanı (CSCS), 10 yılı aşkın deneyim ile sporculara ve profesyonellere en üst düzey fiziksel performanslarına ulaşmalarında yardımcı oluyor. Yaklaşımım, kanıta dayalı antrenman yöntemlerini sürdürülebilir beslenme alışkanlıklarıyla birleştiriyor."
                  className="w-full min-h-[104px] px-4 py-3 border border-gray-200 rounded-lg text-base font-normal text-[#45556C] leading-[26px] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] disabled:bg-gray-50 disabled:cursor-default"
                />
              </div>

              {/* Specialties */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-[#0A0A0A]">Uzmanlık Alanları</label>
                {editProfileOpen && (
                  <input
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC]"
                    value={specialties}
                    onChange={(e) => setSpecialties(e.target.value)}
                    placeholder="Güç, Yağ yakma, Mobilite"
                    disabled={loading}
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  {toArrayFromComma(specialties).map((spec, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-3 py-1 bg-[#F1F5F9] rounded-lg text-xs font-medium text-[#314158]"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active Packages Card */}
          <div className="bg-white rounded-[14px] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-base font-medium text-[#0A0A0A] mb-1">Aktif Paketler</h4>
                <p className="text-base font-normal text-[#717182]">
                  Öğrencilere sattığınız planları yönetin.
                </p>
              </div>
              <button
                onClick={() => setCreatePackageOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-lg text-sm font-medium text-[#0A0A0A] hover:bg-gray-50"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2V14" stroke="currentColor" strokeWidth="1.33" />
                  <path d="M2 8H14" stroke="currentColor" strokeWidth="1.33" />
                </svg>
                Yeni Paket
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {pkgLoading ? (
                <div className="text-sm text-gray-500 py-4">Paketler yükleniyor...</div>
              ) : packages.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">Henüz paket yok. Yeni paket oluşturun.</div>
              ) : (
                packages.map((p) => {
                  const durationMonths = p.duration_months ?? (p.duration_days ? Math.round(p.duration_days / 30) : 1);
                  const originalPrice = parseFloat(p.price) || 0;
                  const discount = parseFloat(p.discount_percentage) || 0;
                  const discountedPrice = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
                  const hasDiscount = discount > 0;

                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-4 bg-[#F8FAFC]/50 border border-[#F1F5F9] rounded-[14px]"
                    >
                      <div className="flex items-center gap-4">
                        {p.image_url ? (
                          <img src={p.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[#DBEAFE]">
                            <span className="text-base font-bold text-[#155DFC]">₺</span>
                          </div>
                        )}
                        <div className="flex flex-col">
                          <h5 className="text-base font-semibold text-[#0F172B] mb-1">
                            {p.name}
                          </h5>
                          <div className="flex items-center gap-2">
                            {hasDiscount ? (
                              <>
                                <span className="text-sm font-medium text-green-600">
                                  {formatTry(discountedPrice)} ₺
                                </span>
                                <span className="text-sm text-[#62748E] line-through">
                                  {formatTry(originalPrice)} ₺
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-[#62748E]">
                                {formatTry(originalPrice)} ₺/mo
                              </span>
                            )}
                            <span className="text-[#62748E]">•</span>
                            <span className="text-sm text-[#62748E]">{durationMonths} ay</span>
                          </div>
                          {Array.isArray(p.services) && p.services.length > 0 && (
                            <div className="mt-1 text-xs text-[#62748E]">
                              Hizmetler: {p.services.slice(0, 3).join(" • ")}
                              {p.services.length > 3 && ` • +${p.services.length - 3}`}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            p.is_active
                              ? "bg-[#00C950] text-white"
                              : "bg-[#E2E8F0] text-[#62748E]"
                          }`}
                        >
                          {p.is_active ? "Aktif" : "Arşivlenmiş"}
                        </span>
                        <button
                          onClick={() => openEdit(p)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
                          title="Düzenle"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#90A1B9]">
                            <path
                              d="M2 8L10 14L14 8"
                              stroke="currentColor"
                              strokeWidth="1.33"
                              strokeLinecap="round"
                            />
                            <path
                              d="M6 4L10 8L6 12"
                              stroke="currentColor"
                              strokeWidth="1.33"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Bu paketi silmek istediğinize emin misiniz?")) {
                              deletePackage(p.id);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-600"
                          title="Paketi sil"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
                          </svg>
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-lg font-semibold">Paket Oluştur</h3>
              <button type="button" className="text-gray-400 hover:text-gray-600" onClick={() => { setCreatePackageOpen(false); setPkgError(""); }}>✕</button>
            </div>

            <form
              className="flex flex-col flex-1 min-h-0"
              onSubmit={(e) => { e.preventDefault(); if (!creating && newPkg.name.trim()) createPackage(); }}
            >
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 space-y-3">
                {pkgError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">{pkgError}</div>
                )}

                {/* Görsel - kompakt */}
                {newPkg.image_url ? (
                  <div className="relative h-24 rounded-xl overflow-hidden border">
                    <img src={newPkg.image_url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setNewPkg(p => ({...p, image_url: ""}))} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs hover:bg-black/80">✕</button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-16 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition">
                    <span className="text-gray-400 text-sm">Görsel yükle (isteğe bağlı)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (!file.type.startsWith("image/")) { showToast("Lütfen bir görsel dosyası seçin.", "error"); return; }
                      if (file.size > 10 * 1024 * 1024) { showToast("Dosya boyutu max 10MB olabilir.", "error"); return; }
                      try { const result = await uploadImage(file); setNewPkg(p => ({...p, image_url: result.url})); } catch { showToast("Görsel yüklenemedi.", "error"); }
                    }} />
                  </label>
                )}

                {/* Paket adı */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Paket adı</label>
                  <input className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10" value={newPkg.name} onChange={(e) => setNewPkg(s => ({ ...s, name: e.target.value }))} placeholder="Örn: 1 Aylık Online Koçluk" required />
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Açıklama (isteğe bağlı)</label>
                  <textarea className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 min-h-[60px]" value={newPkg.description} onChange={(e) => setNewPkg(s => ({ ...s, description: e.target.value }))} placeholder="Pakette neler var?" />
                </div>

                {/* Süre + Fiyat + İndirim — tek satır */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Süre (ay)</label>
                    <input className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10" type="number" min={1} value={newPkg.duration_months} onChange={(e) => setNewPkg(s => ({ ...s, duration_months: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Fiyat (₺)</label>
                    <input className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10" type="number" min={0} step="0.01" value={newPkg.price} onChange={(e) => setNewPkg(s => ({ ...s, price: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">İndirim (%)</label>
                    <input className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10" type="number" min={0} max={100} value={newPkg.discount_percentage} onChange={(e) => setNewPkg(s => ({ ...s, discount_percentage: e.target.value }))} placeholder="0" />
                  </div>
                </div>

                {/* Dahil Hizmetler — 2 sütun grid */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dahil Hizmetler</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SERVICE_TAGS.map((tag) => {
                      const isSelected = Array.isArray(newPkg.services) && newPkg.services.includes(tag);
                      return (
                        <button key={tag} type="button" onClick={() => {
                          const cur = Array.isArray(newPkg.services) ? newPkg.services : [];
                          setNewPkg(s => ({ ...s, services: isSelected ? cur.filter(t => t !== tag) : [...cur, tag] }));
                        }} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${isSelected ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Aktif toggle */}
                <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
                  <div>
                    <div className="text-sm font-semibold">Aktif paket</div>
                    <div className="text-xs text-gray-500">Pasif olursa satışta görünmez.</div>
                  </div>
                  <input type="checkbox" checked={!!newPkg.is_active} onChange={(e) => setNewPkg(s => ({ ...s, is_active: e.target.checked }))} className="h-5 w-5" />
                </label>
              </div>

              {/* Footer — sabit */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t mt-2">
                <button type="button" className="rounded-xl px-4 py-2 text-sm font-semibold border bg-white hover:bg-gray-50" onClick={() => { setCreatePackageOpen(false); setPkgError(""); }} disabled={creating}>
                  İptal
                </button>
                <button type="submit" className="rounded-xl px-4 py-2 text-sm font-semibold bg-black text-white hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed" disabled={creating || !newPkg.name.trim()}>
                  {creating ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {editOpen && editPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white border p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold">Paketi Düzenle</h3>
                <p className="text-sm text-gray-500">Paket detaylarını güncelle.</p>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setEditOpen(false);
                  setEditPkg(null);
                  setPkgError("");
                }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editSaving && editPkg?.name.trim()) {
                  updatePackage();
                }
              }}
            >
              {pkgError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {pkgError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Paket adı</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black/10"
                    value={editPkg.name}
                    onChange={(e) => setEditPkg((s) => ({ ...s, name: e.target.value }))}
                    required
                  />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Açıklama</label>
                <textarea
                  className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black/10 min-h-[110px]"
                  value={editPkg.description || ""}
                  onChange={(e) => setEditPkg((s) => ({ ...s, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Süre (ay)
                  </label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black/10"
                    type="number"
                    min={1}
                    value={editPkg.duration_months}
                    onChange={(e) => setEditPkg((s) => ({ ...s, duration_months: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Fiyat (₺)</label>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black/10"
                    type="number"
                    min={0}
                    step="0.01"
                    value={editPkg.price}
                    onChange={(e) => setEditPkg((s) => ({ ...s, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  İndirim (%) (isteğe bağlı)
                </label>
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-black/10"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={editPkg.discount_percentage}
                  onChange={(e) => setEditPkg((s) => ({ ...s, discount_percentage: e.target.value }))}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Dahil Hizmetler
                </label>
                <p className="text-xs text-gray-500 mb-2">Bu pakete dahil olanları seçin.</p>
                <div className="flex flex-wrap gap-2">
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
                            setEditPkg((s) => ({ ...s, services: currentServices.filter((s) => s !== tag) }));
                          } else {
                            setEditPkg((s) => ({ ...s, services: [...currentServices, tag] }));
                          }
                        }}
                        disabled={isDisabled}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-black text-white"
                            : isDisabled
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {Array.isArray(editPkg.services) && editPkg.services.length >= 12 && (
                  <p className="text-xs text-amber-600 mt-2">Maksimum 12 hizmet seçildi.</p>
                )}
              </div>

              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <div className="text-sm font-semibold">Aktif paket</div>
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
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border bg-white hover:bg-gray-50"
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
                    className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold bg-black text-white hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={editSaving || !editPkg.name.trim()}
                  >
                    {editSaving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
}
