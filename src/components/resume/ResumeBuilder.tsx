"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  generateSummaryAction,
  improveBulletAction,
  saveResumeAction,
  saveResumeVersionAction,
} from "@/lib/actions";
import type {
  Award,
  Course,
  CustomSection,
  CustomSectionItem,
  Education,
  LanguageProficiency,
  ProjectEntry,
  Publication,
  ReferenceEntry,
  Resume,
  ResumeTemplate,
  VolunteerExperience,
  WorkExperience,
} from "@/lib/types";
import ResumePreview from "./ResumePreview";
import AtsPanel from "./AtsPanel";

const TEMPLATES: ResumeTemplate[] = ["modern", "classic", "compact"];

const rid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

function newExp(): WorkExperience {
  return {
    id: rid("exp"),
    company: "",
    role: "",
    startDate: "",
    current: false,
    bullets: [""],
  };
}
function newEdu(): Education {
  return {
    id: rid("edu"),
    school: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
  };
}
function newProj(): ProjectEntry {
  return {
    id: rid("proj"),
    name: "",
    description: "",
    technologies: [],
  };
}
function newAward(): Award {
  return { id: rid("awd"), title: "", issuer: "", date: "", description: "" };
}
function newPublication(): Publication {
  return { id: rid("pub"), title: "", publisher: "", date: "", url: "" };
}
function newCourse(): Course {
  return { id: rid("crs"), name: "", institution: "", date: "", url: "" };
}
function newLanguage(): LanguageProficiency {
  return { language: "", level: "intermediate" };
}
function newVolunteer(): VolunteerExperience {
  return {
    id: rid("vol"),
    organization: "",
    role: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
  };
}
function newReference(): ReferenceEntry {
  return { id: rid("ref"), name: "", title: "", company: "", email: "", phone: "" };
}
function newCustomItem(): CustomSectionItem {
  return { id: rid("csi"), title: "", subtitle: "", date: "", description: "" };
}
function newCustomSection(): CustomSection {
  return { id: rid("cs"), title: "", items: [newCustomItem()] };
}

const LANGUAGE_LEVELS: LanguageProficiency["level"][] = [
  "native",
  "fluent",
  "intermediate",
  "beginner",
];

