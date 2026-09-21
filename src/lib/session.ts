import { cookies } from "next/headers";
import { getDb } from "./db";
import type { User } from "./types";

const COOKIE = "rb_uid";

export function getUserId(): string {
  const c = cookies().get(COOKIE);
  return c?.value ?? "user_demo";
}

export function getCurrentUser(): User {
  const db = getDb();
  const uid = getUserId();
  return db.users.find((u) => u.id === uid) ?? db.users[0];
}

export function setUserId(uid: string) {
  cookies().set(COOKIE, uid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
