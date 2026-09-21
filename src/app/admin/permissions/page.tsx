import { prisma } from "@/lib/prisma";

export default async function PermissionsPage() {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });

  const grouped = permissions.reduce<Record<string, typeof permissions>>((acc, p) => {
    acc[p.resource] = acc[p.resource] ?? [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fine-grained actions available across the platform.
        </p>
      </div>
      <div className="grid gap-4">
        {Object.entries(grouped).map(([resource, perms]) => (
          <div key={resource} className="card p-5">
            <h2 className="font-semibold text-slate-900 capitalize">{resource}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {perms.map((p) => (
                <span key={p.id} className="badge bg-slate-100 text-slate-700">
                  {p.action}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
