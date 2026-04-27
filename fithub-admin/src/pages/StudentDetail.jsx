import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProgramsTab from "../components/ProgramsTab";
import { api, createCoachConversation, uploadImage } from "../lib/api";
import { useToast } from "../components/Toast";
import { translateError } from "../lib/errorHandler";

const DAYS = [
  { key: "mon", label: "Pzt" },
  { key: "tue", label: "Sal" },
  { key: "wed", label: "Çar" },
  { key: "thu", label: "Per" },
  { key: "fri", label: "Cum" },
  { key: "sat", label: "Cmt" },
  { key: "sun", label: "Paz" },
];

// ── Türkçe çeviri haritası ──────────────────────────────────────────
const TR = {
  // Gender
  Female: "Kadın",
  Male: "Erkek",
  "Non-Binary": "Non-Binary",
  "Prefer not to say": "Belirtmek istemiyorum",
  // Goals
  gain_muscle: "Kas Geliştir",
  lose_weight: "Kilo Ver",
  get_toned: "Sıkılaş",
  // Body type
  skinny: "Zayıf",
  ideal: "İdeal",
  flabby: "Yumuşak",
  heavier: "Kilolu",
  ectomorph: "Ektomorf (ince yapılı)",
  mesomorph: "Mezomorf (atletik)",
  endomorph: "Endomorf (kilo almaya yatkın)",
  // Experience
  regular_exercise: "Düzenli egzersiz yapıyorum",
  yes_year_ago: "Evet, yaklaşık 1 yıl önce",
  yes_more_year_ago: "Evet, 1 yıldan fazla önce",
  beginner: "Başlangıç seviyesi",
  intermediate: "Orta seviye",
  advanced: "İleri seviye",
  no: "Hayır",
  // How fit
  too_fit: "Çok fit",
  fit: "Fit",
  not_fit: "Fit değil",
  moderately_fit: "Orta düzey fit",
  // Knee pain
  yes: "Evet",
  // Pushups
  "zero_to_5": "0-5 tekrar",
  "0-5": "0-5 tekrar",
  "5_to_15": "5-15 tekrar",
  "15-29": "15-29 tekrar",
  "15_to_29": "15-29 tekrar",
  "20_plus": "20+ tekrar",
  // Stressed
  not_at_all: "Hiç stresli değilim",
  few_times_week: "Haftada birkaç kez",
  sometimes: "Bazen",
  often: "Sık sık",
  always: "Her zaman",
  // Commitment
  least_a_year: "En az 1 yıl",
  least_6_months: "En az 6 ay",
  least_3_months: "En az 3 ay",
  least_a_month: "En az 1 ay",
  // Workout length / Nutrition budget (shared values)
  short: "Kısa",
  medium: "Orta",
  long: "Uzun",
  low: "Düşük",
  high: "Yüksek",
  // Motivation
  very_motivated: "Çok motiveyim",
  motivated: "Motiveyim",
  not_motivated: "Motive değilim",
  // Plan reference
  fastest_way: "En hızlı yol",
  balanced_pace: "Dengeli tempo",
  slowly_but_steadily: "Yavaş ama istikrarlı",
  // Body part focus
  arms: "Kollar",
  chest: "Göğüs",
  belly: "Karın",
  thighs: "Bacaklar",
  back: "Sırt",
  shoulders: "Omuzlar",
  glutes: "Kalça",
  // Bad habits
  sweet_tooth: "Şekerli yiyeceklere düşkünüm",
  sugar_drinks: "Şekerli içecekleri severim",
  dont_sleep_enough: "Yeterince uyumuyorum",
  fast_food: "Çok sık fast food tüketiyorum",
  late_night_eat: "Geç saatlerde yemek yiyorum",
  // What motivates
  feeling_confident: "Kendime güvenmek",
  being_active: "Aktif olmak",
  boosting_immunity: "Bağışıklığı güçlendirmek",
  improving_sleep: "Uykuyu iyileştirmek",
  feeling_happier: "Daha mutlu hissetmek",
  boosting_energy: "Enerjiyi artırmak",
  // Workout place
  home: "Evde",
  gym: "Spor salonunda",
  studio_classes: "Stüdyo dersleri",
  outdoor: "Açık havada",
  // Health problems
  bel_fitigi: "Bel Fıtığı",
  diz_sorunu: "Diz Sorunu",
  omuz_sakatligi: "Omuz Sakatlığı",
  tansiyon: "Tansiyon",
  diyabet: "Diyabet",
  tiroid: "Tiroid",
  astim: "Astım",
  kalp: "Kalp Rahatsızlığı",
  yok: "Yok",
  // Food allergies
  gluten: "Gluten",
  laktoz: "Laktoz",
  fistik: "Fıstık / Kuruyemiş",
  deniz_urunleri: "Deniz Ürünleri",
  yumurta: "Yumurta",
  soya: "Soya",
  kirmizi_et: "Kırmızı Et",
  // Supplements
  protein_tozu: "Protein Tozu",
  bcaa: "BCAA",
  kreatin: "Kreatin",
  l_carnitine: "L-Carnitine",
  multivitamin: "Multivitamin",
  balik_yagi: "Balık Yağı",
  glutamine: "Glutamine",
  zma: "ZMA / Çinko",
  // Days
  Monday: "Pazartesi",
  Tuesday: "Salı",
  Wednesday: "Çarşamba",
  Thursday: "Perşembe",
  Friday: "Cuma",
  Saturday: "Cumartesi",
  Sunday: "Pazar",
};

