"use client";

import { useState } from "react";
import { addPortfolioProjectAction, savePortfolioAction } from "@/lib/actions";
import type { Portfolio } from "@/lib/types";

const THEMES: Portfolio["theme"][] = ["light", "dark", "accent"];

export default function PortfolioEditor({
  portfolio,
  publicUrl,
}: {
  portfolio: Portfolio;
  publicUrl: string;
}) {
  const [p, setP] = useState<Portfolio>(portfolio);
  const [status, setStatus] = useState("idle");
  const [form, setForm] = useState({
    title: "",
    summary: "",
    url: "",
    repoUrl: "",
    tags: "",
  });

  function update<K extends keyof Portfolio>(k: K, v: Portfolio[K]) {
    setP((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setStatus("saving");
    await savePortfolioAction(p);
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  async function addProject() {
    if (!form.title.trim()) return;
    await addPortfolioProjectAction(p.id, form);
    setForm({ title: "", summary: "", url: "", repoUrl: "", tags: "" });
  }

  const themeBg =
    p.theme === "dark"
      ? "bg-slate-900 text-white"
      : p.theme === "accent"
        ? "bg-brand-700 text-white"
        : "bg-white text-slate-900";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div className="card space-y-3 p-5">
          <div>
            <label className="label">Headline</label>
            <input
              className="input"
              value={p.headline}
              onChange={(e) => update("headline", e.target.value)}
            />
          </div>
          <div>
            <label className="label">About</label>
            <textarea
              className="input min-h-[80px]"
              value={p.about}
              onChange={(e) => update("about", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Theme</label>
            <select
              className="input"
              value={p.theme}
              onChange={(e) =>
                update("theme", e.target.value as Portfolio["theme"])
              }
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand-700 hover:underline"
            >
              View public page ↗
            </a>
            <button className="btn-primary" onClick={save}>
              {status === "saving"
                ? "Saving…"
                : status === "saved"
                  ? "Saved ✓"
                  : "Save portfolio"}
            </button>
          </div>
        </div>

        <div className="card space-y-3 p-5">
          <h3 className="font-semibold text-slate-900">Add project</h3>
          <input
            className="input"
            placeholder="Project title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            className="input min-h-[60px]"
            placeholder="Summary"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="input"
              placeholder="Live URL"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
            <input
              className="input"
              placeholder="Repo URL"
              value={form.repoUrl}
              onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
            />
          </div>
          <input
            className="input"
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
          <button className="btn-secondary w-full" onClick={addProject}>
            + Add project
          </button>
        </div>
      </div>

      <div className={`rounded-xl border border-slate-200 ${themeBg} p-6`}>
        <h2 className="text-xl font-bold">{p.headline}</h2>
        {p.about && <p className="mt-2 text-sm opacity-80">{p.about}</p>}
        <div className="mt-5 space-y-3">
          {p.projects.length === 0 ? (
            <p className="text-sm opacity-60">No projects yet.</p>
          ) : (
            p.projects.map((proj) => (
              <div key={proj.id} className="rounded-lg bg-black/5 p-3">
                <div className="font-semibold">{proj.title}</div>
                {proj.summary && (
                  <p className="text-sm opacity-80">{proj.summary}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {proj.tags.map((t) => (
                    <span
                      key={t}
                      className="badge bg-black/10 text-current"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
