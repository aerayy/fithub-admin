import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProgramsTab from "../components/ProgramsTab";
import { api } from "../lib/api"; // ✅ EKLENDİ

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
    >
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="text-xs font-medium text-gray-600">
        {open ? "Hide" : "Show"}
      </div>
    </button>
    {open ? <div className="border-t p-5">{children}</div> : null}
  </div>
);

export default function StudentDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState("overview"); // overview | programs | messages
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");

    // ✅ fetch yerine axios(api) kullanıyoruz -> token interceptor çalışır
    api
      .get(`/admin/students/${id}`)
      .then((res) => {
        if (!alive) return;
        setData(res.data);
      })
      .catch((e) => {
        if (!alive) return;
        setError(
          e?.response?.data?.detail ||
            e?.message ||
            "Student detayları yüklenemedi"
        );
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [id]);

  const s = useMemo(() => {
    const student = data?.student || {};
    const onboarding = data?.onboarding || {};

    // clients tablosu + onboarding birleşik görünüm
    const fullName = normalize(student.full_name) || normalize(onboarding.full_name);
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
            {s.ui.email} • Student ID: {id}
          </p>
        </div>

        <div className="flex gap-2">
          <button className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50">
            Message
          </button>
          <button className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white">
            Assign Program
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 rounded-2xl border bg-white p-2 shadow-sm">
        <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>
          Overview
        </TabButton>
        <TabButton active={tab === "programs"} onClick={() => setTab("programs")}>
          Programs
        </TabButton>
        <TabButton active={tab === "messages"} onClick={() => setTab("messages")}>
          Messages
        </TabButton>
      </div>

      {/* Content */}
      {tab === "overview" ? (
        <div className="space-y-6">
          <Section title="Goal & Profile">
            <Field label="Primary goal" value={s.ui.goal} />
            <Field label="Gender" value={s.ui.gender} />
            <Field label="Age" value={s.ui.age} />
            <Field label="Onboarding done" value={s.student.onboarding_done ? "Yes" : "No"} />
            <Field label="Timezone" value={s.student.timezone} />
          </Section>

          <Section title="Body Information">
            <Field label="Height (cm)" value={s.ui.height} />
            <Field label="Weight (kg)" value={s.ui.weight} />
            <Field label="Date of birth" value={s.student.date_of_birth} />
          </Section>

          <Section title="Lifestyle (from onboarding)">
            <Field label="Activity level" value={s.ui.activity} />
            <Field label="Experience" value={s.onboarding.experience} />
            <Field label="Preferred workout length" value={s.onboarding.pref_workout_length} />
            <Field label="Motivation level" value={s.onboarding.how_motivated} />
          </Section>

          <Section title="Injuries & Limitations">
            <Field label="Knee pain" value={s.onboarding.knee_pain} />
            <Field label="Pushups" value={s.onboarding.pushups} />
            <Field label="Stressed" value={s.onboarding.stressed} />
          </Section>

          <Section title="Preferences">
            <Field label="Body type" value={s.onboarding.body_type} />
            <Field label="Plan preference" value={s.onboarding.plan_reference} />
            <Field label="Commitment" value={s.onboarding.commit} />
            <Field label="How fit" value={s.onboarding.how_fit} />
          </Section>

          {/* JSONB / list alanları chip */}
          <Section title="Focus & Habits (multi-select)">
            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Body part focus</div>
              <div className="mt-2">
                <BadgeList items={tryParseJSON(s.onboarding.body_part_focus)} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Bad habits</div>
              <div className="mt-2">
                <BadgeList items={tryParseJSON(s.onboarding.bad_habit)} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">What motivates</div>
              <div className="mt-2">
                <BadgeList items={tryParseJSON(s.onboarding.what_motivate)} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <div className="text-xs text-gray-500">Workout place</div>
              <div className="mt-2">
                <BadgeList items={tryParseJSON(s.onboarding.workout_place)} />
              </div>
            </div>
          </Section>

          {/* Her şeyi göstermek istersen ama yormasın diye collapse */}
          <Collapse
            title="More details (all onboarding fields)"
            open={showMore}
            onToggle={() => setShowMore((v) => !v)}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(s.onboarding || {})
                .filter(([k]) => !["id", "user_id", "created_at", "updated_at"].includes(k))
                .map(([k, v]) => (
                  <Field
                    key={k}
                    label={prettyKey(k)}
                    value={typeof v === "object" && v !== null ? JSON.stringify(v) : v}
                  />
                ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Onboarding created at" value={s.onboarding.created_at} />
              <Field label="Onboarding updated at" value={s.onboarding.updated_at} />
            </div>
          </Collapse>
        </div>
      ) : tab === "programs" ? (
        <ProgramsTab
    studentId={Number(id)}
    activePrograms={data?.active_programs}
  />
      ) : (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-gray-900">Messages</div>
          <p className="mt-2 text-sm text-gray-600">
            Buraya koç-öğrenci mesaj geçmişi + yeni mesaj input’u gelecek.
          </p>
        </div>
      )}
    </div>
  );
}
