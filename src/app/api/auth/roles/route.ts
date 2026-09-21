import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/app/api/auth/_utils";
import { z } from "zod";

const CreateRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissionIds: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    await requirePermission("roles:read");
    const roles = await prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
    return NextResponse.json({ roles }, { status: 200 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("roles:manage");
    const body = await request.json();
    const parse = CreateRoleSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { name, description, permissionIds } = parse.data;
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissionIds?.length
          ? {
              create: permissionIds.map((permissionId) => ({
                permission: { connect: { id: permissionId } },
              })),
            }
          : undefined,
      },
      include: { permissions: { include: { permission: true } } },
    });
    return NextResponse.json({ role }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
