import { getCurrentUser } from "@/lib/session";
import * as repo from "@/lib/repo";
import { createApplicationAction } from "@/lib/actions";
import ApplicationBoard from "@/components/ApplicationBoard";

export default function ApplicationsPage() {
  const user = getCurrentUser();
  const applications = repo.getApplications(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Application Tracking
        </h1>
        <p className="text-sm text-slate-500">
          Manage your pipeline from wishlist to offer.
        </p>
      </div>

      <form
        action={createApplicationAction}
        className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input className="input" name="jobTitle" placeholder="Job title" required />
        <input className="input" name="company" placeholder="Company" required />
        <select className="input" name="status" defaultValue="wishlist">
          <option value="wishlist">Wishlist</option>
          <option value="applied">Applied</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
        <input className="input" name="link" placeholder="Link (optional)" />
        <button className="btn-primary" type="submit">
          + Add
        </button>
      </form>

      <ApplicationBoard applications={applications} />
    </div>
  );
}
