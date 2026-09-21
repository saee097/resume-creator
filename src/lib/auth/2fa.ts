import { generateSecret as genSecret, generateURI, verify as verifyOtp } from "otplib";
import { randomBytes } from "crypto";

export function generateSecret() {
  return genSecret();
}

export function generateTotpUri(secret: string, email: string) {
  return generateURI({
    issuer: "ResumeForge",
    label: email,
    secret,
  });
}

export async function verifyTotp(token: string, secret: string) {
  const result = await verifyOtp({ token, secret });
  return result.valid;
}

export function generateBackupCodes() {
  return Array.from({ length: 8 }, () => randomBytes(4).toString("hex").slice(0, 8));
}