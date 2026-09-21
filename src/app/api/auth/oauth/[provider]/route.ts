import { NextRequest, NextResponse } from "next/server";
import {
  getOAuthProvider,
  buildAuthorizeUrl,
  generateOAuthState,
} from "@/lib/auth/oauth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { provider: string } },
) {
  const provider = getOAuthProvider(params.provider);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const state = generateOAuthState();
  const authorizeUrl = buildAuthorizeUrl(provider, state);

  const response = NextResponse.redirect(authorizeUrl);
  response.headers.set(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
  );
  return response;
}
