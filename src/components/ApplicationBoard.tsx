"use client";

import { deleteApplicationAction, updateApplicationStatusAction } from "@/lib/actions";
import { APPLICATION_STATUSES, type JobApplication } from "@/lib/types";

const STATUS_STYLE: Record<string, string> = {
  wishlist: "bg-slate-100 text-slate-600",
  applied: "bg-blue-100 text-blue-700",
  interview: "bg-amber-100 text-amber-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function ApplicationBoard({
  applications,
}: {
  applications: JobApplication[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {APPLICATION_STATUSES.map((status) => {
        const items = applications.filter((a) => a.status === status);
        return (
          <div key={status} className="rounded-xl bg-slate-100 p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold capitalize text-slate-700">
                {status}
              </span>
              <span className="text-xs text-slate-400">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((a) => (
                <div key={a.id} className="card p-3">
                  <div className="font-medium text-slate-900">{a.jobTitle}</div>
                  <div className="text-xs text-slate-500">{a.company}</div>
                  <select
                    className="input mt-2 text-xs"
                    value={a.status}
                    onChange={(e) =>
                      updateApplicationStatusAction(
                        a.id,
                        e.target.value as JobApplication["status"],
                      )
                    }
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <form action={deleteApplicationAction} className="mt-2">
                    <input type="hidden" name="appId" value={a.id} />
                    <button className="text-xs text-red-500 hover:underline">
                      Remove
                    </button>
                  </form>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-xs text-slate-400">Nothing here yet.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