/** DB'den gelen değeri Türkçe'ye çevir, bulamazsa orijinali döndür */
const tr = (v) => {
  if (v == null) return v;
  const s = String(v).trim();
  return TR[s] ?? s;
};

/** Dizi elemanlarını Türkçe'ye çevir */
const trArr = (arr) => (Array.isArray(arr) ? arr.map(tr) : arr);

const Section = ({ title, children, cols = 2 }) => (
  <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
    <div className="border-b bg-gray-50/50 px-5 py-3">
      <span className="text-sm font-bold text-gray-800">{title}</span>
    </div>
    <div className={`grid grid-cols-1 gap-x-6 gap-y-4 p-5 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>{children}</div>
  </div>
);

const Field = ({ label, value, highlight }) => (
  <div>
    <div className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</div>
    <div className={`mt-1 text-sm font-semibold ${highlight ? "text-emerald-600" : "text-gray-900"}`}>
      {value === 0 ? "0" : value ? value : <span className="text-gray-300 font-normal">—</span>}
    </div>
  </div>
);

const TabButton = ({ active, children, onClick }) => (
  <button
    onClick={onClick}
    className={[
      "rounded-xl px-3 py-2 text-sm font-medium transition",
      active ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100",
    ].join(" ")}
    type="button"
  >
    {children}
  </button>
);

const BadgeList = ({ items, color = "gray" }) => {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length)
    return <span className="text-gray-300 text-sm">—</span>;

  const colors = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {arr.map((x, i) => (
        <span
          key={`${x}-${i}`}
          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${colors[color] || colors.gray}`}
        >
          {String(x)}
        </span>
      ))}
    </div>
  );
};

const normalize = (v) => (typeof v === "string" ? v.trim() : v);

// client_onboarding jsonb alanları bazen string olarak gelebilir
const tryParseJSON = (v) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const calcAge = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

const prettyKey = (k) =>
  String(k)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const Collapse = ({ title, open, onToggle, children }) => (
  <div className="rounded-2xl border bg-white shadow-sm">
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between px-5 py-4 text-left"
      type="button"
    >
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="text-xs font-medium text-gray-600">
        {open ? "Gizle" : "Göster"}
      </div>
    </button>
    {open ? <div className="border-t p-5">{children}</div> : null}
  </div>
);

