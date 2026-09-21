import Link from "next/link";

const FEATURES = [
  {
    title: "ATS-Friendly Builder",
    desc: "Real-time ATS scoring and suggestions so your resume survives screening.",
    icon: "✓",
  },
  {
    title: "AI Writing",
    desc: "Generate summaries and rewrite bullets with strong, quantified language.",
    icon: "✎",
  },
  {
    title: "Job Matching",
    desc: "See how well you match open roles and what skills to build next.",
    icon: "◎",
  },
  {
    title: "Cover Letters",
    desc: "Tailored, tone-aware cover letters in seconds for any job.",
    icon: "✉",
  },
  {
    title: "Interview Prep",
    desc: "Role-specific questions with model answers to practice confidently.",
    icon: "?",
  },
  {
    title: "Portfolio & Coaching",
    desc: "Showcase work and follow AI career plans toward your goals.",
    icon: "★",
  },
];

const USER_TYPES = [
  "Students",
  "Fresh Graduates",
  "Professionals",
  "Freelancers",
  "Executives",
  "Recruiters",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2 font-bold text-brand-700">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            R
          </span>
          ResumeForge
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/onboarding" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/onboarding" className="btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <span className="badge bg-brand-100 text-brand-700">
          AI-powered career platform
        </span>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Build resumes that beat the bots and win the interview
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          ResumeForge helps {USER_TYPES.join(", ").replace(/, ([^,]*)$/, " & $1")}{" "}
          craft ATS-optimized resumes, match with jobs, and prepare for every
          step of the hiring process.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href="/onboarding" className="btn-primary px-6 py-3 text-base">
            Create your resume
          </Link>
          <Link href="/dashboard" className="btn-secondary px-6 py-3 text-base">
            Explore the demo
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="card p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-lg text-brand-700">
              {f.icon}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900">
          Built for every career stage
        </h2>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {USER_TYPES.map((u) => (
            <span key={u} className="badge bg-slate-100 text-slate-700">
              {u}
            </span>
          ))}
        </div>
      </section>

      <footer className="mx-auto mt-20 max-w-6xl px-6 py-8 text-center text-sm text-slate-400">
        ResumeForge — demo build. AI runs locally by default; set OPENAI_API_KEY
        to enable LLM-powered generation.
      </footer>
    </main>
  );
}
