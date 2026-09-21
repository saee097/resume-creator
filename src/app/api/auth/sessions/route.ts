import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireAuth } from "@/app/api/auth/_utils";
import { listUserSessions, revokeSession, destroyAllUserSessions } from "@/lib/auth/session";
import { verifyToken } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await requireAuth();
    const sessions = await listUserSessions(user.id);
    const currentToken = cookies().get("rb_session")?.value;
    const currentPayload = currentToken ? await verifyToken(currentToken) : null;
    const enriched = sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      device: s.device,
      expires: s.expires,
      createdAt: s.createdAt,
      isCurrent: currentPayload?.sid === s.id,
    }));
    return NextResponse.json({ sessions: enriched }, { status: 200 });
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (sessionId) {
      await revokeSession(user.id, sessionId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    await destroyAllUserSessions(user.id);
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.headers.set("Set-Cookie", "rb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
    return response;
  } catch (e) {
    if (e instanceof Response) return e;
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
