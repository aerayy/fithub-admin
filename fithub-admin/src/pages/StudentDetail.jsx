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
  const { showToast, ToastContainer } = useToast();
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
      await api.post(`/coach/students/${id}/workout-programs/assign`);
      // Success feedback
      showToast("Program başarıyla atandı!", "success");
      // Switch to programs tab and refresh
      setTab("programs");
      setProgramsKey((k) => k + 1); // Force ProgramsTab refresh
    } catch (e) {
      console.error("Assign program error:", e);
      if (e?.response?.status === 404) {
        showToast(
          "Henüz atanacak kaydedilmiş bir program yok. Lütfen önce bir taslak kaydedin.",
          "error"
        );
      } else {
        showToast(translateError(e), "error");
      }
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
        <StudentMessages studentId={Number(id)} studentName={parsed?.ui?.fullName || "Öğrenci"} />
      )}

      <ToastContainer />
    </div>
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
