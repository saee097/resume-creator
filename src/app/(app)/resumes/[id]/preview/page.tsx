import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import ResumePreview from "@/components/resume/ResumePreview";

export default function ResumePreviewPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { v?: string };
}) {
  const user = getCurrentUser();
  const resume = repo.getResume(params.id);
  if (!resume || resume.userId !== user.id) notFound();

  const version = searchParams.v
    ? repo.getResumeVersion(searchParams.v)
    : undefined;
  const showing = version && version.resumeId === resume.id ? version.snapshot : resume;
  const viewingHistory = Boolean(version);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          {resume.title} · Preview
          {viewingHistory && (
            <span className="ml-2 text-sm font-normal text-amber-600">
              (read-only snapshot)
            </span>
          )}
        </h1>
        <Link href={`/resumes/${resume.id}`} className="btn-secondary">
          ← Back to editor
        </Link>
      </div>
      <ResumePreview resume={showing} />
      <div className="flex justify-center">
        <a
          href={`/print/resume/${resume.id}${version ? `?v=${version.id}` : ""}`}
          target="_blank"
          rel="noreferrer"
          className="btn-primary"
        >
          Download PDF
        </a>
      </div>
    </div>
  );
}
