import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getUserRoleNames, hasPermission } from "@/lib/auth/rbac";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  userType: string;
};

function cookieName() {
  return "rb_session";
}

function buildUser(session: { user: { id: string; email: string; name: string; userType: string } }): AuthUser {
  const u = session.user;
  return { id: u.id, email: u.email, name: u.name, userType: u.userType };
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function err(message: string, status = 400) {
  return json({ error: message }, status);
}

export async function getUserFromCookie(
  name = cookieName(),
): Promise<AuthUser | null> {
  const token = cookies().get(name)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expires < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return buildUser(session);
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getUserFromCookie();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
  return user;
}

export async function requireRole(roles: string | string[]): Promise<AuthUser> {
  const user = await requireAuth();
  const allowed = Array.isArray(roles) ? roles : [roles];
  const userRoles = await getUserRoleNames(user.id);
  const has = allowed.some((r) => userRoles.includes(r));
  if (!has) {
    throw new Response(JSON.stringify({ error: "Insufficient role" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return user;
}

export async function optionalAuth() {
  return getUserFromCookie();
}

export async function requirePermission(permission: string): Promise<AuthUser> {
  const user = await requireAuth();
  const allowed = await hasPermission(user.id, permission);
  if (!allowed) {
    throw new Response(JSON.stringify({ error: "Insufficient permission" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return user;
}