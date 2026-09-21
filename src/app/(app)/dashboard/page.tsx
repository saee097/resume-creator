import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import { analyzeATS } from "@/lib/ats";
import { matchJobs } from "@/lib/matching";
import { profileCompleteness } from "@/lib/profile";
import { USER_TYPES, type UserType } from "@/lib/types";

const LABELS: Record<UserType, string> = {
  student: "Student",
  graduate: "Fresh Graduate",
  professional: "Professional",
  freelancer: "Freelancer",
  executive: "Executive",
  recruiter: "Recruiter",
};

const NEXT_STEPS: Record<UserType, string[]> = {
  student: [
    "Add class projects to your resume",
    "Practice behavioral interview questions",
    "Apply to 3 internships this week",
  ],
  graduate: [
    "Quantify your internship impact",
    "Generate a tailored cover letter",
    "Track applications in one place",
  ],
  professional: [
    "Boost your ATS score above 80",
    "Match against senior roles",
    "Refresh your portfolio",
  ],
  freelancer: [
    "Showcase 2 case studies",
    "Tailor proposals to job matches",
    "Collect client testimonials",
  ],
  executive: [
    "Strengthen your leadership summary",
    "Build a board-ready portfolio",
    "Coach toward your next charter",
  ],
  recruiter: [
    "Review candidate ATS scores",
    "Share templates with hires",
    "Track pipeline in Applications",
  ],
};

export default function DashboardPage() {
  const user = getCurrentUser();
  const resumes = repo.getUserResumes(user.id);
  const primary = resumes[0];
  const ats = primary ? analyzeATS(primary) : null;
  const matches = primary
    ? matchJobs(primary, repo.getJobs()).slice(0, 3)
    : [];
  const applications = repo.getApplications(user.id);
  const letters = repo.getCoverLetters(user.id);
  const profileStrength = profileCompleteness(repo.getUserProfile(user.id));
  void USER_TYPES;

  const stats = [
    { label: "Profile strength", value: `${profileStrength}%`, href: "/profile" },
    { label: "Resumes", value: resumes.length, href: "/resumes" },
    { label: "Job matches", value: matches.length, href: "/jobs" },
    { label: "Cover letters", value: letters.length, href: "/cover-letters" },
    { label: "Applications", value: applications.length, href: "/applications" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500">
            {LABELS[user.userType]}
            {user.headline ? ` · ${user.headline}` : ""}
          </p>
        </div>
        <Link href="/resumes" className="btn-primary">
          + New resume
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 hover:shadow-md">
            <div className="text-3xl font-bold text-brand-700">{s.value}</div>
            <div className="mt-1 text-sm text-slate-500">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-900">Your next steps</h2>
          <ul className="mt-3 space-y-2">
            {NEXT_STEPS[user.userType].map((step) => (
              <li key={step} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 text-brand-600">→</span>
                {step}
              </li>
            ))}
          </ul>
          {ats && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
              ATS score for &ldquo;{primary.title}&rdquo;:{" "}
              <span className="font-semibold text-slate-900">{ats.score}/100</span>{" "}
              {ats.passed ? (
                <span className="badge bg-green-100 text-green-700">Pass</span>
              ) : (
                <span className="badge bg-amber-100 text-amber-700">Needs work</span>
              )}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-900">Top job matches</h2>
          {matches.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Build a resume to see matches.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {matches.map((m) => (
                <li key={m.job.id} className="text-sm">
                  <Link
                    href={`/jobs?job=${m.job.id}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {m.job.title}
                  </Link>
                  <div className="text-slate-500">
                    {m.job.company} · {m.score}% match
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
