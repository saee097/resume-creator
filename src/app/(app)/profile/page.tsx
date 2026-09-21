import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import ProfileEditor from "@/components/ProfileEditor";

export default function ProfilePage() {
  const user = getCurrentUser();
  const profile = repo.getUserProfile(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">
          Your master profile powers resumes, job matches, and tailoring.
        </p>
      </div>
      <ProfileEditor profile={profile} />
    </div>
  );
}