export default function ResumeBuilder({ initial }: { initial: Resume }) {
  const [resume, setResume] = useState<Resume>(initial);
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "versioned"
  >("idle");
  const [busy, setBusy] = useState(false);
  const [autosave, setAutosave] = useState(true);
  const skipFirst = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function patch(p: Partial<Resume>) {
    setResume((r) => ({ ...r, ...p }));
  }
  function setContact<K extends keyof Resume["contact"]>(
    k: K,
    v: Resume["contact"][K],
  ) {
    setResume((r) => ({ ...r, contact: { ...r.contact, [k]: v } }));
  }

  // Generic helpers for the array-based sections.
  function addItem<T>(key: keyof Resume, item: T) {
    setResume((r) => ({
      ...r,
      [key]: [...(((r[key] as T[] | undefined) ?? [])), item],
    }));
  }
  function updateItem<T>(key: keyof Resume, idx: number, patch: Partial<T>) {
    setResume((r) => ({
      ...r,
      [key]: ((r[key] as T[] | undefined) ?? []).map((x, i) =>
        i === idx ? { ...x, ...patch } : x,
      ),
    }));
  }
  function removeItem(key: keyof Resume, idx: number) {
    setResume((r) => ({
      ...r,
      [key]: ((r[key] as unknown[] | undefined) ?? []).filter(
        (_, i) => i !== idx,
      ),
    }));
  }

  async function save() {
    setStatus("saving");
    await saveResumeAction(resume);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  }

  async function saveVersion() {
    setBusy(true);
    await saveResumeAction(resume);
    await saveResumeVersionAction(resume.id, resume.title);
    setBusy(false);
    setStatus("versioned");
    setTimeout(() => setStatus("idle"), 2000);
  }

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (!autosave) return;
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    timer.current = setTimeout(async () => {
      await saveResumeAction(resume);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    }, 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume]);

  async function aiSummary() {
    setBusy(true);
    const { text } = await generateSummaryAction(resume.id);
    patch({ summary: text });
    setBusy(false);
  }

  async function aiBullet(expIdx: number, bIdx: number) {
    const bullet = resume.experience[expIdx].bullets[bIdx];
    if (!bullet.trim()) return;
    setBusy(true);
    const { text } = await improveBulletAction(
      bullet,
      resume.experience[expIdx].role,
      resume.skills,
    );
    setResume((r) => {
      const exp = r.experience.map((e, i) =>
        i === expIdx
          ? {
              ...e,
              bullets: e.bullets.map((b, j) => (j === bIdx ? text : b)),
            }
          : e,
      );
      return { ...r, experience: exp };
    });
    setBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div className="space-y-5">
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <input
              className="input max-w-xs font-semibold"
              value={resume.title}
              onChange={(e) => patch({ title: e.target.value })}
            />
            <select
              className="input max-w-[160px]"
              value={resume.template}
              onChange={(e) =>
                patch({ template: e.target.value as ResumeTemplate })
              }
            >
              {TEMPLATES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                value={resume.contact.fullName}
                onChange={(e) => setContact("fullName", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                value={resume.contact.email}
                onChange={(e) => setContact("email", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={resume.contact.phone ?? ""}
                onChange={(e) => setContact("phone", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={resume.contact.location ?? ""}
                onChange={(e) => setContact("location", e.target.value)}
              />
            </div>
            <div>
              <label className="label">LinkedIn</label>
              <input
                className="input"
                value={resume.contact.linkedin ?? ""}
                onChange={(e) => setContact("linkedin", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Website</label>
              <input
                className="input"
                value={resume.contact.website ?? ""}
                onChange={(e) => setContact("website", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card space-y-2 p-5">
          <div className="flex items-center justify-between">
            <label className="label mb-0">Professional summary</label>
            <button
              className="btn-secondary text-xs"
              onClick={aiSummary}
              disabled={busy}
            >
              ✨ AI write
            </button>
          </div>
          <textarea
            className="input min-h-[90px]"
            value={resume.summary}
            onChange={(e) => patch({ summary: e.target.value })}
            placeholder="2-3 sentences highlighting your impact…"
          />
        </div>

        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Experience</h3>
            <button
              className="btn-secondary text-xs"
              onClick={() =>
                setResume((r) => ({
                  ...r,
                  experience: [...r.experience, newExp()],
                }))
              }
            >
              + Add
            </button>
          </div>
          {resume.experience.map((exp, ei) => (
            <div key={exp.id} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Role"
                  value={exp.role}
                  onChange={(e) =>
                    setResume((r) => ({
                      ...r,
                      experience: r.experience.map((x, i) =>
                        i === ei ? { ...x, role: e.target.value } : x,
                      ),
                    }))
                  }
                />
                <input
                  className="input"
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) =>
                    setResume((r) => ({
                      ...r,
                      experience: r.experience.map((x, i) =>
                        i === ei ? { ...x, company: e.target.value } : x,
                      ),
                    }))
                  }
                />
                <input
                  className="input"
                  placeholder="Start (YYYY-MM)"
                  value={exp.startDate}
                  onChange={(e) =>
                    setResume((r) => ({
                      ...r,
                      experience: r.experience.map((x, i) =>
                        i === ei ? { ...x, startDate: e.target.value } : x,
                      ),
                    }))
                  }
                />
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="End (YYYY-MM)"
                    disabled={exp.current}
                    value={exp.endDate ?? ""}
                    onChange={(e) =>
                      setResume((r) => ({
                        ...r,
                        experience: r.experience.map((x, i) =>
                          i === ei ? { ...x, endDate: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={exp.current}
                      onChange={(e) =>
                        setResume((r) => ({
                          ...r,
                          experience: r.experience.map((x, i) =>
                            i === ei ? { ...x, current: e.target.checked } : x,
                          ),
                        }))
                      }
                    />
                    Now
                  </label>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {exp.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-2">
                    <input
                      className="input"
                      placeholder="Achievement with a metric…"
                      value={b}
                      onChange={(e) =>
                        setResume((r) => ({
                          ...r,
                          experience: r.experience.map((x, i) =>
                            i === ei
                              ? {
                                  ...x,
                                  bullets: x.bullets.map((bb, j) =>
                                    j === bi ? e.target.value : bb,
                                  ),
                                }
                              : x,
                          ),
                        }))
                      }
                    />
                    <button
                      className="btn-secondary shrink-0 text-xs"
                      onClick={() => aiBullet(ei, bi)}
                      disabled={busy}
                      title="Improve with AI"
                    >
                      ✨
                    </button>
                  </div>
                ))}
                <button
                  className="text-xs text-brand-700 hover:underline"
                  onClick={() =>
                    setResume((r) => ({
                      ...r,
                      experience: r.experience.map((x, i) =>
                        i === ei ? { ...x, bullets: [...x.bullets, ""] } : x,
                      ),
                    }))
                  }
                >
                  + Add bullet
                </button>
              </div>
              <button
                className="mt-2 text-xs text-red-500 hover:underline"
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    experience: r.experience.filter((_, i) => i !== ei),
                  }))
                }
              >
                Remove experience
              </button>
            </div>
          ))}
        </div>

        <div className="card space-y-4 p-5">
          <h3 className="font-semibold text-slate-900">Education</h3>
          {resume.education.map((ed, i) => (
            <div key={ed.id} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="School"
                  value={ed.school}
                  onChange={(e) =>
                    setResume((r) => ({
                      ...r,
                      education: r.education.map((x, j) =>
                        j === i ? { ...x, school: e.target.value } : x,
                      ),
                    }))
                  }
                />
                <input
                  className="input"
                  placeholder="Degree"
                  value={ed.degree}
                  onChange={(e) =>
                    setResume((r) => ({
                      ...r,
                      education: r.education.map((x, j) =>
                        j === i ? { ...x, degree: e.target.value } : x,
                      ),
                    }))
                  }
                />
                <input
                  className="input"
                  placeholder="Field of study"
                  value={ed.field ?? ""}
                  onChange={(e) =>
                    setResume((r) => ({
                      ...r,
                      education: r.education.map((x, j) =>
                        j === i ? { ...x, field: e.target.value } : x,
                      ),
                    }))
                  }
                />
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="Start"
                    value={ed.startDate}
                    onChange={(e) =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.map((x, j) =>
                          j === i ? { ...x, startDate: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                  <input
                    className="input"
                    placeholder="End"
                    value={ed.endDate ?? ""}
                    onChange={(e) =>
                      setResume((r) => ({
                        ...r,
                        education: r.education.map((x, j) =>
                          j === i ? { ...x, endDate: e.target.value } : x,
                        ),
                      }))
                    }
                  />
                </div>
              </div>
              <button
                className="mt-2 text-xs text-red-500 hover:underline"
                onClick={() =>
                  setResume((r) => ({
                    ...r,
                    education: r.education.filter((_, j) => j !== i),
                  }))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            className="btn-secondary text-xs"
            onClick={() =>
              setResume((r) => ({ ...r, education: [...r.education, newEdu()] }))
            }
          >
            + Add education
          </button>
        </div>

        <div className="card space-y-2 p-5">
          <label className="label">Skills (comma separated)</label>
          <input
            className="input"
            value={resume.skills.join(", ")}
            onChange={(e) =>
              patch({
                skills: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="React, TypeScript, Leadership"
          />
        </div>

        <div className="card space-y-4 p-5">
          <h3 className="font-semibold text-slate-900">Projects</h3>
          {resume.projects.map((p, i) => (
            <div key={p.id} className="rounded-lg border border-slate-200 p-3">
              <input
                className="input"
                placeholder="Project name"
                value={p.name}
                onChange={(e) =>
                  setResume((r) => ({
                    ...r,
                    projects: r.projects.map((x, j) =>
                      j === i ? { ...x, name: e.target.value } : x,
                    ),
                  }))
                }
              />
              <textarea
                className="input mt-2 min-h-[60px]"
                placeholder="Description"
                value={p.description ?? ""}
                onChange={(e) =>
                  setResume((r) => ({
                    ...r,
                    projects: r.projects.map((x, j) =>
                      j === i ? { ...x, description: e.target.value } : x,
                    ),
                  }))
                }
              />
            </div>
          ))}
          <button
            className="btn-secondary text-xs"
            onClick={() =>
              setResume((r) => ({ ...r, projects: [...r.projects, newProj()] }))
            }
          >
            + Add project
          </button>
        </div>

        {/* Languages */}
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Languages</h3>
            <button
              className="btn-secondary text-xs"
              onClick={() => addItem("languages", newLanguage())}
            >
              + Add
            </button>
          </div>
          {(resume.languages ?? []).map((l, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input"
                placeholder="Language"
                value={l.language}
                onChange={(e) =>
                  updateItem<LanguageProficiency>("languages", i, {
                    language: e.target.value,
                  })
                }
              />
              <select
                className="input max-w-[160px]"
                value={l.level}
                onChange={(e) =>
                  updateItem<LanguageProficiency>("languages", i, {
                    level: e.target.value as LanguageProficiency["level"],
                  })
                }
              >
                {LANGUAGE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
              <button
                className="btn-secondary shrink-0 text-xs text-red-500"
                onClick={() => removeItem("languages", i)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Awards */}
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Awards</h3>
            <button
              className="btn-secondary text-xs"
              onClick={() => addItem("awards", newAward())}
            >
              + Add
            </button>
          </div>
          {(resume.awards ?? []).map((a, i) => (
            <div key={a.id} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Title"
                  value={a.title}
                  onChange={(e) =>
                    updateItem<Award>("awards", i, { title: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Issuer"
                  value={a.issuer ?? ""}
                  onChange={(e) =>
                    updateItem<Award>("awards", i, { issuer: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Date (YYYY-MM)"
                  value={a.date ?? ""}
                  onChange={(e) =>
                    updateItem<Award>("awards", i, { date: e.target.value })
                  }
                />
              </div>
              <textarea
                className="input mt-2 min-h-[50px]"
                placeholder="Description"
                value={a.description ?? ""}
                onChange={(e) =>
                  updateItem<Award>("awards", i, {
                    description: e.target.value,
                  })
                }
              />
              <button
                className="mt-2 text-xs text-red-500 hover:underline"
                onClick={() => removeItem("awards", i)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Publications */}
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Publications</h3>
            <button
              className="btn-secondary text-xs"
              onClick={() => addItem("publications", newPublication())}
            >
              + Add
            </button>
          </div>
          {(resume.publications ?? []).map((p, i) => (
            <div key={p.id} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Title"
                  value={p.title}
                  onChange={(e) =>
                    updateItem<Publication>("publications", i, {
                      title: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Publisher"
                  value={p.publisher ?? ""}
                  onChange={(e) =>
                    updateItem<Publication>("publications", i, {
                      publisher: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Date (YYYY-MM)"
                  value={p.date ?? ""}
                  onChange={(e) =>
                    updateItem<Publication>("publications", i, {
                      date: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="URL"
                  value={p.url ?? ""}
                  onChange={(e) =>
                    updateItem<Publication>("publications", i, {
                      url: e.target.value,
                    })
                  }
                />
              </div>
              <textarea
                className="input mt-2 min-h-[50px]"
                placeholder="Description"
                value={p.description ?? ""}
                onChange={(e) =>
                  updateItem<Publication>("publications", i, {
                    description: e.target.value,
                  })
                }
              />
              <button
                className="mt-2 text-xs text-red-500 hover:underline"
                onClick={() => removeItem("publications", i)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Courses */}
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Courses</h3>
            <button
              className="btn-secondary text-xs"
              onClick={() => addItem("courses", newCourse())}
            >
              + Add
            </button>
          </div>
          {(resume.courses ?? []).map((c, i) => (
            <div key={c.id} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Course name"
                  value={c.name}
                  onChange={(e) =>
                    updateItem<Course>("courses", i, { name: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Institution"
                  value={c.institution ?? ""}
                  onChange={(e) =>
                    updateItem<Course>("courses", i, {
                      institution: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Date (YYYY-MM)"
                  value={c.date ?? ""}
                  onChange={(e) =>
                    updateItem<Course>("courses", i, { date: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="URL"
                  value={c.url ?? ""}
                  onChange={(e) =>
                    updateItem<Course>("courses", i, { url: e.target.value })
                  }
                />
              </div>
              <button
                className="mt-2 text-xs text-red-500 hover:underline"
                onClick={() => removeItem("courses", i)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Volunteer */}
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Volunteer</h3>
            <button
              className="btn-secondary text-xs"
              onClick={() => addItem("volunteer", newVolunteer())}
            >
              + Add
            </button>
          </div>
          {(resume.volunteer ?? []).map((v, i) => (
            <div key={v.id} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Organization"
                  value={v.organization}
                  onChange={(e) =>
                    updateItem<VolunteerExperience>("volunteer", i, {
                      organization: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Role"
                  value={v.role ?? ""}
                  onChange={(e) =>
                    updateItem<VolunteerExperience>("volunteer", i, {
                      role: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Start (YYYY-MM)"
                  value={v.startDate ?? ""}
                  onChange={(e) =>
                    updateItem<VolunteerExperience>("volunteer", i, {
                      startDate: e.target.value,
                    })
                  }
                />
                <div className="flex gap-2">
                  <input
                    className="input"
                    placeholder="End (YYYY-MM)"
                    disabled={v.current}
                    value={v.endDate ?? ""}
                    onChange={(e) =>
                      updateItem<VolunteerExperience>("volunteer", i, {
                        endDate: e.target.value,
                      })
                    }
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={v.current ?? false}
                      onChange={(e) =>
                        updateItem<VolunteerExperience>("volunteer", i, {
                          current: e.target.checked,
                        })
                      }
                    />
                    Now
                  </label>
                </div>
              </div>
              <textarea
                className="input mt-2 min-h-[50px]"
                placeholder="Description"
                value={v.description ?? ""}
                onChange={(e) =>
                  updateItem<VolunteerExperience>("volunteer", i, {
                    description: e.target.value,
                  })
                }
              />
              <button
                className="mt-2 text-xs text-red-500 hover:underline"
                onClick={() => removeItem("volunteer", i)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* References */}
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">References</h3>
            <button
              className="btn-secondary text-xs"
              onClick={() => addItem("references", newReference())}
            >
              + Add
            </button>
          </div>
          {(resume.references ?? []).map((ref, i) => (
            <div key={ref.id} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="Name"
                  value={ref.name}
                  onChange={(e) =>
                    updateItem<ReferenceEntry>("references", i, {
                      name: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Title"
                  value={ref.title ?? ""}
                  onChange={(e) =>
                    updateItem<ReferenceEntry>("references", i, {
                      title: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Company"
                  value={ref.company ?? ""}
                  onChange={(e) =>
                    updateItem<ReferenceEntry>("references", i, {
                      company: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Email"
                  value={ref.email ?? ""}
                  onChange={(e) =>
                    updateItem<ReferenceEntry>("references", i, {
                      email: e.target.value,
                    })
                  }
                />
                <input
                  className="input"
                  placeholder="Phone"
                  value={ref.phone ?? ""}
                  onChange={(e) =>
                    updateItem<ReferenceEntry>("references", i, {
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <button
                className="mt-2 text-xs text-red-500 hover:underline"
                onClick={() => removeItem("references", i)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Custom Sections */}
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Custom Sections</h3>
            <button
              className="btn-secondary text-xs"
              onClick={() => addItem("customSections", newCustomSection())}
            >
              + Add section
            </button>
          </div>
          {(resume.customSections ?? []).map((cs, si) => (
            <div key={cs.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <input
                  className="input font-semibold"
                  placeholder="Section title (e.g. Speaking, Patents)"
                  value={cs.title}
                  onChange={(e) =>
                    updateItem<CustomSection>("customSections", si, {
                      title: e.target.value,
                    })
                  }
                />
                <button
                  className="btn-secondary shrink-0 text-xs text-red-500"
                  onClick={() => removeItem("customSections", si)}
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {cs.items.map((it, ii) => (
                  <div
                    key={it.id}
                    className="rounded-md border border-slate-100 bg-slate-50 p-2"
                  >
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        className="input"
                        placeholder="Title"
                        value={it.title ?? ""}
                        onChange={(e) =>
                          updateItem<CustomSection>("customSections", si, {
                            items: cs.items.map((x, j) =>
                              j === ii ? { ...x, title: e.target.value } : x,
                            ),
                          })
                        }
                      />
                      <input
                        className="input"
                        placeholder="Subtitle"
                        value={it.subtitle ?? ""}
                        onChange={(e) =>
                          updateItem<CustomSection>("customSections", si, {
                            items: cs.items.map((x, j) =>
                              j === ii ? { ...x, subtitle: e.target.value } : x,
                            ),
                          })
                        }
                      />
                      <input
                        className="input"
                        placeholder="Date"
                        value={it.date ?? ""}
                        onChange={(e) =>
                          updateItem<CustomSection>("customSections", si, {
                            items: cs.items.map((x, j) =>
                              j === ii ? { ...x, date: e.target.value } : x,
                            ),
                          })
                        }
                      />
                    </div>
                    <textarea
                      className="input mt-2 min-h-[46px]"
                      placeholder="Description"
                      value={it.description ?? ""}
                      onChange={(e) =>
                        updateItem<CustomSection>("customSections", si, {
                          items: cs.items.map((x, j) =>
                            j === ii
                              ? { ...x, description: e.target.value }
                              : x,
                          ),
                        })
                      }
                    />
                    <button
                      className="mt-1 text-xs text-red-500 hover:underline"
                      onClick={() =>
                        updateItem<CustomSection>("customSections", si, {
                          items: cs.items.filter((_, j) => j !== ii),
                        })
                      }
                    >
                      Remove item
                    </button>
                  </div>
                ))}
                <button
                  className="text-xs text-brand-700 hover:underline"
                  onClick={() =>
                    updateItem<CustomSection>("customSections", si, {
                      items: [...cs.items, newCustomItem()],
                    })
                  }
                >
                  + Add item
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={autosave}
                onChange={(e) => setAutosave(e.target.checked)}
              />
              Autosave {autosave ? "on" : "off"}
            </label>
            <span className="text-sm text-slate-500">
              {status === "saving"
                ? "Saving…"
                : status === "saved"
                  ? "Autosaved ✓"
                  : status === "versioned"
                    ? "Version saved ✓"
                    : "Live preview"}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={save} disabled={busy}>
              Save resume
            </button>
            <button
              className="btn-secondary"
              onClick={saveVersion}
              disabled={busy}
            >
              Save version
            </button>
            <Link href={`/resumes/${resume.id}/preview`} className="btn-secondary">
              Preview
            </Link>
            <Link href={`/resumes/${resume.id}/history`} className="btn-secondary">
              History
            </Link>
          </div>
        </div>
        <AtsPanel resume={resume} />
        <ResumePreview resume={resume} />
      </div>
    </div>
  );
}