/** Small helper to map weekday keys safely */
function getDayLabel(key) {
  return DAYS.find((x) => x.key === key)?.label || key;
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [tab, setTab] = useState("overview"); // overview | programs | messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [programsKey, setProgramsKey] = useState(0); // Key for ProgramsTab refresh

  // Assign modal state (keeping for backward compatibility but not using modal approach)
  const [assignLoading, setAssignLoading] = useState(false);

  // Body form photos
  const [formPhotos, setFormPhotos] = useState([]);
  const [formPhotosLoading, setFormPhotosLoading] = useState(true);
  const [formPhotoModal, setFormPhotoModal] = useState(null); // {url, label}

  // Activity log
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const fetchStudent = () => {
    setLoading(true);
    setError("");

    return api
      .get(`/admin/students/${id}`)
      .then((res) => setData(res.data))
      .catch((e) => {
        setError(
          e?.response?.data?.detail ||
            e?.message ||
            "Öğrenci detayları yüklenemedi"
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let alive = true;
    if (!alive) return;

    fetchStudent();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch body form photos
  useEffect(() => {
    let alive = true;
    setFormPhotosLoading(true);
    api
      .get(`/coach/students/${id}/body-form-photos`)
      .then((res) => {
        if (alive) setFormPhotos(res.data?.photos || []);
      })
      .catch((e) => {
        console.error("[FormPhotos] Error:", e?.response?.status, e?.response?.data);
        if (alive) setFormPhotos([]);
      })
      .finally(() => {
        if (alive) setFormPhotosLoading(false);
      });
    return () => { alive = false; };
  }, [id]);

  // Fetch activity log
  useEffect(() => {
    let alive = true;
    setActivitiesLoading(true);
    api
      .get(`/coach/students/${id}/activity?limit=50`)
      .then((res) => {
        if (alive) setActivities(res.data?.activities || []);
      })
      .catch(() => {
        if (alive) setActivities([]);
      })
      .finally(() => {
        if (alive) setActivitiesLoading(false);
      });
    return () => { alive = false; };
  }, [id]);

  const s = useMemo(() => {
    const student = data?.student || {};
    const onboarding = data?.onboarding || {};

    // clients tablosu + onboarding birleşik görünüm
    const fullName =
      normalize(student.full_name) || normalize(onboarding.full_name);
    const email = normalize(student.email);
    const gender = normalize(student.gender) || normalize(onboarding.gender);

    const age =
      calcAge(student.date_of_birth) ??
      (onboarding.age != null ? String(onboarding.age) : null);

    const height =
      student.height_cm ?? onboarding.height_cm ?? onboarding.height ?? null;

    const weight =
      student.weight_kg ?? onboarding.weight_kg ?? onboarding.weight ?? null;

    const goal =
      normalize(student.goal_type) || normalize(onboarding.your_goal);

    const activity =
      normalize(student.activity_level) || normalize(onboarding.how_fit);

    return {
      student,
      onboarding,
      ui: {
        id,
        fullName: fullName || `Öğrenci #${id}`,
        email: email || "-",
        gender: gender || "-",
        age: age || "-",
        height: height ?? "-",
        weight: weight ?? "-",
        goal: goal || "-",
        activity: activity || "-",
        profilePhotoUrl: student?.profile_photo_url || null,
      },
    };
  }, [data, id]);

  const assignWorkoutProgram = async () => {
    if (!id) return;
    setAssignLoading(true);
    try {
      // Hem antrenman hem beslenme programini ayni butonla atar.
      // Birinde program yoksa (404) sessizce atlar, ikisini de denemis olur.
      const results = await Promise.allSettled([
        api.post(`/coach/students/${id}/workout-programs/assign`),
        api.post(`/coach/students/${id}/nutrition-programs/assign`),
      ]);

      const workoutOk = results[0].status === "fulfilled";
      const nutritionOk = results[1].status === "fulfilled";
      const workout404 = !workoutOk && results[0].reason?.response?.status === 404;
      const nutrition404 = !nutritionOk && results[1].reason?.response?.status === 404;

      if (!workoutOk && !nutritionOk) {
        if (workout404 && nutrition404) {
          showToast("Henüz atanacak kaydedilmiş bir program yok. Önce taslak oluşturun.", "error");
        } else {
          // En az biri gerçek hata — ilk hatayı göster
          const err = results[0].status === "rejected" ? results[0].reason : results[1].reason;
          showToast(translateError(err), "error");
        }
        return;
      }

      // En az biri basarili
      const parts = [];
      if (workoutOk) parts.push("antrenman");
      if (nutritionOk) parts.push("beslenme");
      showToast(`${parts.join(" ve ")} programı başarıyla atandı!`, "success");

      setTab("programs");
      setProgramsKey((k) => k + 1);
    } catch (e) {
      console.error("Assign program error:", e);
      showToast(translateError(e), "error");
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-sm font-semibold text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <img
            src={s.ui.profilePhotoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`}
            alt=""
            className="w-16 h-16 rounded-full object-cover"
            onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`; }}
          />
          <div>
            <h1 className="text-2xl font-semibold">{s.ui.fullName}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {s.ui.email} • Öğrenci ID: {id}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            type="button"
            onClick={async () => {
              try {
                const conv = await createCoachConversation(Number(id));
                navigate(`/messages?conversation=${conv.id}`);
              } catch (e) {
                console.error("Failed to open chat:", e);
                showToast(translateError(e), "error");
              }
            }}
          >
            Mesaj Gönder
          </button>
          <button
            onClick={assignWorkoutProgram}
            disabled={assignLoading}
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {assignLoading ? "Atanıyor..." : "Program Ata"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 rounded-2xl border bg-white p-2 shadow-sm">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          Genel Bakış
        </TabButton>
        <TabButton active={tab === "programs"} onClick={() => setTab("programs")}>
          Programlar
        </TabButton>
        <TabButton active={tab === "meal-photos"} onClick={() => setTab("meal-photos")}>
          Öğün Fotoğrafları
        </TabButton>
        <TabButton active={tab === "form-analysis"} onClick={() => setTab("form-analysis")}>
          Form Analizi
        </TabButton>
      </div>

      {/* Content */}
      {tab === "overview" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── SOL: Onboarding Bilgileri (2/3) ─── */}
        <div className="lg:col-span-2 space-y-5">
          {/* ─── Kişisel Bilgiler ─── */}
          <Section title="Kişisel Bilgiler" cols={3}>
            <Field label="Cinsiyet" value={tr(s.ui.gender)} />
            <Field label="Yaş" value={s.ui.age} />
            <Field label="Doğum tarihi" value={s.student.birthdate || s.student.date_of_birth} />
            <Field label="Boy" value={s.ui.height !== "-" ? `${s.ui.height} cm` : "-"} />
            <Field label="Kilo" value={s.ui.weight !== "-" ? `${s.ui.weight} kg` : "-"} highlight />
            <Field label="Hedef kilo" value={s.onboarding.target_weight_kg ? `${s.onboarding.target_weight_kg} kg` : "-"} highlight />
          </Section>

          {/* ─── Hedef ve Deneyim ─── */}
          <Section title="Hedef ve Deneyim">
            <Field label="Ana hedef" value={tr(s.ui.goal)} />
            <Field label="Vücut tipi" value={tr(s.onboarding.body_type)} />
            <Field label="Deneyim" value={tr(s.onboarding.experience)} />
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Odak bölgeleri</div>
              <div className="mt-1.5">
                <BadgeList items={trArr(tryParseJSON(s.onboarding.body_part_focus))} color="blue" />
              </div>
            </div>
          </Section>

          {/* ─── Antrenman Tercihleri ─── */}
          <Section title="Antrenman Tercihleri">
            <Field label="Antrenman süresi" value={tr(s.onboarding.pref_workout_length)} />
            <Field label="Antrenman saati" value={s.onboarding.preferred_workout_hours || "-"} />
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Antrenman yeri</div>
              <div className="mt-1.5">
                <BadgeList items={trArr(tryParseJSON(s.onboarding.workout_place))} color="green" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Tercih edilen günler</div>
              <div className="mt-1.5">
                <BadgeList items={trArr(tryParseJSON(s.onboarding.preferred_workout_days))} color="blue" />
              </div>
            </div>
          </Section>

          {/* ─── Sağlık ve Beslenme ─── */}
          <Section title="Sağlık ve Beslenme">
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Sağlık sorunları</div>
              <div className="mt-1.5">
                <BadgeList items={trArr(tryParseJSON(s.onboarding.health_problems))} color="red" />
              </div>
              {s.onboarding.health_problems_other && (
                <div className="mt-1 text-xs text-gray-600">Diğer: {s.onboarding.health_problems_other}</div>
              )}
            </div>
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Besin alerjileri / yasaklar</div>
              <div className="mt-1.5">
                <BadgeList items={trArr(tryParseJSON(s.onboarding.food_allergies))} color="red" />
              </div>
              {s.onboarding.food_allergies_other && (
                <div className="mt-1 text-xs text-gray-600">Diğer: {s.onboarding.food_allergies_other}</div>
              )}
            </div>
            <Field label="Beslenme bütçesi" value={tr(s.onboarding.nutrition_budget)} />
          </Section>

          {/* ─── Günlük Düzen ─── */}
          <Section title="Günlük Düzen">
            <Field label="Uyanma saati" value={s.onboarding.wakeup_time || "-"} />
            <Field label="Uyuma saati" value={s.onboarding.sleep_time || "-"} />
            <Field label="Antrenman saati" value={s.onboarding.preferred_workout_hours || "-"} />
          </Section>
        </div>

        {/* ─── SAĞ: Aktivite Log'ları (1/3) ─── */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border bg-white shadow-sm sticky top-4">
            <div className="border-b bg-gray-50/50 px-5 py-3 flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">Aktivite Bildirimleri</span>
              {activities.length > 0 && (
                <span className="ml-auto rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">{activities.length}</span>
              )}
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y">
              {activitiesLoading ? (
                <div className="p-5 text-center text-xs text-gray-400">Yükleniyor...</div>
              ) : activities.length === 0 ? (
                <div className="p-5 text-center">
                  <div className="text-xs text-gray-400">Henüz aktivite yok</div>
                  <div className="text-[10px] text-gray-300 mt-1">Öğrenci aksiyon aldığında burada görünecek</div>
                </div>
              ) : (
                activities.map((a) => {
                  const icons = {
                    meal_photo: {
                      bg: "bg-emerald-50",
                      border: "border-emerald-200",
                      stroke: "#059669",
                      svg: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                          <path d="M7 2v20" />
                          <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3z" />
                          <path d="M21 15v7" />
                        </svg>
                      ),
                    },
                    form_photo: {
                      bg: "bg-[#3E9E8E]/10",
                      border: "border-[#3E9E8E]/20",
                      stroke: "#2B7B6E",
                      svg: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2B7B6E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      ),
                    },
                    workout_complete: {
                      bg: "bg-fuchsia-50",
                      border: "border-fuchsia-200",
                      stroke: "#C026D3",
                      svg: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C026D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6.5 6.5l11 11" />
                          <path d="M21 21l-1.5-1.5M2.5 2.5L4 4" />
                          <path d="M14.5 6.5l-3 3M9.5 14.5l-3 3" />
                          <path d="M18 3l3 3M3 18l3 3" />
                        </svg>
                      ),
                    },
                    message: {
                      bg: "bg-slate-100",
                      border: "border-slate-200",
                      stroke: "#475569",
                      svg: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      ),
                    },
                  };
                  const style = icons[a.action_type] || icons.message;
                  const timeAgo = (() => {
                    if (!a.created_at) return "";
                    const diff = Date.now() - new Date(a.created_at).getTime();
                    const mins = Math.floor(diff / 60000);
                    if (mins < 1) return "Az önce";
                    if (mins < 60) return `${mins} dk önce`;
                    const hours = Math.floor(mins / 60);
                    if (hours < 24) return `${hours} saat önce`;
                    const days = Math.floor(hours / 24);
                    return `${days} gün önce`;
                  })();

                  return (
                    <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${style.bg} ${style.border}`}>
                        {style.svg}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-gray-800 leading-snug">{a.title}</div>
                        {a.detail && <div className="text-[10px] text-gray-500 mt-0.5">{a.detail}</div>}
                        <div className="text-[10px] text-gray-400 mt-1">{timeAgo}</div>
                      </div>
                      {a.photo_url && (
                        <img src={a.photo_url} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" loading="lazy" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        </div>
      ) : tab === "programs" ? (
        <ProgramsTab key={programsKey} studentId={Number(id)} activePrograms={data?.active_programs} />
      ) : tab === "meal-photos" ? (
        <MealPhotosTab studentId={Number(id)} />
      ) : tab === "form-analysis" ? (
        <BodyFormSection
          photos={formPhotos}
          loading={formPhotosLoading}
          onPhotoClick={(url, label) => setFormPhotoModal({ url, label })}
          studentId={Number(id)}
        />
      ) : null}

      <ToastContainer />

      {/* Full-size photo modal */}
      {formPhotoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setFormPhotoModal(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={formPhotoModal.url}
              alt={formPhotoModal.label}
              className="max-h-[85vh] rounded-2xl object-contain"
            />
            <div className="mt-2 text-center text-sm font-medium text-white">
              {formPhotoModal.label}
            </div>
            <button
              onClick={() => setFormPhotoModal(null)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg hover:bg-gray-100"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Body Form Photos Section ─── */
const ANGLE_LABELS = {
  front: "Ön",
  back: "Arka",
  left_side: "Sol Yan",
  right_side: "Sağ Yan",
};
const ANGLE_ORDER = ["front", "back", "left_side", "right_side"];

function BodyFormSection({ photos, loading, onPhotoClick, studentId, frequencyDays: initialFreq }) {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [compareIdx, setCompareIdx] = useState(null);
  const [compareAngle, setCompareAngle] = useState(null); // angle to compare
  const [frequency, setFrequency] = useState(initialFreq || 30);
  const [savingFreq, setSavingFreq] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const { showToast, ToastContainer: FormToast } = useToast();

  const fetchHistory = () => {
    if (!studentId) return;
    setHistoryLoading(true);
    api.get(`/coach/students/${studentId}/body-form-photos/history`)
      .then((res) => setHistory(res.data?.history || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  };

  const saveFrequency = async (days) => {
    setSavingFreq(true);
    try {
      await api.post(`/coach/students/${studentId}/body-form-settings`, { frequency_days: days });
      setFrequency(days);
    } catch {} finally { setSavingFreq(false); }
  };

  const requestFormPhotos = async () => {
    setRequesting(true);
    try {
      await api.post(`/coach/students/${studentId}/body-form-request`);
      setRequestSent(true);
      showToast("Form analizi bildirimi gönderildi", "success");
      setTimeout(() => setRequestSent(false), 5000);
    } catch (e) {
      showToast("Bildirim gönderilemedi", "error");
    } finally { setRequesting(false); }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 text-sm font-semibold text-gray-900">Form Fotoğrafları</div>
        <div className="text-sm text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  const photoMap = {};
  for (const p of photos) { photoMap[p.angle] = p; }
  const hasAny = photos.length > 0;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">Form Fotoğrafları</div>
        <div className="flex items-center gap-2">
          {hasAny && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
              {photos.length}/4
            </span>
          )}
          {hasAny && (
            <button
              type="button"
              onClick={() => { setShowHistory((v) => !v); if (!showHistory) fetchHistory(); }}
              className="rounded-lg border px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              {showHistory ? "Gizle" : "Geçmiş"}
            </button>
          )}
        </div>
      </div>

      {/* Controls: frequency + request button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sıklık:</span>
          <select value={frequency} onChange={(e) => saveFrequency(parseInt(e.target.value))} disabled={savingFreq} className="rounded-lg border px-2 py-1 text-xs">
            <option value={7}>Haftalık</option>
            <option value={14}>2 Haftalık</option>
            <option value={30}>Aylık</option>
            <option value={60}>2 Aylık</option>
            <option value={90}>3 Aylık</option>
          </select>
        </div>
        <button type="button" onClick={requestFormPhotos} disabled={requesting || requestSent}
          className="rounded-lg bg-black px-3 py-1.5 text-xs font-medium text-white hover:bg-black/90 disabled:opacity-50">
          {requestSent ? "Bildirim Gönderildi" : requesting ? "Gönderiliyor..." : "Form Analizi İste"}
        </button>
        {hasAny && (
          <button type="button" onClick={() => { setShowHistory((v) => !v); if (!showHistory) fetchHistory(); }}
            className="rounded-lg border px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
            {showHistory ? "Geçmişi Gizle" : "Geçmişi Göster"}
          </button>
        )}
      </div>

      {/* Current photos — compact list */}
      {!hasAny ? (
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-gray-400">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-600">Henüz form fotoğrafı yüklenmemiş</div>
            <div className="text-xs text-gray-400">"Form Analizi İste" butonuyla öğrenciye bildirim gönderin.</div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border divide-y">
          {ANGLE_ORDER.map((angle) => {
            const photo = photoMap[angle];
            const label = ANGLE_LABELS[angle];
            return (
              <button key={angle} type="button"
                onClick={() => photo && onPhotoClick(photo.photo_url, label)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-gray-50">
                {photo ? (
                  <img src={photo.photo_url} alt={label} loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                    <span className="text-[10px] text-gray-300">Yok</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800">{label}</div>
                  <div className="text-[10px] text-gray-400">{photo ? "Yüklendi" : "Bekleniyor"}</div>
                </div>
                {photo && compareIdx !== null && history[compareIdx]?.photos[angle] && (
                  <span className="text-[10px] text-blue-500 font-medium">Karşılaştır →</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Angle comparison modal */}
      {compareAngle && compareIdx !== null && history[compareIdx] && (
        <div className="rounded-xl border bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold text-gray-700">
              {ANGLE_LABELS[compareAngle]} — Karşılaştırma
            </div>
            <button type="button" onClick={() => setCompareAngle(null)} className="text-xs text-red-400 hover:text-red-600">Kapat</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-gray-500 mb-1">Güncel</div>
              {photoMap[compareAngle] ? (
                <img src={photoMap[compareAngle].photo_url} className="w-full rounded-lg object-cover aspect-[3/4]" alt="Güncel" />
              ) : <div className="aspect-[3/4] rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-400">Yok</div>}
            </div>
            <div>
              <div className="text-[10px] text-gray-500 mb-1">{history[compareIdx].date}</div>
              {history[compareIdx].photos[compareAngle] ? (
                <img src={history[compareIdx].photos[compareAngle].photo_url} className="w-full rounded-lg object-cover aspect-[3/4]" alt="Eski" />
              ) : <div className="aspect-[3/4] rounded-lg bg-gray-200 flex items-center justify-center text-xs text-gray-400">Yok</div>}
            </div>
          </div>
        </div>
      )}

      {/* History timeline */}
      {showHistory && (
        <div className="border-t pt-4">
          <div className="text-xs font-semibold text-gray-600 mb-3">Geçmiş Form Kayıtları</div>
          {historyLoading ? (
            <div className="text-xs text-gray-400">Yükleniyor...</div>
          ) : history.length === 0 ? (
            <div className="text-xs text-gray-400">Geçmiş kayıt yok.</div>
          ) : (
            <div className="space-y-2">
              {history.map((batch, idx) => (
                <div key={batch.date} className="rounded-lg border">
                  <div className="flex items-center justify-between px-3 py-2">
                    <div>
                      <div className="text-xs font-medium text-gray-800">{batch.date}</div>
                      <div className="text-[10px] text-gray-400">{batch.angle_count}/4 açı</div>
                    </div>
                    <button type="button"
                      onClick={() => { setCompareIdx(compareIdx === idx ? null : idx); setCompareAngle(null); }}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                        compareIdx === idx ? "bg-black text-white border-black" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}>
                      {compareIdx === idx ? "Seçili" : "Karşılaştır"}
                    </button>
                  </div>
                  {/* When selected, show angle picker */}
                  {compareIdx === idx && (
                    <div className="border-t px-3 py-2 flex gap-2">
                      {ANGLE_ORDER.map((angle) => {
                        const hasOld = !!batch.photos[angle];
                        const hasCurrent = !!photoMap[angle];
                        return (
                          <button key={angle} type="button" disabled={!hasOld || !hasCurrent}
                            onClick={() => setCompareAngle(angle)}
                            className={`rounded-lg px-2 py-1 text-[10px] font-medium border transition ${
                              compareAngle === angle ? "bg-blue-500 text-white border-blue-500" :
                              hasOld && hasCurrent ? "text-gray-600 border-gray-200 hover:bg-gray-50" :
                              "text-gray-300 border-gray-100 cursor-not-allowed"
                            }`}>
                            {ANGLE_LABELS[angle]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <FormToast />
    </div>
  );
}

/* ─── Meal Photos Tab ─── */
const MEAL_DAY_MAP = { mon: "Pazartesi", tue: "Salı", wed: "Çarşamba", thu: "Perşembe", fri: "Cuma", sat: "Cumartesi", sun: "Pazar" };

function cleanMealLabel(label) {
  if (!label) return "Öğün";
  // Strip day prefix: "mon:Kahvalti" → "Kahvaltı"
  const clean = label.includes(":") ? label.split(":").slice(1).join(":") : label;
  return clean.trim() || "Öğün";
}

function MealPhotosTab({ studentId }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalUrl, setModalUrl] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null); // null = all dates

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get(`/coach/students/${studentId}/meal-photos?limit=200`)
      .then((res) => {
        if (alive) setPhotos(res.data?.photos || []);
      })
      .catch(() => {
        if (alive) setPhotos([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [studentId]);

  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
  };

  const fmtDateShort = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  // Get unique dates for calendar strip
  const dateKeys = useMemo(() => {
    const set = new Set();
    for (const p of photos) {
      if (p.created_at) set.add(p.created_at.split("T")[0]);
    }
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [photos]);

  // Group photos by date, filtered by selectedDate
  const grouped = useMemo(() => {
    const filtered = selectedDate
      ? photos.filter((p) => p.created_at?.startsWith(selectedDate))
      : photos;
    const map = {};
    for (const p of filtered) {
      const dateKey = p.created_at ? p.created_at.split("T")[0] : "unknown";
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(p);
    }
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [photos, selectedDate]);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">
        Öğün fotoğrafları yükleniyor...
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border bg-white p-8">
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
            </svg>
          </div>
          <div className="text-sm font-medium text-gray-600">
            Henüz öğün fotoğrafı yüklenmemiş
          </div>
          <div className="text-xs text-gray-400">
            Öğrenci öğün fotoğraflarını yüklediğinde burada tarih sırasına göre görünecek.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Date filter strip */}
        {dateKeys.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium border transition ${
                !selectedDate ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Tümü ({photos.length})
            </button>
            {dateKeys.map((dk) => {
              const count = photos.filter((p) => p.created_at?.startsWith(dk)).length;
              return (
                <button
                  key={dk}
                  type="button"
                  onClick={() => setSelectedDate(dk === selectedDate ? null : dk)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium border transition ${
                    selectedDate === dk ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {fmtDateShort(dk + "T00:00")} ({count})
                </button>
              );
            })}
          </div>
        )}

        {grouped.map(([dateKey, dayPhotos]) => (
          <div key={dateKey} className="rounded-2xl border bg-white shadow-sm">
            {/* Date header */}
            <div className="border-b px-4 py-2.5 flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">
                {fmtDate(dayPhotos[0]?.created_at)}
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                {dayPhotos.length} fotoğraf
              </span>
            </div>

            {/* Compact list */}
            <div className="divide-y">
              {dayPhotos.map((p) => {
                const ai = p.ai_analysis;
                const aiStatus = p.ai_analysis_status;
                return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setModalUrl({ url: p.photo_url, label: cleanMealLabel(p.meal_label), time: fmtTime(p.created_at), retake: p.is_retake, ai, aiStatus })}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-gray-50"
                >
                  {/* Tiny thumbnail */}
                  <img
                    src={p.photo_url}
                    alt=""
                    loading="lazy"
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-800 truncate">
                        {cleanMealLabel(p.meal_label)}
                      </span>
                      {p.is_retake && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                          Güncellendi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-gray-400">{fmtTime(p.created_at)}</span>
                      {ai && aiStatus === "completed" && (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                          <span>🤖</span>
                          <span>{ai.calories} kcal · P:{ai.protein_g}g K:{ai.carbs_g}g Y:{ai.fat_g}g</span>
                        </span>
                      )}
                      {aiStatus === "processing" && (
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                          <span className="animate-pulse">🤖</span>
                          <span>Analiz ediliyor...</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Full-size photo modal */}
      {modalUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setModalUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={modalUrl.url}
              alt={modalUrl.label}
              className="max-h-[80vh] rounded-2xl object-contain"
            />
            <div className="mt-3 text-center">
              <div className="text-sm font-medium text-white">{modalUrl.label}</div>
              <div className="text-xs text-white/60">{modalUrl.time}</div>
              {modalUrl.retake && (
                <span className="mt-1 inline-block rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                  Güncellendi
                </span>
              )}
            </div>

            {/* AI Analysis card — BETA */}
            {modalUrl.ai && modalUrl.aiStatus === "completed" && (
              <div className="mt-3 rounded-2xl bg-white/95 p-4 shadow-lg max-w-md mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🤖</span>
                    <span className="text-sm font-bold text-gray-800">AI Tahmini</span>
                    <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-700">BETA</span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    Güven: {modalUrl.ai.confidence === "high" ? "Yüksek" : modalUrl.ai.confidence === "low" ? "Düşük" : "Orta"}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-orange-50 p-2">
                    <div className="text-[10px] font-medium uppercase text-orange-600">Kalori</div>
                    <div className="text-base font-bold text-orange-700">{modalUrl.ai.calories}</div>
                    <div className="text-[9px] text-orange-500">kcal</div>
                  </div>
                  <div className="rounded-lg bg-red-50 p-2">
                    <div className="text-[10px] font-medium uppercase text-red-600">Protein</div>
                    <div className="text-base font-bold text-red-700">{modalUrl.ai.protein_g}g</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-2">
                    <div className="text-[10px] font-medium uppercase text-yellow-600">Karb.</div>
                    <div className="text-base font-bold text-yellow-700">{modalUrl.ai.carbs_g}g</div>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-2">
                    <div className="text-[10px] font-medium uppercase text-blue-600">Yağ</div>
                    <div className="text-base font-bold text-blue-700">{modalUrl.ai.fat_g}g</div>
                  </div>
                </div>
                {Array.isArray(modalUrl.ai.items) && modalUrl.ai.items.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    <div className="font-semibold mb-1">Tespit edilen yemekler:</div>
                    <ul className="space-y-0.5">
                      {modalUrl.ai.items.map((it, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{it.name}</span>
                          <span className="text-gray-400">~{it.estimated_g}g</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-2 text-[10px] text-gray-400 italic text-center">
                  AI tahmini — ±%20-30 hata payı olabilir, koç onaylar
                </div>
              </div>
            )}
            {modalUrl.aiStatus === "processing" && (
              <div className="mt-3 rounded-2xl bg-white/90 p-4 text-center max-w-md mx-auto">
                <span className="text-sm text-gray-600">🤖 AI analizi devam ediyor...</span>
              </div>
            )}
            <button
              onClick={() => setModalUrl(null)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-800 shadow-lg hover:bg-gray-100"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Inline Messages Component ─── */
function StudentMessages({ studentId, studentName }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);

  const initConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/coach/conversations", { client_user_id: studentId });
      const convId = data?.conversation?.id;
      if (!convId) { setError("Konuşma oluşturulamadı."); setLoading(false); return; }
      setConversationId(convId);
      const msgRes = await api.get(`/coach/conversations/${convId}/messages?limit=50`);
      const list = (msgRes.data?.messages || []).reverse();
      setMessages(list);
      setHasMore(!!msgRes.data?.has_more);
    } catch (e) {
      setError(e?.response?.data?.detail || "Mesajlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { initConversation(); }, [initConversation]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const loadOlder = async () => {
    if (!hasMore || loadingMore || !conversationId || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0]?.id;
      const { data } = await api.get(`/coach/conversations/${conversationId}/messages?limit=50&before=${oldest}`);
      const older = (data?.messages || []).reverse();
      setMessages((prev) => [...older, ...prev]);
      setHasMore(!!data?.has_more);
    } catch {} finally { setLoadingMore(false); }
  };

  const send = async () => {
    const text = body.trim();
    if (!text || sending || !conversationId) return;
    setSending(true);
    try {
      const { data } = await api.post(`/coach/conversations/${conversationId}/messages`, { body: text, message_type: "text" });
      setMessages((prev) => [...prev, data]);
      setBody("");
    } catch {} finally { setSending(false); }
  };

  const sendImage = async (file) => {
    if (!file || !conversationId) return;
    setUploadingImg(true);
    try {
      const result = await uploadImage(file);
      const { data } = await api.post(`/coach/conversations/${conversationId}/messages`, {
        body: null, message_type: "image", media_url: result.url, media_metadata: { width: result.width, height: result.height },
      });
      setMessages((prev) => [...prev, data]);
    } catch {} finally { setUploadingImg(false); }
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">Mesajlar yükleniyor...</div>;
  if (error) return <div className="rounded-2xl border bg-white p-8 text-center text-sm text-red-600">{error}</div>;

  return (
    <div className="rounded-2xl border bg-white shadow-sm flex flex-col" style={{ height: "560px" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="text-sm font-semibold text-gray-900">{studentName} ile Mesajlar</div>
        <button onClick={initConversation} className="text-xs text-gray-500 hover:text-gray-800">Yenile</button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {hasMore && (
          <button onClick={loadOlder} disabled={loadingMore} className="w-full text-center text-xs text-gray-500 hover:text-gray-800 py-2">
            {loadingMore ? "Yükleniyor..." : "Daha eski mesajlar"}
          </button>
        )}
        {messages.length === 0 && <div className="text-center text-sm text-gray-400 py-8">Henüz mesaj yok.</div>}
        {messages.map((m) => {
          const isCoach = m.sender_type === "coach";
          return (
            <div key={m.id} className={`flex ${isCoach ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${isCoach ? "bg-black text-white" : "bg-gray-100 text-gray-900"}`}>
                {m.message_type === "image" && m.media_url && (
                  <img src={m.media_url} alt="" className="max-w-full max-h-[200px] rounded-lg mb-1 object-cover" />
                )}
                {m.body && <div className="text-sm whitespace-pre-wrap">{m.body}</div>}
                <div className={`text-[10px] mt-1 ${isCoach ? "text-white/50" : "text-gray-400"}`}>{fmtTime(m.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t px-4 py-3 flex items-end gap-2">
        <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={(e) => { if (e.target.files[0]) sendImage(e.target.files[0]); e.target.value = ""; }} />
        <button onClick={() => fileRef.current?.click()} disabled={uploadingImg} className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50" title="Fotoğraf gönder">
          {uploadingImg ? "..." : "📷"}
        </button>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Bir mesaj yazın..."
          rows={1}
          className="flex-1 resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
        />
        <button onClick={send} disabled={sending || !body.trim()} className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 disabled:opacity-50">
          {sending ? "..." : "Gönder"}
        </button>
      </div>
    </div>
  );
}
