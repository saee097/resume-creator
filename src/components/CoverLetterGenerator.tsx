"use client";

import { useState } from "react";
import { generateCoverLetterAction } from "@/lib/actions";
import type { CoverLetter, Job, Resume } from "@/lib/types";

const TONES = ["professional", "formal", "enthusiastic"] as const;

export default function CoverLetterGenerator({
  resumes,
  jobs,
  letters,
  presetJob,
  presetResume,
}: {
  resumes: Resume[];
  jobs: Job[];
  letters: CoverLetter[];
  presetJob?: string;
  presetResume?: string;
}) {
  const [resumeId, setResumeId] = useState(presetResume ?? resumes[0]?.id ?? "");
  const [jobId, setJobId] = useState(presetJob ?? jobs[0]?.id ?? "");
  const [tone, setTone] = useState<(typeof TONES)[number]>("professional");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!resumeId || !jobId) return;
    setBusy(true);
    const { content } = await generateCoverLetterAction(resumeId, jobId, tone);
    setContent(content);
    setBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <div className="card space-y-3 p-5">
          <div>
            <label className="label">Resume</label>
            <select
              className="input"
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Job</label>
            <select
              className="input"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.company}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tone</label>
            <select
              className="input"
              value={tone}
              onChange={(e) =>
                setTone(e.target.value as (typeof TONES)[number])
              }
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary w-full"
            onClick={generate}
            disabled={busy || !resumeId || !jobId}
          >
            {busy ? "Generating…" : "✨ Generate"}
          </button>
        </div>

        {letters.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Saved letters
            </h3>
            <ul className="mt-2 space-y-2 text-sm">
              {letters.slice(0, 5).map((l) => (
                <li key={l.id} className="text-slate-600">
                  {l.jobTitle} @ {l.company}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900">Preview</h2>
        {content ? (
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700">
            {content}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            Pick a resume and job, then generate a tailored cover letter.
          </p>
        )}
      </div>
    </div>
  );
}
