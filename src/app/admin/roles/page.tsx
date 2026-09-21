import { getUserRoleNames, assignRole, removeRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";

export default async function RolesPage() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
  });

  const usersWithRoles = await Promise.all(
    users.map(async (u) => ({
      ...u,
      roles: await getUserRoleNames(u.id),
    }))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Roles</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage role assignments across users.
        </p>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">User</th>
              <th className="px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="px-4 py-3 font-medium text-slate-600">Roles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersWithRoles.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <span key={r} className="badge bg-brand-100 text-brand-700">
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card space-y-3 p-5">
        <h2 className="font-semibold text-slate-900">Assign role</h2>
        <form action={async (formData) => {
          "use server";
          const userId = String(formData.get("userId") ?? "");
          const roleId = String(formData.get("roleId") ?? "");
          if (userId && roleId) {
            await assignRole(userId, roleId);
          }
        }}>
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="userId" className="input" required>
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
            <select name="roleId" className="input" required>
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary">
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
