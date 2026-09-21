import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/app/api/auth/_utils";
import { z } from "zod";

const CreatePermissionSchema = z.object({
  name: z.string().min(1),
  resource: z.string().min(1),
  action: z.string().min(1),
  description: z.string().optional(),
});

export async function GET() {
  try {
    await requirePermission("permissions:read");
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
    return NextResponse.json({ permissions }, { status: 200 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("permissions:manage");
    const body = await request.json();
    const parse = CreatePermissionSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { name, resource, action, description } = parse.data;
    const permission = await prisma.permission.create({
      data: { name, resource, action, description },
    });
    return NextResponse.json({ permission }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
