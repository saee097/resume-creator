import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import CoachingBoard from "@/components/CoachingBoard";

export default function CoachingPage() {
  const user = getCurrentUser();
  const plans = repo.getCoachingPlans(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Career Coaching</h1>
        <p className="text-sm text-slate-500">
          AI-generated, step-by-step plans toward your goals.
        </p>
      </div>
      <CoachingBoard plans={plans} />
    </div>
  );
}
