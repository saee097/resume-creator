import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const token = (await cookies()).get("rb_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const payload = await verifyToken(token);
    if (payload) {
      const session = await prisma.session.findUnique({ where: { id: payload.sid } });
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
    }
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.headers.set("Set-Cookie", "rb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}