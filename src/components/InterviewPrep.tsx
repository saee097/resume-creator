"use client";

import { useState } from "react";
import type { InterviewQuestion } from "@/lib/types";

const CATEGORIES: (InterviewQuestion["category"] | "all")[] = [
  "all",
  "behavioral",
  "technical",
  "situational",
  "general",
];

const TITLES: Record<string, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  situational: "Situational",
  general: "General",
};

export default function InterviewPrep({
  questions,
}: {
  questions: InterviewQuestion[];
}) {
  const [filter, setFilter] = useState<(typeof CATEGORIES)[number]>("all");
  const [open, setOpen] = useState<string | null>(null);

  const shown =
    filter === "all" ? questions : questions.filter((q) => q.category === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`btn ${
              filter === c
                ? "bg-brand-600 text-white"
                : "border border-slate-300 bg-white text-slate-600"
            }`}
          >
            {c === "all" ? "All" : TITLES[c]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map((q) => (
          <div key={q.id} className="card p-4">
            <button
              className="flex w-full items-center justify-between text-left"
              onClick={() => setOpen(open === q.id ? null : q.id)}
            >
              <span className="font-medium text-slate-900">{q.question}</span>
              <span className="ml-3 text-slate-400">
                {open === q.id ? "−" : "+"}
              </span>
            </button>
            <span className="badge mt-1 bg-slate-100 text-slate-500">
              {TITLES[q.category]}
            </span>
            {open === q.id && (
              <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-slate-700">
                <strong className="text-brand-700">Model answer: </strong>
                {q.suggestedAnswer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
