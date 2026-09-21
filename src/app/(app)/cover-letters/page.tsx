import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import CoverLetterGenerator from "@/components/CoverLetterGenerator";

export default function CoverLettersPage({
  searchParams,
}: {
  searchParams: { job?: string; resume?: string };
}) {
  const user = getCurrentUser();
  const resumes = repo.getUserResumes(user.id);

  if (resumes.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Cover Letters</h1>
        <div className="card p-8 text-center text-slate-500">
          <p>You need a resume to generate a cover letter.</p>
          <Link href="/resumes" className="btn-primary mt-4">
            Create resume
          </Link>
        </div>
      </div>
    );
  }

  const letters = repo.getCoverLetters(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cover Letters</h1>
        <p className="text-sm text-slate-500">
          AI-generated, tailored to each role and tone.
        </p>
      </div>
      <CoverLetterGenerator
        resumes={resumes}
        jobs={repo.getJobs()}
        letters={letters}
        presetJob={searchParams.job}
        presetResume={searchParams.resume}
      />
    </div>
  );
}
