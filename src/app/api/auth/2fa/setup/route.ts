import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth/session";
import { generateSecret, generateTotpUri } from "@/lib/auth/2fa";

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

    const secret = generateSecret();
    const uri = generateTotpUri(secret, user.email);

    await prisma.twoFactorAuthentication.upsert({
      where: { userId: user.id },
      update: { secret, enabled: false },
      create: { userId: user.id, secret, enabled: false },
    });

    return NextResponse.json({ secret, uri }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
