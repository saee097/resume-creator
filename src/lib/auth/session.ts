import { SignJWT, jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import type { Session as PrismaSession, User as PrismaUser } from "@prisma/client";

const AUTH_SECRET = process.env.AUTH_SECRET || "fallback-secret-key-change-in-production";
const secret = new TextEncoder().encode(AUTH_SECRET);

export type JwtPayload = {
  sub: string;
  sid: string;
};

export async function signToken(userId: string, sessionId: string) {
  const token = await new SignJWT({ sub: userId, sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
  return token;
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify<JwtPayload>(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export type AuthSession = PrismaSession & { user: PrismaUser };

export async function createSessionRecord(
  userId: string,
  opts: { ipAddress?: string; userAgent?: string; deviceId?: string } = {},
) {
  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken: crypto.randomUUID(),
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
      deviceId: opts.deviceId,
    },
    include: { user: true },
  });
  return session;
}

export async function getValidSession(sessionId: string) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true, device: true },
  });
}

export async function listUserSessions(userId: string) {
  return prisma.session.findMany({
    where: { userId, expires: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: { device: true },
  });
}

export async function revokeSession(userId: string, sessionId: string) {
  return prisma.session.deleteMany({ where: { id: sessionId, userId } });
}

export async function destroySession(sessionId: string) {
  await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
}

export async function destroyAllUserSessions(userId: string) {
  await prisma.session.deleteMany({ where: { userId } }).catch(() => {});
}