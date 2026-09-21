import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionRecord, signToken } from "@/lib/auth/session";
import { verifyTotp } from "@/lib/auth/2fa";
import { resolveDevice, deviceCookieValue } from "@/lib/auth/devices";
import { LoginSchema } from "../schemas";

type BackupCode = { code: string; used: boolean };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parse = LoginSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { email, password, twoFactorCode } = parse.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const twoFactor = await prisma.twoFactorAuthentication.findUnique({
      where: { userId: user.id },
    });

    if (twoFactor?.enabled) {
      const ok = await verifyTwoFactor(user.id, twoFactor, twoFactorCode);
      if (!ok) {
        return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
      }
    }

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
      { status: 200 },
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

async function verifyTwoFactor(
  userId: string,
  twoFactor: { secret: string; backupCodes: unknown },
  code: string | undefined,
): Promise<boolean> {
  if (code && await verifyTotp(code, twoFactor.secret)) return true;

  if (code && typeof twoFactor.backupCodes === "string") {
    let codes: BackupCode[] = [];
    try {
      codes = JSON.parse(twoFactor.backupCodes) as BackupCode[];
    } catch {
      codes = [];
    }
    const match = codes.find((bc) => bc.code === code && !bc.used);
    if (match) {
      match.used = true;
      await prisma.twoFactorAuthentication.update({
        where: { userId },
        data: { backupCodes: JSON.stringify(codes) },
      }).catch(() => {});
      return true;
    }
  }
  return false;
}
