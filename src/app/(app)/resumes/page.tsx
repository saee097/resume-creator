import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import { analyzeATS } from "@/lib/ats";
import {
  createResumeAction,
  deleteResumeAction,
  duplicateResumeAction,
  toggleArchiveResumeAction,
} from "@/lib/actions";

export default function ResumesPage({
  searchParams,
}: {
  searchParams: { archived?: string };
}) {
  const user = getCurrentUser();
  const showArchived = searchParams.archived === "1";
  const all = repo.getUserResumes(user.id);
  const resumes = showArchived ? all : all.filter((r) => !r.archived);
  const archivedCount = all.filter((r) => r.archived).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resumes</h1>
          <p className="text-sm text-slate-500">
            Build ATS-friendly resumes and track their scores.
          </p>
        </div>
        <form action={createResumeAction}>
          <button className="btn-primary" type="submit">
            + New resume
          </button>
        </form>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/resumes"
          className={showArchived ? "text-slate-500 hover:underline" : "font-semibold text-slate-900"}
        >
          Active
        </Link>
        <span className="text-slate-300">·</span>
        <Link
          href="/resumes?archived=1"
          className={showArchived ? "font-semibold text-slate-900" : "text-slate-500 hover:underline"}
        >
          Archived ({archivedCount})
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="card grid place-items-center p-12 text-center text-slate-500">
          {showArchived
            ? "No archived resumes."
            : "No resumes yet. Create your first one to get started."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((r) => {
            const ats = analyzeATS(r);
            return (
              <div key={r.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{r.title}</h3>
                  <div className="flex shrink-0 items-center gap-1">
                    {r.archived && (
                      <span className="badge bg-slate-100 text-slate-600">
                        Archived
                      </span>
                    )}
                    <span
                      className={`badge ${
                        ats.passed
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {ats.score}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {r.contact.fullName || "Untitled"} · {r.template}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <Link href={`/resumes/${r.id}`} className="btn-primary flex-1 text-center">
                    Edit
                  </Link>
                  <Link href={`/resumes/${r.id}/preview`} className="btn-secondary">
                    Preview
                  </Link>
                  <Link href={`/resumes/${r.id}/history`} className="btn-secondary">
                    History
                  </Link>
                  <a
                    href={`/print/resume/${r.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary"
                  >
                    PDF
                  </a>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <form action={duplicateResumeAction}>
                    <input type="hidden" name="resumeId" value={r.id} />
                    <button className="btn-secondary" type="submit">
                      Duplicate
                    </button>
                  </form>
                  <form action={toggleArchiveResumeAction}>
                    <input type="hidden" name="resumeId" value={r.id} />
                    <button className="btn-secondary" type="submit">
                      {r.archived ? "Unarchive" : "Archive"}
                    </button>
                  </form>
                  <form action={deleteResumeAction}>
                    <input type="hidden" name="resumeId" value={r.id} />
                    <button className="btn-secondary text-red-600" type="submit">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
