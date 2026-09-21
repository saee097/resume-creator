import { hash, compare } from "bcrypt-ts";

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hash_: string) {
  return compare(password, hash_);
}