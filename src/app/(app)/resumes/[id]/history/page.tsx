import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import { restoreVersionAction } from "@/lib/actions";

function fmt(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function ResumeHistoryPage({
  params,
}: {
  params: { id: string };
}) {
  const user = getCurrentUser();
  const resume = repo.getResume(params.id);
  if (!resume || resume.userId !== user.id) notFound();

  const versions = repo.getResumeVersions(resume.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {resume.title} · Version History
        </h1>
        <Link href={`/resumes/${resume.id}`} className="btn-secondary">
          ← Back to editor
        </Link>
      </div>

      {versions.length === 0 ? (
        <div className="card grid place-items-center p-12 text-center text-slate-500">
          No saved versions yet. Use “Save version” in the editor to snapshot
          this resume.
        </div>
      ) : (
        <div className="space-y-2">
          {versions.map((v) => (
            <div
              key={v.id}
              className="card flex items-center justify-between p-4"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {v.label || "Snapshot"}
                </p>
                <p className="text-xs text-slate-500">{fmt(v.savedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/resumes/${resume.id}/preview?v=${v.id}`}
                  className="btn-secondary text-xs"
                >
                  View
                </Link>
                <form action={restoreVersionAction}>
                  <input type="hidden" name="versionId" value={v.id} />
                  <button className="btn-primary text-xs" type="submit">
                    Restore
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
