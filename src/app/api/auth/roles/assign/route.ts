import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/app/api/auth/_utils";
import { z } from "zod";
import { assignRole, removeRole } from "@/lib/auth/rbac";

const AssignSchema = z.object({
  userId: z.string().min(1),
  roleId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    await requirePermission("roles:manage");
    const body = await request.json();
    const parse = AssignSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { userId, roleId } = parse.data;
    const userRole = await assignRole(userId, roleId);
    return NextResponse.json({ userRole }, { status: 200 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requirePermission("roles:manage");
    const body = await request.json();
    const parse = AssignSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { userId, roleId } = parse.data;
    await removeRole(userId, roleId);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
