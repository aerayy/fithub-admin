import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProgramsTab from "../components/ProgramsTab";
import { api, createCoachConversation } from "../lib/api";

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
  // Experience
  regular_exercise: "Düzenli egzersiz yapıyorum",
  yes_year_ago: "Evet, yaklaşık 1 yıl önce",
  yes_more_year_ago: "Evet, 1 yıldan fazla önce",
  no: "Hayır",
  // How fit
  too_fit: "Çok fit",
  fit: "Fit",
  not_fit: "Fit değil",
  // Knee pain
  yes: "Evet",
  // Pushups — keep as-is (numeric ranges)
  // Stressed
  not_at_all: "Hiç stresli değilim",
  few_times_week: "Haftada birkaç kez",
  sometimes: "Bazen",
  often: "Sık sık",
  always: "Her zaman",
  // Commitment
  least_a_year: "En az 1 yıl",
  least_3_months: "En az 3 ay",
  least_a_month: "En az 1 ay",
  // Workout length
  short: "Kısa (15-20 dk)",
  medium: "Orta (30-45 dk)",
  long: "Uzun (60+ dk)",
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
};

/** DB'den gelen değeri Türkçe'ye çevir, bulamazsa orijinali döndür */
const tr = (v) => {
  if (v == null) return v;
  const s = String(v).trim();
  return TR[s] ?? s;
};

/** Dizi elemanlarını Türkçe'ye çevir */
const trArr = (arr) => (Array.isArray(arr) ? arr.map(tr) : arr);

