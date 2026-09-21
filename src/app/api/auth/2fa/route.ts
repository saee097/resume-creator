import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/session";
import {
  generateSecret,
  generateTotpUri,
  verifyTotp,
  generateBackupCodes,
} from "@/lib/auth/2fa";
import { TwoFactorEnableSchema, TwoFactorDisableSchema } from "../schemas";

export async function GET() {
  try {
    const token = (await cookies()).get("rb_session")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const twoFactor = await prisma.twoFactorAuthentication.findUnique({
      where: { userId: user.id },
    });

    const stored = twoFactor?.backupCodes;
    const hasBackupCodes =
      typeof stored === "string" && stored.trim().length > 0;

    return NextResponse.json({
      enabled: !!twoFactor?.enabled,
      hasBackupCodes,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("rb_session")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await request.json();
    const parse = TwoFactorEnableSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { code } = parse.data;

    const pending = await prisma.twoFactorAuthentication.findUnique({
      where: { userId: payload.sub },
    });
    if (!pending || !pending.secret) {
      return NextResponse.json({ error: "Begin 2FA setup first" }, { status: 400 });
    }

    const isValid = await verifyTotp(code, pending.secret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid 2FA code" }, { status: 400 });
    }

    const backupCodes = generateBackupCodes();

    await prisma.twoFactorAuthentication.update({
      where: { userId: payload.sub },
      data: { enabled: true, backupCodes: JSON.stringify(backupCodes), verifiedAt: new Date() },
    });

    return NextResponse.json({ ok: true, backupCodes }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const token = (await cookies()).get("rb_session")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await request.json();
    const parse = TwoFactorDisableSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json(
        { error: parse.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { code } = parse.data;
    const twoFactor = await prisma.twoFactorAuthentication.findUnique({
      where: { userId: payload.sub },
    });

    if (!twoFactor || !twoFactor.enabled) {
      return NextResponse.json({ error: "2FA not enabled" }, { status: 400 });
    }

    const isValid = await verifyTotp(code, twoFactor.secret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid 2FA code" }, { status: 400 });
    }

    await prisma.twoFactorAuthentication.delete({
      where: { userId: payload.sub },
    });

    return NextResponse.json({ ok: true, message: "2FA disabled" }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
