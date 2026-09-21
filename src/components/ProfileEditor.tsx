"use client";

import { useMemo, useState } from "react";
import { saveProfileAction } from "@/lib/actions";
import { profileCompleteness, initialsFrom } from "@/lib/profile";
import {
  USER_TYPES,
  type LanguageLevel,
  type Profile,
  type WorkMode,
} from "@/lib/types";

const LANGUAGE_LEVELS: LanguageLevel[] = [
  "native",
  "fluent",
  "intermediate",
  "beginner",
];
const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite"];
const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];

export default function ProfileEditor({ profile }: { profile: Profile }) {
  const [p, setP] = useState<Profile>(profile);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const completeness = useMemo(() => profileCompleteness(p), [p]);

  function update<K extends keyof Profile>(k: K, v: Profile[K]) {
    setP((prev) => ({ ...prev, [k]: v }));
  }
  function updateBasic<K extends keyof Profile["basicInfo"]>(
    k: K,
    v: Profile["basicInfo"][K],
  ) {
    setP((prev) => ({ ...prev, basicInfo: { ...prev.basicInfo, [k]: v } }));
  }
  function updateLocation<K extends keyof Profile["location"]>(
    k: K,
    v: Profile["location"][K],
  ) {
    setP((prev) => ({ ...prev, location: { ...prev.location, [k]: v } }));
  }
  function updatePrefs<K extends keyof Profile["preferences"]>(
    k: K,
    v: Profile["preferences"][K],
  ) {
    setP((prev) => ({ ...prev, preferences: { ...prev.preferences, [k]: v } }));
  }

  async function save() {
    setStatus("saving");
    const next = { ...p, updatedAt: new Date().toISOString() };
    await saveProfileAction(next);
    setP(next);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  // Languages
  function addLanguage() {
    update("languages", [
      ...p.languages,
      { language: "", level: "intermediate" },
    ]);
  }
  function updateLanguage(i: number, key: "language" | "level", value: string) {
    const next = [...p.languages];
    next[i] = { ...next[i], [key]: value } as Profile["languages"][number];
    update("languages", next);
  }
  function removeLanguage(i: number) {
    update(
      "languages",
      p.languages.filter((_, idx) => idx !== i),
    );
  }

  // Links
  function addLink() {
    update("links", [...p.links, { label: "", url: "" }]);
  }
  function updateLink(i: number, key: "label" | "url", value: string) {
    const next = [...p.links];
    next[i] = { ...next[i], [key]: value };
    update("links", next);
  }
  function removeLink(i: number) {
    update(
      "links",
      p.links.filter((_, idx) => idx !== i),
    );
  }

  // Career goals
  function addGoal() {
    update("careerGoals", [
      ...p.careerGoals,
      { id: `goal_${Math.random().toString(36).slice(2, 8)}`, title: "" },
    ]);
  }
  function updateGoal(
    i: number,
    key: "title" | "targetDate" | "description",
    value: string,
  ) {
    const next = [...p.careerGoals];
    next[i] = { ...next[i], [key]: value };
    update("careerGoals", next);
  }
  function removeGoal(i: number) {
    update(
      "careerGoals",
      p.careerGoals.filter((_, idx) => idx !== i),
    );
  }

  function toggleWorkMode(mode: WorkMode) {
    const has = p.preferences.workModes.includes(mode);
    updatePrefs(
      "workModes",
      has
        ? p.preferences.workModes.filter((m) => m !== mode)
        : [...p.preferences.workModes, mode],
    );
  }
  function toggleJobType(t: string) {
    const has = p.preferences.jobTypes.includes(t);
    updatePrefs(
      "jobTypes",
      has
        ? p.preferences.jobTypes.filter((x) => x !== t)
        : [...p.preferences.jobTypes, t],
    );
  }

  const avatarInitials = p.avatar?.initials || initialsFrom(p.basicInfo.fullName);

  return (
    <div className="space-y-6">
      {/* Header: avatar + completeness + save */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
            {avatarInitials || "?"}
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {p.basicInfo.fullName || "Your name"}
            </div>
            <div className="text-sm text-slate-500">
              {p.basicInfo.headline || "Add a headline"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-40">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Profile strength</span>
              <span className="font-semibold text-slate-700">
                {completeness}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full ${
                  completeness >= 80
                    ? "bg-green-500"
                    : completeness >= 50
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
          <button className="btn-primary" onClick={save}>
            {status === "saving"
              ? "Saving…"
              : status === "saved"
                ? "Saved ✓"
                : "Save profile"}
          </button>
        </div>
      </div>

      {/* Basic info */}
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold text-slate-900">Basic info</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={p.basicInfo.fullName}
              onChange={(e) => updateBasic("fullName", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Headline</label>
            <input
              className="input"
              placeholder="e.g. Senior Frontend Engineer"
              value={p.basicInfo.headline ?? ""}
              onChange={(e) => updateBasic("headline", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={p.basicInfo.email}
              onChange={(e) => updateBasic("email", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={p.basicInfo.phone ?? ""}
              onChange={(e) => updateBasic("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="label">User type</label>
            <select
              className="input"
              value={p.basicInfo.userType ?? "professional"}
              onChange={(e) =>
                updateBasic("userType", e.target.value as Profile["basicInfo"]["userType"])
              }
            >
              {USER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Avatar initials</label>
            <input
              className="input"
              maxLength={3}
              placeholder={initialsFrom(p.basicInfo.fullName)}
              value={p.avatar?.initials ?? ""}
              onChange={(e) =>
                update("avatar", { ...p.avatar, initials: e.target.value.toUpperCase() })
              }
            />
          </div>
        </div>
        <div>
          <label className="label">Bio</label>
          <textarea
            className="input min-h-[80px]"
            placeholder="A short professional summary"
            value={p.basicInfo.bio ?? ""}
            onChange={(e) => updateBasic("bio", e.target.value)}
          />
        </div>
      </section>

      {/* Location */}
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold text-slate-900">Location</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">City</label>
            <input
              className="input"
              value={p.location.city ?? ""}
              onChange={(e) => updateLocation("city", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Region</label>
            <input
              className="input"
              value={p.location.region ?? ""}
              onChange={(e) => updateLocation("region", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Country</label>
            <input
              className="input"
              value={p.location.country ?? ""}
              onChange={(e) => updateLocation("country", e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(p.location.remoteOnly)}
              onChange={(e) => updateLocation("remoteOnly", e.target.checked)}
            />
            Remote only
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(p.location.willingToRelocate)}
              onChange={(e) =>
                updateLocation("willingToRelocate", e.target.checked)
              }
            />
            Willing to relocate
          </label>
        </div>
      </section>

      {/* Skills */}
      <section className="card space-y-3 p-5">
        <h2 className="font-semibold text-slate-900">Skills</h2>
        <label className="label">Skills (comma separated)</label>
        <input
          className="input"
          value={p.skills.join(", ")}
          onChange={(e) =>
            update(
              "skills",
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
        />
        {p.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.skills.map((s) => (
              <span key={s} className="badge bg-slate-100 text-slate-700">
                {s}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Languages */}
      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Languages</h2>
          <button className="btn-ghost text-sm" onClick={addLanguage}>
            + Add
          </button>
        </div>
        {p.languages.length === 0 && (
          <p className="text-sm text-slate-500">No languages yet.</p>
        )}
        {p.languages.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input"
              placeholder="Language"
              value={l.language}
              onChange={(e) => updateLanguage(i, "language", e.target.value)}
            />
            <select
              className="input max-w-[160px]"
              value={l.level}
              onChange={(e) => updateLanguage(i, "level", e.target.value)}
            >
              {LANGUAGE_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
            <button
              className="btn-ghost text-rose-600"
              onClick={() => removeLanguage(i)}
              aria-label="Remove language"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      {/* Links */}
      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Links</h2>
          <button className="btn-ghost text-sm" onClick={addLink}>
            + Add
          </button>
        </div>
        {p.links.length === 0 && (
          <p className="text-sm text-slate-500">No links yet.</p>
        )}
        {p.links.map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="input max-w-[180px]"
              placeholder="Label (e.g. GitHub)"
              value={link.label}
              onChange={(e) => updateLink(i, "label", e.target.value)}
            />
            <input
              className="input"
              placeholder="https://…"
              value={link.url}
              onChange={(e) => updateLink(i, "url", e.target.value)}
            />
            <button
              className="btn-ghost text-rose-600"
              onClick={() => removeLink(i)}
              aria-label="Remove link"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      {/* Preferences */}
      <section className="card space-y-4 p-5">
        <h2 className="font-semibold text-slate-900">Job preferences</h2>
        <div>
          <label className="label">Job types</label>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map((t) => {
              const active = p.preferences.jobTypes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleJobType(t)}
                  className={`badge border ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="label">Work modes</label>
          <div className="flex flex-wrap gap-2">
            {WORK_MODES.map((m) => {
              const active = p.preferences.workModes.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleWorkMode(m)}
                  className={`badge border ${
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Minimum salary (USD/yr)</label>
            <input
              className="input"
              type="number"
              value={p.preferences.minSalary ?? ""}
              onChange={(e) =>
                updatePrefs(
                  "minSalary",
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </div>
          <div>
            <label className="label">Industries (comma separated)</label>
            <input
              className="input"
              value={(p.preferences.industries ?? []).join(", ")}
              onChange={(e) =>
                updatePrefs(
                  "industries",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(p.preferences.openToOpportunities)}
            onChange={(e) =>
              updatePrefs("openToOpportunities", e.target.checked)
            }
          />
          Open to new opportunities
        </label>
      </section>

      {/* Career goals */}
      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Career goals</h2>
          <button className="btn-ghost text-sm" onClick={addGoal}>
            + Add
          </button>
        </div>
        {p.careerGoals.length === 0 && (
          <p className="text-sm text-slate-500">No goals yet.</p>
        )}
        {p.careerGoals.map((g, i) => (
          <div key={g.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2">
              <input
                className="input"
                placeholder="Goal title"
                value={g.title}
                onChange={(e) => updateGoal(i, "title", e.target.value)}
              />
              <input
                className="input max-w-[140px]"
                placeholder="Target (e.g. 2027)"
                value={g.targetDate ?? ""}
                onChange={(e) => updateGoal(i, "targetDate", e.target.value)}
              />
              <button
                className="btn-ghost text-rose-600"
                onClick={() => removeGoal(i)}
                aria-label="Remove goal"
              >
                ✕
              </button>
            </div>
            <textarea
              className="input min-h-[52px]"
              placeholder="Description"
              value={g.description ?? ""}
              onChange={(e) => updateGoal(i, "description", e.target.value)}
            />
          </div>
        ))}
      </section>

      <div className="flex justify-end">
        <button className="btn-primary" onClick={save}>
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved ✓"
              : "Save profile"}
        </button>
      </div>
    </div>
  );
}
