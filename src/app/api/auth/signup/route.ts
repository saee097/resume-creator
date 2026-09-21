import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSessionRecord, signToken } from "@/lib/auth/session";
import { resolveDevice, deviceCookieValue } from "@/lib/auth/devices";
import { assignRole } from "@/lib/auth/rbac";
import { SignupSchema } from "../schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parse = SignupSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { name, email, password } = parse.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    await assignRole(user.id, "user").catch(() => {});

    const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = headers().get("user-agent");
    const device = await resolveDevice(user.id, { userAgent: ua, ipAddress: ip });
    const session = await createSessionRecord(user.id, {
      ipAddress: ip ?? undefined,
      userAgent: ua ?? undefined,
      deviceId: device.id,
    });
    const token = await signToken(user.id, session.id);

    const response = NextResponse.json(
      { id: user.id, email: user.email, name: user.name, userType: user.userType },
      { status: 201 },
    );

    const maxAge = 60 * 60 * 24 * 7;
    response.headers.set(
      "Set-Cookie",
      `rb_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`,
    );
    response.headers.append("Set-Cookie", deviceCookieValue(device.id));
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}