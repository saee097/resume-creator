"use client";

import { useState, useTransition } from "react";
import {
  createCoachingPlanAction,
  toggleCoachingStepAction,
} from "@/lib/actions";
import type { CoachingPlan } from "@/lib/types";

export default function CoachingBoard({
  plans,
}: {
  plans: CoachingPlan[];
}) {
  const [goal, setGoal] = useState("");
  const [local, setLocal] = useState<CoachingPlan[]>(plans);
  const [, start] = useTransition();

  async function create() {
    if (!goal.trim()) return;
    const { plan } = await createCoachingPlanAction(goal);
    setLocal([plan, ...local]);
    setGoal("");
  }

  function toggle(planId: string, index: number) {
    setLocal((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              steps: p.steps.map((s, i) =>
                i === index ? { ...s, done: !s.done } : s,
              ),
            }
          : p,
      ),
    );
    start(() => {
      toggleCoachingStepAction(planId, index);
    });
  }

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-3 p-5 sm:flex-row">
        <input
          className="input flex-1"
          placeholder="Your goal, e.g. 'Land a senior frontend role in 3 months'"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
        <button className="btn-primary" onClick={create} disabled={!goal.trim()}>
          ✨ Generate plan
        </button>
      </div>

      {local.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">
          Describe a career goal to generate an AI coaching plan.
        </div>
      ) : (
        local.map((plan) => {
          const done = plan.steps.filter((s) => s.done).length;
          return (
            <div key={plan.id} className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{plan.goal}</h3>
                <span className="badge bg-brand-100 text-brand-700">
                  {done}/{plan.steps.length}
                </span>
              </div>
              <ol className="mt-4 space-y-2">
                {plan.steps.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => toggle(plan.id, i)}
                      className="flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-slate-50"
                    >
                      <span
                        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-xs ${
                          s.done
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-slate-300 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span
                        className={
                          s.done
                            ? "text-sm text-slate-400 line-through"
                            : "text-sm text-slate-700"
                        }
                      >
                        <strong>{s.title}</strong>
                        <span className="block font-normal text-slate-500">
                          {s.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          );
        })
      )}
    </div>
  );
}
