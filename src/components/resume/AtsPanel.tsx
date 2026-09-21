"use client";

import { analyzeATS } from "@/lib/ats";
import type { Resume } from "@/lib/types";

export default function AtsPanel({ resume }: { resume: Resume }) {
  const result = analyzeATS(resume);
  const color =
    result.score >= 80
      ? "bg-green-500"
      : result.score >= 70
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">ATS Score</h3>
        <span
          className={`badge ${result.passed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}
        >
          {result.passed ? "Likely passes" : "Needs work"}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="text-3xl font-bold text-slate-900">{result.score}</div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full ${color}`} style={{ width: `${result.score}%` }} />
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm">
        {result.checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2">
            <span className={c.passed ? "text-green-600" : "text-red-500"}>
              {c.passed ? "✓" : "✗"}
            </span>
            <span className={c.passed ? "text-slate-700" : "text-slate-500"}>
              {c.label}
            </span>
          </li>
        ))}
      </ul>

      {result.suggestions.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <strong>Tips:</strong>
          <ul className="mt-1 list-disc pl-4">
            {result.suggestions.slice(0, 3).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