const Section = ({ title, children }) => (
  <div className="rounded-2xl border bg-white p-5 shadow-sm">
    <div className="mb-4 text-sm font-semibold text-gray-900">{title}</div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="mt-1 text-sm font-medium text-gray-900">
      {value === 0 ? "0" : value ? value : "-"}
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

const BadgeList = ({ items }) => {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length)
    return <span className="text-sm font-medium text-gray-900">-</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {arr.map((x, i) => (
        <span
          key={`${x}-${i}`}
          className="rounded-full border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-800"
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
  const [tab, setTab] = useState("overview"); // overview | programs | messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [showMore, setShowMore] = useState(false);
  const [programsKey, setProgramsKey] = useState(0); // Key for ProgramsTab refresh

  // Assign modal state (keeping for backward compatibility but not using modal approach)
  const [assignLoading, setAssignLoading] = useState(false);

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
            "Student detayları yüklenemedi"
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
        fullName: fullName || `Student #${id}`,
        email: email || "-",
        gender: gender || "-",
        age: age || "-",
        height: height ?? "-",
        weight: weight ?? "-",
        goal: goal || "-",
        activity: activity || "-",
      },
    };
  }, [data, id]);

  const assignWorkoutProgram = async () => {
    if (!id) return;
    setAssignLoading(true);
    try {
      await api.post(`/coach/students/${id}/workout-programs/assign`);
      // Success feedback
      alert("Program assigned successfully!");
      // Switch to programs tab and refresh
      setTab("programs");
      setProgramsKey((k) => k + 1); // Force ProgramsTab refresh
    } catch (e) {
      const errorMsg =
        e?.response?.data?.detail || e?.message || "Assign failed";
      if (e?.response?.status === 404) {
        alert("No saved program to assign yet. Please save a draft first.");
      } else {
        alert(errorMsg);
      }
      console.error("Assign program error:", e);
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="text-sm text-gray-600">Loading...</div>
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
        <div>
          <h1 className="text-2xl font-semibold">{s.ui.fullName}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {s.ui.email} • Öğrenci ID: {id}
          </p>
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
        <TabButton active={tab === "messages"} onClick={() => setTab("messages")}>
          Mesajlar
        </TabButton>
      </div>

      {/* Content */}
      {tab === "overview" ? (
        <div className="space-y-6">
          <Section title="Hedef ve Profil">
            <Field label="Ana hedef" value={tr(s.ui.goal)} />
            <Field label="Cinsiyet" value={tr(s.ui.gender)} />
            <Field label="Yaş" value={s.ui.age} />
            <Field
              label="Onboarding tamamlandı"
              value={s.student.onboarding_done ? "Evet" : "Hayır"}
            />
            <Field label="Saat dilimi" value={s.student.timezone} />
          </Section>

          <Section title="Vücut Bilgileri">
            <Field label="Boy (cm)" value={s.ui.height} />
            <Field label="Kilo (kg)" value={s.ui.weight} />
            <Field label="Doğum tarihi" value={s.student.date_of_birth} />
          </Section>

          <Section title="Yaşam Tarzı (onboarding)">
            <Field label="Aktivite seviyesi" value={tr(s.ui.activity)} />
            <Field label="Deneyim" value={tr(s.onboarding.experience)} />
            <Field
              label="Tercih edilen antrenman süresi"
              value={tr(s.onboarding.pref_workout_length)}
            />
            <Field label="Motivasyon seviyesi" value={tr(s.onboarding.how_motivated)} />
          </Section>

          <Section title="Sakatlıklar ve Kısıtlamalar">
            <Field label="Diz ağrısı" value={tr(s.onboarding.knee_pain)} />
            <Field label="Şınav sayısı" value={s.onboarding.pushups} />
            <Field label="Stres düzeyi" value={tr(s.onboarding.stressed)} />
          </Section>

          <Section title="Tercihler">
            <Field label="Vücut tipi" value={tr(s.onboarding.body_type)} />
            <Field label="Plan tercihi" value={tr(s.onboarding.plan_reference)} />
            <Field label="Bağlılık süresi" value={tr(s.onboarding.commit)} />
            <Field label="Fitness seviyesi" value={tr(s.onboarding.how_fit)} />
          </Section>

          {/* JSONB / list alanları chip */}
          <Section title="Odak ve Alışkanlıklar (çoklu seçim)">
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Odak bölgeleri</div>
              <div className="mt-2">
                <BadgeList items={trArr(tryParseJSON(s.onboarding.body_part_focus))} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Kötü alışkanlıklar</div>
              <div className="mt-2">
                <BadgeList items={trArr(tryParseJSON(s.onboarding.bad_habit))} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Motivasyon kaynakları</div>
              <div className="mt-2">
                <BadgeList items={trArr(tryParseJSON(s.onboarding.what_motivate))} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Antrenman yeri</div>
              <div className="mt-2">
                <BadgeList items={trArr(tryParseJSON(s.onboarding.workout_place))} />
              </div>
            </div>
          </Section>

          <Collapse
            title="Daha fazla detay (tüm onboarding alanları)"
            open={showMore}
            onToggle={() => setShowMore((v) => !v)}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(s.onboarding || {})
                .filter(
                  ([k]) =>
                    !["id", "user_id", "created_at", "updated_at"].includes(k)
                )
                .map(([k, v]) => {
                  if (typeof v === "object" && v !== null) {
                    const arr = Array.isArray(v) ? v : [];
                    return (
                      <Field
                        key={k}
                        label={prettyKey(k)}
                        value={arr.map(tr).join(", ") || JSON.stringify(v)}
                      />
                    );
                  }
                  return (
                    <Field key={k} label={prettyKey(k)} value={tr(v)} />
                  );
                })}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Onboarding oluşturulma" value={s.onboarding.created_at} />
              <Field label="Onboarding güncelleme" value={s.onboarding.updated_at} />
            </div>
          </Collapse>
        </div>
      ) : tab === "programs" ? (
        <ProgramsTab key={programsKey} studentId={Number(id)} activePrograms={data?.active_programs} />
      ) : (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Mesajlar</div>
          <p className="mt-2 text-sm text-gray-600">
            Buraya koç-öğrenci mesaj geçmişi + yeni mesaj input'u gelecek.
          </p>
        </div>
      )}

    </div>
  );
}
