"use client";

import { useState, type FormEvent } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { onboardAction } from "@/lib/actions";
import { USER_TYPES, type UserType, type ResumeTemplate } from "@/lib/types";
import Link from "next/link";

const LABELS: Record<UserType, string> = {
  student: "Student",
  graduate: "Fresh Graduate",
  professional: "Professional",
  freelancer: "Freelancer",
  executive: "Executive",
  recruiter: "Recruiter",
};

const TEMPLATES: { id: ResumeTemplate; label: string; desc: string }[] = [
  {
    id: "modern",
    label: "Modern",
    desc: "Clean layout with a bold header and sidebar for skills.",
  },
  {
    id: "classic",
    label: "Classic",
    desc: "Traditional format favored by ATS and corporate roles.",
  },
  {
    id: "compact",
    label: "Compact",
    desc: "Dense, space-efficient layout for experienced professionals.",
  },
];

const START_METHODS = [
  {
    id: "blank",
    label: "Start from scratch",
    desc: "Build your resume section by section.",
    icon: "✎",
  },
  {
    id: "upload",
    label: "Upload a resume",
    desc: "Import a PDF or DOCX to get started fast.",
    icon: "↑",
  },
  {
    id: "linkedin",
    label: "Import from LinkedIn",
    desc: "Turn your LinkedIn profile into a resume.",
    icon: "in",
  },
];

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
              i + 1 === step
                ? "bg-brand-600 text-white"
                : i + 1 < step
                  ? "bg-brand-100 text-brand-700"
                  : "bg-slate-200 text-slate-500"
            }`}
          >
            {i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`h-0.5 w-8 ${
                i + 1 < step ? "bg-brand-600" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Creating your account…" : "Create my resume"}
    </button>
  );
}

export default function OnboardingWizard() {
  const [state, formAction] = useFormState(onboardAction, null);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType>("professional");
  const [startMethod, setStartMethod] = useState<string>("blank");
  const [template, setTemplate] = useState<ResumeTemplate>("modern");
  const [headline, setHeadline] = useState("");

  function nextStep() {
    setStep((s) => Math.min(s + 1, totalSteps));
  }

  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleSubmit(e: FormEvent) {
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    data.set("startMethod", startMethod);
    data.set("template", template);
    data.set("headline", headline);
    formAction(data);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 font-bold text-brand-700"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            R
          </span>
          ResumeForge
        </Link>
        <StepIndicator step={step} total={totalSteps} />
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="card space-y-4 p-6">
              <h1 className="text-center text-xl font-bold text-slate-900">
                Create your account
              </h1>
              <p className="text-center text-sm text-slate-500">
                We&apos;ll tailor the experience to your career stage.
              </p>
              <div>
                <label className="label" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  className="input"
                  placeholder="Alex Carter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">I am a</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {USER_TYPES.map((t) => (
                    <label
                      key={t}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-slate-50 ${
                        userType === t
                          ? "border-brand-600 bg-brand-50"
                          : "border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name="userType"
                        value={t}
                        checked={userType === t}
                        onChange={(e) => setUserType(e.target.value as UserType)}
                        className="accent-brand-600"
                      />
                      {LABELS[t]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                  disabled={!name || !email}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card space-y-4 p-6">
              <h1 className="text-center text-xl font-bold text-slate-900">
                How do you want to start?
              </h1>
              <p className="text-center text-sm text-slate-500">
                Choose the easiest way to build your resume.
              </p>
              <div className="grid gap-3">
                {START_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setStartMethod(m.id)}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-slate-50 ${
                      startMethod === m.id
                        ? "border-brand-600 bg-brand-50"
                        : "border-slate-200"
                    }`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                      {m.icon}
                    </span>
                    <div>
                      <div className="font-medium text-slate-900">{m.label}</div>
                      <div className="text-sm text-slate-500">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card space-y-4 p-6">
              <h1 className="text-center text-xl font-bold text-slate-900">
                Pick a template
              </h1>
              <p className="text-center text-sm text-slate-500">
                You can change this later in the editor.
              </p>
              <div className="grid gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`rounded-lg border p-4 text-left transition-colors hover:bg-slate-50 ${
                      template === t.id
                        ? "border-brand-600 bg-brand-50"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="font-medium text-slate-900">{t.label}</div>
                    <div className="text-sm text-slate-500">{t.desc}</div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="card space-y-4 p-6">
              <h1 className="text-center text-xl font-bold text-slate-900">
                Add a headline
              </h1>
              <p className="text-center text-sm text-slate-500">
                This will appear at the top of your resume. You can skip and add
                it later.
              </p>
              <div>
                <label className="label" htmlFor="headline">
                  Professional headline
                </label>
                <input
                  id="headline"
                  name="headline"
                  className="input"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
              {state?.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary"
                >
                  Back
                </button>
                <SubmitButton />
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}