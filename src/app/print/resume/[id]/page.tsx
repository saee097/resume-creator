import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import ResumePreview from "@/components/resume/ResumePreview";
import PrintTrigger from "@/components/PrintTrigger";

export default function ResumePrintPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { v?: string; auto?: string };
}) {
  const user = getCurrentUser();
  const resume = repo.getResume(params.id);
  if (!resume || resume.userId !== user.id) notFound();

  const version = searchParams.v
    ? repo.getResumeVersion(searchParams.v)
    : undefined;
  const showing =
    version && version.resumeId === resume.id ? version.snapshot : resume;

  return (
    <div className="min-h-screen bg-slate-100">
      <PrintTrigger auto={searchParams.auto === "1"} backHref={`/resumes/${resume.id}`} />
      <div className="print-page mx-auto max-w-[680px] px-4 pb-10">
        <ResumePreview resume={showing} />
      </div>
    </div>
  );
}
