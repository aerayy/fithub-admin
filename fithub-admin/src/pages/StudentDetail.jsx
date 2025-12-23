import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProgramsTab from "../components/ProgramsTab";

const MOCK_STUDENT = {
  id: "1",
  name: "Ahmet Yılmaz",
  goal: "Fat loss",
  gender: "Male",
  age: 29,
  height: 178,
  weight: 82,
  activity: "3–4 days / week",
  sleep: "6–7 hours",
  stress: "Medium",
  nutrition: {
    diet: "No specific diet",
    allergies: "None",
    dislikes: "Broccoli",
    mealsPerDay: 3,
  },
  injuries: "None",
};

const Section = ({ title, children }) => (
  <div className="rounded-2xl border bg-white p-5 shadow-sm">
    <div className="mb-4 text-sm font-semibold text-gray-900">{title}</div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </div>
);

const Field = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="mt-1 text-sm font-medium text-gray-900">{value ?? "-"}</div>
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

export default function StudentDetail() {
  const { id } = useParams();
  const s = useMemo(() => MOCK_STUDENT, []);
  const [tab, setTab] = useState("overview"); // overview | programs | messages

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{s.name}</h1>
          <p className="mt-1 text-sm text-gray-600">Student ID: {id}</p>
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
            <Field label="Primary goal" value={s.goal} />
            <Field label="Gender" value={s.gender} />
            <Field label="Age" value={`${s.age}`} />
          </Section>

          <Section title="Body Information">
            <Field label="Height (cm)" value={s.height} />
            <Field label="Weight (kg)" value={s.weight} />
          </Section>

          <Section title="Lifestyle">
            <Field label="Activity level" value={s.activity} />
            <Field label="Sleep" value={s.sleep} />
            <Field label="Stress level" value={s.stress} />
          </Section>

          <Section title="Nutrition Preferences">
            <Field label="Diet type" value={s.nutrition.diet} />
            <Field label="Meals per day" value={s.nutrition.mealsPerDay} />
            <Field label="Allergies" value={s.nutrition.allergies} />
            <Field label="Dislikes" value={s.nutrition.dislikes} />
          </Section>

          <Section title="Injuries & Limitations">
            <Field label="Reported issues" value={s.injuries} />
          </Section>
        </div>
      ) : tab === "programs" ? (
        <ProgramsTab />
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
