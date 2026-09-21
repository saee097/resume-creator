"use client";

import { useFormState, useFormStatus } from "react-dom";
import { onboardAction } from "@/lib/actions";
import { USER_TYPES, type UserType } from "@/lib/types";

const LABELS: Record<UserType, string> = {
  student: "Student",
  graduate: "Fresh Graduate",
  professional: "Professional",
  freelancer: "Freelancer",
  executive: "Executive",
  recruiter: "Recruiter",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Setting up…" : "Continue"}
    </button>
  );
}

export default function OnboardForm() {
  const [state, formAction] = useFormState(onboardAction, null);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="name">
          Full name
        </label>
        <input id="name" name="name" className="input" placeholder="Alex Carter" />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          placeholder="alex@example.com"
        />
      </div>
      <div>
        <label className="label">I am a</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {USER_TYPES.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:bg-slate-50"
            >
              <input
                type="radio"
                name="userType"
                value={t}
                className="accent-brand-600"
                defaultChecked={t === "professional"}
              />
              {LABELS[t]}
            </label>
          ))}
        </div>
      </div>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
