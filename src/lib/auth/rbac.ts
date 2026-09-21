import prisma from "@/lib/prisma";

export async function getUserPermissions(userId: string) {
  const userWithRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions = new Set<string>();
  for (const ur of userWithRoles) {
    for (const rp of ur.role.permissions) {
      permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
    }
  }
  return Array.from(permissions);
}

export async function hasPermission(userId: string, permission: string) {
  const perms = await getUserPermissions(userId);
  return perms.includes(permission);
}

export async function assignRole(userId: string, roleId: string) {
  return prisma.userRole.upsert({
    where: {
      userId_roleId: { userId, roleId },
    },
    update: { createdAt: new Date() },
    create: { userId, roleId },
  });
}

export async function removeRole(userId: string, roleId: string) {
  return prisma.userRole.deleteMany({
    where: { userId, roleId },
  });
}

export async function getUserRoleNames(userId: string) {
  const userWithRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });
  return userWithRoles.map((ur) => ur.role.name);
}