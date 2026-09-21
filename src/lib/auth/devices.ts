import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const DEVICE_COOKIE = "rb_device";

type DeviceInput = {
  userAgent?: string | null;
  ipAddress?: string | null;
};

export function parseUserAgent(ua?: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Mac OS X/.test(ua)
      ? "macOS"
      : /Android/.test(ua)
        ? "Android"
        : /iPhone|iPad/.test(ua)
          ? "iOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  return `${browser} on ${os}`;
}

/**
 * Resolve (or create) the device associated with the current request and
 * return the device id. A stable device cookie lets us recognise returning
 * devices across sessions.
 */
export async function resolveDevice(
  userId: string,
  input: DeviceInput = {},
): Promise<{ id: string; isNew: boolean }> {
  const existingId = cookies().get(DEVICE_COOKIE)?.value;
  if (existingId) {
    const found = await prisma.device.findFirst({
      where: { id: existingId, userId },
    });
    if (found) {
      await prisma.device
        .update({
          where: { id: found.id },
          data: {
            lastUsedAt: new Date(),
            userAgent: input.userAgent ?? found.userAgent,
            ipAddress: input.ipAddress ?? found.ipAddress,
          },
        })
        .catch(() => {});
      return { id: found.id, isNew: false };
    }
  }

  const device = await prisma.device.create({
    data: {
      userId,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      name: parseUserAgent(input.userAgent),
    },
  });
  return { id: device.id, isNew: true };
}

export function deviceCookieValue(deviceId: string): string {
  return `${DEVICE_COOKIE}=${deviceId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`;
}

export async function listDevices(userId: string) {
  return prisma.device.findMany({
    where: { userId },
    orderBy: { lastUsedAt: "desc" },
    include: {
      _count: { select: { sessions: true } },
    },
  });
}

export async function trustDevice(userId: string, deviceId: string) {
  return prisma.device.updateMany({
    where: { id: deviceId, userId },
    data: { isTrusted: true, trustedAt: new Date() },
  });
}

export async function revokeDevice(userId: string, deviceId: string) {
  await prisma.session.deleteMany({ where: { userId, deviceId } });
  return prisma.device.deleteMany({ where: { id: deviceId, userId } });
}
