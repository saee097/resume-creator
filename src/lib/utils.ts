import { randomUUID } from "crypto";

export function id(prefix = ""): string {
  const uuid = randomUUID().slice(0, 8);
  return prefix ? `${prefix}_${uuid}` : uuid;
}

export function now(): string {
  return new Date().toISOString();
}
