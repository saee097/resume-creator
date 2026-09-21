import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERMISSIONS = [
  { resource: "roles", action: "read", description: "View roles" },
  { resource: "roles", action: "manage", description: "Create/modify roles" },
  { resource: "permissions", action: "read", description: "View permissions" },
  { resource: "permissions", action: "manage", description: "Create/modify permissions" },
  { resource: "users", action: "read", description: "View users" },
  { resource: "users", action: "manage", description: "Manage users" },
  { resource: "resumes", action: "read", description: "Read own resumes" },
  { resource: "resumes", action: "write", description: "Write own resumes" },
  { resource: "billing", action: "manage", description: "Manage billing" },
];

async function main() {
  const permissions = [];
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { name: `${p.resource}:${p.action}` },
      update: { description: p.description },
      create: { ...p, name: `${p.resource}:${p.action}` },
    });
    permissions.push(perm);
  }

  const adminPermIds = permissions.map((p) => ({ permissionId: p.id }));

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: { name: "admin", description: "Full access" },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  await prisma.rolePermission.createMany({
    data: adminPermIds.map((p) => ({ roleId: adminRole.id, ...p })),
  });

  const userRole = await prisma.role.upsert({
    where: { name: "user" },
    update: {},
    create: { name: "user", description: "Standard user" },
  });
  const userPermIds = permissions
    .filter((p) => ["resumes:read", "resumes:write", "users:read"].includes(p.name))
    .map((p) => ({ permissionId: p.id }));
  await prisma.rolePermission.deleteMany({ where: { roleId: userRole.id } });
  await prisma.rolePermission.createMany({
    data: userPermIds.map((p) => ({ roleId: userRole.id, ...p })),
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (admin) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
        update: {},
        create: { userId: admin.id, roleId: adminRole.id },
      });
      console.log(`Assigned admin role to ${adminEmail}`);
    } else {
      console.warn(`ADMIN_EMAIL ${adminEmail} not found; skipping admin assignment`);
    }
  }

  console.log("Seed complete: roles(admin, user) and permissions created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
