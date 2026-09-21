import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import { matchJobs } from "@/lib/matching";

export default function JobsPage({
  searchParams,
}: {
  searchParams: { job?: string };
}) {
  const user = getCurrentUser();
  const resumes = repo.getUserResumes(user.id);
  const primary = resumes[0];

  if (!primary) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Job Match</h1>
        <div className="card p-8 text-center text-slate-500">
          <p>Create a resume first to see AI job matches.</p>
          <Link href="/resumes" className="btn-primary mt-4">
            Create resume
          </Link>
        </div>
      </div>
    );
  }

  const matches = matchJobs(primary, repo.getJobs());
  const selected = matches.find((m) => m.job.id === searchParams.job) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Job Matching</h1>
        <p className="text-sm text-slate-500">
          Matches are scored against &ldquo;{primary.title}&rdquo; using your
          skills and experience.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {matches.map((m) => (
            <Link
              key={m.job.id}
              href={`/jobs?job=${m.job.id}`}
              className={`card flex items-center justify-between p-4 hover:shadow-md ${
                selected?.job.id === m.job.id ? "ring-2 ring-brand-300" : ""
              }`}
            >
              <div>
                <div className="font-semibold text-slate-900">
                  {m.job.title}
                </div>
                <div className="text-sm text-slate-500">
                  {m.job.company} · {m.job.location} · {m.job.level}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {m.rationale}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-brand-700">
                  {m.score}%
                </div>
                <div className="text-xs text-slate-400">match</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {selected ? (
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900">
                {selected.job.title}
              </h2>
              <p className="text-sm text-slate-500">
                {selected.job.company} · {selected.job.salaryRange}
              </p>
              <p className="mt-3 text-sm text-slate-700">
                {selected.job.description}
              </p>
              <div className="mt-3">
                <h3 className="text-xs font-bold uppercase text-green-700">
                  Matched skills
                </h3>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {selected.matchedSkills.map((s) => (
                    <span key={s} className="badge bg-green-100 text-green-700">
                      {s}
                    </span>
                  ))}
                  {selected.matchedSkills.length === 0 && (
                    <span className="text-xs text-slate-400">None yet</span>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-xs font-bold uppercase text-red-700">
                  Skills to build
                </h3>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {selected.missingSkills.map((s) => (
                    <span key={s} className="badge bg-red-100 text-red-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={`/cover-letters?job=${selected.job.id}&resume=${primary.id}`}
                className="btn-primary mt-4 w-full"
              >
                Generate cover letter
              </Link>
            </div>
          ) : (
            <div className="card p-5 text-sm text-slate-500">
              Select a job to see skill gaps and generate a cover letter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
