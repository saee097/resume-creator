import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import {
  getOAuthProvider,
  exchangeOAuthCode,
  fetchOAuthProfile,
  findOrCreateOAuthUser,
} from "@/lib/auth/oauth";
import { createSessionRecord, signToken } from "@/lib/auth/session";
import { resolveDevice, deviceCookieValue } from "@/lib/auth/devices";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const provider = getOAuthProvider(params.provider);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = cookies().get("oauth_state")?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(`${APP_URL}/login?error=oauth_state`);
  }

  try {
    const token = await exchangeOAuthCode(provider, code);
    const profile = await fetchOAuthProfile(provider, token);
    const user = await findOrCreateOAuthUser(provider, profile, token);

    const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const ua = headers().get("user-agent") ?? undefined;
    const device = await resolveDevice(user.id, { userAgent: ua, ipAddress: ip });
    const session = await createSessionRecord(user.id, {
      ipAddress: ip ?? undefined,
      userAgent: ua,
      deviceId: device.id,
    });
    const jwt = await signToken(user.id, session.id);

    const response = NextResponse.redirect(`${APP_URL}/dashboard`);
    const maxAge = 60 * 60 * 24 * 7;
    response.headers.set(
      "Set-Cookie",
      `rb_session=${jwt}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`,
    );
    response.headers.append(
      "Set-Cookie",
      "oauth_state=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
    );
    response.headers.append("Set-Cookie", deviceCookieValue(device.id));
    return response;
  } catch {
    return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`);
  }
}
