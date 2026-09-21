import prisma from "@/lib/prisma";
import crypto from "crypto";
import { assignRole } from "./rbac";

export async function linkOAuthAccount(
  userId: string,
  provider: string,
  providerAccountId: string,
  data: {
    accessToken?: string;
    expiresAt?: number;
    tokenType?: string;
    refreshToken?: string;
    scope?: string;
    idToken?: string;
    sessionState?: string;
  },
) {
  return prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    update: {
      ...data,
      updatedAt: new Date(),
    },
    create: {
      userId,
      provider,
      providerAccountId,
      type: "oauth",
      ...data,
    },
  });
}

export async function getOAuthAccount(provider: string, providerAccountId: string) {
  return prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
    include: { user: true },
  });
}

/* ------------------------------------------------------------------ */
/* Provider configuration                                             */
/* ------------------------------------------------------------------ */

export interface OAuthProviderConfig {
  name: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  headers?: Record<string, string>;
  mapProfile: (profile: any) => {
    providerAccountId: string;
    email: string;
    name: string;
  };
}

const PROVIDERS: Record<string, OAuthProviderConfig> = {
  google: {
    name: "google",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "",
    mapProfile: (p) => ({
      providerAccountId: String(p.sub),
      email: p.email,
      name: p.name ?? p.email,
    }),
  },
  github: {
    name: "github",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scope: "read:user user:email",
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    redirectUri: process.env.GITHUB_REDIRECT_URI ?? "",
    headers: { Accept: "application/json" },
    mapProfile: (p) => ({
      providerAccountId: String(p.id),
      email: p.email,
      name: p.name ?? p.login,
    }),
  },
};

export function getOAuthProvider(name: string): OAuthProviderConfig | null {
  return PROVIDERS[name.toLowerCase()] ?? null;
}

export function buildAuthorizeUrl(provider: OAuthProviderConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    response_type: "code",
    scope: provider.scope,
    state,
  });
  return `${provider.authorizeUrl}?${params.toString()}`;
}

export function generateOAuthState(): string {
  return crypto.randomBytes(24).toString("hex");
}

interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
}

export async function exchangeOAuthCode(
  provider: OAuthProviderConfig,
  code: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    code,
    redirect_uri: provider.redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...provider.headers },
    body,
  });
  if (!res.ok) {
    throw new Error(`OAuth token exchange failed: ${res.status}`);
  }
  return res.json();
}

export async function fetchOAuthProfile(
  provider: OAuthProviderConfig,
  token: TokenResponse,
): Promise<{ providerAccountId: string; email: string; name: string }> {
  const res = await fetch(provider.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      ...provider.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`OAuth profile fetch failed: ${res.status}`);
  }
  let profile = await res.json();

  // GitHub may not return a public email; fall back to the primary email.
  if (provider.name === "github" && !profile.email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: "application/json",
      },
    });
    if (emailsRes.ok) {
      const emails = await emailsRes.json();
      const primary = emails.find((e: any) => e.primary && e.verified) ?? emails[0];
      if (primary) profile = { ...profile, email: primary.email };
    }
  }

  return provider.mapProfile(profile);
}

export async function findOrCreateOAuthUser(
  provider: OAuthProviderConfig,
  profile: { providerAccountId: string; email: string; name: string },
  token?: TokenResponse,
) {
  const existing = await getOAuthAccount(provider.name, profile.providerAccountId);
  if (existing) return existing.user;

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    update: {},
    create: {
      email: profile.email,
      name: profile.name,
      emailVerifiedAt: new Date(),
    },
  });

  await linkOAuthAccount(user.id, provider.name, profile.providerAccountId, {
    accessToken: token?.access_token,
    tokenType: token?.token_type,
    expiresAt: token?.expires_in
      ? Math.floor(Date.now() / 1000) + token.expires_in
      : undefined,
    refreshToken: token?.refresh_token,
    idToken: token?.id_token,
    scope: token?.scope,
  });
  await assignRole(user.id, "user").catch(() => {});
  return user;
}
