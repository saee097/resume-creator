import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import ResumeBuilder from "@/components/resume/ResumeBuilder";

export default function ResumeEditPage({
  params,
}: {
  params: { id: string };
}) {
  const user = getCurrentUser();
  const resume = repo.getResume(params.id);
  if (!resume || resume.userId !== user.id) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Resume Builder</h1>
      <ResumeBuilder initial={resume} />
    </div>
  );
}
