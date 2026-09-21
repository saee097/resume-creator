import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import InterviewPrep from "@/components/InterviewPrep";

export default function InterviewPage() {
  const user = getCurrentUser();
  void user;
  const questions = repo.getQuestions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Interview Prep</h1>
        <p className="text-sm text-slate-500">
          Practice role-specific questions with model answers.
        </p>
      </div>
      <InterviewPrep questions={questions} />
    </div>
  );
}
